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
    let cashStatus = "";
    const currentCash = Number(userData["networth"]);

    if (currentCash < 1000000) cashStatus = `ᴺᴼᴺ-ᴹᴵᴸᴸᴵᴼᴺᴬᴵᴿᴱ`;
    if (currentCash > 1000000) cashStatus = `ᴹᴵᴸᴸᴵᴼᴺᴬᴵᴿᴱ`;
    if (currentCash > 5000000) cashStatus = `ᴮᴵᴸᴸᴵᴼᴺᴬᴵᴿᴱ`;
    if (currentCash > 10000000) cashStatus = `ᵀᴿᴵᴸᴸᴵᴼᴺᴬᴵᴿᴱ`;
    if (currentCash > 15000000) cashStatus = `ᶜᴴᴵᴸᴸᴵᴺᴬᴵᴿᴱ`;

    if (currentCash)
      message.channel.send(`### 💳 **${message.author.username} 𝐁𝐚𝐥𝐚𝐧𝐜𝐞**\n` + `💸 | **<:kasiko_coin:1300141236841086977> ${userData[stat].toLocaleString()}** 𝑪𝒂𝒔𝒉\n` + `-# ${cashStatus}`);
  }
  if (stat === "trust") {
    message.channel.send(`**${message.author.username}** has total **${userData[stat]}** Trust Score.`);
  }
  if (stat === "networth") {
    let newNetWorth = await updateNetWorth(message.author.id);
    if (newNetWorth) {
      userData[stat] = newNetWorth;
    }
    message.channel.send(`**${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat].toLocaleString()}** net worth.`);
  }
  if (stat === "level") {
    // Calculate experience required for the next level
    const expRequiredNextLvl = (Math.pow(userData["level"] + 1, 2) * 100) - Number(userData["exp"]);

    message.channel.send(
      `**${message.author.username}**, your level is 🏆 **${userData["level"]}**.\n` +
      `You need ✴️ **${expRequiredNextLvl}** more experience points to reach the next level!`
    );
  }
  if (stat === "exp") {
    message.channel.send(`**${message.author.username}**'s current experience points are ✴️ **${userData[stat].toLocaleString()}**.`);
  }
  if (stat === "charity") {
    message.channel.send(`**${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat].toLocaleString()}** charity.`);
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
    "stats"],
  // These aliases allow calling the command with any of the stats directly
  args: "<type>",
  example: [
    "cash",
    "stat cash",
    "networth",
    "charity",
    "trust",
    "level",
    "exp"
  ],
  related: ["leaderboard",
    "profile"],
  cooldown: 10000,
  category: "🧮 Stats",

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