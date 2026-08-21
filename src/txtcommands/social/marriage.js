import {
  getUserData,
  updateUser,
} from '../../../database.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import {
  client
} from "../../../bot.js";

import {
  Helper,
  handleMessage,
  discordUser
} from '../../../helper.js';
import { sendErrorLog } from '../../../utils/errorLogger.js';

import {
  getAllJewelry
} from '../shop/shopDataHelper.js';

import {
  getOrCreateShopDoc
} from '../shop/viewUserJewelry.js';

import {
  ITEM_DEFINITIONS
} from "../../inventory.js";

function getChildEmoji(gender, customChildEmojis) {
  if (customChildEmojis && customChildEmojis[gender]) {
    return customChildEmojis[gender];
  }
  return gender === 'B' ? '👦' : gender === 'G' ? '👧' : '👶';
}

export const sendConfirmation = async (title, description, color, message, id) => {
  const { username, avatar } = discordUser(message);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: username,
      iconURL: avatar
    })
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: "ᴛʜɪꜱ ɪꜱ ᴊᴜꜱᴛ ꜰᴏʀ ꜰᴜɴ ɪɴ-ɢᴀᴍᴇ! ɴᴏ ʀᴇᴀʟ-ʟɪꜰᴇ ᴄᴏᴍᴍɪᴛᴍᴇɴᴛꜱ ᴀʀᴇ ɪɴᴠᴏʟᴠᴇᴅ."
    });

  if (id === "marry") {
    embed.setImage(`https://harshtiwari47.github.io/kasiko-public/images/kasiko-wedding.jpg`);
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm' + id)
      .setLabel('Yes')
      .setEmoji('1356865976737464441')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('cancel' + id)
      .setEmoji('1356880019825365052')
      .setLabel('No')
      .setStyle(ButtonStyle.Danger)
  );

  return await handleMessage(message, {
    embeds: [embed],
    components: [row]
  });
};

export async function setMarriageRing(message, ringId) {
  try {
    const { id: authorId, username: authorUsername } = discordUser(message);
    let userData = await getUserData(authorId);

    if (!userData?.family?.spouse) {
      return await handleMessage(message, {
        content: "### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\n**You are not married**.\n𝘛𝘺𝘱𝘦 ` 𝙆𝙖𝙨 𝙢𝙖𝙧𝙧𝙮 @𝙪𝙨𝙚𝙧𝙣𝙖𝙢𝙚 ` 𝘵𝘰 𝘱𝘳𝘰𝘱𝘰𝘴𝘦 <:Bouquet:1356866221529628792> 𝘵𝘰 𝘴𝘰𝘮𝘦𝘰𝘯𝘦!"
      });
    }

    const allJewelryItems = getAllJewelry();
    const item = allJewelryItems.find(i => i.id === ringId);

    if (!item) {
      return await handleMessage(message, {
        content: `<:warning:1366050875243757699> **${authorUsername}**, that ring ID does not exist!`
      });
    }

    if (userData.family.ring === item.id) {
      return await handleMessage(message, {
        content: `***${authorUsername}***, your current wedding ring is already the same as the one you're about to set!`
      });
    }

    const shopDoc = await getOrCreateShopDoc(authorId);
    if (!shopDoc || !shopDoc.items || !shopDoc.items[item.id] || shopDoc.items[item.id] <= 0) {
      return await handleMessage(message, {
        content: `<:warning:1366050875243757699> ***${authorUsername}***, you don't own any **${item.name}**!`
      });
    }

    shopDoc.items[item.id] -= 1;
    if (shopDoc.items[item.id] <= 0) {
      delete shopDoc.items[item.id];
    }
    await shopDoc.save();

    userData.family.ring = item.id;
    userData.family.bondXP = (userData.family.bondXP || 0) + Math.floor(item.price / 100);

    const spouseData = await getUserData(userData.family.spouse);
    if (spouseData?.family) {
      spouseData.family.ring = item.id;
      spouseData.family.bondXP = (spouseData.family.bondXP || 0) + Math.floor(item.price / 100);
      await updateUser(userData.family.spouse, spouseData);
    }

    await updateUser(authorId, userData);

    return await handleMessage(message, {
      content: `💍✨ ***${authorUsername}***, you and your beloved have exchanged vows with a beautiful new wedding ring! <:${item.id}:${item.emoji}> *${item.name}* is now a symbol of your love. 💖\nYour love bond XP has grown by **${Math.floor(item.price / 100)}**! <:rose:1343097565738172488>\nCherish this moment! 💞`
    });

  } catch (e) {
    console.error(e);
    return await handleMessage(message, `<:warning:1366050875243757699> Something went wrong while setting your wedding ring!`);
  }
}

