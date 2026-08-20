import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { huntCommand } from '../../txtcommands/wildlife/huntCommand.js';

export default {
  data: new SlashCommandBuilder()
    .setName('hunt')
    .setDescription('Hunt for wild animals across different biomes.')
    .addStringOption(option =>
      option
        .setName('location')
        .setDescription('Location to hunt in')
        .setRequired(false)
        .addChoices(
          { name: '🌲 Forest', value: 'Forest' },
          { name: '🏜️ Desert', value: 'Desert' },
          { name: '🏔️ Mountain', value: 'Mountain' },
          { name: '🌴 Jungle', value: 'Jungle' },
          { name: '❄️ Tundra', value: 'Tundra' },
          { name: '🌊 Ocean', value: 'Ocean' },
          { name: '🌾 Savanna', value: 'Savanna' }
        )
    ),

  async execute(interaction) {
    const location = interaction.options.getString('location') || 'Forest';
    return huntCommand(interaction, { location });
  }
};
