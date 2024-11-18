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
    let userData = await getUserData(id)

    if (userData.cash < 250) {
      return channel.send("⚠️ You don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **250**.");
    } else if (amount < 250) {
      return channel.send("⚠️ minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **250**.");
    }

    let random = Math.floor(Math.random() * 2);
    let winamount = 0;

    if (random === 1 && choice === "head") {
      winamount = Number(amount * 1.2).toFixed(0) || 0;
      userData.cash += Number(winamount);
      await updateUser(id, userData);
      return channel.send(`𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀 **@${guild.user.username}** 🎉!\nYou have won <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You tossed a 🪙 coin and you got heads.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`);
    } else if (random === 0 && choice === "tail") {
      winamount = Number(amount * 1.2).toFixed(0) || 0;
      userData.cash += Number(winamount);
      await updateUser(id, userData);
      return channel.send(`𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀 **@${guild.user.username}** 🎉!\nYou have won <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You tossed a 🪙 coin and you got tails.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`);
    } else {
      winamount = Number(-1 * amount) || 0;
      userData.cash += Number(winamount);
      await updateUser(id, userData);
      return channel.send(`🚨 Oops! **@${guild.user.username}**, you lost <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You tossed a 🪙 coin and you got ${choice === "tail" ? "heads" : "tails"}.`);
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
  related: ["guess",
    "gamble",
    "cash"],
  cooldown: 2000,
  // 2 seconds cooldown
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
      let choice = args[2] && (args[2] === "t" || args[2] === "tails" || args[2] === "tail") ? "tail" : "head";
      // Call the Gamble module's toss function
      toss(message.author.id, amount, message.channel, choice);
    } else {
      // Send usage error if the amount argument is invalid
      message.channel.send("⚠️ Invalid cash amount! Amount should be an integer. Use `tosscoin <amount> <choice heads(h)/tails(t) (optional)>`, default choice is heads.");
    }
  }
};
