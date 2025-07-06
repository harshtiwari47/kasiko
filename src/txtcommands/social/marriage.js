import {
  getUserData,
  updateUser,
} from '../../../database.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
  ContainerBuilder
} from 'discord.js';

import {
  client
} from "../../../bot.js";

import {
  Helper,
  handleMessage
} from '../../../helper.js';

import {
  getAllJewelry
} from '../shop/shopDataHelper.js';

import {
  getOrCreateShopDoc
} from '../shop/viewUserJewelry.js';

import {
  ITEM_DEFINITIONS
} from "../../inventory.js";

export const sendConfirmation = async (title, description, color, message, id) => {
  // Create an embed for the confirmation message
  const embed = new EmbedBuilder()
  .setColor(color)
  .setAuthor({
    name: message.author.username, iconURL: message.author.displayAvatarURL({
      dynamic: true
    })
  })
  .setTitle(title)
  .setDescription(description)
  .setFooter(
    {
      text: "ᴛʜɪꜱ ɪꜱ ᴊᴜꜱᴛ ꜰᴏʀ ꜰᴜɴ ɪɴ-ɢᴀᴍᴇ! ɴᴏ ʀᴇᴀʟ-ʟɪꜰᴇ ᴄᴏᴍᴍɪᴛᴍᴇɴᴛꜱ ᴀʀᴇ ɪɴᴠᴏʟᴠᴇᴅ.",
    }
  )

  if (id === "marry") {
    embed.setImage(`https://harshtiwari47.github.io/kasiko-public/images/kasiko-wedding.jpg`)
  }

  // Action row with buttons
  const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
    .setCustomId('confirm' + id)
    .setLabel('Yes')
    .setEmoji(`1356865976737464441`)
    .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
    .setCustomId('cancel' + id)
    .setEmoji(`1356880019825365052`)
    .setLabel('No')
    .setStyle(ButtonStyle.Danger)
  );

  // Send the confirmation message and return it
  const replyMessage = await message.channel.send({
    embeds: [embed],
    components: [row]
  })

  return replyMessage; // Return the message
};

function getChildEmoji(gender, customEmojis = {}) {
  const DEFAULT_BOY_EMOJI = '<:boy_child:1335131474055139430>';
  const DEFAULT_GIRL_EMOJI = '<:girl_child:1335131494070489118>';

  if (customEmojis[gender]) return customEmojis[gender];
  return gender === 'B' ? DEFAULT_BOY_EMOJI: DEFAULT_GIRL_EMOJI;
}

