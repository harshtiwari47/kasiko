import Dungeon from "../../../models/Dungeon.js"; // Path to your schema file
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from "discord.js";
import redisClient from "../../../redis.js";

// Helper function: show the player’s dungeon stats.
async function showStats(dungeon, message) {
  try {
    const embed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Dungeon Stats`)
    .addFields(
      {
        name: "Rank", value: dungeon.rank, inline: true
      },
      {
        name: "Level", value: dungeon.stats.level.toString(), inline: true
      },
      {
        name: "Experience", value: `${dungeon.stats.exp}/${dungeon.stats.expToNextLevel}`, inline: true
      },
      {
        name: "Health", value: `${dungeon.stats.health}/${dungeon.stats.maxHealth}`, inline: true
      },
      {
        name: "Bosses Defeated", value: dungeon.bossDefeatedCount.toString(), inline: true
      },
      {
        name: "Difficulty", value: dungeon.difficulty, inline: true
      }
    )
    .setColor("#3498db")
    .setTimestamp();
    return message.channel.send({
      embeds: [embed]
    });
  } catch (err) {
    console.error("Error showing stats:", err);
    return message.channel.send("An error occurred while retrieving your stats.");
  }
}

// Helper function: show the player’s inventory.
async function showInventory(dungeon, message) {
  try {
    if (!dungeon.inventory.length) {
      return message.channel.send("Your inventory is empty.");
    }
    const description = dungeon.inventory
    .map((item) => `**${item.itemName}** x ${item.quantity}`)
    .join("\n");
    const embed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Inventory`)
    .setDescription(description)
    .setColor("#2ecc71")
    .setTimestamp();
    return message.channel.send({
      embeds: [embed]
    });
  } catch (err) {
    console.error("Error showing inventory:", err);
    return message.channel.send("An error occurred while retrieving your inventory.");
  }
}

