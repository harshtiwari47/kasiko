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

    if (userData.cash < 250) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **250**.`);
    } else if (amount < 250) {
      return channel.send("⚠️ Minimum bet to play the slots is <:kasiko_coin:1300141236841086977> **250**.");
    }

    if (userData.cash < amount) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have <:kasiko_coin:1300141236841086977> **${amount}** cash.`);
    }

    // Slots symbols
    const symbols = ['🍒',
      '🍋',
      '🍊',
      '🍇',
      '💎'];

    // Initial placeholders and message
    let spinResult = ['❓',
      '❓',
      '❓'];
    const slotBackground = `
    ╔══════════╗
    🎰 **Slot Machine**
    ┌─────────────────┐
    ${spinResult.join(' | ')}
    └─────────────────┘
    ╚══════════╝
    `;

    let spinningMessage = await channel.send(
      `${slotBackground}\n **${guild.user.username}** is spinning for <:kasiko_coin:1300141236841086977> **${amount}** 𝑪𝒂𝒔𝒉!`
    );

    // Final spin result
    let finalResult = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    // Simulate locking each position one by one
    for (let i = 0; i < spinResult.length; i++) {
      for (let j = 0; j < 5; j++) {
        // Spin animation for this position
        spinResult[i] = symbols[Math.floor(Math.random() * symbols.length)];
        const updatedBackground = `
        ╔══════════╗
        🎰 **Slot Machine**
        ┌─────────────────┐
        ${spinResult.join(' | ')}
        └─────────────────┘
        ╚══════════╝
        `;
        await spinningMessage.edit(
          `${updatedBackground}\n **${guild.user.username}** is spinning for <:kasiko_coin:1300141236841086977> **${amount}** 𝑪𝒂𝒔𝒉!`
        );
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      // Lock the current position
      spinResult[i] = finalResult[i];
      const updatedBackground = `
      ╔══════════╗
      🎰 **Slot Machine**
      ┌─────────────────┐
      ${spinResult.join(' | ')}
      └─────────────────┘
      ╚══════════╝
      `;
      await spinningMessage.edit(
        `${updatedBackground}\n **${guild.user.username}** is spinning for <:kasiko_coin:1300141236841086977> **${amount}** 𝑪𝒂𝒔𝒉!`
      );
    }

    // Determine win or loss
    let winAmount = 0;
    if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
      // Jackpot: all three match
      winAmount = Number(amount * 2).toFixed(0);
      userData.cash += Number(winAmount);
      await updateUser(id, userData);
      return spinningMessage.edit(
        `🎰 **${guild.user.username}, you hit a 🏆 JACKPOT!** 🎉\n` +
        `**Congratulations!** You won <:kasiko_coin:1300141236841086977> **${winAmount}** 𝑪𝒂𝒔𝒉. 🎊\n` +
        `**Final Spin result:** ${finalResult.join(' | ')}\n`
      );
    } else if (finalResult[0] === finalResult[1] || finalResult[1] === finalResult[2] || finalResult[0] === finalResult[2]) {
      // Small win: any two match
      winAmount = Number(amount * 0.5).toFixed(0);
      userData.cash += Number(winAmount);
      await updateUser(id, userData);
      return spinningMessage.edit(
        `🎰 **${guild.user.username}, you got a small win!** 🎉\n` +
        `**Well done!** You won <:kasiko_coin:1300141236841086977> **${winAmount}** 𝑪𝒂𝒔𝒉.\n` +
        `**Final Spin result:** ${finalResult.join(' | ')}\n`
      );
    } else {
      // Loss
      winAmount = -amount;
      userData.cash += Number(winAmount);
      await updateUser(id, userData);
      return spinningMessage.edit(
        `🎰 **${guild.user.username}, better luck next time!** 😔\n` +
        `**Oh no!** You lost <:kasiko_coin:1300141236841086977> **${Math.abs(winAmount)}** 𝑪𝒂𝒔𝒉.\n` +
        `**Final Spin result:** ${finalResult.join(' | ')}\n`
      );
    }
  } catch (e) {
    console.error(e);
    return channel.send("🚨 **Error!** Something went wrong while spinning the slots. Please try again later!");
  }
}

export default {
  name: "slots",
  description: "Play a slot machine game by betting an amount. Win or lose based on the result.",
  aliases: ["slotmachine",
    "slot"],
  args: "<amount>",
  example: "slots 250",
  related: ["gamble",
    "cash",
    "games"],
  cooldown: 3000,
  // 3 seconds cooldown
  category: "Games",

  // Main function to execute the slots game logic
  execute: (args, message) => {
    // Check if a valid amount argument is provided
    if (args[1] && Helper.isNumber(args[1])) {
      const amount = parseInt(args[1]);

      // Ensure amount is within valid range
      if (amount < 250) {
        return message.channel.send("⚠️ Minimum bet amount is 250.");
      }

      // Call the slots function
      slots(message.author.id, amount, message.channel);
    } else {
      // Send usage error if the amount argument is invalid
      message.channel.send("⚠️ Invalid cash amount! Amount should be an integer. Use `slots <amount>`, minimum is 250.");
    }
  }
};