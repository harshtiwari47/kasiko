import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  ALLITEMS
} from "../shop/shopIDs.js";

import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ITEM_DEFINITIONS,
  findItemByIdOrAlias
} from "../../inventory.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionType,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder
} from 'discord.js';


export default {
  name: 'info',
  description: 'Get detailed info about a specific item in the shop/inventory.',
  aliases: ['iteminfo'],
  args: '<itemName>',
  category: '🛍️ Shop',
  cooldown: 2000,

  async execute(args, context) {
    try {
      const {
        id: userId,
        name: discordName
      } = discordUser(context);

      if (!args[1]) {
        return handleMessage(context,
          `<:alert:1366050815089053808> Please specify an item. Usage: **\` info <item> \`**`
        );
      }
      const itemQuery = args.slice(1).join(' ').toLowerCase();

      const def = findItemByIdOrAlias(itemQuery);
      if (!def) {
        return handleMessage(context,
          `<:alert:1366050815089053808> Inventory item **\` ${itemQuery} \`** not found. Check the exact item key or name.`
        );
      }
      const matchedKey = def.id;
      let userData;
      try {
        userData = await getUserData(userId);
      } catch (err) {
        userData = null;
      }
      let userCount = null;
      if (userData && userData.inventory && typeof userData.inventory === 'object') {
        const raw = userData.inventory[matchedKey];
        userCount = raw != null ? Math.max(0, parseInt(raw) || 0): 0;
      }

      // Build the container
      const container = new ContainerBuilder()
      .addTextDisplayComponents(
        td => td.setContent(`### ${def.emoji || ''} **${def.name}** — ITEM INFO`),
        td => td.setContent(def.description || 'No description available.')
      );

      // Flags
      const flags = [];
      if (def.useable) flags.push('Useable');
      if (def.activatable) flags.push('Activatable');
      if (def.sellable) flags.push('Sellable');
      if (def.shareable) flags.push('Shareable');
      if (flags.length) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# FLAGS: ${flags.map(f => `**${f}**`).join(', ')}`)
        );
      } else {
        container.addTextDisplayComponents(
          td => td.setContent(`-# FLAGS: None`)
        );
      }

      if (userCount !== null) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# YOU HAVE: **${userCount}**`)
        );
      } else {
        container.addTextDisplayComponents(
          td => td.setContent(`-# YOU HAVE: *Unavailable* (could not fetch your inventory)`)
        );
      }


      if (def.sellable) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# SELL PRICE: <:kasiko_coin:1300141236841086977> \`${def.sellPrice}\``)
        );
      }

      if (def.purchaseable) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# SHOP PRICE: <:kasiko_coin:1300141236841086977> \`${def.price}\``)
        );
      }


      if (def.source) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# SOURCE: ${def?.source?.map(i => `**${i}**`)?.join(', ')}`)
        );
      }

      if (def.usableIn) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# USE IN: ${def?.usableIn?.map(i => `**${i}**`)?.join(', ')}`)
        );
      }

      if (def.rarity) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# RARITY: ${def.rarity}`)
        );
      }

      if (def.notes) {
        container.addTextDisplayComponents(
          td => td.setContent(`-# NOTES: ${def.notes}`)
        );
      }

      if (typeof def.useHandler === "function") {
        container.addSeparatorComponents(sep => sep);
        container.addTextDisplayComponents(
          td => td.setContent(`Do **\`use ${def?.aliases?.[0] || def.id}\`** to use this item.`)
        );
      }

      if (typeof def.shareHandler === "function") {
        container.addSeparatorComponents(sep => sep);
        container.addTextDisplayComponents(
          td => td.setContent(`Do **\`share ${def.aliases?.[0] || def.id} @user\`** to share this item.`)
        );
      }

      if (typeof def.buyHandler === "function") {
        container.addSeparatorComponents(sep => sep);
        container.addTextDisplayComponents(
          td => td.setContent(`Do **\`buy ${def.aliases?.[0] || def.id} <amount>\`** to buy this item.`)
        );
      }

      return handleMessage(context, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (err) {
      console.error('Error in info command:', err);
      return handleMessage(context, {
        content: `**Item Info Error**: ${err.message || 'Unknown error.'}`
      });
    }
  }
};