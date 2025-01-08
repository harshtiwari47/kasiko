import RoyalPass from '../../../models/RoyalPass.js';
import PassTasks from '../../../models/PassTasks.js';
import redisClient from "../../../redis.js";
import {
  getUserData,
  updateUser
} from '../../../database.js';
import Rewards from './pass/rewards.js';
import {
  Tasks,
  TASKEXP
} from './pass/tasks.js';
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder
} from 'discord.js';
import winston from 'winston';

import IceCreamShop from "../../../models/IceCream.js";
import UserPet from "../../../models/Pet.js";
import {
  Ship
} from '../battle/shipsHandler.js';


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({
      timestamp, level, message
    }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Constants
const BASE_REQUIRED_XP_PER_LEVEL = Math.floor(TASKEXP / Object.keys(Rewards).length);
const REDIS_EXPIRY = 300; // Cache for 5 minutes
const FIRST_PASS_COST = 1000000;
const PREMIUM_COST = 900000;

// Batching Constants
let BULK_UPDATE_THRESHOLD = 10; // Set to 10 for production

const getUpdateKey = (userId) => `user:${userId}:updateQueue`;
const getCountKey = (userId) => `user:${userId}:updateCount`;

// Utility Functions
async function getUserCash(userId) {
  const userData = await getUserData(userId);
  return userData.cash;
}

async function updateUserCash(userId, amount) {
  const userData = await getUserData(userId);
  userData.cash += amount;
  await updateUser(userId, userData);
}

async function deductUserCash(userId, amount) {
  const userData = await getUserData(userId);
  userData.cash -= amount;
  await updateUser(userId, userData);
}

async function initRoyalPass(userId, currentMonth) {
  try {
    const previousPass = await RoyalPass.findOne({
      userId
    }).lean();
    const isFirstPass = !previousPass;

    if (isFirstPass) {
      const userData = await getUserData(userId);
      let userCash = userData.cash;

      if (userCash < FIRST_PASS_COST) {
        throw new Error(`You need at least ${FIRST_PASS_COST} cash to activate your first Royal Pass.`);
        return;
      }

      userData.cash -= FIRST_PASS_COST;
      await updateUser(userId, userData);
    }

    const royalPass = new RoyalPass( {
      userId,
      level: 1,
      progress: 0,
      month: currentMonth,
      rewardsClaimed: [],
      isPremium: false
    });
    await royalPass.save();

    const passTasks = new PassTasks( {
      id: userId,
      totalExp: 0,
      tasks: Tasks
    });
    await passTasks.save();

    await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(royalPass), {
      EX: REDIS_EXPIRY
    });
    await redisClient.set(`user:${userId}:passtask`, JSON.stringify(passTasks), {
      EX: REDIS_EXPIRY
    });

    const currentYear = new Date().getFullYear();

    const userData = await getUserData(userId);
    userData.pass.type = "basic";
    userData.pass.month = currentMonth;
    userData.pass.year = currentYear;
    userData.seasonalPasses.push("<:royalpass1224:1317027306253844520>");
    if (userData.seasonalPasses.length > 5) {
      userData.seasonalPasses.shift();
    }
    await updateUser(userId, userData);

    return royalPass;
  } catch (error) {
    logger.error(`Error initializing Royal Pass for user ${userId}: ${error.message}`);
    throw error;
  }
}

async function getRoyalPass(userId) {
  const currentMonth = new Date().getMonth();
  const cacheKey = `user:${userId}:royalpass`;

  try {
    const cachedUserPass = await redisClient.get(cacheKey);
    if (cachedUserPass) {
      return JSON.parse(cachedUserPass);
    }

    let royalPass = await RoyalPass.findOne({
      userId, month: currentMonth
    }).lean();
    if (!royalPass) return null;

    await redisClient.set(cacheKey, JSON.stringify(royalPass), {
      EX: REDIS_EXPIRY
    });
    return royalPass;
  } catch (error) {
    logger.error(`Error retrieving Royal Pass for user ${userId}: ${error.message}`);
    return null;
  }
}

