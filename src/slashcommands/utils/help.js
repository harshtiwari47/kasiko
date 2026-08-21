import {
  SlashCommandBuilder
} from '@discordjs/builders';
import helpCommand from '../../txtcommands/utils/help.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays the list of commands or detailed info about a specific command.')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('The command you want help with')
        .setRequired(false)
    ),

  async execute(interaction) {
    const commandName = interaction.options.getString('command');

    if (helpCommand?.execute) {
      return await helpCommand.execute(commandName ? ["help", commandName] : ["help"], interaction);
    } else {
      return await handleMessage(interaction, `Failed to execute help command!`);
    }
  },
};