import {
  SlashCommandBuilder
} from '@discordjs/builders';

import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Displays your profile information!'),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (txtcommands.get("profile")) {
        return await txtcommands.get("profile").intract(interaction);
      } else {
        return await interaction.editReply(`Failed to execute profile command!`);
      }
    } catch (e) {
      console.error(e);
    }
  },
};