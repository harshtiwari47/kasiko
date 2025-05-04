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
import {
  VoteModel
} from '../../../models/voteModel.js';

const TOKENTG = process.env.TG_TOKEN;

const dbl = new Api(TOKENTG);
const BOT_ID = process.env.APP_ID; // bot ID

/**
* Checks the user's vote and either rewards them or sends a vote prompt.
* Now includes a check on the exact time the user last claimed a vote reward.
* @param {string} userId Discord user ID.
* @param {object} user Discord user object.
* @returns {object} An object with a message string and optionally components (buttons).
*/

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    // For normal text-based usage
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function voteReward(userId, user, context) {
  try {
    const voted = await dbl.hasVoted(userId);

    if (context.user) {
      await context.deferReply({
        ephemeral: false
      });
    }

    if (voted) {
      // Get user data from your database
      let userData = await getUserData(userId);

      const voted = await VoteModel.findOne({
        userId
      }).select('lastVoted');

      if (!userData) {
        await handleMessage(context, {
          content: "User data not found. Please try again later."
        });
        return;
      }

      if (context.user) {
        const reminderOpt = context.options.getString('reminder');
        if (reminderOpt) {
          const enabled = reminderOpt === 'yes';
          await VoteModel.setReminder(userId, enabled);
          await handleMessage(context, {
            content: `***🛎️ Vote reminders have been ${enabled ? 'enabled': 'disabled'}***.${enabled ? "\n\n<:emoji_35:1332676884093337603> *You will receive a vote reminder every **12 hours** in your DMs if your DMs are enabled for the bot.*": ""}`,
            ephemeral: true
          });
          return;
        }
      }

      // Check if the user has claimed a vote reward before
      const now = new Date();
      if (voted?.lastVoted) {
        const lastVoteTime = new Date(voted.lastVoted);
        const diffMs = now - lastVoteTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 12) {
          const hoursRemaining = (12 - diffHours).toFixed(1);
          await handleMessage(context, {
            embeds: [new EmbedBuilder().setDescription(`🗳️ **${user.username}**, you have already claimed your vote reward! Please wait **${hoursRemaining} more hour(s)** before claiming again.`).setColor('Random').setAuthor({
              name: user.username, iconURL: user.displayAvatarURL({
                dynamic: true
              })
            })]
          });
          return;
        }
      }

      // Determine reward: 50k on weekends (Saturday: 6, Sunday: 0), otherwise 30k.
      const today = now;
      const day = today.getDay(); // 0 = Sunday, 6 = Saturday
      const reward = (day === 0 || day === 6) ? 50000: 30000;

      userData.cash += reward;
      userData.lastVoteTime = now.toISOString();
      const voteDoc = await VoteModel.recordVote(userId);

      await updateUser(userId, {
        cash: userData.cash,
        lastVoteTime: userData.lastVoteTime
      });

      await handleMessage(context, {
        embeds: [
          new EmbedBuilder()
          .setTitle('🗳️ 𝙑𝙊𝙏𝙀 𝘾𝙇𝘼𝙄𝙈𝙀𝘿!')
          .setDescription(`<a:ext_heart_pump:1359578512893149246> Thanks for voting, **${user.username}**! You've received <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** cash.\n-# Your support helps us grow\n\n` +
            `<:orange_fire:1336344438464839731> **𝘊𝘶𝘳𝘳𝘦𝘯𝘵 𝘚𝘵𝘳𝘦𝘢𝘬**: ***${voteDoc.voteStreak}***`)
          .addFields(
            {
              name: '<a:custom_exclusive_badge_23:1355149433137926394> **𝘓𝘈𝘚𝘛 𝘝𝘖𝘛𝘌𝘚**', value: voteDoc.lastVotes.slice(0, 3).map(d => ` <t:${Math.floor(new Date(d).getTime()/1000)}:d> `).join(', '), inline: false
            }
          )
          .setColor('Green')
          .setAuthor({
            name: user.username, iconURL: user.displayAvatarURL({
              dynamic: true
            })
          })
        ]
      });
      return;
    } else {
      // If the user hasn't voted, create a vote button
      const voteButton = new ButtonBuilder()
      .setLabel("𝗩𝗼𝘁𝗲 𝗳𝗼𝗿 𝗕𝗼𝘁")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://top.gg/bot/${BOT_ID}/vote`);

      const row = new ActionRowBuilder().addComponents(voteButton);

      await handleMessage(context, {
        embeds: [
          new EmbedBuilder()
          .setDescription(`🗳️ **${user.username}**, you haven't voted yet! Please vote for the bot to claim your reward. Come back in a few minutes after voting to claim your reward.`)
          .setAuthor({
            name: user.username, iconURL: user.displayAvatarURL({
              dynamic: true
            })
          })],
        components: [row]
      });
      return;
    }
  } catch (error) {
    if (error.message === "404 Not Found") {
      await handleMessage(context, {
        embeds: [new EmbedBuilder().setDescription("It seems that your account could not be found on Top.gg. Please ensure that you have voted and try again. If the issue persists, verify that your account is properly linked and accessible on Top.gg.")]
      });
      return;
    } else {
      console.error("Error checking vote:", error);
      await handleMessage(context, {
        embeds: [new EmbedBuilder().setDescription("Oops! Something went wrong while checking your vote. Please try again later.")]
      });
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
  execute: async (args, context) => {
    try {
      const userId = context.author ? context.author.id: context.user.id;
      const user = context.author ?? context.user;
      await voteReward(userId, user, context);
    } catch (err) {}
  }
};