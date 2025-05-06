import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  getUserData,
  updateUser,
  userExists
} from '../../../database.js';
import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
  .setName('cookie')
  .setDescription('Give a cookie to someone (or bake)')
  .addUserOption(option =>
    option .setName('user')
    .setDescription('The user to give a cookie to')
    .setRequired(false)
  ),

  async execute(interaction) {
    const userId = interaction.user.id;

    const targetUser = interaction.options.getUser('user');
    if (interaction.replied || interaction.deferred) return;

    await interaction.deferReply({
      ephemeral: false
    });

    // Ensure user account exists
    const exists = await userExists(userId);
    
    if (!exists) {
      return interaction.editReply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    if (txtcommands.get("cookie")) {
      return await txtcommands.get("cookie").execute([targetUser], interaction);
    } else {
      return await interaction.editReply(`Failed to execute cookie command!`);
    }
  }
};