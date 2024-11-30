import {
  EmbedBuilder
} from 'discord.js';
import {
  getUserData
} from '../../../database.js';
import {
  client
} from "../../../bot.js";
import {
  updateNetWorth
} from '../../../utils/updateNetworth.js';

import {
  Helper
} from '../../../helper.js';

// create an embed card based on user data
async function createUserEmbed(userId, username, userData, avatar) {
  try {
    const joinDate = new Date(userData.joined);
    const isToday = joinDate.toDateString() === new Date().toDateString();

    const currentTime = Date.now();
    let dailyRewardsDetail = "Not claimed";
    const nextClaim = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (userData.dailyReward && (currentTime - userData.dailyReward) < nextClaim) {
      dailyRewardsDetail = "Claimed";
    }

    let partner = {
      username: "Not married"
    };

    let totalCars = userData.cars.reduce((sum, car) => {
      sum += car.items;
      return sum;
    }, 0);

    let totalStructures = userData.structures.reduce((sum, structure) => {
      sum += structure.items;
      return sum;
    }, 0);

    if (userData.spouse) {
      partner = await client.users.fetch(userData.spouse) || {
        username: "Failed to Fetch"
      };
    }

    // Embed 1: Personal Info & Wealth Stats
    const embed1 = new EmbedBuilder()
    .setColor('#f6e59a')
    .setTitle(`⌞ ⌝  <@${userId.toString()}>'s Profile ✨`)
    .setDescription('Building wealth, trust, and empires starts from zero! 💸')
    .addFields(
      // Financial Information
      {
        name: '💰 Financial Details',
        value: `**Cash:** <:kasiko_coin:1300141236841086977> ${Number(userData.cash.toFixed(1))}\n**Networth:** <:kasiko_coin:1300141236841086977>${userData.networth}\n**Charity:** <:kasiko_coin:1300141236841086977> ${userData.charity}`,
        inline: true
      },

      // Rewards and Status
      {
        name: '🎉 Rewards & Status',
        value: `**Daily Rewards:** ${dailyRewardsDetail}\n**Trust Level:** ${userData.trust}`,
        inline: true
      },

      // Personal Information
      {
        name: '👪 Family Details',
        value: `**Spouse:** **${partner.username}**\n**Children:** **${userData.children.length === 0 ? "0": userData.children.join(", ")}**`,
        inline: true
      }
    );

    // Embed 2: Property & Achievements
    const embed2 = new EmbedBuilder()
    .setTitle(`⌞ ⌝ Assets ✨`)
    .setThumbnail(avatar)
    .setDescription(
      `Investing & securing assets is life's ultimate game. 💰\n\n` +
      `**ᯓ★𝐂𝐚𝐫𝐬**: ${totalCars}\n` +
      `**ᯓ★𝐇𝐨𝐮𝐬𝐞𝐬**: ${totalStructures}\n`+
      `⟡ ₊ .⋆ ✦⋆𓂁﹏ 𓂃⋆.˚⟡\n`
    );

    return [embed1,
      embed2];
  } catch (error) {
    return [];
    console.error('Error creating user embeds:', error);
  }
}

export async function profile(id, channel) {
  try {
    const user = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);
    userData.networth = updateNetWorth(id);

    let userProfile = await createUserEmbed(id, user.username, userData, user.displayAvatarURL({
      dynamic: true, size: 256
    }));
    return await channel.send({
      embeds: userProfile
    });
  } catch (e) {
    console.error(e)
    return channel.send("Oops! something went wrong while exploring user's profile!");
  }
}

export default {
  name: "profile",
  description: "Displays the user's profile or another user's profile if mentioned.",
  aliases: ["userinfo",
    "profileinfo",
    "p"],
  args: "<@user> (optional)",
  example: [
    "profile",
    // View your own profile
    "profile @user",
    // View another user's profile
  ],
  related: ["leaderboard",
    "stat",
    "cash",
    "bank"],
  cooldown: 10000,
  // Cooldown of 10 seconds
  category: "User",

  execute: (args, message) => {
    // If the user mentions someone, display their profile
    if (args[1] && Helper.isUserMention(args[1], message)) {
      return profile(Helper.extractUserId(args[1]), message.channel);
    }
    // Otherwise, display the message author's profile
    return profile(message.author.id, message.channel);
  }
};