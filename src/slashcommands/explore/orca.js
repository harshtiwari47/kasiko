import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  getUserData,
  updateUser,
  userExists
} from '../../../database.js';
import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
  .setName('orca')
  .setDescription('Hunt, claim, and pray for the Legendary Orca in the quest.'),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (interaction.replied || interaction.deferred) return;

    await interaction.deferReply({
      ephemeral: false
    });

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return interaction.editReply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    if (txtcommands.get("orca")) {
      return await txtcommands.get("orca").execute([], interaction);
    } else {
      return await interaction.editReply(`Failed to execute orca command!`);
    }
  }
};