export async function marriage(message) {
  try {
    const { id: authorId, username: authorUsername } = discordUser(message);
    let userData = await getUserData(authorId);

    if (userData?.family?.spouse) {
      let marrydate = new Date(userData?.family.marriedOn) || new Date();
      let currentDate = new Date();
      let partner = await client.users.fetch(userData.family.spouse).catch(() => null) || {
        username: "Spouse"
      };

      let countdownInDays = Math.max(0, Math.ceil((currentDate - marrydate) / (1000 * 60 * 60 * 24)));

      const EmojiesList = [
        "<:lovebird1:1327928654025588767>",
        "<:lovebird2:1327927083330175010>",
        "<:lovebird3:1327927957154697236>",
        "<:lovebird4:1327928023902720030>",
        "<:lovebird5:1327928684518309898>",
        "<:lovebird6:1353203227117617273>",
        "<:lovebird7:1353203462678249513>"
      ];

      const thresholds = [0, 500, 2500, 5000, 7500, 12500, 25000, 50000];

      const allJewelryItems = getAllJewelry();
      let item;
      let ring = "𝖣𝖤𝖥𝖠𝖴𝖫𝖳";

      if (userData.family.ring) {
        item = allJewelryItems.find(i => i.id === userData.family.ring);
        if (item) {
          ring = `<:${item.id}:${item.emoji}> *${item.name}*`;
        }
      }

      const bondXP = (userData.family?.bondXP || 0);
      const emojiCount = thresholds.filter(threshold => bondXP >= threshold).length - 1;
      const mEmojies = EmojiesList.slice(0, Math.max(0, emojiCount)).join(" ");

      const children = userData.family.children || [];
      const childrenNames = children.map((child) => {
        return `${getChildEmoji(child.gender, userData.family.customChildEmojis)} ${child.name}`;
      });

      return await handleMessage(message, {
        content: `### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\n` +
          `ᵔᴗᵔ 𝘠𝘰𝘶 𝘢𝘳𝘦 𝘮𝘢𝘳𝘳𝘪𝘦𝘥 𝘵𝘰 **${partner.username}**.\n` +
          `💞 **𝐶𝑜𝑢𝑝𝑙𝑒 𝐵𝑜𝑛𝑑𝑋𝑃 ~ ${bondXP}**\n` +
          `:lotus:**𝑀𝑎𝑟𝑟𝑖𝑒𝑑 ~ ${countdownInDays} days ago**\n` +
          `${mEmojies ? `# ${mEmojies}\n` : ''}` +
          `🚼 **𝐶ℎ𝑖𝑙𝑑𝑟𝑒𝑛 ~ ${children.length === 0 ? "0" : childrenNames.join(", ")}**\n` +
          `💍 **𝑅𝑖𝑛𝑔 ~ ${ring}**`
      });
    } else {
      return await handleMessage(message, {
        content: "### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\n**You are not married**.\n𝘛𝘺𝘱𝘦 ` 𝙆𝙖𝙨 𝙢𝙖𝙧𝙧𝙮 @𝙪𝙨𝙚𝙧𝙣𝙖𝙢𝙚 ` 𝘵𝘰 𝘱𝘳𝘰𝘱𝘰𝘴𝘦 <:Bouquet:1356866221529628792> 𝘵𝘰 𝘴𝘰𝘮𝘦𝘰𝘯𝘦!"
      });
    }
  } catch (e) {
    console.error(e);
    return await handleMessage(message, "<:warning:1366050875243757699> Something went wrong while performing `marriage` command.");
  }
}

