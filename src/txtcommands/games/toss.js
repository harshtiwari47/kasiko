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
  handleMessage
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

    if (amount === "all") {
      amount = Math.min(300000, Number(userData.cash || 0));
    } else {
      amount = parseInt(amount, 10);
    }

    if (isNaN(amount) || amount < 1 || !Number.isInteger(amount)) {
      return await handleMessage(ctx, "<:warning:1366050875243757699> Minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **1**.");
    }

    if (amount > 300000) amount = 300000;

    if (userData.cash < 1) {
      return await handleMessage(ctx, `<:warning:1366050875243757699> **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
    }

    if (userData.cash < amount) {
      return await handleMessage(ctx, `<:warning:1366050875243757699> **${name}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`);
    }

    // Deduct bet amount
    await updateUser(userId, {
      cash: Math.max(0, Number(userData.cash || 0) - amount)
    });

    const spiningCoin = `<a:SpinningCoin:1326785405399597156>`;
    const stillCoin = `<:StillCoin:1326414822841253980>`;
    const stillCoinTails = `<:StillTails:1326786766438400113>`;

    const Container = new ContainerBuilder()
      .addTextDisplayComponents(text =>
        text.setContent(`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\n` +
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

    if (random === 1 && choice === "head") {
      winamount = amount * 2;
      won = true;
    } else if (random === 0 && choice === "tail") {
      winamount = amount * 2;
      won = true;
    }

    if (won) {
      const freshData = await getUserData(userId);
      const newCash = Number(freshData?.cash || 0) + winamount;
      await updateUser(userId, { cash: newCash });
    }

    let content = "";
    if (random === 1 && choice === "head") {
      content = `**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${stillCoin} landed on **heads**!\n***✦ You won <:kasiko_coin:1300141236841086977> ${Number(winamount).toLocaleString()} 𝑪𝒂𝒔𝒉***.`;
    } else if (random === 0 && choice === "tail") {
      content = `**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${stillCoinTails} landed on **tails**!\n***✦ You won <:kasiko_coin:1300141236841086977>*** **${Number(winamount).toLocaleString()}** ***𝑪𝒂𝒔𝒉***.`;
    } else {
      content = `**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${choice === "tail" ? stillCoin : stillCoinTails} landed on **${choice === "tail" ? "heads" : "tails"}**...\n***⚠ You lost the bet.***`;
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
  example: ["tosscoin 250 heads", "toss 500 t", "coinflip all h"],
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
      if ((args[1] && Helper.isNumber(args[1])) || String(args[1]).toLowerCase() === "all") {
        let amount = String(args[1]).toLowerCase() === "all" ? "all" : parseInt(args[1], 10);

        if (amount !== "all" && (isNaN(amount) || amount < 1)) {
          return await handleMessage(context, "<:warning:1366050875243757699> Minimum bet amount is <:kasiko_coin:1300141236841086977> 1.");
        }

        if (amount !== "all" && amount > 300000) {
          return await handleMessage(context, `<:warning:1366050875243757699> **${username}**, you can't tosscoin more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
        }

        let choice = args[2] && (args[2] === "t" || args[2] === "tails" || args[2] === "tail") ? "tail" : "head";
        await toss(id, context, amount, null, choice);
      } else {
        await handleMessage(context, "⨳ 𝘐𝘯𝘷𝘢𝘭𝘪𝘥 𝘤𝘢𝘴𝘩 𝘢𝘮𝘰𝘶𝘯𝘵*!*\n\n"
          + "**Use:** `tosscoin <`**`amount`**`> <`**`choice`**`>`\n"
          + "- **Choice**: `heads(h) | tails(t)`\n"
          + "-# ᴅᴇꜰᴀᴜʟᴛ ᴄʜᴏɪᴄᴇ ɪꜱ ʜᴇᴀᴅꜱ.");
      }
    } catch (err) {
      console.error(err);
    }
  }
};