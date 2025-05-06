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
  .setName('mine')
  .setDescription("Collect and exchange coal for cash, or upgrade your production."),

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

    if (txtcommands.get("mine")) {
      return await txtcommands.get("mine").execute(["mine"], interaction);
    } else {
      return await interaction.editReply(`Failed to execute mine command!`);
    }
  }
};