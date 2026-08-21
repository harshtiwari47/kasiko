import {
  SlashCommandBuilder
} from '@discordjs/builders';
import petCommand from '../../txtcommands/explore/pet.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Interact with your pets: view stats, feed, play, train, or switch active companion.')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Pet action')
        .setRequired(false)
        .addChoices(
          { name: '🐾 View Pets', value: 'view' },
          { name: '🍖 Feed Pet', value: 'food' },
          { name: '📋 Pet List', value: 'list' },
          { name: '🔄 Switch Active Pet', value: 'switch' }
        )
    )
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Pet name or slot number')
        .setRequired(false)
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action') || 'view';
    const name = interaction.options.getString('name');
    const args = ['pet', action];
    if (name) args.push(name);
    if (petCommand?.execute) {
      return await petCommand.execute(args, interaction);
    }
    return handleMessage(interaction, {
      content: 'Pet command is currently unavailable.',
      ephemeral: true
    });
  }
};
