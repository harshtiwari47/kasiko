import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
} from 'discord.js';
import {
  Mining
} from '../../../models/Mining.js';
import {
  randomMetalsReward
} from "./dragon/powers.js";
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper
} from '../../../helper.js';

const COAL_EMOJI = '<:coal:1312372037058170950>';
const COAL_VALUE = 100; // 1 coal = 100 cash

async function startMining(message) {
  const userId = message.author.id;

  try {
    // Try to find the user's mining session from the database
    const userMining = await Mining.findOne({
      userId
    });

    // If the user is already mining, check time elapsed and potential overflow
    if (userMining && userMining.startTime) {
      const timeElapsedMillis = Date.now() - new Date(userMining.startTime);

      const days = Math.floor(timeElapsedMillis / (1000 * 60 * 60 * 24)); // Days
      const hours = Math.floor((timeElapsedMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); // Hours
      const minutes = Math.floor((timeElapsedMillis % (1000 * 60 * 60)) / (1000 * 60)); // Minutes

      let timeElapsed = '';
      if (days > 0) timeElapsed += `${days} day${days > 1 ? 's': ''} `;
      if (hours > 0) timeElapsed += `${hours} hour${hours > 1 ? 's': ''} `;
      if (minutes > 0) timeElapsed += `${minutes} minute${minutes > 1 ? 's': ''}`;

      return message.channel.send(`⛏️ **${message.author.username}**, you are already mining! Time elapsed: ${timeElapsed}.`);
    }

    // If no mining session exists, create a new one
    const updatedMining = await Mining.findOneAndUpdate(
      {
        userId
      },
      {
        startTime: new Date()
      },
      {
        upsert: true, new: true
      }
    );

    const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle("⛏️ Mining Started!")
    .setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/coal-mine.jpg")
    .setDescription(
      `**${message.author.username}**, you have started mining. You can collect resources every 10 minutes. Your storage capacity is **${10 + updatedMining.level * 5}** coal.`
    )
    .setFooter({
      text: "Type 'mine collect' to gather your coal."
    });

    message.channel.send({
      embeds: [embed]
    });
  } catch (error) {
    console.error("Error in startMining:", error);
    message.channel.send("⚠️ Something went wrong while starting your mining session. Please try again later.");
  }
}

async function collectResources(message) {
  const userId = message.author.id;
  const userMining = await Mining.findOne({
    userId
  });

  if (!userMining || !userMining.startTime) {
    return message.channel.send(`⛏️ **${message.author.username}**, you are not currently mining. Start mining with \`mine\`.`);
  }

  const timeElapsed = Math.floor((Date.now() - new Date(userMining.startTime)) / 600000); // Coal per 10 minutes
  if (timeElapsed <= 0) {
    return message.channel.send("⛏️ Not enough time has passed to collect resources.");
  }

  const coalToAdd = Math.min(timeElapsed + userMining.level, 10 + userMining.level * 5 - userMining.collected);
  if (coalToAdd <= 0) {
    return message.channel.send(`⛏️ **${message.author.username}**, your storage is full! Exchange coal or upgrade your level.`);
  }

  userMining.collected += coalToAdd;
  userMining.startTime = new Date();
  await userMining.save();

  let metalFound = null;

  if (Math.random() > 0.85) {
    metalFound = await randomMetalsReward(userId);
  }

  const embed = new EmbedBuilder()
  .setColor(0x0f1714)
  .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/coal-mine.jpg`)
  .setTitle("⛏️ 𝐑𝐞𝐬𝐨𝐮𝐫𝐜𝐞𝐬 𝐂𝐨𝐥𝐥𝐞𝐜𝐭𝐞𝐝")
  .setDescription(`**${message.author.username}**, you collected **${coalToAdd} ${COAL_EMOJI}**\nCurrent storage: **${userMining.collected} ${COAL_EMOJI}**\n${metalFound ? "Wait, you’ve found something while mining:" + metalFound: ""}`)
  .setFooter({
    text: "Type 'mine exchange' to convert coal to cash."
  });

  message.channel.send({
    embeds: [embed]
  });
}

async function exchangeCoal(message) {
  const userId = message.author.id;
  const userMining = await Mining.findOne({
    userId
  });
  const userData = await getUserData(userId);

  if (!userMining || userMining.collected <= 0) {
    return message.channel.send(`⛏️ **${message.author.username}**,
      you have no coal to exchange.`);
  }

  const coalExchanged = userMining.collected;
  const cashEarned = coalExchanged * COAL_VALUE;

  userData.cash += cashEarned;
  // Update UserData and reset collected coal
  await updateUser(userId, userData);

  userMining.collected = 0;
  await userMining.save();

  const embed = new EmbedBuilder()
  .setColor(0xf4e500)
  .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/coal-mine.jpg`)
  .setTitle("⛏️💰 𝐄𝐱𝐜𝐡𝐚𝐧𝐠𝐞 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞")
  .setDescription(`**${message.author.username}**, you exchanged **${coalExchanged} ${COAL_EMOJI}** for <:kasiko_coin:1300141236841086977> **${cashEarned.toLocaleString()} cash**.`)
  .setFooter({
    text: "Keep mining for more resources!"
  });

  message.channel.send({
    embeds: [embed]
  });
}

