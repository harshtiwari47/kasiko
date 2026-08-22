import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Helper,
  handleMessage,
  discordUser
} from '../../../helper.js';

export async function guess(id, amount, number, context) {
  try {
    const { name, username } = discordUser(context);
    const userId = id || discordUser(context).id;

    const userData = await getUserData(userId);
    if (!userData) {
      return await handleMessage(context, "⚠️ User account not found.");
    }

    const numParsed = parseInt(number, 10);
    const amountParsed = parseInt(amount, 10);

    if (isNaN(numParsed) || numParsed < 1 || numParsed > 10) {
      return await handleMessage(context, "⚠️ Please guess an integer number between 1-10.");
    }

    if (isNaN(amountParsed) || amountParsed < 1) {
      return await handleMessage(context, "⚠️ Minimum cash to play **Guess The Number** is <:kasiko_coin:1300141236841086977> **1**.");
    }

    if (Number(userData.cash || 0) < amountParsed) {
      return await handleMessage(context, `⚠️ **${name}**, you don't have <:kasiko_coin:1300141236841086977> **${amountParsed.toLocaleString()}** cash.`);
    }

    const random = Math.floor(Math.random() * 10) + 1;

    // Fresh balance fetch to prevent race conditions
    const freshUser = await getUserData(userId);
    const currentCash = Number(freshUser?.cash || 0);

    if (currentCash < amountParsed) {
      return await handleMessage(context, `⚠️ **${name}**, you don't have enough cash.`);
    }

    if (numParsed === random) {
      const winAmount = Math.floor(amountParsed * 4);
      await updateUser(userId, {
        cash: currentCash + winAmount
      });
      return await handleMessage(context, `🎉 **Congratulations ${name}!**\nYou won <:kasiko_coin:1300141236841086977> **${winAmount.toLocaleString()}** 𝑪𝒂𝒔𝒉 by correctly guessing **${random}**!\n✦⋆ 𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`);
    } else {
      await updateUser(userId, {
        cash: Math.max(0, currentCash - amountParsed)
      });
      return await handleMessage(context, `🚨 **Oops! ${name}**, you lost <:kasiko_coin:1300141236841086977> **${amountParsed.toLocaleString()}** 𝑪𝒂𝒔𝒉. The correct number was **${random}**.`);
    }

  } catch (e) {
    console.error('Guess Error:', e);
    return await handleMessage(context, `ⓘ Oops! Something went wrong while playing Guess The Number.`);
  }
}

export default {
  name: "guess",
  description: "Guess a number (1-10). Win 4x your stake—or lose it all!",
  aliases: ["guessno", "gn"],
  args: "<amount> <number>",
  example: ["guess 500 7"],
  related: ["tosscoin", "cash"],
  emoji: "❓",
  cooldown: 10000,
  category: "🎲 Games",

  execute: async (args, message) => {
    try {
      const { id: authorId, name } = discordUser(message);

      if (args[1] && args[2] && Helper.isNumber(args[1]) && Helper.isNumber(args[2])) {
        const amount = parseInt(args[1], 10);
        const guessedNumber = parseInt(args[2], 10);

        if (amount < 1) {
          return await handleMessage(message, "⚠️ Minimum bet amount is <:kasiko_coin:1300141236841086977> 1.");
        }

        if (amount > 200000) {
          return await handleMessage(message, `⚠️ **${name}**, maximum bet allowed for Guess The Number is <:kasiko_coin:1300141236841086977> 200,000 cash.`);
        }

        if (guessedNumber < 1 || guessedNumber > 10) {
          return await handleMessage(message, "⚠️ Guess an integer number between 1 and 10.");
        }

        await guess(authorId, amount, guessedNumber, message);
      } else {
        return await handleMessage(message, "⚠️ Invalid arguments! Usage: `guess <amount> <number (1-10)>`.");
      }
    } catch (e) {
      console.error('Guess Execute Error:', e);
    }
  }
};