import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import ContainerMessage from '../../../models/Containers.js';

export default {
  name: 'embed-trigger',
  description: 'Set the trigger event for the embed.',
  args: false,
  aliases: ['embed-on',
    'embedtrigger',
    'embed-when',
    'embedtrigger'],
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
      const triggerType = args?.pop()?.toLowerCase();
      const embedName = args.shift()?.trim();

      if (!embedName || !triggerType) {
        return handleMessage(context, {
          content: '❌ Usage: `/embed-trigger <embedName> <trigger>`\n**Triggers:** join, boost, leave, respond, default',
        });
      }

      // Validate trigger type
      const validTriggers = ['join',
        'boost',
        'leave',
        'respond',
        'default'];
      if (!validTriggers.includes(triggerType)) {
        return handleMessage(context, {
          content: `❌ Invalid trigger type. Valid options: ${validTriggers.map(t => `\`${t}\``).join(', ')}`,
        });
      }

      // Find the embed to update
      const container = await ContainerMessage.findOne({
        server: guild.id,
        name: embedName,
      });

      if (!container) {
        return handleMessage(context, {
          content: `⚠️ No embed container named **${embedName}** exists in this server.`,
        });
      }

      // If setting join/leave/boost, reset any existing embed with that trigger
      if (['join', 'leave', 'boost'].includes(triggerType)) {
        const existingTrigger = await ContainerMessage.findOne({
          server: guild.id,
          on: triggerType,
        });

        if (existingTrigger && existingTrigger.name !== embedName) {
          existingTrigger.on = 'default';
          await existingTrigger.save();
        }
      }

      await ContainerMessage.findOneAndUpdate(
        {
          server: guild.id,
          name: embedName
        },
        {
          $set: {
            on: triggerType
          }
        }
      );

      return handleMessage(context, {
        content: `✅ The embed **${embedName}** will now trigger on **${triggerType}**.`,
      });

    } catch (error) {
      return handleMessage(context, {
        content: `❌ An unexpected error occurred while setting the embed trigger.\n**Error**: ${error.message}`,
      });
    }
  },
};