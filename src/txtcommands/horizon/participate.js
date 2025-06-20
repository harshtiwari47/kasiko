import HorizonBattle from '../../../models/Horizon.js';
import HorizonUser from '../../../models/HorizonUser.js';
import {
  discordUser,
  handleMessage
} from '../../../helper.js';
import {
  getUserDataDragon,
  saveUserData
} from './dragon.js';
import fs from 'fs';
import path from 'path';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} from 'discord.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dragonTypesPath = path.join(__dirname, '../../../data/dragons.json');
const dragonTypes = JSON.parse(fs.readFileSync(dragonTypesPath, 'utf-8'));

// powers
const powerspath = path.join(__dirname, './dragon/powers.json');
const powerTypes = JSON.parse(fs.readFileSync(powerspath, 'utf-8'));

export async function exitHorizonBattle(context, userId) {
  const {
    name,
    avatar
  } = discordUser(context);

  const battle = await HorizonBattle.findOne({
    players: userId
  });
  if (!battle) {
    return handleMessage(context, {
      embeds: [
        new EmbedBuilder()
        .setTitle("<:warning:1366050875243757699> Not in Battle")
        .setDescription(`**${name}**, you’re not currently in any active Horizon battle.`)
        .setColor("Red")
        .setTimestamp()
      ]
    });
  }

  const player = battle.playerStats.find(p => p.playerId === userId);

  await HorizonUser.findOneAndUpdate(
    {
      userId: userId
    },
    {
      $inc: {
        totalBattlesPlayed: 1,
        totalBattlesWon: 0,
        totalBattlesLost: 1,
        totalBossesDefeated: (battle?.currentBossIndex || 0) + 1,
        totalDamageDealt: player?.totalDamage || 0,
      },
      $max: {
        highestDamageInBattle: player?.totalDamage || 0,
        mostBossesInBattle: (battle?.currentBossIndex || 0) + 1
      },
      $set: {
        lastBattle: {
          code: battle.code,
          status: 'left',
          bossLevelReached: battle.currentBossIndex + 1,
          damageDealt: player?.totalDamage || 0,
          totalRewards: player?.rewardsGiven || 0,
          finishedAt: new Date()
        }
      },
      $setOnInsert: {
        joinedAt: new Date()
      }
    },
    {
      upsert: true
    }
  );

  // Remove user from battle
  battle.players = battle.players.filter(p => p !== userId);
  battle.playerStats = battle.playerStats.filter(p => p.playerId !== userId);

  if (battle.players.length === 1) {
    await HorizonBattle.deleteOne();
  }

  await HorizonBattle.updateOne(
    {
      _id: battle._id
    },
    {
      $set: {
        players: battle.players,
        playerStats: battle.playerStats
      }
    }
  );

  return handleMessage(context, {
    embeds: [
      new EmbedBuilder()
      .setTitle("<:exit:1381905040482111559> Exited Battle")
      .setDescription(`**${name}** has left the Horizon battle.`)
      .setColor("Orange")
      .setFooter({
        text: "You can rejoin with a valid code anytime."
      })
      .setTimestamp()
      .setAuthor({
        name: name, iconURL: avatar
      })
    ]
  });
}

export async function joinHorizonBattle(context, userId, code) {
  const {
    name,
    avatar
  } = discordUser(context);

  const existing = await HorizonBattle.findOne({
    players: userId
  });
  if (existing) {
    return handleMessage(context, `🚫 **${name}**, you're already in a Horizon battle. Check battle stats using **\` horizon \`** or exit first using \` horizon exit \`.`);
  }

  // Find the battle with the given code
  const battle = await HorizonBattle.findOne({
    code
  });
  if (!battle) {
    return handleMessage(context, `⚠️ No battle found with code **\` ${code} \`**.`);
  }

  if (battle.currentBossIndex > 0) {
    return handleMessage(context, `❌ You can’t join. This battle has already defeated a boss.`);
  }

  const already = battle.players.includes(userId);
  if (already) {
    return handleMessage(context, `🤨 **${name}**, you're already part of this battle.`);
  }

  const userData = await getUserDataDragon(userId);

  if (!userData?.dragons) userData.dragons = []

  if (userData?.dragons.length === 0) {
    return await handleMessage(context, {
      content: `❗**${name}, you have no dragons. Use \`dragon summon\` to get started!`
    });
  }

  let targetDragon = userData.dragons[userData?.active || 0];

  if (!targetDragon.isHatched) {
    return await handleMessage(context, {
      content: `❗ **${name}**, your active dragon is still an egg! Hatch it first using \`dragon hatch <index>\`.`
    });
  }

  const chosenType = dragonTypes.find(t => t.id === targetDragon.typeId);

  if (!chosenType) {
    return await handleMessage(context, {
      content: `❗ **${name}**, your current is missing!`
    });
  }

  let power1 = powerTypes.find(p => p.name.toLowerCase() === chosenType.strengths[0].toLowerCase());
  let power2 = powerTypes.find(p => p.name.toLowerCase() === chosenType.strengths[1].toLowerCase());

  power1.level = userData.powers.find(p => p.typeId === power1.name)?.level || 1;
  power2.level = userData.powers.find(p => p.typeId === power2.name)?.level || 1;

  function mapRarityValue(value) {
    if (value < 0.4) return 'Common';
    if (value < 0.7) return 'Rare';
    if (value < 0.9) return 'Epic';
    return 'Legendary';
  }

  const playerData = {
    playerId: userId,
    totalDamage: 0,
    totalHealing: 0,
    currentDragon: {
      id: targetDragon?.typeId,
      name: targetDragon?.customName ? targetDragon.customName: (targetDragon?.typeId || "unknown"),
      emoji: chosenType?.emoji,
      health: 100,
      image: chosenType?.landscapes?.length ? chosenType?.landscapes[0]: "",
      level: targetDragon.stage ? targetDragon.stage: 2,
      rarity: mapRarityValue(chosenType?.rarity || 0.5),
      abilities: [{
        id: "p1",
        name: power1.name,
        dmg: power1.dmg * power1.level,
        level: power1.level,
        defence: power1.defence * power1.level,
        emoji: power1.emoji,
        heal: power1.heal * power1.level
      },
        {
          id: "p2",
          name: power2.name,
          dmg: power2.dmg * power2.level,
          level: power2.level,
          defence: power2.defence * power2.level,
          emoji: power2.emoji,
          heal: power2.heal * power2.level
        }]
    },
    dragonDamagePower: (power2.dmg * power2.level + power1.dmg * power1.level)
  }

  if (!playerData) return;

  await HorizonBattle.findOneAndUpdate(
    {
      code
    },
    {
      $push: {
        players: userId,
        playerStats: playerData
      }
    }
  );

  return handleMessage(context, {
    embeds: [
      new EmbedBuilder()
      .setTitle(`<:dragon_3d:1381904937763475578> Joined Horizon Battle`)
      .setDescription(`✅ **${name}**, you’ve successfully joined the battle with code \`${code}\`!`)
      .addFields(
        {
          name: '<:flame_sword:1381904987554054154> How to Attack', value: 'Use `attack p1` or `attack p2` to launch your dragon\'s ability.'
        },
        {
          name: '<:stats:1381905014884139058> View Stats', value: 'Run `horizon` anytime to see your battle stats and progress.'
        }
      )
      .setColor('Random')
      .setTimestamp()
      .setFooter({
        text: 'Good luck, warrior!'
      })
    ]
  });
}