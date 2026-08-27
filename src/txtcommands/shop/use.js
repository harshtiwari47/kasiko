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
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';
import {
  ITEM_DEFINITIONS,
  findItemByIdOrAlias
} from '../../inventory.js';

export default {
  name: 'use',
  description: 'Use an item from your inventory.',
  aliases: ['useitem',
    'consume'],
  args: '<itemId> [targetUser]',
  emoji: '🕹️',
  category: '🛍️ Shop',
  example: [
    'use scratch',
    'use candle',
    'use drink',
  ],
  cooldown: 10000,
  async execute(args, context) {
    try {
      const {
        id,
        name,
        username
      } = discordUser(context);

      const itemArg = args[1]?.toLowerCase();
      if (!itemArg) {
        return handleMessage(context, {
          content:
          "## <:warning:1366050875243757699> 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗦𝗣Ε𝗖𝗜𝗙𝗜𝗘𝗗\n" +
          "Please provide the **item ID** to use.\n\n" +
          "**USAGE:** `kas use <itemId> [@targetUser]`\n" +
          "❔ **HELP:** `kas help use`"
        });
      }

      const itemDef = findItemByIdOrAlias(itemArg);
      if (!itemDef) {
        return handleMessage(context, {
          content:
          `<:alert:1366050815089053808> **${name}**, unknown item: **\` ${itemArg} \`**.`
        });
      }

      // Check if this item is useable or activatable
      if (!itemDef.useable && !itemDef.activatable) {
        return handleMessage(context, {
          content:
          `<:alert:1366050815089053808> **${name}**, the item **${itemDef.name}** cannot be used/activated.`
        });
      }

      if (typeof itemDef.useHandler === "function") {
        return await itemDef.useHandler(args, context);
      }
    } catch (err) {
      console.error('Error in use command:', err);
      return handleMessage(context, {
        content:
        "<:warning:1366050875243757699> Something went wrong while trying to use that item."
      });
    }
  }
};