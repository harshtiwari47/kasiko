import {
  SlashCommandBuilder
} from '@discordjs/builders';
import leaderboardCommand from '../../txtcommands/statistics/leaderboard.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server and global leaderboards for net worth, cash, and stats.')
    .addStringOption(option =>
      option
        .setName('scope')
        .setDescription('Leaderboard scope')
        .setRequired(false)
        .addChoices(
          { name: '🌐 Global Leaderboard', value: 'global' },
          { name: '🏰 Server Leaderboard', value: 'server' }
        )
    ),

  async execute(interaction) {
    const scope = interaction.options.getString('scope') || 'global';
    const args = ['leaderboard'];
    if (scope === 'server') args.push('server');
    if (leaderboardCommand?.execute) {
      return await leaderboardCommand.execute(args, interaction);
    }
    return handleMessage(interaction, {
      content: 'Leaderboard command is currently unavailable.',
      ephemeral: true
    });
  }
};
