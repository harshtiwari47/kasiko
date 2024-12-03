import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  EmbedBuilder
} from "discord.js";

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

export async function playGate(id, channel, message) {
  try {
    let userData = await getUserData(id);

    if (userData.cash < 10) {
      return channel.send(`⚠️ **${message.author.username}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **10**.`);
    }

    // Fetch the hourly path
    const hourlyPath = await getHourlyHeavenGates();

    if (!userData.heaven || !userData.heaven[0] || userData.heaven[0] !== hourlyPath[0]) {
      userData.heaven = [hourlyPath[0],
        0,
        0]
    }

    if (userData.heaven && userData.heaven[0] === hourlyPath[0] && parseInt(userData.heaven[1]) >= 3) {
      return channel.send(`⛩️ **${message.author.username}**, you have reached the maximum limit for Heaven. Come back later!`);
    }

    if (userData.heaven && parseInt(userData.heaven[2]) === 1) {
      return channel.send(`⛩️ **${message.author.username}**, you have already completed the current Heaven. Come back later!`);
    }

    // Deduct entry fee
    const entryFee = 100;
    userData.cash -= entryFee;
    await updateUser(id, userData);

    let userWins = 0;

    // Initialize the game
    const embed1 = new EmbedBuilder()
    .setColor('#c6e0ea') // A refreshing blue color
    .setDescription(`☁️ Welcome to **Heaven**,
      **${message.author.username}**! ⛩️\nYou must choose the correct gate for **5 rounds** to win!\nEntry fee: <:kasiko_coin:1300141236841086977> ${
      entryFee
      }`)
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/heaven.jpg`);
    channel.send({
      embeds: [embed1]
    });

    let gameMessage = await channel.send(`🌟 Starting the game... Get ready!`);

    for (let i = 1; i <= hourlyPath[1].length; i++) {
      const correctPath = hourlyPath[1][i - 1];

      // Ask user to pick a gate
      const filter = response => response.author.id === id && ["North",
        "South",
        "East",
        "West"].includes(response.content.trim());
      await gameMessage.edit(`🔮 **Round ${i}/5**: Choose your gate: \`North, South, East, West\``);

      // Wait for user response
      const collected = await channel.awaitMessages({
        filter,
        max: 1,
        time: 15000,
        errors: ['time']
      }).catch(() => null);

      if (!collected) {
        userData.heaven[1] = Number(userData.heaven[1]) + 1;
        await updateUser(id, userData);
        await gameMessage.edit(`⏱️ Time's up, **${message.author.username}**! You didn't choose a gate in time. Game over.`);
        await channel.send(`⏱️ Time's up, **${message.author.username}**!`);
        return;
      }

      const userChoice = collected.first().content.trim();

      // Check if the user choice matches the correct path
      if (userChoice === correctPath) {
        userWins++;
        await channel.send(`✅ **Correct!** The correct gate was \`${correctPath}\`. You've made it through round ${i}!`);
      } else {
        userData.heaven[1] = Number(userData.heaven[1]) + 1;
        await updateUser(id, userData);
        await channel.send(`❌ **Wrong!** The correct gate was \`${correctPath}\`. You chose \`${userChoice}\`. Game over.`);
        break;
      }
    }

    // Determine the outcome
    if (userWins === hourlyPath[1].length) {
      const prize = 1000; // Winning prize
      userData.heaven[2] = 1;
      userData.cash += prize;
      await updateUser(id, userData);
      await channel.send(`🎉 **Congratulations, ${message.author.username}!** You've completed all rounds and won <:kasiko_coin:1300141236841086977> ${prize.toLocaleString()} cash!`);
    } else {
      await channel.send(`🔚 Better luck next time, **${message.author.username}**! You completed ${userWins} round(s).`);
    }
  } catch (e) {
    console.error(e);
    return channel.send("Oops! Something went wrong while playing the Gate game 🏰!");
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
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🌱 Explore",

  execute: (args, message) => {
    try {
      return playGate(message.author.id, message.channel, message);
    } catch (e) {
      console.error(e)
    }
  }
};