import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  getUserData,
  updateUser,
  userExists
} from '../../../database.js';
import mineCommand from '../../txtcommands/explore/mining.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
  .setName('mine')
  .setDescription("Collect and exchange coal for cash, or upgrade your production."),

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

    if (mineCommand?.execute) {
      return await mineCommand.execute(["mine"], interaction);
    } else {
      return await handleMessage(interaction, `Failed to execute mine command!`);
    }
  }
};