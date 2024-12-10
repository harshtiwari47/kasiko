import RoyalPass from '../../../models/RoyalPass.js';
import PassTasks from '../../../models/PassTasks.js';
import redisClient from "../../../redis.js";
import _ from 'lodash';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder
} from 'discord.js';

const BASE_REQUIRED_XP_PER_LEVEL = 10; // Base XP per level
const REDIS_EXPIRY = 300; // Cache for 5 minutes
const FIRST_PASS_COST = 10000; // 2,000,000 cash
const premiumCost = 500; // cost for premium PassTasks

// Initial Task definitions
const DefaultTasks = {
  "command": {
    "name": "😎 Command",
    "description": "Use the kas command 700 times.",
    "exp": 0,
    "required": 700,
    "reward": 250,
    "completed": false,
    "rarity": "epic"
  },
  "fun": {
    "name": "🧩 Fun Commands",
    "description": "Use any 🧩 Fun commands 300 times.",
    "exp": 0,
    "required": 300,
    "reward": 100,
    "completed": false,
    "rarity": "rare"
  },
  "catch": {
    "name": "🪝 Catch",
    "description": "Catch 30 🐟 fishes in the ocean.",
    "exp": 0,
    "required": 30,
    "reward": 75,
    "completed": false,
    "rarity": "common"
  },
  "feed": {
    "name": "😻 Feed Pet",
    "description": "Feed your pet 🐕 90 pieces of food 🍖.",
    "exp": 0,
    "required": 90,
    "reward": 150,
    "completed": false,
    "rarity": "common"
  },
  "serve": {
    "name": "🍨 Serve",
    "description": "Serve 80 🍧 ice creams to your customers.",
    "exp": 0,
    "required": 80,
    "reward": 110,
    "completed": false,
    "rarity": "rare"
  }
};