export async function setMarriageRing(message, ringId) {
  try {
    let userData = await getUserData(message.author.id);
    if (userData?.family.spouse) {

      const allJewelryItems = getAllJewelry();
      const item = allJewelryItems.find(i => i.id.toLowerCase() === ringId.toLowerCase());
      if (!item) {
        await message.channel.send({
          content: `No item found with ID "${ringId}".`
        });
        return;
      }

      if (item.type !== "ring") {
        await message.channel.send({
          content: `The item with ID "${ringId}" is not a valid ring type.`
        });
      }

      if (userData?.family?.ring && userData.family.ring === item.id) {
        await message.channel.send({
          content: `***${message.author.username}***, your current wedding ring is already the same as the one you're about to set!`
        });
      }

      const shopDoc = await getOrCreateShopDoc(message.author.id);

      const subArrayRef = shopDoc.rings;

      const owned = subArrayRef.find(x => x.id.toLowerCase() === ringId.toLowerCase());
      if (!owned) {
        return message.channel.send({
          content: `<:warning:1366050875243757699> ***${message.author.username}***, you don't own any **${item.name}**!`
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      owned.amount -= 1;
      if (owned.amount <= 0) {
        subArrayRef.splice(subArrayRef.indexOf(owned), 1);
      }

      shopDoc.networth -= Math.floor(item.price);
      if (shopDoc.networth < 0) shopDoc.networth = 0; // avoid negative

      await shopDoc.save();

      let spouseData = await getUserData(userData.family.spouse);
      spouseData.family.ring = item.id;
      userData.family.ring = item.id;

      await updateUser(userData.family.spouse, spouseData);
      await updateUser(message.author.id, userData);

      return message.channel.send({
        content: `💍✨ ***${message.author.username}***, you and your beloved have exchanged vows with a beautiful new wedding ring! <:${item.id}:${item.emoji}> *${item.name}* is now a symbol of your love. 💖\nYour love bond XP has grown by **${item.price / 100}**! <:rose:1343097565738172488>\nCherish this moment, and remember—your wedding profile has been updated, but the previous ring won’t return to your jewelry collection. 💞`
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

    } else {
      return message.channel.send("### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\n**You are not married**.\n𝘛𝘺𝘱𝘦 ` 𝙆𝙖𝙨 𝙢𝙖𝙧𝙧𝙮 @𝙪𝙨𝙚𝙧𝙣𝙖𝙢𝙚 ` 𝘵𝘰 𝘱𝘳𝘰𝘱𝘰𝘴𝘦 <:Bouquet:1356866221529628792> 𝘵𝘰 𝘴𝘰𝘮𝘦𝘰𝘯𝘦!").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  } catch (e) {
    console.error(e);
    return message.channel.send(`<:warning:1366050875243757699> ***${message.author.username}***, something went wrong while setting your wedding ring!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function marriage(message) {
  try {
    let userData = await getUserData(message.author.id);

    if (userData?.family.spouse) {
      let marrydate = new Date(userData?.family.marriedOn) || new Date(); // The user's marriage date
      let currentDate = new Date(); // Current date
      let partner = await client.users.fetch(userData.family.spouse) || {
        "username": "Failed to Fetch"
      };

      let countdownInDays = Math.ceil((currentDate - marrydate) / (1000 * 60 * 60 * 24));

      let mEmojies = [];
      const EmojiesList = [
        "<:lovebird1:1327928654025588767>",
        "<:lovebird2:1327927083330175010>",
        "<:lovebird3:1327927957154697236>",
        "<:lovebird4:1327928023902720030>",
        "<:lovebird5:1327928684518309898>",
        "<:lovebird6:1353203227117617273>",
        "<:lovebird7:1353203462678249513>"
      ]

      const thresholds = [0,
        500,
        2500,
        5000,
        7500,
        12500,
        25000,
        50000];

      const allJewelryItems = getAllJewelry();
      let item;
      let ring = "𝖣𝖤𝖥𝖠𝖴𝖫𝖳";

      if (userData.family.ring) {
        item = allJewelryItems.find(i => i.id === userData.family.ring);
        if (item) {
          ring = `<:${item.id}:${item.emoji}> *${item.name}*`;
        }
      }

      const bondXP = (userData.family?.bondXP || 0) + (item?.price ? item.price / 100: 0);

      // Determine how many emojis to add
      const emojiCount = thresholds.filter(threshold => bondXP >= threshold).length - 1;

      // Add emojis to mEmojies
      mEmojies = EmojiesList.slice(0, emojiCount).join(" ");

      const childrenNames = userData.family.children.map((child) => {
        return `${getChildEmoji(child.gender, userData.family.customChildEmojis)} ${child.name}`;
      })

      return message.channel.send(`### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\nᵔᴗᵔ 𝘠𝘰𝘶 𝘢𝘳𝘦 𝘮𝘢𝘳𝘳𝘪𝘦𝘥 𝘵𝘰 **${partner.username}**.\n💞 **𝐶𝑜𝑢𝑝𝑙𝑒 𝐵𝑜𝑛𝑑𝑋𝑃 ~ ${bondXP}**\n:lotus:**𝑀𝑎𝑟𝑟𝑖𝑒𝑑 ~ ${countdownInDays}  days ago**\n${mEmojies ? `# ${mEmojies}`: ``}\n` +
        `🚼 **𝐶ℎ𝑖𝑙𝑑𝑟𝑒𝑛 ~ ${userData.family.children.length === 0 ? "0": childrenNames.join(", ")}**\n` +
        `💍 **𝑅𝑖𝑛𝑔 ~ ${ring}**`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else {
      return message.channel.send("### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\n**You are not married**.\n𝘛𝘺𝘱𝘦 ` 𝙆𝙖𝙨 𝙢𝙖𝙧𝙧𝙮 @𝙪𝙨𝙚𝙧𝙣𝙖𝙢𝙚 ` 𝘵𝘰 𝘱𝘳𝘰𝘱𝘰𝘴𝘦 <:Bouquet:1356866221529628792> 𝘵𝘰 𝘴𝘰𝘮𝘦𝘰𝘯𝘦!").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while performing `marriage` command.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function marry(user, message) {
  try {
    let userData = await getUserData(message.author.id);
    let invitedUserData = await getUserData(user);
    const guild = await message.channel.guild.members.fetch(user);

    if (message.author.id === user) {
      return message.channel.send(`<:warning:1366050875243757699> You can not propose yourself!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    if (userData.family.spouse && userData.family.spouse !== user) {
      return message.channel.send(`<:warning:1366050875243757699> You are already married! 🔫`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (userData.family.spouse && userData.family.spouse === user) {
      return message.channel.send(`<:warning:1366050875243757699> You are __already married__ to each other.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (invitedUserData.family.spouse) {
      return message.channel.send(`<:warning:1366050875243757699> The user is __already married__.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else {
      const title = "💍 𝑴𝒂𝒓𝒓𝒊𝒂𝒈𝒆 𝑷𝒓𝒐𝒑𝒐𝒔𝒂𝒍";
      const description = `<a:lg_flower:1356865948501540914> <@${message.author.id}> has proposed <:Bouquet:1356866221529628792> to you! Do you accept **<@${guild.user.id}>**?`;
      const replyMessage = await sendConfirmation(title, description, "#ee87ca", message, "marry");

      const filter = (i) => i.user.id === user &&
      (i.customId === 'confirmmarry' || i.customId === 'cancelmarry');

      const collector = replyMessage.createMessageComponentCollector({
        filter,
        time: 45000
      });

      collector.on('collect', async (i) => {
        // Disable buttons after selection
        const rowDisabled = new ActionRowBuilder()
        .addComponents(
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
          userData.family.spouse = user;
          userData.family.marriedOn = date;
          invitedUserData.family.spouse = message.author.id;
          invitedUserData.family.marriedOn = date;

          await updateUser(message.author.id, userData);
          await updateUser(user, invitedUserData);

          return await i.update({
            content: `🤵🏻👰🏻🎉 **<@${user}>** has accepted <@${message.author.id}>'s proposal! 🎉\n**Congratulations to the happy couple! 💍**`,
            components: [rowDisabled]
          });

        } else if (i.customId === 'cancelmarry') {
          return await i.update({
            content: `<@${user}> has declined <@${message.author.id}>'s proposal. 💔 Better luck next time!`,
            components: [rowDisabled]
          });
        }
      });
      collector.on('end',
        async (collected, reason) => {
          try {
            if (reason === 'time') {
              const rowDisabled = new ActionRowBuilder()
              .addComponents(
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

              return await replyMessage.edit({
                components: [rowDisabled]
              });
            }
          } catch (e) {}
        });
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while sending proposal.").catch(err => ![50001,
      50013,
      10008].includes(err.code) && console.error(err));
  }
}

export async function divorce(user, message) {
  try {
    let userData = await getUserData(message.author.id);
    let invitedUserData = await getUserData(user);
    const guild = await message.channel.guild.members.fetch(user);

    if (userData.family.spouse && userData.family.spouse !== user) {
      message.channel.send(`<:warning:1366050875243757699> You are not married to **${guild.user.username}**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (!userData.family.spouse) {
      message.channel.send(`<:warning:1366050875243757699> Find your partner first! 😸. You are __not married__.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (userData.family.spouse && userData.family.spouse === user) {

      const title = "💔🥀 𝑫𝒊𝒗𝒐𝒓𝒄𝒆 𝑪𝒐𝒏𝒇𝒊𝒓𝒎𝒂𝒕𝒊𝒐𝒏 ";
      const description = `<@${message.author.id}> wants to divorce you. Do you agree <@${user}>?`;
      const replyMessage = await sendConfirmation(title, description, "#450830", message, "divorce");

      const filter = (i) => i.user.id === user &&
      (i.customId === 'confirmdivorce' || i.customId === 'canceldivorce');

      const collector = replyMessage.createMessageComponentCollector({
        filter,
        time: 45000
      });

      collector.on('collect', async (i) => {
        // Disable buttons after selection
        const rowDisabled = new ActionRowBuilder()
        .addComponents(
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
          invitedUserData.family.spouse = null;
          invitedUserData.family.bondXP = 0;
          userData.family.children = [];
          invitedUserData.family.children = [];
          userData.family.ring = null;
          invitedUserData.family.ring = null;

          await updateUser(message.author.id, userData);
          await updateUser(user, invitedUserData);

          return await i.update({
            content: `💔 **<@${user}>** has accepted the divorce from <@${message.author.id}>.\n**The two have now parted ways.**`,
            components: [rowDisabled]
          });

        } else if (i.customId === 'canceldivorce') {
          return await i.update({
            content: `🚫 **<@${user}>** has declined the divorce proposal from <@${message.author.id}>.\n**The marriage remains intact!**`,
            components: [rowDisabled]
          });
        }
      });
      collector.on('end',
        async (collected, reason) => {
          try {
            if (reason === 'time') {
              const rowDisabled = new ActionRowBuilder()
              .addComponents(
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

              return await replyMessage.edit({
                components: [rowDisabled]
              });
            }
          } catch (e) {}
        });
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while sending proposal.").catch(err => ![50001,
      50013,
      10008].includes(err.code) && console.error(err));
  }
}

export async function forceDivorce(message) {
  try {
    let userData = await getUserData(message.author.id);

    // Check if the user is married.
    if (!userData.family.spouse) {
      return message.channel.send(`<:warning:1366050875243757699> You are not married!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const spouseId = userData.family.spouse;
    let spouseData = await getUserData(spouseId);

    if (!spouseData) {
      return message.channel.send(`⚠ Spouse data is not found!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Check if the divorcing user has enough funds.
    if (userData.cash < 2000000) {
      return message.channel.send(`<:warning:1366050875243757699> You do not have enough funds to force divorce. You need **2,000,000**.`)
      .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Send confirmation prompt to the divorcing user.
    const title = "💔 Force Divorce Confirmation";
    const description = `By forcing a divorce, **2,000,000** will be deducted from your account and **1,500,000** will be credited to your spouse. Do you wish to proceed?`;
    const replyMessage = await sendConfirmation(title, description, "#ff0000", message, "forceDivorce");

    // Set up a collector that listens for a response from the divorcing user.
    const filter = (i) => i.user.id === message.author.id &&
    (i.customId === 'confirmforceDivorce' || i.customId === 'cancelforceDivorce');

    const collector = replyMessage.createMessageComponentCollector({
      filter,
      time: 45000
    });

    collector.on('collect', async (i) => {
      // Disable the buttons once an option is selected.
      const rowDisabled = new ActionRowBuilder()
      .addComponents(
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
        // Process the monetary transaction.
        userData.cash -= 2000000;
        spouseData.cash = (spouseData.balance || 0) + 1500000;

        // Clear marriage-related fields for both users.
        userData.family.spouse = null;
        userData.family.bondXP = 0;
        userData.family.children = [];
        userData.family.ring = null;

        spouseData.family.spouse = null;
        spouseData.family.bondXP = 0;
        spouseData.family.children = [];
        spouseData.family.ring = null;

        // Update the user records.
        await updateUser(message.author.id, userData);
        await updateUser(spouseId, spouseData);

        return await i.update({
          content: `💔 **Force divorce executed.** You have forced a divorce from <@${spouseId}>.\n**2,000,000** has been deducted from your account and **1,500,000** credited to your ex-spouse.`,
          components: [rowDisabled]
        });
      } else if (i.customId === 'cancelforceDivorce') {
        return await i.update({
          content: `🚫 Force divorce cancelled.`,
          components: [rowDisabled]
        });
      }
    });

    collector.on('end',
      async (collected, reason) => {
        try {
          if (reason === 'time') {
            const rowDisabled = new ActionRowBuilder()
            .addComponents(
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

            return await replyMessage.edit({
              components: [rowDisabled]
            });
          }
        } catch (e) {
          console.error(e);
        }
      });

  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while processing force divorce.").catch(err => ![50001,
      50013,
      10008].includes(err.code) && console.error(err));
  }
}

export async function roses(message) {
  try {
    let userData = await getUserData(message.author.id);

    // Check if roses data exists
    if (userData && userData.inventory['rose'] > 0) {

      const Container = new ContainerBuilder()
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`## ♡ **${message.author.username}**, you have **${userData.inventory['rose'] || 0}** roses! <:rose:1343097565738172488>`),
        textDisplay => textDisplay.setContent(`-# ➺ Share roses: \`roses <amount> <@user>\`\n-# ✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
      )

      return await handleMessage(message, {
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      });

    } else {
      return message.channel.send(`🚫 | **${message.author.username}**, you don't have any roses yet. Start buying some! **\` buy roses <amount> \`** <:rose:1343097565738172488>`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> An error occurred while retrieving your roses. Please try again later.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function sendRoses(toUser, amount, message) {
  const args = [];

  args[0] = 'rose';
  args[1] = message.mentions.users.first();
  args[2] = Number(amount);
  return await ITEM_DEFINITIONS['rose']?.shareHandler(args, message);
}

export async function dailyRewards(userId, username, context) {
  try {
    const currentTime = Date.now();
    const nextClaim = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const userData = await getUserData(userId);

    if (!userData?.family?.spouse) {
      return await handleMessage(context, {
        content: "### <a:red_heart:1356865968164569158> 𝙍𝙀𝙇𝘼𝙏𝙄𝙊𝙉𝙎𝙃𝙄𝙋 𝙎𝙏𝘼𝙏𝙐𝙎\n**You are not married**.\n𝘛𝘺𝘱𝘦 ` 𝙆𝙖𝙨 𝙢𝙖𝙧𝙧𝙮 @𝙪𝙨𝙚𝙧𝙣𝙖𝙢𝙚 ` 𝘵𝘰 𝘱𝘳𝘰𝘱𝘰𝘴𝘦 <:Bouquet:1356866221529628792> 𝘵𝘰 𝘴𝘰𝘮𝘦𝘰𝘯𝘦!"
      });
    }

    if (userData && userData?.family.dailyReward && (currentTime - Number(userData.family.dailyReward)) < nextClaim) {
      // Calculate remaining time
      const timeLeft = nextClaim - (currentTime - Number(userData.family.dailyReward));
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return await handleMessage(context, {
        content: `Sorry **${username}**, you have **already claimed** your daily ***💍 marriage reward*** for today.\n` +
        `Next reward in <:sand_timer:1386589414846631947> **${hours} hours & ${minutes} minutes**. 🎁\n`
        + `🎀˚˖𓍢ִ໋🦢˚〰﹏ᥫ᭡.𐙚⋆⁺₊💞`
      });
    } else {
      let rosesClaimed = (1 + Math.floor(Math.random() * 3));
      let bondExpInc = (1 + Math.floor(Math.random() * 11));
      let cashExt = Math.min((1000 + Math.floor(Math.random() * 5000)) + (userData.family.bondXP/5), 10000);
      const loveMessages = [
        "Every moment with you feels like magic.",
        "You're the reason my heart skips a beat.",
        "Loving you is my favorite adventure.",
        "You are my sunshine on the cloudiest days.",
        "My world is brighter with you in it.",
        "You make my heart smile every single day.",
        "With you, every day feels like a dream.",
        "You’re the missing piece to my puzzle of life.",
        "You are my greatest blessing and my sweetest gift.",
        "I fall in love with you a little more every day.",
        "You’re my favorite thought and my happiest memory.",
        "My heart belongs to you and always will.",
        "You are the melody to my life's song.",
        "You make my soul feel complete.",
        "Every love story is beautiful, but ours is my favorite."
      ];

      userData.family.bondXP += bondExpInc;
      userData.cash += cashExt;
      userData.inventory['rose'] = (userData.inventory['rose'] || 0) + rosesClaimed;
      userData.family.dailyReward = currentTime;

      await updateUser(userId, userData);

      let messageForm = {
        content: `🎁💍 **𝓓𝓪𝓲𝓵𝔂 𝓶𝓪𝓻𝓻𝓲𝓪𝓰𝓮 𝓻𝓮𝔀𝓪𝓻𝓭 𝓬𝓵𝓪𝓲𝓶𝓮𝓭!**\n**${username}** received:\n` +
        `+ <:kasiko_coin:1300141236841086977> **${cashExt}**\n` +
        `+ <:rose:1343097565738172488> **${rosesClaimed}**\n` +
        `+ 💞 **${bondExpInc}**\n` +
        `-# 💌 ${loveMessages[Math.floor(Math.random() * loveMessages.length)]}`
      }

      let messageEmb = new EmbedBuilder()
      .setDescription(messageForm.content)
      .setColor(`#f5659c`);

      return await handleMessage(context, {
        embeds: [messageEmb]
      });
    }
  } catch (e) {
    console.error(e)
  }
}

export const Marriage = {
  marriage,
  marry,
  divorce,
  roses,
  sendRoses,
  forceDivorce
}

export default {
  name: "marriage",
  description: "Manage marriages and related actions. A marriage's BondXP can be increased by sending roses to your spouse. After reaching a certain amount of BondXP, you can expect a child. Married users can enjoy an additional 0.25 boost to their daily rewards.",
  aliases: ["marry",
    "divorce",
    "love",
    "roses",
    "m",
    "rose", "propose"],
  args: "<command> [parameters]",
  example: [
    "marry <@user>",
    // Marry a user
    "divorce <@user>",
    // Divorce a user
    "marriage",
    "marriage daily",
    "marriage forcedivorce",
    "marriage ring <ringId>",
    // View marriage status
    "roses <amount> <@user>",
    // Send roses to a user
  ],
  emoji: "💍",
  related: ["marriage",
    "marry",
    "divorce",
    "roses"],
  cooldown: 10000,
  // Cooldown of 10 seconds
  category: "👤 User",

  execute: async (args, message) => {
    try {
      if (args[0] === "marry" || args[0] === "propose") {
        if (args[1] && Helper.isUserMention(args[1], message)) {
          return Marriage.marry(Helper.extractUserId(args[1]), message); // Marry a user
        }
        return message.channel.send("<:warning:1366050875243757699> Please mention a user to marry. Example: `marry @user`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (args[0] === "divorce") {
        if (args[1] && Helper.isUserMention(args[1], message)) {
          return Marriage.divorce(Helper.extractUserId(args[1]), message); // Divorce a user
        }
        return message.channel.send("<:warning:1366050875243757699> Please mention a user to divorce. Example: `divorce @user`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (args[0] === "forcedivorce") {
        return Marriage.forceDivorce(message); // Divorce a user
      }

      if (args[0] === "roses" || args[0] === "rose") {
        if (args[1] && Helper.isNumber(args[1]) && args[2] && Helper.isUserMention(args[2], message)) {
          return Marriage.sendRoses(Helper.extractUserId(args[2]), parseInt(args[1]), message); // Send roses to a user
        }
        return Marriage.roses(message); // Show the roses system info if no arguments are provided
      }

      const command = args[1] ? args[1].toLowerCase(): null;

      if (!command) return Marriage.marriage(message); // View the marriage status of the username

      switch (command) {
      case "marry":
        if (args[2] && Helper.isUserMention(args[2], message)) {
          return Marriage.marry(Helper.extractUserId(args[2]), message); // Marry a user
        }
        return message.channel.send("<:warning:1366050875243757699> Please mention a user to marry. Example: `marry @user`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

      case "divorce":
        if (args[2] && Helper.isUserMention(args[2], message)) {
          return Marriage.divorce(Helper.extractUserId(args[2]), message); // Divorce a user
        }
        return message.channel.send("<:warning:1366050875243757699> Please mention a user to divorce. Example: `divorce @user`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

      case "forcedivorce":
        return Marriage.forceDivorce(message); // Divorce a user

      case "roses":
      case "rose":
        if (args[2] && Helper.isNumber(args[2]) && Helper.isUserMention(args[3], message)) {
          return Marriage.sendRoses(Helper.extractUserId(args[3]), parseInt(args[2]), message); // Send roses to a user
        }
        return Marriage.roses(message); // Show the roses system info if no arguments are provided
      case "daily":
        return dailyRewards(message.author.id, message.author.username, message);

      case "ring":
        const ringId = args[2];

        if (!ringId) {
          return await message.channel.send(`<:warning:1366050875243757699> Please mention the 💍 ring ID you want to set on your marriage profile!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        return setMarriageRing(message, ringId);

      default:
        const embed = new EmbedBuilder()
        .setColor('#FF69B4') // Beautiful pink color
        .setTitle('💞 Marriage Command Guide')
        .setDescription('Here’s how to use the marriage commands effectively:')
        .addFields(
          {
            name: '💞 Marry', value: 'marry <@username>'
          },
          {
            name: '💔 Divorce', value: 'divorce <@username>'
          },
          {
            name: '💍 Ring', value: 'marriage ring <ringId>'
          },
          {
            name: '💒 Marriage Info', value: 'marriage or m'
          },
          {
            name: '<:rose:1343097565738172488> Send Roses', value: 'roses <@username (optional)> <amount>'
          }
        )

        return await message.channel.send({
          embeds: [embed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (e) {
      console.error(e);
    }
  }
};