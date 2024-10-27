import { profile } from './profile.js';
import { toss } from './toss.js';

export default async function textCommands(message) {
  let textMessage = message.content.toLowerCase().trim();
  let args = textMessage.split(" ");

  // check whether message is a command
  if (!textMessage.startsWith("kas")) return

  // check whether user provided arguments or not
  if (args[1] && !args[1].trim().startsWith(".")) return

  // user request profile
  if (args[1] && args[1].trim().includes("profile")) {
   await profile(message.author.id, message.channel);
  }
  
  // user toss coin
  if (args[1] && args[1].trim().includes("tosscoin") && args[2] && !isNaN(args[2])) {
   await toss(message.author.id, args[2], message.channel);
  }
}