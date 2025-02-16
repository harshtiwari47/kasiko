import {
  Garden
} from '../../../models/Garden.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';


// Each flower type has name, key, emoji, and cash value
const flowersData = [{
  name: 'Tulip',
  key: 'tulip',
  emoji: '🌷',
  value: 100
},
  {
    name: 'Cherry Blossom',
    key: 'cherryBlossom',
    emoji: '🌸',
    value: 120
  },
  {
    name: 'Rose',
    key: 'rose',
    emoji: '🌹',
    value: 160
  },
  {
    name: 'Hibiscus',
    key: 'hibiscus',
    emoji: '🌺',
    value: 200
  },
  {
    name: 'Sunflower',
    key: 'sunflower',
    emoji: '🌻',
    value: 250
  },
  {
    name: 'Daisy',
    key: 'daisy',
    emoji: '🌼',
    value: 80
  },
];

// Determine total capacity given the garden level
function getGardenCapacity(level) {
  return 10 + level * 5;
}

/**
* Start a garden (if not already started) or tell user if they're already gardening.
*/
async function startGarden(userId, username) {
  let userGarden = await Garden.findOne({
    userId
  });
  if (userGarden && userGarden.startTime) {
    // Garden already exists & has a start time
    const msElapsed = Date.now() - new Date(userGarden.startTime).getTime();
    const days = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msElapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msElapsed % (1000 * 60 * 60)) / (1000 * 60));
    let timeString = '';
    if (days) timeString += `${days} day${days > 1 ? 's': ''} `;
    if (hours) timeString += `${hours} hour${hours > 1 ? 's': ''} `;
    if (minutes) timeString += `${minutes} minute${minutes > 1 ? 's': ''}`;
    return `𝐻𝑒𝑦 **${username}**, 𝑦𝑜𝑢𝑟 𝑔𝑎𝑟𝑑𝑒𝑛 𝑖𝑠 𝑎𝑙𝑟𝑒𝑎𝑑𝑦 𝑎𝑐𝑡𝑖𝑣𝑒! (𝖲𝗍𝖺𝗋𝗍𝖾𝖽 ${timeString} 𝖺𝗀𝗈)`;
  }

  // Create or reset the garden’s start time
  userGarden = await Garden.findOneAndUpdate(
    {
      userId
    },
    {
      startTime: new Date()
    },
    {
      upsert: true, new: true
    }
  );

  const capacity = getGardenCapacity(userGarden.level);
  return (
    `**${username}**, your garden is now started!\n` +
    `You can collect flowers every 10 minutes.\n` +
    `Current garden level: **${userGarden.level}** (Capacity: ${capacity} flowers).`
  );
}

/**
* Collect flowers.
* Formula: (timeElapsed in 10-min blocks) + garden.level = baseFlowers
* If waterActive is true, +50% bonus, then disable waterActive.
*/
async function collectFlowers(userId, username) {
  const userGarden = await Garden.findOne({
    userId
  });
  if (!userGarden || !userGarden.startTime) {
    return `⛲ | You don't have a garden yet, **${username}**. Start one with \`garden\`.`;
  }

  // 10-minute increments since last start/collect
  const timeElapsed = Math.floor((Date.now() - new Date(userGarden.startTime).getTime()) / 600000);
  if (timeElapsed < 1) {
    return `⛲ | Not enough time has passed, **${username}**. You need at least 10 minutes between collects.`;
  }

  let flowersToAdd = timeElapsed + userGarden.level;

  // If the garden was watered, apply a +50% bonus and disable it
  if (userGarden.waterActive) {
    flowersToAdd = Math.floor(flowersToAdd * 1.5);
    userGarden.waterActive = false; // turn off the watering bonus after next collect
  }

  // Check capacity
  const capacity = getGardenCapacity(userGarden.level);

  let currentTotal = 0;
  for (const key of Object.keys(userGarden.flowers.toJSON())) {
    if (key === "_id") continue;
    currentTotal += userGarden.flowers[key];
  }

  const canAdd = capacity - currentTotal;
  if (canAdd <= 0) {
    return (
      `⛲ | Your garden is full, ${username}! (Capacity: ${capacity} flowers)\n` +
      `Try exchanging or upgrading your garden.`
    );
  }
  if (flowersToAdd > canAdd) {
    flowersToAdd = canAdd; // can't exceed capacity
  }

  // Distribute these flowers randomly among the 6 types
  const distribution = {
    tulip: 0,
    cherryBlossom: 0,
    rose: 0,
    hibiscus: 0,
    sunflower: 0,
    daisy: 0,
  };
  for (let i = 0; i < flowersToAdd; i++) {
    const pick = flowersData[Math.floor(Math.random() * flowersData.length)];
    distribution[pick.key]++;
  }

  // Update the user’s flower counts
  for (const flower of flowersData) {
    userGarden.flowers[flower.key] += distribution[flower.key];
  }

  // Reset the start time
  userGarden.startTime = new Date();
  await userGarden.save();

  // Summarize
  const lines = flowersData
  .filter(f => distribution[f.key] > 0)
  .map(f => `+${distribution[f.key]} ${f.emoji} ${f.name}`)
  .join('\n');

  const newTotal = currentTotal + flowersToAdd;
  return (
    `⛲ | **${username}**, you collected **${flowersToAdd}** flowers!\n` +
    lines + '\n' +
    `You now have **${newTotal}** flowers (Capacity: ${capacity}).`
  );
}

