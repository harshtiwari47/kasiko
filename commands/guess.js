import {
  getUserData,
  updateUser
} from '../database.js';

export async function guess(id, amount, number, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = getUserData(id)
    
    if (!Number.isInteger(Number(number)) || Number(number) <= 0 || Number(number) > 10) {
      return channel.send("⚠️ Please guess integer number between 1-10.");
    } else if (userData.cash < 500) {
      return channel.send("⚠️ You don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **500** to play **Guess The Number**.");
    } else if (amount < 500) {
      return channel.send("⚠️ minimum cash to play **Guess The Number** is <:kasiko_coin:1300141236841086977> **500**.");
    }

    let random = Math.floor(Math.random() * 10) + 1;
    let winamount = 0;
    console.log(random)

    if (Number(number) === random) {
      winamount = Number(amount * 2.5).toFixed(0) || 0;
      userData.cash += Number(winamount);
      updateUser(id, userData);
      return channel.send(`𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀  **@${guild.user.username}** 🎉!\nYou have won <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You guessed the correct number.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`);
    } else {
      winamount = Number(-1 * amount) || 0;
      userData.cash += Number(winamount);
      updateUser(id, userData);
      return channel.send(`🚨 Oops! **@${guild.user.username}**, you lost <:kasiko_coin:1300141236841086977>**${winamount}** 𝑪𝒂𝒔𝒉. You guessed the wrong number.`);
    }

  } catch (e) {
    console.log(e)
    return channel.send("Oops! something went wrong while guessing the number 🪙!");
  }
}