async function mineHelp(message) {
  const embed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle("⛏️ Mining Help")
  .setDescription("Here are the commands to help you with mining:")
  .addFields(
    {
      name: "**`mine`**", value: "Start your mining session. Collect coal every 10 minutes."
    },
    {
      name: "**`mine collect`**", value: "Collect the coal you have gathered from your mining session."
    },
    {
      name: "**`mine status`**", value: "Check your current mining status, including level, storage capacity, and collected coal."
    },
    {
      name: "**`mine exchange`**", value: `Convert your coal into cash. One coal is equivalent to ${
      COAL_VALUE
      } cash`
    },
    {
      name: "**`mine upgrade`**", value: "Upgrade your mining level to increase storage capacity and mining efficiency."
    },
  )
  .setFooter({
    text: "Use these commands to manage your mining. Happy mining!"
  });

  message.channel.send({
    embeds: [embed]
  });
}

async function viewMiningStatus(message) {
  const userId = message.author.id;
  const userMining = await Mining.findOne({
    userId
  });

  if (!userMining) {
    return message.channel.send(`⛏️ **${
      message.author.username
      }**,
      you haven't started mining yet. Start mining with \`mine\`.`);
  }

  const timeElapsed = Math.floor((Date.now() - new Date(userMining.startTime)) / 600000); // Minutes divided by 10
  const availableCoal = Math.min(timeElapsed + userMining.level, 10 + userMining.level * 5 - userMining.collected);

  const embed = new EmbedBuilder()
  .setColor(0x17140f)
  .setTitle("⛏️ 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬")
  .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/coal-mine.jpg`)
  .addFields(
    {
      name: "Level", value: `${userMining.level}`, inline: true
    },
    {
      name: "Storage Capacity", value: `${10 + userMining.level * 5} ${COAL_EMOJI}`, inline: true
    },
    {
      name: "Collected", value: `${userMining.collected} ${COAL_EMOJI}`, inline: true
    },
    {
      name: "Available to Collect", value: `${availableCoal} ${COAL_EMOJI}`, inline: true
    },
    {
      name: "Upgrade Cost", value: `<:kasiko_coin:1300141236841086977> ${(5000 * userMining.level).toLocaleString()}`, inline: true
    }
  )
  .setFooter({
    text: "Type 'mine collect' to gather your coal or 'mine exchange <amount>' to convert coal to cash."
  });

  message.channel.send({
    embeds: [embed]
  });
}

async function upgradeMine(message) {
  const userId = message.author.id;

  try {
    const userMining = await Mining.findOne({
      userId
    });

    if (!userMining) {
      return message.channel.send(`⛏️ **${message.author.username}**, you haven't started mining yet. Start mining with \`mine\`.`);
    }

    const maxLevel = 10;
    if (userMining.level >= maxLevel) {
      return message.channel.send(`⛏️ **${message.author.username}**, you have already reached the maximum mining level!`);
    }

    const upgradeCost = 5000 * userMining.level;

    const userData = await getUserData(userId);

    // Check if the user has enough cash for the upgrade
    if (userData.cash < upgradeCost) {
      return message.channel.send(`⛏️ **${message.author.username}**, you don't have enough cash to upgrade your mine. You need **${upgradeCost} cash**.`);
    }

    // Deduct the cash for the upgrade
    userData.cash -= upgradeCost;
    await updateUser(userId, userData);

    userMining.level += 1;

    const newCapacity = 10 + userMining.level * 5;

    await userMining.save();

    const embed = new EmbedBuilder()
    .setColor(0x0f122a)
    .setTitle("⛏️ 𝐌𝐢𝐧𝐞 𝐔𝐩𝐠𝐫𝐚𝐝𝐞𝐝!")
    .setDescription(
      `Congratulations! **${message.author.username}**, your mining level has increased to **Level ${userMining.level}**. Your new storage capacity is **${newCapacity} coal**. You spent <:kasiko_coin:1300141236841086977> **${upgradeCost.toLocaleString()} cash** on the upgrade.`
    )
    .setFooter({
      text: "Type 'mine collect' to gather your coal."
    });

    message.channel.send({
      embeds: [embed]
    });
  } catch (error) {
    console.error("Error in upgradeMine:", error);
    message.channel.send("⚠️ Something went wrong while upgrading your mine. Please try again later.");
  }
}

export default {
  name: "mine",
  description: "Start mining, collect resources, or exchange coal for cash. Type `mine help` for more info!",
  aliases: [],
  category: "🌱 Explore",
  cooldown: 100000,
  execute: async (args, message) => {
    try {
      const action = args[1] ? args[1].toLowerCase(): "mine";

      if (!args[1]) {
        return await startMining(message);
      }

      switch (action) {
      case "collect":
        await collectResources(message);
        break;
      case "status":
        await viewMiningStatus(message);
        break;
      case "upgrade":
        await upgradeMine(message);
        break;
      case "exchange":
        await exchangeCoal(message);
        break;
      case "help":
        await mineHelp(message);
        break;
      default:
        return message.channel.send("⛏️ Invalid command! Use `status`, `help`, `upgrade`, `collect`, or `exchange`.");
      }
    } catch (e) {
      console.error(e);
      return message.channel.send(`⚠️ Oops, something went wrong in mining!`)
    }
  },
};