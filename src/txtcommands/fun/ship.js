import {
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import {
  createCanvas,
  loadImage
} from "@napi-rs/canvas";
import registerGlobalFonts from '../../../utils/canvasFont.js';
registerGlobalFonts();
import fs from "fs";
import path from "path";
import redisClient from '../../../redis.js';
import Server from '../../../models/Server.js';

import {
  getUserData,
  updateUser
} from '../../../database.js';

import shippingQuotes from "./req/shipSuggestions.js";
import { sendErrorLog } from "../../../utils/errorLogger.js";

// Path to custom scores JSON file
const shipDatabasePath = path.join(process.cwd(), "database", "customScores.json");

/**
* Universal function for sending responses to text commands and slash commands.
* If it's an interaction (slash command), it will defer/edit reply.
* If it's a text command, it will just call channel.send().
*/
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context
      .deferReply()
      .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

const ShipCmd = {
  name: "ship",
  description: "Test the love score between two users with interactive features! Use /setshiproles to assign male and female roles for better matching, or use 'all' to include all genders if roles are already set.",
  aliases: ["love",
    "match"],
  cooldown: 10000,
  example: ["ship",
    "ship all",
    "/setshiproles"],
  category: "🧩 Fun",

  // Pass in arguments and the universal "context" (which may be a message or an interaction)
  execute: async (args, context, cmdOptions = {}) => {
    try {
      const passedUserIds = new Set(
        Array.isArray(cmdOptions.passedUserIds)
          ? cmdOptions.passedUserIds
          : (cmdOptions.excludeUserId ? [cmdOptions.excludeUserId] : [])
      );
      const forceNewMessage = cmdOptions.forceNewMessage || false;
      const ignoreMentions = cmdOptions.ignoreMentions || false;

      // Remove the command itself from arguments
      if (args && args.length > 0 && args[0].toLowerCase() === "ship") args.shift();
      const isAll = cmdOptions.isAll || args[0]?.toLowerCase() === "all";
      const isRandom = args[0]?.toLowerCase() === "random" || !args[0] || forceNewMessage;

      // Ensure we are in a guild
      if (!context.guild) {
        return handleMessage(context, "This command can only be used in servers.");
      }

      // Get the invoker from context. For slash commands use context.user, for text commands use context.author.
      const invoker = context.user || context.author;

      let serverDoc;
      // Cache server configuration
      try {
        const serverKey = `server:${context.guild.id}`;
        const cachedServer = await redisClient.get(serverKey);

        if (cachedServer) {
          serverDoc = JSON.parse(cachedServer);
        } else {
          serverDoc = await Server.findOne({
            id: context.guild.id
          });
          if (serverDoc) {
            await redisClient.setEx(serverKey, 300, JSON.stringify(serverDoc)); // Cache 5 minutes
          }
        }
      } catch (e) {
        console.error('Server config error:', e);
      }

      // Determine user1 and user2.
      let user1 = null;
      let user2 = null;

      // If this is a slash command, use options (if present and not ignored)
      if (context.options && !ignoreMentions) {
        user1 = context.options.getUser("user1") || invoker;
        user2 = context.options.getUser("user2");
      }

      // Fallback to text-based logic, using mentions if available.
      if (!user1 || !user2) {
        if (!ignoreMentions && context.mentions && context.mentions.users.size >= 2) {
          const arr = [...context.mentions.users.values()];
          user1 = arr[0];
          user2 = arr[1];
        } else if (!ignoreMentions && context.mentions && context.mentions.users.size === 1) {
          user1 = invoker;
          user2 = context.mentions.users.first();
        } else if (isAll || isRandom) {
          user1 = invoker;

          if (!context.guild) {
            return await handleMessage(context, `<:warning:1366050875243757699> **Server Required**: Shipping random members can only be used inside a Discord server.`);
          }

          // Fetch up to 1000 members via REST API safely without gateway chunking timeouts
          let allMembers = context.guild.members?.cache || new Map();
          try {
            if (context.guild.members?.fetch) {
              allMembers = await context.guild.members.fetch({ limit: 1000 }).catch(() => context.guild.members?.cache || new Map());
            }
          } catch {
            allMembers = context.guild.members?.cache || new Map();
          }

          // Filter candidates: non-bots, not invoker, and not previously passed in this session
          let candidates = allMembers.filter(m => {
            const u = m.user || m;
            if (u.bot) return false;
            if (m.id === invoker.id) return false;
            if (passedUserIds.has(m.id)) return false;
            return true;
          });

          // If all candidates were passed, reset and filter out only the invoker and last partner
          if (candidates.size === 0) {
            candidates = allMembers.filter(m => {
              const u = m.user || m;
              return !u.bot && m.id !== invoker.id && !passedUserIds.has(m.id);
            });
            if (candidates.size === 0) {
              candidates = allMembers.filter(m => {
                const u = m.user || m;
                return !u.bot && m.id !== invoker.id;
              });
            }
          }

          if (candidates.size === 0) {
            return handleMessage(context, "⚠️ Not enough server members found to ship with. Please mention someone (e.g. `ship @user`)!");
          }

          if (!user1.roles) user1.roles = context?.member?.roles;

          // Apply ship role filters if configured (unless 'ship all' is requested)
          if (!isAll && user1.roles && serverDoc && serverDoc?.shipRoles) {
            const maleRoleId = serverDoc.shipRoles.male;
            const femaleRoleId = serverDoc.shipRoles.female;
            const hasMaleRole = maleRoleId && user1.roles.cache?.has(maleRoleId);
            const hasFemaleRole = femaleRoleId && user1.roles.cache?.has(femaleRoleId);

            if (hasMaleRole && femaleRoleId) {
              const roleFiltered = candidates.filter(member => member.roles?.cache?.has(femaleRoleId));
              if (roleFiltered.size > 0) candidates = roleFiltered;
            } else if (hasFemaleRole && maleRoleId) {
              const roleFiltered = candidates.filter(member => member.roles?.cache?.has(maleRoleId));
              if (roleFiltered.size > 0) candidates = roleFiltered;
            }
          }

          const randomMember2 = candidates.random();
          if (!randomMember2) {
            return handleMessage(context, "⚠️ Could not find an eligible server member to ship with.");
          }
          user2 = randomMember2.user || randomMember2;

        } else {
          return handleMessage(context, "Please mention one/two users or use `ship random` (in a server with enough members) to test a love score!");
        }
      }

      // Ensure user1 has username and id
      if (!user1) user1 = invoker;
      if (!user2) {
        return handleMessage(context, "⚠️ No partner found to ship with.");
      }

      // Attempt to load a custom score from your JSON file.
      let customScore = null;
      try {
        if (fs.existsSync(shipDatabasePath)) {
          const data = fs.readFileSync(shipDatabasePath, "utf8");
          const customScores = JSON.parse(data);
          // Create a sorted key (order does not matter).
          const key = [user1.id,
            user2.id].sort().join("-");
          if (customScores.hasOwnProperty(key)) {
            customScore = customScores[key];
          }
        }
      } catch (error) {
        console.error("Error reading customScores.json:", error);
      }

      // Calculate the love score.
      const score =
      customScore !== null
      ? Math.min(100, customScore): Math.min(
        100,
        getLoveScore(user1.id, user2.id, user1.username || user1.user?.username || "User1", user2.username || user2.user?.username || "User2", 100, Math.max(35, Math.ceil(Math.random() * 40))) +
        Math.floor(Math.random() * 10)
      );

      const quote = pickQuote(score);

      // Create the canvas image.
      const canvasWidth = 700;
      const canvasHeight = 290;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw a gradient background.
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      gradient.addColorStop(0, "#ff9a9e");
      gradient.addColorStop(1, "#ff848f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Load user avatars safely with fallback
      const defaultAvatar = "https://cdn.discordapp.com/embed/avatars/0.png";
      const avatarSize = 290;
      let user1Avatar, user2Avatar;
      try {
        const u1Url = user1.displayAvatarURL ? user1.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) : defaultAvatar;
        user1Avatar = await loadImage(u1Url);
      } catch {
        user1Avatar = await loadImage(defaultAvatar);
      }
      try {
        const u2Url = user2.displayAvatarURL ? user2.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) : defaultAvatar;
        user2Avatar = await loadImage(u2Url);
      } catch {
        user2Avatar = await loadImage(defaultAvatar);
      }

      // Draw avatars with rounded masking.
      drawRoundedImage(ctx, user1Avatar, 0, canvasHeight / 2 - avatarSize / 2, avatarSize);
      drawRoundedImage(ctx, user2Avatar, canvasWidth - avatarSize, canvasHeight / 2 - avatarSize / 2, avatarSize);

      // Draw a heart and the score.
      const circleRadius = 90;
      const circleX = canvasWidth / 2;
      const circleY = canvasHeight / 2;
      ctx.fillStyle = "#ff9a9e";
      ctx.beginPath();
      ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();

      try {
        const heartImage = await loadImage("https://cdn.discordapp.com/emojis/1359475162646450206.png");
        const heartImageWidth = 100;
        const heartImageHeight = 100;
        ctx.drawImage(heartImage, circleX - heartImageWidth / 2, circleY - 12 - heartImageHeight / 2, heartImageWidth, heartImageHeight);
      } catch {}

      ctx.fillStyle = "rgb(196,0,0)";
      ctx.font = "30px Roboto, sans-serif";
      ctx.fillText(`${score}%`, circleX - 35, circleY + 70);

      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "ship.png"
      });
      const msgDescription =
      `### <a:red_heart:1356865968164569158>  *** 𝙒𝙄𝙉𝘿𝙎 𝙊𝙁 𝘼𝙁𝙁𝙀𝘾𝙏𝙄𝙊𝙉 ***\n` +
      `### **${user1.username || user1.user?.username}** <:wine:1356880010866069562> **${user2.username || user2.user?.username}${user2.bot ? " <:bot:1359577258959962152>": ""}**\n` +
      `ᥫ᭡ ﹒ ***_𝗦𝗰𝗼𝗿𝗲 ﹒ ${score}%_***\n` +
      `-# 💌 _${quote}_\n`;

      // Create buttons.
      const likeButton = new ButtonBuilder()
      .setCustomId("like_ship")
      .setLabel("𝑳𝑰𝑲𝑬")
      .setEmoji('1359578512893149246')
      .setDisabled((user1.id === user2.id || user2.bot) ? true: false)
      .setStyle(ButtonStyle.Danger);
      const passButton = new ButtonBuilder()
      .setCustomId("pass_ship")
      .setLabel("𝑷𝑨𝑺𝑺")
      .setEmoji('1359578522670207126')
      .setStyle(ButtonStyle.Secondary);
      const actionRow = new ActionRowBuilder().addComponents(likeButton, passButton);

      // Send the ship embed/image using our universal handler or channel.send on pass
      const messagePayload = {
        content: msgDescription,
        files: [attachment],
        components: [actionRow],
      };

      let responseMessage;
      if (forceNewMessage) {
        responseMessage = await context.channel.send(messagePayload).catch(err => console.error(err));
      } else {
        const shipResponse = await handleMessage(context, messagePayload);
        if (context.isCommand) {
          responseMessage = await context.fetchReply().catch(() => null);
        } else {
          responseMessage = shipResponse;
        }
      }

      if (!responseMessage) return;

      // Create a collector for button interactions (only the invoker may interact).
      const filter = i => i.user.id === invoker.id;
      const collector = responseMessage?.createMessageComponentCollector ? responseMessage.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 300000,
      }) : null;

      if (!collector) return;

      collector.on("collect", async interaction => {
        if (interaction.user.id !== invoker.id) {
          return await interaction.reply({
            content: "⚠️ You cannot interact with this button.",
            ephemeral: true,
          });
        }

        await interaction.deferUpdate().catch(() => {});
        // Disable the buttons on current card.
        const disabledRow = new ActionRowBuilder().addComponents(
          likeButton.setDisabled(true),
          passButton.setDisabled(true)
        );
        await responseMessage.edit({
          components: [disabledRow]
        }).catch(() => {});

        if (interaction.customId === "like_ship") {
          const user2Data = await getUserData(user2?.id);
          const user1Data = await getUserData(user1?.id);

          if (user2Data) {
            await updateUser(user2?.id, {
              popularity: (user2Data?.popularity || 0) + 1
            });
          }

          const likeEmbed = new EmbedBuilder()
          .setTitle(`<a:red_heart:1356865968164569158> 𝒀𝑶𝑼 𝑳𝑰𝑲𝑬𝑫 ${user2.username || user2.user?.username}!`)
          .setDescription(`𝗞𝗔𝗦𝗜𝗞𝗢 𝗠𝗘𝗠𝗕𝗘𝗥: ${user2Data ? "YES": "NO"}\n𝗠𝗔𝗥𝗥𝗜𝗘𝗗: ${user2Data?.family?.spouse ? "YES": "NO"}\n𝗣𝗢𝗣𝗨𝗟𝗔𝗥𝗜𝗧𝗬: <:popularity:1359565087341543435> ${user2Data?.popularity ? user2Data.popularity + 1: "0"}`)
          .setFooter({
            text: `Each like contributes +1 popularity`
          })
          .setThumbnail(user2.displayAvatarURL ? user2.displayAvatarURL({ extension: "png", size: 512 }) : defaultAvatar)
          .setColor(0xff69b4);

          const likeEmbed2 = new EmbedBuilder()
          .setDescription(`𝗥𝗢𝗦𝗘𝗦 𝗬𝗢𝗨 𝗛𝗔𝗩𝗘: <:rose:1343097565738172488> ${user1Data?.inventory?.['rose'] || 0}\n` +
            `-# ᥫ᭡ You can buy roses using **\`kas buy roses <amount>\`**\n` +
            `-# ᥫ᭡ When you send someone roses, if their DMs are open, they will receive a notification\n` +
            `-# ᥫ᭡ Roses also contribute to someone's popularity (+25)\n` +
            `-# ᥫ᭡ You can propose to them using **\`kas marry @user\`**\n` +
            `-# ᴜꜱᴇ ᴘʀᴇꜰɪx ~ BETA FEATURE`)
          .setColor("#f29adf");

          const rosesButton = new ButtonBuilder()
          .setCustomId("send_roses")
          .setDisabled((!user2Data || (user1Data?.inventory?.['rose'] || 0) < 5) ? true: false)
          .setLabel("𝙎𝙀𝙉𝘿 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝙍𝙊𝙎𝙀𝙎 (𝟓)")
          .setEmoji(`1343097565738172488`)
          .setStyle(ButtonStyle.Primary);
          const rosesRow = new ActionRowBuilder().addComponents(rosesButton);

          await interaction.followUp({
            embeds: [likeEmbed, likeEmbed2],
            components: [rosesRow],
            ephemeral: true,
          }).catch(() => {});

          // Collector for the send roses button.
          const dmCollectorFilter = i => i.user.id === invoker.id && i.customId === "send_roses";
          const dmCollector = interaction.channel?.createMessageComponentCollector ? interaction.channel.createMessageComponentCollector({
            filter: dmCollectorFilter,
            max: 1,
            time: 300000,
          }) : null;

          if (dmCollector) {
            dmCollector.on("collect", async btnInteraction => {
              await btnInteraction.deferUpdate().catch(() => {});
              try {
                await user2.send(`💖 **${invoker.username}** 𝘩𝘢𝘴 𝘴𝘦𝘯𝘵 𝘺𝘰𝘶 **5** 𝘳𝘰𝘴𝘦𝘴 <:rose:1343097565738172488>\n` +
                  `𝑌𝑜𝑢𝑟 𝑝𝑜𝑝𝑢𝑙𝑎𝑟𝑖𝑡𝑦 𝑠𝑐𝑜𝑟𝑒 𝑖𝑛𝑐𝑟𝑒𝑎𝑠𝑒𝑑 𝑏𝑦 **+25**!\n` +
                  `-# Don't forget to thank them and spread the love!`);

                if (user2Data && user1Data) {
                  await updateUser(user2?.id, {
                    popularity: (user2Data?.popularity || 0) + 25
                  });
                  await updateUser(user1?.id, {
                    'inventory.rose': Math.max((user1Data?.inventory?.['rose'] || 0) - 5, 0)
                  });
                }

                await btnInteraction.followUp({
                  content: `<:rose:1343097565738172488> 5 roses have been sent to **${user2.username || user2.user?.username}**!`,
                  ephemeral: true
                }).catch(() => {});
              } catch (err) {
                await btnInteraction.followUp({
                  content: `Could not send DM to **${user2.username || user2.user?.username}**. They might have DMs disabled.`,
                  ephemeral: true
                }).catch(() => {});
              }
            });
          }
        } else if (interaction.customId === "pass_ship") {
          const randomQuote = shippingQuotes[Math.floor(Math.random() * shippingQuotes.length)];

          await interaction.followUp({
            content: `❤️ **${interaction.user.username}**, 𝘱𝘦𝘳𝘧𝘰𝘳𝘮𝘪𝘯𝘨 𝘢 𝘯𝘦𝘸 𝘴𝘩𝘪𝘱...\n${randomQuote}`,
            ephemeral: true
          }).catch(() => {});

          collector.stop();

          const updatedPassedUserIds = Array.isArray(cmdOptions.passedUserIds)
            ? [...cmdOptions.passedUserIds, user2?.id].filter(Boolean)
            : (user2?.id ? [user2.id] : []);

          // Execute a fresh random ship in the channel excluding all previously passed partners
          await ShipCmd.execute(isAll ? ["ship", "all"] : ["ship", "random"], context, {
            passedUserIds: updatedPassedUserIds,
            forceNewMessage: true,
            ignoreMentions: true,
            isAll
          });
        }
        collector.stop();
      });

      collector.on("end", async () => {
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            likeButton.setDisabled(true),
            passButton.setDisabled(true)
          );
          await responseMessage.edit({
            components: [disabledRow]
          }).catch(() => {});
        } catch (err) {}
      });
    } catch (e) {
      console.error(e);
      sendErrorLog(e, {
        source: 'Ship Command Error',
        commandName: 'ship',
        args,
        author: context.user || context.author,
        guild: context.guild,
        channel: context.channel
      }).catch(() => {});
      return handleMessage(context,
        "❗Something went wrong during shipping. Possibly an error occurred with your profile picture or interactions.");
    }
  },
};

