import User from '../../../models/Hunt.js';
import {
  EmbedBuilder
} from 'discord.js';
import { handleMessage, discordUser } from '../../../helper.js';

const WILDLIFE_ACHIEVEMENTS = [
  {
    id: 'first_hunt',
    name: 'Novice Hunter',
    emoji: '🏹',
    description: 'Catch your first wild animal.',
    target: 1,
    getProgress: (user) => {
      const count = (user.hunt?.animals || []).reduce((sum, a) => sum + (a.totalAnimals || 1), 0);
      return { current: Math.min(count, 1), target: 1, isUnlocked: count >= 1 };
    }
  },
  {
    id: 'collector_5',
    name: 'Animal Collector',
    emoji: '🐾',
    description: 'Collect 5 unique animal species.',
    target: 5,
    getProgress: (user) => {
      const count = (user.hunt?.animals || []).length;
      return { current: Math.min(count, 5), target: 5, isUnlocked: count >= 5 };
    }
  },
  {
    id: 'collector_15',
    name: 'Wildlife Master',
    emoji: '🦁',
    description: 'Collect 15 unique animal species.',
    target: 15,
    getProgress: (user) => {
      const count = (user.hunt?.animals || []).length;
      return { current: Math.min(count, 15), target: 15, isUnlocked: count >= 15 };
    }
  },
  {
    id: 'sanctuary_30',
    name: 'Safari Sanctuary',
    emoji: '🏡',
    description: 'Own 30 total animals across all species.',
    target: 30,
    getProgress: (user) => {
      const count = (user.hunt?.animals || []).reduce((sum, a) => sum + (a.totalAnimals || 1), 0);
      return { current: Math.min(count, 30), target: 30, isUnlocked: count >= 30 };
    }
  },
  {
    id: 'rare_catch',
    name: 'Rare Encounter',
    emoji: '✨',
    description: 'Capture a Rare, Epic, or Legendary beast.',
    target: 1,
    getProgress: (user) => {
      const has = (user.hunt?.animals || []).some(a => ['rare', 'epic', 'legendary', 'mythic'].includes(a.type?.toLowerCase()));
      return { current: has ? 1 : 0, target: 1, isUnlocked: has };
    }
  },
  {
    id: 'legendary_catch',
    name: 'Legendary Hunter',
    emoji: '👑',
    description: 'Capture a Legendary or Mythic animal.',
    target: 1,
    getProgress: (user) => {
      const has = (user.hunt?.animals || []).some(a => ['legendary', 'mythic'].includes(a.type?.toLowerCase()));
      return { current: has ? 1 : 0, target: 1, isUnlocked: has };
    }
  },
  {
    id: 'first_win',
    name: 'First Blood',
    emoji: '⚔️',
    description: 'Win your first Animal Arena battle.',
    target: 1,
    getProgress: (user) => {
      const wins = user.hunt?.battlesWon || 0;
      return { current: Math.min(wins, 1), target: 1, isUnlocked: wins >= 1 };
    }
  },
  {
    id: 'gladiator_10',
    name: 'Arena Gladiator',
    emoji: '🏆',
    description: 'Win 10 Animal Arena battles.',
    target: 10,
    getProgress: (user) => {
      const wins = user.hunt?.battlesWon || 0;
      return { current: Math.min(wins, 10), target: 10, isUnlocked: wins >= 10 };
    }
  },
  {
    id: 'streak_5',
    name: 'Unstoppable',
    emoji: '🔥',
    description: 'Achieve a 5-win streak in the Animal Arena.',
    target: 5,
    getProgress: (user) => {
      const streak = Math.max(user.hunt?.highestWinStreak || 0, user.hunt?.winStreak || 0);
      return { current: Math.min(streak, 5), target: 5, isUnlocked: streak >= 5 };
    }
  },
  {
    id: 'squad_3',
    name: 'Squad Ready',
    emoji: '🛡️',
    description: 'Assemble a full 3-animal battle squad.',
    target: 3,
    getProgress: (user) => {
      const count = (user.hunt?.team || []).length;
      return { current: Math.min(count, 3), target: 3, isUnlocked: count >= 3 };
    }
  },
  {
    id: 'trained_5',
    name: 'Well Trained',
    emoji: '🍖',
    description: 'Train any animal to Level 5 or higher.',
    target: 5,
    getProgress: (user) => {
      const maxLvl = (user.hunt?.animals || []).reduce((max, a) => Math.max(max, a.level || 1), 0);
      return { current: Math.min(maxLvl, 5), target: 5, isUnlocked: maxLvl >= 5 };
    }
  },
  {
    id: 'trained_10',
    name: 'Apex Predator',
    emoji: '⭐',
    description: 'Train any animal to Level 10 or higher.',
    target: 10,
    getProgress: (user) => {
      const maxLvl = (user.hunt?.animals || []).reduce((max, a) => Math.max(max, a.level || 1), 0);
      return { current: Math.min(maxLvl, 10), target: 10, isUnlocked: maxLvl >= 10 };
    }
  }
];

