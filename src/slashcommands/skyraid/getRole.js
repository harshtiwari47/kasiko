import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import SkyraidGuilds from '../../../models/SkyraidGuilds.js';

export default {
  execute: async (interaction, client) => {
    await interaction.deferReply();
    
    try {
      const guildId = interaction.guild.id;

      const guildSettings = await SkyraidGuilds.findOne({
        guildId
      });

      if (!guildSettings || !guildSettings.startRoleId) {
        return interaction.followUp({
          content: '❌ No start role has been set for this guild.', ephemeral: true
        });
      }

      const role = interaction.guild.roles.cache.get(guildSettings.startRoleId);

      if (!role) {
        return interaction.followUp({
          content: '❌ The previously set start role no longer exists.', ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
      .setTitle('✅ Current Start Role')
      .setDescription(`The role **${role.name}** is currently authorized to start the **SKYRAID GAME**.`)
      .setColor('#00FF00') // Green color
      .setTimestamp();

      return interaction.followUp({
        embeds: [embed], ephemeral: false
      });

    } catch (error) {
      console.error('Error executing skyraid getrole command:', error);
      return interaction.followUp({
        content: '❌ An error occurred while fetching the skyraid start role.', ephemeral: true
      });
    }
  },
};