// Helper to calculate a deterministic love score.
function getLoveScore(id1, id2, username1, username2, maxScore = 100, seed = 31) {
  if (typeof id1 !== "string" || typeof id2 !== "string" || typeof username1 !== "string" || typeof username2 !== "string") {
    throw new Error("IDs and usernames must be strings.");
  }
  const combinedIds = id1 < id2 ? `${id1}${id2}`: `${id2}${id1}`;
  const combinedUsernames = username1 < username2 ? `${username1}${username2}`: `${username2}${username1}`;
  function hashString(str, seed) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, seed);
    }
    return hash;
  }
  const idHash = Math.abs(hashString(combinedIds, seed) % (maxScore + 1));
  const usernameHash = Math.abs(hashString(combinedUsernames, seed) % (maxScore + 1));
  const weightedScore = Math.round(idHash * 0.8 + usernameHash * 0.2);
  return Math.min(weightedScore, maxScore);
}

// Pick a quote based on the score.
function pickQuote(score) {
  if (score < 10) {
    return "𝑁𝑜𝑡 𝑚𝑢𝑐ℎ 𝑜𝑓 𝑎 𝑐𝑜𝑛𝑛𝑒𝑐𝑡𝑖𝑜𝑛.";
  } else if (score < 20) {
    return "𝑇ℎ𝑒𝑟𝑒'𝑠 𝑎 ℎ𝑖𝑛𝑡 𝑜𝑓 𝑖𝑛𝑡𝑒𝑟𝑒𝑠𝑡.";
  } else if (score < 30) {
    return "𝐶ℎ𝑒𝑚𝑖𝑠𝑡𝑟𝑦 𝑖𝑠 𝑙𝑜𝑤, 𝑏𝑢𝑡 𝑛𝑜𝑡 𝑧𝑒𝑟𝑜.";
  } else if (score < 40) {
    return "𝐴 𝑠𝑙𝑖𝑔ℎ𝑡 𝑠𝑝𝑎𝑟𝑘 𝑒𝑥𝑖𝑠𝑡𝑠.";
  } else if (score < 50) {
    return "𝐴 𝑠𝑝𝑎𝑟𝑘 𝑖𝑠 𝑖𝑛 𝑡ℎ𝑒 𝑎𝑖𝑟!";
  } else if (score < 60) {
    return "𝑇ℎ𝑖𝑛𝑔𝑠 𝑎𝑟𝑒 ℎ𝑒𝑎𝑡𝑖𝑛𝑔 𝑢𝑝!";
  } else if (score < 70) {
    return "𝐿𝑜𝑣𝑒 𝑖𝑠 𝑏𝑢𝑑𝑑𝑖𝑛𝑔!";
  } else if (score < 80) {
    return "𝑌𝑜𝑢'𝑟𝑒 𝑎 𝑔𝑜𝑜𝑑 𝑚𝑎𝑡𝑐ℎ!";
  } else if (score < 90) {
    return "𝐴 𝑑𝑒𝑒𝑝 𝑐𝑜𝑛𝑛𝑒𝑐𝑡𝑖𝑜𝑛 𝑖𝑠 𝑓𝑜𝑟𝑚𝑖𝑛𝑔.";
  } else if (score < 100) {
    return "𝐴 𝑐𝑜𝑠𝑚𝑖𝑐 𝑏𝑜𝑛𝑑!";
  } else {
    return "𝐴 𝑝𝑒𝑟𝑓𝑒𝑐𝑡 𝑚𝑎𝑡𝑐ℎ!";
  }
}

// Helper to draw images with rounded masks.
function drawRoundedImage(ctx, img, x, y, size) {
  const radius = 16;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + size - radius, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
  ctx.lineTo(x + size, y + size - radius);
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  ctx.lineTo(x + radius, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

export default ShipCmd;