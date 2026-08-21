import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  client
} from '../../../bot.js';

import {
  handleMessage,
  discordUser,
  Helper
} from '../../../helper.js';
import { sendErrorLog } from '../../../utils/errorLogger.js';

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { increaseTask } from "../economy/task.js";

// ==================================================
// =============== Utility Functions ================
// ==================================================

/**
* Attempts to bake a cookie for the user:
*  - Up to 3 cookies per day
*  - 50% chance of success each time
*/
async function bakeCookie(userId) {
  try {
    const userData = await getUserData(userId);

    // Initialize the cookie object if missing
    if (!userData.cookie || typeof userData.cookie !== 'object') {
      userData.cookie = {};
    }

    const now = new Date();
    const todayStr = now.toDateString();

    // If 'lastBakeDate' is a different day, reset daily bakes to 0
    if (userData.cookie.lastBakeDate !== todayStr) {
      userData.cookie.dailyBakes = 0;
      userData.cookie.lastBakeDate = todayStr;
    }

    // Make sure user hasn't exceeded 3 bakes per day
    if (userData.cookie.dailyBakes >= 3) {
      return {
        success: false,
        message: `❗ **Oh no!** You've already baked <:cookie:1385131636613709905> **3 cookies** today! Come back tomorrow for more 🍭 delicious treats.`
      };
    }

    // 50% chance to succeed
    const success = Math.random() < 0.5;
    userData.cookie.dailyBakes += 1; // Attempt used up, success or fail

    if (!success) {
      await updateUser(userId, userData);
      return {
        success: false,
        message: `😞 Oh dear! 𝑻𝒉𝒆 𝒄𝒐𝒐𝒌𝒊𝒆 <:cookie:1385131636613709905> dough **𝑏𝑢𝑟𝑛𝑒𝑑** to a crisp! 💥\n𝙱𝚎𝚝𝚝𝚎𝚛 𝚕𝚞𝚌𝚔 𝚗𝚎𝚡𝚝 𝚝𝚒𝚖𝚎!`
      };
    }

    // Success! Bake +1 cookie
    userData.cookie.cookies = (userData.cookie.cookies || 0) + 1;
    await updateUser(userId, userData);

    const burningFire = `<a:fire:1326388149957689435>`

    return {
      success: true,
      message: `${burningFire} **Yay!** You ***successfully*** baked a 𝓬𝓸𝓸𝓴𝓲𝓮 . You now have <:cookie:1385131636613709905> **${userData.cookie.cookies}** cookies!`
    };
  } catch (err) {
    return {
      success: false,
      message: `**Error:** ${err.message}`
    }
  }
}

/**
* Shares 1 cookie from user -> mentionedUser, via a text mention.
*/
export async function shareCookie(authorId, mentionedUserId, authorUsername) {
  if (!mentionedUserId) {
    return {
      success: false,
      message: `❗Please mention **one** user to share your cookie with! <:cookie:1385131636613709905>`
    };
  }
  
  if (authorId === mentionedUserId) {
    return {
      success: false,
      message: `❗ Sharing to yourself? 🤷🏻<:cookie:1385131636613709905>`
    };
  }

  // Get both user data
  const authorData = await getUserData(authorId);
  const mentionedData = await getUserData(mentionedUserId);

  if (!mentionedData) {
    return {
      success: false,
      message: `⚠ Mentioned user not found! <:cookie:1385131636613709905>`
    }
  }

  // Initialize if missing
  if (!authorData.cookie || typeof authorData.cookie !== 'object') {
    authorData.cookie = {};
  }
  if (!mentionedData.cookie || typeof mentionedData.cookie !== 'object') {
    mentionedData.cookie = {};
  }

  // Check if author has at least 1 cookie
  if ((authorData.cookie?.cookies || 0) < 1) {
    return {
      success: false,
      message: `❗**${authorUsername}**, you don't have any <:cookie:1385131636613709905> cookies to share!`
    };
  }

  // Transfer cookie
  authorData.cookie.cookies -= 1;
  if (authorData.cookie.cookies < 0) authorData.cookie.cookies = 0;
  authorData.friendly += 5;
  mentionedData.cookie.cookies = (mentionedData.cookie.cookies || 0) + 1;

  // Track how many user has shared
  authorData.cookie.sharedCount = (authorData.cookie.sharedCount || 0) + 1;

  /**
  * (Optional) Add some "reward" logic here if you want:
  *  e.g., authorData.cookie.friendshipPoints = (authorData.cookie.friendshipPoints || 0) + 1;
  *        mentionedData.cookie.friendshipPoints = (mentionedData.cookie.friendshipPoints || 0) + 1;
  */

  try {
    const markTask = await increaseTask(authorId, "cookie");
      
    await updateUser(authorId, {
      'cookie.sharedCount': authorData.cookie.sharedCount,
      'friendly': authorData.friendly,
      'cookie.cookies': authorData.cookie.cookies
    });
    await updateUser(mentionedUserId, {
      'cookie.cookies': mentionedData.cookie.cookies
    });

  } catch (e) {
    return {
      success: false,
      message: `⚠ Something went wrong while sharing the cookie! <:cookie:1385131636613709905>\n-# **Error**: ${e.message}`
    }
  }

  // Return a cute success message (with optional reward text)
  return {
    success: true,
    message: `## 🍬 So swᥱᥱt !\n` +
    `       ᥫ᭡. **${authorUsername}** shared <:cookie:1385131636613709905> **1 cookie** with <@${mentionedUserId}>.\n` +
    `-# 𓂃۶ৎ 𝑇ℎ𝑒 𝑎𝑟𝑜𝑚𝑎 𝑖𝑠 𝑑𝑒𝑙𝑖𝑔ℎ𝑡𝑓𝑢𝑙, 𝑎𝑛𝑑 𝑦𝑜𝑢𝑟 𝑓𝑟𝑖𝑒𝑛𝑑𝑠ℎ𝑖𝑝 𝑔𝑟𝑜𝑤𝑠 𝑠𝑡𝑟𝑜𝑛𝑔𝑒𝑟! 💖\n` +
    `ꜰʀɪᴇɴᴅʟʏ ꜱᴄᴏʀᴇ: +5   ♥︎`
  };
}

