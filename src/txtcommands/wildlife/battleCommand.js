import User from '../../../models/Hunt.js';
import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import { ITEM_DEFINITIONS } from '../../inventory.js';
import { checkPassValidity } from '../explore/pass.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AnimalsDatabasePath = path.join(__dirname, './animals.json');
const animalsData = JSON.parse(fs.readFileSync(AnimalsDatabasePath, 'utf-8'));

// Helper function for sending messages
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

/**
 * Get animal base stats from animals.json
 */
function getAnimalBaseStats(animalName) {
  const animal = animalsData.animals.find(a => a.name.toLowerCase() === animalName.toLowerCase());
  if (!animal) {
    // Default stats if animal not found
    return { baseHp: 30, baseAttack: 5 };
  }
  return {
    baseHp: animal.baseHp || 30,
    baseAttack: animal.baseAttack || 5,
    emoji: animal.emoji || '🐾',
    rarity: animal.rarity || 1,
    type: animal.type || 'common'
  };
}

/**
 * Calculate animal stats based on level
 */
function calculateAnimalStats(animal) {
  const baseStats = getAnimalBaseStats(animal.name);
  const level = animal.level || 1;
  
  // HP increases by 5 per level, Attack by 1 per level
  const hp = (baseStats.baseHp || 30) + ((level - 1) * 5);
  const attack = (baseStats.baseAttack || 5) + ((level - 1) * 1);
  
  return {
    ...animal,
    hp: Math.max(hp, animal.hp || hp), // Use stored HP if higher
    attack: Math.max(attack, animal.attack || attack), // Use stored attack if higher
    baseHp: baseStats.baseHp,
    baseAttack: baseStats.baseAttack,
    emoji: baseStats.emoji || animal.emoji,
    rarity: baseStats.rarity,
    type: baseStats.type
  };
}

/**
 * Simulate a turn-based battle between two teams
 */
function simulateBattle(userTeam, oppTeam) {
  const battleLog = [];
  
  // Calculate stats for each animal
  const userTeamStats = userTeam.map(calculateAnimalStats);
  const oppTeamStats = oppTeam.map(calculateAnimalStats);
  
  // Initialize battle HP (each animal fights until defeated)
  let userTeamAlive = [...userTeamStats];
  let oppTeamAlive = [...oppTeamStats];
  
  let round = 1;
  const maxRounds = 20;
  
  while (round <= maxRounds && userTeamAlive.length > 0 && oppTeamAlive.length > 0) {
    // User team attacks
    const userAttacker = userTeamAlive[Math.floor(Math.random() * userTeamAlive.length)];
    const oppDefender = oppTeamAlive[Math.floor(Math.random() * oppTeamAlive.length)];
    
    const userDamage = calculateDamage(userAttacker.attack);
    oppDefender.hp -= userDamage;
    battleLog.push(`**Round ${round}**: ${userAttacker.emoji} **${userAttacker.name}** attacks ${oppDefender.emoji} **${oppDefender.name}** for **${userDamage}** damage!`);
    
    if (oppDefender.hp <= 0) {
      battleLog.push(`💀 ${oppDefender.emoji} **${oppDefender.name}** has been defeated!`);
      oppTeamAlive = oppTeamAlive.filter(a => a !== oppDefender);
    }
    
    // Check if opponent team is defeated
    if (oppTeamAlive.length === 0) {
      break;
    }
    
    // Opponent team attacks
    const oppAttacker = oppTeamAlive[Math.floor(Math.random() * oppTeamAlive.length)];
    const userDefender = userTeamAlive[Math.floor(Math.random() * userTeamAlive.length)];
    
    const oppDamage = calculateDamage(oppAttacker.attack);
    userDefender.hp -= oppDamage;
    battleLog.push(`**Round ${round}**: ${oppAttacker.emoji} **${oppAttacker.name}** attacks ${userDefender.emoji} **${userDefender.name}** for **${oppDamage}** damage!`);
    
    if (userDefender.hp <= 0) {
      battleLog.push(`💀 ${userDefender.emoji} **${userDefender.name}** has been defeated!`);
      userTeamAlive = userTeamAlive.filter(a => a !== userDefender);
    }
    
    round++;
  }
  
  // Determine winner
  let winner;
  if (userTeamAlive.length > 0 && oppTeamAlive.length === 0) {
    winner = 'user';
  } else if (oppTeamAlive.length > 0 && userTeamAlive.length === 0) {
    winner = 'opp';
  } else {
    // Tie - determine by remaining HP
    const userTotalHp = userTeamAlive.reduce((sum, a) => sum + Math.max(0, a.hp), 0);
    const oppTotalHp = oppTeamAlive.reduce((sum, a) => sum + Math.max(0, a.hp), 0);
    
    if (userTotalHp > oppTotalHp) {
      winner = 'user';
    } else if (oppTotalHp > userTotalHp) {
      winner = 'opp';
    } else {
      winner = 'tie';
    }
  }
  
  const userRemainingHp = userTeamAlive.reduce((sum, a) => sum + Math.max(0, a.hp), 0);
  const oppRemainingHp = oppTeamAlive.reduce((sum, a) => sum + Math.max(0, a.hp), 0);
  
  return {
    winner,
    userTeamHp: userRemainingHp,
    oppTeamHp: oppRemainingHp,
    userTeamAlive: userTeamAlive.length,
    oppTeamAlive: oppTeamAlive.length,
    battleLog: battleLog.slice(-10) // Last 10 log entries
  };
}

