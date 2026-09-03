import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
  ComponentType
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  discordUser
} from '../../../helper.js';
import {
  createCanvas,
  loadImage
} from '@napi-rs/canvas';
import registerGlobalFonts from '../../../utils/canvasFont.js';
registerGlobalFonts();

import {
  ALLITEMS
} from "./shopIDs.js";

// Constants
const CARD_COST = 15000; // cost per scratch card
const MAX_WIN = 100000; // max cash win
const MIN_WIN = 10000; // min cash win when non-zero
const ZERO_PROB = 0.7; // 50% chance to win nothing
const MAX_PROB = 0.05; // 5% chance to win MAX_WIN

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

// Generate scratch result: 0, MAX_WIN, or random between MIN_WIN and MAX_WIN
export function getScratchResult() {
  const r = Math.random();
  if (r < ZERO_PROB) {
    return 0;
  } else if (r < ZERO_PROB + MAX_PROB) {
    return MAX_WIN;
  } else {
    // random between MIN_WIN and MAX_WIN, excluding MAX_WIN
    return Math.floor(Math.random() * (MAX_WIN - MIN_WIN)) + MIN_WIN;
  }
}

// Generate a canvas image showing the scratch result
export async function generateScratchImage(amount) {
  const width = 400;
  const height = 200;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, width, height);

  // Draw a scratch card shape
  ctx.fillStyle = '#888';
  ctx.fillRect(20, 20, width - 40, height - 40);

  // Overlay text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Roboto, sans-serif';
  const text = amount > 0 ? `You won $${amount.toLocaleString()}!`: 'No Luck';
  const textMetrics = ctx.measureText(text);
  const textX = (width - textMetrics.width) / 2;
  const textY = height / 2 + 10;
  ctx.fillText(text, textX, textY);

  // Return buffer
  return canvas.encode('png');
}

export default {
  name: 'scratch',
  description: 'Buy or scratch cash-only scratch cards to win big cash prizes.',
  aliases: ['scratchcard', 'scratches', 'scratchcards'],
  emoji: '<:scratch_card:1382990344186105911>',
  category: '🛍️ Shop',
  cooldown: 5000,
  example: [
    'scratch',
    'scratch buy 2',
    'buy scratch 1',
    'use scratch'
  ],
  execute: async (args, context) => {
    try {
      const {
        id,
        name
      } = discordUser(context);

      const sub = args[1]?.toLowerCase();

      // Dynamic import to avoid circular dependency
      const { ITEM_DEFINITIONS } = await import('../../inventory.js');

      // Subcommand: buy
      if (sub === 'buy' || sub === 'b') {
        const amount = parseInt(args[2] || '1', 10);
        return await ITEM_DEFINITIONS.scratch_card.buyHandler([amount], context);
      }

      // Subcommand: use
      if (sub === 'use' || sub === 'u') {
        return await ITEM_DEFINITIONS.scratch_card.useHandler(['scratch'], context);
      }

      const userData = await getUserData(id);
      if (!userData) {
        return await handleMessage(context, {
          content: `<:warning:1366050875243757699> **${name}**, could not retrieve your account data.`
        });
      }

      const remainingCards = userData.inventory?.['scratch_card'] || 0;

      // If player has cards, directly scratch one!
      if (remainingCards > 0) {
        return await ITEM_DEFINITIONS.scratch_card.useHandler(['scratch'], context);
      }

      // If 0 cards, show helpful card info with clear "kas" prefixes and quick buy button
      const canAfford = (userData.cash || 0) >= CARD_COST;

      const embed = new EmbedBuilder()
        .setTitle(`${name.toUpperCase()}'S <:scratch_card:1382990344186105911> SCRATCH CARDS`)
        .setColor(0xFFA500)
        .setDescription(
          `You currently have **0** scratch cards in your inventory.\n\n` +
          `**💡 How to get & use Scratch Cards:**\n` +
          `• 🛒 **Buy Cards:** \`kas buy scratch <amount>\` (Cost: <:kasiko_coin:1300141236841086977> **${CARD_COST.toLocaleString()} Cash** each)\n` +
          `• ✨ **Scratch Card:** \`kas scratch\` or \`kas use scratch\`\n` +
          `• 🎁 **Prizes:** Win up to <:kasiko_coin:1300141236841086977> **${MAX_WIN.toLocaleString()} Cash**!`
        )
        .setFooter({ text: 'Always include the "kas" prefix when typing commands!' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`scratch_buy_quick_${id}`)
          .setLabel(`🛒 Buy 1 Card (${CARD_COST.toLocaleString()} Cash)`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(!canAfford)
      );

      const msg = await handleMessage(context, {
        embeds: [embed],
        components: [row]
      });

      if (msg?.createMessageComponentCollector) {
        const collector = msg.createMessageComponentCollector({
          filter: i => i.user.id === id && i.customId === `scratch_buy_quick_${id}`,
          time: 30000,
          max: 1
        });
        collector.on('collect', async (i) => {
          await i.deferUpdate().catch(() => {});
          await ITEM_DEFINITIONS.scratch_card.buyHandler([1], context);
        });
      }
    } catch (e) {
      console.error('Error in scratch command:', e);
      return await handleMessage(context, {
        content: `<:warning:1366050875243757699> Oops, something went wrong in scratch command.`
      });
    }
  }
};