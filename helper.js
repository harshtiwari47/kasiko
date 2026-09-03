import fs from 'fs';
import path from 'path';

import {
  getUserData,
  updateUser
} from './database.js';

// A universal function for sending responses both to text commands and slash commands.
// Seamlessly adapts to interaction reply/editReply/followUp states and text channel messages.
export async function handleMessage(context, data) {
  if (!context) return null;
  const isInteraction = (typeof context.isCommand === 'function' ? context.isCommand() : !!context.isCommand) ||
    !!context.commandName ||
    (typeof context.isChatInputCommand === 'function' ? context.isChatInputCommand() : false) ||
    (typeof context.isButton === 'function' ? context.isButton() : false) ||
    (typeof context.isStringSelectMenu === 'function' ? context.isStringSelectMenu() : false) ||
    (typeof context.deferReply === 'function' && typeof context.editReply === 'function');

  if (isInteraction) {
    try {
      if (context.deferred || context.replied) {
        return await context.editReply(data);
      }
      return await context.reply(data);
    } catch (err) {
      if (err.code === 40060 || err.code === 'InteractionAlreadyReplied' || context.deferred || context.replied) {
        return await context.editReply(data).catch(e => context.followUp?.(data).catch(() => null));
      }
      if (err.code === 'InteractionNotReplied') {
        return await context.reply(data).catch(() => null);
      }
      if (![50001, 50013, 10008].includes(err.code)) console.error(err);
      return null;
    }
  } else if (typeof context.send === 'function') {
    return await context.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else if (context.channel?.send) {
    return await context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return null;
  }
}

export function discordUser(context) {
  const data = {
    username: null,
    id: null,
    avatar: null,
    name: null
  };

  if (!context) return data;

  // If context is already an extracted discordUser object
  if (context.id && context.username && !context.user && !context.author && !context.member) {
    data.id = context.id;
    data.username = context.username;
    data.avatar = context.avatar || null;
    data.name = context.name || context.username;
    return data;
  }

  const userObj = (typeof context.displayAvatarURL === 'function')
    ? context
    : (context.user || context.author || null);

  if (typeof userObj?.displayAvatarURL === 'function') {
    try {
      data.avatar = userObj.displayAvatarURL({ dynamic: true });
    } catch (e) {
      data.avatar = null;
    }
  } else if (context.avatar) {
    data.avatar = context.avatar;
  }

  if (context.author) {
    data.username = context.author.username;
    data.id = context.author.id;
  } else if (context.user) {
    data.username = context.user.username;
    data.id = context.user.id;
  } else if (context.id) {
    data.id = context.id;
    data.username = context.username || context.id;
  }

  data.name = context?.member?.displayName ?? context?.user?.globalName ?? context?.author?.globalName ?? data.username;

  return data;
}

function isUserMention(arg, message) {
  if (!arg || typeof arg !== "string") return false;
  const match = arg.match(/^<@!?(\d+)>$/);
  if (match) {
    if (message?.guild?.members?.cache) {
      const targetUser = message.guild.members.cache.get(match[1]);
      if (targetUser) {
        return true;
      }
    }
    return true;
  }
  return false;
}

function extractUserId(mention) {
  return mention.replace(/[^0-9]+/g,
    '');
}

function isNumber(value) {
  return !isNaN(value) && Number.isInteger(Number(value));
}

export function parseAmount(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isNaN(input) || input <= 0 ? null : Math.floor(input);
  }
  const str = String(input).toLowerCase().trim().replace(/,/g, '');
  if (str === 'all' || str === 'max' || str === 'a' || str === 'm') {
    return 'all';
  }
  if (str.endsWith('k')) {
    const val = parseFloat(str.slice(0, -1));
    return isNaN(val) || val <= 0 ? null : Math.floor(val * 1000);
  }
  if (str.endsWith('m')) {
    const val = parseFloat(str.slice(0, -1));
    return isNaN(val) || val <= 0 ? null : Math.floor(val * 1000000);
  }
  if (str.endsWith('b')) {
    const val = parseFloat(str.slice(0, -1));
    return isNaN(val) || val <= 0 ? null : Math.floor(val * 1000000000);
  }
  const num = parseInt(str, 10);
  return isNaN(num) || num <= 0 ? null : num;
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

export async function wait(ms) {
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

// Other helpers

/**
* Read command.cooldown (expected in milliseconds).
* If missing or not a positive number, default to MIN_MS.
* Clamp to [MIN_MS, MAX_MS].
*/
export function normalizeCooldownMs(command) {
  const MIN_MS = 5 * 1000; // 5 seconds
  const MAX_MS = 2 * 24 * 60 * 60 * 1000; // 2 days = 172,800,000 ms

  let cdMs = command.cooldown;
  if (typeof cdMs !== 'number' || isNaN(cdMs) || cdMs < MIN_MS) {
    return MIN_MS;
  }
  if (cdMs > MAX_MS) {
    return MAX_MS;
  }
  return cdMs;
}

export function formatMs(ms) {
  let remaining = ms;
  const units = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;
  const secondMs = 1000;

  const days = Math.floor(remaining / dayMs);
  if (days > 0) {
    units.push(`${days}d`);
    remaining -= days * dayMs;
  }
  const hours = Math.floor(remaining / hourMs);
  if (hours > 0) {
    units.push(`${hours}h`);
    remaining -= hours * hourMs;
  }
  const minutes = Math.floor(remaining / minuteMs);
  if (minutes > 0) {
    units.push(`${minutes}m`);
    remaining -= minutes * minuteMs;
  }
  const seconds = Math.ceil(remaining / secondMs);
  if (seconds > 0) {
    units.push(`${seconds}s`);
  }
  if (units.length === 0) {
    return '1s';
  }
  return units.join(' ');
}

export function formatTTL(ttl) {
  const days = Math.floor(ttl / 86400);
  const hours = Math.floor((ttl % 86400) / 3600);
  const minutes = Math.floor((ttl % 3600) / 60);
  const seconds = ttl % 60;

  let parts = [];

  if (days > 0) parts.push(`${days} day${days !== 1 ? 's': ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's': ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's': ''}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's': ''}`);

  return parts.join(" ");
}


export const Helper = {
  isUserMention,
  extractUserId,
  isNumber,
  parseAmount,
  newsDatabase,
  checkTimeGap,
  randomInt,
  pickDragonType,
  wait,
  determineRPSWinner
}

export default Helper;