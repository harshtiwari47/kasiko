import {
  getUserData,
  updateUser
} from '../database.js';

export async function toss(id, amount, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = getUserData(id)

    if (userData.cash <= 250) {
      return channel.send("⚠️ You don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **250**.");
    } else if (amount <= 250) {
      return channel.send("⚠️ minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **250**.");
    }

    let random = Math.random() * 100;
    let winamount = 0;

    if (random < 45) {
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