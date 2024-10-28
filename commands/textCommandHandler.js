import {
  profile
} from './profile.js';
import {
  toss
} from './toss.js';
import {
  guess
} from './guess.js';
import {
  dailylogin
} from './dailylogin.js';
import {
  give
} from './give.js';

import {
  getUserData,
  updateUser
} from '../database.js';

export default async function textCommands(message) {
  let textMessage = message.content.toLowerCase().trim();
  let args = textMessage.split(" ");

  // check whether message is a command
  if (!textMessage.startsWith("kas")) return

  // check whether user provided arguments or not
  if (args[1] && !args[1].toLowerCase().trim().startsWith(".")) return;
  
  // request others profile
  if (args[1] && (args[1].toLowerCase().trim().includes("profile") || args[1].trim() === ".p") && args[2] && (args[2].trim().startsWith("<@") && args[2].trim().endsWith(">"))) {
    return await profile(args[2].replace(/[^0-9]+/g, ''), message.channel);
  }
  
  // request profile
  if (args[1] && (args[1].toLowerCase().trim().includes("profile") || args[1].trim() === ".p")) {
    return await profile(message.author.id, message.channel);
  }
  
  // daily login rewards 
  if (args[1] && (args[1].toLowerCase().trim().includes("daily") || args[1].trim() === ".dr")) {
    return await dailylogin(message.author.id, message.channel);
  }
  
  // give cash
  if (args[1] && (args[1].toLowerCase().trim().includes("give") || args[1].trim() === ".gv") && !isNaN(args[2].trim()) && args[3] && (args[3].trim().startsWith("<@") && args[3].trim().endsWith(">"))) {
    if (!Number.isInteger(Number(args[2]))){
      return message.channel.send("⚠️ Invalid :kasiko_coin:1300141236841086977> cash amount! Cash amount should be an Integer.");
    }
    return await give(message, message.author.id, args[2], args[3].replace(/[^0-9]+/g, ''));
  }

  // toss coin
  if (args[1] && (args[1].toLowerCase().trim().includes("tosscoin") || args[1].trim() === ".tc") && args[2] && !isNaN(args[2])) {
    return await toss(message.author.id, args[2], message.channel);
  }

  // guess number
  if (args[1] && (args[1].toLowerCase().trim().includes("guessno") || args[1].trim() === ".gn") && args[2] && !isNaN(args[2]), args[3] && !isNaN(args[3])) {
    return await guess(message.author.id, Number(args[2]), Number(args[3]), message.channel);
  }

  // Normal commands

  // cash
  if (args[1] && (args[1].toLowerCase().trim().includes("cash") || args[1].trim() === ".c")) {
    let userData = getUserData(message.author.id);
    return message.channel.send(`**@${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData.cash}** 𝑪𝒂𝒔𝒉.`);
  }

  // charity
  if (args[1] && (args[1].toLowerCase().trim().includes("charity") || args[1].trim() === ".chty")) {
    let userData = getUserData(message.author.id);
    return message.channel.send(`**@${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData.charity}** 𝑪𝒉𝒂𝒓𝒊𝒕𝒚 .`);
  }

  // Trust Score
  if (args[1] && (args[1].toLowerCase().trim().includes("trust") || args[1].trim() === ".ts")) {
    let userData = getUserData(message.author.id);
    return message.channel.send(`**@${message.author.username}** has **${userData.charity}** 𝑻𝒓𝒖𝒔𝒕 𝑺𝒄𝒐𝒓𝒆.`);
  }
}