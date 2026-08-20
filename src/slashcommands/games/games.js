import {
  SlashCommandBuilder
} from '@discordjs/builders';
import txtcommands from '../../textCommandHandler.js';
import { toss } from '../../txtcommands/games/toss.js';
import { blackjack } from '../../txtcommands/games/blackjack.js';

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
            .setDescription('Side to pick (Head or Tail)')
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
        .setDescription('Play a hand of Blackjack 21 against the dealer.')
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
        .setDescription('Spin the 3-reel slot machine for jackpot multipliers.')
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
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    switch (sub) {
      case 'coinflip': {
        const bet = interaction.options.getInteger('bet');
        const side = interaction.options.getString('side') || 'head';
        return toss(userId, interaction, bet, interaction.channel, side);
      }

      case 'blackjack': {
        const bet = interaction.options.getInteger('bet');
        return blackjack(userId, interaction, bet, interaction.channel);
      }

      case 'slots': {
        const bet = interaction.options.getInteger('bet');
        const slotsCmd = txtcommands.get('slots');
        if (slotsCmd?.execute) return await slotsCmd.execute(['slots', String(bet)], interaction);
        return interaction.reply({ content: 'Slots command is currently unavailable.', ephemeral: true });
      }

      case 'scratch': {
        const useCmd = txtcommands.get('use');
        if (useCmd?.execute) return await useCmd.execute(['use', 'scratch'], interaction);
        return interaction.reply({ content: 'Scratch card command is currently unavailable.', ephemeral: true });
      }

      case 'roulette': {
        const bet = interaction.options.getInteger('bet');
        const choice = interaction.options.getString('choice');
        const rouletteCmd = txtcommands.get('roulette');
        if (rouletteCmd?.execute) return await rouletteCmd.execute(['roulette', String(bet), choice], interaction);
        return interaction.reply({ content: 'Roulette command is currently unavailable.', ephemeral: true });
      }

      default:
        return interaction.reply({ content: 'Unknown game action.', ephemeral: true });
    }
  }
};
