import {
  SlashCommandBuilder
} from '@discordjs/builders';
import txtcommands from '../../textCommandHandler.js';
import {
  getHelpResponse
} from './helpUtility.js';
import {
  EmbedBuilder
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
  .setName('commandslist')
  .setDescription('Get a quick list of available commands or detailed help for a specific command.')
  .addStringOption(option =>
    option.setName('command')
    .setDescription('The name of the command to get detailed help for.')
    .setRequired(false)
  ),
  async execute(interaction) {
    try {
      // Defer the interaction if generating help might take longer than 3 seconds
      await interaction.deferReply();

      const commandName = interaction.options.getString('command');
      const {
        content,
        embeds
      } = getHelpResponse(commandName);

      // Send the response
      if (content) {
        await interaction.editReply(content);
      }
      if (embeds.length > 0) {
        embeds.forEach(embed => {
          interaction.followUp({
            embeds: [embed]
          });
        });

        return;
      }
    } catch (error) {
      console.error(error);
      return await interaction.editReply('❌ An error occurred while executing the command.');
    }
  }
};