export async function marry(user, message) {
  try {
    const { id: authorId, username: authorUsername } = discordUser(message);
    let userData = await getUserData(authorId);
    let invitedUserData = await getUserData(user);

    let targetUser = await client.users.fetch(user).catch(() => null);
    if (!targetUser) {
      return await handleMessage(message, `<:warning:1366050875243757699> Could not find that user!`);
    }

    if (authorId === user) {
      return await handleMessage(message, `<:warning:1366050875243757699> You cannot propose to yourself!`);
    }

    if (targetUser.bot) {
      return await handleMessage(message, `<:warning:1366050875243757699> You cannot marry a bot!`);
    }

    if (!userData) {
      return await handleMessage(message, `<:warning:1366050875243757699> You don't have an active account! Type \`kas help\` to create one.`);
    }

    if (!invitedUserData) {
      return await handleMessage(message, `<:warning:1366050875243757699> **${targetUser.username}** doesn't have an active account yet.`);
    }

    if (userData.family?.spouse && userData.family.spouse !== user) {
      return await handleMessage(message, `<:warning:1366050875243757699> You are already married! 🔫`);
    } else if (userData.family?.spouse && userData.family.spouse === user) {
      return await handleMessage(message, `<:warning:1366050875243757699> You are __already married__ to each other.`);
    } else if (invitedUserData.family?.spouse) {
      return await handleMessage(message, `<:warning:1366050875243757699> The user is __already married__.`);
    }

    if (userData.family?.adopted?.some(c => c.userId === user) || invitedUserData.family?.parents?.adopter === authorId) {
      return await handleMessage(message, `❌ You cannot marry your adopted child!`);
    }
    if (invitedUserData.family?.adopted?.some(c => c.userId === authorId) || userData.family?.parents?.adopter === user) {
      return await handleMessage(message, `❌ You cannot marry your adoptive parent!`);
    }
    if (
      userData.family?.parents?.adopter &&
      invitedUserData.family?.parents?.adopter &&
      userData.family.parents.adopter === invitedUserData.family.parents.adopter
    ) {
      return await handleMessage(message, `❌ You cannot marry your sibling!`);
    }

    const title = "💍 𝑴𝒂𝒓𝒓𝒊𝒂𝒈𝒆 𝑷𝒓𝒐𝒑𝒐𝒔𝒂𝒍";
    const description = `<a:lg_flower:1356865948501540914> <@${authorId}> has proposed <:Bouquet:1356866221529628792> to you! Do you accept **<@${user}>**?`;
    const replyMessage = await sendConfirmation(title, description, "#ee87ca", message, "marry");

    const filter = (i) => i.user.id === user && (i.customId === 'confirmmarry' || i.customId === 'cancelmarry');
    const collector = replyMessage?.createMessageComponentCollector ? replyMessage.createMessageComponentCollector({
      filter,
      time: 60000,
      max: 1
    }) : null;

    if (!collector) return;

    collector.on('collect', async (i) => {
      try {
        const rowDisabled = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confirmmarry')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('cancelmarry')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );

        if (i.customId === 'confirmmarry') {
          let date = Date.now();
          if (!userData.family) userData.family = {};
          if (!invitedUserData.family) invitedUserData.family = {};

          userData.family.spouse = user;
          userData.family.marriedOn = date;
          invitedUserData.family.spouse = authorId;
          invitedUserData.family.marriedOn = date;

          await updateUser(authorId, userData);
          await updateUser(user, invitedUserData);

          return await i.update({
            content: `🤵🏻👰🏻🎉 **<@${user}>** has accepted <@${authorId}>'s proposal! 🎉\n**Congratulations to the happy couple! 💍**`,
            embeds: [],
            components: [rowDisabled]
          });
        } else if (i.customId === 'cancelmarry') {
          return await i.update({
            content: `<@${user}> has declined <@${authorId}>'s proposal. 💔 Better luck next time!`,
            embeds: [],
            components: [rowDisabled]
          });
        }
      } catch (errCollect) {
        console.error(errCollect);
      }
    });

    collector.on('end', async (collected, reason) => {
      try {
        if (reason === 'time' && collected.size === 0) {
          if (replyMessage?.edit) {
            await replyMessage.edit({
              content: `⏳ Time's up! Proposal has expired.`,
              embeds: [],
              components: []
            }).catch(() => {});
          }
        }
      } catch (e) {}
    });

  } catch (e) {
    console.error(e);
    return await handleMessage(message, "<:warning:1366050875243757699> Something went wrong while sending proposal.");
  }
}

