import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import txtcommands from '../../textCommandHandler.js';

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
      return interaction.reply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in a server.`,
        ephemeral: true
      });
    }

    if (targetUser.id === userId) {
      return interaction.reply({
        content: `You cannot rob yourself!`,
        ephemeral: true
      });
    }

    if (targetUser.bot) {
      return interaction.reply({
        content: `You cannot rob bots!`,
        ephemeral: true
      });
    }

    const robCmd = txtcommands.get('rob');
    if (robCmd?.execute) {
      return await robCmd.execute(['rob', `<@${targetUser.id}>`], interaction);
    }

    return interaction.reply({
      content: 'Rob command is currently unavailable.',
      ephemeral: true
    });
  }
};