/**
* Build the primary embed showing the user's cookie stats.
*/
async function buildCookieStatsEmbed(userId) {
  const userData = await getUserData(userId);

  if (!userData.cookie || typeof userData.cookie !== 'object') {
    userData.cookie = {};
  }

  const burningFire = `<a:fire:1326388149957689435>`

  const cookies = userData.cookie.cookies || 0;
  const sharedCount = userData.cookie.sharedCount || 0;

  // If lastBakeDate doesn't match today's date, dailyBakes is effectively 0
  const now = new Date();
  const todayStr = now.toDateString();
  let dailyBakes = userData.cookie.dailyBakes || 0;
  if (userData.cookie.lastBakeDate !== todayStr) {
    dailyBakes = 0;
  }

  // Cute stats embed
  const embed = new EmbedBuilder()
  .setColor('#ffca8b')
  .setTitle(`◈✦ 𝒞𝑜𝑜𝓀𝒾𝑒 𝓙𝓪𝓻`)
  .setDescription(
    `**<:cookie:1385131636613709905> 𝑪𝒐𝒐𝒌𝒊𝒆𝒔**: **\`${cookies}\`**\n` +
    `**${burningFire} 𝑩𝒂𝒌𝒆𝒔 𝑻𝒐𝒅𝒂𝒚**:\n  **\`${dailyBakes} / 3\`**\n` +
    `**💗 𝑺𝒉𝒂𝒓𝒆𝒅 𝑪𝒐𝒖𝒏𝒕**: **\`${sharedCount}\`**`
  )
  .setThumbnail('https://harshtiwari47.github.io/kasiko-public/images/cookies-thumbnail.jpg')
  .setFooter({
    text: 'ʟᴇᴛ ᴛʜᴇ ꜱᴡᴇᴇᴛ ᴀʀᴏᴍᴀ ᴏꜰ ꜰʀᴇꜱʜʟʏ ʙᴀᴋᴇᴅ ᴄᴏᴏᴋɪᴇꜱ ꜰɪʟʟ ᴛʜᴇ ᴀɪʀ!'
  });

  return embed;
}

/**
* Build a "help" or "info" embed that displays additional cute info
* about baking and sharing cookies.
*/
function buildCookieHelpEmbed(message = null) {
  let description;
  if (message) {
    description = message;
  } else {
    description = `### <:cookie:1385131636613709905> Cookie Baking Guide\n` +
    `\`\`\`Bake up to 3 cookies/day, but there's a 50% burn chance!\`\`\`` +
    `**ᴛɪᴘ**: ꜱʜᴀʀᴇ ꜰᴏʀ ᴇxᴛʀᴀ ꜱᴡᴇᴇᴛɴᴇꜱꜱ ᴀɴᴅ ɢʀᴀᴛɪᴛᴜᴅᴇ.\n` +
    `𝑆𝑡𝑎𝑦 𝑐𝑜𝑧𝑦 & 𝑘𝑒𝑒𝑝 𝑏𝑎𝑘𝑖𝑛𝑔!`;
  }
  return new EmbedBuilder()
  .setColor('#ffe5d1')
  .setDescription(description)
  .setFooter({
    text: 'Baking with love since 2024'
  });
}