export async function divorce(user, message) {
  try {
    const { id: authorId, username: authorUsername } = discordUser(message);
    let userData = await getUserData(authorId);

    if (!userData?.family?.spouse) {
      return await handleMessage(message, `<:warning:1366050875243757699> Find your partner first! 😸 You are __not married__.`);
    }

    const spouseId = userData.family.spouse;
    if (user && user !== spouseId) {
      return await handleMessage(message, `<:warning:1366050875243757699> You are not married to that user! You are married to <@${spouseId}>.`);
    }

    let invitedUserData = await getUserData(spouseId);

    const title = "💔🥀 𝑫𝒊𝒗𝒐𝒓𝒄𝒆 𝑪𝒐𝒏𝒇𝒊𝒓𝒎𝒂𝒕𝒊𝒐𝒏 ";
    const description = `<@${authorId}> wants to divorce you. Do you agree <@${spouseId}>?`;
    const replyMessage = await sendConfirmation(title, description, "#450830", message, "divorce");

    const filter = (i) => i.user.id === spouseId && (i.customId === 'confirmdivorce' || i.customId === 'canceldivorce');
    const collector = replyMessage?.createMessageComponentCollector ? replyMessage.createMessageComponentCollector({
      filter,
      time: 60000,
      max: 1
    }) : null;

    if (!collector) return;

    collector.on('collect', async (i) => {
      try {
        const rowDisabled = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confirmdivorce')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('canceldivorce')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );

        if (i.customId === 'confirmdivorce') {
          userData.family.spouse = null;
          userData.family.bondXP = 0;
          userData.family.children = [];
          userData.family.ring = null;

          if (invitedUserData?.family) {
            invitedUserData.family.spouse = null;
            invitedUserData.family.bondXP = 0;
            invitedUserData.family.children = [];
            invitedUserData.family.ring = null;
            await updateUser(spouseId, invitedUserData);
          }

          await updateUser(authorId, userData);

          return await i.update({
            content: `💔 **<@${spouseId}>** has accepted the divorce from <@${authorId}>.\n**The two have now parted ways.**`,
            embeds: [],
            components: [rowDisabled]
          });
        } else if (i.customId === 'canceldivorce') {
          return await i.update({
            content: `🚫 **<@${spouseId}>** has declined the divorce proposal from <@${authorId}>.\n**The marriage remains intact!**`,
            embeds: [],
            components: [rowDisabled]
          });
        }
      } catch (errCollect) {
        console.error(errCollect);
      }
    });

    collector.on('end', async (collected, reason) => {
      try {
        if (reason === 'time' && collected.size === 0) {
          if (replyMessage?.edit) {
            await replyMessage.edit({
              content: `⏳ Time's up! Divorce proposal has expired.`,
              embeds: [],
              components: []
            }).catch(() => {});
          }
        }
      } catch (e) {}
    });

  } catch (e) {
    console.error(e);
    return await handleMessage(message, "<:warning:1366050875243757699> Something went wrong while sending proposal.");
  }
}

