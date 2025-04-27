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
  // Ensure that channel is provided and valid.
  if (!channel || typeof channel.send !== "function") {
    console.error("Channel is not provided or invalid.");
    return;
  }

  try {
    // Attempt to fetch the guild member.
    let guildMember;
    try {
      guildMember = await channel.guild.members.fetch(id);
    } catch (err) {
      return channel.send("An error occurred while fetching your guild data.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Retrieve user data.
    let userData;
    try {
      userData = await getUserData(id);
    } catch (err) {
      return channel.send("An error occurred while retrieving your data.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    if (!userData) {
      return channel.send(
        `⚠️ **${guildMember?.user?.username || "User"}**, you need to register first to enter the dungeon!`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Define dungeon settings.
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
      }
    };

    if (!dungeons[difficulty]) {
      return channel.send(
        `⚠️ Invalid difficulty! Choose one: ${Object.keys(dungeons).join(", ")}.`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const {
      reward,
      monsterChance,
      trapChance,
      puzzleChance,
      hpLoss
    } = dungeons[difficulty];

    // Set a flag in Redis (with its own error handling).
    try {
      await redisClient.set(
        `user:${id}:dungeonBattle`,
        JSON.stringify(true),
        {
          EX: 120
        } // Cache for 2 minutes.
      );
    } catch (err) {
      console.error("Error setting redis dungeonBattle flag:", err);
    }

    // Ensure the user has a valid HP value.
    if (typeof userData.hp !== "number") userData.hp = 100;
    if (userData.hp <= 0) {
      return channel.send(
        `💔 **${guildMember?.user?.username || "User"}**, you need to heal before entering the dungeon! Type \`heal\` to recover your health.`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Send the initial suspense message.
    let suspenseMessage;
    try {
      suspenseMessage = await channel.send({
        content: `<:dungeon:1317142898902437940> **${guildMember?.user?.username || "User"}** ventures into the **${difficulty.toUpperCase()} Dungeon** with **${userData.hp} HP**...`,
        embeds: [updateHealthEmbed(userData.hp, difficulty)]
      });
    } catch (err) {
      console.error("Error sending suspense message:", err);
      return;
    }

    // Loop through up to 5 rooms (or until the user runs out of HP).
    let roomCount = 0;
    while (userData.hp > 0 && roomCount < 5) {
      roomCount++;
      // Delay 2 seconds between rooms.
      await new Promise(resolve => setTimeout(resolve, 2000));

      let existingEmbeds = suspenseMessage.embeds; // Get current embeds
      existingEmbeds.shift();

      try {
        await suspenseMessage.edit({
          content: `🚪 Room ${roomCount}: What lies ahead...`
        });
      } catch (err) {}

      const encounterRoll = Math.random();
      let outcomeMessage = "";

      if (encounterRoll < trapChance) {
        // TRAP ENCOUNTER
        const traps = ["🪤 flaming arrows",
          "🪤 poisoned spikes",
          "🪤 falling boulders"];
        const trap = traps[Math.floor(Math.random() * traps.length)];
        userData.hp -= hpLoss;

        if (userData.hp <= 0) {
          userData.hp = 0;
          outcomeMessage = `💔 **${guildMember?.user?.username || "User"}** was caught in **${trap}**, losing **${hpLoss} HP** and falling unconscious. Heal before returning!`;
        } else {
          outcomeMessage = `🚨 **${guildMember?.user?.username || "User"}** triggered a **${trap}**, losing **${hpLoss} HP**. Remaining HP: **${userData.hp}**.`;
        }

        try {
          await suspenseMessage.edit({
            content: outcomeMessage,
            embeds: [updateHealthEmbed(userData.hp, difficulty), ...existingEmbeds],
            components: [] // Remove any components.
          });
        } catch (err) {
          console.error("Error updating suspense message after trap:", err);
        }

      } else if (encounterRoll < monsterChance + trapChance) {
        // MONSTER (VILLAIN) ENCOUNTER:
        // Instead of sending a new message, we update the original suspenseMessage.
        const monsters = [
          "👹 Orc Warrior",
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
          "🐍 Serpent King"
        ];
        const monster = monsters[Math.floor(Math.random() * monsters.length)];

        const monsterEmbed = new EmbedBuilder()
        .setDescription(`⚔️ A fearsome **${monster}** appears! What do you do?`)
        .setColor("#830909");

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("fight").setLabel("Fight").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("flee").setLabel("Flee").setStyle(ButtonStyle.Danger)
        );

        try {
          await suspenseMessage.edit({
            // Keep the previous content or update as needed.
            content: suspenseMessage.content,
            embeds: [updateHealthEmbed(userData.hp, difficulty), ...existingEmbeds, monsterEmbed],
            components: [buttons]
          });
        } catch (err) {
          console.error("Error editing suspense message for monster encounter:", err);
        }

        // Wait for the user to decide.
        let interaction;
        try {
          const filter = i => i.user.id === id && ["fight",
            "flee"].includes(i.customId);
          interaction = await suspenseMessage.awaitMessageComponent({
            filter, time: 15000
          });
        } catch (err) {
          try {
            await suspenseMessage.edit({
              embeds: [updateHealthEmbed(userData.hp, difficulty), ...existingEmbeds, monsterEmbed.setDescription("❌ No decision was made in time.")],
              components: []
            });
          } catch (editErr) {}
          break;
        }

        // Process the player's choice.
        if (interaction.customId === "fight") {
          const winChance = Math.random() < 0.5; // 50% chance to win.
          if (winChance) {
            const rewardAmount = Math.floor(Math.random() * (reward[1] - reward[0] + 1)) + reward[0];
            userData.cash = (userData.cash || 0) + rewardAmount;
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
        } else if (interaction.customId === "flee") {
          outcomeMessage = `🏃 **${guildMember?.user?.username || "User"}** fled from the **${monster}**. No rewards this time.`;
        }

        // Update the message with the outcome.
        try {
          await interaction.update({
            embeds: [updateHealthEmbed(userData.hp, difficulty), ...existingEmbeds, monsterEmbed.setDescription(outcomeMessage)],
            components: []
          });
        } catch (err) {
          console.error("Error updating suspense message after monster interaction:", err);
        }

      } else {
        // TREASURE (or other) ENCOUNTER.
        const treasureAmount = Math.floor(Math.random() * (reward[1] - reward[0] + 1)) + reward[0];
        outcomeMessage = `<:moneybag:1365976001179553792> You found a treasure chest containing <:kasiko_coin:1300141236841086977> **${treasureAmount.toLocaleString()}**!`;
        try {
          await suspenseMessage.edit({
            content: outcomeMessage,
            embeds: [updateHealthEmbed(userData.hp, difficulty), ...existingEmbeds],
            components: []
          });
        } catch (err) {}
      }
    }

    // Save the updated user data.
    try {
      await updateUser(id, userData);
    } catch (err) {
      console.error("Error updating user data:", err);
    }

    try {
      await channel.send(`⌛ **${guildMember?.user?.username || "User"}**, your dungeon adventure is complete! 🗡️`);
    } catch (err) {
      console.error("Error sending completion message:", err);
    }
  } catch (e) {
    console.error("Unexpected error during dungeon adventure:", e);
    try {
      const userData = await getUserData(id);
      await updateUser(id, {
        cash: userData.cash
      });
    } catch (err) {
      console.error("Error in recovery update:", err);
    }
    if (channel && typeof channel.send === "function") {
      return channel.send("Oops! Something went wrong during your dungeon adventure. Please try again!").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
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
  emoji: "👿",
  cooldown: 200000,
  // 120 seconds cooldown
  category: "🎲 Games",

  execute: async (args, message) => {
    if (!args[1]) {
      return message.channel.send(
        "♦️ 𝘠𝘰𝘶 𝘯𝘦𝘦𝘥 𝘵𝘰 𝘴𝘱𝘦𝘤𝘪𝘧𝘺 𝘢 𝘥𝘪𝘧𝘧𝘪𝘤𝘶𝘭𝘵𝘺!" +
        "\n**❔Example: **`dungeon <difficulty>`" +
        "\n\n💀 **Available difficulties: **" +
        "\n𖤓 easy 𖤓 medium" +
        "\n𖤓 hard 𖤓 legendary."
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const cachedBattle = await redisClient.get(`user:${message.author.id}:dungeonBattle`);

    if (cachedBattle) {
      return message.channel.send(`🕯️ **${message.author.username}**, please wait until the current dungeon ends or try again after 2 minutes!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const difficulty = args[1].toLowerCase();
    return mysteryDungeon(message.author.id, difficulty, message.channel);
  }
};