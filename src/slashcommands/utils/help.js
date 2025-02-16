import {
  SlashCommandBuilder
} from '@discordjs/builders';
import txtcommands from '../../textCommandHandler.js';

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
    try {
      await interaction.deferReply({
        ephemeral: true
      });

      const commandName = interaction.options.getString('command');

      if (txtcommands.get("help")) {
        await txtcommands.get("help").execute(commandName ? ["help", commandName] : ["help"], interaction);
        return;
      } else {
        return await interaction.editReply(`Failed to execute profile command!`);
      }

    } catch (error) {
      console.error('Error executing /help command:', error);
      try {
        await interaction.editReply({
          content: '⚠️ An error occurred while fetching help information. Please try again later.',
          ephemeral: true,
        });
      } catch (replyError) {
        console.error('Error sending error message:', replyError);
      }
    }
  },
};