/**
* Exchange all flowers in storage for cash.
*/
async function exchangeFlowers(userId, username) {
  try {
    const userGarden = await Garden.findOne({
      userId
    });
    if (!userGarden) {
      return `⛲ | No garden found, **${username}**. Use \`garden\` to start one.`;
    }

    let totalCash = 0;
    let summaryLines = [];
    for (const f of flowersData) {
      const count = userGarden.flowers[f.key];
      if (count > 0) {
        const earned = count * f.value;
        totalCash += earned;
        summaryLines.push(`${count}x${f.emoji} => ${earned}`);
      }
    }

    if (totalCash === 0) {
      return `⛲ | You have no flowers to exchange, **${username}**.`;
    }

    // Add money to user
    const userData = await getUserData(userId);
    userData.cash += totalCash;
    await updateUser(userId, userData);

    // Reset stored flowers
    for (const f of flowersData) {
      userGarden.flowers[f.key] = 0;
    }
    await userGarden.save();

    return (
      `⛲ | **${username}**, you exchanged all your flowers 💐 for <:kasiko_coin:1300141236841086977> **${totalCash}** 𝒄𝒂𝒔𝒉.\n` +
      `Breakdown:\n${summaryLines.join('\n')}`
    );
  } catch (err) {
    return (
      `⚠ Something went wrong during the flower exchange!\n-# **Error:** ${err.message}`
    )
  }
}

/**
* Upgrade garden level -> higher capacity and faster base collection.
* Cost formula: 5000 * currentLevel
*/
async function upgradeGarden(userId, username) {
  try {
    const userGarden = await Garden.findOne({
      userId
    });
    if (!userGarden) {
      return `⛲ | No garden found, **${username}**. Use \`garden\` to start one.`;
    }

    const maxLevel = 20;
    if (userGarden.level >= maxLevel) {
      return `⛲ | Your garden is already at max level (${maxLevel}), **${username}**.`;
    }

    const upgradeCost = 5000 * userGarden.level;
    const userData = await getUserData(userId);
    if (userData.cash < upgradeCost) {
      return (
        `⛲ | You need <:kasiko_coin:1300141236841086977> ${upgradeCost} 𝒄𝒂𝒔𝒉 to upgrade, but you only have ${userData.cash}, **${username}**.`
      );
    }

    // Deduct cost
    userData.cash -= upgradeCost;
    await updateUser(userId, userData);

    // Increase level
    userGarden.level += 1;
    await userGarden.save();

    const newCapacity = getGardenCapacity(userGarden.level);
    const nextCost = 5000 * userGarden.level;
    return (
      `⛲ | **${username}**, your garden is now **Level ${userGarden.level}**! 💐\n` +
      `Capacity: **${newCapacity}** flowers.\n` +
      `You spent <:kasiko_coin:1300141236841086977> **${upgradeCost}** 𝒄𝒂𝒔𝒉. Next upgrade will cost ${nextCost}.`
    );
  } catch (err) {
    return (
      `⚠ Something went wrong while upgrading the garden!\n-# **Error:** ${err.message}`
    );
  }
}

