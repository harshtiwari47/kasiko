import {
  SlashCommandBuilder
} from 'discord.js';
import {
  handleUsePower
} from '../../../utils/battleUtils.js';

export default {
  execute: async (interaction) => {
    await interaction.deferReply();

    const power = interaction.options.getString('power');

    // Call the shared battle logic
    const result = await handleUsePower( {
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      userId: interaction.user.id,
      power
    });

    // If there's a reply content (e.g., error messages)
    if (result.replyContent) {
      return interaction.followUp({
        content: result.replyContent, ephemeral: result.ephemeral
      });
    }

    // Send the ability used embed
    await interaction.followUp({
      embeds: [result.embed]
    });
  },
};