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
  client
} from '../../../bot.js';

import {
  ALLITEMS
} from "./shopIDs.js";

import {
  sellCommand as SellAnimal
} from "../wildlife/sellCommand.js";

import {
  ITEM_DEFINITIONS
} from '../../inventory.js';


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
        "## <:warning:1366050875243757699> 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n" +
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
        return await ITEM_DEFINITIONS['rose'].buyHandler([num], context);
      }
      if (Helper.isNumber(amountArg)) {
        const num = parseInt(amountArg, 10);
        if (num > 0) {
          return await ITEM_DEFINITIONS['rose'].buyHandler([num], context);
        } else {
          return handleMessage(context, "<:warning:1366050875243757699> Please specify a valid number of roses to buy.");
        }
      } else {
        return handleMessage(context, "<:warning:1366050875243757699> Please specify a valid amount of roses to buy.\nExample: `buy roses <amount>`");
      }

    case "scratch":
      // buy scratch cards
      {
        if (!amountArg) {
          amountArg = 1;
        }
        const amt = parseInt(amountArg, 10);
        if (isNaN(amt) || amt <= 0) {
          return handleMessage(context, `❌ ${username}, please specify a valid number of scratch cards to buy.`);
        }

        return await ITEM_DEFINITIONS['scratch_card'].buyHandler([amt], context);
      }

    default:
      return await handleMessage(context, {
        content:
        "## <:warning:1366050875243757699> 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗\n" +
        "Please make sure you have provided the correct **item ID**.\n\n" +
        "**USAGE:** ` buy `**`<itemId> <?amount> `**\n" +
        "❔ **HELP:** ` help buy `"
      });
    }
  }
};