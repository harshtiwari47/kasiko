import {
  getUserData,
  updateUser
} from '../../../database.js';

import { Helper } from '../../../helper.js';

export async function guess(id, amount, number, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id)
    
    if (!Number.isInteger(Number(number)) || Number(number) <= 0 || Number(number) > 10) {
      return channel.send("⚠️ Please guess integer number between 1-10.");
    } else if (userData.cash < 500) {
      return channel.send("⚠️ You don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **500** to play **Guess The Number**.");
    } else if (amount < 500) {
      return channel.send("⚠️ minimum cash to play **Guess The Number** is <:kasiko_coin:1300141236841086977> **500**.");
    }

    let random = Math.floor(Math.random() * 10) + 1;
    let winamount = 0;

    if (Number(number) === random) {
      winamount = Number(amount * 2.5).toFixed(0) || 0;
      userData.cash += Number(winamount);
      updateUser(id, userData);
      return channel.send(`𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀  **@${guild.user.username}** 🎉!\nYou have won <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You guessed the correct number.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`);
    } else {
      winamount = Number(-1 * amount) || 0;
      userData.cash += Number(winamount);
      await updateUser(id, userData);
      return channel.send(`🚨 Oops! **@${guild.user.username}**, you lost <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You guessed the wrong number. The number is **${random}**.`);
    }

  } catch (e) {
    console.log(e)
    return channel.send("Oops! something went wrong while guessing the number 🪙!");
  }
}

export default {
  name: "guess",
  description: "Make a guess in a cash-betting game. Try to guess a number between 1 and 10.",
  aliases: ["g", "guessno", "gn"],
  args: "<amount> <number>",
  example: "guess 500 7",
  related: ["tosscoin", "cash"],
  cooldown: 5000, // 5 seconds cooldown
  category: "Games",

  // Main function to execute the guessing game logic
  execute: (args, message) => {
    // Check if the correct number of arguments is provided
    if (args[1] && args[2] && Helper.isNumber(args[1]) && Helper.isNumber(args[2])) {
      const amount = parseInt(args[1]);
      const guessedNumber = parseInt(args[2]);

      // Ensure amount and guessed number are within valid ranges
      if (amount < 500) {
        return message.channel.send("⚠️ Minimum bet amount is 500.");
      }
      if (guessedNumber < 1 || guessedNumber > 10) {
        return message.channel.send("⚠️ Guess a number between 1 and 10.");
      }

      // Call the Gamble module's guess function
      guess(message.author.id, amount, guessedNumber, message.channel);
    } else {
      // Send usage error if arguments are invalid
      message.channel.send("⚠️ Invalid cash amount or number! Cash and number should be integers. Use `guess <amount> <number>`.");
    }
  }
};