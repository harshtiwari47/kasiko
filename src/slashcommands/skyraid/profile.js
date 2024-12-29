import { SlashCommandBuilder } from 'discord.js';
import SkyraidUsers from '../../../models/SkyraidUsers.js';
import { EmbedBuilder } from 'discord.js';

export default {
  execute: async (interaction) => {
    try {
      await interaction.deferReply();
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      // Fetch user data
      const userData = await SkyraidUsers.findOne({ userId, guildId });

      if (!userData) {
        return interaction.followUp({ content: 'You do not have a profile yet. Participate in a battle to create one!', ephemeral: true });
      }

      // Create embed
      const embed = new EmbedBuilder()
        .setDescription(`## **${interaction.user.username.toUpperCase()}'s** 𝐒𝐊𝐘𝐑𝐀𝐈𝐃 𝐏𝐑𝐎𝐅𝐈𝐋𝐄`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setColor('#ff4949')
        .addFields(
          { name: '💥 Total Damage', value: `${userData.totalDamage.toLocaleString()}`, inline: false },
          { name: '🗡️ Participated', value: `${userData.matchesParticipated} matches`, inline: false },
          { name: '💫 Star Performer', value: userData.starPerformer ? '⭐'  +  userData.starPerformer : '⭐ No', inline: true },
          { name: '🎖️ Badges', value: userData.badges.length > 0 ? userData.badges.join(', ') : 'None', inline: false },
        )
        .setImage(`https://harshtiwari47.github.io/kasiko-public/images/skyraid.png`)

      return interaction.followUp({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching skyrade profile:', error);
      return interaction.followUp({ content: '❌ An error occurred while fetching your profile.', ephemeral: true });
    }
  },
};