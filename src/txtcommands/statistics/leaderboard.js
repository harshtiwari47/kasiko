import {
  EmbedBuilder
} from "discord.js";
import User from "../../../models/User.js";
import {
  client
} from "../../../bot.js";

import {
  Helper
} from '../../../helper.js';

async function createLeaderboardEmbed(userId) {
  try {

    const users = await getTopUsersByNetWorth();
    if (users.length === 0) {
      return new EmbedBuilder()
      .setColor('#ed971e')
      .setTitle('✩▓▅▁🏆𝐋𝐞𝐚𝐝𝐞𝐫𝐛𝐨𝐚𝐫𝐝▁▅▓✩')
      .setDescription('No users found!')
      .setFooter({
        text: `Your position is: Not ranked`,
        iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
      })
      .setTimestamp();
    }

    // Build the leaderboard string
    let leaderboard = '';
    for (const [index, user] of users.entries()) {
      let userDetails;
      try {
        userDetails = await client.users.fetch(user.id); // Fetch the user from Discord
      } catch (err) {
        userDetails = {
          username: 'Failed to Fetch'
        }; // Fallback if fetching fails
      }
      leaderboard += `**${index + 1}.** **${userDetails.username}** - Networth: <:kasiko_coin:1300141236841086977> **${Number(user.networth.toFixed(1)).toLocaleString()}**\n`;
    }

    // Find the position of the command invoker
    const userPosition = users.findIndex(user => user.id === userId) + 1 || "Unranked";

    // Create and return the embed message
    const embed = new EmbedBuilder()
    .setColor('#ed971e')
    .setTitle('✩▓▅▁🏆𝐋𝐞𝐚𝐝𝐞𝐫𝐛𝐨𝐚𝐫𝐝▁▅▓✩')
    .setDescription(leaderboard)
    .setFooter({
      text: `Your position is: ${userPosition > 0 ? userPosition: 'Not ranked'}`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    return embed;
  } catch (error) {
    console.error('Oops! An error occurred while generating the leaderboard', error);
    return new EmbedBuilder()
    .setColor('#ed971e')
    .setTitle('Error')
    .setDescription('An error occurred while generating the leaderboard.')
    .setTimestamp();
  }
}

// Leaderboard command function
export async function leaderboard(message) {
  try {
    const userId = message.author.id;

    // Create the leaderboard embed
    const leaderboardEmbed = await createLeaderboardEmbed(userId);

    // Send the embed in response to the interaction
    return await message.reply({
      embeds: [leaderboardEmbed]
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return message.reply("Oops! Something went wrong while fetching the leaderboard!");
  }
}

async function getTopUsersByNetWorth() {
  return new Promise(async (resolve, reject) => {
    try {
      const topUsers = await User.find() // Fetch users
      .sort({
        networth: -1
      }) // Sort by networth in descending order
      .limit(10) // Limit the result to 10 users
      .select('id networth cash level'); // Select specific fields (optional)

      resolve(topUsers);
    } catch (error) {
      console.error('Error fetching top users by networth:', error);
      throw error;
      reject([]);
    }
  });
}

export default {
  name: "leaderboard",
  description: "Displays the top 10 current global leaderboard rankings according to users' net worth.",
  aliases: ["top",
    "ranking",
    "lb"],
  args: "",
  example: [
    "leaderboard",
    // View the leaderboard
  ],
  related: ["leaderboard",
    "profile",
    "stat"],
  cooldown: 30000,
  // Cooldown of 30 seconds
  category: "🧮 Stats",

  execute: (args, message) => {
    // Call the leaderboard function to display the current leaderboard
    return leaderboard(message);
  }
};