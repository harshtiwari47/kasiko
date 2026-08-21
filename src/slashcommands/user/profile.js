import {
  SlashCommandBuilder
} from '@discordjs/builders';

import {
  userExists
} from '../../../database.js';

import profileCommand from '../../txtcommands/user/profile.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Displays your profile information!'),
  async execute(interaction) {
    let userExistence = await userExists(interaction.user.id);
    if (!userExistence) {
      return await handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` in a server where the bot is available to create an account.`,
        ephemeral: true,
      });
    }

    if (profileCommand?.intract) {
      return await profileCommand.intract(interaction);
    } else {
      return await handleMessage(interaction, `Failed to execute profile command!`);
    }
  },
};