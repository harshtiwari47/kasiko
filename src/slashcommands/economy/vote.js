import {
  SlashCommandBuilder
} from '@discordjs/builders';
import voteCommand from '../../txtcommands/economy/vote.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Claim Top.gg voting rewards or toggle reminder notifications.')
    .addStringOption(opt =>
      opt
        .setName('reminder')
        .setDescription('Enable or disable automatic vote reminders')
        .addChoices(
          { name: '🔔 Enable Reminders', value: 'yes' },
          { name: '🔕 Disable Reminders', value: 'no' }
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    const reminder = interaction.options.getString('reminder');
    const args = ['vote'];
    if (reminder) args.push(reminder);
    if (voteCommand?.execute) {
      return await voteCommand.execute(args, interaction);
    }
    return handleMessage(interaction, { content: 'Vote command is currently unavailable.' });
  }
};
