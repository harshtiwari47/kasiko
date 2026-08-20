import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { petCommand } from '../../txtcommands/explore/pet.js';

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
          { name: '🍖 Feed Pet', value: 'feed' },
          { name: '🎾 Play with Pet', value: 'play' },
          { name: '⚔️ Train Pet', value: 'train' }
        )
    )
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Pet name (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action') || 'view';
    const name = interaction.options.getString('name') || '';
    return petCommand(interaction, name, action);
  }
};
