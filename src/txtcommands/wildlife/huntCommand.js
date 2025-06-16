import User from '../../../models/Hunt.js';
import fs from 'fs';
import path from 'path';

import {
  EmbedBuilder
} from 'discord.js';

import {
  checkPassValidity
} from "../explore/pass.js";

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
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function huntCommand(context, {
  location = 'Forest'
}, profile = null) {
  try {
    const {
      animals: animalsList
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

    let animals = [...animalsList];

    const passInfo = await checkPassValidity(userId);

    let extraBullet = 0;
    if (passInfo.isValid) {
      extraBullet = 10;
      if (passInfo.passType === "titan") extraBullet = 5;

      if (passInfo.passType === "etheral") {
        animals = animals.filter(a => !(a.name === "Rex" || a.name === "Dragon" || a.name === "Unicorn" || a.name === "Rex"));
      }
    }

    if (!passInfo.isValid || !(passInfo.passType === "etheral" || passInfo.passType === "celestia")) {
      animals = animals.filter(a => a.type !== "exclusive");
    }

    const dailyHuntLimit = 10 + extraBullet;
    if (user.hunt.huntsToday >= dailyHuntLimit) {
      return handleMessage(context, {
        content: `<:left:1350355384111468576> **${username}, you've used all ${rubBulletEmoji} ${dailyHuntLimit} of your ammo! It's getting dark, and the wilds are growing dangerous.**\n-# Rest up and return tomorrow to continue the hunt! <:rifle1:1352119137421234187><:rifle2:1352119217687625799>`,
      });
    }

    // 2) Check if user has location unlocked
    if (!user.hunt.unlockedLocations.includes(location)) {
      return;
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
        `<:forest_tree:1354366758596776070> ${chosenFailMessage}\n-# *(No animals caught, ammo used ${rubBulletEmoji} 𝟏, 𝘙𝘦𝘮𝘢𝘪𝘯𝘪𝘯𝘨 𝘈𝘮𝘮𝘰 : ${Math.max(0, dailyHuntLimit - user.hunt.huntsToday)})*`
      )
      .setAuthor({
        name: `ᕼᑌᑎTIᑎG ᖴᗩIᒪEᗪ`, iconURL: profile
      });

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

    let nextIndex;

    const rarityBase = 0.84; // Base probability for common items
    const rarityScale = 0.018; // Incremental difficulty per rarity level
    const maxLimit = 0.96; // Maximum probability (94%)

    // Calculate and clamp the rarity threshold for this spawn
    let rarityThreshold = rarityBase + (user.hunt.nextRarityIndex * rarityScale);
    rarityThreshold = Math.min(rarityThreshold, maxLimit);

    // Define a function that encapsulates the logic to pick an index
    function pickAnimalIndex() {
      let index;
      if (Math.random() > rarityThreshold) {
        index = user.hunt.nextRarityIndex;
        if (index >= animals.length) {
          index = animals.length - 1;
        }
      } else {
        index = Math.max(1, Math.floor(Math.random() * user.hunt.nextRarityIndex));
      }
      return index;
    }

    // Initially pick an index
    nextIndex = pickAnimalIndex();

    // Re-pick until we have a defined, non-null animal entry.
    while (animals[nextIndex] == null) {
      nextIndex = pickAnimalIndex();
    }

    // Grab the chosen animal data
    const chosenAnimalData = animals[nextIndex];

    // Add or increment that animal in user's inventory
    const existingAnimal = user.hunt.animals.find(
      (a) => a.name === chosenAnimalData?.name
    );
    if (existingAnimal) {
      existingAnimal.totalAnimals += 1;
    } else if (chosenAnimalData.name) {
      user.hunt.animals.push({
        name: chosenAnimalData.name,
        emoji: chosenAnimalData?.emoji,
        totalAnimals: 1, // start at 1
        level: 1,
        exp: 0,
        hp: chosenAnimalData?.baseHp,
        attack: chosenAnimalData?.baseAttack,
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
    const lines2 = [];
    lines.push(`## 🅷🆄🅽🆃\n<:forest_tree:1354366758596776070> **${username}** went hunting in **${location}**...`);
    if (usedBoosters.length > 0) {
      lines.push(
        `> *Used Boosters:* \`${usedBoosters.join(', ')}\``
      );
    }
    lines2.push(
      `# **${chosenAnimalData.emoji} ${chosenAnimalData?.name} ${chosenAnimalData.type === "exclusive" ? "<:exclusive:1347533975840882708>": ""}**\n`
    );
    lines2.push(`-# 𝘠𝘰𝘶 𝘨𝘢𝘪𝘯𝘦𝘥 **+${gainedExp} 𝘏𝘜𝘕𝘛𝘐𝘕𝘎 𝘌𝘟𝘗**\n${rubBulletEmoji} 𝘙𝘦𝘮𝘢𝘪𝘯𝘪𝘯𝘨 𝘈𝘮𝘮𝘰 : ${Math.max(0, dailyHuntLimit - user.hunt.huntsToday)}`);
    if (newlyAcquiredBooster) {
      lines.push(
        `\n**Lucky find!** You also acquired a new booster: \`${newlyAcquiredBooster}\``
      );
    }

    const embed = new EmbedBuilder().setDescription(lines.join('\n'))
    .setThumbnail(`https://cdn.discordapp.com/emojis/1363425460394135714.png`)

    const embed2 = new EmbedBuilder().setDescription(lines2.join('\n'))
    .setAuthor({
      name: `You successfully caught:`, iconURL: profile
    })
    .setFooter({
      text: "Use 𝙘𝙖𝙜𝙚 for hunted animals"
    })
    .setColor('Random')

    return handleMessage(context, {
      embeds: [embed, embed2]
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
  example: ['hunt',
    'h'],
  related: ['cage',
    'sellanimal'],
  emoji: "<:rubber_bullet:1325711925656686626>",
  cooldown: 10000,
  // 10 seconds, as an example
  category: '🦌 Wildlife',

  execute: async (args, context) => {
    args.shift();
    const location = args?.[0] || 'Forest'; // Default location if not provided

    const avatarUrl = context.user
    ? context.user.displayAvatarURL({
      dynamic: true
    }): context.author.displayAvatarURL({
      dynamic: true
    });

    await huntCommand(context, {
      location
    }, avatarUrl);
  },
};