// Consolidated Rewards
const Rewards = {
  2: {
    id: "cash01",
    type: "cash",
    amount: 4000,
    details: [{
      value: 4000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
    isPremium: false,
    // Regular reward
  },
  3: {
    id: "premium_cash01",
    type: "cash",
    amount: 10000,
    details: [{
      value: 10000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
    isPremium: true,
    // Premium-only reward
  },
  // ... other rewards
};

// Premium Rewards
const PremiumRewards = {
  1: {
    id: "premium_cash01",
    type: "cash",
    amount: 10000,
    details: [{
      value: 10000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
  },
  // ... other premium rewards
};

async function getUserCash(userId) {
  let userData = await getUserData(userId);
  return userData.cash;
}

async function deductUserCash(userId, amount) {
  let userData = await getUserData(userId);
  userData.cash -= amount;
  await updateUser(userId, userData);
  return;
}

/**
* Initialize a new Royal Pass and Tasks for a user and the current month.
* For the first Royal Pass, require the user to have 2,000,000 cash.
*/
async function initRoyalPass(userId, currentMonth) {
  // Check if this is the user's first Royal Pass
  const previousPass = await RoyalPass.findOne({
    userId
  }).lean();
  const isFirstPass = !previousPass;

  if (isFirstPass) {
    const userData = await getUserData(userId);
    let userCash = userData.cash;

    if (userCash < FIRST_PASS_COST) {
      throw new Error(`You need at least ${FIRST_PASS_COST} cash to activate your first Royal Pass.`);
    }

    // Deduct the cost
    userData.cash -= FIRST_PASS_COST;
    await updateUser(userId, userData)
  }

  const royalPass = new RoyalPass( {
    userId,
    level: 1,
    progress: 0,
    month: currentMonth,
    rewardsClaimed: [],
    isPremium: false // New field to indicate if the pass is premium
  });
  await royalPass.save();

  const passTasks = new PassTasks( {
    id: userId,
    totalExp: 0,
    tasks: DefaultTasks
  });

  await passTasks.save();

  return royalPass;
}

/**
* Retrieve user's Royal Pass for the current month.
* Uses Redis caching and lean queries for performance.
*/
async function getRoyalPass(userId) {
  const currentMonth = new Date().getMonth();
  const cacheKey = `user:${userId}:royalpass`;

  const cachedUserPass = await redisClient.get(cacheKey);
  if (cachedUserPass) {
    return JSON.parse(cachedUserPass);
  }

  let royalPass = await RoyalPass.findOne({
    userId, month: currentMonth
  }).lean();

  if (!royalPass) {
    try {
      /*royalPass = await initRoyalPass(userId, currentMonth);
      royalPass = await RoyalPass.findOne({
        userId, month: currentMonth
      }).lean();*/
      return null;
    } catch (error) {
      // Handle insufficient cash for first Royal Pass
      console.error(`Error initializing Royal Pass for user ${userId}:`, error);
      return null; // Or handle accordingly
    }
  }

  await redisClient.set(cacheKey, JSON.stringify(royalPass), {
    EX: REDIS_EXPIRY
  });
  return royalPass;
}

/**
* Retrieve user's Pass Tasks.
* Uses Redis caching and lean queries for performance.
*/
export async function getUserPassTask(userId) {
  const cacheKey = `user:${userId}:passtask`;

  const cachedUserTask = await redisClient.get(cacheKey);
  if (cachedUserTask) {
    return JSON.parse(cachedUserTask);
  }

  const task = await PassTasks.findOne({
    id: userId
  }).lean();
  if (!task) return null;

  await redisClient.set(cacheKey, JSON.stringify(task), {
    EX: REDIS_EXPIRY
  });
  return task;
}

/**
* Update user's Pass Tasks in DB and cache.
* Instead of re-hydrating documents, directly update fields using $set/$inc.
* Also detects level up and handles reward unlocking notifications.
*/
export async function setUserPassTask(userId, updates, options = {}) {
  // options can include the Discord client or channel for sending messages
  const {
    client,
    channelId
  } = options;

  // Perform direct update operations. `updates` is an object with fields to set.
  const updatedUserTask = await PassTasks.findOneAndUpdate(
    {
      id: userId
    },
    {
      $set: updates
    },
    {
      new: true, lean: true
    } // return lean object
  );

  if (updatedUserTask) {
    await redisClient.set(`user:${userId}:passtask`, JSON.stringify(updatedUserTask), {
      EX: REDIS_EXPIRY
    });

    // Update Royal Pass based on totalExp (already stored in updatedUserTask)
    const totalExp = updatedUserTask.totalExp || 0;
    const newLevel = Math.floor(totalExp / BASE_REQUIRED_XP_PER_LEVEL);
    const progress = totalExp % BASE_REQUIRED_XP_PER_LEVEL; // XP towards next level

    const royalPass = await RoyalPass.findOne({
      userId: userId, month: new Date().getMonth()
    });

    if (royalPass) {
      const previousLevel = royalPass.level;
      if (newLevel > previousLevel) {
        // Level up detected
        royalPass.level = newLevel;
        royalPass.progress = progress;
        await royalPass.save();

        // Update cache
        await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(royalPass), {
          EX: REDIS_EXPIRY
        });

        // Send level up message if client and channelId are provided
        if (client && channelId) {
          const channel = await client.channels.fetch(channelId);
          if (channel) {

            const reward = Object.entries(Rewards)
            .find(([lvl, rw]) => parseInt(lvl) === newLevel && (!rw.isPremium || (rw.isPremium && royalPass.isPremium)));

            const rewardDisplay = reward
            ? `${reward[1].type === 'cash' ? `${reward[1].amount} Cash`: reward[1].name}`: 'No new reward';

            const embed = new EmbedBuilder()
            .setTitle('✯ Pass Level Up!')
            .setDescription(`**<@${userId}>**  has reached level ${newLevel} in **Royal Pass**!`)
            .addFields(
              {
                name: 'New Reward', value: rewardDisplay
              }
            );

            channel.send({
              embeds: [embed]
            });
          }
        }
      } else {
        // Update level and progress without level up
        royalPass.progress = progress;
        await royalPass.save();

        // Update cache
        await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(royalPass), {
          EX: REDIS_EXPIRY
        });
      }
    }

    return royalPass;
  }

  return null;
}

/**
* Increment a specific task's progress by 1, marking it completed if it hits the requirement.
* This function uses direct `$inc` updates for performance.
*/
export async function incrementTaskExp(userId, taskName, message) {
  // Retrieve user tasks from cache or DB
  const userTask = await getUserPassTask(userId);
  if (!userTask || !userTask.tasks[taskName] || userTask.tasks[taskName].completed) {
    return; // No updates if task doesn't exist or is completed
  }

  const task = userTask.tasks[taskName];
  const currentExp = task.exp;
  const required = task.required;

  let updateQuery;
  if (currentExp + 1 >= required && !task.completed) {
    // Mark completed and increment
    updateQuery = {
      $set: {
        [`tasks.${taskName}.completed`]: true,
        [`tasks.${taskName}.exp`]: currentExp + 1
      },
      $inc: {
        totalExp: 1
      }
    };
  } else {
    // Just increment exp
    updateQuery = {
      $inc: {
        [`tasks.${taskName}.exp`]: 1,
        totalExp: 1
      }
    };
  }

  const updatedUserTask = await PassTasks.findOneAndUpdate(
    {
      id: userId
    },
    updateQuery,
    {
      new: true, lean: true
    }
  );

  if (updatedUserTask) {
    await redisClient.set(`user:${userId}:passtask`, JSON.stringify(updatedUserTask), {
      EX: REDIS_EXPIRY
    });

    // Also update royal pass progress and level
    const totalExp = updatedUserTask.totalExp || 0;
    const newLevel = Math.floor(totalExp / BASE_REQUIRED_XP_PER_LEVEL);
    const progress = totalExp % BASE_REQUIRED_XP_PER_LEVEL; // XP towards next level

    const royalPass = await RoyalPass.findOne({
      userId: userId, month: new Date().getMonth()
    });

    if (royalPass) {
      const previousLevel = royalPass.level;
      if (newLevel > previousLevel) {
        // Level up detected
        royalPass.level = newLevel;
        royalPass.progress = progress;
        await royalPass.save();

        // Update cache
        await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(royalPass), {
          EX: REDIS_EXPIRY
        });

        // Send level up message if client is provided
        if (message) {
          if (message.channel) {
            const reward = Object.entries(Rewards)
            .find(([lvl, rw]) => parseInt(lvl) === newLevel && (!rw.isPremium || (rw.isPremium && royalPass.isPremium)));

            const rewardDisplay = reward
            ? `${reward[1].type === 'cash' ? `${reward[1].amount} Cash`: reward[1].name}`: 'No new reward';

            const embed = new EmbedBuilder()
            .setTitle('✯ Pass Level Up!')
            .setDescription(`**<@${userId}>**  has reached level ${newLevel} in **Royal Pass**!`)
            .addFields(
              {
                name: 'New Reward', value: rewardDisplay
              }
            )

            message.channel.send({
              embeds: [embed]
            });
          }
        }
      } else {
        // Update level and progress without level up
        royalPass.progress = progress;
        await royalPass.save();

        // Update cache
        await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(royalPass), {
          EX: REDIS_EXPIRY
        });
      }
    }
  }
}

/**
* Send paginated task list embed.
* Uses cached data from getUserPassTask (lean) and avoids unnecessary conversions.
*/
async function sendTaskListEmbed(author, message) {
  let currentPage = 0; // Track the current page
  const tasksPerPage = 1; // Number of tasks per page

  const userTask = await getUserPassTask(author.id);
  if (!userTask) {
    return message.reply('No tasks found for you.');
  }

  const Task = userTask.tasks;
  const taskKeys = Object.keys(Task);
  const totalPages = Math.ceil(taskKeys.length / tasksPerPage);

  const taskListEmbed = new EmbedBuilder()
  .setColor('#3498db')
  .setTitle('Task List')
  .setDescription('Here are all the tasks. Use the buttons below to navigate.')
  .setFooter({
    text: `Requested by ${author.username}`, iconURL: author.avatarURL()
  })
  .setTimestamp();

  const taskButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('previous')
    .setLabel('Previous')
    .setStyle('Secondary')
    .setDisabled(currentPage === 0),
    new ButtonBuilder()
    .setCustomId('next')
    .setLabel('Next')
    .setStyle('Secondary')
    .setDisabled(currentPage >= totalPages - 1)
  );

  const msg = await message.reply({
    embeds: [taskListEmbed],
    components: [taskButtons],
  });

  const sendTaskDetails = (page) => {
    const taskKey = taskKeys[page];
    const task = Task[taskKey];

    return new EmbedBuilder()
    .setColor('#e2947d')
    .setTitle(`Task: ${task.name}`)
    .setDescription(task.description)
    .addFields(
      {
        name: 'Required Actions', value: task.required.toString(), inline: true
      },
      {
        name: 'Reward', value: `${task.reward} EXP`, inline: true
      },
      {
        name: 'Experience Points', value: `${task.exp} completed`, inline: true
      },
      {
        name: 'Rarity', value: task.rarity.charAt(0).toUpperCase() + task.rarity.slice(1), inline: true
      },
    )
    .setFooter({
      text: `${author.username}`, iconURL: author.avatarURL()
    });
  };

  // Show initial details
  await msg.edit({
    embeds: [sendTaskDetails(currentPage)]
  });

  const filter = (interaction) => interaction.isButton() && interaction.user.id === message.author.id;
  const collector = msg.createMessageComponentCollector({
    filter, time: 180000
  });

  collector.on('collect', async (interaction) => {
    if (interaction.customId === 'next' && currentPage < totalPages - 1) {
      currentPage++;
    } else if (interaction.customId === 'previous' && currentPage > 0) {
      currentPage--;
    }

    taskButtons.components[0].setDisabled(currentPage === 0);
    taskButtons.components[1].setDisabled(currentPage >= totalPages - 1);

    await interaction.update({
      embeds: [sendTaskDetails(currentPage)],
      components: [taskButtons],
    });
  });

  collector.on('end',
    (collected, reason) => {
      if (reason === 'time') {
        taskButtons.components.forEach((button) => button.setDisabled(true));
        msg.edit({
          components: [taskButtons]
        });
      }
    });
}

/**
* Show Royal Pass status in two embeds without unnecessary conversions.
*/
async function showRoyalPass(userId, username, channel, author) {
  const royalPass = await getRoyalPass(userId);
  if (!royalPass) {
    return channel.send(`**${username}**, no **Royal Pass** found. You need at least <:kasiko_coin:1300141236841086977> ${(FIRST_PASS_COST).toLocaleString()} cash to activate your Royal Pass.`);
  }

  const claimedRewards = royalPass.rewardsClaimed.length
  ? royalPass.rewardsClaimed.map(r => `- **${r.name || `${r.amount} Amount`}**`).join('\n'): 'None yet. Complete tasks to earn rewards!';

  const upcomingRewards = Object.entries(Rewards)
  .filter(([level, reward]) => {
    const levelNum = parseInt(level);
    return levelNum > royalPass.level && (!reward.isPremium || (reward.isPremium && royalPass.isPremium));
  })
  .map(([level, reward]) => `- **Level ${level}**: ${reward.emoji} ${reward.type === 'cash' ? `${reward.amount} Cash`: reward.name}`)
  .join('\n') || 'No more rewards for this month!';

  const avatarUrl = author.displayAvatarURL({
    dynamic: true, size: 1024
  });

  const overviewEmbed = new EmbedBuilder()
  .setColor(royalPass.isPremium ? '#6989ff': '#FFD700') // Different color for premium
  .setDescription(`## ${username}'s Royal Pass ${royalPass.isPremium ? '💠': '🎖'}`)
  .setAuthor({
    name: username, iconURL: avatarUrl
  })
  .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/${royalPass.isPremium ? "royalpass_premium.png": "royalpass_gold.png"}`) // thumbnail URL for gold
  .addFields(
    {
      name: 'Current Level', value: `**${royalPass.level}**`, inline: true
    },
    {
      name: 'Progress', value: `**${royalPass.progress}/${BASE_REQUIRED_XP_PER_LEVEL} XP**`, inline: true
    },
    {
      name: 'Premium Status', value: royalPass.isPremium ? '✅ Premium': '❌ Not Premium', inline: true
    }
  );

  const rewardsEmbed = new EmbedBuilder()
  .setColor(royalPass.isPremium ? '#98c7d2': '#acd583') // Different color for premium
  .setTitle('🎁 Rewards')
  .addFields(
    {
      name: 'Claimed Rewards', value: claimedRewards
    },
    {
      name: 'Upcoming Rewards', value: upcomingRewards
    }
  )
  .setFooter({
    text: `Keep progressing to unlock more rewards!`
  });

  return channel.send({
    embeds: [overviewEmbed, rewardsEmbed]
  });
}

// Command to claim rewards

async function claimReward(userId, level, message) {
  const royalPass = await getRoyalPass(userId);
  if (!royalPass) {
    return message.reply('No Royal Pass found. Activate one using `pass activate`.');
  }

  const reward = Rewards[level];
  if (!reward) {
    return message.reply('Invalid reward level.');
  }

  if (reward.isPremium && !royalPass.isPremium) {
    return message.reply('This reward is exclusive to Premium Royal Pass holders.');
  }

  if (royalPass.rewardsClaimed.includes(reward.id)) {
    return message.reply('You have already claimed this reward.');
  }

  // Proceed to grant the reward
  if (reward.type === 'cash') {
    await updateUserCash(userId, reward.amount);
  }
  // Handle other reward types...

  // Update claimed rewards
  royalPass.rewardsClaimed.push(reward.id);
  await royalPass.save();

  // Update cache
  await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(royalPass), {
    EX: REDIS_EXPIRY
  });

  return message.reply(`✅ You have successfully claimed the reward: ${reward.amount} Cash.`);
}

/**
* The command handler for "pass".
*/
export async function execute(args, message, client) {
  const {
    channel,
    author
  } = message;
  const userId = author.id;
  const username = author.username;

  if (args[1] === 'progress') {
    // Existing functionality...
    return channel.send(`This action is now handled by incrementTaskExp or specific task increments.`);
  } else if (args[1] === 'status') {
    // Existing functionality...
    try {
      await showRoyalPass(userId, username, channel, author);
    } catch (error) {
      console.error(`Error showing Royal Pass for user ${userId}:`, error);
      return channel.send(`❌ An error occurred while retrieving your Royal Pass.`);
    }
  } else if (args[1] === 'task') {
    // Existing functionality...
    try {
      await sendTaskListEmbed(author, message);
    } catch (error) {
      console.error(`Error sending task list for user ${userId}:`, error);
      return channel.send(`❌ An error occurred while showing the tasks list.`);
    }
  } else if (args[1] === 'activate') {
    // Existing activation command
    // Existing functionality...
    try {
      const userCash = await getUserCash(userId);
      if (userCash < FIRST_PASS_COST) {
        return channel.send(`You need at least <:kasiko_coin:1300141236841086977> ${FIRST_PASS_COST.toLocaleString()} cash to activate your Royal Pass.`);
      }

      await deductUserCash(userId, FIRST_PASS_COST);
      const currentMonth = new Date().getMonth();
      const royalPass = await initRoyalPass(userId, currentMonth);

      if (royalPass instanceof Error) {
        return channel.send(`❌  **${message.author.username}**, you have insufficient cash to purchase your Royal Pass. To activate your pass you need  <:kasiko_coin:1300141236841086977> **${FIRST_PASS_COST.toLocaleString()}** cash.`);
      }

      if (royalPass) {
        return channel.send(`✅ Your Royal Pass has been activated! You have been charged <:kasiko_coin:1300141236841086977> ${FIRST_PASS_COST.toLocaleString()} cash.`);
      } else {
        return channel.send(`❌ Failed to activate Royal Pass.`);
      }
    } catch (error) {
      console.error(`Error activating Royal Pass for user ${userId}:`, error);
      return channel.send(`❌ An error occurred while activating your Royal Pass.`);
    }
  } else if (args[1] === 'premium') {
    try {
      const userCash = await getUserCash(userId);

      if (userCash < premiumCost) {
        return channel.send(`You need at least <:kasiko_coin:1300141236841086977> ${premiumCost.toLocaleString()} cash to upgrade to a Premium Royal Pass.`);
      }

      const royalPass = await RoyalPass.findOne({
        userId, month: new Date().getMonth()
      }).lean();
      if (!royalPass) {
        return channel.send(`You need to activate your Royal Pass first using \`pass activate\`.`);
      }

      if (royalPass.isPremium) {
        return channel.send(`You already have a Premium Royal Pass.`);
      }

      await deductUserCash(userId, premiumCost);
      await RoyalPass.findOneAndUpdate(
        {
          userId, month: new Date().getMonth()
        },
        {
          isPremium: true
        },
        {
          new: true
        }
      );

      return channel.send(`✅ Your Royal Pass has been upgraded to Premium! Enjoy your exclusive rewards.`);
    } catch (error) {
      console.error(`Error upgrading to Premium Royal Pass for user ${userId}:`, error);
      return channel.send(`❌ An error occurred while upgrading your Royal Pass.`);
    }
  } else {

    const firstEmbed = new EmbedBuilder()
    .setDescription('# Royal Pass 🎖')
    .setThumbnail('https://harshtiwari47.github.io/kasiko-public/images/royalpass_gold.png') // thumbnail URL for gold
    .setColor('#FFD700'); // color (Gold)

    const secondEmbed = new EmbedBuilder()
    .setDescription(
      `Use the following commands for your Royal Pass:\n`+
      `- \`pass status\`: View your Royal Pass status.\n`+
      `- \`pass task\`: See your tasks.\n` +
      `- \`pass activate\`: Activate your Royal Pass (requires <:kasiko_coin:1300141236841086977> ${FIRST_PASS_COST.toLocaleString()} cash for the first time).\n` +
      `- \`pass premium\`: Upgrade to a Premium Royal Pass (requires <:kasiko_coin:1300141236841086977> ${premiumCost.toLocaleString()} cash).`
    )
    .setColor('#FFD700'); // color (Gold)

    return channel.send({
      embeds: [firstEmbed, secondEmbed]
    });
  }
}

export default {
  name: 'pass',
  description: 'Monthly Royal Pass system for earning rewards and leveling up.',
  aliases: ['royalpass'],
  args: '<progress|status|task|activate|premium>',
  example: ['pass progress',
    'pass status',
    'pass task',
    'pass activate',
    'pass premium'],
  cooldown: 5000,
  category: '🌱 Explore',
  execute,
};