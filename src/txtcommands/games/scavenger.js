import {
  getUserData,
  updateUser
} from "../../../database.js";
import {
  Helper
} from "../../../helper.js";

export async function scavengerHunt(id, location, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (!userData) {
      return channel.send(`⚠️ **${guild.user.username}**, you need to register first to start a scavenger hunt!`);
    }

    const locations = {
      forest: {
        min: 100,
        max: 10000,
        trap: "poison ivy"
      },
      cave: {
        min: 300,
        max: 8000,
        trap: "bats"
      },
      beach: {
        min: 1000,
        max: 9000,
        trap: "quicksand"
      },
      ruins: {
        min: 500,
        max: 15000,
        trap: "falling rocks"
      },
      desert: {
        min: 700,
        max: 14000,
        trap: "sandstorm"
      }
    };

    if (!locations[location]) {
      return channel.send(`⚠️ Invalid location! Choose one of these: ${Object.keys(locations).join(", ")}.`);
    }

    const suspenseMessage = await channel.send(
      `🗺️ **${guild.user.username}** sets off to explore the **${location}**... What mysteries lie ahead?`
    );

    // Simulate suspenseful events
    await new Promise(resolve => setTimeout(resolve, 2000));
    await suspenseMessage.edit(`🔦 You hear strange noises in the **${location}**... Something is nearby...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await suspenseMessage.edit(`🔍 **${guild.user.username}**, you're getting closer to something...`);

    // Randomize outcome
    const isTreasure = Math.random() < 0.6; // 60% chance for treasure
    let reward = 0;
    let message = "";

    if (isTreasure) {
      // Calculate random reward
      const min = locations[location].min;
      const max = locations[location].max;
      reward = Math.floor(Math.random() * (max - min + 1)) + min;

      // Small chance for rare treasure
      if (Math.random() < 0.1) {
        const rareBonus = Math.floor(reward * 2);
        reward += rareBonus;
        message = `💎 WOW! You found a rare treasure worth an extra <:kasiko_coin:1300141236841086977> **${rareBonus.toLocaleString()}**!`;
      }

      // Add reward to user data
      userData.cash += reward;
      message = `${message}\n🎉 Congratulations, **${guild.user.username}**! You found <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** in the **${location}**!`;
    } else {
      // Trap message
      const trap = locations[location].trap;
      message = `🚨 Oh no, **${guild.user.username}**! You stumbled upon ${trap} in the **${location}**. You barely escaped with your life! No rewards this time.`;
    }

    // Save updated user data
    await updateUser(id, userData);

    // Suspense before final message
    await new Promise(resolve => setTimeout(resolve, 2000));
    await suspenseMessage.edit(message);

    // Add chance for Double or Nothing
    if (isTreasure && Math.random() < 0.3) {
      const gambleMessage = await channel.send(
        `💰 **${guild.user.username}**, you've found a mysterious treasure chest! Would you like to risk your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** for a chance to double it? Type \`yes\` to gamble or \`no\` to keep your reward!`
      );

      // Await user response
      const filter = response => response.author.id === id && ["yes",
        "no"].includes(response.content.toLowerCase());
      const collected = await channel.awaitMessages({
        filter, max: 1, time: 15000, errors: ["time"]
      }).catch(() => null);

      if (collected && collected.first().content.toLowerCase() === "yes") {
        const doubleOrNothing = Math.random() < 0.5;
        if (doubleOrNothing) {
          const doubledReward = reward * 2;
          userData.cash += reward; // Add extra reward
          await updateUser(id, userData);
          await gambleMessage.edit(`🎉 Luck is on your side! You doubled your reward to <:kasiko_coin:1300141236841086977> **${doubledReward.toLocaleString()}**!`);
        } else {
          userData.cash -= reward; // Remove initial reward
          await updateUser(id, userData);
          await gambleMessage.edit(`😢 Oh no! The chest was a trap. You lost your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}**. Better luck next time!`);
        }
      } else {
        await gambleMessage.edit(`👍 **${guild.user.username}**, you played it safe and kept your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}**.`);
      }
    }
  } catch (e) {
    console.log(e);
    return channel.send("Oops! Something went wrong during your scavenger hunt. Please try again!");
  }
}

export default {
  name: "scavenger",
  description: "Go on a scavenger hunt to find treasures, rare items, or face traps!",
  aliases: ["treasure", "sc"],
  args: "<location>",
  example: ["scavenger forest",
    "hunt cave",
    "treasure beach"],
  related: ["tosscoin",
    "mine",
    "tosscoin"],
  cooldown: 15000,
  // 15 seconds cooldown
  category: "🎲 Games",

  execute: (args, message) => {
    if (!args[1]) {
      return message.channel.send(
        "⚠️ You need to specify a location! Example: `scavenger <location>`. Available locations: forest, cave, beach, ruins, desert."
      );
    }

    const location = args[1].toLowerCase();
    return scavengerHunt(message.author.id, location, message.channel);
  }
};