import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Helper
} from '../../../helper.js';

export async function guess(id, amount, number, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (!guild || !userData) return;

    if (!Number.isInteger(Number(number)) || Number(number) <= 0 || Number(number) > 10) {
      return channel.send("⚠️ Please guess integer number between 1-10.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (userData.cash < 1) {
      return channel.send("⚠️ You don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1** to play **Guess The Number**.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (amount < 1) {
      return channel.send("⚠️ minimum cash to play **Guess The Number** is <:kasiko_coin:1300141236841086977> **1**.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    if (userData.cash < Number(amount)) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    let random = Math.floor(Math.random() * 10) + 1;
    let winamount = 0;

    if (Number(number) === random) {
      winamount = Number(amount * 4).toFixed(0) || 0;
      userData.cash += Number(winamount);
      updateUser(id, {
        cash: userData.cash
      });
      return channel.send(`𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀  **@${guild.user.username}** 🎉!\nYou have won extra <:kasiko_coin:1300141236841086977>**${winamount.toLocaleString()}** 𝑪𝒂𝒔𝒉. You guessed the correct number.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else {
      winamount = Number(-1 * amount) || 0;
      userData.cash += Number(winamount);
      await updateUser(id, {
        cash: userData.cash
      });
      return channel.send(`🚨 Oops! **@${guild.user.username}**, you lost <:kasiko_coin:1300141236841086977>**${winamount.toLocaleString()}** 𝑪𝒂𝒔𝒉. You guessed the wrong number. 🎲 The number is **${random}**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return channel.send(`ⓘ Oops! something went wrong while guessing the number! 🎲\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "guess",
  description: "Guess a number (1-10). Win 4x your stake—or lose it all!",
  aliases: ["guessno",
    "gn"],
  args: "<amount> <number>",
  example: ["guess 500 7"],
  related: ["tosscoin",
    "cash"],
  emoji: "❓",
  cooldown: 10000,
  // 8 seconds cooldown
  category: "🎲 Games",

  // Main function to execute the guessing game logic
  execute: async (args, message) => {
    // Check if the correct number of arguments is provided
    if (args[1] && args[2] && Helper.isNumber(args[1]) && Helper.isNumber(args[2])) {
      const amount = parseInt(args[1]);
      const guessedNumber = parseInt(args[2]);

      // Ensure amount and guessed number are within valid ranges
      if (amount < 1) {
        return message.channel.send("⚠️ Minimum bet amount is <:kasiko_coin:1300141236841086977> 1.");
      }

      if (amount > 200000) {
        return message.channel.send(`⚠️ **${message.author.username}**, you can't play Guess The Number more than <:kasiko_coin:1300141236841086977> 200,000 cash.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (guessedNumber < 1 || guessedNumber > 10) {
        return message.channel.send("⚠️ Guess a number between 1 and 10.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Call the Gamble module's guess function
      guess(message.author.id, amount, guessedNumber, message.channel);
      return;
    } else {
      // Send usage error if arguments are invalid
      return message.channel.send("⚠️ Invalid cash amount or number! Cash and number should be integers. Use `guess <amount> <number>`.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};