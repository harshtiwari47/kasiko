import {
  SlashCommandBuilder
} from '@discordjs/builders';
import passCommand from '../../txtcommands/explore/pass.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pass')
    .setDescription('View Kasiko Battle Pass progression and claim free/premium seasonal rewards.')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Pass action')
        .setRequired(false)
        .addChoices(
          { name: '📜 View Pass', value: 'view' },
          { name: '🎁 Claim Rewards', value: 'claim' }
        )
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action') || 'view';
    const args = ['pass'];
    if (action === 'claim') args.push('claim');
    if (passCommand?.execute) {
      return await passCommand.execute(args, interaction);
    }
    return interaction.reply({
      content: 'Pass command is currently unavailable.',
      ephemeral: true
    });
  }
};
