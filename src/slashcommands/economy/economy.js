import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import workCommand from '../../txtcommands/economy/work.js';
import crimeCommand from '../../txtcommands/economy/crime.js';
import begCommand from '../../txtcommands/economy/beg.js';
import taskCommand from '../../txtcommands/economy/task.js';
import voteCommand from '../../txtcommands/economy/vote.js';
import spyCommand from '../../txtcommands/economy/spy.js';
import lootCommand from '../../txtcommands/economy/loot.js';
import giveawayCommand from '../../txtcommands/economy/giveaway.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Core economy operations and progression commands.')
    .addSubcommand(sub =>
      sub
        .setName('work')
        .setDescription('Work at your career job to earn steady cash and climb promotions.')
    )
    .addSubcommand(sub =>
      sub
        .setName('crime')
        .setDescription('Commit high-risk crimes for huge payouts (boostable with energy drinks).')
    )
    .addSubcommand(sub =>
      sub
        .setName('beg')
        .setDescription('Beg for cash and discover rare item drops.')
    )
    .addSubcommand(sub =>
      sub
        .setName('task')
        .setDescription('View daily and weekly community tasks, progress, and rewards.')
    )
    .addSubcommand(sub =>
      sub
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
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('spy')
        .setDescription('Embark on a covert spy mission for top-secret classified rewards.')
    )
    .addSubcommand(sub =>
      sub
        .setName('loot')
        .setDescription('Use mission tickets to embark on vehicle heist missions.')
    )
    .addSubcommand(sub =>
      sub
        .setName('giveaway')
        .setDescription('View active server giveaways or check current drops.')
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in a server.`,
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'work': {
        if (workCommand?.interact) return await workCommand.interact(interaction);
        if (workCommand?.execute) return await workCommand.execute(['work'], interaction);
        return handleMessage(interaction, { content: 'Work command is currently unavailable.' });
      }

      case 'crime': {
        if (crimeCommand?.interact) return await crimeCommand.interact(interaction);
        if (crimeCommand?.execute) return await crimeCommand.execute(['crime'], interaction);
        return handleMessage(interaction, { content: 'Crime command is currently unavailable.' });
      }

      case 'beg': {
        if (begCommand?.execute) return await begCommand.execute(['beg'], interaction);
        return handleMessage(interaction, { content: 'Beg command is currently unavailable.' });
      }

      case 'task': {
        if (taskCommand?.execute) return await taskCommand.execute(['task'], interaction);
        return handleMessage(interaction, { content: 'Task command is currently unavailable.' });
      }

      case 'vote': {
        const reminder = interaction.options.getString('reminder');
        const args = ['vote'];
        if (reminder) args.push(reminder);
        if (voteCommand?.execute) return await voteCommand.execute(args, interaction);
        return handleMessage(interaction, { content: 'Vote command is currently unavailable.' });
      }

      case 'spy': {
        if (spyCommand?.interact) return await spyCommand.interact(interaction);
        if (spyCommand?.execute) return await spyCommand.execute(['spy'], interaction);
        return handleMessage(interaction, { content: 'Spy mission is currently unavailable.' });
      }

      case 'loot': {
        if (lootCommand?.execute) return await lootCommand.execute(['loot'], interaction);
        return handleMessage(interaction, { content: 'Loot mission is currently unavailable.' });
      }

      case 'giveaway': {
        if (giveawayCommand?.execute) return await giveawayCommand.execute(['giveaway'], interaction);
        return handleMessage(interaction, { content: 'Giveaway command is currently unavailable.' });
      }

      default:
        return handleMessage(interaction, { content: 'Unknown economy action.' });
    }
  }
};