export async function getUserPassTask(userId) {
  const cacheKey = `user:${userId}:passtask`;

  try {
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
  } catch (error) {
    logger.error(`Error retrieving Pass Tasks for user ${userId}: ${error.message}`);
    return null;
  }
}

export async function incrementTaskExp(userId, taskName, message) {
  const startTime = Date.now();
  try {

    const userTask = await getUserPassTask(userId);
    if (!userTask || !userTask.tasks[taskName] || userTask.tasks[taskName].completed) {
      return;
    }

    const task = userTask.tasks[taskName];
    const currentExp = task.exp;
    const required = task.required;

    // Determine if task completes with this increment
    let isCompleted = false;
    if (currentExp + 1 >= required && !task.completed) {
      isCompleted = true;
    }

    // Prepare Redis update operations
    const redisOps = [
      redisClient.hIncrBy(getUpdateKey(userId), `tasks.${taskName}.exp`, 1),
      redisClient.hIncrBy(getUpdateKey(userId), 'totalExp', 1)
    ];

    if (isCompleted) {
      redisOps.push(redisClient.hSet(getUpdateKey(userId), `tasks.${taskName}.completed`, 'true'));
    }

    // Execute Redis operations in parallel
    await Promise.all(redisOps);

    // Increment the update count
    const updateCount = await redisClient.incr(getCountKey(userId));

    // If threshold is reached, flush updates
    if (updateCount >= BULK_UPDATE_THRESHOLD) {
      await flushPendingUpdatesForUser(userId, message);
    }

    const endTime = Date.now();
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in incrementTaskExp for user ${userId}: ${error.message}`);
  }
}

// Flush updates for a single user (used when threshold is reached)
async function flushPendingUpdatesForUser(userId, message) {
  const startTime = Date.now();
  try {
    await redisClient.set(getCountKey(userId), 0);

    // Fetch pending updates
    const pendingUpdates = await redisClient.hGetAll(getUpdateKey(userId));

    if (Object.keys(pendingUpdates).length === 0) {
      return;
    }

    // Clear the Redis hash
    await redisClient.del(getUpdateKey(userId));

    // Prepare MongoDB update
    const incFields = {};
    const setFields = {};

    for (const [field, value] of Object.entries(pendingUpdates)) {
      if (field.endsWith('.completed')) {
        setFields[field] = true;
      } else {
        const increment = parseInt(value, 10);
        incFields[field] = (incFields[field] || 0) + increment;
      }
    }

    const mongoUpdate = {};
    if (Object.keys(incFields).length > 0) mongoUpdate.$inc = incFields;
    if (Object.keys(setFields).length > 0) mongoUpdate.$set = setFields;

    // Update PassTasks in MongoDB
    const updatedUserTask = await PassTasks.findOneAndUpdate(
      {
        id: userId
      },
      mongoUpdate,
      {
        new: true, lean: true
      }
    );

    if (!updatedUserTask) {
      return;
    }

    // Update Redis cache
    await redisClient.set(`user:${userId}:passtask`, JSON.stringify(updatedUserTask), {
      EX: REDIS_EXPIRY
    });

    // Calculate new level and progress
    const totalExp = updatedUserTask.totalExp || 0;
    const newLevel = Math.floor(totalExp / BASE_REQUIRED_XP_PER_LEVEL);
    const progress = totalExp % BASE_REQUIRED_XP_PER_LEVEL;

    // Fetch RoyalPass
    const royalPass = await RoyalPass.findOne({
      userId, month: new Date().getMonth()
    });

    if (royalPass) {
      const previousLevel = royalPass.level;
      let levelUp = false;

      if (newLevel > previousLevel) {
        royalPass.level = newLevel;
        royalPass.progress = progress;
        levelUp = true;
      } else {
        royalPass.progress = progress;
      }

      await royalPass.save();
      await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(royalPass), {
        EX: REDIS_EXPIRY
      });

      if (levelUp && message && message.channel) {
        const reward = Object.entries(Rewards)
        .find(([lvl, rw]) => parseInt(lvl) === newLevel && (!rw.isPremium || (rw.isPremium && royalPass.isPremium)));

        const rewardDisplay = reward
        ? `${reward[1].type === 'cash' ? `${reward[1].amount} Cash`: reward[1].type + " (" + reward[1].amount + ")"}`: 'No new reward';

        const embed = new EmbedBuilder()
        .setTitle('✯ Pass Level Up!')
        .setDescription(`**<@${userId}>** has reached level ${newLevel} in **Royal Pass**!`)
        .addFields({
          name: 'New Reward', value: rewardDisplay
        })
        .setColor('#00FF00')
        .setTimestamp();

        await message.channel.send({
          embeds: [embed]
        });
      }
    }

    const endTime = Date.now();
    console.log(`[${new Date().toISOString()}] flushPendingUpdatesForUser completed for user: ${userId} in ${endTime - startTime} ms`);
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error bulk updating user tasks for user ${userId}: ${error.message}`);
  }
}

