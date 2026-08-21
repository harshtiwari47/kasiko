import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import spyCommand from '../../txtcommands/economy/spy.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spy')
    .setDescription('Embark on a covert spy mission for top-secret classified rewards or risky penalties.'),

  async execute(interaction) {
    const userId = interaction.user.id;

    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in a server.`,
        ephemeral: true
      });
    }

    if (spyCommand?.interact) {
      return await spyCommand.interact(interaction);
    }
    if (spyCommand?.execute) {
      return await spyCommand.execute(['spy'], interaction);
    }

    return handleMessage(interaction, {
      content: 'Spy mission is currently unavailable.'
    });
  }
};
