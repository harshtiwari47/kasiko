import {
  getUserData,
  updateUser
} from './database.js';


function isUserMention(arg) {
  return arg.startsWith("<@") && arg.endsWith(">");
}

function extractUserId(mention) {
  return mention.replace(/[^0-9]+/g,
    '');
}

function isNumber(value) {
  return !isNaN(value) && Number.isInteger(Number(value));
}

export const Helper = {
  isUserMention,
  extractUserId,
  isNumber
}

export default Helper;