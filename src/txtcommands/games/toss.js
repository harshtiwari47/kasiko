import {
  getUserData,
  updateUser
} from '../../../database.js';

import { Helper } from '../../../helper.js';

export async function toss(id, amount, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = getUserData(id)

    if (userData.cash < 250) {
      return channel.send("⚠️ You don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **250**.");
    } else if (amount < 250) {
      return channel.send("⚠️ minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **250**.");
    }

    let random = Math.random() * 100;
    let winamount = 0;

    if (random < 50) {
      winamount = Number(amount * 1.2).toFixed(0) || 0;
      userData.cash += Number(winamount);
      updateUser(id, userData);
      return channel.send(`𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀 **@${guild.user.username}** 🎉!\nYou have won <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You tossed a 🪙 coin and you got heads.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`);
    } else {
      winamount = Number(-1 * amount) || 0;
      userData.cash += Number(winamount);
      updateUser(id, userData);
      return channel.send(`🚨 Oops! **@${guild.user.username}**, you lost <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You tossed a 🪙 coin and you got tails.`);
    }

  } catch (e) {
    console.log(e)
    return channel.send("Oops! something went wrong while tossing a coin 🪙!");
  }
}

export default {
  name: "tosscoin",
  description: "Play a coin toss game by betting an amount. Win or lose based on the result.",
  aliases: ["tc"],
  args: "<amount>",
  example: "tosscoin 250",
  related: ["guess", "gamble", "cash"],
  cooldown: 2000, // 2 seconds cooldown
  category: "Games",

  // Main function to execute the coin toss logic
  execute: (args, message) => {
    // Check if a valid amount argument is provided
    if (args[1] && Helper.isNumber(args[1])) {
      const amount = parseInt(args[1]);

      // Ensure amount is within valid range
      if (amount < 250) {
        return message.channel.send("⚠️ Minimum bet amount is 250.");
      }

      // Call the Gamble module's toss function
      toss(message.author.id, amount, message.channel);
    } else {
      // Send usage error if the amount argument is invalid
      message.channel.send("⚠️ Invalid cash amount! Amount should be an integer. Use `tosscoin <amount>`.");
    }
  }
};