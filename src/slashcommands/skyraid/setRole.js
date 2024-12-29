import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';
import SkyraidGuilds from '../../../models/SkyraidGuilds.js';

export default {
  execute: async (interaction) => {
    await interaction.deferReply();

    try {
      const guildId = interaction.guild.id;
      const role = interaction.options.getRole('role');

      // Validate role existence
      if (!role) {
        return interaction.followUp({
          content: '❌ The specified role does not exist.', ephemeral: true
        });
      }

      // Update or create the SkyraidGuilds document for the guild
      const updatedGuild = await SkyraidGuilds.findOneAndUpdate(
        {
          guildId
        },
        {
          startRoleId: role.id
        },
        {
          upsert: true, new: true, setDefaultsOnInsert: true
        }
      );

      // Create a confirmation embed
      const embed = new EmbedBuilder()
      .setTitle('✅ Start Role Set Successfully')
      .setDescription(`The role **${role.name}** has been set as the authorized role to start the **SKYRAID GAME**.`)
      .setColor('#00FF00') // Green color
      .setTimestamp();

      return interaction.followUp({
        embeds: [embed], ephemeral: false
      });

    } catch (error) {
      console.error('Error executing skyraid setrole command:', error);
      return interaction.followUp({
        content: '❌ An error occurred while setting the  skyraid start role.', ephemeral: true
      });
    }
  },
};