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
  .setName('withdraw')
  .setDescription('Withdraw an amount from your bank account')
  .addIntegerOption(option =>
    option.setName('amount')
    .setDescription('The amount to withdraw')
    .setRequired(true)
    .setMinValue(1)
  ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const amount = interaction.options.getInteger('amount');

    if (interaction.replied || interaction.deferred) return;

    await interaction.deferReply({
      ephemeral: false
    });

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      await interaction.deferReply({
        ephemeral: true
      });
      return interaction.editReply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    if (txtcommands.get("bank")) {
      return await txtcommands.get("bank").execute(["withdraw", amount], interaction);
    } else {
      return await interaction.editReply(`Failed to execute withdraw command!`);
    }
  }
};