// Helper function: show the player’s army.
async function showArmy(dungeon, message) {
  try {
    if (!dungeon.army.length) {
      return message.channel.send("You haven't recruited any units yet.");
    }
    const description = dungeon.army
    .map((unit) => `**${unit.unitType}** – ${unit.quantity} (${unit.status})`)
    .join("\n");
    const embed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Army`)
    .setDescription(description)
    .setColor("#e67e22")
    .setTimestamp();
    return message.channel.send({
      embeds: [embed]
    });
  } catch (err) {
    console.error("Error showing army:", err);
    return message.channel.send("An error occurred while retrieving your army details.");
  }
}

// Helper function: the dungeon exploration adventure.
async function exploreDungeon(dungeon, difficultyArg, message) {
  // Use Redis to prevent concurrent adventures.
  const redisKey = `dungeon:${message.author.id}:explore`;
  try {
    const alreadyExploring = await redisClient.get(redisKey);
    if (alreadyExploring) {
      return message.channel.send("You're already exploring a dungeon. Please wait until your current adventure is finished.");
    }
    await redisClient.set(redisKey, "true", {
      EX: 120
    });
  } catch (err) {
    console.error("Redis error:", err);
    // (Not fatal: we continue even if the flag can’t be set.)
  }

  // Define settings for each difficulty.
  const difficultyLevels = {
    easy: {
      reward: [100,
        500],
      monsterChance: 0.3,
      trapChance: 0.3,
      hpLoss: 10,
      expGain: 20
    },
    medium: {
      reward: [500,
        1500],
      monsterChance: 0.4,
      trapChance: 0.4,
      hpLoss: 15,
      expGain: 40
    },
    hard: {
      reward: [1500,
        3000],
      monsterChance: 0.5,
      trapChance: 0.5,
      hpLoss: 20,
      expGain: 60
    },
    legendary: {
      reward: [3000,
        5000],
      monsterChance: 0.6,
      trapChance: 0.5,
      hpLoss: 25,
      expGain: 100
    },
    nightmare: {
      reward: [5000,
        10000],
      monsterChance: 0.7,
      trapChance: 0.6,
      hpLoss: 35,
      expGain: 150
    }
  };

  // Default to “easy” if an invalid or missing difficulty is provided.
  const diffKey =
  difficultyArg && difficultyLevels[difficultyArg.toLowerCase()]
  ? difficultyArg.toLowerCase(): "easy";
  const settings = difficultyLevels[diffKey];
  // Also update the stored difficulty (capitalized) in the record.
  dungeon.difficulty = diffKey.charAt(0).toUpperCase() + diffKey.slice(1);

  // Send an initial embed announcing the adventure.
  let adventureEmbed = new EmbedBuilder()
  .setTitle(`${message.author.username} embarks on a ${dungeon.difficulty} dungeon adventure!`)
  .setDescription(`You enter the dungeon with ${dungeon.stats.health} HP. Brace yourself!`)
  .setColor("#9b59b6")
  .setTimestamp();

  let adventureMessage;
  try {
    adventureMessage = await message.channel.send({
      embeds: [adventureEmbed]
    });
  } catch (err) {
    console.error("Error sending initial adventure message:", err);
    return message.channel.send("An error occurred while starting your adventure.");
  }

  const totalRooms = 3; // You can increase this number for longer adventures.

  // Loop through the rooms.
  for (let room = 1; room <= totalRooms; room++) {
    // Short delay between rooms.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // If health is 0, end early.
    if (dungeon.stats.health <= 0) break;

    // Roll for encounter.
    const roll = Math.random();
    let roomOutcome = "";

    // TRAP encounter:
    if (roll < settings.trapChance) {
      dungeon.stats.health -= settings.hpLoss;
      if (dungeon.stats.health < 0) dungeon.stats.health = 0;
      roomOutcome = `Room ${room}: You triggered a trap and lost **${settings.hpLoss} HP**! Current HP: **${dungeon.stats.health}**.`;
    }
    // MONSTER encounter:
    else if (roll < settings.trapChance + settings.monsterChance) {
      const monsterNames = ["Goblin",
        "Orc",
        "Skeleton",
        "Dark Mage"];
      const monster = monsterNames[Math.floor(Math.random() * monsterNames.length)];
      // Build a monster encounter embed with interactive buttons.
      const monsterEmbed = new EmbedBuilder()
      .setTitle(`Room ${room}: Monster Encounter`)
      .setDescription(`A wild **${monster}** appears! Do you choose to **fight** or **flee**?`)
      .setColor("#e74c3c")
      .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("fight").setLabel("Fight").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("flee").setLabel("Flee").setStyle(ButtonStyle.Danger)
      );

      try {
        await adventureMessage.edit({
          embeds: [monsterEmbed], components: [buttons]
        });
      } catch (err) {
        console.error("Error editing for monster encounter:", err);
      }

      // Wait for the player’s decision.
      let interaction;
      try {
        const filter = (i) => i.user.id === message.author.id;
        interaction = await adventureMessage.awaitMessageComponent({
          filter, time: 15000
        });
      } catch (err) {
        roomOutcome = `Room ${room}: You hesitated and the **${monster}** faded into the darkness. (Half EXP awarded)`;
        dungeon.stats.exp += settings.expGain / 2;
        await adventureMessage.edit({
          components: []
        });
        continue;
      }

      if (interaction.customId === "fight") {
        const win = Math.random() < 0.5; // 50% chance to win
        if (win) {
          const reward = Math.floor(Math.random() * (settings.reward[1] - settings.reward[0] + 1)) + settings.reward[0];
          roomOutcome = `Room ${room}: You defeated the **${monster}**! You earned **${reward}** gold and **${settings.expGain} EXP**.`;
          dungeon.stats.exp += settings.expGain;
        } else {
          dungeon.stats.health -= settings.hpLoss;
          if (dungeon.stats.health < 0) dungeon.stats.health = 0;
          roomOutcome = `Room ${room}: The **${monster}** overpowered you. You lost **${settings.hpLoss} HP**. Current HP: **${dungeon.stats.health}**.`;
        }
      } else if (interaction.customId === "flee") {
        roomOutcome = `Room ${room}: You fled from the **${monster}**. No rewards this time.`;
      }
      try {
        await interaction.update({
          components: []
        });
      } catch (err) {
        console.error("Error acknowledging the interaction:", err);
      }
    }
    // TREASURE encounter:
    else {
      const reward = Math.floor(Math.random() * (settings.reward[1] - settings.reward[0] + 1)) + settings.reward[0];
      roomOutcome = `Room ${room}: You discovered a treasure chest containing **${reward}** gold and gained **${settings.expGain} EXP**!`;
      dungeon.stats.exp += settings.expGain;
    }

    // Update the adventure embed with the outcome of this room.
    adventureEmbed = new EmbedBuilder()
    .setTitle(`Room ${room} Completed`)
    .setDescription(roomOutcome)
    .setFooter({
      text: `HP: ${dungeon.stats.health} | EXP: ${dungeon.stats.exp}`
    })
    .setColor(dungeon.stats.health > 50 ? "#2ecc71": "#e74c3c")
    .setTimestamp();
    try {
      await adventureMessage.edit({
        embeds: [adventureEmbed], components: []
      });
    } catch (err) {
      console.error("Error updating room outcome:", err);
    }
  }

  // Simple level-up check.
  if (dungeon.stats.exp >= dungeon.stats.expToNextLevel) {
    dungeon.stats.level += 1;
    dungeon.stats.exp = 0;
    dungeon.stats.expToNextLevel = Math.floor(dungeon.stats.expToNextLevel * 1.5);
    dungeon.stats.maxHealth += 20;
    dungeon.stats.health = dungeon.stats.maxHealth; // restore full health
    await message.channel.send(`Congratulations, **${message.author.username}**! You've leveled up to **Level ${dungeon.stats.level}**!`);
  }

  // Final summary embed.
  const finalEmbed = new EmbedBuilder()
  .setTitle("Dungeon Adventure Complete!")
  .setDescription(`You finished your dungeon adventure with **${dungeon.stats.health} HP** remaining and **${dungeon.stats.exp} EXP**.`)
  .setColor("#8e44ad")
  .setTimestamp();
  try {
    await message.channel.send({
      embeds: [finalEmbed]
    });
  } catch (err) {
    console.error("Error sending final summary:", err);
  }

  // Save the updated dungeon record.
  try {
    await dungeon.save();
  } catch (err) {
    console.error("Error saving dungeon record:", err);
  }

  // Remove the Redis flag.
  try {
    await redisClient.del(redisKey);
  } catch (err) {
    console.error("Error removing Redis flag:", err);
  }
}