// Function to send task list as an embed with pagination
async function sendTaskListEmbed(author, message) {
  let currentPage = 0;
  const tasksPerPage = 1;

  try {
    const userTask = await getUserPassTask(author.id);
    if (!userTask) {
      return message.reply('No tasks found for you.');
    }

    // Get pending updates
    const pendingUpdates = await redisClient.hGetAll(getUpdateKey(author.id));

    const Task = userTask.tasks;
    const taskKeys = Object.keys(Task);
    const totalPages = Math.ceil(taskKeys.length / tasksPerPage);

    // Apply pending updates to tasks
    for (const [field, value] of Object.entries(pendingUpdates)) {
      if (field.startsWith('tasks.')) {
        const [_,
          taskName,
          prop] = field.split('.');
        if (Task[taskName]) {
          if (prop === 'exp') {
            Task[taskName].exp += parseInt(value, 10);
          }
          if (prop === 'completed') {
            Task[taskName].completed = value === 'true';
          }
        }
      } else if (field === 'totalExp') {
        // You can handle totalExp if needed
      }
    }

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
      })
      .setTimestamp();
    };

    const initialEmbed = sendTaskDetails(currentPage);
    const msg = await message.reply({
      embeds: [initialEmbed], components: [taskButtons]
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
      () => {
        taskButtons.components.forEach((button) => button.setDisabled(true));
        msg.edit({
          components: [taskButtons]
        });
      });
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in sendTaskListEmbed for user ${author.id}: ${error.message}`);
    return message.reply('❌ An error occurred while showing the tasks list.');
  }
}

// Function to display the Royal Pass status
async function showRoyalPass(userId, username, channel, author) {
  try {
    const royalPass = await getRoyalPass(userId);
    if (!royalPass) {
      return channel.send(`**${username}**, no **Royal Pass** found. You need at least <:kasiko_coin:1300141236841086977> ${FIRST_PASS_COST.toLocaleString()} cash to activate your Royal Pass.`);
    }

    // Get pending updates
    const pendingUpdates = await redisClient.hGetAll(getUpdateKey(userId));

    // Apply pending updates to royalPass data
    let totalExp = royalPass.level * BASE_REQUIRED_XP_PER_LEVEL + royalPass.progress;
    let level = royalPass.level;
    let progress = royalPass.progress;

    for (const [field, value] of Object.entries(pendingUpdates)) {
      if (field === 'totalExp') {
        totalExp += parseInt(value, 10);
      }
    }

    const newLevel = Math.floor(totalExp / BASE_REQUIRED_XP_PER_LEVEL);
    progress = totalExp % BASE_REQUIRED_XP_PER_LEVEL;

    const levelUp = newLevel > royalPass.level;

    const claimedRewards = royalPass.rewardsClaimed.length
    ? royalPass.rewardsClaimed.map(r => `- **${r.emoji + ` ${r.amount} ` + (r.name || "")}**`).join('\n'): 'None yet. Complete tasks to earn rewards!';

    const upcomingRewards = Object.entries(Rewards)
    .filter(([lvl, reward]) => {
      const levelNum = parseInt(lvl);
      return (!(royalPass.rewardsClaimed.some(r => r.id === reward.id)) || levelNum > newLevel) && (!royalPass?.rewardsClaimed.some(r => r.id === reward.id));
    })
    .map(([level, reward]) => `- **Level ${level}**: ${reward.isPremium ? "<:royalpass_premium:1316397608603881543>": ""} ${reward.emoji} ${reward.type === 'cash' ? `${reward.amount} Cash`: reward.name + " (" + reward.amount + ")"}`)
    .join('\n') || 'No more rewards for this month!';

    const avatarUrl = author.displayAvatarURL({
      dynamic: true, size: 1024
    });

    const overviewEmbed = new EmbedBuilder()
    .setColor(royalPass.isPremium ? '#6989ff': '#FFD700')
    .setDescription(`## ${username}'s Royal Pass ${royalPass.isPremium ? '💠': '🎖'}`)
    .setAuthor({
      name: username, iconURL: avatarUrl
    })
    .setThumbnail(royalPass.isPremium
      ? "https://harshtiwari47.github.io/kasiko-public/images/royalpass_premium.png": "https://harshtiwari47.github.io/kasiko-public/images/royalpass_gold.png"
    )
    .addFields(
      {
        name: 'Current Level', value: `**${newLevel}**`, inline: true
      },
      {
        name: 'Progress', value: `**${progress}/${BASE_REQUIRED_XP_PER_LEVEL} XP**`, inline: false
      },
      {
        name: 'Premium Status', value: royalPass.isPremium ? '✅ Premium': '❌ Not Premium', inline: false
      }
    )

    const rewardsEmbed = new EmbedBuilder()
    .setColor(royalPass.isPremium ? '#98c7d2': '#acd583')
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
      text: `Keep progressing to unlock more rewards! | Use \`kas pass claim <level>\` to claim ☄️`
    })

    // If level up due to pending updates, notify the user
    if (levelUp && message && message.channel) {
      const reward = Object.entries(Rewards)
      .find(([lvl, rw]) => parseInt(lvl) === newLevel && (!rw.isPremium || (rw.isPremium && royalPass.isPremium)));

      const rewardDisplay = reward
      ? `${reward[1].type === 'cash' ? `${reward[1].amount} Cash`: reward[1].name}`: 'No new reward';

      const embed = new EmbedBuilder()
      .setTitle('✯ Pass Level Up!')
      .setDescription(`**<@${userId}>** has reached level ${newLevel} in **Royal Pass**!`)
      .addFields({
        name: 'New Reward', value: rewardDisplay
      })
      .setColor('#00FF00')
      .setTimestamp();

      await message.channel.send({
        embeds: [embed]
      });
    }

    return channel.send({
      embeds: [overviewEmbed, rewardsEmbed]
    });
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in showRoyalPass for user ${userId}: ${error.message}`);
    return channel.send(`❌ An error occurred while retrieving your Royal Pass.`);
  }
}

// Function to claim a reward
async function claimReward(userId, level, message) {
  try {
    const royalPass = await getRoyalPass(userId);
    if (!royalPass) {
      return message.reply('⚠️ No Royal Pass found. Activate one using `pass activate`.');
    }

    const reward = Rewards[level];
    if (!reward) {
      return message.reply('⚠️ Invalid reward level.');
    }

    if (reward.isPremium && !royalPass.isPremium) {
      return message.reply('⚠️ This reward is exclusive to Premium Royal Pass holders.');
    }

    if (level > royalPass.level) {
      return message.reply('⚠️ Your Royal Pass level is too low to claim this reward.');
    }

    const alreadyClaimed = royalPass.rewardsClaimed.find(r =>
      (r.id && r.id === reward.id));

    if (alreadyClaimed) {
      return message.reply('⚠️ You have already claimed this reward.');
    }

    // cash
    if (reward.type === 'cash') {
      await updateUserCash(userId, reward.amount);
    }

    // creamcash
    if (reward.type === 'creamcash') {
      const playerShop = await IceCreamShop.findOne({
        userId
      });

      if (!playerShop) {
        return message.reply("❌ Shop name not found! Please create your ice cream shop first. For guidance, use `icecream|ice help`! 🍧");
      }

      playerShop.money += reward.amount;

      await playerShop.save();
    }

    // pet
    if (reward.type === 'pet') {
      let userPetData = await UserPet.findOne({
        id: userId
      });

      if (!userPetData) {
        userPetData = await new UserPet( {
          id: userId,
        })
      }

      if (userPetData.pets.some(pet => pet.petId === reward.details[0].petId)) {
        return message.reply(`⚠️ You are already own this adorable pet!`)
      }

      userPetData.pets.push(reward.details[0]);

      await userPetData.save();
    }

    // petfood
    if (reward.type === 'petfood') {
      let userPetData = await UserPet.findOne({
        id: userId
      });

      if (!userPetData) {
        userPetData = await new UserPet( {
          id: userId,
        })
      }

      userPetData.food += parseInt(reward.amount);

      await userPetData.save();
    }

    // ship
    if (reward.type === 'ship') {
      let userShips = await Ship.getUserShipsData(userId);
      if (userShips.ships && userShips.ships.some(shipDetails => shipDetails.id && shipDetails.id === reward.details[0].id)) {
        return message.reply("⚠️ You already own this ship, Captain!")
      }
      userShips.ships.push(reward.details[0]);
      await Ship.modifyUserShips(userId, userShips);
    }

    // car
    if (reward.type === 'car') {
      const userData = await getUserData(userId);
      if (!userData.cars.some(car => car.id === reward.details[0].id)) {
        reward.details[0].purchasedDate = new Date().toISOString(),
        userData.cars.push(reward.details[0]);
      } else {
        userData.cars = userData.cars.map(car => {
          if (car.id === reward.details[0].id) {
            car.items += 1;
          }
          return car;
        });
      }

      await updateUser(userId,
        userData);
    }

    // structure
    if (reward.type === 'structure') {
      const userData = await getUserData(userId);
      if (!userData.structures.some(structure => structure.id === reward.details[0].id)) {
        reward.details[0].purchasedDate = new Date().toISOString(),
        userData.structures.push(reward.details[0]);
      } else {
        userData.structures = userData.structures.map(structure => {
          if (structure.id === reward.details[0].id) {
            structure.items += 1;
          }
          return structure;
        });
      }

      await updateUser(userId,
        userData);
    }

    royalPass.rewardsClaimed.push(reward);
    await RoyalPass.findOneAndUpdate(
      {
        userId,
        month: new Date().getMonth()
      },
      {
        rewardsClaimed: royalPass.rewardsClaimed
      },
      {
        new: true
      }
    );

    await redisClient.set(`user:${userId}:royalpass`,
      JSON.stringify(royalPass),
      {
        EX: REDIS_EXPIRY
      });

    return message.reply(`✅ You have successfully claimed the reward: **${reward.emoji} ${reward.amount} ${(reward.name || "")}**.`);

  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in claimReward for user ${userId}: ${error.message}`);
    return message.reply(`❌ An error occurred while claiming your reward.`);
  }
}

