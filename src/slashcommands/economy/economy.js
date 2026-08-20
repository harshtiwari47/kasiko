import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  userExists
} from '../../../database.js';
import txtcommands from '../../textCommandHandler.js';

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
      return interaction.reply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in a server.`,
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'work': {
        const cmd = txtcommands.get('work');
        if (cmd?.interact) return await cmd.interact(interaction);
        if (cmd?.execute) return await cmd.execute(['work'], interaction);
        return interaction.reply({ content: 'Work command is currently unavailable.', ephemeral: true });
      }

      case 'crime': {
        const cmd = txtcommands.get('crime');
        if (cmd?.interact) return await cmd.interact(interaction);
        if (cmd?.execute) return await cmd.execute(['crime'], interaction);
        return interaction.reply({ content: 'Crime command is currently unavailable.', ephemeral: true });
      }

      case 'beg': {
        const cmd = txtcommands.get('beg');
        if (cmd?.execute) return await cmd.execute(['beg'], interaction);
        return interaction.reply({ content: 'Beg command is currently unavailable.', ephemeral: true });
      }

      case 'task': {
        const cmd = txtcommands.get('task');
        if (cmd?.execute) return await cmd.execute(['task'], interaction);
        return interaction.reply({ content: 'Task command is currently unavailable.', ephemeral: true });
      }

      case 'vote': {
        const reminder = interaction.options.getString('reminder');
        const cmd = txtcommands.get('vote');
        const args = ['vote'];
        if (reminder) args.push(reminder);
        if (cmd?.execute) return await cmd.execute(args, interaction);
        return interaction.reply({ content: 'Vote command is currently unavailable.', ephemeral: true });
      }

      case 'spy': {
        const cmd = txtcommands.get('spy');
        if (cmd?.interact) return await cmd.interact(interaction);
        if (cmd?.execute) return await cmd.execute(['spy'], interaction);
        return interaction.reply({ content: 'Spy mission is currently unavailable.', ephemeral: true });
      }

      case 'loot': {
        const cmd = txtcommands.get('loot');
        if (cmd?.execute) return await cmd.execute(['loot'], interaction);
        return interaction.reply({ content: 'Loot mission is currently unavailable.', ephemeral: true });
      }

      case 'giveaway': {
        const cmd = txtcommands.get('giveaway');
        if (cmd?.execute) return await cmd.execute(['giveaway'], interaction);
        return interaction.reply({ content: 'Giveaway command is currently unavailable.', ephemeral: true });
      }

      default:
        return interaction.reply({ content: 'Unknown economy action.', ephemeral: true });
    }
  }
};