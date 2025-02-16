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
  Helper
} from '../../../helper.js';

import {
  getAllJewelry
} from '../shop/shopDataHelper.js';

import {
  getOrCreateShopDoc
} from '../shop/viewUserJewelry.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    // For normal text-based usage
    return context.channel.send(data);
  }
}

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
  .addFields(
    {
      name: 'Warning', value: "This is just for fun in-game! No real-life commitments are involved.",
    }
  )
  .setTimestamp();

  // Action row with buttons
  const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
    .setCustomId('confirm' + id)
    .setLabel('Yes')
    .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
    .setCustomId('cancel' + id)
    .setLabel('No')
    .setStyle(ButtonStyle.Danger)
  );

  // Send the confirmation message and return it
  const replyMessage = await message.channel.send({
    embeds: [embed],
    components: [row]
  });

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
          content: `⚠️ ***${message.author.username}***, you don't own any **${item.name}**!`
        });
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
        content: `💍✨ ***${message.author.username}***, you and your beloved have exchanged vows with a beautiful new wedding ring! <:${item.id}:${item.emoji}> *${item.name}* is now a symbol of your love. 💖\nYour love bond XP has grown by **${item.price / 100}**! 🌹\nCherish this moment, and remember—your wedding profile has been updated, but the previous ring won’t return to your jewelry collection. 💞`
      });

    } else {
      return message.channel.send("♥️ 𝑹𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n**You are not married**.\nType `marry @username` to propose 💐 to someone!");
    }
  } catch (e) {
    console.error(e);
    await message.channel.send(`⚠️ ***${message.author.username}***, something went wrong while setting your wedding ring!`);
    return;
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
        "<:lovebird5:1327928684518309898>"
      ]

      const thresholds = [0,
        500,
        2500,
        5000,
        7500,
        12500];

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

      return message.channel.send(`♥️ 𝑹𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\nYou are married to **${partner.username} 💒**.\n💞⁠ Couple BondXP: ** ${bondXP}**\n✿⁠ Married: **${countdownInDays}  days ago**\n${mEmojies ? `# ${mEmojies}`: ``}\n` +
        `🚼 **Children:** **${userData.family.children.length === 0 ? "0": childrenNames.join(", ")}**\n` +
        `💍 **Ring:** ${ring}`);
    } else {
      return message.channel.send("♥️ 𝑹𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n**You are not married**.\nType `Kas marry @username` to propose 💐 to someone!");
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while performing `marriage` command.")
  }
}

export async function marry(user, message) {
  try {
    let userData = await getUserData(message.author.id);
    let invitedUserData = await getUserData(user);
    const guild = await message.channel.guild.members.fetch(user);

    if (message.author.id === user) {
      return message.channel.send(`⚠️ You can not propose yourself!`);
    }

    if (userData.family.spouse && userData.family.spouse !== user) {
      return message.channel.send(`⚠️ You are already married! 🔫`);
    } else if (userData.family.spouse && userData.family.spouse === user) {
      return message.channel.send(`⚠️ You are __already married__ to each other.`);
    } else if (userData.family.spouse) {
      return message.channel.send(`⚠️ The user is __already married__.`);
    } else {
      const title = "💍 𝑴𝒂𝒓𝒓𝒊𝒂𝒈𝒆 𝑷𝒓𝒐𝒑𝒐𝒔𝒂𝒍";
      const description = `<@${message.author.id}> has proposed 💐 to you! Do you accept **<@${guild.user.id}>**?`;
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
        });
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while sending proposal.")
  }
}

export async function divorce(user, message) {
  try {
    let userData = await getUserData(message.author.id);
    let invitedUserData = await getUserData(user);
    const guild = await message.channel.guild.members.fetch(user);

    if (userData.family.spouse && userData.family.spouse !== user) {
      message.channel.send(`⚠️ You are not married to **${guild.user.username}**.`);
    } else if (!userData.family.spouse) {
      message.channel.send(`⚠️ Find your partner first! 😸. You are __not married__.`);
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
        });
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while sending proposal.")
  }
}

