import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { dailylogin } from '../../txtcommands/economy/dailylogin.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily login reward and pet food bonus.'),

  async execute(interaction) {
    return dailylogin(interaction);
  }
};