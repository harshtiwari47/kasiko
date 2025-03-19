import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder
} from 'discord.js';
import {
  Api
} from '@top-gg/sdk';
import dotenv from 'dotenv';
dotenv.config();

const TOKENTG = process.env.TG_TOKEN;

const dbl = new Api(TOKENTG);
const BOT_ID = "1300081477358452756"; // bot ID

/**
* Checks the user's vote and either rewards them or sends a vote prompt.
* @param {string} userId Discord user ID.
* @param {object} user Discord user object.
* @returns {object} An object with a message string and optionally components (buttons).
*/
export async function voteReward(userId, user) {
  try {
    // Check if the user has voted on Top.gg
    const voted = await dbl.hasVoted(userId);

    if (voted) {
      // Determine reward: 50k on weekends, otherwise 30k.
      const today = new Date();
      const day = today.getDay(); // 0 = Sunday, 6 = Saturday
      const reward = (day === 0 || day === 6) ? 50000: 30000;

      // Get user data from your database
      let userData = await getUserData(userId);
      if (!userData) {
        return {
          message: "User data not found. Please try again later."
        };
      }

      // Add reward to user's cash
      userData.cash += reward;
      await updateUser(userId, {
        cash: userData.cash
      });

      // Return a success message
      return {
        message: `🗳️ Thanks for voting, **${user.username}**! You've received <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** cash.\n-# Your support helps us grow`
      };
    } else {
      // If the user hasn't voted, create a vote button
      const voteButton = new ButtonBuilder()
      .setLabel("Vote for Bot")
      .setStyle(5) // Style 5 is the link button style
      .setURL(`https://top.gg/bot/${BOT_ID}/vote`);

      const row = new ActionRowBuilder().addComponents(voteButton);

      return {
        message: `🗳️ **${user.username}**, you haven't voted yet! Please vote for the bot to claim your reward. Come back in a few minutes after voting to claim your reward.`,
        components: [row]
      };
    }
  } catch (error) {
    if (error.message === "404 Not Found") {
      return {
        message: "It seems that your account could not be found on Top.gg. Please ensure that you have voted and try again. If the issue persists, verify that your account is properly linked and accessible on Top.gg."
      };
    } else {
      console.error("Error checking vote:", error);
      return {
        message: "Oops! Something went wrong while checking your vote. Please try again later."
      };
    }
  }
}

export default {
  name: "vote",
  description: "Claim your vote reward",
  aliases: ["v",
    "claimvote"],
  args: "",
  example: ["vote"],
  emoji: "🗳️",
  cooldown: 10000,
  category: "🏦 Economy",
  execute: async (args, message) => {
    const userId = message.author.id;
    const user = message.author;

    const result = await voteReward(userId, user);

    const embed = new EmbedBuilder()
    .setDescription(result.message)
    .setAuthor({
      name: user.username, iconURL: user.displayAvatarURL({
        dynamic: true
      })
    })
    .setColor("Random");

    message.channel.send({
      embeds: [embed], components: result.components || []
    })
    .catch(err => console.error(err));
  },
  // Slash Command interaction handling
  interact: async (interaction) => {
    try {
      const userId = interaction.user.id;
      const user = interaction.user;

      const result = await voteReward(userId, user);

      const embed = new EmbedBuilder()
      .setDescription(result.message)
      .setAuthor({
        name: user.username, iconURL: user.displayAvatarURL({
          dynamic: true
        })
      })
      .setColor("Random");

      await interaction.editReply({
        embeds: [embed], components: result.components || []
      });
    } catch (e) {
      console.error(e);
      await interaction.editReply({
        content: "Oops! Something went wrong while processing your vote reward."
      });
    }
  }
};