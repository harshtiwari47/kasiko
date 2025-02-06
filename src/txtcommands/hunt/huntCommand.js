import User from '../../../models/Hunt.js';
import fs from 'fs';
import path from 'path';

import {
  EmbedBuilder
} from 'discord.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const BoosterDatabasePath = path.join(__dirname, './boosters.json');
const AnimalsDatabasePath = path.join(__dirname, './animals.json');

let boostersData = fs.readFileSync(BoosterDatabasePath, 'utf-8');
let animalsData = fs.readFileSync(AnimalsDatabasePath, 'utf-8');

/**
* Helper to handle replies or follow-ups depending on slash command vs normal message
*/
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    return context.channel.send(data);
  }
}

export async function huntCommand(context, {
  location = 'Forest'
}) {
  try {
    const {
      animals
    } = JSON.parse(animalsData);
    const {
      globalBoosters
    } = JSON.parse(boostersData);

    const rubBulletEmoji = "<:rubber_bullet:1325711925656686626>"

    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    let user = await User.findOne({
      discordId: userId
    });
    if (!user) {
      user = new User( {
        discordId: userId,
      });
      await user.save();
    }

    // 1) Check daily limit
    const now = new Date();
    const todayStr = now.toDateString();
    if (user.hunt.lastHuntDate?.toDateString() !== todayStr) {
      // Reset daily hunts if it's a new day
      user.hunt.huntsToday = 0;
    }
    const dailyHuntLimit = 10;
    if (user.hunt.huntsToday >= dailyHuntLimit) {
      return handleMessage(context, {
        content: `**${username}, you've used all ${rubBulletEmoji} 10 of your ammo! It's getting dark, and the wilds are growing dangerous.** Rest up and return tomorrow to continue the hunt.`,
      });
    }

    // 2) Check if user has location unlocked
    if (!user.hunt.unlockedLocations.includes(location)) {
      return handleMessage(context, {
        content: `**${username}**, you haven't unlocked **${location}** yet!`,
      });
    }

    // 3) Check for "avoidDeath" booster
    const hasRevivalBooster = user.hunt.boosters.some(
      (b) => b.effect === 'avoidDeath'
    );

    // 4) 40% chance of death (as an example) unless we have "Revival Powder"
    const deathChance = 0.4;
    const isDead = Math.random() < deathChance && !hasRevivalBooster;
    if (isDead) {
      // Mark daily usage, user fails this hunt
      user.hunt.huntsToday += 1;
      user.hunt.lastHuntDate = now;
      await user.save();

      // Variety of failure messages
      const failMessages = [
        `**Oh no!** ***${username}*** stepped into a hidden trap and was severely wounded! No luck this time...`,
        `**Gah!** ***${username}*** was ambushed by a wild beast! You limped away empty-handed...`,
        `***${username}*** got stuck in quicksand! You barely escaped with your life...but nothing else.`,
      ];
      const chosenFailMessage =
      failMessages[Math.floor(Math.random() * failMessages.length)];

      const embed = new EmbedBuilder().setDescription(
        `🌳 ${chosenFailMessage}\n*(No animals caught, ammo used ${rubBulletEmoji} **1**)*`
      );
      return handleMessage(context, {
        embeds: [embed],
      });
    } else if (hasRevivalBooster && Math.random() < deathChance) {
      // User would have died, but "Revival Powder" was used
      user.hunt.boosters = user.hunt.boosters.filter(
        (b) => b.effect !== 'avoidDeath'
      );
    }

    // 5) Check "Mystic Bait" => guaranteed next rarity if present
    let usedBoosters = [];
    const hasMysticBait = user.hunt.boosters.some(
      (b) => b.effect === 'spawnRareAnimal'
    );
    if (hasMysticBait) {
      // Remove it from user
      user.hunt.boosters = user.hunt.boosters.filter(
        (b) => b.effect !== 'spawnRareAnimal'
      );
      // Increase nextRarityIndex
      user.hunt.nextRarityIndex = Math.min(
        user.hunt.nextRarityIndex + 1,
        animals.length - 1
      );
      usedBoosters.push('Mystic Bait');
    }

    // 6) Check "Lucky Charm" => double catch chance or guaranteed success
    // For simplicity, we'll just note that we used it.
    const hasLuckyCharm = user.hunt.boosters.some(
      (b) => b.effect === 'doubleCatchChance'
    );
    if (hasLuckyCharm) {
      user.hunt.boosters = user.hunt.boosters.filter(
        (b) => b.effect !== 'doubleCatchChance'
      );
      usedBoosters.push('Lucky Charm');
    }

    // 7) Determine which animal to spawn based on nextRarityIndex

    let nextIndex;

    const rarityBase = 0.84; // Base probability for common items
    const rarityScale = 0.018; // Incremental difficulty per rarity level
    const maxLimit = 0.96; // Maximum probability (94%)

    let rarityThreshold = rarityBase + (user.hunt.nextRarityIndex * rarityScale);

    // Clamp the threshold to not exceed the max limit
    rarityThreshold = Math.min(rarityThreshold, maxLimit);

    if (Math.random() > rarityThreshold) {
      nextIndex = user.hunt.nextRarityIndex;
      if (nextIndex >= animals.length) {
        nextIndex = animals.length - 1;
      }
    } else {
      nextIndex = Math.max(1, Math.floor(Math.random() * user.hunt.nextRarityIndex));
    }

    // Grab the chosen animal
    const chosenAnimalData = animals[nextIndex];

    // Add or increment that animal in user's inventory
    const existingAnimal = user.hunt.animals.find(
      (a) => a.name === chosenAnimalData.name
    );
    if (existingAnimal) {
      existingAnimal.totalAnimals += 1;
    } else {
      user.hunt.animals.push({
        name: chosenAnimalData.name,
        emoji: chosenAnimalData.emoji,
        totalAnimals: 1, // start at 1
        level: 1,
        exp: 0,
        hp: chosenAnimalData.baseHp,
        attack: chosenAnimalData.baseAttack,
      });
    }

    // Move to next rarity if not at max
    if (user.hunt.nextRarityIndex < animals.length - 1) {
      user.hunt.nextRarityIndex += 1;
    }

    // 8) 5% chance of awarding a new booster
    let newlyAcquiredBooster = null;
    if (Math.random() < 0.05 && globalBoosters) {
      const randomBooster = globalBoosters[Math.floor(Math.random() * globalBoosters.length)];
      user.hunt.boosters.push(randomBooster);
      newlyAcquiredBooster = randomBooster.name;
    }

    // 9) Award user some global EXP for a successful hunt
    const gainedExp = 20;
    user.globalExp += gainedExp;
    // Possibly check if user needs to level up
    const neededExp = user.globalLevel * 100;
    if (user.globalExp >= neededExp) {
      user.globalLevel += 1;
      user.globalExp -= neededExp;
    }

    // 10) Mark daily usage
    user.hunt.huntsToday += 1;
    user.hunt.lastHuntDate = now;

    await user.save();

    // Construct the success embed
    const lines = [];
    lines.push(`## 🅷🆄🅽🆃 💥\n**${username}** went hunting in **${location}**... 🌳`);
    if (usedBoosters.length > 0) {
      lines.push(
        `> *Used Boosters:* \`${usedBoosters.join(', ')}\``
      );
    }
    lines.push(
      `You successfully caught:\n# **${chosenAnimalData.emoji} ${chosenAnimalData.name}**\n`
    );
    lines.push(`𝘠𝘰𝘶 𝘨𝘢𝘪𝘯𝘦𝘥 **+${gainedExp} 𝘏𝘜𝘕𝘛𝘐𝘕𝘎 𝘌𝘟𝘗**\n${rubBulletEmoji} 𝘙𝘦𝘮𝘢𝘪𝘯𝘪𝘯𝘨 𝘈𝘮𝘮𝘰 : ${Math.max(0, 10 - user.hunt.huntsToday)}`);
    if (newlyAcquiredBooster) {
      lines.push(
        `\n**Lucky find!** You also acquired a new booster: \`${newlyAcquiredBooster}\``
      );
    }

    const embed = new EmbedBuilder().setDescription(lines.join('\n'));
    return handleMessage(context, {
      embeds: [embed]
    });
  } catch (error) {
    console.error(error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`,
    });
  }
}

export default {
  name: 'hunt',
  description: 'Embark on a hunt to catch animals and gain rewards.',
  aliases: ['h',
    'animalhunt'],
  args: '[location]',
  example: ['hunt Forest',
    'hunt Mountains'],
  related: ['cage',
    'sellanimal'],
  cooldown: 10000,
  // 10 seconds, as an example
  category: '🦌 Hunt',

  execute: async (args, context) => {
    args.shift();
    const location = args?.[0] || 'Forest'; // Default location if not provided
    await huntCommand(context, {
      location
    });
  },
};