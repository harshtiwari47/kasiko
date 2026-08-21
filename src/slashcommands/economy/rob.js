import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import robCommand from '../../txtcommands/bank/rob.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Attempt to pickpocket or rob cash from another player.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The user you want to rob')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser('target');

    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in a server.`,
        ephemeral: true
      });
    }

    if (targetUser.id === userId) {
      return handleMessage(interaction, {
        content: `You cannot rob yourself!`,
        ephemeral: true
      });
    }

    if (targetUser.bot) {
      return handleMessage(interaction, {
        content: `You cannot rob bots!`,
        ephemeral: true
      });
    }

    if (robCommand?.execute) {
      return await robCommand.execute(['rob', `<@${targetUser.id}>`], interaction);
    }

    return handleMessage(interaction, {
      content: 'Rob command is currently unavailable.',
      ephemeral: true
    });
  }
};
