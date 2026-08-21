import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  getUserData,
  updateUser,
  userExists
} from '../../../database.js';
import bankCommand from '../../txtcommands/economy/bank.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
  .setName('deposit')
  .setDescription('Deposit an amount into your bank account')
  .addIntegerOption(option =>
    option.setName('amount')
    .setDescription('The amount to deposit')
    .setRequired(true)
    .setMinValue(1)
  ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const amount = interaction.options.getInteger('amount');

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`
      });
    }

    if (bankCommand?.execute) {
      return await bankCommand.execute(["deposit", amount], interaction);
    } else {
      return await handleMessage(interaction, `Failed to execute deposit command!`);
    }
  }
};