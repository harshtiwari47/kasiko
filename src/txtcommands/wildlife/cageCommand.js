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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import feedCommand from './feedCommand.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AnimalsDatabasePath = path.join(__dirname, './animals.json');
let _parsedAnimals = [];
try {
  _parsedAnimals = JSON.parse(fs.readFileSync(AnimalsDatabasePath, 'utf-8')).animals || [];
} catch (e) {
  console.error('Error loading animals for cageCommand:', e);
}

const _animalMetaMap = new Map();
for (const a of _parsedAnimals) {
  _animalMetaMap.set(a.name.toLowerCase(), {
    name: a.name,
    emoji: a.emoji || '🐾',
    emojiId: a.emojiId,
    rarity: a.rarity || 1,
    type: a.type || 'common',
    baseHp: a.baseHp || 30,
    baseAttack: a.baseAttack || 5,
    description: a.description || 'A wild creature of the arena.'
  });
}

const TOTAL_ANIMAL_SPECIES = _parsedAnimals.length;

function getAnimalMeta(name) {
  return _animalMetaMap.get((name || '').toLowerCase()) || {
    name: name || 'Unknown',
    emoji: '🐾',
    emojiId: null,
    rarity: 1,
    type: 'common',
    baseHp: 30,
    baseAttack: 5,
    description: 'A wild creature of the arena.'
  };
}

function computeAnimalStats(animalName, level = 1) {
  const meta = getAnimalMeta(animalName);
  const lvl = Math.max(1, level);
  const hp = meta.baseHp + ((lvl - 1) * 8);
  const attack = meta.baseAttack + ((lvl - 1) * 2);
  const power = hp + (attack * 6);
  return { hp, attack, power, meta };
}

// A helper function for sending or editing replies
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
 * Show general cage info: collection overview with counts, collection %, rarity breakdown.
 * This is the COLLECTION / ZOO view — not battle stats.
 */
