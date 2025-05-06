import fs from 'fs';
import path from 'path';

import {
  getUserData,
  updateUser
} from './database.js';

// A universal function for sending responses both to text commands and slash commands.
// If it's an interaction (slash command), it will defer/edit reply.
// If it's a text command, it will just channel.send().
export async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.replied && !context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    // For normal text-based usage
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export function discordUser(context) {
  const data = {
    username: null,
    id: null,
    avatar: null,
    name: null
  }

  const avatarUrl = context.user
  ? context.user?.displayAvatarURL({
    dynamic: true
  }): context?.author?.displayAvatarURL({
    dynamic: true
  });

  if (avatarUrl) data.avatar = avatarUrl;
  if (context?.author) {
    data.username = context.author.username;
    data.id = context.author.id;
  } else if (context.user) {
    data.username = context.user.username;
    data.id = context.user.id;
  }

  data.name = context?.member?.displayName ?? data.username;

  return data;
}

function isUserMention(arg, message) {
  if (arg.startsWith("<@") && arg.endsWith(">")) {
    if (message) {
      const targetUser = message.guild.members.cache.get(extractUserId(arg));
      if (!targetUser) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}

function extractUserId(mention) {
  return mention.replace(/[^0-9]+/g,
    '');
}

function isNumber(value) {
  return !isNaN(value) && Number.isInteger(Number(value));
}

function newsDatabase() {
  try {
    const newsDataPath = path.join(process.cwd(), 'data', 'stocknews.json');
    const data = fs.readFileSync(newsDataPath, 'utf-8');
    return JSON.parse(data) || [];
  } catch (e) {
    console.error(e);
  }
}

export function checkTimeGap(startTime, endTime, options = {
  format: 'hours'
}) {
  // Check if startTime and endTime are numbers (milliseconds)
  if (typeof startTime !== 'number' || typeof endTime !== 'number') {
    throw new Error("startTime and endTime must be in milliseconds");
  }

  // Calculate the difference in milliseconds
  const timeDifference = endTime - startTime;

  // Convert the difference to hours, minutes, or other units based on options
  let gap;
  if (options.format === 'hours') {
    gap = timeDifference / (1000 * 60 * 60); // Convert to hours
  } else if (options.format === 'minutes') {
    gap = timeDifference / (1000 * 60); // Convert to minutes
  } else if (options.format === 'seconds') {
    gap = timeDifference / 1000; // Convert to seconds
  } else {
    throw new Error("Unsupported format option");
  }

  return gap;
}
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickDragonType(dragonTypes) {
  const rand = Math.random();
  dragonTypes = dragonTypes.sort((a, b) => b.rarity - a.rarity);
  for (let i = 0; i < dragonTypes.length; i++) {
    if (rand > dragonTypes[i].rarity) {
      return dragonTypes[i];
    }
  }
  return dragonTypes[dragonTypes.length - 1];
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function determineRPSWinner(a, b) {
  if (a === b) return 'tie';
  const wins = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
  };
  return wins[a] === b ? 'challenger': 'opponent';
}


export const Helper = {
  isUserMention,
  extractUserId,
  isNumber,
  newsDatabase,
  checkTimeGap,
  randomInt,
  pickDragonType,
  wait,
  determineRPSWinner
}

export default Helper;