import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import Pass from '../../../models/Pass.js';
import PromoCode from '../../../models/Promo.js';
import winston from 'winston';
import UserPet from "../../../models/Pet.js";

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({
      timestamp, level, message
    }) =>
      `${timestamp} [${level.toUpperCase()}]: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

/**
* Global helper to send messages that works for both interactions and messages.
* @param {Object} context - The message or interaction context.
* @param {Object} data - Data to be sent.
*/
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply().catch(err => {
        if (![50001, 50013, 10008].includes(err.code)) console.error(err);
      });
    }
    return context.editReply(data).catch(err => {
      if (![50001, 50013, 10008].includes(err.code)) console.error(err);
    });
  } else {
    return context.channel.send(data).catch(err => {
      if (![50001, 50013, 10008].includes(err.code)) console.error(err);
    });
  }
}

const PassEmojis = {
  titan: "<:titan:1346760526201491456>",
  pheonix: "<:phoenix:1346761616812937217>",
  etheral: "<:ethereal:1346762698800627806>",
  celestia: "<:celestia:1346763143912886312>"
};

// Utility: generate a unique promo code string
function generateUniqueCode(length = 16) {
  let code = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$&-+~';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generatePassDetailsMessage (username, result) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setLabel('❔ FEATURES')
    .setStyle(ButtonStyle.Link)
    .setURL('https://discord.gg/DVFwCqUZnc')
  );

  return {
    content: `# ✦ 🜲 **Hail, ${username}! Your Pass is Active!** <:emoji_35:1332676884093337603>.𖥔 ݁ ˖\n\n` +
    `## ╰—➤ ${PassEmojis[result.passType]} **${result.passType}**\n\n` +
    `- **⌛ Expiry Date:** *${result.expiryDate}*  \n` +
    `- **❤️ Eternal Gratitude:** *You are truly appreciated!*\n` +
    `⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖`,
    components: [buttonRow]
  }
}

/**
* Check if a user has an active pass for the current month.
* @param {string} userId - The user's ID.
*/
export async function checkPassValidity(userId) {
  try {
    const now = new Date();
    // Find a pass that has not expired (expiryDate is in the future)
    const userPass = await Pass.findOne({
      userId,
      expiryDate: {
        $gt: now
      }
    });
    if (userPass) {
      // Format expiry date as "day month year" (e.g., "15 August 2025")
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      const formattedExpiryDate = new Date(userPass.expiryDate).toLocaleDateString('en-US', options);
      return {
        isValid: true,
        passType: userPass.plan,
        expiryDate: formattedExpiryDate,
        emoji: PassEmojis[userPass.plan]
      };
    }
    return {
      isValid: false,
      passType: null,
      expiryDate: null,
      emoji: null
    };
  } catch (error) {
    logger.error(`Error in checkPassValidity: ${error.message}`);
    return {
      isValid: false,
      passType: null,
      expiryDate: null,
      emoji: null
    };
  }
}

async function claimPet(userId) {
  try {
    let userPetData = await UserPet.findOne({
      id: userId
    });

    // If the user doesn't have a record, create a new one.
    if (!userPetData) {
      userPetData = new UserPet( {
        id: userId,
        pets: []
      });
    }

    // Check if the pet is already claimed
    const petExists = userPetData.pets.some(pet => pet.petId === "dog1");
    if (petExists) {
      return `**<@${userId}>**, you have already claimed this pet.`;
    }

    // Add the new pet to the user's pet data.
    userPetData.pets.push({
      name: "bob",
      type: "dog",
      level: 1,
      feed: 0,
      lastFeed: null,
      lastWalkTime: null,
      lastPatTime: null,
      lastExercise: null,
      petId: "dog1",
      exp: 201
    });

    await userPetData.save();
    return `**<@${userId}>**, successfully claimed pet!`;
  } catch (e) {
    return "An error occurred while claiming the pet.";
  }
}

