import {
  SlashCommandBuilder
} from '@discordjs/builders';
import txtcommands from '../../textCommandHandler.js';
import inventoryCommand from '../../txtcommands/shop/inventory.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse, buy, and manage items in the Kasiko Shop & Inventory.')
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('Open the interactive shop catalog and view available items.')
        .addStringOption(opt =>
          opt
            .setName('category')
            .setDescription('Shop category to browse')
            .setRequired(false)
            .addChoices(
              { name: '🚗 Vehicles / Cars', value: 'cars' },
              { name: '🏢 Real Estate & Structures', value: 'structures' },
              { name: '💍 Jewelry & Luxury', value: 'jewelry' },
              { name: '🌹 Collectibles & Gifts', value: 'collectibles' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('buy')
        .setDescription('Purchase an item from the shop.')
        .addStringOption(opt =>
          opt
            .setName('item')
            .setDescription('Item ID or name to buy (e.g. scratch, food, rose, ring3)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Quantity to purchase')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('use')
        .setDescription('Use or consume an item from your inventory (scratch card, drink, etc.).')
        .addStringOption(opt =>
          opt
            .setName('item')
            .setDescription('Item name/ID to use (e.g. scratch, drink, candle)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Quantity to use')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('inventory')
        .setDescription('View items currently owned in your inventory bag.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User whose inventory you want to view')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'view': {
        const cat = interaction.options.getString('category');
        const shopCmd = txtcommands.get('shop');
        const args = ['shop'];
        if (cat) args.push(cat);
        if (shopCmd?.execute) return await shopCmd.execute(args, interaction);
        return interaction.reply({ content: 'Shop is currently unavailable.', ephemeral: true });
      }

      case 'buy': {
        const item = interaction.options.getString('item');
        const amount = interaction.options.getInteger('amount') || 1;
        const buyCmd = txtcommands.get('buy');
        if (buyCmd?.execute) return await buyCmd.execute(['buy', item, String(amount)], interaction);
        return interaction.reply({ content: 'Buy command is currently unavailable.', ephemeral: true });
      }

      case 'use': {
        const item = interaction.options.getString('item');
        const useCmd = txtcommands.get('use');
        if (useCmd?.execute) return await useCmd.execute(['use', item], interaction);
        return interaction.reply({ content: 'Use command is currently unavailable.', ephemeral: true });
      }

      case 'inventory': {
        const targetUser = interaction.options.getUser('user');
        const args = ['inv'];
        if (targetUser) args.push(`<@${targetUser.id}>`);
        if (inventoryCommand?.execute) return await inventoryCommand.execute(args, interaction);
        return interaction.reply({ content: 'Inventory is currently unavailable.', ephemeral: true });
      }

      default:
        return interaction.reply({ content: 'Unknown shop action.', ephemeral: true });
    }
  }
};
