import {
  SlashCommandBuilder
} from '@discordjs/builders';
import useCommand from '../../txtcommands/shop/use.js';
import { toss } from '../../txtcommands/games/toss.js';
import { blackjack } from '../../txtcommands/games/blackjack.js';
import { slots } from '../../txtcommands/games/slots.js';
import { rouletteGame } from '../../txtcommands/games/roulette.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('games')
    .setDescription('Play casino and gambling minigames for cash multipliers.')
    .addSubcommand(sub =>
      sub
        .setName('coinflip')
        .setDescription('Flip a coin against the house (Head or Tail).')
        .addIntegerOption(opt =>
          opt
            .setName('bet')
            .setDescription('Cash amount to bet')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(opt =>
          opt
            .setName('side')
            .setDescription('Side of the coin (Head or Tail)')
            .setRequired(false)
            .addChoices(
              { name: '🪙 Head', value: 'head' },
              { name: '🪙 Tail', value: 'tail' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('blackjack')
        .setDescription('Play Blackjack (21) against the dealer.')
        .addIntegerOption(opt =>
          opt
            .setName('bet')
            .setDescription('Cash amount to bet')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('slots')
        .setDescription('Spin the 3x3 slot machine for jackpot payouts.')
        .addIntegerOption(opt =>
          opt
            .setName('bet')
            .setDescription('Cash amount to bet')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('scratch')
        .setDescription('Scratch a lottery card from your inventory to win cash multipliers.')
    )
    .addSubcommand(sub =>
      sub
        .setName('roulette')
        .setDescription('Bet on the roulette wheel colors and numbers.')
        .addIntegerOption(opt =>
          opt
            .setName('bet')
            .setDescription('Cash amount to bet')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(opt =>
          opt
            .setName('choice')
            .setDescription('Space to bet on (e.g. red, black, green, or 0-36)')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    switch (sub) {
      case 'coinflip': {
        const bet = interaction.options.getInteger('bet') || 10;
        const side = interaction.options.getString('side') || 'head';
        return toss(userId, interaction, bet, null, side);
      }

      case 'blackjack': {
        const bet = interaction.options.getInteger('bet') || 10;
        return blackjack(userId, bet, null, interaction);
      }

      case 'slots': {
        const bet = interaction.options.getInteger('bet') || 10;
        return slots(userId, bet, interaction, interaction);
      }

      case 'scratch': {
        if (useCommand?.execute) return await useCommand.execute(['use', 'scratch'], interaction);
        return handleMessage(interaction, { content: 'Scratch card command is currently unavailable.' });
      }

      case 'roulette': {
        const bet = interaction.options.getInteger('bet') || 1000;
        return rouletteGame(userId, '1300081477358452756', bet, interaction);
      }

      default:
        return handleMessage(interaction, { content: 'Unknown game action.' });
    }
  }
};