async function showCageOverview(context, user) {
  const username = context.user?.username || context.author?.username || 'Player';
  const userId = context.user?.id || context.author?.id;

  if (!user.hunt?.animals || user.hunt.animals.length === 0) {
    return handleMessage(context, {
      content: `<:forest_tree:1354366758596776070> **${username}**, your cage is currently empty! Use \`kas hunt\` to capture animals.`
    });
  }

  const subscriptNumbers = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
  };
  const toSubscript = (num) =>
    num.toString().split('').map(digit => subscriptNumbers[digit] || digit).join('');

  const allAnimals = (user.hunt.animals || []).filter(a => (a.totalAnimals || 0) > 0);
  const commonAnimals = allAnimals.filter(a => a.type !== 'exclusive');
  const exclusiveAnimals = allAnimals.filter(a => a.type === 'exclusive');

  // Collection stats
  const uniqueSpecies = allAnimals.length;
  const totalAnimals = allAnimals.reduce((sum, a) => sum + (a.totalAnimals || 0), 0);
  const collectionPercent = TOTAL_ANIMAL_SPECIES > 0 ? Math.floor((uniqueSpecies / TOTAL_ANIMAL_SPECIES) * 100) : 0;
  const avgLevel = allAnimals.length > 0 ? (allAnimals.reduce((sum, a) => sum + (a.level || 1), 0) / allAnimals.length).toFixed(1) : '1.0';

  // Rarity breakdown
  const rarityGroups = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, exclusive: 0 };
  for (const a of allAnimals) {
    const meta = getAnimalMeta(a.name);
    const type = (a.type || meta.type || 'common').toLowerCase();
    if (rarityGroups[type] !== undefined) rarityGroups[type]++;
    else rarityGroups.common++;
  }
  const rarityLine = Object.entries(rarityGroups)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `**${count}** ${type}`)
    .join(' · ');

  const animalEmojis = commonAnimals
    .map(animal => `${animal.emoji || getAnimalMeta(animal.name).emoji} ${toSubscript(animal.totalAnimals)}`)
    .join(' ');

  const Container = new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`### **${username.toUpperCase()}**'𝕤 𝔸𝕟𝕚𝕞𝕒𝕝 ℂ𝕒𝕘𝕖 <:forest_tree:1354366758596776070>`),
      textDisplay => textDisplay.setContent(
        `📋 **${uniqueSpecies}**/${TOTAL_ANIMAL_SPECIES} species (**${collectionPercent}%**) · **${totalAnimals}** total · Avg Lv.**${avgLevel}**`
      )
    )
    .addSeparatorComponents(separate => separate)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(animalEmojis.trim().length > 0 ? `## ${animalEmojis}` : `*No common animals in cage.*`)
    );

  if (exclusiveAnimals.length > 0) {
    const exclusiveEmojis = exclusiveAnimals
      .map(animal => `${animal.emoji || getAnimalMeta(animal.name).emoji} ${toSubscript(animal.totalAnimals)}`)
      .join(' ');
    Container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`<:exclusive:1347533975840882708> **EXCLUSIVE SPECIES**`),
      textDisplay => textDisplay.setContent(`## ${exclusiveEmojis}`)
    );
  }

  if (rarityLine) {
    Container.addSeparatorComponents(separate => separate);
    Container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`-# ${rarityLine}`)
    );
  }

  // Help button
  const helpBtn = new ButtonBuilder()
    .setCustomId(`cage_help_${userId}`)
    .setLabel('Help')
    .setEmoji('❓')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(helpBtn);

  const sent = await handleMessage(context, {
    components: [Container, row],
    flags: MessageFlags.IsComponentsV2
  });

  // Collector for the help button (ephemeral reply)
  if (sent) {
    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => i.customId === `cage_help_${userId}`,
      time: 60_000
    });

    collector.on('collect', async (i) => {
      await i.reply({
        content:
          `### 🐾 Cage & Wildlife Commands\n` +
          `• \`kas cage\` — 🏠 View your animal collection\n` +
          `• \`kas cage stats\` — 📊 View all animals ranked by level & rarity\n` +
          `• \`kas cage <animal>\` — 🔍 View specific animal stats *(e.g. \`kas cage tiger\`)*\n` +
          `• \`kas feed <animal>\` — 🍖 Feed an animal to level it up *(e.g. \`kas feed tiger 5\`)*\n` +
          `• \`kas feed\` — 📦 See available food & who to feed\n` +
          `• \`kas team\` — ⚔️ View battle squad, record & optimization\n` +
          `• \`kas team set <a1> <a2> <a3>\` — 🛡️ Deploy your 3-animal battle squad\n` +
          `• \`kas team clear\` — 🧹 Reset squad to random selection\n` +
          `• \`kas hunt\` — 🏹 Hunt for new animals\n` +
          `• \`kas ab\` — ⚔️ Battle in the arena\n` +
          `• \`kas sell <animal> [count]\` — 💰 Sell animals from your cage`,
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    });

    collector.on('end', () => {
      if (sent.editable) {
        helpBtn.setDisabled(true);
        sent.edit({ components: [Container, new ActionRowBuilder().addComponents(helpBtn)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
  }
}

/**
 * Show ranked collection stats — focuses on LEVELS, RARITY, EXP PROGRESS, COLLECTION.
 * This is distinct from `kas team` which focuses on battle readiness.
 */
async function showCageStats(context, user) {
  const username = context.user?.username || context.author?.username || 'Player';
  const userAnimals = (user.hunt?.animals || []).filter(a => (a.totalAnimals || 0) > 0);

  if (userAnimals.length === 0) {
    return handleMessage(context, {
      content: `<:forest_tree:1354366758596776070> **${username}**, your cage is empty! Capture animals with \`kas hunt\` to build your collection.`
    });
  }

  // Group by rarity/type for a cleaner display
  const teamNames = new Set((user.hunt?.team || []).map(t => (t.name || '').toLowerCase()));

  const statsList = userAnimals.map(a => {
    const s = computeAnimalStats(a.name, a.level || 1);
    const inSquad = teamNames.has(a.name.toLowerCase());
    const reqExp = (a.level || 1) * 30;
    const curExp = a.exp || 0;
    const expPercent = Math.min(100, Math.floor((curExp / reqExp) * 100));
    return {
      name: a.name,
      level: a.level || 1,
      exp: curExp,
      reqExp,
      expPercent,
      total: a.totalAnimals || 1,
      hp: s.hp,
      attack: s.attack,
      power: s.power,
      emoji: a.emoji || s.meta.emoji,
      type: s.meta.type,
      rarity: s.meta.rarity || 1,
      inSquad
    };
  });

  // Sort by LEVEL (desc), then by rarity (desc), then by total count (desc)
  statsList.sort((a, b) => b.level - a.level || b.rarity - a.rarity || b.total - a.total);

  // Collection summary
  const totalAnimals = statsList.reduce((sum, a) => sum + a.total, 0);
  const highestLevel = statsList[0]?.level || 1;
  const maxLevelAnimal = statsList[0];

  const C = new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      t => t.setContent(`### 📊 **${username.toUpperCase()}'S COLLECTION STATS**`),
      t => t.setContent(
        `**${statsList.length}** species · **${totalAnimals}** total animals · Peak: ${maxLevelAnimal ? `${maxLevelAnimal.emoji} **${maxLevelAnimal.name}** Lv.${maxLevelAnimal.level}` : 'N/A'}`
      )
    )
    .addSeparatorComponents(s => s);

  // Display animals grouped by level tiers
  const displayLimit = Math.min(12, statsList.length);
  for (let i = 0; i < displayLimit; i++) {
    const item = statsList[i];
    const squadTag = item.inSquad ? ` ⚔️` : '';
    const rarityStars = '★'.repeat(Math.min(5, item.rarity));

    const filledBlocks = Math.floor(item.expPercent / 20);
    const miniBar = '▓'.repeat(filledBlocks) + '░'.repeat(5 - filledBlocks);

    C.addTextDisplayComponents(
      t => t.setContent(
        `${item.emoji} **${item.name}**${squadTag} — Lv.**${item.level}** · ×${item.total} · \`${item.type.toUpperCase()}\` ${rarityStars}\n` +
        `-# EXP [${miniBar}] ${item.expPercent}% · \`${item.exp}/${item.reqExp}\` · <:heal_heart:1381904903827361905> ${item.hp} · <:claw:1493561807091138631> ${item.attack}`
      )
    );
  }

  if (statsList.length > displayLimit) {
    C.addTextDisplayComponents(
      t => t.setContent(`-# ...and **${statsList.length - displayLimit}** more species in cage.`)
    );
  }

  // Animals closest to leveling up
  const closestToLevelUp = [...statsList]
    .filter(a => a.expPercent > 0)
    .sort((a, b) => b.expPercent - a.expPercent)
    .slice(0, 3);

  if (closestToLevelUp.length > 0) {
    C.addSeparatorComponents(s => s);
    const closeLines = closestToLevelUp.map(a =>
      `${a.emoji} **${a.name}** — **${a.expPercent}%** to Lv.${a.level + 1} (\`${a.reqExp - a.exp}\` EXP needed · \`kas feed ${a.name}\`)`
    ).join('\n');
    C.addTextDisplayComponents(
      t => t.setContent(`🔥 **Close to Level Up:**\n${closeLines}`)
    );
  }

  return handleMessage(context, {
    components: [C],
    flags: MessageFlags.IsComponentsV2
  });
}

/**
 * Show detailed stats for one specific animal.
 */
async function showAnimalDetail(context, user, animalName) {
  if (!user.hunt?.animals || user.hunt.animals.length === 0) {
    return handleMessage(context, {
      content: `Your cage is empty. Nothing to show!`
    });
  }

  const foundAnimal = user.hunt.animals.find(
    a => a.name.toLowerCase() === animalName.toLowerCase()
  ) || user.hunt.animals.find(
    a => a.name.toLowerCase().includes(animalName.toLowerCase())
  );

  if (!foundAnimal) {
    return handleMessage(context, {
      content: `<:warning:1366050875243757699> Couldn't find an animal named **${animalName}** in your cage!\n-# Use \`kas cage\` to see your captured animals.`
    });
  }

  const stats = computeAnimalStats(foundAnimal.name, foundAnimal.level || 1);
  const team = user.hunt?.team || [];
  const inSquadIndex = team.findIndex(t => t.name.toLowerCase() === foundAnimal.name.toLowerCase());
  const squadStatus = inSquadIndex !== -1 ? `⚔️ In Battle Squad (#${inSquadIndex + 1})` : `Not in Squad`;

  const reqExp = (foundAnimal.level || 1) * 30;
  const curExp = foundAnimal.exp || 0;
  const expPercent = Math.min(100, Math.floor((curExp / reqExp) * 100));

  const filledBlocks = Math.floor(expPercent / 10);
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);

  const starCount = Math.min(5, Math.max(1, stats.meta.rarity || 1));
  const stars = '⭐'.repeat(starCount);

  const C = new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      t => t.setContent(`### ${foundAnimal.emoji || stats.meta.emoji} **${foundAnimal.name.toUpperCase()}** — STATS & PROFILE`),
      t => t.setContent(`*${stats.meta.description}*`)
    )
    .addSeparatorComponents(s => s)
    .addTextDisplayComponents(
      t => t.setContent(
        `**Level & Experience:**\n` +
        `• **Level:** **${foundAnimal.level || 1}**\n` +
        `• **EXP:** \`${curExp} / ${reqExp}\` [${progressBar}] **${expPercent}%**`
      ),
      t => t.setContent(
        `**Combat Attributes:**\n` +
        `• <:heal_heart:1381904903827361905> **Max HP:** **${stats.hp}** *(Base: ${stats.meta.baseHp}, +8/lvl)*\n` +
        `• <:claw:1493561807091138631> **Attack:** **${stats.attack}** *(Base: ${stats.meta.baseAttack}, +2/lvl)*\n` +
        `• ⚡ **Battle Power:** **${stats.power}**\n` +
        `• ⭐ **Rarity:** ${stars} (\`${stats.meta.type.toUpperCase()}\`)\n` +
        `• 📦 **Owned in Cage:** **${foundAnimal.totalAnimals || 1}**\n` +
        `• 🛡️ **Squad Status:** \`${squadStatus}\``
      )
    )
    .addSeparatorComponents(s => s)
    .addTextDisplayComponents(
      t => t.setContent(
        `**Quick Actions:**\n` +
        `• 🍖 **Feed:** \`kas feed ${foundAnimal.name} 5\` — grants +100 EXP!\n` +
        `• ⚔️ **Deploy:** \`kas team set ${foundAnimal.name}\`\n` +
        `• 💰 **Sell:** \`kas sell ${foundAnimal.name} 1\``
      )
    );

  return handleMessage(context, {
    components: [C],
    flags: MessageFlags.IsComponentsV2
  });
}

/**
 * Main command function:
 *  - If 'feed' -> delegates to feedCommand
 *  - If 'stats' or 'list' -> show collection stats
 *  - If an animal argument -> show that animal's details
 *  - If no argument -> show cage overview
 */
export async function cageCommand(context) {
  try {
    const args = context.args || [];
    const userId = context.user?.id || context.author?.id;

    // Handle 'kas animal feed ...'
    if (args[0] && (args[0].toLowerCase() === 'feed' || args[0].toLowerCase() === 'feedanimal')) {
      const feedArgs = ['feed', ...args.slice(1)];
      return feedCommand.execute(feedArgs, context);
    }

    let user = await User.findOne({ discordId: userId });
    if (!user) {
      return handleMessage(context, {
        content: `You have no hunting profile yet. Hunt animals with \`kas hunt\` first!`
      });
    }

    if (args && args.length > 0) {
      const query = args.join(' ').toLowerCase().trim();
      if (['stats', 'ranking', 'ranks', 'leaderboard', 'top', 'list'].includes(query)) {
        return showCageStats(context, user);
      }
      return showAnimalDetail(context, user, args.join(' '));
    } else {
      return showCageOverview(context, user);
    }
  } catch (error) {
    console.error('[CageCommand] Error:', error);
    return handleMessage(context, {
      content: `**Cage Error**: ${error.message}`
    });
  }
}

export default {
  name: "cage",
  description: "View your animal collection in the cage, check stats, or optimize your battle squad.",
  aliases: [
    "animals",
    "animalcage",
    "animal",
    "zoo"
  ],
  args: "[animalName|stats]",
  example: [
    "cage",
    "cage stats",
    "cage wolf",
    "animal tiger",
    "animals stats"
  ],
  related: [
    "hunt",
    "team",
    "feed",
    "ab"
  ],
  emoji: "<:Lion:1330380232095432835>",
  cooldown: 5000,
  category: "🦌 Wildlife",

  execute: async (args, context) => {
    args.shift();
    context.args = args;
    try {
      await cageCommand(context);
    } catch (e) {
      console.error(e);
    }
  }
};