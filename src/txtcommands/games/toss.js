import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';

import {
  Helper,
  discordUser,
  handleMessage,
  parseAmount
} from '../../../helper.js';

export async function toss(id, context, amount, channel, choice = "head") {
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
        return await handleMessage(ctx, `<:warning:1366050875243757699> **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
      }
      amount = Math.min(300000, userCash);
    } else {
      const parsed = typeof amount === 'number' ? Math.floor(amount) : parseAmount(amount);
      amount = (parsed === 'all' || parsed === 'max') ? Math.min(300000, userCash) : parsed;
    }

    if (amount === null || isNaN(amount) || amount < 1 || !Number.isInteger(amount)) {
      return await handleMessage(ctx, "<:warning:1366050875243757699> Minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **1**.");
    }

    if (amount > 300000) {
      return await handleMessage(ctx, `<:warning:1366050875243757699> **${name}**, you can't tosscoin more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
    }

    if (userCash < 1) {
      return await handleMessage(ctx, `<:warning:1366050875243757699> **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
    }

    if (userCash < amount) {
      return await handleMessage(ctx, `<:warning:1366050875243757699> **${name}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`);
    }

    // Deduct bet amount
    await updateUser(userId, {
      cash: Math.max(0, userCash - amount)
    });

    const spiningCoin = `<a:SpinningCoin:1326785405399597156>`;
    const stillCoin = `<:StillCoin:1326414822841253980>`;
    const stillCoinTails = `<:StillTails:1326786766438400113>`;

    const normalizedChoice = (choice === "t" || choice === "tails" || choice === "tail") ? "tail" : "head";

    const Container = new ContainerBuilder()
      .addTextDisplayComponents(text =>
        text.setContent(`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** on **${normalizedChoice}s**\n` +
          `The *coin* spins... ${spiningCoin}\n` +
          `⚡︎ Your 𝘧𝘢𝘵𝘦 𝘪𝘴 𝘰𝘯 𝘵𝘩𝘦 𝘭𝘪𝘯𝘦! `
        )
      )
      .setAccentColor(Math.floor(Math.random() * 16777216));

    const suspenseMessage = await handleMessage(ctx, {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });

    // Short suspense delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    let random = Math.floor(Math.random() * 2);
    let winamount = 0;
    let won = false;

    if (random === 1 && normalizedChoice === "head") {
      winamount = amount * 2;
      won = true;
    } else if (random === 0 && normalizedChoice === "tail") {
      winamount = amount * 2;
      won = true;
    }

    if (won) {
      const freshData = await getUserData(userId);
      const newCash = Number(freshData?.cash || 0) + winamount;
      await updateUser(userId, { cash: newCash });
    }

    let content = "";
    if (random === 1 && normalizedChoice === "head") {
      content = `**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** on **${normalizedChoice}s**\nThe *coin* ${stillCoin} landed on **heads**!\n***✦ You won <:kasiko_coin:1300141236841086977> ${Number(winamount).toLocaleString()} 𝑪𝒂𝒔𝒉***.`;
    } else if (random === 0 && normalizedChoice === "tail") {
      content = `**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** on **${normalizedChoice}s**\nThe *coin* ${stillCoinTails} landed on **tails**!\n***✦ You won <:kasiko_coin:1300141236841086977>*** **${Number(winamount).toLocaleString()}** ***𝑪𝒂𝒔𝒉***.`;
    } else {
      content = `**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** on **${normalizedChoice}s**\nThe *coin* ${normalizedChoice === "tail" ? stillCoin : stillCoinTails} landed on **${normalizedChoice === "tail" ? "heads" : "tails"}**...\n***⚠ You lost the bet.***`;
    }

    Container.components[0].data.content = content;
    Container.setAccentColor(won ? 0x58d1ab : null);

    if (suspenseMessage?.edit) {
      await suspenseMessage.edit({
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  } catch (err) {
    console.error("Error during coin toss:", err);
    await handleMessage(ctx, "<:warning:1366050875243757699> Something went wrong during coin toss.").catch(() => {});
  }
}

export default {
  name: "tosscoin",
  description: "Toss a coin with heads and tails!",
  aliases: ["toss", "coinflip", "cf", "flipcoin"],
  args: "<amount> <choice: h/t>",
  example: ["tosscoin 250 heads", "toss 500 t", "coinflip all h", "cf all", "cf max t", "cf 50k tail"],
  related: ["dice", "cash", "slots", "guess"],
  emoji: "🪙",
  cooldown: 10000,
  category: "🎲 Games",

  intract: (interaction) => {
    const bet = interaction.options?.getInteger?.('bet') || 1;
    const side = interaction.options?.getString?.('side') || 'head';
    return toss(interaction.user.id, interaction, bet, null, side);
  },

  execute: async (args, context) => {
    try {
      const { id, username } = discordUser(context);
      const rawArgs = args.slice(1);

      if (rawArgs.length === 0) {
        return await handleMessage(context, "⨳ 𝘐𝘯𝘷𝘢𝘭𝘪𝘥 𝘤𝘢𝘴𝘩 𝘢𝘮𝘰𝘶𝘯𝘵*!*\n\n"
          + "**Use:** `tosscoin <`**`amount`**`> <`**`choice`**`>`\n"
          + "- **Amount**: `1 - 300,000` | `all` | `max` (e.g. `50k`, `300k`)\n"
          + "- **Choice**: `heads (h) | tails (t)`\n"
          + "-# ᴅᴇꜰᴀᴜʟᴛ ᴄʜᴏɪᴄᴇ ɪꜱ ʜᴇᴀᴅꜱ.");
      }

      let parsedAmount = null;
      let choice = "head";

      for (const arg of rawArgs) {
        const lower = String(arg).toLowerCase().trim();
        if (["t", "tail", "tails"].includes(lower)) {
          choice = "tail";
        } else if (["h", "head", "heads"].includes(lower)) {
          choice = "head";
        } else if (parsedAmount === null) {
          const parsed = parseAmount(lower);
          if (parsed !== null) {
            parsedAmount = parsed;
          }
        }
      }

      if (parsedAmount === null) {
        return await handleMessage(context, "⨳ 𝘐𝘯𝘷𝘢𝘭𝘪𝘥 𝘤𝘢𝘴𝘩 𝘢𝘮𝘰𝘶𝘯𝘵*!*\n\n"
          + "**Use:** `tosscoin <`**`amount`**`> <`**`choice`**`>`\n"
          + "- **Amount**: `1 - 300,000` | `all` | `max` (e.g. `50k`, `300k`)\n"
          + "- **Choice**: `heads (h) | tails (t)`\n"
          + "-# ᴅᴇꜰᴀᴜʟᴛ ᴄʜᴏɪᴄᴇ ɪꜱ ʜᴇᴀᴅꜱ.");
      }

      if (typeof parsedAmount === 'number' && parsedAmount > 300000) {
        return await handleMessage(context, `<:warning:1366050875243757699> **${username}**, you can't tosscoin more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
      }

      await toss(id, context, parsedAmount, null, choice);
    } catch (err) {
      console.error(err);
    }
  }
};