function calculateDamage(attack) {
  // Damage varies by ±30%
  const variance = attack * 0.3;
  const minDamage = Math.max(1, Math.floor(attack - variance));
  const maxDamage = Math.floor(attack + variance);
  return Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
}

/**
 * Remove animals from user's collection (death)
 */
function removeAnimals(user, team) {
  team.forEach(animal => {
    const idx = user.hunt.animals.findIndex(a => 
      a.name === animal.name && 
      (a.level === animal.level || !animal.level)
    );
    if (idx !== -1) {
      // Decrease totalAnimals count
      if (user.hunt.animals[idx].totalAnimals > 1) {
        user.hunt.animals[idx].totalAnimals -= 1;
      } else {
        user.hunt.animals.splice(idx, 1);
      }
    }
  });
}

/**
 * Grant rewards to the winner
 * Returns: { cashReward, items: [{ item, amount }], passBonus }
 */
async function grantBattleRewards(userId, team, battleResult) {
  const userData = await getUserData(userId);
  if (!userData) return { cashReward: 0, items: [], passBonus: 0 };
  
  // Calculate cash reward based on opponent's team strength
  const baseReward = 500;
  const teamStrength = team.reduce((sum, animal) => {
    const stats = calculateAnimalStats(animal);
    return sum + stats.hp + (stats.attack * 10);
  }, 0);
  
  let cashReward = Math.floor(baseReward + (teamStrength * 0.5));
  
  // Check for pass bonus
  let passBonus = 0;
  const passInfo = await checkPassValidity(userId);
  if (passInfo.isValid) {
    // Pass holders get +10% to +15% bonus based on pass type
    if (passInfo.passType === "titan") {
      passBonus = Math.floor(cashReward * 0.10);
    } else if (passInfo.passType === "etheral" || passInfo.passType === "celestia") {
      passBonus = Math.floor(cashReward * 0.15);
    } else {
      passBonus = Math.floor(cashReward * 0.10);
    }
    cashReward += passBonus;
  }
  
  // Calculate average rarity of defeated team (for item drops)
  const avgRarity = team.reduce((sum, animal) => {
    const stats = getAnimalBaseStats(animal.name);
    return sum + (stats.rarity || 1);
  }, 0) / team.length;
  
  // Item drop chance: 20% base + 5% per rarity point above 1
  const dropChance = Math.min(0.2 + ((avgRarity - 1) * 0.05), 0.5); // Max 50% chance
  const droppedItems = [];
  
  if (Math.random() < dropChance) {
    // Determine item rarity based on team rarity
    let itemRarity = 'common';
    if (avgRarity >= 4) itemRarity = 'rare';
    else if (avgRarity >= 3) itemRarity = 'uncommon';
    
    // Possible item drops based on rarity
    const possibleItems = {
      common: ['food', 'milk'],
      uncommon: ['food', 'premium_food', 'torch', 'lollipop'],
      rare: ['premium_food', 'torch', 'drink', 'ticket']
    };
    
    const itemsForRarity = possibleItems[itemRarity] || possibleItems.common;
    const randomItemId = itemsForRarity[Math.floor(Math.random() * itemsForRarity.length)];
    const item = ITEM_DEFINITIONS[randomItemId];
    
    if (item) {
      const amount = itemRarity === 'rare' ? 1 + Math.floor(Math.random() * 2) : 1;
      const currentAmount = userData.inventory?.[item.id] || 0;
      
      await updateUser(userId, {
        [`inventory.${item.id}`]: currentAmount + amount
      });
      
      droppedItems.push({ item, amount });
    }
  }
  
  // Update user cash in User model
  userData.cash += cashReward;
  
  // Update Hunt model for animal XP and leveling
  const huntUser = await User.findOne({ discordId: userId });
  if (huntUser && huntUser.hunt?.animals) {
    const xpGain = 15;
    team.forEach(animal => {
      const idx = huntUser.hunt.animals.findIndex(a => a.name === animal.name);
      if (idx !== -1 && huntUser.hunt.animals[idx]) {
        huntUser.hunt.animals[idx].exp = (huntUser.hunt.animals[idx].exp || 0) + xpGain;
        
        // Check for level up
        const neededExp = (huntUser.hunt.animals[idx].level || 1) * 25;
        if (huntUser.hunt.animals[idx].exp >= neededExp) {
          huntUser.hunt.animals[idx].level = (huntUser.hunt.animals[idx].level || 1) + 1;
          huntUser.hunt.animals[idx].exp -= neededExp;
          // Increase stats on level up
          const baseStats = getAnimalBaseStats(animal.name);
          huntUser.hunt.animals[idx].hp = baseStats.baseHp + ((huntUser.hunt.animals[idx].level - 1) * 5);
          huntUser.hunt.animals[idx].attack = baseStats.baseAttack + ((huntUser.hunt.animals[idx].level - 1) * 1);
        }
      }
    });
    await huntUser.save();
  }
  
  await updateUser(userId, {
    cash: userData.cash
  });
  
  return { cashReward, items: droppedItems, passBonus };
}

