import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { huntCommand } from '../../txtcommands/wildlife/huntCommand.js';
import { cageCommand } from '../../txtcommands/wildlife/cageCommand.js';
import { feedCommand } from '../../txtcommands/wildlife/feedCommand.js';
import { sellCommand } from '../../txtcommands/wildlife/sellCommand.js';
import { teamCommand } from '../../txtcommands/wildlife/teamCommand.js';
import { battleCommand } from '../../txtcommands/wildlife/battleCommand.js';
import { achievementsCommand } from '../../txtcommands/wildlife/achievementsCommand.js';

import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('wildlife')
    .setDescription('Complete wildlife, hunting, cage, and animal battle system.')
    .addSubcommand(sub =>
      sub
        .setName('hunt')
        .setDescription('Hunt for wild animals across different biomes.')
        .addStringOption(opt =>
          opt
            .setName('location')
            .setDescription('Biome to hunt in')
            .setRequired(false)
            .addChoices(
              { name: '🌲 Forest', value: 'Forest' },
              { name: '🏜️ Desert', value: 'Desert' },
              { name: '🏔️ Mountain', value: 'Mountain' },
              { name: '🌴 Jungle', value: 'Jungle' },
              { name: '❄️ Tundra', value: 'Tundra' },
              { name: '🌊 Ocean', value: 'Ocean' },
              { name: '🌾 Savanna', value: 'Savanna' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('cage')
        .setDescription('View your animal cage overview or inspect a specific animal.')
        .addStringOption(opt =>
          opt
            .setName('animal')
            .setDescription('Name of the animal to inspect')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('feed')
        .setDescription('Feed pet food to an animal to level up its stats and HP.')
        .addStringOption(opt =>
          opt
            .setName('animal')
            .setDescription('Name of the animal to feed')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Amount of pet food to feed')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('sell')
        .setDescription('Sell wild animals from your cage for cash.')
        .addStringOption(opt =>
          opt
            .setName('animal')
            .setDescription('Name of the animal (or "all")')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Number of animals to sell')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('team')
        .setDescription('Manage your 3-animal battle squad.')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Squad action')
            .setRequired(false)
            .addChoices(
              { name: '👁️ View Squad', value: 'view' },
              { name: '📥 Equip Animal', value: 'equip' },
              { name: '📤 Remove Animal', value: 'remove' }
            )
        )
        .addIntegerOption(opt =>
          opt
            .setName('slot')
            .setDescription('Squad slot (1, 2, or 3)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(3)
        )
        .addStringOption(opt =>
          opt
            .setName('animal')
            .setDescription('Animal name to equip/remove')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('battle')
        .setDescription('Enter the Animal Arena and battle wild beasts or players.')
        .addUserOption(opt =>
          opt
            .setName('opponent')
            .setDescription('User to challenge to an Animal Battle (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('achievements')
        .setDescription('View your hunting achievements and trophy milestones.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'hunt': {
        const location = interaction.options.getString('location') || 'Forest';
        return huntCommand(interaction, { location });
      }

      case 'cage': {
        const animal = interaction.options.getString('animal') || '';
        return cageCommand(interaction, animal);
      }

      case 'feed': {
        const animal = interaction.options.getString('animal');
        const amount = interaction.options.getInteger('amount') || 1;
        return feedCommand(interaction, { animalName: animal, foodAmount: amount });
      }

      case 'sell': {
        const animal = interaction.options.getString('animal');
        const amount = interaction.options.getInteger('amount') || 1;
        const isAll = animal.toLowerCase() === 'all';
        return sellCommand(interaction, {
          animalName: isAll ? '' : animal,
          sellAll: isAll,
          amount
        });
      }

      case 'team': {
        const action = interaction.options.getString('action') || 'view';
        const slot = interaction.options.getInteger('slot');
        const animal = interaction.options.getString('animal');
        return teamCommand(interaction, { action, slot, animalName: animal });
      }

      case 'battle': {
        const opponent = interaction.options.getUser('opponent');
        return battleCommand(interaction, { opponentId: opponent?.id || null, isWild: !opponent });
      }

      case 'achievements': {
        return achievementsCommand(interaction);
      }

      default:
        return handleMessage(interaction, { content: 'Unknown wildlife action.' });
    }
  }
};
