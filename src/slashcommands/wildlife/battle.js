import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { battleCommand } from '../../txtcommands/wildlife/battleCommand.js';

export default {
  data: new SlashCommandBuilder()
    .setName('battle')
    .setDescription('Enter the animal arena for high-stakes 3v3 squad combat.')
    .addUserOption(option =>
      option
        .setName('opponent')
        .setDescription('Challenge another user (leave blank to battle a wild beast)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');
    const isBot = opponent?.bot || false;

    return battleCommand(interaction, {
      opponentUser: opponent,
      isBotBattle: !opponent || isBot
    });
  }
};