// Sample benefits data for each plan
const benefitsData = [{
  plan: 'titan',
  title: 'Titan Benefits',
  description: "- Earn an extra 10% on daily rewards\n" +
  "- Receive a Titan profile color and badge\n" +
  "- Enjoy an extra 16% on your aquarium collection\n" +
  "- Exchange coal at a rate of 400 per unit\n" +
  "- Obtain 15 hunting bullets daily"
},
  {
    plan: 'pheonix',
    title: 'Pheonix Benefits',
    description: "- Earn an extra 15% on daily rewards\n" +
    "- Receive a 16% discount on bank upgrade\n" +
    "- Earn an extra 25% on daily ice rewards\n" +
    "- Receive an exclusive Phoenix profile color and badge\n" +
    "- Enjoy an extra 26% on your aquarium collection\n" +
    "- Obtain 20 hunting bullets\n" +
    "- Exchange coal at a rate of 450 per unit\n" +
    "- Hold stocks in up to 8 companies"
  },
  {
    plan: 'etheral',
    title: 'Etheral Benefits',
    description: "- All Phoenix benefits\n" +
    "- Receive a 33% discount on bank upgrade\n" +
    "- Obtain an exclusive Etheral badge and profile color\n" +
    "- Work up to 50 times per day\n" +
    "- Access exclusive cars and houses\n" +
    "- New exclusive animals available for hunting: Panda, Kangaroo, Bear\n" +
    "- High security: Increases the chance of failed robbery attempts on you to 50%\n" +
    "- Own an exclusive dog pet (Use: `pass pet`)"
  },
  {
    plan: 'celestia',
    title: 'Celestia Benefits',
    description: "- All Etheral benefits\n" +
    "- Receive an exclusive Celestia profile color and badge\n" +
    "- Can request a custom profile color\n" +
    "- Receive a custom pet\n" +
    "- Exclusive animals available for hunting: T-Rex, Saber-Tooth, Dragon, Unicorn\n" +
    "- Showcase a private jet\n" +
    "- Can request a custom description for your own company\n" +
    "- Can request some special commands"
  }];

/**
* Display paginated benefits.
* Each embed now includes the username of the requester.
*/
async function showBenefits(context) {
  let currentPage = 0;
  const totalPages = benefitsData.length;
  const username = context.author ? context.author.username: context.user.username;

  function generateEmbed(page) {
    const benefit = benefitsData[page];
    return new EmbedBuilder()
    .setTitle(benefit.title)
    .setDescription(benefit.description)
    .setFooter({
      text: `User: ${username} | Plan: ${benefit.plan.toUpperCase()} | Page ${page + 1} of ${totalPages}`
    });
  }

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('prev_benefit')
    .setLabel('Previous')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true),
    new ButtonBuilder()
    .setCustomId('next_benefit')
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(totalPages <= 1)
  );

  const replyMsg = await handleMessage(context,
    {
      embeds: [generateEmbed(currentPage)],
      components: [buttons]
    });

  const collector = replyMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000
  });

  collector.on('collect',
    async (interaction) => {
      if ((interaction.user.id !== (context.author ? context.author.id: context.user.id))) {
        return interaction.reply({
          content: `Sorry ${interaction.user.username}, this is not your session.`, ephemeral: true
        });
      }
      if (interaction.customId === 'next_benefit') {
        currentPage = Math.min(currentPage + 1, totalPages - 1);
      } else if (interaction.customId === 'prev_benefit') {
        currentPage = Math.max(currentPage - 1, 0);
      }
      buttons.components[0].setDisabled(currentPage === 0);
      buttons.components[1].setDisabled(currentPage === totalPages - 1);
      await interaction.update({
        embeds: [generateEmbed(currentPage)],
        components: [buttons]
      });
    });
}

