import HorizonBattle from '../../../models/Horizon.js';
import {
  handleMessage,
  discordUser
} from '../../../helper.js';
import {
  getUserDataDragon,
  saveUserData
} from '../explore/dragon.js';
import fs from 'fs';
import path from 'path';

import {
  AttachmentBuilder
} from 'discord.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dragonTypesPath = path.join(__dirname, '../../../data/dragons.json');
const dragonTypes = JSON.parse(fs.readFileSync(dragonTypesPath, 'utf-8'));

// powers
const powerspath = path.join(__dirname, '../explore/dragon/powers.json');
const powerTypes = JSON.parse(fs.readFileSync(powerspath, 'utf-8'));
import {
  createCanvas,
  loadImage
} from '@napi-rs/canvas';

// Background Image path
const imagePath = 'https://harshtiwari47.github.io/kasiko-public/images/dragons/horizon-new.jpg';

async function generateEditedImage(code) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  // Draw original image
  ctx.drawImage(image, 0, 0);

  // Common text styles
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';

  // HORIZON JOIN position
  ctx.fillText(code, 305, 345);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, {
    name: 'horizon-battle.png'
  });
}

// Helper to generate a unique 8-character code for new battles
function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.toUpperCase();
}


export async function createHorizonBattle(context, playerId, bossTemplates) {
  try {
    // Check if player is already in an active battle
    const activeBattle = await HorizonBattle.findOne({
      players: playerId
    });

    const {
      name
    } = discordUser(context);

    const userData = await getUserDataDragon(playerId);

    if (activeBattle) {
      return await handleMessage(context, `⚠️ **${name}**, you're already in an active Horizon battle. Use \`horizon\` to check its status.`);
    }

    // Generate a unique battle code
    let code;
    while (true) {
      code = generateUniqueCode(); // e.g., "DRG123CF"
      const existing = await HorizonBattle.findOne({
        code
      });
      if (!existing) break;
    }

    // Prepare bosses (based on predefined templates)
    const bosses = bossTemplates.map(boss => ({
      name: boss.name,
      difficulty: boss.difficulty,
      image: boss.image,
      health: boss.health,
      maxHealth: boss.health,
      damage: boss.damage,
      specialPowers: boss.specialPowers,
      specialCooldown: boss.specialCooldown || 3,
      description: boss.description || ''
    }));

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

    // Create player stats
    const playerStats = [{
      playerId,
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
    }];

    // Save new Horizon battle
    const newBattle = await HorizonBattle.create({
      code,
      players: [playerId],
      leaderId: playerId,
      bosses,
      playerStats
    });

    const imageAttachment = await generateEditedImage(code);

    return await handleMessage(context, {
      content: `### <@${playerId}> New Horizon battle created!\n<:code_paper:1381904963780739153> Join code: **\` ${code} \`**`,
      files: [imageAttachment]
    });

  } catch (err) {
    console.error('Error creating Horizon battle:', err);
    return await handleMessage(context, `❌ Failed to create battle. Please try again later.`);
  }
}