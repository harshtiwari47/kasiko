import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ComponentType,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ITEM_DEFINITIONS
} from '../../inventory.js';

const tasks = {
  "vote": {
    "name": "Vote",
    "description": "Vote for the bot and get extra rewards.",
    "icon": "🗳️",
    "target": 1,
    "completed": false
  },
  "daily": {
    "name": "Daily Rewards",
    "description": "Claim your daily rewards.",
    "icon": "<:gift:1350355327018729517>",
    "target": 1,
    "completed": false
  },
  "hunt": {
    "name": "Hunt Animals",
    "description": "Hunt 5 animals in a day.",
    "icon": "<:forest_tree:1354366758596776070>",
    "target": 5,
    "completed": false
  },
  "rose": {
    "name": "Send Roses",
    "description": "Send 3 roses to someone you're closest to.",
    "icon": "<:rose:1343097565738172488>",
    "target": 3,
    "completed": false
  },
  "cookie": {
    "name": "Share Cookies",
    "description": "Share at least one cookie with someone.",
    "icon": "<:cookie:1385131636613709905>",
    "target": 1,
    "completed": false
  },
  "serve": {
    "name": "Serve Ice Cream",
    "description": "Serve 3 ice creams to your customers.",
    "icon": "<:raspberry:1308428101843292160>",
    "target": 3,
    "completed": false
  },
  "work": {
    "name": "Do Work",
    "description": "Complete 5 work tasks in a day.",
    "icon": "💼",
    "target": 5,
    "completed": false
  },
  "fish": {
    "name": "Fishing",
    "description": "Catch 3 fish while fishing.",
    "icon": "<:fishing_rod_virtual:1359384731329888368>",
    "target": 3,
    "completed": false
  },
  "kill": {
    "name": "Kill Zombies",
    "description": "Kill 3 zombies in a zombie hunt.",
    "icon": "<:zombie:1366632304054632528>",
    "target": 3,
    "completed": false
  }
}

function getRandomTasks() {
  const newTasks = [{
    "id": "vote",
    "completed": false,
    "current": 0,
    "target": (tasks["vote"]?.target || 1)
  }];

  const keys = Object.keys(tasks);
  const taskKeys = keys.slice(1, keys.length - 2);
  const startIndex = Math.floor(Math.random() * taskKeys.length);

  for (let i = 0; i < 4; i++) {
    let index = (startIndex + i) % taskKeys.length;
    newTasks.push({
      "id": taskKeys[index],
      "completed": false,
      "current": 0,
      "target": (tasks[taskKeys[index]]?.target || 1)
    })
  }
  return newTasks;
}

export default {
  name: "task",
  description: "Get 30k cash and one milk item for completing the daily task.",
  cooldown: 10000,
  aliases: ["cl",
    "dailytask",
    "check",
    "todo"],
  example: ["task"],
  category: '🏦 Economy',
  async execute(args, context) {
    try {
      const {
        name,
        id
      } = discordUser(context);

      const userData = await getUserData(id);

      if (!userData) return;

      const todayDate = Date.now();
      const todayDateStr = new Date(todayDate).toLocaleDateString();

      const taskDate = userData?.tasks?.date || null;
      const taskDateStr = taskDate ? new Date(taskDate).toLocaleDateString(): null;

      if (!taskDate || todayDateStr !== taskDateStr) {
        userData.tasks = {
          date: todayDate,
          list: getRandomTasks(),
          completed: false
        }
      }

      const Container = new ContainerBuilder()
      .addSectionComponents(
        section => section
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`### ${name}'s Daily Checklist`)
        )
        .setThumbnailAccessory(
          thumbnail => thumbnail
          .setDescription('Tasks')
          .setURL("https://cdn.discordapp.com/emojis/1388844819035590706.png")
        )
      )
      .addSeparatorComponents(separate => separate)

      userData.tasks.list.forEach((task, i) => {
        Container.addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`${tasks[task.id]?.completed ? "<:checkbox_checked:1388858843324350474>": "<:checkbox_empty:1388858759228686496>"} — ${tasks[task.id]?.icon}  **${tasks[task.id]?.name}**\n-# ${tasks[task.id]?.description}`)
        )
      });

      return await handleMessage(context, {
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      })

    } catch (err) {
      return await handleMessage(context, {
        content: `**Error**: ${err.message}`
      })
    }
  }
}