export async function forceDivorce(message) {
  try {
    const { id: authorId } = discordUser(message);
    let userData = await getUserData(authorId);

    if (!userData?.family?.spouse) {
      return await handleMessage(message, `<:warning:1366050875243757699> You are not married!`);
    }

    const spouseId = userData.family.spouse;
    let spouseData = await getUserData(spouseId);

    if (Number(userData.cash || 0) < 2000000) {
      return await handleMessage(message, `<:warning:1366050875243757699> You do not have enough cash to force divorce. You need <:kasiko_coin:1300141236841086977> **2,000,000**.`);
    }

    const title = "💔 Force Divorce Confirmation";
    const description = `By forcing a divorce, **2,000,000** Cash will be deducted from your account and **1,500,000** will be credited to your spouse. Do you wish to proceed?`;
    const replyMessage = await sendConfirmation(title, description, "#ff0000", message, "forceDivorce");

    const filter = (i) => i.user.id === authorId && (i.customId === 'confirmforceDivorce' || i.customId === 'cancelforceDivorce');
    const collector = replyMessage?.createMessageComponentCollector ? replyMessage.createMessageComponentCollector({
      filter,
      time: 45000,
      max: 1
    }) : null;

    if (!collector) return;

    collector.on('collect', async (i) => {
      try {
        const rowDisabled = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confirmforceDivorce')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('cancelforceDivorce')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );

        if (i.customId === 'confirmforceDivorce') {
          userData.cash = Math.max(0, Number(userData.cash || 0) - 2000000);
          userData.family.spouse = null;
          userData.family.bondXP = 0;
          userData.family.children = [];
          userData.family.ring = null;

          if (spouseData) {
            spouseData.cash = Number(spouseData.cash || 0) + 1500000;
            if (spouseData.family) {
              spouseData.family.spouse = null;
              spouseData.family.bondXP = 0;
              spouseData.family.children = [];
              spouseData.family.ring = null;
            }
            await updateUser(spouseId, spouseData);
          }

          await updateUser(authorId, userData);

          return await i.update({
            content: `💔 **Force divorce executed.** You have forced a divorce from <@${spouseId}>.\n**2,000,000** Cash was deducted from your account and **1,500,000** credited to your ex-spouse.`,
            embeds: [],
            components: [rowDisabled]
          });
        } else if (i.customId === 'cancelforceDivorce') {
          return await i.update({
            content: `🚫 Force divorce cancelled.`,
            embeds: [],
            components: [rowDisabled]
          });
        }
      } catch (errCollect) {
        console.error(errCollect);
      }
    });

  } catch (e) {
    console.error(e);
    return await handleMessage(message, "<:warning:1366050875243757699> Something went wrong while processing force divorce.");
  }
}

export async function roses(message) {
  try {
    const { id: authorId, username: authorUsername } = discordUser(message);
    let userData = await getUserData(authorId);

    const roseCount = Number(userData?.inventory?.['rose'] || 0);

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setTitle(`♡ ${authorUsername}'s Rose Garden <:rose:1343097565738172488>`)
      .setDescription(
        `You currently have **${roseCount}** roses in your bag!\n\n` +
        `-# ➺ Send roses: \`/social roses user:<@user> amount:<amount>\`\n` +
        `-# ✦⋆ Increases Couple Bond XP and relationship closeness!`
      );

    return await handleMessage(message, {
      embeds: [embed]
    });
  } catch (e) {
    console.error(e);
    return await handleMessage(message, "<:warning:1366050875243757699> An error occurred while retrieving your roses.");
  }
}

export async function sendRoses(toUser, amount, message) {
  try {
    const { id: authorId, username: authorUsername } = discordUser(message);
    const targetUserId = typeof toUser === 'string' ? toUser.replace(/[<@!>]/g, '') : toUser?.id;

    if (!targetUserId) {
      return await handleMessage(message, "<:warning:1366050875243757699> Please specify a valid user to send roses to.");
    }

    if (targetUserId === authorId) {
      return await handleMessage(message, "<:warning:1366050875243757699> You cannot send roses to yourself!");
    }

    amount = parseInt(amount, 10);
    if (isNaN(amount) || amount < 1) {
      amount = 1;
    }

    const userData = await getUserData(authorId);
    const targetData = await getUserData(targetUserId);

    if (!targetData) {
      return await handleMessage(message, "<:warning:1366050875243757699> That user does not have an active account.");
    }

    const currentRoses = Number(userData?.inventory?.['rose'] || 0);
    if (currentRoses < amount) {
      return await handleMessage(message, `<:warning:1366050875243757699> You don't have enough roses! You have **${currentRoses}** roses.`);
    }

    userData.inventory['rose'] = currentRoses - amount;
    if (!targetData.inventory) targetData.inventory = {};
    targetData.inventory['rose'] = Number(targetData.inventory['rose'] || 0) + amount;

    // If married to target, increase bond XP
    let extraBond = "";
    if (userData.family?.spouse === targetUserId) {
      const addedXP = amount * 5;
      userData.family.bondXP = Number(userData.family.bondXP || 0) + addedXP;
      if (targetData.family) targetData.family.bondXP = Number(targetData.family.bondXP || 0) + addedXP;
      extraBond = `\n💞 **+${addedXP} Couple Bond XP!**`;
    }

    await updateUser(authorId, userData);
    await updateUser(targetUserId, targetData);

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setTitle("🌹 Roses Delivered!")
      .setDescription(
        `**${authorUsername}** sent **${amount}** <:rose:1343097565738172488> roses to <@${targetUserId}>! ✨${extraBond}`
      );

    return await handleMessage(message, {
      embeds: [embed]
    });
  } catch (err) {
    console.error("[SendRoses] Error:", err);
    return await handleMessage(message, "<:warning:1366050875243757699> Failed to send roses. Please try again.");
  }
}

