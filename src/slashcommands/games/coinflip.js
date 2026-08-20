import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { toss } from '../../txtcommands/games/toss.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin against the house (Head or Tail).')
    .addIntegerOption(option =>
      option
        .setName('bet')
        .setDescription('Cash amount to bet')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('side')
        .setDescription('Side to pick (Head or Tail)')
        .setRequired(false)
        .addChoices(
          { name: '🪙 Head', value: 'head' },
          { name: '🪙 Tail', value: 'tail' }
        )
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const side = interaction.options.getString('side') || 'head';
    return toss(interaction.user.id, interaction, bet, null, side);
  }
};
