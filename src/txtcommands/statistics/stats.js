import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Helper
} from '../../../helper.js';

import {
  updateNetWorth
} from '../../../utils/updateNetworth.js';


async function sendUserStat(stat, message) {
  const userData = await getUserData(message.author.id);
  
  if (stat === "cash") {
    message.channel.send(`**${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat]}** 𝑪𝒂𝒔𝒉.`);
  }
  if (stat === "trust") {
    message.channel.send(`**${message.author.username}** has total **${userData[stat]}** Trust Score.`);
  }
  if (stat === "networth") {
    await updateNetWorth(message.author.id);
    message.channel.send(`**${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat]}** net worth.`);
  }
  if (stat === "level") {
    message.channel.send(`**${message.author.username}**'s level is 🏆 **${userData[stat]}**.`);
  }
  if (stat === "exp") {
    message.channel.send(`**${message.author.username}**'s current experience points are ✴️ **${userData[stat]}**.`);
  }
  if (stat === "charity") {
    message.channel.send(`**${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat]}** charity.`);
  }
}

// Helper function to determine which stat to display
function handleUserStat(statType, message) {
  let name = statType;
  if (statType === "c") name = "cash"
  if (statType === "ts") name = "trust"
  if (statType === "nw") name = "networth"
  if (statType === "cy") name = "charity"
  
  return sendUserStat(name, message);
}

// Export the command configuration for each stat
export default {
  name: "stat",
  description: "View various user statistics like cash, net worth, charity, or trust level.",
  aliases: ["cash", "c",
    "networth", "nw",
    "charity", "cy",
    "trust", "ts", "level", "exp"],
  // These aliases allow calling the command with any of the stats directly
  args: "<type>",
  example: [
    "cash",
    "networth",
    "charity",
    "trust",
    "level",
    "exp"
  ],
  related: ["profile"],
  cooldown: 4000,
  category: "Stats",

  // Execute function based on the command alias
  execute: (args, message) => {
    if (args[0] && args[0] !== "stat") {
      const statType = args[0].toLowerCase();
      return handleUserStat(statType, message);
    } else if (args[1]) {
      const statType = args[1].toLowerCase();
      return handleUserStat(statType, message);
    } else {
        return message.channel.send("⚠️ Invalid Command\nUse `stat cash`, `stat networth`, `stat trust`, `stat charity`, `stat level`, `stat exp`");
    }
  }
};