export async function dailyRewards(userId, username, context) {
  try {
    const currentTime = Date.now();
    const nextClaim = 24 * 60 * 60 * 1000;

    const userData = await getUserData(userId);

    if (!userData?.family?.spouse) {
      return await handleMessage(context, {
        content: "### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\n**You are not married**.\n𝘛𝘺𝘱𝘦 ` 𝙆𝙖𝙨 𝙢𝙖𝙧𝙧𝙮 @𝙪𝙨𝙚𝙧𝙣𝙖𝙢𝙚 ` 𝘵𝘰 𝘱𝘳𝘰𝘱𝘰𝘴𝘦 <:Bouquet:1356866221529628792> 𝘵𝘰 𝘴𝘰𝘮𝘦𝘰𝘯🇪!"
      });
    }

    if (userData.family.dailyReward && (currentTime - Number(userData.family.dailyReward)) < nextClaim) {
      const timeLeft = nextClaim - (currentTime - Number(userData.family.dailyReward));
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return await handleMessage(context, {
        content: `Sorry **${username}**, you have **already claimed** your daily ***💍 marriage reward*** for today.\n` +
        `Next reward in <:sand_timer:1386589414846631947> **${hours} hours & ${minutes} minutes**. 🎁\n`
      });
    }

    let rosesClaimed = (1 + Math.floor(Math.random() * 3));
    let bondExpInc = (1 + Math.floor(Math.random() * 11));
    let cashExt = Math.min((1000 + Math.floor(Math.random() * 5000)) + Math.floor((userData.family.bondXP || 0) / 5), 10000);

    userData.family.bondXP = Number(userData.family.bondXP || 0) + bondExpInc;
    userData.cash = Number(userData.cash || 0) + cashExt;
    if (!userData.inventory) userData.inventory = {};
    userData.inventory['rose'] = Number(userData.inventory['rose'] || 0) + rosesClaimed;
    userData.family.dailyReward = currentTime;

    await updateUser(userId, userData);

    let messageEmb = new EmbedBuilder()
      .setColor(`#f5659c`)
      .setTitle("🎁💍 Daily Marriage Reward Claimed!")
      .setDescription(
        `**${username}** received:\n` +
        `• <:kasiko_coin:1300141236841086977> **+${cashExt.toLocaleString()} Cash**\n` +
        `• <:rose:1343097565738172488> **+${rosesClaimed} Roses**\n` +
        `• 💞 **+${bondExpInc} Couple Bond XP**`
      );

    return await handleMessage(context, {
      embeds: [messageEmb]
    });
  } catch (e) {
    console.error(e);
  }
}

export const Marriage = {
  marriage,
  marry,
  divorce,
  roses,
  sendRoses,
  forceDivorce
};

