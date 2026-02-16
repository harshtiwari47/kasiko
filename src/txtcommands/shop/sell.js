import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  ContainerBuilder,
  MessageFlags
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
import {
  exchangeFlowers
} from "../explore/garden.js";
import {
  ITEM_DEFINITIONS,
  findItemByIdOrAlias
} from '../../inventory.js';

export default {
  name: 'sell',
  description: 'Sell items such as cars, structures, jewelry, animals, and flowers.\n-# Garden flowers can be sold together. To sell all animals, use `sell animals`.',
  aliases: [],
  args: '<itemId> [amount|all]',
  emoji: '🏷️',
  example: [
    "sell panda all",
    "sell vanguard",
    "sell animals",
    "sell ring3",
    "sell flowers",
    "sell tiger 2"
  ],
  category: '🛍️ Shop',
  cooldown: 10000,

  async execute(args, context) {
    const itemIdArg = args[1]?.toLowerCase() ?? null;
    const amountArg = args[2]?.toLowerCase() ?? null;
    const username = context.user?.username || context.author?.username || 'User';
    const userId = context.user?.id || context.author?.id;

    if (!itemIdArg) {
      return handleMessage(context, {
        content:
        "## <:warning:1366050875243757699> 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n" +
        "Please make sure you have provided the correct **item ID**.\n\n" +
        "**USAGE:** `sell <itemId> <?amount>`\n" +
        "❔ **HELP:** `help sell`"
      });
    }

    const itemId = itemIdArg;
    const itemEntry = ALLITEMS.find(item => item?.id?.toLowerCase() === itemId);
    const category = itemEntry?.category;

    if (category) {
      switch (category) {
      case "car":
        return Car.sellcar(context, itemId);

      case "structure":
        return Structure.sellstructure(context, itemId);

      case "jewellery":
      case "jewelry":
        return JEWELRY.sellJewelryItem(context, itemId);

      case "animals":
        // For animals: if amountArg is "all", sellAll = true, else parseInt(amountArg)
        return SellAnimal(context, {
          animalName: itemId,
          sellAll: amountArg === "all",
          amount: amountArg === "all" ? 1: parseInt(amountArg, 10) || 1
        });

      case "allanimals":
        return SellAnimal(context, {
          animalName: itemId,
          sellAll: amountArg === "all",
          amount: amountArg === "all" ? 1: parseInt(amountArg, 10) || 1,
          sellEvery: true
        });

      case "flowers":
        const msgReply = await exchangeFlowers(userId, username);
        return await handleMessage(context, {
          content: msgReply
        })
      }
    }

    // Check if it's an inventory item
    const itemDef = findItemByIdOrAlias(itemId);
    if (itemDef && itemDef.sellable && itemDef.sellPrice) {
      const userData = await getUserData(userId);
      if (!userData) {
        return await handleMessage(context, {
          content: `<:warning:1366050875243757699> Could not retrieve your data. Please try again later.`
        });
      }

      const itemCount = userData.inventory?.[itemDef.id] || 0;
      
      if (itemCount < 1) {
        return await handleMessage(context, {
          content: `❌ You don't have any ${itemDef.emoji} **${itemDef.name}** to sell.`
        });
      }
      
      const sellAmount = amountArg === "all" ? itemCount : (parseInt(amountArg, 10) || 1);
      
      if (sellAmount < 1 || sellAmount > itemCount) {
        return await handleMessage(context, {
          content: `❌ Invalid amount. You have **${itemCount}** ${itemDef.emoji} **${itemDef.name}**.`
        });
      }
      
      const totalPrice = sellAmount * itemDef.sellPrice;
      const newCash = userData.cash + totalPrice;
      
      // Update user
      await updateUser(userId, {
        cash: newCash,
        [`inventory.${itemDef.id}`]: Math.max(itemCount - sellAmount, 0)
      });
      
      const Container = new ContainerBuilder()
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`### ✅ **ITEM SOLD**`),
          textDisplay => textDisplay.setContent(`Sold **${sellAmount}** ${itemDef.emoji} **${itemDef.name}** for <:kasiko_coin:1300141236841086977> **${totalPrice.toLocaleString()}**`),
          textDisplay => textDisplay.setContent(`-# Remaining: **${itemCount - sellAmount}** | New balance: <:kasiko_coin:1300141236841086977> **${newCash.toLocaleString()}**`)
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
      "**USAGE:** ` sell `**`<itemId> <?amount> `**\n" +
      "❔ **HELP:** ` help sell `"
    });
  }
};