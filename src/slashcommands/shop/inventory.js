import {
  SlashCommandBuilder
} from '@discordjs/builders';
import inventoryCommand from '../../txtcommands/shop/inventory.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your bag and inventory items: scratch cards, food, roses, etc.'),

  async execute(interaction) {
    return inventoryCommand.execute([], interaction);
  }
};
