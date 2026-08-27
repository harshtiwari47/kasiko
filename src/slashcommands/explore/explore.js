import {
  SlashCommandBuilder
} from '@discordjs/builders';
import petCommand from '../../txtcommands/explore/pet.js';
import passCommand from '../../txtcommands/explore/pass.js';
import alienCommand from '../../txtcommands/explore/alien.js';
import zombieCommand from '../../txtcommands/explore/zombie.js';
import iceCreamCommand from '../../txtcommands/explore/icecream.js';
import orcaCommand from '../../txtcommands/explore/orca.js';
import cookieCommand from '../../txtcommands/explore/cookie.js';
import mineCommand from '../../txtcommands/explore/mining.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explore the Kasiko universe, raise pets, level up battle pass, and play minigames.')
    .addSubcommand(sub =>
      sub
        .setName('alien')
        .setDescription('Cosmic infiltration: disguise, harvest cosmic resources, and wage interstellar battles.')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Alien action')
            .setRequired(false)
            .addChoices(
              { name: '🛸 View Alien Profile', value: 'profile' },
              { name: '👽 Join Cosmic Infiltration', value: 'join' },
              { name: '🎭 Change Human Disguise', value: 'disguise' },
              { name: '🧠 Manipulate Human Minds', value: 'manipulate' },
              { name: '⚡ Cosmic Resource Harvest', value: 'harvest' },
              { name: '✨ View Cosmic Abilities', value: 'abilities' },
              { name: '🎒 View Alien Inventory', value: 'inventory' },
              { name: '🚀 Upgrade Spaceship & Tech', value: 'upgrade' },
              { name: '📖 Alien Guide & Help', value: 'help' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('pet')
        .setDescription('Interact with your companions: view, feed, play, train, or equip pets.')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Pet action')
            .setRequired(false)
            .addChoices(
              { name: '🐾 View Pets', value: 'view' },
              { name: '🍖 Feed Pet', value: 'feed' },
              { name: '🎾 Play with Pet', value: 'play' },
              { name: '⚔️ Train Pet', value: 'train' }
            )
        )
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('Pet name (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('pass')
        .setDescription('View Kasiko Battle Pass progression and claim seasonal tier rewards.')
    )
    .addSubcommand(sub =>
      sub
        .setName('zombie')
        .setDescription('Explore the apocalyptic wasteland, scavenge weapons, and survive hordes.')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Zombie action (hunt, weapons, location, travel, heal, help)')
            .setRequired(false)
            .addChoices(
              { name: '🧟 View Stats & Resources', value: 'stats' },
              { name: '⚔️ Hunt / Scavenge & Bosses', value: 'hunt' },
              { name: '🗡️ View Weapons', value: 'weapons' },
              { name: '🗺️ Wasteland Locations & Travel Hub', value: 'location' },
              { name: '🚀 Travel to Territory', value: 'travel' },
              { name: '💉 Instant Heal (3000 Cash)', value: 'heal' },
              { name: '📖 Help Guide', value: 'help' }
            )
        )
        .addStringOption(opt =>
          opt
            .setName('target')
            .setDescription('Destination territory or weapon name (for travel/modify/active)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('icecream')
        .setDescription('Run your Ice Cream parlor: craft recipes, serve customers, and manage shop.')
    )
    .addSubcommand(sub =>
      sub
        .setName('mine')
        .setDescription('Mine rare minerals, gems, and relics underground.')
    )
    .addSubcommand(sub =>
      sub
        .setName('cookie')
        .setDescription('Bake and share lucky cookies for multipliers.')
    )
    .addSubcommand(sub =>
      sub
        .setName('orca')
        .setDescription('Dive into deep waters with your orca companion.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'alien': {
        const action = interaction.options.getString('action') || 'profile';
        const args = action === 'profile' ? ['alien'] : ['alien', action];
        if (alienCommand?.execute) return await alienCommand.execute(args, interaction);
        return handleMessage(interaction, { content: 'Alien cosmic infiltration is currently unavailable.' });
      }

      case 'pet': {
        const action = interaction.options.getString('action') || 'view';
        const name = interaction.options.getString('name') || '';
        const args = ['pet', action];
        if (name) args.push(name);
        if (petCommand?.execute) return await petCommand.execute(args, interaction);
        return handleMessage(interaction, { content: 'Pet command is currently unavailable.' });
      }

      case 'pass': {
        if (passCommand?.execute) return await passCommand.execute(['pass'], interaction);
        return handleMessage(interaction, { content: 'Pass command is currently unavailable.' });
      }

      case 'zombie': {
        const action = interaction.options.getString('action') || 'stats';
        const target = interaction.options.getString('target') || '';
        const args = action === 'stats' ? ['zombie'] : ['zombie', action];
        if (target) args.push(target);
        if (zombieCommand?.execute) return await zombieCommand.execute(args, interaction);
        return handleMessage(interaction, { content: 'Zombie exploration is currently unavailable.' });
      }

      case 'icecream': {
        if (iceCreamCommand?.execute) return await iceCreamCommand.execute(['icecream'], interaction);
        return handleMessage(interaction, { content: 'Ice cream minigame is currently unavailable.' });
      }

      case 'mine': {
        if (mineCommand?.execute) return await mineCommand.execute(['mine'], interaction);
        return handleMessage(interaction, { content: 'Mining is currently unavailable.' });
      }

      case 'cookie': {
        if (cookieCommand?.execute) return await cookieCommand.execute(['cookie'], interaction);
        return handleMessage(interaction, { content: 'Cookie command is currently unavailable.' });
      }

      case 'orca': {
        if (orcaCommand?.execute) return await orcaCommand.execute(['orca'], interaction);
        return handleMessage(interaction, { content: 'Orca command is currently unavailable.' });
      }

      default:
        return handleMessage(interaction, { content: 'Unknown exploration action.' });
    }
  }
};
