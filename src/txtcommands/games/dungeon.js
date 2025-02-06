import {
  getUserData,
  updateUser
} from "../../../database.js";
import {
  Helper
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
  .setColor(health > 50 ? "#85e6c0": health > 20 ? "#ffc107": "#f44336");
}


export async function mysteryDungeon(id, difficulty, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (!userData) {
      return channel.send(`⚠️ **${guild.user.username}**, you need to register first to enter the dungeon!`);
    }

    const dungeons = {
      easy: {
        reward: [200,
          3000],
        monsterChance: 0.4,
        trapChance: 0.4,
        puzzleChance: 0.2,
        hpLoss: 25
      },
      medium: {
        reward: [1000,
          5000],
        monsterChance: 0.6,
        trapChance: 0.5,
        puzzleChance: 0.3,
        hpLoss: 30
      },
      hard: {
        reward: [2000,
          8000],
        monsterChance: 0.8,
        trapChance: 0.5,
        puzzleChance: 0.4,
        hpLoss: 35
      },
      legendary: {
        reward: [5000,
          20000],
        monsterChance: 0.8,
        trapChance: 0.6,
        puzzleChance: 0.5,
        hpLoss: 40
      },
    };

    if (!dungeons[difficulty]) {
      return channel.send(`⚠️ Invalid difficulty! Choose one: ${Object.keys(dungeons).join(", ")}.`);
    }

    const {
      reward,
      monsterChance,
      trapChance,
      puzzleChance,
      hpLoss
    } = dungeons[difficulty];

    await redisClient.set(`user:${id}:dungeonBattle`,
      JSON.stringify(true),
      {
        EX: 120,
        // Cache for 2 min
      });

    if (!userData.hp) userData.hp = 100; // Default health
    if (userData.hp <= 0) {
      return channel.send(
        `💔 **${guild.user.username}**, you need to heal before entering the dungeon! Type \`heal\` to recover your health.`
      );
    }

    const suspenseMessage = await channel.send({
      content: `<:dungeon:1317142898902437940> **${guild.user.username}** ventures into the **${difficulty.toUpperCase()} Dungeon** with **${userData.hp} HP**...`,
      embeds: [updateHealthEmbed(userData.hp, difficulty)],
    });

    let roomCount = 0;
    while (userData.hp > 0 && roomCount < 5) {
      roomCount++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      await suspenseMessage.edit(`🚪 Room ${roomCount}: What lies ahead...`);

      const encounterRoll = Math.random();
      let outcomeMessage = "";

      if (encounterRoll < trapChance) {
        // Trap Encounter
        const traps = ["🪤 flaming arrows",
          "🪤 poisoned spikes",
          "🪤 falling boulders"];
        const trap = traps[Math.floor(Math.random() * traps.length)];
        userData.hp -= hpLoss;

        if (userData.hp <= 0) {
          userData.hp = 0;
          outcomeMessage = `💔 **${guild.user.username}** was caught in **${trap}**, losing **${hpLoss} HP** and falling unconscious. Heal before returning!`;
        } else {
          outcomeMessage = `🚨 **${guild.user.username}** triggered a **${trap}**, losing **${hpLoss} HP**. Remaining HP: **${userData.hp}**.`;
        }
      } else if (encounterRoll < monsterChance + trapChance) {
        // Monster Encounter
        const monsters = ["👹 Orc Warrior",
          "🧟 Cursed Sorcerer",
          "🎃 Shadow Beast",
          "🧛🏻 Vampire",
          "🧜🏻 Mermaid",
          "🐗 Boary",
          "🦈 Sharko",
          "🐉 Dragik",
          "😈 Dark Devil",
          "💀 Dread Nexus",
          "👁️ Abyss Warden",
          "🐍 Serpent King"];
        const monster = monsters[Math.floor(Math.random() * monsters.length)];

        const monsterEmbed = new EmbedBuilder()
        .setDescription(`⚔️ A fearsome **${monster}** appears! What do you do?`)
        .setColor("#830909");

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("fight").setLabel("Fight").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("flee").setLabel("Flee").setStyle(ButtonStyle.Danger)
        );

        const monsterMessage = await channel.send({
          embeds: [monsterEmbed], components: [buttons]
        });

        const filter = i => i.user.id === id && ["fight",
          "flee"].includes(i.customId);
        const interaction = await monsterMessage.awaitMessageComponent({
          filter, time: 15000
        }).catch(() => null);

        if (interaction) {
          if (interaction.customId === "fight") {
            const winChance = Math.random() < 0.5; // 50% chance to win
            if (winChance) {
              const rewardAmount = Math.floor(Math.random() * (reward[1] - reward[0] + 1)) + reward[0];
              userData.cash += rewardAmount;
              outcomeMessage = `🎉 ⚔️ You defeated the **${monster}** and earned <:kasiko_coin:1300141236841086977> **${rewardAmount.toLocaleString()}**!`;
            } else {
              userData.hp -= hpLoss;
              if (userData.hp <= 0) {
                userData.hp = 0;
                outcomeMessage = `💔 The **${monster}** overpowered you! You lost **${hpLoss} HP** and are now unconscious.`;
              } else {
                outcomeMessage = `😢 The **${monster}** was too strong. You lost **${hpLoss} HP** and fled. Remaining HP: **${userData.hp}**.`;
              }
            }
          } else {
            outcomeMessage = `🏃 **${guild.user.username}** fled from the **${monster}**. No rewards this time.`;
          }
          await interaction.update({
            embeds: [monsterEmbed.setDescription(outcomeMessage)], components: []
          });
        } else {
          await monsterMessage.edit({
            embeds: [monsterEmbed.setDescription("❌ No decision was made in time.")], components: []
          });
          break;
        }
      } else {
        outcomeMessage = `💰 You found a treasure chest containing <:kasiko_coin:1300141236841086977> **${Math.floor(Math.random() * (reward[1] - reward[0] + 1) + reward[0]).toLocaleString()}**!`;
      }

      await suspenseMessage.edit({
        content: outcomeMessage, embeds: [updateHealthEmbed(userData.hp, difficulty)]});
    }

    await updateUser(id, userData);
    channel.send(`⌛ **${guild.user.username}**, your dungeon adventure is complete! 🗡️`);
  } catch (e) {
    console.error(e);
    try {
      let userData = await getUserData(id);
      await updateUser(id, userData);
    } catch (err) {}
    return channel.send("Oops! Something went wrong during your dungeon adventure. Please try again!");
  }
}

