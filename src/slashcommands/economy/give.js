import { SlashCommandBuilder } from '@discordjs/builders';
import { getUserData, updateUser, userExists } from '../../../database.js';
import giveCommand from '../../txtcommands/economy/give.js';
import { handleMessage } from '../../../helper.js';

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

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    if (giveCommand?.execute) {
      return await giveCommand.execute(["give", amount, targetUser.id], interaction);
    } else {
      return await handleMessage(interaction, `Failed to execute give command!`);
    }
  }
};