export async function roses(message) {
  try {
    let userData = await getUserData(message.author.id);

    // Check if roses data exists
    if (userData && typeof userData.roses === 'number') {
      return message.channel.send(`✦ **${message.author.username}**, you have **${userData.roses}** roses! 🌹\n➺ Share roses: \`roses <amount> <@user>\``);
    } else {
      return message.channel.send(`😢 | **${message.author.username}**, you don't have any roses yet. Start buying some! \`Kas shop roses <amount>\` 🌹`);
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ An error occurred while retrieving your roses. Please try again later.");
  }
}

export async function sendRoses(toUser, amount, message) {
  try {
    let senderData = await getUserData(message.author.id);

    let recipientData = await getUserData(toUser);

    // Check if the sender has enough roses
    if (senderData.roses >= amount) {
      // Deduct roses from the sender
      senderData.roses -= amount;

      // Add roses to the recipient
      if (senderData.family.spouse && senderData.family.spouse === toUser) {
        senderData.family.bondXP += 10 * amount;
        recipientData.family.bondXP += 10 * amount;
        await updateUser(toUser, recipientData);
        await updateUser(message.author.id, senderData);

        return message.channel.send(`💖 | **${message.author.username}** has sent **${amount}** roses to their spouse <@${toUser}>! Your bond has grown stronger, increasing 💞 bondXP by ${amount * 10}! 🌹`);
      } else {
        recipientData.roses = (recipientData.roses || 0) + amount;
        await updateUser(toUser, recipientData);
        await updateUser(message.author.id, senderData);

        return message.channel.send(`🌹 | **${message.author.username}** has sent **${amount}** roses to <@${toUser}>! 🌹`);
      }

    } else {
      // Notify the sender they don't have enough roses
      return message.channel.send(`🚫 | **${message.author.username}**, you don’t have enough roses to send.`);
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ An error occurred while sending roses. Please try again later.");
  }
}

export async function dailyRewards(userId, username, context) {
  try {
    const currentTime = Date.now();
    const nextClaim = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const userData = await getUserData(userId);

    if (!userData?.family?.spouse) {
      return await handleMessage(context, {
        content: "♥️ 𝑹𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n**You are not married**.\nType `Kas marry @username` to propose 💐 to someone!"
      });
    }

    if (userData && userData?.family.dailyReward && (currentTime - Number(userData.family.dailyReward)) < nextClaim) {
      // Calculate remaining time
      const timeLeft = nextClaim - (currentTime - Number(userData.family.dailyReward));
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return await handleMessage(context, {
        content: `Sorry **${username}**, you have **already claimed** your daily ***💍 marriage reward*** for today.\n` +
        `Next reward in ⏳ **${hours} hours & ${minutes} minutes**. 🎁\n`
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
      userData.roses += rosesClaimed;
      userData.family.dailyReward = currentTime;

      await updateUser(userId, userData);

      let messageForm = {
        content: `🎁💍 **𝓓𝓪𝓲𝓵𝔂 𝓶𝓪𝓻𝓻𝓲𝓪𝓰𝓮 𝓻𝓮𝔀𝓪𝓻𝓭 𝓬𝓵𝓪𝓲𝓶𝓮𝓭!**\n**${username}** received:\n` +
        `+ <:kasiko_coin:1300141236841086977> **${cashExt}**\n` +
        `+ 🌹 **${rosesClaimed}**\n` +
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
  sendRoses
}

export default {
  name: "marriage",
  description: "Manage marriages and related actions. A marriage's BondXP can be increased by sending roses to your spouse. After reaching a certain amount of BondXP, you can expect a child. Married users can enjoy an additional 0.25 boost to their daily rewards.",
  aliases: ["marry",
    "divorce",
    "love",
    "roses",
    "m"],
  args: "<command> [parameters]",
  example: [
    "marry <@user>",
    // Marry a user
    "divorce <@user>",
    // Divorce a user
    "marriage",
    "marriage daily",
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
      if (args[0] === "marry") {
        if (args[1] && Helper.isUserMention(args[1], message)) {
          return Marriage.marry(Helper.extractUserId(args[1]), message); // Marry a user
        }
        return message.channel.send("⚠️ Please mention a user to marry. Example: `marry @user`");
      }

      if (args[0] === "divorce") {
        if (args[1] && Helper.isUserMention(args[1], message)) {
          return Marriage.divorce(Helper.extractUserId(args[1]), message); // Divorce a user
        }
        return message.channel.send("⚠️ Please mention a user to divorce. Example: `divorce @user`");
      }
      if (args[0] === "roses") {
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
        return message.channel.send("⚠️ Please mention a user to marry. Example: `marry @user`");

      case "divorce":
        if (args[2] && Helper.isUserMention(args[2], message)) {
          return Marriage.divorce(Helper.extractUserId(args[2]), message); // Divorce a user
        }
        return message.channel.send("⚠️ Please mention a user to divorce. Example: `divorce @user`");

      case "roses":
        if (args[2] && Helper.isNumber(args[2]) && Helper.isUserMention(args[3], message)) {
          return Marriage.sendRoses(Helper.extractUserId(args[3]), parseInt(args[2]), message); // Send roses to a user
        }
        return Marriage.roses(message); // Show the roses system info if no arguments are provided
      case "daily":
        return dailyRewards(message.author.id, message.author.username, message);

      case "ring":
        const ringId = args[2];

        if (!ringId) {
          return await message.channel.send(`⚠️ Please mention the 💍 ring ID you want to set on your marriage profile!`);
        }

        return setMarriageRing(message, ringId);

      default:
        const embed = new EmbedBuilder()
        .setColor('#FF69B4') // Beautiful pink color
        .setTitle('💞 Marriage Command Guide')
        .setDescription('Here’s how to use the marriage commands effectively:')
        .addFields(
          {
            name: '💍 Marry', value: 'marry <@username>'
          },
          {
            name: '💔 Divorce', value: 'divorce <@username>'
          },
          {
            name: '💒 Marriage Info', value: 'marriage or m'
          },
          {
            name: '🌹 Send Roses', value: 'roses <@username (optional)> <amount>'
          }
        )

        return await message.channel.send({
          embeds: [embed]
        })
      }
    } catch (e) {
      console.error(e);
    }
  }
};