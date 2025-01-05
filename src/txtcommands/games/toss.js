import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Helper
} from '../../../helper.js';

export async function toss(id, amount, channel, choice = "head") {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (amount === "all") amount = userData.cash;

    if (amount > 200000) {
      return channel.send(`⚠️ **${guild.user.username}**, you can't tosscoin more than <:kasiko_coin:1300141236841086977> 200,000 cash.`);
    }

    // Check if the user has enough cash and if the amount is valid
    if (userData.cash < 1) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
    } else if (amount < 1) {
      return channel.send("⚠️ Minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **1**.");
    }

    if (userData.cash < Number(amount)) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`);
    }

    // Send a suspenseful message
    const suspenseMessage = await channel.send(`🔮 Tossing the coin... It's spinning in the air... 🪙 The fate of **${guild.user.username}** cash is on the line...`);

    // Simulate a short delay to build suspense
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay for better effect

    // Randomly decide the result of the coin toss
    let random = Math.floor(Math.random() * 2);
    let winamount = 0;

    if (random === 1 && choice === "head") {
      winamount = Number(amount * 1).toFixed(0) || 0;
      userData.cash += Number(winamount);
    } else if (random === 0 && choice === "tail") {
      winamount = Number(amount * 1).toFixed(0) || 0;
      userData.cash += Number(winamount);
    } else {
      winamount = Number(-1 * amount) || 0;
      userData.cash += Number(winamount);
    }

    // Save updated user data to the database
    await updateUser(id, userData);

    // Edit the initial "thinking" message to the final result
    if (random === 1 && choice === "head") {
      await suspenseMessage.edit(`**${guild.user.name}**, you did it! 💸\nThe coin 🪙 landed on _heads_!\nYou \`won\` <:kasiko_coin:1300141236841086977>**${Number(2* winamount).toLocaleString()}** 𝑪𝒂𝒔𝒉!\n-# Fortune is on your side today!`);
    } else if (random === 0 && choice === "tail") {
      await suspenseMessage.edit(`**${guild.user.name}**, victory is yours! 💸\nThe coin 🪙 landed on _tails_!\nYou \`won\` <:kasiko_coin:1300141236841086977>**${Number(2* winamount).toLocaleString()}** 𝑪𝒂𝒔𝒉!\n-# Luck favors you this time!`);
    } else {
      await suspenseMessage.edit(`Oops, **${guild.user.name}**, fate wasn't kind! 🌪️\nThe coin 🪙 landed on _${choice === "tail" ? "heads": "tails"}_... You \`lost\` <:kasiko_coin:1300141236841086977>**${Number(winamount).toLocaleString()}** 𝑪𝒂𝒔𝒉.\nBetter luck next time!`);
    }

  } catch (e) {
    console.log(e);
    return channel.send("Oops! Something went wrong while tossing the coin 🪙!");
  }
}

export default {
  name: "tosscoin",
  description: "Play a coin toss game by betting an amount. Win or lose based on the result.",
  aliases: ["tc"],
  args: "<amount>",
  example: ["tosscoin 250",
    "tc 250 head",
    "tc 250 t"],
  related: ["slots",
    "cash",
    "dice",
    "guess"],
  cooldown: 8000,
  // 8 seconds cooldown
  category: "🎲 Games",

  // Main function to execute the coin toss logic
  execute: (args, message) => {
    // Check if a valid amount argument is provided
    if ((args[1] && Helper.isNumber(args[1])) || args[1] === "all") {

      let amount;

      if (args[1] === "all") {
        amount = "all";
      } else {
        amount = parseInt(args[1]);
      }

      // Ensure amount is within valid range
      if (amount !== "all" && amount < 1) {
        return message.channel.send("⚠️ Minimum bet amount is <:kasiko_coin:1300141236841086977> 1.");
      }

      let choice = args[2] && (args[2] === "t" || args[2] === "tails" || args[2] === "tail") ? "tail": "head";
      // Call the Gamble module's toss function
      toss(message.author.id, amount, message.channel, choice);
    } else {
      // Send usage error if the amount argument is invalid
      return message.channel.send("⚠️ Invalid cash amount! Amount should be an integer. Use `tosscoin <amount> <choice heads(h)/tails(t) (optional)>`, default choice is heads.");
    }
  }
};