import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  getUserData,
  updateUser,
  userExists
} from '../../../database.js';
import orcaCommand from '../../txtcommands/explore/orca.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
  .setName('orca')
  .setDescription('Hunt, claim, and pray for the Legendary Orca in the quest.'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    if (orcaCommand?.execute) {
      return await orcaCommand.execute([], interaction);
    } else {
      return await handleMessage(interaction, `Failed to execute orca command!`);
    }
  }
};