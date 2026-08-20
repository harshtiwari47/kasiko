import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { teamCommand } from '../../txtcommands/wildlife/teamCommand.js';

export default {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Manage your 3-animal battle squad.')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Action to perform')
        .setRequired(false)
        .addChoices(
          { name: '🐾 View Current Squad', value: 'view' },
          { name: '⚙️ Set Squad Animals', value: 'set' },
          { name: '🧹 Clear Squad', value: 'clear' }
        )
    )
    .addStringOption(option =>
      option
        .setName('animal1')
        .setDescription('First animal name')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('animal2')
        .setDescription('Second animal name')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('animal3')
        .setDescription('Third animal name')
        .setRequired(false)
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action') || 'view';
    const animal1 = interaction.options.getString('animal1');
    const animal2 = interaction.options.getString('animal2');
    const animal3 = interaction.options.getString('animal3');

    const names = [animal1, animal2, animal3].filter(Boolean);
    return teamCommand(interaction, { action, names });
  }
};
