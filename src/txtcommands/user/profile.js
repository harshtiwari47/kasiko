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
  calculateNetWorth
} from '../../../utils/updateNetworth.js';

import {
  Helper
} from '../../../helper.js';

import {
  getBotTeam
} from '../../owner/main.js';

import {
  checkPassValidity
} from "../explore/pass.js";

export async function badges(userData) {
  let badges = "";

  if (userData.networth > 30000000) {
    badges += `<:krills:1328221841076129793> `
  } else if (userData.networth > 15000000) {
    badges += `<:chills:1328221817181311058> `
  } else if (userData.networth > 10000000) {
    badges += `<:trills:1328221792652886111> `
  } else if (userData.networth > 5000000) {
    badges += `<:bills:1328221769672163361> `
  } else if (userData.networth > 1000000) {
    badges += `<:mills:1328221741650284604> `
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  if (userData.passActive) {
    badges += `<:special_badge:1322047435111137361> `
  }

  if (userData.orca && !Array.isArray(userData.orca) && (userData.orca["count"] > 30)) {
    badges += `<:paramount_cultist:1328222702040907836> `
  } else if (userData.orca && !Array.isArray(userData.orca) && (userData.orca["count"] > 15)) {
    badges += `<:supreme_cultist:1328222685112569856> `
  } else if (userData.orca && !Array.isArray(userData.orca) && (userData.orca["count"] > 5)) {
    badges += `<:novice_cultist:1328222665235894282> `
  }

  if (userData.badges && userData.badges.length > 0) {
    userData.badges.forEach(badge => {
      badges += `${badge} `;
    })
  }

  if (badges) {
    badges = `-# # ${badges}`;
  }

  return `${badges}`;
}

function getChildEmoji(gender, customEmojis = {}) {
  const DEFAULT_BOY_EMOJI = '<:boy_child:1335131474055139430>';
  const DEFAULT_GIRL_EMOJI = '<:girl_child:1335131494070489118>';

  if (customEmojis[gender]) return customEmojis[gender];
  return gender === 'B' ? DEFAULT_BOY_EMOJI: DEFAULT_GIRL_EMOJI;
}

// create an embed card based on user data
async function createUserEmbed(userId, username, userData, avatar, badges, passInfo) {
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

    if (userData.family.spouse) {
      partner = await client.users.fetch(userData.family.spouse) || {
        username: "Failed to Fetch"
      };
    }

    const childrenNames = userData.family.children.map((child) => {
      return `${getChildEmoji(child.gender, userData.family.customChildEmojis)} ${child.name}`;
    })

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let EmbedColor = "#f6e59a";

    if (passInfo.isValid) {
      if (passInfo.passType === "titan") EmbedColor = "#328e66";
      if (passInfo.passType === "pheonix") EmbedColor = "#af3d35";
      if (passInfo.passType === "ethereal") EmbedColor = "#6c35b8";
      if (passInfo.passType === "celestia") EmbedColor = "#090a0d";
      if (passInfo.passType === "celestia" && userData.color !== "#f6e59a") EmbedColor = userData.color;
    }

    // Embed 1: Personal Info & Wealth Stats
    const embed1 = new EmbedBuilder()
    .setColor(EmbedColor || "#f6e59a")
    .setDescription(`${passInfo.isValid ? "<:emoji_35:1332676884093337603>": "⌞ ⌝"} <@${userId.toString()}>'𝙎 𝙋𝙧𝙤𝙛𝙞𝙡𝙚 ✦\n-# ${ badges ? badges: 'Building wealth, trust, and empires starts from zero! <:spark:1355139233559351326>'}`)
    .addFields(
      // Financial Information
      {
        name: '💵 𝘍𝘪𝘯𝘢𝘯𝘤𝘪𝘢𝘭 𝘋𝘦𝘵𝘢𝘪𝘭𝘴',
        value: `**Cash:** <:kasiko_coin:1300141236841086977> ${Number(userData.cash.toFixed(1)).toLocaleString()}\n**Networth:** <:kasiko_coin:1300141236841086977>${userData.networth.toLocaleString()}\n**Charity:** <:kasiko_coin:1300141236841086977> ${userData.charity.toLocaleString()}`,
        inline: true
      },
      // Personal Information
      {
        name: '👪 𝘍𝘢𝘮𝘪𝘭𝘺 𝘋𝘦𝘵𝘢𝘪𝘭𝘴',
        value: `**Spouse:** **${partner.username}**\n**Children:** **${userData.family.children.length === 0 ? "0": childrenNames.join(", ")}**\n**Friendly:** ${userData.friendly}`,
        inline: true
      }
    );

    const ownersList = getBotTeam();
    const ownerDetail = ownersList[userId];

    if (ownerDetail) {
      embed1.setFooter({
        text: `${ownerDetail === 1 ? "ʬʬ 𝘒𝘈𝘚𝘐𝘒𝘖 𝘖𝘞𝘕𝘌𝘙" : "ꗃ ᴋᴀꜱɪᴋᴏ ᴍᴏᴅᴇʀᴀᴛᴏʀ"}`
      })
    }

    // Embed 2: Property & Achievements
    const embed2 = new EmbedBuilder()
    .setTitle(`⌞ ⌝ Assets ✦`)
    .setThumbnail(avatar)
    .setDescription(
      `**⤿🚘 𝖢𝖺𝗋𝗌**: **${totalCars}**\n` +
      `**⤿🏡 𝖧𝗈𝗎𝗌𝖾𝗌**: **${totalStructures}**\n`+
      `**⤿✈️ 𝖯𝗋𝗂𝗏𝖺𝗍𝖾 𝖩𝖾𝗍**: ${passInfo.isValid && passInfo.passType === "celestia" ? `1`: "0"}\n`
    )
    .setFooter({
      text: `${userData.profileBio ? userData.profileBio: "ꜱᴇᴄᴜʀɪɴɢ ᴀꜱꜱᴇᴛꜱ ɪꜱ ʟɪꜰᴇ'ꜱ ᴜʟᴛɪᴍᴀᴛᴇ ɢᴀᴍᴇ."}`
    })

    const embed3 = new EmbedBuilder()
    .setDescription(`**🜲 𝗣𝗔𝗦𝗦**: ${passInfo.isValid ? `${passInfo.emoji} **${passInfo.passType.toUpperCase()}**`: "404"}\n`)
    .setColor(EmbedColor || "#f6e59a")

    let embedList;

    if (passInfo.isValid) {
      embedList = [embed1,
        embed3,
        embed2]
    } else {
      embedList = [embed1,
        embed2]
    }

    return embedList;
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
    if (!userData) return;
    userData.networth = calculateNetWorth(userData);

    const passInfo = await checkPassValidity(userId);
    userData.passActive = passInfo.isValid;

    let userBadges = await badges(userData);

    const userProfile = await createUserEmbed(
      userId,
      user.username,
      userData,
      user.displayAvatarURL({
        dynamic: true, size: 256
      }), userBadges, passInfo
    );

    if (isInteraction) {
      // If the context is an interaction
      if (!context.deferred) await context.deferReply();
      await context.editReply({
        embeds: userProfile
      });
      return;
    } else {
      // If the context is a text-based message
      await context.channel.send({
        embeds: userProfile
      });
      return;
    }
  } catch (e) {
    console.error("Error generating profile:", e);

    const errorMessage = "Oops! Something went wrong while exploring the user's profile!";
    if (context.isCommand) {
      if (!context.deferred) await context.deferReply();
      await context.editReply(errorMessage).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      return;
    } else {
      return context.channel.send(errorMessage).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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
  emoji: "😎",
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