import {
  getUserData,
  updateUser
} from "../../../database.js";
import {
  Helper,
  handleMessage,
  discordUser
} from "../../../helper.js";

import redisClient from "../../../redis.js";

import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from 'discord.js';

function updateHealthEmbed(health, difficulty) {
  return new EmbedBuilder()
    .setDescription(`## <:dungeon:1317142898902437940> 𝕯𝖚𝖓𝖌𝖊𝖔𝖓 𝕾𝖙𝖆𝖙𝖚𝖘 \n❤️ **HP**: ${health} 🕯️ **DIFFICULTY**: ${difficulty}`)
    .setColor(health > 50 ? "#85e6c0" : health > 20 ? "#ffc107" : "#f44336");
}

export async function mysteryDungeon(id, difficulty, context) {
  const { name, username } = discordUser(context);
  const userId = id || discordUser(context).id;

  try {
    let userData;
    try {
      userData = await getUserData(userId);
    } catch (err) {
      return await handleMessage(context, "An error occurred while retrieving your data.");
    }

    if (!userData) {
      return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, you need to register first to enter the dungeon!`);
    }

    const dungeons = {
      easy: { reward: [200, 3000], monsterChance: 0.4, trapChance: 0.4, puzzleChance: 0.2, hpLoss: 25 },
      medium: { reward: [1000, 5000], monsterChance: 0.6, trapChance: 0.5, puzzleChance: 0.3, hpLoss: 30 },
      hard: { reward: [200, 8000], monsterChance: 0.8, trapChance: 0.5, puzzleChance: 0.4, hpLoss: 35 },
      legendary: { reward: [5000, 20000], monsterChance: 0.8, trapChance: 0.6, puzzleChance: 0.5, hpLoss: 40 }
    };

    if (!dungeons[difficulty]) {
      return await handleMessage(context,
        "-# ❔ **Example:**\n" +
        "- **dungeon `<difficulty>`**\n\n" +
        "🕯️ **AVAILABLE DIFFICULTIES:**\n" +
        "◎ *easy, medium, hard, legendary.*"
      );
    }

    const { reward, monsterChance, trapChance, puzzleChance, hpLoss } = dungeons[difficulty];

    try {
      await redisClient.set(`user:${userId}:dungeonBattle`, JSON.stringify(true), { EX: 120 });
    } catch (err) {
      console.error("Error setting redis dungeonBattle flag:", err);
    }

    if (typeof userData.hp !== "number") userData.hp = 100;
    if (userData.hp <= 0) {
      return await handleMessage(context, `⚠️ **${name}**, you need to heal before entering the dungeon! Use ` + "heal" + ` to recover your health.`);
    }

    let suspenseMessage = await handleMessage(context, {
      content: `<:dungeon:1317142898902437940> **${name}** ventures into the **${difficulty.toUpperCase()} Dungeon** with **${userData.hp} HP**...`,
      embeds: [updateHealthEmbed(userData.hp, difficulty)]
    });

    let roomCount = 0;
    while (userData.hp > 0 && roomCount < 5) {
      roomCount++;
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (suspenseMessage?.edit) {
        await suspenseMessage.edit({
          content: `🚪 Room ${roomCount}: What lies ahead...`
        }).catch(() => {});
      }

      const encounterRoll = Math.random();
      let outcomeMessage = "";

      if (encounterRoll < trapChance) {
        userData.hp = Math.max(0, userData.hp - hpLoss);
        outcomeMessage = `<:alert:1366050815089053808> A hidden trap triggered! You lost **${hpLoss} HP**.`;
      } else if (encounterRoll < trapChance + monsterChance) {
        const monsterWon = Math.random() < 0.5;
        if (monsterWon) {
          const loot = Math.floor(Math.random() * (reward[1] - reward[0] + 1)) + reward[0];
          const freshUser = await getUserData(userId);
          await updateUser(userId, { cash: Number(freshUser?.cash || 0) + loot });
          outcomeMessage = `⚔️ You defeated a dungeon beast and claimed <:kasiko_coin:1300141236841086977> **${loot.toLocaleString()}** cash!`;
        } else {
          userData.hp = Math.max(0, userData.hp - hpLoss);
          outcomeMessage = `💀 The dungeon beast struck you for **${hpLoss} HP** before fleeing!`;
        }
      } else {
        const loot = Math.floor(Math.random() * (reward[1] - reward[0] + 1)) + reward[0];
        const freshUser = await getUserData(userId);
        await updateUser(userId, { cash: Number(freshUser?.cash || 0) + loot });
        outcomeMessage = `✨ You discovered a secret chest containing <:kasiko_coin:1300141236841086977> **${loot.toLocaleString()}** cash!`;
      }

      if (suspenseMessage?.edit) {
        await suspenseMessage.edit({
          content: `🚪 **Room ${roomCount} Result:**\n${outcomeMessage}`,
          embeds: [updateHealthEmbed(userData.hp, difficulty)]
        }).catch(() => {});
      }

      if (userData.hp <= 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (suspenseMessage?.edit) {
          await suspenseMessage.edit({
            content: `☠️ **${name}** fell in battle in Room ${roomCount} of the ${difficulty} dungeon! Heal up before returning.`,
            embeds: [updateHealthEmbed(0, difficulty)]
          }).catch(() => {});
        }
        break;
      }
    }

    try {
      await redisClient.del(`user:${userId}:dungeonBattle`);
    } catch (e) {}

    if (userData.hp > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await handleMessage(context, `🏆 **${name}**, your dungeon adventure is complete! You survived with **${userData.hp} HP**.`);
    }

  } catch (e) {
    console.error("Unexpected error during dungeon adventure:", e);
    try {
      await redisClient.del(`user:${userId}:dungeonBattle`);
    } catch (err) {}
    return await handleMessage(context, "Oops! Something went wrong during your dungeon adventure. Please try again!");
  }
}

export default {
  name: "dungeon",
  description: "Embark on a thrilling dungeon adventure for treasures, traps, and battles!",
  aliases: ["adventure", "quest"],
  args: "<difficulty>",
  example: ["dungeon easy", "adventure hard", "quest legendary"],
  related: ["scavenger", "explore", "mine"],
  emoji: "<:dungeon:1317142898902437940>",
  cooldown: 20000,
  category: "🎲 Games",

  execute: async (args, message) => {
    const { id: authorId, name } = discordUser(message);

    if (!args[1]) {
      return await handleMessage(message,
        "-# ❔ **Example:**\n" +
        "- **dungeon `<difficulty>`**\n\n" +
        "🕯️ **AVAILABLE DIFFICULTIES:**\n" +
        "◎ *easy, medium, hard, legendary.*"
      );
    }

    const cachedBattle = await redisClient.get(`user:${authorId}:dungeonBattle`).catch(() => null);

    if (cachedBattle) {
      return await handleMessage(message, `⚠️ **${name}**, please wait until your current dungeon ends or try again after 2 minutes!`);
    }

    const difficulty = args[1].toLowerCase();
    return await mysteryDungeon(authorId, difficulty, message);
  }
};
