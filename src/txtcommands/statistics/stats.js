import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Helper,
  handleMessage,
  discordUser
} from '../../../helper.js';

import {
  calculateNetWorth
} from '../../../utils/updateNetworth.js';

async function sendUserStat(stat, message) {
  const userData = await getUserData(message.author.id);
  if (!userData) return;

  const {
    name,
    avatar
  } = discordUser(message);

  if (stat === "cash") {
    const currentCash = Number(userData["cash"] || 0);
    const networth = Number(userData["networth"] || 0);
    let cashStatus = "ɴᴏɴ_ᴍɪʟʟɪᴏɴᴀɪʀᴇ";
    if (networth >= 1000000) cashStatus = "ᴍɪʟʟɪᴏɴᴀɪʀᴇ";
    if (networth >= 10000000) cashStatus = "ʙɪʟʟɪᴏɴᴀɪʀᴇ";
    if (networth >= 50000000) cashStatus = "ᴛʀɪʟʟɪᴏɴᴀɪʀᴇ";

    return message.channel.send(`### 🜲 **${name} 𝐁𝐚𝐥𝐚𝐧𝐜𝐞**\n` + `**<:kasiko_coin:1300141236841086977> ⚡︎ ${currentCash.toLocaleString()}** 𝑪𝒂𝒔𝒉\n` + `-# ⓘ ${cashStatus}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
  if (stat === "trust") {
    return message.channel.send(`**${name}** has total **${userData[stat] || 0}** Trust Score.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
  if (stat === "charity") {
    const charityAmount = Number(userData["charity"] || 0);
    return message.channel.send(`**${name}** has donated a total of <:kasiko_coin:1300141236841086977> **${charityAmount.toLocaleString()}** to charity.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
  if (stat === "networth") {
    let newNetWorth = await calculateNetWorth(userData);
    if (newNetWorth) {
      userData[stat] = newNetWorth;
    }
    return message.channel.send(`🜲 **${name}** has total <:kasiko_coin:1300141236841086977>**${Number(userData[stat] || 0).toLocaleString()}** net worth.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
  if (stat === "level") {
    const expRequiredNextLvl = (Math.pow(Number(userData["level"] || 1) + 1, 2) * 100) - Number(userData["exp"] || 0);

    return message.channel.send(
      `亗 **${name}**, your level is <:level:1389092923525824552> **${userData["level"] || 1}**.\n` +
      `You need <:exp:1389092623477637190> **${Math.max(0, expRequiredNextLvl)}** more experience points to reach the next level!`
    ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
  if (stat === "exp") {
    return message.channel.send(`**${name}**'s current experience points are <:exp:1389092623477637190> **${Number(userData[stat] || 0).toLocaleString()}**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

// Helper function to determine which stat to display
function handleUserStat(statType, message) {
  let name = statType;
  if (statType === "c") name = "cash";
  if (statType === "bal") name = "cash";
  if (statType === "balance") name = "cash";
  if (statType === "ts") name = "trust";
  if (statType === "nw") name = "networth";
  if (statType === "cy") name = "charity";

  return sendUserStat(name, message);
}

// Export the command configuration for each stat
export default {
  name: "stat",
  description: "View various user statistics like cash, net worth, charity, or trust level.",
  aliases: ["cash",
    "c",
    "networth",
    "nw",
    "charity",
    "cy",
    "trust",
    "ts",
    "level",
    "exp",
    "bal",
    "balance"],
  args: "<type>",
  emoji: "🧗🏻",
  example: [
    "cash",
    "stat cash",
    "networth",
    "trust",
    "charity",
    "level",
    "exp"
  ],
  related: ["leaderboard",
    "profile"],
  cooldown: 10000,
  category: "📰 Information",

  // Execute function based on the command alias
  execute: (args, message) => {
    if (args[0] && args[0] !== "stat") {
      const statType = args[0].toLowerCase();
      return handleUserStat(statType, message);
    } else if (args[1]) {
      const statType = args[1].toLowerCase();
      return handleUserStat(statType, message);
    } else {
      return message.channel.send("<:warning:1366050875243757699> Invalid Command\nUse `stat cash`, `stat networth`, `stat trust`, `stat charity`, `stat level`, `stat exp`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};