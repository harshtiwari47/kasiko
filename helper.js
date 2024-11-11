import fs from 'fs';
import path from 'path';

import {
  getUserData,
  updateUser
} from './database.js';


function isUserMention(arg, message) {
  if (arg.startsWith("<@") && arg.endsWith(">")) {
    if (message) {
      const targetUser = message.guild.members.cache.get(extractUserId(arg));

      if (!targetUser) return false
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


export const Helper = {
  isUserMention,
  extractUserId,
  isNumber,
  newsDatabase
}

export default Helper;