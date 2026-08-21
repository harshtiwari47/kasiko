import {
  SlashCommandBuilder
} from '@discordjs/builders';
import marriageCommand from '../../txtcommands/social/marriage.js';
import familyCommand from '../../txtcommands/social/family.js';
import profileCommand from '../user/profile.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Social interactions, marriage, relationships, and family.')
    .addSubcommand(sub =>
      sub
        .setName('marry')
        .setDescription('Propose marriage to another player with a ring.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('The user you want to propose to')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('divorce')
        .setDescription('Divorce your current partner.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Your spouse')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('roses')
        .setDescription('Send roses to your partner or friends to increase Bond EXP.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User to send roses to')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Number of roses to send')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Check your current marriage status and relationship details.')
    )
    .addSubcommand(sub =>
      sub
        .setName('family')
        .setDescription('View your family tree, spouse, and children.')
    )
    .addSubcommand(sub =>
      sub
        .setName('profile')
        .setDescription('View a player’s social profile and net worth overview.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User profile to view')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'marry': {
        const target = interaction.options.getUser('user');
        if (marriageCommand?.execute) {
          return await marriageCommand.execute(['marry', `<@${target.id}>`], interaction);
        }
        return handleMessage(interaction, { content: 'Marriage command is currently unavailable.' });
      }

      case 'divorce': {
        const target = interaction.options.getUser('user');
        const args = ['divorce'];
        if (target) args.push(`<@${target.id}>`);
        if (marriageCommand?.execute) {
          return await marriageCommand.execute(args, interaction);
        }
        return handleMessage(interaction, { content: 'Divorce command is currently unavailable.' });
      }

      case 'roses': {
        const target = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount') || 1;
        if (marriageCommand?.execute) {
          return await marriageCommand.execute(['roses', String(amount), `<@${target.id}>`], interaction);
        }
        return handleMessage(interaction, { content: 'Roses command is currently unavailable.' });
      }

      case 'status': {
        if (marriageCommand?.execute) {
          return await marriageCommand.execute(['marriage'], interaction);
        }
        return handleMessage(interaction, { content: 'Status command is currently unavailable.' });
      }

      case 'family': {
        if (familyCommand?.execute) {
          return await familyCommand.execute(['family'], interaction);
        }
        return handleMessage(interaction, { content: 'Family command is currently unavailable.' });
      }

      case 'profile': {
        return profileCommand.execute(interaction);
      }

      default:
        return handleMessage(interaction, { content: 'Unknown social action.' });
    }
  }
};
