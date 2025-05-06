import { SlashCommandBuilder } from '@discordjs/builders';
import { getUserData, updateUser, userExists } from '../../../database.js';
import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give an amount of cash to another user')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The amount to give')
        .setRequired(true)
        .setMinValue(1)
    )
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give money to')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

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

    if (txtcommands.get("give")) {
      return await txtcommands.get("give").execute(["give", amount, targetUser.id], interaction);
    } else {
      return await interaction.editReply(`Failed to execute give command!`);
    }
  }
};