/**
* Water the garden for a bonus on the next collect.
* - Only once every 6 hours
* - If waterActive is still true, it doesn't stack.
* - Next collect = +50% more flowers (then waterActive resets to false).
*/
async function waterGarden(userId, username) {
  const userGarden = await Garden.findOne({
    userId
  });
  if (!userGarden || !userGarden.startTime) {
    return `⛲ | You don't have a garden, **${username}**! Use \`garden\` to start.`;
  }

  // 6-hour cooldown
  const COOLDOWN_HOURS = 6;
  const now = new Date();
  if (userGarden.lastWatered) {
    const diffHours = Math.floor((now - userGarden.lastWatered) / 1000 / 3600);
    if (diffHours < COOLDOWN_HOURS) {
      return (
        `⛲ | You can only water once every ${COOLDOWN_HOURS} hours, **${username}**. ` +
        `Try again later!`
      );
    }
  }

  if (userGarden.waterActive) {
    return `⛲ | You already have a watering bonus active, **${username}**! Collect first before watering again.`;
  }

  userGarden.waterActive = true;
  userGarden.lastWatered = now;
  await userGarden.save();

  return (
    `⛲ | You water your garden 💧, **${username}**! Your **next** flower collection will yield **50%** more flowers! 💐`
  );
}

/**
* Share flowers with another user: "garden share @mention <flowerType> <amount>"
*/
async function shareFlowers(giverId, giverName, receiver, flowerType, amount) {
  // Validate mention
  if (!receiver) {
    return `⛲ | Please mention a valid user to share with, ${giverName}.`;
  }
  const receiverId = receiver.id;
  const receiverName = receiver.username;

  // Check if both have gardens
  const giverGarden = await Garden.findOne({
    userId: giverId
  });
  if (!giverGarden) {
    return `⛲ | You don't have a garden, ${giverName}.`;
  }
  const receiverGarden = await Garden.findOne({
    userId: receiverId
  });
  if (!receiverGarden) {
    return `⛲ | ${receiverName} does not have a garden yet! They should use \`garden\` first.`;
  }

  // Check valid flowerType
  const valid = flowersData.find(f => f.key === flowerType);
  if (!valid) {
    return (
      `⛲ | Invalid flower type, ${giverName}. Choose one of: ` +
      flowersData.map(f => f.key).join(', ')
    );
  }

  const amt = parseInt(amount, 10);
  if (isNaN(amt) || amt <= 0) {
    return `⛲ | Invalid amount to share, ${giverName}. Please enter a positive number.`;
  }

  // Check if giver has enough
  if (giverGarden.flowers[flowerType] < amt) {
    return `⛲ | You don't have enough **${valid.name}** to share that many, ${giverName}.`;
  }

  // Transfer the flowers
  giverGarden.flowers[flowerType] -= amt;
  receiverGarden.flowers[flowerType] += amt;

  await giverGarden.save();
  await receiverGarden.save();

  return (
    `⛲ | **${giverName}** shared **${amt}** ${valid.emoji} **${valid.name}** with **${receiverName}**! 💐`
  );
}

/**
* View garden status in a casual text message.
*/
async function viewGardenStatus(userId, username) {
  // Attempt to start if none
  let startMsg = await startGarden(userId, username);

  // Re-fetch after start
  const userGarden = await Garden.findOne({
    userId
  });
  if (!userGarden) {
    return `Oops, something went wrong fetching your garden, ${username}.`;
  }

  const capacity = getGardenCapacity(userGarden.level);
  let totalStored = 0;
  for (const key of Object.keys(userGarden.flowers.toJSON())) {
    if (key === "_id") continue;
    totalStored += userGarden.flowers[key];
  }

  // Potentially how many are "waiting" to be collected
  const timeElapsed = Math.floor((Date.now() - new Date(userGarden.startTime).getTime()) / 600000);
  const potential = timeElapsed + userGarden.level;
  let readyToCollect = potential;
  // If capacity is nearly full, we can't physically store more
  const spaceLeft = capacity - totalStored;
  if (spaceLeft <= 0) {
    readyToCollect = 0;
  } else {
    if (readyToCollect > spaceLeft) readyToCollect = spaceLeft;
    if (readyToCollect < 0) readyToCollect = 0;
  }

  let flowerSummary = flowersData.map(f => {
    const count = userGarden.flowers[f.key];
    return `${f.emoji} ${f.name}: ${count}`;
  }).join(', ');

  // Water bonus?
  let waterStatus = userGarden.waterActive
  ? "Active! (Next collect is +50% bonus)": "Not active. (Water every 6 hours)";

  return (
    `${startMsg}\n\n` +
    `**⛲ Garden Status**\n` +
    `• 𝙻𝚎𝚟𝚎𝚕: **${userGarden.level}** ` + `• 𝙲𝚊𝚙𝚊𝚌𝚒𝚝𝚢: **${capacity}**\n` +
    `• 𝚂𝚝𝚘𝚛𝚎𝚍: **${totalStored}** ` + `• 𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎: **${readyToCollect}**\n` +
    `• 💧 𝖶𝖺𝗍𝖾𝗋𝗂𝗇𝗀 𝖡𝗈𝗇𝗎𝗌: ${waterStatus}\n\n` +
    `**💐 Flowers in Storage**\n` +
    `${flowerSummary}`
  );
}

