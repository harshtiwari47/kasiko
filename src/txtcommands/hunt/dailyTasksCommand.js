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
* dailyTasksCommand(context)
* Show current daily tasks. If a user has completed them, they can claim rewards.
*/
export async function dailyTasksCommand(context) {
  try {
    const userId = context.user?.id || context.author?.id;
    let user = await User.findOne({
      discordId: userId
    });
    if (!user) {
      return handleMessage(context, {
        content: `No profile found. Try hunting first!`
      });
    }

    // If user doesn't have daily tasks generated for today, generate them
    const now = new Date();
    const todayStr = now.toDateString();
    const resetNeeded = !user.hunt.lastHuntDate || user.hunt.lastHuntDate.toDateString() !== todayStr;

    if (!user.dailyTasks || resetNeeded) {
      // Replace with new tasks
      user.dailyTasks = generateDailyTasks();
      await user.save();
    }

    // Build lines for each daily task
    const lines = user.dailyTasks.map((task, i) => {
      let status = task.completed ? '✅ Completed': '❌ Incomplete';
      if (task.rewardClaimed) {
        status = '🎉 Reward Claimed';
      }
      return `**#${i+1}** \`${task.taskName}\` &rarr; ${status}`;
    });

    const embed = new EmbedBuilder()
    .setTitle(`Daily Tasks for ${user.username}`)
    .setDescription(lines.join('\n'))
    .setColor('Yellow')
    .setFooter({
      text: 'Complete and /dailyClaim to get rewards!'
    });

    return handleMessage(context,
      {
        embeds: [embed]
      });
  } catch (error) {
    console.error(error);
    return handleMessage(context,
      {
        content: `**Error**: ${error.message}`
      });
  }
}

/**
* dailyClaimCommand(context, { taskIndex })
* The user can claim their reward for a specific daily task if completed.
*/
export async function dailyClaimCommand(context, {
  taskIndex = 0
}) {
  try {
    const userId = context.user?.id || context.author?.id;
    let user = await User.findOne({
      discordId: userId
    });

    if (!user || !user.dailyTasks[taskIndex]) {
      return handleMessage(context, {
        content: `Invalid daily task or no tasks found.`
      });
    }

    const task = user.dailyTasks[taskIndex];
    if (!task.completed) {
      return handleMessage(context, {
        content: `That task is not yet completed.`
      });
    }
    if (task.rewardClaimed) {
      return handleMessage(context, {
        content: `You've already claimed this reward.`
      });
    }

    // Grant some reward
    user.currency += 100;
    task.rewardClaimed = true;

    await user.save();

    return handleMessage(context, {
      content: `You claimed your reward for \`${task.taskName}\`! +100 coins!`
    });
  } catch (error) {
    console.error(error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`
    });
  }
}

/**
* generateDailyTasks()
* This is a simple function that returns an array of daily tasks.
* In a real system, you'd randomize tasks or have multiple categories.
*/
function generateDailyTasks() {
  return [{
    taskName: 'Hunt 2 animals',
    completed: false,
    rewardClaimed: false
  },
    {
      taskName: 'Win 1 battle',
      completed: false,
      rewardClaimed: false
    },
    {
      taskName: 'Sell 1 animal',
      completed: false,
      rewardClaimed: false
    },
  ];
}

/**
* In your code, whenever user hunts, battles, or sells:
*   - Check if user has dailyTasks
*   - If 'Hunt 2 animals' is not completed, we track user hunts to mark it done
*   - E.g., after user completes 2 hunts, dailyTasks[0].completed = true
*/