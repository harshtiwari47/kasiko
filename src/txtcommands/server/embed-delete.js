import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import ContainerMessage from '../../../models/Containers.js';

export default {
  name: 'embed-delete',
  description: 'Delete an existing container message.',
  args: false,
  aliases: ['deleteembed',
    'embeddelete',
    'embedremove',
    'removeembed'],
  category: 'server',
  emoji: "📦",
  visible: false,
  cooldown: 10000,

  async execute(args, context) {
    try {
      const {
        member,
        guild
      } = context;
      const {
        name
      } = discordUser(context);

      if (!member.permissions.has('ManageGuild')) {
        return handleMessage(context, {
          content: `🚫 **${name}**, you need the **Manage Server** permission to use this command.`,
        });
      }

      args.shift();
      const embedName = args.join(' ').trim();

      if (!embedName || typeof embedName !== 'string' || embedName.length > 50) {
        return handleMessage(context, {
          content: '❌ Please provide a valid embed name (up to 50 characters). Example:\n`/embed-delete welcome-message`',
        });
      }

      const existing = await ContainerMessage.findOne({
        server: guild.id,
        name: embedName,
      });

      if (!existing) {
        return handleMessage(context, {
          content: `⚠️ No embed container named **${embedName}** exists in this server.`,
        });
      }

      await existing.deleteOne();

      return handleMessage(context, {
        content: `✅ Successfully deleted the embed container named **${embedName}**.`,
      });

    } catch (error) {
      return handleMessage(context, {
        content: `❌ An unexpected error occurred while deleting the embed.\nPlease try again later or contact a developer if the issue persists.\n**Error**: ${error.message}`,
      });
    }
  },
};