import {
  SlashCommandBuilder
} from '@discordjs/builders';

import {
  userExists
} from '../../../database.js';

import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
  .setName('crime')
  .setDescription('Earn a random amount of cash by doing fake crime.'),
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

      if (txtcommands.get("crime")) {
        return await txtcommands.get("crime").interact(interaction);
      } else {
        return await interaction.editReply(`Failed to execute crime command!`);
      }
    } catch (e) {
      console.error(e);
    }
  },
};