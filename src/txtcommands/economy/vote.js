import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle
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
* Now includes a check on the exact time the user last claimed a vote reward.
* @param {string} userId Discord user ID.
* @param {object} user Discord user object.
* @returns {object} An object with a message string and optionally components (buttons).
*/
export async function voteReward(userId, user) {
  try {
    const voted = await dbl.hasVoted(userId);

    if (voted) {
      // Get user data from your database
      let userData = await getUserData(userId);
      if (!userData) {
        return {
          message: "User data not found. Please try again later."
        };
      }

      // Check if the user has claimed a vote reward before
      const now = new Date();
      if (userData.lastVoteTime) {
        const lastVoteTime = new Date(userData.lastVoteTime);
        const diffMs = now - lastVoteTime;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 12) {
          const hoursRemaining = (12 - diffHours).toFixed(1);
          return {
            message: `🗳️ **${user.username}**, you have already claimed your vote reward! Please wait **${hoursRemaining} more hour(s)** before claiming again.`
          };
        }
      }

      // Determine reward: 50k on weekends (Saturday: 6, Sunday: 0), otherwise 30k.
      const today = now;
      const day = today.getDay(); // 0 = Sunday, 6 = Saturday
      const reward = (day === 0 || day === 6) ? 50000: 30000;

      userData.cash += reward;
      userData.lastVoteTime = now.toISOString();

      await updateUser(userId, {
        cash: userData.cash,
        lastVoteTime: userData.lastVoteTime
      });

      return {
        message: `🗳️ Thanks for voting, **${user.username}**! You've received <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** cash.\n-# Your support helps us grow`
      };
    } else {
      // If the user hasn't voted, create a vote button

      const voteButton = new ButtonBuilder()
      .setLabel("Vote for Bot")
      .setStyle(ButtonStyle.Link)
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