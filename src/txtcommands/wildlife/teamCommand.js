import User from '../../../models/Hunt.js';
import animalsData from './animals.json' with { type: 'json' };
import {
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { handleMessage, discordUser } from '../../../helper.js';

function capitalizeName(name) {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function getAnimalMeta(animalName) {
  const animal = animalsData.animals.find(a => a.name.toLowerCase() === animalName.toLowerCase());
  if (!animal) {
    return {
      name: animalName,
      emoji: '🐾',
      rarity: 1,
      type: 'Common',
      baseHp: 30,
      baseAttack: 5
    };
  }
  return {
    name: animal.name,
    emoji: animal.emoji || '🐾',
    rarity: animal.rarity || 1,
    type: (animal.type || 'Common').toUpperCase(),
    baseHp: animal.baseHp || 30,
    baseAttack: animal.baseAttack || 5
  };
}

function computeStats(animalMeta, level = 1) {
  const lvl = Math.max(1, level);
  const hp = (animalMeta.baseHp || 30) + ((lvl - 1) * 8);
  const attack = (animalMeta.baseAttack || 5) + ((lvl - 1) * 2);
  return { hp, attack };
}

export async function teamCommand(context, { action = 'view', names = [] } = {}) {
  try {
    const { id: userId, username, name } = discordUser(context);

    let user = await User.findOne({ discordId: userId });
    if (!user) {
      user = new User({
        discordId: userId,
        hunt: { animals: [], team: [], unlockedLocations: ['Forest'] }
      });
      await user.save();
    }

    action = (action || '').toString().toLowerCase();

    // ── Action: SET ─────────────────────────────────────────────────────────
    if (action === 'set') {
      if (!names || names.length === 0) {
        return handleMessage(context, {
          content:
            `<:warning:1366050875243757699> **${name}**, please specify up to 3 animal names.\n\n` +
            `**Usage:** \`kas team set <animal1> [animal2] [animal3]\`\n` +
            `**Example:** \`kas team set Wolf Fox Bear\``
        });
      }

      const requested = [];
      const added = new Set();
      const userAnimals = user.hunt?.animals || [];

      for (const raw of names.slice(0, 3)) {
        const n = capitalizeName(raw.trim());
        if (!n || added.has(n.toLowerCase())) continue;
        const found = userAnimals.find(a => (a.name || '').toLowerCase() === n.toLowerCase() && ((a.totalAnimals || 1) > 0));
        if (found) {
          requested.push({
            name: found.name,
            level: found.level || 1,
            hp: found.hp || 30,
            attack: found.attack || 5
          });
          added.add(n.toLowerCase());
        }
      }

      if (requested.length === 0) {
        return handleMessage(context, {
          content: `<:alert:1366050815089053808> **${name}**, none of those animals were found in your collection. Hunt some animals first using \`kas hunt\`!`
        });
      }

      user.hunt.team = requested;
      await user.save();

      const C = new ContainerBuilder()
        .setAccentColor(0x57F287)
        .addTextDisplayComponents(
          t => t.setContent(`### ⚔️ **BATTLE SQUAD UPDATED**`),
          t => t.setContent(`**${name}**, your battle team has been successfully configured:`)
        );

      for (let i = 0; i < requested.length; i++) {
        const item = requested[i];
        const meta = getAnimalMeta(item.name);
        const stats = computeStats(meta, item.level);
        C.addTextDisplayComponents(
          t => t.setContent(`**#${i + 1}** ${meta.emoji} **${item.name}** (Lvl.${item.level}) — ⭐ \`${meta.type}\``),
          t => t.setContent(`-# 💚 **${stats.hp} HP** · ⚔️ **${stats.attack} ATK**`)
        );
      }

      C.addSeparatorComponents(s => s);
      C.addTextDisplayComponents(
        t => t.setContent(`-# Jump into battle using \`kas ab\` or challenge friends with \`kas ab @user\`!`)
      );

      return handleMessage(context, {
        components: [C],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // ── Action: CLEAR ───────────────────────────────────────────────────────
    if (action === 'clear') {
      user.hunt.team = [];
      await user.save();

      const C = new ContainerBuilder()
        .setAccentColor(0xFEE75C)
        .addTextDisplayComponents(
          t => t.setContent(`### 🧹 **BATTLE SQUAD CLEARED**`),
          t => t.setContent(`**${name}**, your preferred battle team has been reset. Battles will now automatically choose 3 random animals from your bag.`),
          t => t.setContent(`-# Set a new team anytime using \`kas team set <animal1> <animal2> <animal3>\`.`)
        );

      return handleMessage(context, {
        components: [C],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // ── Action: VIEW (Default) ──────────────────────────────────────────────
    const team = user.hunt?.team || [];
    const battlesWon = user.hunt?.battlesWon || 0;
    const winStreak = user.hunt?.winStreak || 0;
    const highestWinStreak = user.hunt?.highestWinStreak || 0;

    const C = new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(
        t => t.setContent(`### ⚔️ **${name.toUpperCase()}'S BATTLE SQUAD**`),
        t => t.setContent(`🏆 **${battlesWon} Wins** · 🔥 **${winStreak} Win Streak** *(Best: ${highestWinStreak})*`)
      )
      .addSeparatorComponents(s => s);

    if (team.length === 0) {
      C.addTextDisplayComponents(
        t => t.setContent(`*No preferred battle squad set! The arena will deploy 3 random animals from your bag.*`),
        t => t.setContent(`-# 💡 **Set your squad:** \`kas team set <animal1> [animal2] [animal3]\``)
      );
    } else {
      for (let i = 0; i < team.length; i++) {
        const item = team[i];
        const meta = getAnimalMeta(item.name);
        const stats = computeStats(meta, item.level);
        C.addTextDisplayComponents(
          t => t.setContent(`**#${i + 1}** ${meta.emoji} **${item.name}** (Lvl.${item.level}) — ⭐ \`${meta.type}\``),
          t => t.setContent(`-# 💚 **${stats.hp} HP** · ⚔️ **${stats.attack} ATK** · Feed: \`kas feed ${i + 1}\``)
        );
      }
    }

    // Show available top animals if bag has animals
    const userAnimals = (user.hunt?.animals || []).filter(a => (a.totalAnimals || 1) > 0);
    if (userAnimals.length > 0) {
      C.addSeparatorComponents(s => s);
      const topAnimals = [...userAnimals]
        .sort((a, b) => (b.level || 1) - (a.level || 1))
        .slice(0, 5);

      const animalBadges = topAnimals.map(a => {
        const meta = getAnimalMeta(a.name);
        return `${meta.emoji} **${a.name}** (Lvl.${a.level || 1})`;
      }).join(' · ');

      C.addTextDisplayComponents(
        t => t.setContent(`**🎒 Top Beasts in Bag:**\n${animalBadges}`),
        t => t.setContent(`-# Use \`kas hunt\` to capture more beasts or \`kas feed <index>\` to level up!`)
      );
    }

    return handleMessage(context, {
      components: [C],
      flags: MessageFlags.IsComponentsV2
    });

  } catch (err) {
    console.error('[TeamCommand] Error:', err);
    return handleMessage(context, {
      content: `**Team Error**: ${err.message}`
    });
  }
}

export default {
  name: 'team',
  description: 'Manage and customize your 3-animal battle squad: set, view, or clear.',
  aliases: ['setteam', 'myteam', 'squad'],
  args: '[set|view|clear] [animals]',
  example: [
    'team',
    'team set Wolf Fox Bear',
    'team clear'
  ],
  cooldown: 3000,
  category: '🦌 Wildlife',

  execute: async (args, context) => {
    const action = args[1] ? args[1].toLowerCase() : 'view';
    if (action === 'set') {
      const names = args.slice(2);
      return teamCommand(context, { action: 'set', names });
    }
    if (action === 'clear') {
      return teamCommand(context, { action: 'clear' });
    }
    return teamCommand(context, { action: 'view' });
  }
};
