import User from '../../../models/Hunt.js';
import {
  EmbedBuilder
} from 'discord.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    // For normal text-based usage
    return context.channel.send(data);
  }
}
/**
* achievementsCommand(context)
* Show the user's locked & unlocked achievements in an embed.
*/
export async function achievementsCommand(context) {
  try {
    const userId = context.user?.id || context.author?.id;
    let user = await User.findOne({
      discordId: userId
    });
    if (!user) {
      return handleMessage(context, {
        content: `You have no profile yet. Go hunt first!`
      });
    }

    // Suppose you have a global array of all possible achievements:
    const globalAchievements = [{
      name: 'Wolf Tamer',
      description: 'Catch 10 Wolves',
      // ...
    },
      {
        name: 'Big Spender',
        description: 'Sell 5 animals total',
      }
      // ...
    ];

    // We'll check which are unlocked
    const unlockedSet = new Set(user.achievements.map(a => a.name));

    const lines = globalAchievements.map(a => {
      const isUnlocked = unlockedSet.has(a.name);
      return isUnlocked
      ? `✅ **${a.name}** - ${a.description}`: `❌ **???** - (Locked)`;
    });

    const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Achievements`)
    .setDescription(lines.join('\n'))
    .setColor('Gold');

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