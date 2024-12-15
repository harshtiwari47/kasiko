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

export async function badges(userData) {
  let badges = "";

  if (userData.networth > 15000000) {
    badges += `<:chills:1316680306039984128> `
  } else if (userData.networth > 10000000) {
    badges += `<:trills:1316679914346381332> `
  } else if (userData.networth > 5000000) {
    badges += `<:bills:1316679142263230466> `
  } else if (userData.networth > 1000000) {
    badges += `<:mills:1316678507450863637> `
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth && userData.pass.type === "premium") {
    badges += `<:premis:1316681065439559680> `
  } else if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth) {
    badges += `<:royal:1316681043301892168> `
  }
  return `> # ${badges}`;
}

// create an embed card based on user data
async function createUserEmbed(userId, username, userData, avatar, badges) {
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

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let EmbedColor = "#f6e59a";

    if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth && userData.pass.type === "premium") {
      EmbedColor = `#85acfa`;
    }

    // Embed 1: Personal Info & Wealth Stats
    const embed1 = new EmbedBuilder()
    .setColor(EmbedColor || "#f6e59a")
    .setTitle(`⌞ ⌝  <@${userId.toString()}>'s Profile ✨`)
    .setDescription(`${ badges ? badges: 'Building wealth, trust, and empires starts from zero! 💸'}`)
    .addFields(
      // Financial Information
      {
        name: '💰 Financial Details',
        value: `**Cash:** <:kasiko_coin:1300141236841086977> ${Number(userData.cash.toFixed(1)).toLocaleString()}\n**Networth:** <:kasiko_coin:1300141236841086977>${userData.networth.toLocaleString()}\n**Charity:** <:kasiko_coin:1300141236841086977> ${userData.charity.toLocaleString()}`,
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
      `**ᯓ★𝐏𝐚𝐬𝐬𝐞𝐬**: ${userData.seasonalPasses.length ? userData.seasonalPasses.join(" "): "No Pass Found"}\n`+
      `⟡ ₊ .⋆ ✦⋆𓂁﹏ 𓂃⋆.˚⟡\n`
    );

    return [embed1,
      embed2];
  } catch (error) {
    return [];
    console.error('Error creating user embeds:', error);
  }
}

export async function profile(userId, context) {
  try {
    const isInteraction = !!context.isCommand; // Distinguishes between interaction and message
    const user = await context.client.users.fetch(userId);

    const userData = await getUserData(userId);
    userData.networth = updateNetWorth(userId);

    let userBadges = await badges(userData);

    const userProfile = await createUserEmbed(
      userId,
      user.username,
      userData,
      user.displayAvatarURL({
        dynamic: true, size: 256
      }), userBadges
    );

    if (isInteraction) {
      // If the context is an interaction
      if (!context.deferred) await context.deferReply();
      return await context.editReply({
        embeds: userProfile
      });
    } else {
      // If the context is a text-based message
      return await context.channel.send({
        embeds: userProfile
      });
    }
  } catch (e) {
    console.error("Error generating profile:", e);

    const errorMessage = "Oops! Something went wrong while exploring the user's profile!";
    if (context.isCommand) {
      if (!context.deferred) await context.deferReply();
      return await context.editReply(errorMessage);
    } else {
      return context.channel.send(errorMessage);
    }
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
  category: "👤 User",
  intract: (interaction) => {
    return profile(interaction.user.id, interaction);
  },
  execute: (args, message) => {
    // If the user mentions someone, display their profile
    if (args[1] && Helper.isUserMention(args[1], message)) {
      return profile(Helper.extractUserId(args[1]), message);
    }
    // Otherwise, display the message author's profile
    return profile(message.author.id, message);
  }
};