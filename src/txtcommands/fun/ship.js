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
import fs from "fs";
import path from "path";

import {
  getUserData,
  updateUser
} from '../../../database.js';

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
  description: "Test the love score between two users with interactive features!",
  aliases: ["love",
    "match"],
  cooldown: 10000,
  category: "🧩 Fun",

  // Pass in arguments and the universal "context" (which may be a message or an interaction)
  execute: async (args, context) => {
    try {
      // Remove the command itself from arguments
      if (args.length > 0) args.shift();
      const isRandom = args[0]?.toLowerCase() === "random" || !args[0];

      // Ensure we are in a guild
      if (!context.guild) {
        return handleMessage(context, "This command can only be used in servers.");
      }

      // Get the invoker from context. For slash commands use context.user, for text commands use context.author.
      const invoker = context.user || context.author;

      // Fetch guild members (this is required for random pairing)
      const allMembers = await context.guild.members.fetch();
      if (isRandom && (!allMembers || allMembers.size <= 1)) {
        return handleMessage(context, "Not enough members to perform `ship random`. At least 2 members are required!");
      }

      // Determine user1 and user2.
      let user1 = null;
      let user2 = null;

      // If this is a slash command, use options (if present) – expect options named "user1" and "user2".
      if (context.options) {
        user1 = context.options.getUser("user1") || invoker;
        user2 = context.options.getUser("user2");
      }

      // Fallback to text-based logic, using mentions if available.
      if (!user1 || !user2) {
        if (context.mentions && context.mentions.users.size >= 2) {
          const arr = [...context.mentions.users.values()];
          user1 = arr[0];
          user2 = arr[1];
        } else if (context.mentions && context.mentions.users.size === 1) {
          user1 = invoker;
          user2 = context.mentions.users.first();
        } else if (isRandom && allMembers && allMembers.size > 1) {
          const randomMember1 = invoker;
          let randomMember2 = allMembers.random();
          while (randomMember1.id === randomMember2.id) {
            randomMember2 = allMembers.random();
          }
          user1 = randomMember1;
          user2 = randomMember2.user;
        } else {
          return handleMessage(context, "Please mention one/two users or use `ship random` (in a server with enough members) to test a love score!");
        }
      }

      // Attempt to load a custom score from your JSON file.
      let customScore = null;
      try {
        const data = fs.readFileSync(shipDatabasePath, "utf8");
        const customScores = JSON.parse(data);
        // Create a sorted key (order does not matter).
        const key = [user1.id,
          user2.id].sort().join("-");
        if (customScores.hasOwnProperty(key)) {
          customScore = customScores[key];
        }
      } catch (error) {
        console.error("Error reading customScores.json:", error);
      }

      // Calculate the love score.
      const score =
      customScore !== null
      ? Math.min(100, customScore): Math.min(
        100,
        getLoveScore(user1.id, user2.id, user1.username, user2.username, 100, Math.max(35, Math.ceil(Math.random() * 40))) +
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

      // Load user avatars.
      const avatarSize = 290;
      const user1Avatar = await loadImage(user1.displayAvatarURL({
        extension: "png", size: 512
      }));
      const user2Avatar = await loadImage(user2.displayAvatarURL({
        extension: "png", size: 512
      }));

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

      const heartImage = await loadImage("https://cdn.discordapp.com/emojis/1359475162646450206.png");
      const heartImageWidth = 100;
      const heartImageHeight = 100;
      ctx.drawImage(heartImage, circleX - heartImageWidth / 2, circleY - 12 - heartImageHeight / 2, heartImageWidth, heartImageHeight);

      ctx.fillStyle = "rgb(196,0,0)";
      ctx.font = "30px sans-serif";
      ctx.fillText(`${score}%`, circleX - 60, circleY + 50);

      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "ship.png"
      });
      const msgDescription =
      `### <a:red_heart:1356865968164569158>  *** 𝙒𝙄𝙉𝘿𝙎 𝙊𝙁 𝘼𝙁𝙁𝙀𝘾𝙏𝙄𝙊𝙉 ***\n` +
      `### **${user1.username}** <:wine:1356880010866069562> **${user2.username}${user2.bot ? " <:bot:1359577258959962152>": ""}**\n` +
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

      // Send the ship embed/image using our universal handler.
      const shipResponse = await handleMessage(context, {
        content: msgDescription,
        files: [attachment],
        components: [actionRow],
      });

      // Grab the actual message (different in interactions vs. text commands).
      let responseMessage;
      if (context.isCommand) {
        responseMessage = await context.fetchReply();
      } else {
        responseMessage = shipResponse;
      }

      // Create a collector for button interactions (only the invoker may interact).
      const filter = i => i.user.id === invoker.id;
      const collector = responseMessage.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 300000,
      });

      collector.on("collect", async interaction => {

        await interaction.deferUpdate();
        // Disable the buttons.
        const disabledRow = new ActionRowBuilder().addComponents(
          likeButton.setDisabled(true),
          passButton.setDisabled(true)
        );
        await responseMessage.edit({
          components: [disabledRow]
        });

        if (interaction.customId === "like_ship") {
          const user2Data = await getUserData(user2?.id);
          const user1Data = await getUserData(user1?.id);

          if (user2Data) {
            await updateUser(user2?.id, {
              popularity: (user2Data?.popularity || 0) + 1
            })
          }

          const likeEmbed = new EmbedBuilder()
          .setTitle(`<a:red_heart:1356865968164569158> 𝒀𝑶𝑼 𝑳𝑰𝑲𝑬𝑫 ${user2.username}!`)
          .setDescription(`𝗞𝗔𝗦𝗜𝗞𝗢 𝗠𝗘𝗠𝗕𝗘𝗥: ${user2Data ? "YES": "NO"}\n𝗠𝗔𝗥𝗥𝗜𝗘𝗗: ${user2Data?.family?.spouse ? "YES": "NO"}\n𝗣𝗢𝗣𝗨𝗟𝗔𝗥𝗜𝗧𝗬: <:popularity:1359565087341543435> ${user2Data?.popularity ? user2Data.popularity + 1: "0"}`)
          .setFooter({
            text: `Each like contributes +1 popularity`
          })
          .setThumbnail(user2.displayAvatarURL({
            extension: "png", size: 512
          }))
          .setColor(0xff69b4)

          const likeEmbed2 = new EmbedBuilder()
          .setDescription(`𝗥𝗢𝗦𝗘𝗦 𝗬𝗢𝗨 𝗛𝗔𝗩𝗘: <:rose:1343097565738172488> ${user1Data.roses}\n` +
            `-# ᥫ᭡ You can buy roses using **\`buy roses <amount>\`**\n` +
            `-# ᥫ᭡ When you send someone roses, if their DMs are open, they will receive a notification\n` +
            `-# ᥫ᭡ Roses also contribute to someone's popularity (+25)\n` +
            `-# ᥫ᭡ You can propose to them using **\`marry @user\`**\n` +
            `-# ᴜꜱᴇ ᴘʀᴇꜰɪx ~ BETA FEATURE`)
          .setColor("#f29adf")

          const rosesButton = new ButtonBuilder()
          .setCustomId("send_roses")
          .setDisabled((!user2Data || user1Data.roses < 5) ? true: false)
          .setLabel("𝙎𝙀𝙉𝘿 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝙍𝙊𝙎𝙀𝙎 (𝟓)")
          .setEmoji(`1343097565738172488`)
          .setStyle(ButtonStyle.Primary);
          const rosesRow = new ActionRowBuilder().addComponents(rosesButton);

          await interaction.followUp({
            embeds: [likeEmbed, likeEmbed2],
            components: [rosesRow],
            ephemeral: true,
          });

          // Collector for the send roses button.
          const dmCollectorFilter = i => i.user.id === invoker.id && i.customId === "send_roses";
          const dmCollector = interaction.channel.createMessageComponentCollector({
            filter: dmCollectorFilter,
            max: 1,
            time: 300000,
          });

          dmCollector.on("collect", async btnInteraction => {
            await btnInteraction.deferUpdate();
            try {
              await user2.send(`💖 **${invoker.username}** 𝘩𝘢𝘴 𝘴𝘦𝘯𝘵 𝘺𝘰𝘶 **5** 𝘳𝘰𝘴𝘦𝘴 <:rose:1343097565738172488>\n` +
                `𝑌𝑜𝑢𝑟 𝑝𝑜𝑝𝑢𝑙𝑎𝑟𝑖𝑡𝑦 𝑠𝑐𝑜𝑟𝑒 𝑖𝑛𝑐𝑟𝑒𝑎𝑠𝑒𝑑 𝑏𝑦 **+25**!\n` +
                `-# Don't forget to thank them and spread the love!`);

              if (user2Data && user1Data) {
                await updateUser(user2?.id, {
                  popularity: (user2Data?.popularity || 0) + 25
                });
                await updateUser(user1?.id, {
                  roses: Math.max((user1Data?.roses || 0) - 25, 0)
                })
              }

              await btnInteraction.followUp({
                content: `<:rose:1343097565738172488> 5 roses have been sent to **${user2.username}**!`,
                ephemeral: true
              });
            } catch (err) {
              await btnInteraction.followUp({
                content: `Could not send DM to **${user2.username}**. They might have DMs disabled.`,
                ephemeral: true
              });
            }
          });
        } else if (interaction.customId === "pass_ship") {
          await interaction.followUp({
            content: `❤️ **${interaction.user.username}**, 𝘱𝘦𝘳𝘧𝘰𝘳𝘮𝘪𝘯𝘨 𝘢 𝘯𝘦𝘸 𝘴𝘩𝘪𝘱...`, ephemeral: true
          });

          await ShipCmd.execute(args, context);
        }
        collector.stop();
      });

      collector.on("end",
        async collected => {
          const disabledRow = new ActionRowBuilder().addComponents(
            likeButton.setDisabled(true),
            passButton.setDisabled(true)
          );
          await responseMessage.edit({
            components: [disabledRow]
          });
        });
    } catch (e) {
      console.error(e);
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