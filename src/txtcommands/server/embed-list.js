import ContainerMessage from '../../../models/Containers.js';
import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ContainerBuilder,
  MessageFlags
} from "discord.js";

export default {
  name: 'embed-list',
  description: 'List all created container messages in this server.',
  aliases: ['el',
    'list-embeds',
    'container-list'],
  category: 'server',
  emoji: "📦",
  visible: false,
  cooldown: 5000,

  async execute(args, context) {
    try {
      const {
        guild
      } = context;
      const {
        name
      } = discordUser(context);

      const containers = await ContainerMessage.find({
        server: guild.id
      });

      if (!containers.length) {
        return handleMessage(context, {
          content: `📭 **${name}**, there are no embed containers created in this server yet.`,
        });
      }

      const list = containers
      .map((c, i) => `### ${i + 1}. **${c.name}**\n<:reply:1368224908307468408> **Trigger:** ${c.on || 'default'} **Channel:** <#${c.channelId || 'Not Set'}>`)
      .join('\n');

      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt =>
        txt.setContent(`📦 **List of Embed Containers in this server:**\n${list || "None"}`)
      );

      return await handleMessage(context, {
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Error in embed-list command:', error);

      return handleMessage(context, {
        content: `❌ An unexpected error occurred while fetching embed containers. Please try again later.`,
      });
    }
  },
};