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

async function sendUserStat(stat, context) {
  const { id: userId, name } = discordUser(context);
  const userData = await getUserData(userId);
  if (!userData) {
    return await handleMessage(context, "<:warning:1366050875243757699> User profile not found.");
  }

  if (stat === "cash") {
    const currentCash = Number(userData["cash"] || 0);
    const networth = Number(userData["networth"] || 0);
    let cashStatus = "NON_MILLIONAIRE";
    if (networth >= 1000000) cashStatus = "MILLIONAIRE";
    if (networth >= 10000000) cashStatus = "BILLIONAIRE";
    if (networth >= 50000000) cashStatus = "TRILLIONAIRE";

    return await handleMessage(context, `### 🜲 **${name} Balance**\n` + `**<:kasiko_coin:1300141236841086977> ⚡ ${currentCash.toLocaleString()}** 𝑪𝒂𝒔𝒉\n` + `-# ⓘ ${cashStatus}`);
  }
  if (stat === "trust") {
    return await handleMessage(context, `**${name}** has total **${userData[stat] || 0}** Trust Score.`);
  }
  if (stat === "charity") {
    const charityAmount = Number(userData["charity"] || 0);
    return await handleMessage(context, `**${name}** has donated a total of <:kasiko_coin:1300141236841086977> **${charityAmount.toLocaleString()}** to charity.`);
  }
  if (stat === "networth") {
    let newNetWorth = await calculateNetWorth(userData);
    if (newNetWorth) {
      userData[stat] = newNetWorth;
    }
    return await handleMessage(context, `🜲 **${name}** has total <:kasiko_coin:1300141236841086977>**${Number(userData[stat] || 0).toLocaleString()}** net worth.`);
  }
  if (stat === "level") {
    const expRequiredNextLvl = (Math.pow(Number(userData["level"] || 1) + 1, 2) * 100) - Number(userData["exp"] || 0);

    return await handleMessage(context,
      `⭐ **${name}**, your level is <:level:1389092923525824552> **${userData["level"] || 1}**.\n` +
      `You need <:exp:1389092623477637190> **${Math.max(0, expRequiredNextLvl).toLocaleString()}** more experience points to reach the next level!`
    );
  }
  if (stat === "exp") {
    return await handleMessage(context, `**${name}**'s current experience points are <:exp:1389092623477637190> **${Number(userData[stat] || 0).toLocaleString()}**.`);
  }
}

function handleUserStat(statType, context) {
  let name = statType;
  if (statType === "c" || statType === "bal" || statType === "balance") name = "cash";
  if (statType === "ts") name = "trust";
  if (statType === "nw") name = "networth";
  if (statType === "cy") name = "charity";

  return sendUserStat(name, context);
}

export default {
  name: "stat",
  description: "View various user statistics like cash, net worth, charity, or trust level.",
  aliases: ["cash", "c", "networth", "nw", "charity", "cy", "trust", "ts", "level", "exp", "bal", "balance"],
  args: "<type>",
  emoji: "📊",
  example: [
    "cash",
    "stat cash",
    "networth",
    "trust",
    "charity",
    "level",
    "exp"
  ],
  related: ["leaderboard", "profile"],
  cooldown: 10000,
  category: "📈 Statistics",

  execute: async (args, message) => {
    if (args[0] && args[0] !== "stat") {
      const statType = args[0].toLowerCase();
      return await handleUserStat(statType, message);
    } else if (args[1]) {
      const statType = args[1].toLowerCase();
      return await handleUserStat(statType, message);
    } else {
      return await handleMessage(message, "<:warning:1366050875243757699> Invalid Command\nUse `stat cash`, `stat networth`, `stat trust`, `stat charity`, `stat level`, `stat exp`");
    }
  }
};