export default {
  name: "dungeon",
  description: "Embark on a thrilling dungeon adventure for treasures, traps, and battles!",
  aliases: ["adventure",
    "quest"],
  args: "<difficulty>",
  example: ["dungeon easy",
    "adventure hard",
    "quest legendary"],
  related: ["scavenger",
    "explore",
    "mine"],
  cooldown: 20000,
  // 20 seconds cooldown
  category: "🎲 Games",

  execute: async (args, message) => {
    if (!args[1]) {
      return message.channel.send(
        "♦️ 𝘠𝘰𝘶 𝘯𝘦𝘦𝘥 𝘵𝘰 𝘴𝘱𝘦𝘤𝘪𝘧𝘺 𝘢 𝘥𝘪𝘧𝘧𝘪𝘤𝘶𝘭𝘵𝘺!" +
        "\n**❔Example: **`dungeon <difficulty>`" +
        "\n\n💀 **Available difficulties: **" +
        "\n𖤓 easy 𖤓 medium" +
        "\n𖤓 hard 𖤓 legendary."
      );
    }

    const cachedBattle = await redisClient.get(`user:${message.author.id}:dungeonBattle`);

    if (cachedBattle) {
      return message.channel.send(`🕯️ **${message.author.username}**, please wait until the current dungeon ends or try again after 2 minutes!`);
    }

    const difficulty = args[1].toLowerCase();
    return mysteryDungeon(message.author.id, difficulty, message.channel);
  }
};