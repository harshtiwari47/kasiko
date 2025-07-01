import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags,
  SeparatorSpacingSize
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
    badges = `-# ## ${badges}`;
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
    const joinDate = new Date(userData?.joined);
    const isToday = joinDate?.toDateString() === new Date().toDateString();

    const currentTime = Date.now();
    let dailyRewardsDetail = "Not claimed";
    const nextClaim = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (userData?.dailyReward && (currentTime - userData?.dailyReward) < nextClaim) {
      dailyRewardsDetail = "Claimed";
    }

    let partner = {
      username: "Unmarried"
    };

    let totalCars = userData.cars.reduce((sum, car) => {
      sum += car?.items || 0;
      return sum;
    }, 0);

    let totalStructures = userData.structures.reduce((sum, structure) => {
      sum += structure?.items || 0;
      return sum;
    }, 0);

    if (userData.family.spouse) {
      partner = await client?.users?.fetch(userData?.family?.spouse) || {
        username: "Failed to Fetch"
      };
    }

    const childrenNames = userData.family.children.map((child) => {
      return `${getChildEmoji(child?.gender, userData?.family?.customChildEmojis)} ${child?.name}`;
    })

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let EmbedColor = "#f6e59a";

    if (passInfo?.isValid) {
      if (passInfo?.passType === "titan") EmbedColor = "#328e66";
      if (passInfo?.passType === "pheonix") EmbedColor = "#af3d35";
      if (passInfo?.passType === "ethereal") EmbedColor = "#6c35b8";
      if (passInfo?.passType === "celestia") EmbedColor = "#090a0d";
      if (passInfo?.passType === "celestia" && userData.color !== "#f6e59a") EmbedColor = userData?.color;
    }

    const ownersList = getBotTeam();
    const ownerDetail = ownersList[userId];

    const Container = new ContainerBuilder()
    .setAccentColor(EmbedColor ? Number(`0x${EmbedColor.replace("#", "")}`): 0xf6e59a)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`${passInfo.isValid ? "<:emoji_35:1332676884093337603>": "<:user:1385131666011590709> "} <@${userId?.toString()}> 𝗣𝗥𝗢𝗙𝗜𝗟𝗘 `)
    )
    .addSeparatorComponents(separate => separate.setDivider(false).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`-# ${ownerDetail && ownerDetail === 3 ? "<:kasiko_supreme:1389508842529755217>": ownerDetail ? "<:kasiko_director:1389508823055601725>" : ""} <:level:1389092923525824552> **${userData?.level}**  <:popularity:1359565087341543435> **${userData?.popularity}**  ${passInfo?.isValid ? `${passInfo?.emoji} **${passInfo?.passType?.toUpperCase()}**`: ""}`)
    )
    .addSeparatorComponents(separate => separate.setDivider(false))
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`**CASH:** <:kasiko_coin:1300141236841086977> **${Number(userData?.cash?.toFixed(1)).toLocaleString()}**\n**NETWORTH:** <:kasiko_coin:1300141236841086977>**${userData.networth.toLocaleString()}**`)
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`**${partner?.username && partner?.username !== "Unmarried" ? `Spouse: ${partner?.username}`: `Unmarried`}**${userData?.family?.children?.length === 0 ? "": `\n**Children:** ` + childrenNames?.join(", ")}${userData?.family?.children?.length === 0 ? ` ♡ **Friendly: ` + userData?.friendly + "**": `\n**Friendly: ` + userData?.friendly + "**"}`)
    )

    Container.addSeparatorComponents(separate => separate.setSpacing(SeparatorSpacingSize.Large))

    Container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`${badges ? badges: '𝖡𝗎𝗂𝗅𝖽𝗂𝗇𝗀 𝗐𝖾𝖺𝗅𝗍𝗁, 𝗍𝗋𝗎𝗌𝗍, 𝖺𝗇𝖽 𝖾𝗆𝗉𝗂𝗋𝖾𝗌 𝗌𝗍𝖺𝗋𝗍𝗌 𝖿𝗋𝗈𝗆 𝗓𝖾𝗋𝗈! <:spark:1355139233559351326>'}`)
    )

    Container.addMediaGalleryComponents(
      media =>
      media.addItems(
        item => item.setURL(userData?.banner)
      )
    )
    Container.addSeparatorComponents(separate => separate.setDivider(false))

    Container.addSectionComponents(
      section => section
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# \`\`\`${userData?.profileBio ? userData?.profileBio: "ꜱᴇᴄᴜʀɪɴɢ ᴀꜱꜱᴇᴛꜱ ɪꜱ ʟɪꜰᴇ'ꜱ ᴜʟᴛɪᴍᴀᴛᴇ ɢᴀᴍᴇ."}\`\`\``)
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
        .setDescription('User Profile')
        .setURL(avatar)
      )
    )
    Container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(
        `-# **<:spector:1324601268421005342> 𝖢𝖺𝗋𝗌** **${totalCars}**  ` +
        `**<:house:1385131710479597639> 𝖧𝗈𝗎𝗌𝖾𝗌** **${totalStructures}**  `+
        `**<:aeroplane:1385131687020855367> 𝖩𝖾𝗍** **${passInfo?.isValid && passInfo?.passType === "celestia" ? `1`: "0"}**`
      )
    )

    return [Container];
  } catch (error) {
    console.error('Error creating user embeds:',
      error);
    return [];
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
        components: userProfile,
        flags: MessageFlags.IsComponentsV2
      });
      return;
    } else {
      // If the context is a text-based message
      await context.channel.send({
        components: userProfile,
        flags: MessageFlags.IsComponentsV2
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
  emoji: "<:user:1385131666011590709>",
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