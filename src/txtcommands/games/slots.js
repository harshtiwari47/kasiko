import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Helper
} from '../../../helper.js';

export async function slots(id, amount, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (!userData) return;
    if (!guild) return;

    if (amount === "all") amount = userData.cash;

    if (amount > 300000) amount = 300000;

    if (userData.cash < 1) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (amount < 1) {
      return channel.send("⚠️ Minimum bet to play the slots is <:kasiko_coin:1300141236841086977> **1**.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    if (userData.cash < amount) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Slots symbols
    const allSymbols = ['<:sberries:1327950598158417981>',
      '<:slemon:1327950617322459168>',
      '<:sorange:1327950638616678440>',
      '<:sgrapes:1327950719596232704>',
      '<:sdiamond:1327950737963221075>',
      '<:scash:1327950770657820764>'];

    const symbols = Array.from({
      length: 3
    }, () =>
      allSymbols[Math.floor(Math.random() * allSymbols.length)]
    );


    // Initial placeholders and message
    let spinResult = ['<a:slotsanim:1327959630915047556>',
      '<a:slotsanim:1327959630915047556>',
      '<a:slotsanim:1327959630915047556>'];
    const slotBackground = `
    🎰 **Slot Machine**
    ┌─────────────────┐
    ${spinResult.join(' | ')}
    └─────────────────┘
    ╚══════════╝
    `;

    let spinningMessage = await channel.send(
      `${slotBackground}\n **${guild.user.username}** is spinning for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** 𝑪𝒂𝒔𝒉!`
    );

    // Final spin result
    let finalResult = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    // Simulate locking each position one by one
    for (let i = 0; i < spinResult.length; i++) {
      // Spin animation for this position
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Lock the current position
      spinResult[i] = finalResult[i];
      const updatedBackground = `
      🎰 **Slot Machine**
      ┌─────────────────┐
      ${spinResult.join(' | ')}
      └─────────────────┘
      ╚══════════╝
      `;
      await spinningMessage.edit(
        `${updatedBackground}\n **${guild.user.username}** is spinning for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** 𝑪𝒂𝒔𝒉!`
      )
    }

    // Determine win or loss
    let winAmount = 0;
    if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
      // Jackpot: all three match
      winAmount = Number(amount * 2).toFixed(0);
      userData.cash += Number(winAmount);
      await updateUser(id, {
        cash: userData.cash
      });
      return spinningMessage.edit(
        `🎰 **${guild.user.username}, you hit a 🏆 JACKPOT!** 🎉\n` +
        `**Congratulations!** You won extra <:kasiko_coin:1300141236841086977> **${winAmount.toLocaleString()}** 𝑪𝒂𝒔𝒉. 🎊\n` +
        `**Final Spin result:** ${finalResult.join(' | ')}\n`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else {
      // Loss
      winAmount -= amount;
      userData.cash += Number(winAmount);
      await updateUser(id, {
        cash: userData.cash
      });
      return spinningMessage.edit(
        `🎰 **${guild.user.username}, better luck next time!** 😔\n` +
        `**Oh no!** You lost <:kasiko_coin:1300141236841086977> **${Math.abs(winAmount).toLocaleString()}** 𝑪𝒂𝒔𝒉.\n` +
        `**Final Spin result:** ${finalResult.join(' | ')}\n`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    await channel.send(`ⓘ Something went wrong while spinning the slots. Please try again later!\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return;
  }
}

export default {
  name: "slots",
  description: "Play a slot machine game by betting an amount. Win or lose based on the result.",
  aliases: ["slotmachine",
    "slot"],
  args: "<amount>",
  example: ["slots 250"],
  related: ["dice",
    "cash",
    "tosscoin",
    "guess"],
  emoji: "🎰",
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🎲 Games",

  // Main function to execute the slots game logic
  execute: async (args, message) => {
    try {
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
          await message.channel.send("⚠️ Minimum bet amount is <:kasiko_coin:1300141236841086977> 1.");
          return;
        }

        if (amount !== "all" && amount > 300000) {
          await message.channel.send(`⚠️ **${message.author.username}**, you can't tosscoin more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
          return;
        }

        // Call the slots function
        slots(message.author.id, amount, message.channel);
        return;
      } else {
        // Send usage error if the amount argument is invalid
        await message.channel.send("⚠️ Invalid cash amount! Amount should be an integer. Use `slots <amount>`, minimum is 1.");
        return;
      }
    } catch (err) {
      await message.channel.send(`ⓘ Something went wrong in Blackjack!\n-# **Error**: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      return;
    }
  }
};