/**
* Build the row of buttons (only Bake now, no Check).
*/
function buildCookieButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('bake_cookie')
    .setLabel('🥠 Bake Cookie')
    .setStyle(ButtonStyle.Primary)
  );

  return [row];
}

// ==================================================
// ============ Main Command Execution ==============
// ==================================================

export async function execute(args = [], context) {
  try {
    const {
      username,
      id: userId,
      avatar,
      name
    } = discordUser(context);

    const ownerUsername = name || username;

    let targetUser = null;
    if (context?.mentions?.users?.size > 0) {
      targetUser = context.mentions.users.first();
    } else if (args && args.length > 0) {
      const candidate = (args[0] === 'cookie' || args[0] === 'cookies') ? args[1] : args[0];
      if (candidate) {
        if (typeof candidate === 'object' && candidate.id) {
          targetUser = candidate;
        } else if (typeof candidate === 'string' && candidate !== 'cookie' && candidate !== 'cookies') {
          const parsedId = Helper.extractUserId(candidate) || candidate.replace(/[<@!>]/g, '');
          if (parsedId && /^\d+$/.test(parsedId)) {
            targetUser = context.client?.users?.cache?.get(parsedId) || { id: parsedId, username: 'user' };
          }
        }
      }
    }

    // If target user specified => share logic
    if (targetUser && targetUser.id) {
      const shareResult = await shareCookie(userId, targetUser.id, ownerUsername);
      return await handleMessage(context, {
        content: shareResult.message
      });
    }

    // Otherwise, show two embeds:
    //  1) Stats embed
    //  2) Help embed
    const statsEmbed = await buildCookieStatsEmbed(userId);
    const helpEmbed = buildCookieHelpEmbed();
    const components = buildCookieButtons();

    // Send the two-embed message
    const controlMessage = await handleMessage(context, {
      embeds: [statsEmbed, helpEmbed],
      components
    });

    // Collector for button clicks (1 minute)
    const collector = controlMessage?.createMessageComponentCollector ? controlMessage.createMessageComponentCollector({
      time: 60 * 1000,
    }) : null;

    if (!collector) return;

    collector.on('collect', async (interaction) => {
      try {
        // Only the user who triggered the command can press (optional check)
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: `These cookies belong to <@${userId}>! Please use your own cookie command.`,
            ephemeral: true
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        await interaction.deferUpdate();

        if (interaction.customId === 'bake_cookie') {
          const bakeResult = await bakeCookie(userId);

          // Rebuild the embeds to reflect updated stats
          const updatedStatsEmbed = await buildCookieStatsEmbed(userId);
          const updatedHelpEmbed = buildCookieHelpEmbed(bakeResult.message); // Can remain same or add dynamic text

          await interaction.editReply({
            embeds: [updatedStatsEmbed, updatedHelpEmbed],
            components
          });

          return;
        }
      } catch (e) {
        if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
          console.error(e);
        }
      }
    });

    collector.on('end',
      async () => {
        try {
          if (!controlMessage) return;

          // Disable buttons after time expires
          const oldComponents = controlMessage?.components;
          if (!oldComponents || !oldComponents.length) return;

          const row = ActionRowBuilder.from(oldComponents[0]);
          row.components.forEach((btn) => btn.setDisabled(true));

          await controlMessage?.edit({
            components: [row],
          }).catch(() => {});
        } catch (err) {
          console.error('Error disabling cookie buttons:', err);
        }
      });
  } catch (err) {
    console.error('Error in cookie command:', err);
    sendErrorLog(err, {
      source: 'Cookie Command',
      commandName: 'cookie',
      user: context.author || context.user,
      guild: context.guild,
      channel: context.channel,
      interaction: context.isCommand ? context : null
    }).catch(() => {});
    return await handleMessage(context, "Oops! Something went wrong with the cookie command.");
  }
}

export default {
  name: 'cookie',
  description: 'Bake (up to 3/day), share, and check your cookies!',
  aliases: ['cookies'],
  args: '[mention user to share or none]',
  cooldown: 10000,
  emoji: "<:cookie:1385131636613709905>",
  category: '🍬 Explore',
  execute,
};