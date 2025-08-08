import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType
} from 'discord.js';

import ContainerMessage from '../../../models/Containers.js';
import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

export default {
  name: 'embed-create',
  description: 'Create or manage a container message using buttons.',
  args: false,
  aliases: ['ce', 'createembed', 'create-embed', 'embedcreate'],
  category: 'server',
  emoji: '📦',
  visible: false,
  cooldown: 10000,

  async execute(args, context) {
    try {
      const { author, member, channel, guild, client, message } = context;
      const { name, id: userId } = discordUser(context);

      if (!member.permissions.has('ManageGuild')) {
        return handleMessage(context, {
          content: `🚫 **${name}**, you need the **Manage Server** permission to use this command.`,
        });
      }

      args.shift(); // Remove command name
      const embedName = args.join(' ').trim();

      if (!embedName || typeof embedName !== 'string' || embedName.length > 50) {
        return handleMessage(context, {
          content: '❌ Please provide a valid embed name (text up to 50 characters). Example:\n`/embed-create welcome-message`',
        });
      }

      const existing = await ContainerMessage.findOne({
        server: guild.id,
        name: embedName,
      });

      if (existing) {
        return handleMessage(context, {
          content: `⚠️ A container with the name **${embedName}** already exists in this server. Please choose a different name.`,
        });
      }

      const newEmbed = new ContainerMessage({
        server: guild.id,
        name: embedName,
        on: 'default',
        createdBy: userId,
      });

      await newEmbed.save();

      return handleMessage(context, {
        content: `✅ Successfully created a new embed container named **${embedName}**.\nUse **\`embed-edit ${embedName} \`** to customize it.`,
      });
    } catch (error) {
      return handleMessage(context, {
        content: `❌ An unexpected error occurred while creating the embed.\nPlease try again later or contact a developer if the issue persists.\n**Error**: ${error.message}`,
      });
    }
  },
};