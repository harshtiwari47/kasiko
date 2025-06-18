import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  ALLITEMS
} from "./shopIDs.js";

import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ITEM_DEFINITIONS
} from "../../inventory.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionType,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';

export default {
  name: 'inventory',
  description: 'View your inventory: scratch cards, roses, etc., with sellable/shareable info.',
  aliases: ['inv',
    'bag'],
  args: '',
  emoji: '🎒',
  category: '🛍️ Shop',
  cooldown: 5000,

  async execute(args, context) {
    const {
      id: userId,
      username,
      name,
      avatar
    } = discordUser(context);


    let userData;
    try {
      userData = await getUserData(userId);
    } catch (err) {
      return handleMessage(context, '❌ Unable to fetch your inventory right now. Please try again later.');
    }

    const scratchCount = userData.inventory['scratch_card'] || 0;
    const roseCount = userData.inventory['rose'] || 0;

    // inventory items and their metadata
    const inventoryItems = [{
      name: 'Scratch Cards',
      emoji: '<:scratch_card:1382990344186105911>',
      count: scratchCount,
      sellable: false,
      shareable: false,
      description: 'Scratch & win.',
    },
      {
        name: 'Roses',
        emoji: '<:rose:1343097565738172488>',
        count: roseCount,
        sellable: false,
        shareable: true,
        description: 'Can be used for gifting or increasing your marriage BondXP.',
      }];

    const Container = new ContainerBuilder()
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`### 🎒 𝗜𝗡𝗩𝗘𝗡𝗧𝗢𝗥𝗬`),
      textDisplay => textDisplay.setContent(`-# ${name} ◎ \`info \`**\`<item>\`**`)
    );

    // For each item, add a field
    for (const item of inventoryItems) {
      // Format value with count and flags
      const lines = [];
      lines.push(`-# <:follow_reply:1368224897003946004> **Sellable:** ${item.sellable ? 'Yes': 'No'} **Shareable:** ${item.shareable ? 'Yes': 'No'}`);
      if (item.description) {
        lines.push(`-# <:reply:1368224908307468408> ${item.description}`);
      }
      Container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`${item.emoji} **${item.name}** — ${item.count}`)
      );

      Container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(lines.join('\n'))
      );
    }
    
    Container.addSeparatorComponents(separate => separate);
  
    Container.addActionRowComponents(
      ActionRow => ActionRow
      .addComponents([
        new ButtonBuilder()
        .setCustomId("leftinv")
        .setLabel("◀")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
        new ButtonBuilder()
        .setCustomId("rightinv")
        .setLabel("▶")
        .setStyle(ButtonStyle.Primary)
      ])
    )

    // Send embed
    return handleMessage(context, {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};