export default {
  name: "marriage",
  description: "Manage marriages and related actions.",
  aliases: ["marry", "divorce", "love", "roses", "m", "rose", "propose"],
  args: "<command> [parameters]",
  example: [
    "marry <@user>",
    "divorce <@user>",
    "marriage",
    "marriage daily",
    "marriage forcedivorce",
    "marriage ring <ringId>",
    "roses <amount> <@user>"
  ],
  emoji: "💍",
  related: ["marriage", "marry", "divorce", "roses"],
  cooldown: 10000,
  category: "💍 Social",

  execute: async (args, message) => {
    try {
      const { id: userId, username } = discordUser(message);

      if (args[0] === "marry" || args[0] === "propose") {
        if (args[1]) {
          const targetId = args[1].replace(/[<@!>]/g, '');
          if (/^\d+$/.test(targetId)) {
            return marry(targetId, message);
          }
        }
        return handleMessage(message, "<:warning:1366050875243757699> Please mention a user to marry. Example: `marry @user`");
      }

      if (args[0] === "divorce") {
        if (args[1]) {
          const targetId = args[1].replace(/[<@!>]/g, '');
          if (/^\d+$/.test(targetId)) {
            return divorce(targetId, message);
          }
        }
        return divorce(null, message);
      }

      if (args[0] === "forcedivorce") {
        return forceDivorce(message);
      }

      if (args[0] === "roses" || args[0] === "rose") {
        if (args[1] && Helper.isNumber(args[1]) && args[2]) {
          const targetId = args[2].replace(/[<@!>]/g, '');
          return sendRoses(targetId, parseInt(args[1], 10), message);
        } else if (args[1] && args[2] && Helper.isNumber(args[2])) {
          const targetId = args[1].replace(/[<@!>]/g, '');
          return sendRoses(targetId, parseInt(args[2], 10), message);
        } else if (args[1]) {
          const targetId = args[1].replace(/[<@!>]/g, '');
          if (/^\d+$/.test(targetId)) {
            return sendRoses(targetId, 1, message);
          }
        }
        return roses(message);
      }

      const command = args[1] ? args[1].toLowerCase() : null;

      if (!command) return marriage(message);

      switch (command) {
        case "marry":
          if (args[2]) {
            const targetId = args[2].replace(/[<@!>]/g, '');
            if (/^\d+$/.test(targetId)) {
              return marry(targetId, message);
            }
          }
          return handleMessage(message, "<:warning:1366050875243757699> Please mention a user to marry. Example: `marry @user`");

        case "divorce":
          if (args[2]) {
            const targetId = args[2].replace(/[<@!>]/g, '');
            if (/^\d+$/.test(targetId)) {
              return divorce(targetId, message);
            }
          }
          return divorce(null, message);

        case "forcedivorce":
          return forceDivorce(message);

        case "roses":
        case "rose":
          if (args[2] && Helper.isNumber(args[2]) && args[3]) {
            const targetId = args[3].replace(/[<@!>]/g, '');
            return sendRoses(targetId, parseInt(args[2], 10), message);
          }
          return roses(message);

        case "daily":
          return dailyRewards(userId, username, message);

        case "ring":
          const ringId = args[2];
          if (!ringId) {
            return await handleMessage(message, `<:warning:1366050875243757699> Please mention the 💍 ring ID you want to set on your marriage profile!`);
          }
          return setMarriageRing(message, ringId);

        default:
          const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('💞 Marriage Command Guide')
            .setDescription('Here’s how to use the marriage commands effectively:')
            .addFields(
              { name: '💞 Marry', value: '`/social marry user:@username` or `kas marry @user`' },
              { name: '💔 Divorce', value: '`/social divorce` or `kas divorce`' },
              { name: '💍 Ring', value: '`kas marriage ring <ringId>`' },
              { name: '💒 Marriage Info', value: '`/social status` or `kas marriage`' },
              { name: '<:rose:1343097565738172488> Send Roses', value: '`/social roses user:@username amount:<amount>`' }
            );

          return await handleMessage(message, {
            embeds: [embed]
          });
      }
    } catch (e) {
      console.error(e);
      sendErrorLog(e, {
        source: 'Marriage Command',
        commandName: 'marriage',
        user: message.user || message.author,
        guild: message.guild,
        channel: message.channel,
        interaction: message.isCommand ? message : null
      }).catch(() => {});
      return handleMessage(message, "Oops! Something went wrong with the marriage command.");
    }
  }
};
