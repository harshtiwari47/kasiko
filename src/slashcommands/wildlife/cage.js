import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { cageCommand } from '../../txtcommands/wildlife/cageCommand.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cage')
    .setDescription('View your animal cage overview or inspect a specific animal.')
    .addStringOption(option =>
      option
        .setName('animal')
        .setDescription('Name of the animal to inspect (leave empty for overview)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const animal = interaction.options.getString('animal') || '';
    return cageCommand(interaction, animal);
  }
};