// The exported command module.
export default {
  name: "dungeonx",
  description:
  "Embark on a dungeon adventure and manage your progress. Subcommands: `stats`, `inventory`, `army`, `explore` (with optional difficulty), and `help`.",
  aliases: [],
  args: "<subcommand> [options]",
  usage: "dungeon <explore|stats|inventory|army|help> [difficulty]",
  cooldown: 15000,
  visible: false,
  category: "🎲 Games",
  async execute(args, message) {
    args.shift();
    // Determine the subcommand; if none is provided, show help.
    const subcommand = args[0] ? args[0].toLowerCase(): "help";

    // Fetch (or create) the dungeon record for this user.
    let dungeon;
    try {
      dungeon = await Dungeon.findOne({
        userId: message.author.id
      });
      if (!dungeon) {
        dungeon = new Dungeon( {
          userId: message.author.id
        });
        await dungeon.save();
      }
    } catch (err) {
      console.error("Error fetching/creating dungeon record:", err);
      return message.channel.send("An error occurred while accessing your dungeon record.");
    }

    // Route to the proper subcommand.
    switch (subcommand) {
    case "stats":
      return showStats(dungeon, message);
    case "inventory":
      return showInventory(dungeon, message);
    case "army":
      return showArmy(dungeon, message);
    case "explore":
      return exploreDungeon(dungeon, args[1], message);
    case "help":
    default: {
        const helpEmbed = new EmbedBuilder()
        .setTitle("Dungeon Command Help")
        .setDescription(
          "**Subcommands:**\n" +
          "`stats` – View your dungeon stats\n" +
          "`inventory` – View your inventory\n" +
          "`army` – View your recruited units\n" +
          "`explore [difficulty]` – Embark on a dungeon adventure\n\n" +
          "**Difficulties:** easy, medium, hard, legendary, nightmare"
        )
        .setColor("#3498db")
        .setTimestamp();
        return message.channel.send({
          embeds: [helpEmbed]
        });
      }
    }
  },
};