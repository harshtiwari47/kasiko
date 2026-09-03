import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Helper,
  discordUser,
  handleMessage,
  parseAmount
} from '../../../helper.js';

export async function slots(id, amount, channel, context) {
  const ctx = context || channel;
  try {
    const userMeta = discordUser(ctx);
    const userId = id || userMeta.id;
    const name = userMeta.name || userMeta.username || 'Player';

    let userData = await getUserData(userId);
    if (!userData) {
      return await handleMessage(ctx, "<:warning:1366050875243757699> User account not found.");
    }

    const userCash = Math.floor(Number(userData.cash || 0));

    if (amount === "all" || String(amount).toLowerCase() === "all" || String(amount).toLowerCase() === "max") {
      if (userCash < 1) {
        return await handleMessage(ctx, `⚠️ **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
      }
      amount = Math.min(300000, userCash);
    } else {
      const parsed = typeof amount === 'number' ? Math.floor(amount) : parseAmount(amount);
      amount = (parsed === 'all' || parsed === 'max') ? Math.min(300000, userCash) : parsed;
    }

    if (amount === null || isNaN(amount) || amount < 1 || !Number.isInteger(amount)) {
      return await handleMessage(ctx, "⚠️ Minimum bet to play the slots is <:kasiko_coin:1300141236841086977> **1**.");
    }

    if (amount > 300000) {
      return await handleMessage(ctx, `⚠️ **${name}**, you can't spin slots with more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
    }

    if (userCash < 1) {
      return await handleMessage(ctx, `⚠️ **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
    }

    if (userCash < amount) {
      return await handleMessage(ctx, `⚠️ **${name}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`);
    }

    // Slots symbols
    const allSymbols = [
      '<:sberries:1327950598158417981>',
      '<:slemon:1327950617322459168>',
      '<:sorange:1327950638616678440>',
      '<:sgrapes:1327950719596232704>',
      '<:sdiamond:1327950737963221075>',
      '<:scash:1327950770657820764>'
    ];

    const spinResult = [
      '<a:slotsanim:1327959630915047556>',
      '<a:slotsanim:1327959630915047556>',
      '<a:slotsanim:1327959630915047556>'
    ];

    const slotBackground = `🎰 **Slot Machine**\n┌─────────────────┐\n${spinResult.join(' | ')}\n└─────────────────┘\n╚══════════╝`;

    const spinningMessage = await handleMessage(ctx, {
      content: `${slotBackground}\n**${name}** is spinning for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** 𝑪𝒂𝒔𝒉!`
    });

    const finalResult = Array.from({ length: 3 }, () =>
      allSymbols[Math.floor(Math.random() * allSymbols.length)]
    );

    await updateUser(userId, {
      cash: Math.max(0, userCash - amount)
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    let winMultiplier = 0;
    if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
      const match = finalResult[0];
      if (match === '<:scash:1327950770657820764>') winMultiplier = 10;
      else if (match === '<:sdiamond:1327950737963221075>') winMultiplier = 5;
      else winMultiplier = 3;
    } else if (finalResult[0] === finalResult[1] || finalResult[1] === finalResult[2] || finalResult[0] === finalResult[2]) {
      winMultiplier = 1.5;
    }

    let endMessage;
    if (winMultiplier > 0) {
      const wonAmount = Math.floor(amount * winMultiplier);
      const fresh = await getUserData(userId);
      await updateUser(userId, {
        cash: Number(fresh?.cash || 0) + wonAmount
      });
      endMessage = `🎉 **JACKPOT!** You won <:kasiko_coin:1300141236841086977> **${wonAmount.toLocaleString()}** cash (*${winMultiplier}x multiplier*)!`;
    } else {
      endMessage = `💔 **No luck this time!** You lost <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`;
    }

    const finalSlot = `🎰 **Slot Machine**\n┌─────────────────┐\n${finalResult.join(' | ')}\n└─────────────────┘\n╚══════════╝\n${endMessage}`;

    if (spinningMessage?.edit) {
      await spinningMessage.edit({
        content: finalSlot
      }).catch(() => handleMessage(ctx, { content: finalSlot }));
    } else {
      await handleMessage(ctx, {
        content: finalSlot
      });
    }
  } catch (err) {
    console.error("Error during slots:", err);
    await handleMessage(ctx, {
      content: "ⓘ Something went wrong during Slots!"
    }).catch(() => {});
  }
}

export default {
  name: 'slots',
  description: 'Spin the slots for a chance to win big rewards!',
  aliases: ['slot', 'sl'],
  args: '<amount>',
  example: ['slots 1000', 'slots all', 'slots max', 'slots 50k'],
  related: ['dice', 'cash', 'toss', 'blackjack'],
  emoji: '🎰',
  cooldown: 5000,
  category: '🎲 Games',

  intract: (interaction) => {
    const bet = interaction.options?.getInteger?.('bet') || 1;
    return slots(interaction.user.id, bet, null, interaction);
  },

  execute: async (args, context) => {
    try {
      const { id, username } = discordUser(context);
      const rawArg = args[1] || "1";

      const parsedAmount = parseAmount(rawArg);
      if (parsedAmount === null) {
        return await handleMessage(context, "⚠️ Please provide a valid bet amount (e.g. `slots 1000`, `slots all`, `slots 50k`).");
      }

      if (typeof parsedAmount === 'number' && parsedAmount > 300000) {
        return await handleMessage(context, `⚠️ **${username}**, you can't spin slots with more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
      }

      await slots(id, parsedAmount, null, context);
    } catch (err) {
      console.error(err);
      await handleMessage(context, `ⓘ Something went wrong in Slots!`);
    }
  }
};