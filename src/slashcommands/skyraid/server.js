import { SlashCommandBuilder } from 'discord.js';
import SkyraidUsers from '../../../models/SkyraidUsers.js';
import SkyraidGuilds from '../../../models/SkyraidGuilds.js';
import { EmbedBuilder } from 'discord.js';

export default {
 execute: async (interaction) => {
    try {
      await interaction.deferReply();
      const guildId = interaction.guild.id;

      // Fetch guild data
      const guildData = await SkyraidGuilds.findOne({ guildId }).populate('players');

      if (!guildData) {
        return interaction.followUp({ content: '⚔️ No battle data found for this guild yet.', ephemeral: true });
      }

      // Prepare boss defeat stats
      const bossStats = Object.entries(guildData.bossDefeated.toJSON()).map(([boss, count]) => `**${boss}**: ${count}`).join('\n-# - ');

      // Prepare badges
      const badges = guildData.badges.length > 0 ? guildData.badges.join(' ') : 'None';

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.guild.name} - 𝑺𝑲𝒀𝑹𝑨𝑰𝑫 𝑺𝑻𝑨𝑻𝑰𝑺𝑻𝑰𝑪𝑺`)
        .setColor('#4f200d') // color
        .addFields(
          { name: '🗡️ Total Matches', value: `${guildData.totalMatches}`, inline: true },
          { name: '⭐ Matches Won', value: `${guildData.matchesWon}`, inline: true },
          { name: '🚫 Matches Cancelled', value: `${guildData.matchesCancelled}`, inline: true },
          { name: '🔥 Bosses Defeated', value: "-# - " + bossStats, inline: false },
          { name: '🎖️ Guild Badges', value: badges, inline: false },
          { name: '🦸🏻 Players', value: `${guildData.players.length}`, inline: false },
        )
        .setImage(`https://harshtiwari47.github.io/kasiko-public/images/skyraid.png`);

      return interaction.followUp({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching guild stats:', error);
      return interaction.followUp({ content: '❌ An error occurred while fetching guild statistics.', ephemeral: true });
    }
  },
};