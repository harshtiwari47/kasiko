import {
  ActionRowBuilder,
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
  ITEM_DEFINITIONS,
  findItemByIdOrAlias
} from '../../inventory.js';

export default {
  name: 'share',
  description: 'Share (send) an item from your inventory to another user.',
  aliases: ['gift'],
  args: '<itemId> <@targetUser> [amount]',
  emoji: '🫂',
  category: '🛍️ Shop',
  example: [
    'share roses @user 10',
    'share teddy @user',
  ],
  cooldown: 10000,
  async execute(args, context) {
    try {
      const { id: senderId, name: senderName } = discordUser(context);

      // Expect: args[0] = command name, args[1] = itemId, args[2] = mention, args[3] = amount (optional)
      const itemArg = args[1]?.toLowerCase();
      if (!itemArg) {
        return handleMessage(context, {
          content:
            "## <:warning:1366050875243757699> 𝗜𝗧𝗘𝗠 𝗡𝗢𝗧 𝗦𝗣Ε𝗖𝗜𝗙𝗜𝗘𝗗\n" +
            "Please provide the **item ID** to share.\n\n" +
            "**USAGE:** `share <itemId> <@user> [amount]`\n" +
            "❔ **HELP:** `help share`",
        });
      }

      // Find the item definition
      const itemDef = findItemByIdOrAlias(itemArg);
      if (!itemDef) {
        return handleMessage(context, {
          content: `<:alert:1366050815089053808> **${senderName}**, unknown item: **\`${itemArg}\`**.`,
        });
      }

      // Check if item is shareable
      if (!itemDef?.shareable || typeof itemDef?.shareHandler !== "function") {
        return handleMessage(context, {
          content: `<:alert:1366050815089053808> **${senderName}**, the item **${itemDef.name}** cannot be shared.`,
        });
      }

      // Extract target user from mentions
      let targetUser = null;
      if (context?.mentions?.users) {
        targetUser = context.mentions.users.first() || null;
      } else if (context.interaction) {
        try {
          targetUser = context.interaction.options.getUser('targetUser') || null;
        } catch {
          targetUser = null;
        }
      }
      if (!targetUser) {
        return handleMessage(context, {
          content:
            `<:warning:1366050875243757699> **${senderName}**, you must mention a valid user to share with.\n\n` +
            `**USAGE:** \`share ${itemDef.id} @User [amount]\``,
        });
      }
      if (targetUser.id === senderId) {
        return handleMessage(context, {
          content: `<:warning:1366050875243757699> **${senderName}**, you can't share **${itemDef.name}** with yourself.`,
        });
      }

      const amountArg = args[3];
      let amount = 1;
      if (amountArg !== undefined) {
        const parsed = parseInt(amountArg);
        if (isNaN(parsed) || parsed < 1) {
          return handleMessage(context, {
            content: `<:warning:1366050875243757699> **${senderName}**, invalid amount: \`${amountArg}\`.`,
          });
        }
        amount = parsed;
      }

      const shareArgs = [itemDef.id, targetUser, amount];

      return await itemDef.shareHandler(shareArgs, context);
    } catch (err) {
      return handleMessage(context, {
        content:
          "<:warning:1366050875243757699> Something went wrong while trying to share that item.",
      });
    }
  },
};