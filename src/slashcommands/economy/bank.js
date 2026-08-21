import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Manage your bank account: view status, open an account, or upgrade storage.')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Bank action to perform')
        .setRequired(false)
        .addChoices(
          { name: '📊 View Bank Status', value: 'status' },
          { name: '🏦 Open Bank Account', value: 'open' },
          { name: '⚡ Upgrade Bank Capacity', value: 'upgrade' }
        )
    )
    .addIntegerOption(option =>
      option.setName('upgrade_times')
        .setDescription('Number of levels to upgrade (default: 1)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const action = interaction.options.getString('action');
    const upgradeTimes = interaction.options.getInteger('upgrade_times') || 1;

    if (!interaction.deferred) {
      await interaction.deferReply({
        ephemeral: false
      });
    }

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return interaction.editReply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    const cmd = txtcommands.get("bank");
    if (!cmd?.execute) {
      return await interaction.editReply(`Failed to execute bank command!`);
    }

    if (action === 'open') {
      return await cmd.execute(['bank', 'open'], interaction);
    } else if (action === 'upgrade' || interaction.options.getInteger('upgrade_times')) {
      return await cmd.execute(['bank', 'upgrade', upgradeTimes], interaction);
    } else {
      return await cmd.execute(['bank', 'status'], interaction);
    }
  }
};