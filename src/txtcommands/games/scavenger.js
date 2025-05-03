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
      return channel.send(`<:warning:1366050875243757699> **${guild.user.username}**, you need to register first to start a scavenger hunt!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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
      return channel.send(`<:warning:1366050875243757699> Invalid location! Choose one of these: ${Object.keys(locations).join(", ")}.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const suspenseMessage = await channel.send(
      `🗺️ **${guild.user.username}** sets off to explore the **${location}**... What mysteries lie ahead?`
    );

    // Simulate suspenseful events
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (suspenseMessage && suspenseMessage.edit) {
      await suspenseMessage.edit(`🔦 You hear strange noises in the **${location}**... Something is nearby...`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (suspenseMessage && suspenseMessage.edit) {
      await suspenseMessage.edit(`🔍 **${guild.user.username}**, you're getting closer to something...`);
    }

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
        message = `💎 𝗪𝗢𝗪! You found a rare treasure worth an extra <:kasiko_coin:1300141236841086977> **${rareBonus.toLocaleString()}**!`;
      }

      // Add reward to user data
      userData.cash += reward;
      message = `${message}\n<:celebration:1368113208023318558> 𝘾𝙤𝙣𝙜𝙧𝙖𝙩𝙪𝙡𝙖𝙩𝙞𝙤𝙣𝙨, **${guild.user.username}**! 𝘠𝘰𝘶 𝘧𝘰𝘶𝘯𝘥 <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** 𝘪𝘯 𝘵𝘩𝘦 🗺️ **${location}**!`;
    } else {
      // Trap message
      const trap = locations[location].trap;
      message = `<:alert:1366050815089053808> Oh no, **${guild.user.username}**! You stumbled upon ${trap} in the **${location}**.\n𝘠𝘰𝘶 𝘣𝘢𝘳𝘦𝘭𝘺 𝘦𝘴𝘤𝘢𝘱𝘦𝘥 𝘸𝘪𝘵𝘩 𝘺𝘰𝘶𝘳 𝘭𝘪𝘧𝘦! 𝘕𝘰 𝘳𝘦𝘸𝘢𝘳𝘥𝘴 𝘵𝘩𝘪𝘴 𝘵𝘪𝘮𝘦.`;
    }

    // Save updated user data
    await updateUser(id, {
      cash: userData.cash
    });

    // Suspense before final message
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (suspenseMessage && suspenseMessage.edit) {
      await suspenseMessage.edit(message);
    }

    // Add chance for Double or Nothing
    if (isTreasure && Math.random() < 0.3) {
      const gambleMessage = await channel.send(
        `<:moneybag:1365976001179553792> **${guild.user.username}**, you've found a mysterious treasure chest! Would you like to risk your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** for a chance to double it? Type \`yes\` to gamble or \`no\` to keep your reward!`
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
          await updateUser(id, {
            cash: userData.cash
          });
          await gambleMessage.edit(`<:celebration:1368113208023318558> Luck is on your side! You doubled your reward to <:kasiko_coin:1300141236841086977> **${doubledReward.toLocaleString()}**!`);
        } else {
          userData.cash -= reward; // Remove initial reward
          await updateUser(id, {
            cash: userData.cash
          });
          await gambleMessage.edit(`😢 Oh no! The chest was a trap. You lost your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}**. Better luck next time!`);
        }
      } else {
        if (gambleMessage && gambleMessage.edit) {
          await gambleMessage.edit(`👍 **${guild.user.username}**, you played it safe and kept your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}**.`);
        }
      }
    }
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    await channel.send(`ⓘ Oops! Something went wrong during your scavenger hunt. Please try again!\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return;
  }
}

export default {
  name: "scavenger",
  description: "Go on a scavenger hunt to find treasures, rare items, or face traps!",
  aliases: ["treasure",
    "sc"],
  args: "<location>",
  example: ["scavenger forest",
    "hunt cave",
    "treasure beach"],
  related: ["tosscoin",
    "mine",
    "tosscoin"],
  emoji: "🔦",
  cooldown: 10000,
  // 15 seconds cooldown
  category: "🎲 Games",

  execute: (args, message) => {
    if (!args[1]) {
      return message.channel.send(
        "♦️ 𝘠𝘰𝘶 𝘯𝘦𝘦𝘥 𝘵𝘰 𝘴𝘱𝘦𝘤𝘪𝘧𝘺 𝘢 𝘭𝘰𝘤𝘢𝘵𝘪𝘰𝘯!" +
        "\n❔**Example: ** `scavenger <location>`" +
        "\n\n🔍 **Available locations: **" +
        "\nforest, cave, beach, ruins, desert."
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err))
    }

    const location = args[1].toLowerCase();
    return scavengerHunt(message.author.id, location, message.channel);
  }
};