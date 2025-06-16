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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionType
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
      name
    } = discordUser(context);


    let userData;
    try {
      userData = await getUserData(userId);
    } catch (err) {
      return handleMessage(context, '❌ Unable to fetch your inventory right now. Please try again later.');
    }

    const scratchCount = userData.scratchs ?? 0;
    const roseCount = userData.roses ?? 0;

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

    // Build embed
    const embed = new EmbedBuilder()
    .setTitle(`🎒 ${name}'s Inventory`)
    .setColor('Random')

    // For each item, add a field
    for (const item of inventoryItems) {
      // Format value with count and flags
      const lines = [];
      lines.push(`-# **Sellable:** ${item.sellable ? 'Yes': 'No'} **Shareable:** ${item.shareable ? 'Yes': 'No'}`);
      if (item.description) {
        lines.push(`-# <:reply:1368224908307468408> ${item.description}`);
      }
      embed.addFields({
        name: `${item.emoji} ${item.name} — ${item.count}`,
        value: lines.join('\n'),
        inline: false
      });
    }

    // Send embed
    return handleMessage(context, {
      embeds: [embed]
    });
  }
};