/**
* Main export: garden command
* Usage:
*   garden           -> view garden status (auto-start if none)
*   garden collect   -> collect flowers
*   garden exchange  -> exchange flowers for cash
*   garden upgrade   -> upgrade the garden (cost = 5000 * currentLevel)
*   garden water     -> water your garden (next collect is +50%)
*   garden share @user <flowerType> <amount>
*/
export default {
  name: "garden",
  description: "Manage your flower garden.",
  aliases: ["g"],
  example: ["graden help"],
  emoji: "🎍",
  category: "🍬 Explore",
  cooldown: 10000,
  // seconds, if you want
  async execute(args, message) {
    try {
      const sub = args[1]?.toLowerCase();
      const userId = message.author.id;
      const username = message.author.username;

      switch (sub) {
      case "c":
      case "collect":
        {
          const response = await collectFlowers(userId, username);
          return message.channel.send(response).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

      case "e":
      case "exchange":
        {
          const response = await exchangeFlowers(userId, username);
          return message.channel.send(response).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

      case "u":
      case "upgrade":
        {
          const response = await upgradeGarden(userId, username);
          return message.channel.send(response).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

      case "w":
      case "water":
        {
          const response = await waterGarden(userId, username);
          return message.channel.send(response).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

      case "s":
      case "share":
        {
          // Format: garden share @mention flowerType amount
          const mention = message.mentions.users.first();
          const flowerType = args[3];
          const amount = args[4];
          const response = await shareFlowers(userId, username, mention, flowerType, amount);
          return message.channel.send(response).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

      case "h":
      case "help":
        const helpEmbed = new EmbedBuilder()
        .setColor('#77dd77')
        .setTitle('🌸 Garden Help - Grow Your Floral Paradise')
        .setDescription(`Nurture flowers, trade them for cash, and expand your garden!`)
        .addFields(
          {
            name: '🌻 Commands',
            value:
            `\`garden\` - View status/start\n` +
            `\`garden collect\` - Harvest flowers (10min cooldown)\n` +
            `\`garden exchange\` - Sell flowers for 𝒄𝒂𝒔𝒉\n` +
            `\`garden upgrade\` - Increase capacity (Cost: <:kasiko_coin:1300141236841086977> 5000 × level)\n` +
            `\`garden water\` - +50% next harvest (6hr cooldown)\n` +
            `\`garden share @user flower amount\` - Gift flowers`
          },
          {
            name: '🌺 Flower Types',
            value:
            `🌷 Tulip (<:kasiko_coin:1300141236841086977> 50)\n` +
            `🌸 Cherry (<:kasiko_coin:1300141236841086977> 60)\n` +
            `🌹 Rose (<:kasiko_coin:1300141236841086977> 80)\n` +
            `🌺 Hibiscus (<:kasiko_coin:1300141236841086977> 100)\n` +
            `🌻 Sunflower (<:kasiko_coin:1300141236841086977> 150)\n` +
            `🌼 Daisy (<:kasiko_coin:1300141236841086977> 40)`
          },
          {
            name: '💡 Tips',
            value:
            `• Water before collecting for bonus!\n` +
            `• Higher level = bigger capacity\n` +
            `• Rare flowers = more 𝒄𝒂𝒔𝒉!`
          }
        )
        .setFooter({
          text: `Watch your garden bloom!`
        });

        return message.channel.send({
          embeds: [helpEmbed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

      default:
        // Show the garden status or start if none
        const response = await viewGardenStatus(userId, username);
        return message.channel.send(response).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (error) {
      if (error.message !== "Unknown Message" && error.message !== "Missing Permissions") {
        console.error("Error in garden command:", error);
      }
      return message.channel.send(`Oops! Something went wrong: \`${error.message}\``).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },
};