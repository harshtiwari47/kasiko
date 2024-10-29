import { EmbedBuilder } from "discord.js";
import { readUserData } from "../database.js";


async function createLeaderboardEmbed(userId, usersArray) {
	try {
		// Sort users by networth in descending order and get the top 10 users
		const sortedUsers = usersArray.sort((a, b) => b.networth - a.networth).slice(0, 10);

		// Build the leaderboard description
		let leaderboard = '';
		sortedUsers.forEach((user, index) => {
			leaderboard += `**${index + 1}.** <@${user.id}> - Networth: <:kasiko_coin:1300141236841086977> **$${user.networth}**\n`;
		});

		// Find the position of the command invoker
		const userPosition = usersArray.findIndex(user => user.id === userId) + 1;

		// Create the embed message
		const embed = new EmbedBuilder()
		.setColor('#ed971e')
		.setTitle('✩▓▅▁🏆𝐋𝐞𝐚𝐝𝐞𝐫𝐛𝐨𝐚𝐫𝐝▁▅▓✩')
		.setDescription(leaderboard || 'No users found!')
		.setFooter({
			text: `Your position is: ${userPosition > 0 ? userPosition : 'Not ranked'}`,
			iconURL: 'https://cdn.discordapp.com/avatars/1300081477358452756/cbafd10eba2293768dd9c4c0c7d0623f.png'
		})
		.setTimestamp();

		return embed;
	} catch (error) {
		console.error('Oops! An error occurred while creating generating leaderboard', error);
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