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

const Task = {
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
    "exp": 0,
    "description": "Use any 🧩 Fun commands 300 times.",
    "required": 300,
    "reward": 100,
    "completed": false,
    "rarity": "rare"
  },
  "catch": {
    "name": "🪝 Catch",
    "exp": 0,
    "description": "Catch 30 🐟 fishes in the ocean.",
    "required": 30,
    "reward": 75,
    "completed": false,
    "rarity": "common"
  },
  "feed": {
    "name": "😻 Feed Pet",
    "exp": 0,
    "description": "Feed your pet 🐕 90 pieces of food 🍖.",
    "required": 90,
    "reward": 150,
    "completed": false,
    "rarity": "common"
  },
  "serve": {
    "name": "🍨 Serve",
    "exp": 0,
    "description": "Serve 80 🍧 ice creams to your customers.",
    "required": 80,
    "reward": 110,
    "completed": false,
    "rarity": "rare"
  }
}

// Total Exp: 685

const Rewards = {
  1: {
    id: "cash01",
    type: "cash",
    amount: 4000,
    details: [{
      value: 4000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
  },
  2: {
    id: "cash02",
    type: "cash",
    amount: 8000,
    details: [{
      value: 8000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
  },
  3: {
    id: "cash03",
    type: "cash",
    amount: 12000,
    details: [{
      value: 12000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
  },
  4: {
    id: "cash04",
    type: "cash",
    amount: 20000,
    details: [{
      value: 20000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
  },
  5: {
    id: "cash05",
    type: "cash",
    amount: 40000,
    details: [{
      value: 40000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
  }
}

/**
* Get or initialize the user's monthly Royal Pass progress.
*/

async function initRoyalPass(userId, currentMonth) {
  const royalPass = new RoyalPass( {
    userId,
    level: 1,
    progress: 0,
    month: currentMonth,
    rewardsClaimed: [],
  });
  await royalPass.save();

  const passTasks = new PassTasks( {
    id: userId,
    tasks: Task
  });

  await passTasks.save();

  return royalPass;
}

async function getRoyalPass(userId) {
  const currentMonth = new Date().getMonth();
  let royalPass = await RoyalPass.findOne({
    userId, month: currentMonth
  });

  if (!royalPass || royalPass.month !== currentMonth) {
    // Reset or initialize the Royal Pass for the new month
    royalPass = initRoyalPass(userId, currentMonth);
  }

  return royalPass;
}

/*
User Task List
*/

async function sendTaskListEmbed(author, message) {
  let currentPage = 0; // Track the current page
  const tasksPerPage = 1; // Number of tasks to display per page

  const taskListEmbed = new EmbedBuilder()
  .setColor('#3498db')
  .setTitle('Task List')
  .setDescription('Here are all the tasks. Use the buttons below to navigate through them.')
  .setFooter({
    text: `Requested by ${author.username}`, iconURL: author.avatarURL()
  })
  .setTimestamp();

  // Get tasks as an array for easy pagination
  const taskKeys = Object.keys(Task);
  const totalPages = Math.ceil(taskKeys.length / tasksPerPage);

  const taskButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('previous')
    .setLabel('Previous')
    .setStyle('Secondary')
    .setDisabled(currentPage === 0), // Disable if on the first page
    new ButtonBuilder()
    .setCustomId('next')
    .setLabel('Next')
    .setStyle('Secondary')
    .setDisabled(currentPage >= totalPages - 1) // Disable if on the last page
  );

  // Send the initial embed with navigation buttons
  const msg = await message.reply({
    embeds: [taskListEmbed],
    components: [taskButtons],
  });

  // Function to send task details embed for the current page
  const sendTaskDetails = (page) => {
    const taskKey = taskKeys[page];
    const task = Task[taskKey];

    const taskEmbed = new EmbedBuilder()
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

    return taskEmbed;
  };

  // Set up interaction collector with a 3-minute timeout
  const filter = (interaction) => interaction.isButton() && interaction.user.id === message.author.id;
  const collector = msg.createMessageComponentCollector({
    filter,
    time: 180000, // 3 minutes in milliseconds
  });

  collector.on('collect', async (interaction) => {
    if (interaction.replied || interaction.deferred) {
      return; // Avoid replying again if the interaction has already been replied to or deferred
    }

    if (interaction.customId === 'next' && currentPage < totalPages - 1) {
      currentPage++;
    } else if (interaction.customId === 'previous' && currentPage > 0) {
      currentPage--;
    }

    // Update embed with new task details
    const updatedEmbed = sendTaskDetails(currentPage);
    taskButtons.components[0].setDisabled(currentPage === 0); // Disable "Previous" if on the first page
    taskButtons.components[1].setDisabled(currentPage >= totalPages - 1); // Disable "Next" if on the last page

    // Edit the message with the updated embed and buttons
    await interaction.update({
      embeds: [updatedEmbed],
      components: [taskButtons],
    });

    // You don't need to call interaction.deferUpdate() here
  });

  collector.on('end',
    (collected, reason) => {
      if (reason === 'time') {
        // Disable buttons after 3 minutes
        taskButtons.components.forEach((button) => button.setDisabled(true));
        msg.edit({
          components: [taskButtons],
        });
      }
    });
}

/**
* Add progress to the user's Royal Pass and grant rewards.
*/
async function addRoyalPassProgress(userId, progress, channel, username) {
  const royalPass = await getRoyalPass(userId);

  // Update progress and handle level-ups
  royalPass.progress += progress;
  const requiredXP = 100; // Example: 100 XP per level

  let leveledUp = false;
  while (royalPass.progress >= requiredXP) {
    royalPass.level++;
    royalPass.progress -= requiredXP;
    leveledUp = true;

    // Grant rewards for leveling up
    const reward = grantReward(royalPass.level, userId, username, channel);
    royalPass.rewardsClaimed.push(reward);
  }

  await royalPass.save();

  if (leveledUp) {
    return channel.send(`🎉 **${username}** leveled up to Royal Pass Level ${royalPass.level}!`);
  }
  return channel.send(`✅ **${username}** earned ${progress} XP! Keep going to level up your Royal Pass.`);
}

/**
* Display the user's Royal Pass status with rewards in two decorated embeds.
*/
async function showRoyalPass(userId, username, channel, author) {
  const royalPass = await getRoyalPass(userId);

  // Format claimed rewards
  const claimedRewards = royalPass.rewardsClaimed.length
  ? royalPass.rewardsClaimed.map(r => `- **${r.name || `${r.amount} Amount`}**`).join('\n'): 'None yet. Complete tasks to earn rewards!';

  // Format upcoming rewards
  const upcomingRewards = Object.entries(Rewards)
  .filter(([level]) => parseInt(level) > royalPass.level)
  .map(([level, reward]) => `- **Level ${level}**: ${reward.type === 'cash' ? `${reward.amount} Cash`: reward.name}`)
  .join('\n') || 'No more rewards for this month!';

  const avatarUrl = author.displayAvatarURL({
    dynamic: true, size: 1024
  });

  // First embed: Overview
  const overviewEmbed = new EmbedBuilder()
  .setColor('#FFD700') // Royal gold color
  .setTitle(`🎖️ ${username}'s Royal Pass`)
  .setAuthor({
    name: username, iconURL: avatarUrl
  })
  .setThumbnail('https://example.com/royal-pass-icon.png') // Replace with your own icon
  .addFields([{
    name: 'Current Level', value: `**${royalPass.level}**`, inline: true
  },
    {
      name: 'Progress', value: `**${royalPass.progress}/685 XP**`, inline: true
    },
  ]);

  // Second embed: Rewards
  const rewardsEmbed = new EmbedBuilder()
  .setColor('#acd583') // Green for rewards
  .setTitle('🎁 Rewards')
  .addFields([{
    name: 'Claimed Rewards', value: claimedRewards
  },
    {
      name: 'Upcoming Rewards', value: upcomingRewards
    },
  ])
  .setThumbnail('https://example.com/rewards-icon.png') // Replace with your own icon
  .setFooter({
    text: `Keep progressing to unlock more rewards!`
  });

  // Send both embeds together
  return channel.send({
    embeds: [overviewEmbed, rewardsEmbed]
  });
}

export async function getUserPassTask(userId) {
  try {
    const cachedUserTask = await redisClient.get(`user:${userId}:passtask`);

    if (cachedUserTask) {
      const task = PassTasks.hydrate(JSON.parse(cachedUserTask));
      return task;
    }

    const task = await PassTasks.findOne({
      id: userId
    });

    if (!task) return null;

    await redisClient.set(`user:${userId}:passtask`, JSON.stringify(task.toObject()), {
      EX: 60
    });

    return task;
  } catch (e) {
    console.error(e);
  }
}

export async function setUserPassTask(userId, userpassTask) {
  try {
    const updates = {};
    userpassTask.modifiedPaths().forEach((path) => {
      updates[path] = _.get(userpassTask, path); // Safely access nested paths
    });

    const updatedUserTask = await PassTasks.findByIdAndUpdate(
      userpassTask["_id"],
      {
        $set: updates
      },
      {
        new: true
      }
    );

    await redisClient.set(`user:${userId}:passtask`, JSON.stringify(updatedUserTask.toObject()), {
      EX: 60
    });

    const userPass = await RoyalPass.findOne({
      userId
    });

    let overAllExp = Object.keys(userpassTask.tasks.toJSON()).reduce((sum, key) => {
      sum += userpassTask.tasks.get(key).exp;
      return sum;
    }, 0);
    userPass.progress = parseInt(overAllExp);
    userPass.level = Math.floor(parseInt(overAllExp)/136);

    userPass.save();
  } catch (e) {
    console.error(e);
  }
}

/**
* Command execution handler.
*/
export async function execute(args, message) {
  const {
    channel,
    author
  } = message;
  const userId = author.id;
  const username = author.username;

  if (args[1] === 'progress') {
    try {
      // Simulate adding progress (e.g., completing a task)
      const progress = 50; // Example: Earned 50 XP
      //await addRoyalPassProgress(userId, progress, channel, username);
    } catch (error) {
      console.error(error);
      return channel.send(`❌ An error occurred while updating your Royal Pass.`);
    }
  } else if (args[1] === 'status') {
    try {
      await showRoyalPass(userId, username, channel, author);
    } catch (error) {
      console.error(error);
      return channel.send(`❌ An error occurred while retrieving your Royal Pass.`);
    }
  } else if (args[1] === 'task') {
    try {
      await sendTaskListEmbed(author, message);
    } catch (error) {
      console.error(error);
      return channel.send(`❌ An error occurred while showing the tasks list.`);
    }
  } else {
    return channel.send(
      `🎖️ Use \`pass progress\` to add progress, \`pass status\` to view your Royal Pass status, or \`pass task\` to complete tasks.`
    );
  }
}

export default {
  name: 'pass',
  description: 'Monthly Royal Pass system for earning rewards and leveling up.',
  aliases: ['royalpass'],
  args: '<progress|status|task>',
  example: ['pass progress',
    'pass status',
    'pass task'],
  cooldown: 5000,
  // 5 seconds cooldown
  category: '🎮 Fun',
  execute,
};