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

function capitalizeStrict(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export async function toss(id, context, amount, channel, choice = "head") {
  try {
    const guild = await channel.guild.members.fetch(id);
    const {
      name
    } = discordUser(context);

    let userData = await getUserData(id);

    if (!userData) return;
    if (!guild) return;

    if (amount === "all") {
      amount = Math.min(300000, Number(userData.cash || 0));
    } else {
      amount = parseInt(amount, 10);
    }

    if (isNaN(amount) || amount < 1 || !Number.isInteger(amount)) {
      return await handleMessage(context, "<:warning:1366050875243757699> Minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **1**.");
    }

    if (amount > 300000) amount = 300000;

    if (userData.cash < 1) {
      return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
    }

    if (userData.cash < amount) {
      return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`);
    }

    // Deduct bet amount
    await updateUser(id, {
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
    .setAccentColor(Math.floor(Math.random() * 16777216))

    // Send a suspenseful message
    const suspenseMessage = await handleMessage(context,
      {
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      });

    // Simulate a short delay to build suspense
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Randomly decide the result of the coin toss
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
      const freshData = await getUserData(id);
      const newCash = Number(freshData?.cash || 0) + winamount;
      await updateUser(id, { cash: newCash });
    }

    let content = "";

    // Edit the initial message to the final result
    if (random === 1 && choice === "head") {
      content = (`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${stillCoin} landed on **heads**!\n***✦ You won <:kasiko_coin:1300141236841086977> ${Number(winamount).toLocaleString()} 𝑪𝒂𝒔𝒉***.`);
    } else if (random === 0 && choice === "tail") {
      content = (`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${stillCoinTails} landed on **tails**!\n***✦ You won <:kasiko_coin:1300141236841086977>*** **${Number(winamount).toLocaleString()}** ***𝑪𝒂𝒔𝒉***.`);
    } else {
      won = false;
      content = (`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${choice === "tail" ? stillCoin: stillCoinTails} landed on **${choice === "tail" ? "heads": "tails"}**...\n***⚠ You lost the bet.***`);
    }

    Container.components[0].data.content = content;
    Container.setAccentColor(won ? 0x58d1ab : null)

    suspenseMessage.edit({
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

    return;
  } catch (err) {
    console.error("Error during coin toss:", err);
  }
}

export default {
  name: "tosscoin",
  description: "Toss a coin with heads and tails!",
  aliases: ["toss",
    "coinflip",
    "cf",
    "flipcoin"],
  args: "<amount> <choice: h/t>",
  example: ["tosscoin 250 heads",
    "toss 500 t",
    "coinflip all h"],
  related: ["dice",
    "cash",
    "slots",
    "guess"],
  emoji: "🪙",
  cooldown: 10000,
  category: "🎲 Games",

  // Main function to execute the coin toss logic
  execute: async (args, message) => {
    try {
      if ((args[1] && Helper.isNumber(args[1])) || String(args[1]).toLowerCase() === "all") {
        let amount;

        if (String(args[1]).toLowerCase() === "all") {
          amount = "all";
        } else {
          amount = parseInt(args[1], 10);
        }

        if (amount !== "all" && (isNaN(amount) || amount < 1)) {
          await message.channel.send("<:warning:1366050875243757699> Minimum bet amount is <:kasiko_coin:1300141236841086977> 1.");
          return;
        }

        if (amount !== "all" && amount > 300000) {
          await message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you can't tosscoin more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
          return;
        }

        let choice = args[2] && (args[2] === "t" || args[2] === "tails" || args[2] === "tail") ? "tail": "head";
        await toss(message.author.id, message, amount, message.channel, choice);
      } else {
        await message.channel.send("⨳ 𝘐𝘯𝘷𝘢𝘭𝘪𝘥 𝘤𝘢𝘴𝘩 𝘢𝘮𝘰𝘶𝘯𝘵*!*\n\n"
          + "**Use:** `tosscoin <`**`amount`**`> <`**`choice`**`>`\n"
          + "- **Choice**: `heads(h) | tails(t)`\n"
          + "-# ᴅᴇꜰᴀᴜʟᴛ ᴄʜᴏɪᴄᴇ ɪꜱ ʜᴇᴀᴅꜱ.");
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }
};