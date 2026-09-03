import User from '../../../models/Hunt.js';
import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags
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
 * Show general cage info: display only the emojis of the user's animals,
 * plus an embed field for exclusive species.
 */
async function showCageOverview(context, user) {
  const username = context.user?.username || context.author?.username || 'Player';

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

  const commonAnimals = (user.hunt.animals || []).filter(a => a.type !== 'exclusive' && (a.totalAnimals || 0) > 0);
  const animalEmojis = commonAnimals
    .map(animal => `${animal.emoji || getAnimalMeta(animal.name).emoji} ${toSubscript(animal.totalAnimals)}`)
    .join(' ');

  const exclusiveAnimals = (user.hunt.animals || []).filter(animal => animal.type === 'exclusive' && (animal.totalAnimals || 0) > 0);
  let exclusiveEmojis = '';
  if (exclusiveAnimals.length > 0) {
    exclusiveEmojis = exclusiveAnimals
      .map(animal => `${animal.emoji || getAnimalMeta(animal.name).emoji} ${toSubscript(animal.totalAnimals)}`)
      .join(' ');
  }

  const Container = new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`### **${username.toUpperCase()}**'𝕤 𝔸𝕟𝕚𝕞𝕒𝕝 ℂ𝕒𝕘𝕖 <:forest_tree:1354366758596776070>`),
      textDisplay => textDisplay.setContent(`<:hunting_exp:1354384431091290162> 𝘏𝘜𝘕𝘛𝘐𝘕𝘎 𝘌𝘟𝘗: **${user.globalExp || 0}** <:rifle1:1352119137421234187><:rifle2:1352119217687625799> 𝘓𝘝𝘓: **${user.globalLevel || 1}**`)
    )
    .addSeparatorComponents(separate => separate)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(animalEmojis.trim().length > 0 ? `## ${animalEmojis}` : `*No common animals in cage.*`)
    );

  if (exclusiveAnimals.length > 0) {
    Container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`<:exclusive:1347533975840882708> **EXCLUSIVE SPECIES**`),
      textDisplay => textDisplay.setContent(`## ${exclusiveEmojis}`)
    );
  }

  Container.addSeparatorComponents(separate => separate);
  Container.addTextDisplayComponents(
    textDisplay => textDisplay.setContent(
      `**Quick Commands:**\n` +
      `• \`kas cage stats\` — 📊 View all animal stats, levels & battle power rankings\n` +
      `• \`kas cage <animal>\` — 🔍 View specific animal stats (e.g. \`kas cage tiger\`)\n` +
      `• \`kas feed <animal>\` — 🍖 Feed an animal to level it up (e.g. \`kas feed tiger 5\`)\n` +
      `• \`kas team set <a1> <a2> <a3>\` — ⚔️ Optimize and deploy your 3-animal battle squad`
    )
  );

  return handleMessage(context, {
    components: [Container],
    flags: MessageFlags.IsComponentsV2
  });
}

/**
 * Show ranked roster of all captured animals with their stats, levels, and team optimization tips.
 */
async function showCageStats(context, user) {
  const username = context.user?.username || context.author?.username || 'Player';
  const userAnimals = (user.hunt?.animals || []).filter(a => (a.totalAnimals || 0) > 0);

  if (userAnimals.length === 0) {
    return handleMessage(context, {
      content: `<:forest_tree:1354366758596776070> **${username}**, your cage is empty! Capture animals with \`kas hunt\` to build your battle squad.`
    });
  }

  // Calculate stats for all animals
  const teamNames = new Set((user.hunt?.team || []).map(t => (t.name || '').toLowerCase()));
  const statsList = userAnimals.map(a => {
    const s = computeAnimalStats(a.name, a.level || 1);
    const inSquad = teamNames.has(a.name.toLowerCase());
    return {
      name: a.name,
      level: a.level || 1,
      exp: a.exp || 0,
      total: a.totalAnimals || 1,
      hp: s.hp,
      attack: s.attack,
      power: s.power,
      emoji: a.emoji || s.meta.emoji,
      type: s.meta.type,
      inSquad
    };
  });

  // Sort descending by Power
  statsList.sort((a, b) => b.power - a.power);

  const C = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      t => t.setContent(`### 📊 **${username.toUpperCase()}'S ANIMAL ROSTER & STATS**`),
      t => t.setContent(`*Ranked by Battle Power (\`HP + ATK × 6\`). Animals with highest power deal more damage and survive longer!*`)
    )
    .addSeparatorComponents(s => s);

  // Display top animals (up to 10 in card)
  const displayLimit = Math.min(10, statsList.length);
  for (let i = 0; i < displayLimit; i++) {
    const item = statsList[i];
    const reqExp = item.level * 30;
    const squadTag = item.inSquad ? ` · **[⚔️ IN SQUAD]**` : '';
    C.addTextDisplayComponents(
      t => t.setContent(`**#${i + 1}** ${item.emoji} **${item.name}** (Lvl.${item.level}) — \`${item.type.toUpperCase()}\`${squadTag}`),
      t => t.setContent(`-# <:heal_heart:1381904903827361905> **${item.hp} HP** · <:claw:1493561807091138631> **${item.attack} ATK** · ⚡ **${item.power} Power** · EXP: \`${item.exp}/${reqExp}\``)
    );
  }

  if (statsList.length > displayLimit) {
    C.addTextDisplayComponents(
      t => t.setContent(`*...and ${statsList.length - displayLimit} more animal${statsList.length - displayLimit > 1 ? 's' : ''} in cage.*`)
    );
  }

  // Team optimization recommendation
  C.addSeparatorComponents(s => s);
  const top3 = statsList.slice(0, 3);
  const top3Names = top3.map(a => `${a.emoji} **${a.name}**`).join(' · ');
  const setCmd = `kas team set ${top3.map(a => a.name).join(' ')}`;

  const isCurrentSquadOptimal = top3.every(a => a.inSquad);

  if (isCurrentSquadOptimal) {
    C.addTextDisplayComponents(
      t => t.setContent(`🌟 **Squad Status:** Your active battle squad is fully optimized with your top 3 strongest beasts!`),
      t => t.setContent(`-# Level up your beasts with \`kas feed <animal> [amount]\` to make them even stronger.`)
    );
  } else {
    C.addTextDisplayComponents(
      t => t.setContent(`💡 **Recommended Optimal Squad:**\n${top3Names}`),
      t => t.setContent(`👉 **Optimize Now:** \`${setCmd}\`\n-# Level up beasts with \`kas feed <animal>\` to increase HP and Attack!`)
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
 *  - If 'stats' or 'list' -> show ranked stats of all animals
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