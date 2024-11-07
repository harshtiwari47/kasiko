import { EmbedBuilder } from "discord.js";
import { readUserData } from "../../../database.js";
import { client } from "../../../bot.js";


async function createLeaderboardEmbed(userId, usersArray) {
	try {
		// Sort users by networth in descending order and get the top 10 users
		const sortedUsers = usersArray.sort((a, b) => b.networth - a.networth).slice(0, 10);

		// Build the leaderboard
		let leaderboard = '';
		for (const [index, user] of sortedUsers.entries()) {
			let userDetails;
			try {
				userDetails = await client.users.fetch(user.id);
			} catch (err) {
				userDetails = { "username": "Failed to Fetch" };
			}
			leaderboard += `**${index + 1}.** **${userDetails.username}** - Networth: <:kasiko_coin:1300141236841086977> **${Number(user.networth.toFixed(1))}**\n`;
		}

		// Find the position of the command invoker
		const userPosition = usersArray.findIndex(user => user.id === userId) + 1;

		// Create the embed message
		const embed = new EmbedBuilder()
		.setColor('#ed971e')
		.setTitle('✩▓▅▁🏆𝐋𝐞𝐚𝐝𝐞𝐫𝐛𝐨𝐚𝐫𝐝▁▅▓✩')
		.setDescription(leaderboard || 'No users found!')
		.setFooter({
			text: `Your position is: ${userPosition > 0 ? userPosition : 'Not ranked'}`,
			iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
		})
		.setTimestamp();

		return embed;
	} catch (error) {
		console.error('Oops! An error occurred while generating the leaderboard', error);
	}
}

// Leaderboard command function
export async function leaderboard(message) {
	try {
		const userId = message.author.id;

		// Retrieve user data and convert to array with userId as part of each object
		const data = readUserData();
		const usersArray = Object.entries(data).map(([id, user]) => ({ id, ...user }));

		// Create the leaderboard embed
		const leaderboardEmbed = await createLeaderboardEmbed(userId, usersArray);

		// Send the embed in response to the interaction
		return await message.reply({
			embeds: [leaderboardEmbed]
		});
	} catch (error) {
		console.error('Error fetching leaderboard:', error);
		return message.reply("Oops! Something went wrong while fetching the leaderboard!");
	}
}

// File: commands/leaderboard/leaderboard.js

export default {
  name: "leaderboard",
  description: "Displays the current leaderboard.",
  aliases: ["top", "ranking", "lb"],
  args: "",
  example: [
    "leaderboard", // View the leaderboard
  ],
  related: ["leaderboard", "top", "ranking"],
  cooldown: 10000, // Cooldown of 10 seconds
  category: "Statistics",

  execute: (args, message) => {
    // Call the leaderboard function to display the current leaderboard
    return leaderboard(message);
  }
};