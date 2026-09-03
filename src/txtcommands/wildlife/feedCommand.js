import User from '../../../models/Hunt.js';
import { getUserData, updateUser } from '../../../database.js';
import { ITEM_DEFINITIONS } from '../../inventory.js';
import { ContainerBuilder, MessageFlags } from 'discord.js';
import { handleMessage, discordUser, parseAmount } from '../../../helper.js';
import animalsData from './animals.json' with { type: 'json' };

// O(1) animal base stats map
const _baseStatsMap = new Map();
for (const a of (animalsData.animals || [])) {
  _baseStatsMap.set(a.name.toLowerCase(), {
    baseHp: a.baseHp || 30,
    baseAttack: a.baseAttack || 5,
    emoji: a.emoji || '🐾',
    type: a.type || 'common'
  });
}

function getAnimalBase(name) {
  return _baseStatsMap.get((name || '').toLowerCase()) || { baseHp: 30, baseAttack: 5, emoji: '🐾', type: 'common' };
}

export async function feedCommand(context, { target = null, count = 1 } = {}) {
  try {
    const { id: userId, username, name } = discordUser(context);

    // Get user's main inventory data
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(context, {
        content: `***${name}***, could not retrieve your account data.`
      });
    }

    // Get hunt profile
    let user = await User.findOne({ discordId: userId });
    if (!user) {
      user = new User({
        discordId: userId,
        hunt: { animals: [], team: [], unlockedLocations: ['Forest'] }
      });
      await user.save();
    }

    const userAnimals = (user.hunt?.animals || []).filter(a => (a.totalAnimals || 0) > 0);
    if (userAnimals.length === 0) {
      return handleMessage(context, {
        content: `<:forest_tree:1354366758596776070> **${name}**, you don't have any animals to feed! Hunt some beasts first using \`kas hunt\`.`
      });
    }

    const invFoodCount = userData.inventory?.food || 0;

    // ── No target provided: Show interactive feed menu ───────────────────────
    if (!target) {
      const team = user.hunt?.team || [];
      const C = new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(
          t => t.setContent(`### <:pet_food:1385884583077351464> **PET FEEDING SANCTUARY**`),
          t => t.setContent(`**${name}**, you have <:pet_food:1385884583077351464> **${invFoodCount} Pet Food** available.\n` +
            `Feeding animals increases their **Level**, **HP**, and **Attack Power** for battles!`)
        )
        .addSeparatorComponents(s => s);

      if (team.length > 0) {
        C.addTextDisplayComponents(t => t.setContent(`**<:claw:1493561807091138631> Current Battle Squad:**`));
        for (let i = 0; i < team.length; i++) {
          const tm = team[i];
          const found = userAnimals.find(a => a.name.toLowerCase() === tm.name.toLowerCase()) || tm;
          const meta = getAnimalBase(found.name);
          const reqExp = (found.level || 1) * 30;
          const curExp = found.exp || 0;
          C.addTextDisplayComponents(
            t => t.setContent(`**#${i + 1}** ${found.emoji || meta.emoji} **${found.name}** (Lvl.${found.level || 1}) · EXP: \`${curExp}/${reqExp}\``),
            t => t.setContent(`-# Feed: \`kas feed ${found.name}\` or \`kas feed ${i + 1}\``)
          );
        }
      } else {
        const top3 = [...userAnimals].sort((a, b) => (b.level || 1) - (a.level || 1)).slice(0, 3);
        C.addTextDisplayComponents(t => t.setContent(`**Top Animals in Bag:**`));
        for (let i = 0; i < top3.length; i++) {
          const a = top3[i];
          const meta = getAnimalBase(a.name);
          const reqExp = (a.level || 1) * 30;
          C.addTextDisplayComponents(
            t => t.setContent(`**#${i + 1}** ${a.emoji || meta.emoji} **${a.name}** (Lvl.${a.level || 1}) · EXP: \`${a.exp || 0}/${reqExp}\``),
            t => t.setContent(`-# Feed: \`kas feed ${a.name}\` or \`kas feed ${i + 1}\``)
          );
        }
      }

      C.addSeparatorComponents(s => s);
      C.addTextDisplayComponents(
        t => t.setContent(`**Quick Guide:**\n` +
          `• \`kas feed <animalName> [amount]\` — e.g. \`kas feed ${userAnimals[0]?.name || 'wolf'} 5\`\n` +
          `• \`kas feed <squadNumber> all\` — e.g. \`kas feed 1 all\`\n` +
          `• Need more food? Buy with \`kas buy food 10\` or earn via \`kas daily\`.`)
      );

      return handleMessage(context, {
        components: [C],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // ── Target resolution (by squad index, cage index, or animal name) ───────
    let matchedAnimal = null;
    const targetStr = String(target).trim();
    const targetNum = parseInt(targetStr, 10);

    // If target is a number: check team first if user has team, then bag
    if (!isNaN(targetNum) && targetNum > 0) {
      const team = user.hunt?.team || [];
      if (team.length > 0 && targetNum <= team.length) {
        const teamMember = team[targetNum - 1];
        matchedAnimal = userAnimals.find(a => a.name.toLowerCase() === teamMember.name.toLowerCase());
      }
      if (!matchedAnimal && targetNum <= userAnimals.length) {
        matchedAnimal = userAnimals[targetNum - 1];
      }
    }

    // If not matched by index, match by name (exact or partial)
    if (!matchedAnimal) {
      matchedAnimal = userAnimals.find(a => a.name.toLowerCase() === targetStr.toLowerCase());
    }
    if (!matchedAnimal) {
      matchedAnimal = userAnimals.find(a => a.name.toLowerCase().includes(targetStr.toLowerCase()));
    }

    if (!matchedAnimal) {
      return handleMessage(context, {
        content: `<:warning:1366050875243757699> **${name}**, no animal named **${targetStr}** was found in your cage!\n` +
          `-# View all your captured animals with \`kas cage\` or check your squad with \`kas team\`.`
      });
    }

    // ── Food verification ───────────────────────────────────────────────────
    if (invFoodCount < 1) {
      return handleMessage(context, {
        content: `<:warning:1366050875243757699> **${name}**, you don't have any <:pet_food:1385884583077351464> **Pet Food**!\n` +
          `-# Buy pet food with \`kas buy food 10\` or complete quests with \`kas daily\` & \`kas tasks\`.`
      });
    }

    // ── Determine how many foods to consume ──────────────────────────────────
    let foodToUse = 1;
    if (count === 'all' || count === 'max' || String(count).toLowerCase() === 'all' || String(count).toLowerCase() === 'max') {
      foodToUse = invFoodCount;
    } else {
      const parsedCount = parseInt(count, 10);
      foodToUse = Math.min(invFoodCount, Math.max(1, isNaN(parsedCount) ? 1 : parsedCount));
    }

    const startLevel = matchedAnimal.level || 1;
    const expGainPerFood = 20;
    const totalExpGain = foodToUse * expGainPerFood;

    matchedAnimal.exp = (matchedAnimal.exp || 0) + totalExpGain;

    // Calculate level ups
    let levelsGained = 0;
    while (matchedAnimal.exp >= (matchedAnimal.level || 1) * 30) {
      const needed = (matchedAnimal.level || 1) * 30;
      matchedAnimal.level = (matchedAnimal.level || 1) + 1;
      matchedAnimal.exp -= needed;
      matchedAnimal.hp = (matchedAnimal.hp || 30) + 8;
      matchedAnimal.attack = (matchedAnimal.attack || 5) + 2;
      levelsGained++;
    }

    const reqExp = (matchedAnimal.level || 1) * 30;

    // Sync team member level if in team
    if (levelsGained > 0 && user.hunt?.team?.length > 0) {
      const teamIdx = user.hunt.team.findIndex(t => t.name?.toLowerCase() === matchedAnimal.name?.toLowerCase());
      if (teamIdx !== -1) {
        user.hunt.team[teamIdx].level = matchedAnimal.level;
      }
    }

    // Deduct food
    const remainingFood = Math.max(0, invFoodCount - foodToUse);
    await updateUser(userId, {
      'inventory.food': remainingFood
    });

    await user.save();

    // ── Build Result Container ──────────────────────────────────────────────
    const meta = getAnimalBase(matchedAnimal.name);
    const curHp = (meta.baseHp || 30) + (((matchedAnimal.level || 1) - 1) * 8);
    const curAtk = (meta.baseAttack || 5) + (((matchedAnimal.level || 1) - 1) * 2);

    const C = new ContainerBuilder()
      .setAccentColor(levelsGained > 0 ? 0x00E676 : 0x57F287)
      .addTextDisplayComponents(
        t => t.setContent(`### <:pet_food:1385884583077351464> **ANIMAL FED SUCCESSFULLY**`),
        t => t.setContent(`You fed **${matchedAnimal.emoji || meta.emoji} ${matchedAnimal.name}** with <:pet_food:1385884583077351464> **${foodToUse}x Pet Food**!`),
        t => t.setContent(`**+${totalExpGain} EXP** · Now **Lvl.${matchedAnimal.level}** (EXP: \`${matchedAnimal.exp}/${reqExp}\`)`)
      );

    if (levelsGained > 0) {
      C.addSeparatorComponents(s => s);
      C.addTextDisplayComponents(
        t => t.setContent(`🎉 **LEVEL UP!** ${matchedAnimal.emoji || meta.emoji} **${matchedAnimal.name}** grew **+${levelsGained} Level${levelsGained > 1 ? 's' : ''}** (Lvl.${startLevel} → **Lvl.${matchedAnimal.level}**)!`),
        t => t.setContent(`📈 **Stat Increases:** <:heal_heart:1381904903827361905> **+${levelsGained * 8} Max HP** (${curHp} HP) · <:claw:1493561807091138631> **+${levelsGained * 2} ATK** (${curAtk} ATK)`)
      );
    }

    C.addSeparatorComponents(s => s);
    C.addTextDisplayComponents(
      t => t.setContent(`-# Remaining Pet Food: <:pet_food:1385884583077351464> **${remainingFood}** · Tip: Feed again with \`kas feed ${matchedAnimal.name} 5\``)
    );

    return handleMessage(context, {
      components: [C],
      flags: MessageFlags.IsComponentsV2
    });

  } catch (error) {
    console.error('Error in feedCommand:', error);
    return handleMessage(context, {
      content: `**Feed Error**: ${error.message}`
    });
  }
}

export default {
  name: 'feed',
  description: 'Feed any of your animals by name or squad number to level them up and increase stats.',
  aliases: ['feedanimal', 'petfeed'],
  args: '[animalName|squadNumber] [amount]',
  example: [
    'feed',
    'feed tiger',
    'feed 1',
    'feed wolf 5',
    'feed lion all'
  ],
  category: '🦌 Wildlife',
  cooldown: 2000,
  execute: async (args, context) => {
    // args[0] is command name ('feed')
    const rawTarget = args[1];
    const rawCount = args[2] || 1;

    if (!rawTarget) {
      return feedCommand(context, { target: null, count: 1 });
    }

    return feedCommand(context, { target: rawTarget, count: rawCount });
  }
};