/**
* achievementsCommand(context)
* Show the user's locked & unlocked achievements in an embed with real-time progression.
*/
export async function achievementsCommand(context) {
  try {
    const dUser = discordUser(context);
    const userId = dUser.id;
    const username = dUser.username || 'Hunter';

    let user = await User.findOne({
      discordId: userId
    });

    if (!user) {
      return handleMessage(context, {
        content: `<:alert:1366050815089053808> You haven't started hunting yet! Use \`/wildlife hunt\` or \`kas hunt\` to begin your journey.`
      });
    }

    if (!Array.isArray(user.achievements)) {
      user.achievements = [];
    }

    // Evaluate progression for all achievements
    const evaluated = WILDLIFE_ACHIEVEMENTS.map(ach => {
      const progress = ach.getProgress(user);
      return {
        ...ach,
        ...progress
      };
    });

    // Auto-sync unlocked achievements in database
    let isModified = false;
    for (const ach of evaluated) {
      if (ach.isUnlocked && !user.achievements.some(a => a.name === ach.name)) {
        user.achievements.push({
          name: ach.name,
          description: ach.description,
          dateUnlocked: new Date()
        });
        isModified = true;
      }
    }

    if (isModified) {
      await user.save().catch(() => {});
    }

    const unlockedCount = evaluated.filter(a => a.isUnlocked).length;
    const totalCount = evaluated.length;
    const percentage = Math.round((unlockedCount / totalCount) * 100);

    const lines = evaluated.map(a => {
      if (a.isUnlocked) {
        return `<:checkbox_checked:1388858843324350474> **${a.emoji} ${a.name}** • \`[${a.current}/${a.target}]\`\n-# ${a.description}`;
      } else {
        return `<:lock:1366621543177912442> **${a.emoji} ${a.name}** • \`[${a.current}/${a.target}]\`\n-# ${a.description}`;
      }
    });

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${username}'s Wildlife Achievements`)
      .setDescription(
        `**Milestone Progress:** \`${unlockedCount}/${totalCount}\` achievements unlocked (**${percentage}%**)\n\n` +
        lines.join('\n\n')
      )
      .setColor(unlockedCount === totalCount ? '#2ecc71' : '#f1c40f')
      .setFooter({
        text: 'Hunt beasts, feed your squad, and conquer the Arena to unlock more trophies!'
      });

    return handleMessage(context, {
      embeds: [embed]
    });
  } catch (error) {
    console.error(error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`
    });
  }
}

export default {
  name: 'achievements',
  description: 'View your hunting and wildlife achievements.',
  aliases: ['achievement', 'ach', 'wildlife-achievements'],
  args: '',
  example: ['achievements'],
  category: '🦌 Wildlife',
  cooldown: 3000,
  execute: async (args, context) => {
    return achievementsCommand(context);
  }
};
