import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper,
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
  ALLITEMS
} from "./shopIDs.js";
import {
  ITEM_DEFINITIONS,
  findItemByIdOrAlias
} from '../../inventory.js';

export default {
  name: 'buy',
  description: 'Purchase items: car, structure, jewelry, roses, scratch cards, animal food, etc.',
  aliases: ["purchase"],
  args: '<category/itemId> [amount]',
  emoji: '🛒',
  category: '🛍️ Shop',
  example: [
    "buy vanguard",
    "buy ring3",
    "buy scratch 3",
    "buy roses 5",
    "buy food 10",
    "buy premium_food 2"
  ],
  cooldown: 5000,

  async execute(args, context) {
    try {
      const subArg = args[1]?.toLowerCase() ?? null; // itemId
      const amountArg = args[2]?.toLowerCase() ?? null;
      const username = context.user?.username || context.author?.username || 'User';
      const userId = context.user?.id || context.author?.id;

      if (!subArg) {
        return await handleMessage(context, {
          content:
            "## <:warning:1366050875243757699> 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n" +
            "Please make sure you have provided the correct **item ID**.\n\n" +
            "**USAGE:** `kas buy <itemId> [amount]`\n" +
            "❔ **HELP:** `kas help buy`"
        });
      }

      // 1. Check special shop categories (cars, structures, jewelry)
      const itemId = subArg;
      const itemEntry = ALLITEMS.find(item => item?.id?.toLowerCase() === itemId);
      const category = itemEntry?.category;

      if (category) {
        switch (category) {
          case "car":
            return Car.buycar(context, itemId);

          case "structure":
            return Structure.buystructure(context, itemId);

          case "jewellery":
          case "jewelry":
            return JEWELRY.buyJewelryItem(context, itemId);
        }
      }

      // 2. Check general inventory items
      const itemDef = findItemByIdOrAlias(itemId);
      if (itemDef && itemDef.purchaseable && itemDef.price) {
        let amount = 1;
        if (amountArg) {
          amount = parseInt(amountArg, 10);
          if (isNaN(amount) || amount < 1) {
            return handleMessage(context, `<:warning:1366050875243757699> **${username}**, please specify a valid amount to buy.`);
          }
        }

        // If custom buyHandler exists (e.g. roses, scratch cards with custom embeds/images)
        if (typeof itemDef.buyHandler === 'function') {
          return await itemDef.buyHandler([amount], context);
        }

        // Generic purchase logic
        const userData = await getUserData(userId);
        if (!userData) {
          return handleMessage(context, `<:warning:1366050875243757699> Could not retrieve your account data.`);
        }

        const totalCost = amount * itemDef.price;
        if ((userData.cash || 0) < totalCost) {
          return handleMessage(context, {
            content: `<:warning:1366050875243757699> **${username}**, you need <:kasiko_coin:1300141236841086977> **${totalCost.toLocaleString()} Cash** to purchase **${amount}** ${itemDef.emoji} **${itemDef.name}** (Current balance: ${userData.cash.toLocaleString()}).`
          });
        }

        const currentCount = userData.inventory?.[itemDef.id] || 0;
        const newCount = currentCount + amount;
        const newCash = userData.cash - totalCost;

        await updateUser(userId, {
          cash: newCash,
          [`inventory.${itemDef.id}`]: newCount
        });

        const Container = new ContainerBuilder()
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`### 🛒 **ITEM PURCHASED**`),
            textDisplay => textDisplay.setContent(`**${username}**, you bought **${amount}** ${itemDef.emoji} **${itemDef.name}** for <:kasiko_coin:1300141236841086977> **${totalCost.toLocaleString()} Cash**!`),
            textDisplay => textDisplay.setContent(`-# You now own **${newCount}** ${itemDef.name} | New balance: <:kasiko_coin:1300141236841086977> **${newCash.toLocaleString()}**`)
          );

        return await handleMessage(context, {
          components: [Container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      return await handleMessage(context, {
        content:
          "## <:warning:1366050875243757699> 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n" +
          "Please make sure you have provided the correct **item ID**.\n\n" +
          "**USAGE:** `kas buy <itemId> [amount]`\n" +
          "❔ **HELP:** `kas help buy`"
      });

    } catch (err) {
      console.error('[BuyCommand] Error executing buy:', err);
      return handleMessage(context, `<:alert:1366050815089053808> An error occurred while processing your purchase.`);
    }
  }
};