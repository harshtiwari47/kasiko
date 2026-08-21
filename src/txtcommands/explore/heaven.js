import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  EmbedBuilder
} from "discord.js";
import { discordUser, handleMessage } from '../../../helper.js';
import { sendErrorLog } from '../../../utils/errorLogger.js';

import HeavenGates from '../../../models/Heaven.js';

async function getHourlyHeavenGates() {
  const currentHour = new Date().toISOString().slice(0, 13); // "YYYY-MM-DD-HH"

  // Check if a path already exists for the current hour
  let pathData = await HeavenGates.findOne({
    hour: currentHour
  });

  if (!pathData) {
    const gates = ["North",
      "South",
      "East",
      "West"];
    const path = Array.from({
      length: 5
    }, () => gates[Math.floor(Math.random() * gates.length)]);

    pathData = new HeavenGates( {
      hour: currentHour,
      path
    });

    await pathData.save();
  }

  return [pathData["_id"].toString(),
    pathData.path];
}

export async function playGate(id, context) {
  try {
    const { username } = discordUser(context);
    let userData = await getUserData(id);

    if (userData.cash < 10) {
      return handleMessage(context, `⚠️ **${username}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **10**.`);
    }

    // Fetch the hourly path
    const hourlyPath = await getHourlyHeavenGates();

    if (!userData.heaven || !userData.heaven[0] || userData.heaven[0] !== hourlyPath[0]) {
      userData.heaven = [hourlyPath[0], 0, 0];
    }

    if (userData.heaven && userData.heaven[0] === hourlyPath[0] && parseInt(userData.heaven[1]) >= 3) {
      return handleMessage(context, `⛩️ **${username}**, you have reached the maximum limit for Heaven. Come back later!`);
    }

    if (userData.heaven && parseInt(userData.heaven[2]) === 1) {
      return handleMessage(context, `⛩️ **${username}**, you have already completed the current Heaven. Come back later!`);
    }

    // Deduct entry fee
    const entryFee = 100;
    userData.cash -= entryFee;
    await updateUser(id, userData);

    let userWins = 0;

    // Initialize the game
    const embed1 = new EmbedBuilder()
    .setColor('#c6e0ea') // A refreshing blue color
    .setDescription(`☁️ Welcome to **Heaven**, **${username}**! ⛩️\nYou must choose the correct gate for **5 rounds** to win!\nEntry fee: <:kasiko_coin:1300141236841086977> ${entryFee}`)
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/heaven.jpg`);

    await handleMessage(context, {
      embeds: [embed1]
    });

    let gameMessage = await handleMessage(context, `🌟 Starting the game... Get ready!`);

    for (let i = 1; i <= hourlyPath[1].length; i++) {
      const correctPath = hourlyPath[1][i - 1];

      // Ask user to pick a gate
      const filter = response => response.author?.id === id && ["North", "South", "East", "West"].includes(response.content?.trim());

      if (gameMessage && gameMessage.edit) {
        await gameMessage.edit(`🔮 **Round ${i}/5**: Choose your gate: \`North, South, East, West\``).catch(() => {});
      }

      // Wait for user response
      const channel = context.channel || (context.client?.channels?.cache?.get(context.channelId));
      const collected = channel?.awaitMessages ? await channel.awaitMessages({
        filter,
        max: 1,
        time: 15000,
        errors: ['time']
      }).catch(() => null) : null;

      if (!collected) {
        userData.heaven[1] = Number(userData.heaven[1]) + 1;
        await updateUser(id, userData);
        if (gameMessage && gameMessage.edit) {
          await gameMessage.edit(`⏱️ Time's up, **${username}**! You didn't choose a gate in time. Game over.`).catch(() => {});
        }
        return handleMessage(context, `⏱️ Time's up, **${username}**!`);
      }

      const userChoice = collected.first().content.trim();

      // Check if the user choice matches the correct path
      if (userChoice === correctPath) {
        userWins++;
        return handleMessage(context, `✅ **Correct!** The correct gate was \`${correctPath}\`. You've made it through round ${i}!`);
      } else {
        userData.heaven[1] = Number(userData.heaven[1]) + 1;
        await updateUser(id, userData);
        return handleMessage(context, `❌ **Wrong!** The correct gate was \`${correctPath}\`. You chose \`${userChoice}\`. Game over.`);
      }
    }

    // Determine the outcome
    if (userWins === hourlyPath[1].length) {
      const prize = 30000; // Winning prize
      userData.heaven[2] = 1;
      userData.cash += prize;
      await updateUser(id, userData);
      return handleMessage(context, `🎉 **Congratulations, ${username}!** You've completed all rounds and won <:kasiko_coin:1300141236841086977> ${prize.toLocaleString()} cash!`);
    } else {
      return handleMessage(context, `🔚 Better luck next time, **${username}**! You completed ${userWins} round(s).`);
    }
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    sendErrorLog(e, {
      source: 'Heaven Gate Game',
      commandName: 'heaven',
      user: context.author || context.user,
      guild: context.guild,
      channel: context.channel,
      interaction: context.isCommand ? context : null
    }).catch(() => {});
    return handleMessage(context, "Oops! Something went wrong while playing the Gate game 🏰!");
  }
}

export default {
  name: "heaven",
  description: "Play the Heaven game, where you must choose the correct path for 5 rounds to win within 3 attempts. You can get help from your friends. The Heaven game updates every 12 hours.",
  aliases: ["gates",
    "gate"],
  args: "",
  example: ["gate",
    "heaven"],
  related: ["tosscoin",
    "slots",
    "dice"],
  emoji: "👼🏻",
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🍬 Explore",

  execute: async (args, message) => {
    try {
      const user = discordUser(message);
      if (!message.author) {
        message.author = message.user || { id: user.id, username: user.username, displayAvatarURL: () => user.avatar };
      }
      return playGate(user.id, message);
    } catch (e) {
      console.error(e);
      sendErrorLog(e, {
        source: 'Heaven Command',
        commandName: 'heaven',
        user: message.author || message.user,
        guild: message.guild,
        channel: message.channel,
        interaction: message.isCommand ? message : null
      }).catch(() => {});
      return handleMessage(message, "Oops! Something went wrong while playing Heaven gates!");
    }
  }
};