/**
* Main command handler function.
* Uses handleMessage to reply so that both slash commands and regular messages are supported.
*/
export async function execute(args,
  message,
  client) {
  const context = message;
  const username = context.author ? context.author.username: context.user.username;
  // For simplicity, we hardcode the owner ID here (replace with your own or use a config variable)
  const ownerId = '1318158188822138972';
  const subCommand = args[1]?.toLowerCase();

  try {
    switch (subCommand) {
      case 'activate': {
        // Only the owner can activate a pass manually.
        const requesterId = context.author ? context.author.id: context.user.id;
        if (requesterId !== ownerId) {
          return await handleMessage(context, {
            content: `${username}, you are not authorized to activate passes.`
          });
        }
        // Usage: pass activate @user <plan>
        const targetUser = context.mentions?.users?.first() || (context.options && context.options.target);
        const plan = args[2]?.toLowerCase();
        if (!targetUser || !['titan', 'pheonix', 'etheral', 'celestia'].includes(plan)) {
          return await handleMessage(context, {
            content: `${username}, Usage: \`pass activate <plan> @user\` (plans: titan, pheonix, etheral, celestia)`
          });
        }
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        try {
          // Atomically update (or insert) a pass only if the existing one is expired or does not exist.
          await Pass.updateOne(
            {
              userId: targetUser.id,
              // Only match if the current pass is expired or missing
              $or: [{
                expiryDate: {
                  $lte: now
                }
              },
                {
                  expiryDate: {
                    $exists: false
                  }
                }]
            },
            {
              $set: {
                plan,
                activeDate: now,
                expiryDate,
                premium: plan !== 'titan'
              }
            },
            {
              upsert: true
            }
          );
          return await handleMessage(context, {
            content: `${username}, Activated **${plan}** pass for **${targetUser.tag}**. Your pass will expire on ${expiryDate.toLocaleDateString()}.`
          });
        } catch (error) {
          // If an error is thrown (for example, due to a unique constraint) then an active pass already exists.
          return await handleMessage(context, {
            content: `${username}, ${targetUser.tag} already has an active pass.`
          });
        }
      }

      case 'redeem': {
          // Usage: pass redeem <code>
          const code = args[2];
          if (!code) {
            return await handleMessage(context, {
              content: `${username}, please provide a promo code to redeem. Usage: \`pass redeem <code>\``
            });
          }
          const promo = await PromoCode.findOne({
            code
          });
          if (!promo) {
            return await handleMessage(context, {
              content: `${username}, Invalid promo code.`
            });
          }
          if (promo.user) {
            return await handleMessage(context, {
              content: `${username}, This promo code has already been redeemed.`
            });
          }
          const now = new Date();
          const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const userId = context.author ? context.author.id: context.user.id;

          try {
            await Pass.updateOne(
              {
                userId,
                $or: [{
                  expiryDate: {
                    $lte: now
                  }
                },
                  {
                    expiryDate: {
                      $exists: false
                    }
                  }]
              },
              {
                $set: {
                  plan: promo.plan,
                  activeDate: now,
                  expiryDate,
                  premium: promo.plan !== 'titan'
                }
              },
              {
                upsert: true
              }
            );
            promo.user = userId; // Mark the promo as redeemed.
            await promo.save();
            return await handleMessage(context, {
              content: `<:emoji_35:1332676884093337603> **${username}**, thank you for redeeming your promo code!\n### Your ${PassEmojis[promo.plan]} **${promo.plan}** pass is now active until **${expiryDate.toLocaleDateString()}**! 🎊\n💫 Enjoy your journey!`
            });
          } catch (error) {
            return await handleMessage(context, {
              content: `${username}, you already have an active pass.`
            });
          }
        }

      case 'createpromo': {
          // Owner-only command to generate a promo code.
          const requesterId = context.author ? context.author.id: context.user.id;
          if (requesterId !== ownerId) {
            return await handleMessage(context, {
              content: `${username}, you are not authorized to create promo codes.`
            });
          }
          const plan = args[2]?.toLowerCase();
          if (!['titan', 'pheonix', 'etheral', 'celestia'].includes(plan)) {
            return await handleMessage(context, {
              content: `${username}, Invalid plan. Valid plans: titan, pheonix, etheral, celestia.`
            });
          }
          const code = generateUniqueCode();
          const newPromo = new PromoCode( {
            code, plan
          });
          await newPromo.save();
          return await handleMessage(context, {
            content: `**${username}**, Promo code for ${PassEmojis[plan]} **${plan}** pass created: **${code}**`
          });
        }
      case 'benefits': {
          // Show paginated list of premium benefits.
          return showBenefits(context);
        }
      case 'check': {
          // Check and show current pass validity for the user.
          const userId = context.author ? context.author.id: context.user.id;
          const result = await checkPassValidity(userId);
          if (result.isValid) {

            return await handleMessage(context, generatePassDetailsMessage(username, result));
          } else {
            return await handleMessage(context, {
              content: `**${username}**, you do not have an active pass.`
            });
          }
        }
      case 'pet': {
          const userId = context.author ? context.author.id: context.user.id;
          const result = await checkPassValidity(userId);
          if (result.isValid && (result.passType === "etheral" || result.passType === "celestia")) {
            let message = await claimPet(userId);
            return await handleMessage(context, {
              content: message
            });
          } else {
            return await handleMessage(context, {
              content: `**${username}**, you do not have an active pass, or your pass must be etheral an etheral or Celestia pass.`
            });
          }
        }
      default: {
          // Help embed with premium commands and a working "Check Subscription" button.
          const blastEmoji = '🗯️';
          const commandsEmbed = new EmbedBuilder()
          .setTitle("💫 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 𝗣𝗮𝘀𝘀 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀")
          .setDescription(
            `**★ Unlock Your Experience ★**\n\n` +
            `${blastEmoji} **pass redeem <code>**\n` +
            `${blastEmoji} **pass benefits**\n` +
            `${blastEmoji} **pass check**`
          )
          .setThumbnail('https://example.com/commands-thumbnail.png');
          const plansEmbed = new EmbedBuilder()
          .setTitle("𝙀𝙡𝙞𝙩𝙚 𝙋𝙧𝗲𝗺𝗶𝘂𝗺 𝙋𝗹𝗮𝗻𝘀 ✧")
          .setDescription(
            `**Our Exclusive Plans:**\n` +
            `## ${PassEmojis.titan} **Titan**\n` +
            `## ${PassEmojis.pheonix} **Pheonix**\n` +
            `## ${PassEmojis.etheral} **Etheral**\n` +
            `## ${PassEmojis.celestia} **Celestia**`
          )
          .setColor('#c8e2e9')
          .setThumbnail('https://example.com/plans-thumbnail.png');
          // Action row with buttons – note the "Check Subscription" button now has a customId that we listen for.
          const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('checkSubscription')
            .setLabel('🔎 Check Subscription')
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setLabel('🛍️ Buy')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/DVFwCqUZnc')
          );
          const replyMsg = await handleMessage(context, {
            embeds: [commandsEmbed, plansEmbed], components: [buttonRow]
          });
          // Create a collector for the "Check Subscription" button.
          const collector = replyMsg.createMessageComponentCollector({
            componentType: ComponentType.Button, time: 60000
          });

          collector.on('collect', async (interaction) => {
            if (interaction.customId === 'checkSubscription') {
              const userId = interaction.user.id;
              const result = await checkPassValidity(userId);
              if (result.isValid) {
                await interaction.reply(generatePassDetailsMessage(username, result));
              } else {
                await interaction.reply({
                  content: `${interaction.user.username}, you do not have an active pass for this month.`, ephemeral: true
                });
              }
            }
          });
          break;
        }
    }
  } catch (error) {
    logger.error(`Error in pass command: ${error.message}`);
    return await handleMessage(context,
      {
        content: `${username}, an error occurred while processing the pass command.`
    });
}
}

export default {
name: 'pass',
description: 'New Pass Handling System (activate, redeem, createpromo, rewards, benefits, check)',
aliases: ['royalpass', 'pass'],
args: '<redeem|rewards|benefits|check>',
cooldown: 10000,
emoji: "⭐",
category: 'Pass',
execute,
};