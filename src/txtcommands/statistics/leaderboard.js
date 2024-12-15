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

    const {
      users,
      userRank
    } = await getTopUsersAndRank(userId);
    
    if (users.length === 0) {
      return [new EmbedBuilder()
        .setColor('#ed971e')
        .setTitle(`🏆 𝐋𝐞𝐚𝐝𝐞𝐫𝐛𝐨𝐚𝐫𝐝 ✧`)
        .setDescription('No users found!')
        .setFooter({
          text: `Your position is: Not ranked`,
          iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
        })
        .setTimestamp()]
    }

    const circledNumbers = {
      3: "⓸",
      4: "⓹",
      5: "⓺",
      6: "⓻",
      7: "⓼",
      8: "⓽",
      9: "⓾"
    };

    // Build the leaderboard string
    let leaderboard = '';
    let leaderboardTopThree = '';
    for (const [index, user] of users.entries()) {
      let userDetails;
      try {
        userDetails = await client.users.fetch(user.id); // Fetch the user from Discord
      } catch (err) {
        userDetails = {
          username: 'Failed to Fetch'
        }; // Fallback if fetching fails
      }
      if (index < 3) {
        leaderboardTopThree += `**${index === 0 ? "<:crown:1317444012600197191>": index === 1 ? "❷": index === 2 ? "❸": ""}** **${userDetails.username}** \n- *Networth*: <:kasiko_coin:1300141236841086977> **${Number(user.networth.toFixed(1)).toLocaleString()}**\n`;
      } else {
        leaderboard += `**${"\`" + circledNumbers[(index)] + "\`."}** **${userDetails.username}** - NW: <:kasiko_coin:1300141236841086977> **${Number(user.networth.toFixed(1)).toLocaleString()}**\n`;
      }
    }

    // Find the position of the command invoker
    const userPosition = userRank ? userRank: users.findIndex(user => user.id === userId) + 1 || "Unranked";
    const embedHead = new EmbedBuilder()
    .setColor('#ed971e')
    .setTitle(`🏆 𝐋𝐞𝐚𝐝𝐞𝐫𝐛𝐨𝐚𝐫𝐝 ✧`);


    // Create and return the embed message
    const embedThree = new EmbedBuilder()
    .setColor('#ed971e')
    .setDescription(leaderboardTopThree)


    const embed = new EmbedBuilder()
    .setColor('#b16e0e')
    .setDescription(leaderboard)
    .setFooter({
      text: `Your position is: ${userPosition > 0 ? userPosition: 'Not ranked'}`,
    })
    .setTimestamp();

    return [embedHead,
      embedThree,
      embed];
  } catch (error) {
    console.error('Oops! An error occurred while generating the leaderboard', error);
    return [new EmbedBuilder()
      .setColor('#ed971e')
      .setTitle('Error')
      .setDescription('An error occurred while generating the leaderboard.')
      .setTimestamp()]
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
      embeds: leaderboardEmbed
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return message.reply("Oops! Something went wrong while fetching the leaderboard!");
  }
}

async function getTopUsersAndRank(userId) {
  try {
    // Fetch the top 10 users by net worth
    const users = await User.find()
    .sort({
      networth: -1
    })
    .limit(10)
    .select('id networth cash level');

    // Fetch the specific user's net worth
    const user = await User.findOne({id: userId}).select('networth');

    if (!user) {
      throw new Error('User not found');
    }

    // Determine the user's rank
    const userRank = await User.countDocuments({
      networth: {
        $gt: user.networth
      }
    }) + 1;

    return {
      users,
      userRank,
    };
  } catch (error) {
    console.error('Error fetching top users and rank:', error);
    throw error;
  }
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