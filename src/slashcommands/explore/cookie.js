import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import cookieCommand from '../../txtcommands/explore/cookie.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cookie')
    .setDescription('Bake (up to 3/day), check stats, or share lucky cookies with another user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to share a cookie with (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser('user');

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    if (cookieCommand?.execute) {
      return await cookieCommand.execute(targetUser ? ['cookie', targetUser] : ['cookie'], interaction);
    } else {
      return await handleMessage(interaction, `Failed to execute cookie command!`);
    }
  }
};