import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  discordUser,
  handleMessage
} from '../../../helper.js';
import {
  Car
} from './cars.js';
import {
  Structure
} from './structures.js';
import {
  JEWELRY
} from './jewelry.js';

import {
  client
} from '../../../bot.js';

import {
  ALLITEMS
} from "./shopIDs.js";

import {
  sellCommand as SellAnimal
} from "../wildlife/sellCommand.js";

export async function buyRoses(amount, context) {
  try {
    const userId = message.author.id;
    let userData = await getUserData(userId);
    const rosesAmount = amount * 2500;

    if (userData.cash >= rosesAmount) {

      userData.cash -= rosesAmount;
      userData.roses += amount;

      await updateUser(message.author.id, userData);
      return await handleMessage(context, `**${message.author.username}** bought **${amount}** <:rose:1343097565738172488> for <:kasiko_coin:1300141236841086977>**${rosesAmount}** 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else {
      return await handleMessage(context, `⚠️ **${message.author.username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉 to purchase a <:rose:1343097565738172488>. You need <:kasiko_coin:1300141236841086977> ${rosesAmount} 𝑪𝒂𝒔𝒉`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  } catch(e) {
    console.error(e);
    return await handleMessage(context, "⚠️ Something went wrong while buying rose(s).").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}


export default {
  name: 'buy',
  description: 'Purchase items: car, structure, jewelry, roses, scratch, etc.',
  aliases: ["purchase"],
  args: '<category/itemId> [amount]',
  emoji: '🛒',
  category: '🛍️ Shop',
  example: [
    "buy vanguard",
    "buy ring3",
    "buy scratch 3",
    "buy roses 5"
  ],
  cooldown: 10000,

  async execute(args, context) {
    const subArg = args[1]?.toLowerCase() ?? null; // itemId
    const amountArg = args[2]?.toLowerCase() ?? null;
    const username = context.user?.username || context.author?.username || 'User';
    const userId = context.user?.id || context.author?.id;

    if (!subArg) {
      return await handleMessage(context, {
        content:
        "## ⚠️ 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n" +
        "Please make sure you have provided the correct **item ID**.\n\n" +
        "**USAGE:** ` buy `**`<itemId> <?amount> `**\n" +
        "❔ **HELP:** ` help buy `"
      });
    }

    // Find item category from ALLITEMS by ID
    const itemId = subArg;
    const itemEntry = ALLITEMS.find(item => item?.id?.toLowerCase() === itemId);
    const category = itemEntry?.category;

    switch (category) {
    case "car":
      return Car.buycar(context, itemId);

    case "structure":
      return Structure.buystructure(context, itemId);

    case "jewellery":
    case "jewelry":
      return JEWELRY.buyJewelryItem(context, itemId);

    case "roses":
      if (!amountArg) {
        // default to 1 if not provided
        return buyRoses(1, context);
      }
      if (Helper.isNumber(amountArg)) {
        const num = parseInt(amountArg, 10);
        if (num > 0) {
          return buyRoses(num, context);
        } else {
          return handleMessage(context, "⚠️ Please specify a valid number of roses to buy.");
        }
      } else {
        return handleMessage(context, "⚠️ Please specify a valid amount of roses to buy.\nExample: `buy roses <amount>`");
      }

    case "scratch":
      // buy scratch cards
      {
        if (!amountArg) {
          return handleMessage(context, `❌ ${username}, please specify how many scratch cards to buy, e.g., \`buy scratch 2\`.`);
        }
        const amt = parseInt(amountArg, 10);
        if (isNaN(amt) || amt <= 0) {
          return handleMessage(context, `❌ ${username}, please specify a valid number of scratch cards to buy.`);
        }
        const userData = await getUserData(userId);
        const CARD_COST = 10000;
        const totalCost = amt * CARD_COST;
        if (userData.cash < totalCost) {
          return handleMessage(context, `💸 ${username}, you need ${totalCost.toLocaleString()} to buy ${amt} scratch card(s).`);
        }
        // Deduct cash and add scratch cards
        userData.cash -= totalCost;
        userData.scratchs = (userData.scratchs || 0) + amt;
        await updateUser(userId, {
          cash: userData.cash,
          scratchs: userData.scratchs
        });
        return handleMessage(context, {
          content: `🍾 **${username.toUpperCase()}**, you bought <:scratch_card:1382990344186105911> **${amt} scratch card(s)** for <:kasiko_coin:1300141236841086977>**${totalCost.toLocaleString()}**. You now have **${userData.scratchs}** scratch card(s).\n\n-# ❔ **HOW TO SCRATCH**\n-#  \` scratch card \``
        });
      }

    default:
      return await handleMessage(context, {
        content:
        "## ⚠️ 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n" +
        "Please make sure you have provided the correct **item ID**.\n\n" +
        "**USAGE:** ` buy `**`<itemId> <?amount> `**\n" +
        "❔ **HELP:** ` help buy `"
      });
    }
  }
};