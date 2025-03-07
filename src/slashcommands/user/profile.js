import {
  SlashCommandBuilder
} from '@discordjs/builders';

import {
  userExists
} from '../../../database.js';

import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Displays your profile information!'),
  async execute(interaction) {
    try {

      await interaction.deferReply();

      let userExistence = await userExists(interaction.user.id);
      if (!userExistence) {
        await interaction.editReply({
          content: `You haven't accepted our terms and conditions! Type \`kas help\` in a server where the bot is available to create an account.`,
          ephemeral: true, // Only visible to the user
        });
        return;
      }

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