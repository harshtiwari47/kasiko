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

    if (amount === "all") amount = userData.cash;

    if (amount > 300000) amount = 300000;

    // Check if the user has enough cash and if the amount is valid
    if (userData.cash < 1) {
      return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
    } else if (amount < 1) {
      return await handleMessage(context, "<:warning:1366050875243757699> Minimum cash to toss the 🪙 coin is <:kasiko_coin:1300141236841086977> **1**.");
    }

    if (userData.cash < Number(amount)) {
      return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`);
    }

    userData = await updateUser(id, {
      cash: (userData.cash - Number(amount))
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
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay for better effect

    // Randomly decide the result of the coin toss
    let random = Math.floor(Math.random() * 2);
    let winamount = 0;

    if (random === 1 && choice === "head") {
      winamount = Number(amount * 2).toFixed(0) || 0;
      userData.cash += Number(winamount);
    } else if (random === 0 && choice === "tail") {
      winamount = Number(amount * 2).toFixed(0) || 0;
      userData.cash += Number(winamount);
    }

    // Save updated user data to the database
    await updateUser(id, {
      cash: userData.cash
    });

    let content = "";
    let won = true;

    // Edit the initial "thinking" message to the final result
    if (random === 1 && choice === "head") {
      content = (`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${stillCoin} landed on **heads**!\n***✦ You won <:kasiko_coin:1300141236841086977> ${Number(1* winamount).toLocaleString()} 𝑪𝒂𝒔𝒉***.`);
    } else if (random === 0 && choice === "tail") {
      content = (`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${stillCoinTails} landed on **tails**!\n***✦ You won <:kasiko_coin:1300141236841086977>*** **${Number(1* winamount).toLocaleString()}** ***𝑪𝒂𝒔𝒉***.`);
    } else {
      won = false;
      content = (`**${name}** 𝗋𝗂𝗌𝗄𝖾𝖽 <:kasiko_coin:1300141236841086977> **${amount}** on **${choice}s**\nThe *coin* ${choice === "tail" ? stillCoin: stillCoinTails} landed on **${choice === "tail" ? "heads": "tails"}**...\n***⚠ You lost the bet.***`);
    }

    Container.components[0].data.content = content;
    Container.setAccentColor(won ? 0x58d1ab : null)

    suspenseMessage.edit({
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    })

  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return await handleMessage(context, `ⓘ Oops! Something went wrong while tossing the coin! 🪙\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "tosscoin",
  description: "Play a coin toss game by betting an amount. Win or lose based on the result.",
  aliases: ["tc",
    "coinflip",
    "cf",
    "cointoss"],
  args: "<amount>",
  example: ["tosscoin 250",
    "tc 250 head",
    "tc 250 t"],
  related: ["slots",
    "cash",
    "dice",
    "guess"],
  emoji: "<:StillCoin:1326414822841253980>",
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🎲 Games",

  // Main function to execute the coin toss logic
  execute: async (args, message) => {
    try {
      // Check if a valid amount argument is provided
      if ((args[1] && Helper.isNumber(args[1])) || String(args[1]).toLowerCase() === "all") {

        let amount;

        if (String(args[1]).toLowerCase() === "all") {
          amount = "all";
        } else {
          amount = parseInt(args[1]);
        }

        // Ensure amount is within valid range
        if (String(amount).toLowerCase() !== "all" && amount < 1) {
          await message.channel.send("<:warning:1366050875243757699> Minimum bet amount is <:kasiko_coin:1300141236841086977> 1.");
          return;
        }

        if (String(amount).toLowerCase() !== "all" && amount > 300000) {
          await message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you can't tosscoin more than <:kasiko_coin:1300141236841086977> 300,000 cash.`);
          return;
        }

        let choice = args[2] && (args[2] === "t" || args[2] === "tails" || args[2] === "tail") ? "tail": "head";
        // Call the Gamble module's toss function
        toss(message.author.id, message, amount, message.channel, choice);
      } else {
        // Send usage error if the amount argument is invalid
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