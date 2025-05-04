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
  .setName('bank')
  .setDescription('Manage your bank account')
  .addIntegerOption(option =>
    option.setName('upgrade')
    .setDescription('Upgrade your bank level. Each level increases capacity by 500k. (COST: 300k/level).')
    .setMinValue(1)
    .setMaxValue(100)
  ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const upgradeLevel = interaction.options.getInteger('upgrade');

    if (interaction.replied || interaction.deferred) return; // Prevent double replies
    
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

    if (upgradeLevel !== null) {
      if (txtcommands.get("bank")) {
        return await txtcommands.get("bank").execute(["bank", "upgrade", upgradeLevel], interaction);
      } else {
        return await interaction.editReply(`Failed to execute bank upgrade command!`);
      }
    } else {
      if (txtcommands.get("bank")) {
        return await txtcommands.get("bank").execute(["bank"], interaction);
      } else {
        return await interaction.editReply(`Failed to execute bank command!`);
      }
    }
  }
};