// Main execute function
export async function execute(args, message, client) {
  const {
    channel,
    author
  } = message;
  const userId = author.id;
  const username = author.username;

  if (args[1] === 'progress') {
    return channel.send(`This action is handled by incrementTaskExp in the code.`);
  } else if (args[1] === 'status') {
    try {
      await showRoyalPass(userId, username, channel, author);
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Error showing Royal Pass for user ${userId}: ${error.message}`);
      return channel.send(`❌ An error occurred while retrieving your Royal Pass.`);
    }
  } else if (args[1] === 'task') {
    try {
      await sendTaskListEmbed(author, message);
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Error sending task list for user ${userId}: ${error.message}`);
      return channel.send(`❌ An error occurred while showing the tasks list.`);
    }
  } else if (args[1] === 'activate') {
    try {
      return channel.send(`❌  This month's pass is not available`);

      const userCash = await getUserCash(userId);
      if (userCash < FIRST_PASS_COST) {
        return channel.send(`You need at least <:kasiko_coin:1300141236841086977> ${FIRST_PASS_COST.toLocaleString()} cash to activate your Royal Pass.`);
      }

      const currentMonth = new Date().getMonth();

      const royalPass = await initRoyalPass(userId, currentMonth);

      if (royalPass instanceof Error) {
        return channel.send(`❌ **${username}**, you have insufficient cash to purchase your Royal Pass.`);
      }

      const embed = new EmbedBuilder()
      .setDescription(`
        **🎉 Congratulations!** Your <:royalpass1224:1317027306253844520> **Royal Pass** has been successfully activated. We have graciously charged you <:kasiko_coin:1300141236841086977> ${FIRST_PASS_COST.toLocaleString()} cash for this privilege.\n-# Enjoy your enhanced experience!
        `);

      return message.reply({
        embeds: [embed]
      })
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Error activating Royal Pass for user ${userId}: ${error.message}`);
      return channel.send(`❌ An error occurred while activating your Royal Pass.`);
    }
  } else if (args[1] === 'premium') {
    try {
      const userCash = await getUserCash(userId);
      if (userCash < PREMIUM_COST) {
        return channel.send(`You need at least <:kasiko_coin:1300141236841086977> ${PREMIUM_COST.toLocaleString()} cash to upgrade to a Premium Royal Pass.`);
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

      await deductUserCash(userId, PREMIUM_COST);
      const updatedRoyalPass = await RoyalPass.findOneAndUpdate(
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

      const userData = await getUserData(userId);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      userData.pass.type = "premium";
      userData.pass.month = currentMonth;
      userData.pass.year = currentYear;
      await updateUser(userId, userData);

      await redisClient.set(`user:${userId}:royalpass`, JSON.stringify(updatedRoyalPass), {
        EX: REDIS_EXPIRY
      });
      return channel.send(`✅ Your Royal Pass has been upgraded to Premium! Enjoy your exclusive rewards.`);
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Error upgrading to Premium Royal Pass for user ${userId}: ${error.message}`);
      return channel.send(`❌ An error occurred while upgrading your Royal Pass.`);
    }
  } else if (args[1] === 'special') {

    const shipData = {
      type: "ship",
      name: "Drago",
      amount: 1,
      details: [{
        level: 1,
        id: "ship8",
        name: "Drago",
        durability: 400,
        dmg: 115,
        health: 520,
      }],
      emoji: "<:ship8:1316615694996996096>"
    };

    const shipEmbed = new EmbedBuilder()
    .setColor("#9cb5e9")
    .setDescription(`# ${shipData.emoji} ${shipData.name}\nA mighty ship with impressive durability and capabilities.`)
    .addFields(
      {
        name: '🛠️ Type', value: shipData.type.charAt(0).toUpperCase() + shipData.type.slice(1), inline: true
      },
      {
        name: '🔢 Quantity', value: `${shipData.amount}`, inline: true
      },
      {
        name: '⚙️ Level', value: `${shipData.details[0].level}`, inline: true
      },
      {
        name: '🛡️ Durability', value: `${shipData.details[0].durability}`, inline: true
      },
      {
        name: '🗡️ Damage', value: `${shipData.details[0].dmg}`, inline: true
      },
      {
        name: '❤️ Health', value: `${shipData.details[0].health}`, inline: true
      }
    )
    .setFooter({
      text: 'Navigate the seas with confidence aboard Drago!'
    });

    message.channel.send({
      embeds: [shipEmbed]
    });

  } else if (args[1] === 'exclusive') {
    const premiumEmbed = new EmbedBuilder()
    .setColor("#6989ff")
    .setTitle('💠 Premium Pass Benefits')
    .setDescription('-# Unlock exclusive perks and rewards with our premium membership!')
    .addFields(
      {
        name: '🏦 Bank Perk', value: '20% discount on bank transactions', inline: true
      },
      {
        name: '🎁 Daily Rewards', value: '25% extra daily rewards', inline: true
      },
      {
        name: '🐟 Aquarium Collection', value: '10% extra collection bonus', inline: true
      },
      {
        name: '💰 Creamcash', value: '25% extra on daily Creamcash rewards', inline: true
      },
      {
        name: '🎨 Special Perk', value: 'Exclusive profile color', inline: true
      },
      {
        name: '🏅 Premium Badge', value: 'Show off your exclusive **Premis** badge', inline: true
      }
    )

    // Basics Embed
    const basicsEmbed = new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle('✨ Basics Pass Benefits')
    .setDescription('-# Enjoy enhanced rewards and a royal badge with our basics membership!')
    .addFields(
      {
        name: '🎁 Daily Rewards', value: '20% extra daily rewards', inline: true
      },
      {
        name: '🐟 Aquarium Collection', value: '5% extra collection bonus', inline: true
      },
      {
        name: '🏅 Royal Badge', value: 'Show off your **Royal** badge', inline: true
      }
    )

    // Send embeds
    message.channel.send({
      embeds: [premiumEmbed, basicsEmbed]
    });

  } else if (args[1] === 'claim') {
    const level = args[2];
    if (!level) {
      return channel.send('Please specify the level of the reward you want to claim. Usage: `pass claim <level>`');
    }
    try {
      await claimReward(userId, level, message);
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Error claiming reward for user ${userId}: ${error.message}`);
      return channel.send(`❌ An error occurred while claiming your reward.`);
    }
  } else {
    const firstEmbed = new EmbedBuilder()
    .setDescription('### Royal Pass 🎖\n```Season 1```\n-# Feel Different')
    .setThumbnail('https://harshtiwari47.github.io/kasiko-public/images/royalpass_gold.png')
    .setColor('#FFD700')

    const secondEmbed = new EmbedBuilder()
    .setDescription(
      `-# \`Use the following commands:\`\n` +
      `- **\`pass status\`**: View your Royal Pass status.\n` +
      `- **\`pass task\`**: See your tasks.\n` +
      `- **\`pass activate\`**: Activate your Royal Pass (<:kasiko_coin:1300141236841086977> ${FIRST_PASS_COST.toLocaleString()} cash).\n` +
      `- **\`pass premium\`**: Upgrade to Premium Pass (<:kasiko_coin:1300141236841086977> ${PREMIUM_COST.toLocaleString()} cash).\n` +
      `- **\`pass claim <level>\`**: Claim a reward.\n` +
      `- **\`pass exclusive\`**: Access exclusive pass-only perks.\n` +
      `- **\`pass special\`**: Special **Premium Reward**.`
    )
    .setColor('#FFD700')
    .setImage("https://harshtiwari47.github.io/kasiko-public/images/kas_royalpass_s1.jpg")

    return channel.send({
      embeds: [firstEmbed, secondEmbed]
    });
  }
}

export default {
  name: 'pass',
  description: 'Monthly Royal Pass system',
  aliases: ['royalpass'],
  args: '<progress|status|task|activate|premium|claim>',
  cooldown: 5000,
  category: '🍬 Explore',
  execute,
};