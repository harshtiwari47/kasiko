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
  ctx.font = 'bold 28px Sans';
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
  description: 'Buy or scratch cash-only scratch cards.',
  emoji: '<:scratch_card:1382990344186105911>',
  category: '🛍️ Shop',
  cooldown: 10000,
  execute: async (args, context) => {
    args.shift();

    try {
      const {
        id,
        name
      } = discordUser(context);
      const userData = await getUserData(id);
      if (!userData) {
        return await handleMessage(context, {
          content: `<:warning:1366050875243757699> ${name}, could not retrieve your data.`
        });
      }

      // Initialize scratch count if missing
      if (typeof userData.scratchs !== 'number') {
        userData.scratchs = 0;
      }

      // Subcommand: scratch
      if (args.length === 0) {
        const embed = new EmbedBuilder()
        .setTitle(`${name}'s <:scratch_card:1382990344186105911> Scratch Cards`)
        .setDescription(`-# To use a scratch card, command \`use scratch\``)
        .addFields(
          {
            name: '<:scratch_card:1382990344186105911> Remaining Cards', value: `${userData.scratchs}`, inline: true
          }
        );

        return await handleMessage(context, {
          embeds: [embed]
        });
      }

      // Unknown subcommand
      return await handleMessage(context, {
        content: `❓ ${name}, invalid usage. Use:\n`+
        `• \` buy scratch <number> \` to buy cards (cost <:kasiko_coin:1300141236841086977> ${CARD_COST} each).` +
        `• \` use scratch \` to scratch a card.`
      });
    } catch (e) {
      console.error('Error in scratch command:', e);
      return await handleMessage(context, {
        content: `<:warning:1366050875243757699> Oops, something went wrong in scratch command.`
      });
    }
  }
};