/**
 * Select random team from user's animals (up to 3)
 */
function selectRandomTeam(animals, maxSize = 3) {
  if (animals.length === 0) return [];
  
  const available = animals.filter(a => (a.totalAnimals || 1) > 0);
  if (available.length === 0) return [];
  
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(maxSize, available.length));
}

/**
 * Main battle command
 */
export async function battleCommand(context, { opponentId }) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;
    
    if (!opponentId || opponentId === userId) {
      return handleMessage(context, {
        content: `⚠️ Please mention a valid opponent to battle! You can't battle yourself.`
      });
    }
    
    // Get opponent user info
    let opponentUser;
    try {
      opponentUser = await context.client?.users?.fetch(opponentId) || null;
    } catch (e) {
      return handleMessage(context, {
        content: `⚠️ Could not find the opponent user. Please make sure you mentioned a valid user.`
      });
    }
    
    const opponentUsername = opponentUser?.username || 'Unknown';
    
    // Fetch both users' hunt data
    let user = await User.findOne({ discordId: userId });
    let opp = await User.findOne({ discordId: opponentId });
    
    if (!user) {
      user = new User({ discordId: userId, hunt: { animals: [], unlockedLocations: ['Forest'] } });
      await user.save();
    }
    
    if (!opp) {
      opp = new User({ discordId: opponentId, hunt: { animals: [], unlockedLocations: ['Forest'] } });
      await opp.save();
    }
    
    // Check if both have animals
    const userAnimals = user.hunt?.animals || [];
    const oppAnimals = opp.hunt?.animals || [];
    
    if (userAnimals.length === 0) {
      return handleMessage(context, {
        content: `⚠️ **${username}**, you don't have any animals to battle with! Use \`kas hunt\` to catch some animals first.\n**Note:** Use \`kas animalbattle @user\` or \`kas ab @user\` for animal battles.`
      });
    }
    
    if (oppAnimals.length === 0) {
      return handleMessage(context, {
        content: `⚠️ **${opponentUsername}** doesn't have any animals to battle with!`
      });
    }
    
    // Select teams (random selection, up to 3 animals each)
    const userTeam = selectRandomTeam(userAnimals, 3);
    const oppTeam = selectRandomTeam(oppAnimals, 3);
    
    if (userTeam.length === 0 || oppTeam.length === 0) {
      return handleMessage(context, {
        content: `⚠️ One of the players doesn't have available animals for battle!`
      });
    }
    
    // Perform battle simulation
    const battleResult = simulateBattle(userTeam, oppTeam);
    
    // Handle battle results
    let deathOccurred = false;
    let cashReward = 0;
    let droppedItems = [];
    let passBonus = 0;
    
    if (battleResult.winner === 'user') {
      // User wins - 30% chance opponent's animals die
      if (Math.random() < 0.3) {
        deathOccurred = true;
        removeAnimals(opp, oppTeam);
      }
      // Grant rewards to user
      const rewards = await grantBattleRewards(userId, userTeam, battleResult);
      cashReward = rewards.cashReward;
      droppedItems = rewards.items;
      passBonus = rewards.passBonus;
    } else if (battleResult.winner === 'opp') {
      // Opponent wins - 30% chance user's animals die
      if (Math.random() < 0.3) {
        deathOccurred = true;
        removeAnimals(user, userTeam);
      }
      // Grant rewards to opponent
      const rewards = await grantBattleRewards(opponentId, oppTeam, battleResult);
      cashReward = rewards.cashReward;
      droppedItems = rewards.items;
      passBonus = rewards.passBonus;
    }
    // Tie - no rewards, no deaths
    
    // Save both users
    await user.save();
    await opp.save();
    
    // Build battle result embed
    const userTeamDisplay = userTeam.map(a => {
      const stats = calculateAnimalStats(a);
      return `${stats.emoji} **${a.name}** (Lv.${a.level || 1}) - ${stats.hp} HP / ${stats.attack} ATK`;
    }).join('\n');
    
    const oppTeamDisplay = oppTeam.map(a => {
      const stats = calculateAnimalStats(a);
      return `${stats.emoji} **${a.name}** (Lv.${a.level || 1}) - ${stats.hp} HP / ${stats.attack} ATK`;
    }).join('\n');
    
    let winnerText;
    if (battleResult.winner === 'user') {
      winnerText = `🏆 **${username}** wins!`;
    } else if (battleResult.winner === 'opp') {
      winnerText = `🏆 **${opponentUsername}** wins!`;
    } else {
      winnerText = `🤝 It's a tie!`;
    }
    
    const Container = new ContainerBuilder()
      .setAccentColor(battleResult.winner === 'user' ? 0x00ff00 : battleResult.winner === 'opp' ? 0xff0000 : 0x808080)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### ⚔️ **ANIMAL BATTLE**`)
      )
      .addSectionComponents(
        section => section
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`**${username}'s Team:**\n${userTeamDisplay}`)
          )
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription('Battle')
              .setURL("https://cdn.discordapp.com/emojis/1363425460394135714.png")
          )
      )
      .addSeparatorComponents(separate => separate)
      .addSectionComponents(
        section => section
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`**${opponentUsername}'s Team:**\n${oppTeamDisplay}`)
          )
      )
      .addSeparatorComponents(separate => separate)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### ${winnerText}`),
        textDisplay => textDisplay.setContent(
          `**Remaining HP:**\n` +
          `${username}: **${Math.max(0, battleResult.userTeamHp)}** HP (${battleResult.userTeamAlive} animals alive)\n` +
          `${opponentUsername}: **${Math.max(0, battleResult.oppTeamHp)}** HP (${battleResult.oppTeamAlive} animals alive)`
        ),
        textDisplay => textDisplay.setContent(
          battleResult.winner !== 'tie' 
            ? `💰 **${battleResult.winner === 'user' ? username : opponentUsername}** earned <:kasiko_coin:1300141236841086977> **${cashReward.toLocaleString()}** cash!${passBonus > 0 ? `\n-# ◎ **+${passBonus.toLocaleString()}** pass bonus` : ''}`
            : `No rewards for a tie.`
        ),
        ...(droppedItems.length > 0 ? [
          textDisplay => textDisplay.setContent(
            `🎁 **Item Drop:** ${droppedItems.map(d => `${d.item.emoji} **${d.item.name}** x${d.amount}`).join(', ')}`
          )
        ] : []),
        textDisplay => textDisplay.setContent(
          deathOccurred 
            ? `💀 **${battleResult.winner === 'user' ? opponentUsername : username}'s** animals were defeated and removed from their collection!`
            : `✨ All animals survived this battle!`
        )
      );
    
    // Add battle log if available
    if (battleResult.battleLog && battleResult.battleLog.length > 0) {
      Container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`**Battle Log:**\n${battleResult.battleLog.join('\n')}`)
      );
    }
    
    return handleMessage(context, {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });
    
  } catch (error) {
    console.error('Animal battle error:', error);
    return handleMessage(context, {
      content: `❌ **Error**: ${error.message || 'An error occurred during the battle.'}`
    });
  }
}

export default {
  name: 'animalbattle',
  description: 'Battle another player with your animals! Select up to 3 animals to fight.',
  aliases: ['abattle', 'ab', 'animalfight', 'afight'],
  args: '<@opponent>',
  example: [
    'animalbattle @user',
    'abattle @friend',
    'ab @opponent',
    'animalfight @user'
  ],
  emoji: '⚔️',
  cooldown: 30000, // 30 seconds cooldown
  category: '🦌 Wildlife',
  
  execute: async (args, context) => {
    args.shift(); // Remove command name
    
    // Extract opponent from mentions
    let opponentId = null;
    if (context.mentions?.users) {
      opponentId = context.mentions.users.first()?.id || null;
    } else if (args[0]) {
      // Try to parse user ID or mention from args
      const mentionMatch = args[0].match(/<@!?(\d+)>/);
      opponentId = mentionMatch ? mentionMatch[1] : args[0];
    }
    
    if (!opponentId) {
      return handleMessage(context, {
        content: `⚠️ Please mention an opponent to battle!\n**Usage:** \`kas animalbattle @user\` or \`kas ab @user\``
      });
    }
    
    await battleCommand(context, { opponentId });
  }
};
