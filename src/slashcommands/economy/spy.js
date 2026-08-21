import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spy')
    .setDescription('Embark on a covert spy mission for top-secret classified rewards or risky penalties.'),

  async execute(interaction) {
    const userId = interaction.user.id;

    const exists = await userExists(userId);
    if (!exists) {
      return interaction.reply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in a server.`,
        ephemeral: true
      });
    }

    const cmd = txtcommands.get('spymission') || txtcommands.get('spy');
    if (cmd?.interact) {
      return await cmd.interact(interaction);
    }
    if (cmd?.execute) {
      return await cmd.execute(['spy'], interaction);
    }

    return interaction.editReply({
      content: 'Spy mission is currently unavailable.'
    });
  }
};
