import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import bankCommand from '../../txtcommands/economy/bank.js';
import { handleMessage } from '../../../helper.js';

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

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    if (!bankCommand?.execute) {
      return await handleMessage(interaction, `Failed to execute bank command!`);
    }

    if (action === 'open') {
      return await bankCommand.execute(['bank', 'open'], interaction);
    } else if (action === 'upgrade' || interaction.options.getInteger('upgrade_times')) {
      return await bankCommand.execute(['bank', 'upgrade', upgradeTimes], interaction);
    } else {
      return await bankCommand.execute(['bank'], interaction);
    }
  }
};