import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
} from 'discord.js';

import {
  Mining
} from '../../../models/Mining.js';
import {
  randomMetalsReward
} from "../horizon/dragon/powers.js";
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  checkPassValidity
} from "./pass.js";

const COAL_EMOJI = '<:coal:1312372037058170950>';
const COAL_VALUE = 300; // 1 coal = 100 cash

async function startMining(userId, username) {
  try {
    // Try to find the user's mining session from the database
    const userMining = await Mining.findOne({
      userId
    });

    // If the user is already mining, check time elapsed and potential overflow
    if (userMining && userMining.startTime) {
      const timeElapsedMillis = Date.now() - new Date(userMining.startTime);

      const days = Math.floor(timeElapsedMillis / (1000 * 60 * 60 * 24)); // Days
      const hours = Math.floor((timeElapsedMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); // Hours
      const minutes = Math.floor((timeElapsedMillis % (1000 * 60 * 60)) / (1000 * 60)); // Minutes

      let timeElapsed = '';
      if (days > 0) timeElapsed += `${days} day${days > 1 ? 's': ''} `;
      if (hours > 0) timeElapsed += `${hours} hour${hours > 1 ? 's': ''} `;
      if (minutes > 0) timeElapsed += `${minutes} minute${minutes > 1 ? 's': ''}`;

      return {
        content: `⛏️ **${username}**, you are already mining! Time elapsed: ${timeElapsed}.`
      }
    }

    // If no mining session exists, create a new one
    const updatedMining = await Mining.findOneAndUpdate(
      {
        userId
      },
      {
        startTime: new Date()
      },
      {
        upsert: true, new: true
      }
    );

    return {
      content: `**${username}**, you have started mining. You can collect resources every 10 minutes. Your storage capacity is **${10 + updatedMining.level * 5}** coal.`
    };
  } catch (error) {
    console.error("Error in startMining:", error);
    return {
      content: `<:warning:1366050875243757699> Something went wrong while starting your mining session. Please try again later.`
    }
  }
}

async function collectResources(userId, context, username) {
  try {
    const userMining = await Mining.findOne({
      userId
    });

    if (!userMining || !userMining.startTime) {
      return {
        content: `⛏️ **${username}**, you are not currently mining. Start mining with \`mine\`.`
      }
    }

    const timeElapsed = Math.floor((Date.now() - new Date(userMining.startTime)) / 600000); // Coal per 10 minutes
    if (timeElapsed <= 0) {
      return {
        content: `⛏️ Not enough time has passed to collect resources.`
      }
    }

    const coalToAdd = Math.min(timeElapsed + userMining.level, 10 + userMining.level * 5 - userMining.collected);
    if (coalToAdd <= 0) {
      return {
        content: `⛏️ **${username}**, your storage is full! Exchange coal or upgrade your level.`
      }
    }

    userMining.collected += coalToAdd;
    userMining.startTime = new Date();
    await userMining.save();

    let metalFound = null;

    if (Math.random() > 0.85) {
      metalFound = await randomMetalsReward(userId);
    }

    return {
      content: `**${username}**, you collected **${coalToAdd} ${COAL_EMOJI}**\nCurrent storage: **${userMining.collected} ${COAL_EMOJI}**\n${metalFound ? "𝘞𝘢𝘪𝘵, 𝘺𝘰𝘶’𝘷𝘦 𝘧𝘰𝘶𝘯𝘥 𝘴𝘰𝘮𝘦𝘵𝘩𝘪𝘯𝘨 𝘸𝘩𝘪𝘭𝘦 𝘮𝘪𝘯𝘪𝘯𝘨:" + metalFound: ""}`,
      collected: `${userMining.collected}`
    }
  } catch (e) {
    console.error(e);
    return {
      content: "<:warning:1366050875243757699> Something went wrong while collecting your mine."
    }
  }
}

async function exchangeCoal(userId, context, username) {
  try {
    const userMining = await Mining.findOne({
      userId
    });
    const userData = await getUserData(userId);

    if (!userMining || userMining.collected <= 0) {
      return await {
        content: `⛏️ **${username}**,
        you have no coal to exchange.`
      };
    }

    const coalExchanged = userMining.collected;
    let cashEarned = coalExchanged * COAL_VALUE;

    const passInfo = await checkPassValidity(userId);

    let additionalReward;
    if (passInfo.isValid) {
      additionalReward = 150 * coalExchanged;
      if (passInfo.passType === "titan") additionalReward = 100 * coalExchanged;
      cashEarned += additionalReward;
    }

    userData.cash += cashEarned;
    // Update UserData and reset collected coal
    await updateUser(userId, userData);

    userMining.collected = 0;
    await userMining.save();

    return {
      content: `**${username}**, you exchanged **${coalExchanged} ${COAL_EMOJI}** for <:kasiko_coin:1300141236841086977> **${cashEarned.toLocaleString()}** 𝒄𝒂𝒔𝒉.\n${passInfo.isValid ? `-# ◎ **+${additionalReward}** pass bonus `: ""}`,
      collected: true
    };
  } catch (e) {
    console.error(e);
    return {
      content: `<:warning:1366050875243757699> Something went wrong while exchanging your coals.\n-# **Error**: ${e.message}`
    };
  }
}

function mineHelp() {
  const embed = new EmbedBuilder()
  .setTitle("⛏️ Mining Help")
  .setDescription("Here are the commands to help you with mining:")
  .addFields(
    {
      name: "**`MINE`**", value: "Start your mining session. Check your current mining status, including level, storage capacity, and collected coal."
    },
    {
      name: "Buttons",
      value: "**`collect`**: Collect the coal you have gathered from your mining session. Collect coal every 10 minutes.\n\n**`exchange`**: Convert your coal into cash. One coal is equivalent to " + COAL_VALUE + " cash.\n\n**`upgrade`**: Upgrade your mining level to increase storage capacity and mining efficiency."
    }
  )
  .setFooter({
    text: "Use these commands to manage your mining. Happy mining!"
  });

  return {
    embeds: [embed]
  }
}

function generateMiningMessage(userMining, userLevel) {
  const storageCapacity = 10 + userMining.level * 5;
  let upgradeCost;

  if (userMining.level < 10) {
    upgradeCost = `<:kasiko_coin:1300141236841086977> ${(5000 * userMining.level).toLocaleString()}`;
  } else {
    const requiredUserLevel = 30 + ((userMining.level - 10) * 10);
    const coinCost = 5000 * userMining.level;
    const meetsLevel = (userLevel || 1) >= requiredUserLevel;
    upgradeCost = `<:kasiko_coin:1300141236841086977> ${coinCost.toLocaleString()} + Lv.${requiredUserLevel}${meetsLevel ? ' ✓' : ''}`;
  }

  return (
    `𝙇𝙚𝙫𝙚𝙡:** ${userMining.level}** <:aliens_hammer:1336344266242527294> 𝙐𝙥𝙜𝙧𝙖𝙙𝙚:** ${upgradeCost}**\n\n` +
    `<:coal_storage:1355034178470809661> 𝘾𝙖𝙥𝙖𝙘𝙞𝙩𝙮:** ${storageCapacity} ${COAL_EMOJI}**\n` +
    `<:dump_truck:1355034404036018309> 𝘾𝙤𝙡𝙡𝙚𝙘𝙩𝙚𝙙:** ${userMining.collected} ${COAL_EMOJI}**\n` +
    `<:excavator:1355034334033084577> 𝘼𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚 𝙩𝙤 𝘾𝙤𝙡𝙡𝙚𝙘𝙩:** ${userMining.availableCoal} ${COAL_EMOJI}**\n`
  );
}

async function viewMiningStatus(userId, context, username) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and message

  try {
    let miningStatus = await startMining(userId, username);

    const userMining = await Mining.findOne({
      userId
    });

    const userData = await getUserData(userId);
    const userLevel = userData?.level || 1;

    const timeElapsed = Math.floor((Date.now() - new Date(userMining.startTime)) / 600000); // Minutes divided by 10
    const availableCoal = Math.min(timeElapsed + userMining.level, 10 + userMining.level * 5 - userMining.collected);

    userMining.availableCoal = availableCoal;

    const mineHeader = new EmbedBuilder()
    .setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n\n-# <:reply:1368224908307468408> ${miningStatus.content}`)

    const embed = new EmbedBuilder()
    .setColor(`#ab6c38`)
    .setImage(`https://harshtiwari47.github.io/kasiko-public/images/mining-site.jpg`)
    .setDescription(generateMiningMessage(userMining, userLevel))

    let canCollect = true;

    const rowComp = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('collect_mine')
      .setLabel('Collect ⛏️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(canCollect ? false: true),
      new ButtonBuilder()
      .setCustomId('exchange_mine')
      .setLabel(`Exchange 💰`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false),
      new ButtonBuilder()
      .setCustomId('upgrade_mine')
      .setLabel(`Upgrade 🔼`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false),
      new ButtonBuilder()
      .setCustomId('mine_help')
      .setLabel(`Help`)
      .setEmoji({
        name: "❔"
      })
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false)
    );


    let responseMessage = await handleMessage(context, {
      embeds: [mineHeader, embed],
      components: [rowComp]
    });

    const collector = responseMessage?.createMessageComponentCollector ? responseMessage.createMessageComponentCollector({
      time: 120 * 1000,
    }) : null;

    if (!collector) return;

    let collectorEnded = false;

    collector.on('collect', async (interaction) => {
      if (interaction.replied || interaction.deferred) return; // Do not reply again
      try {
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: 'You are not allowed to interact!',
            ephemeral: true,
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        if (interaction.customId === 'collect_mine') {
          await interaction.deferUpdate();
          let response = await collectResources(interaction.user.id, interaction, interaction.user.username);

          if (response.collected) {
            userMining.availableCoal = 0;
            userMining.collected = response.collected;
          }

          if (response.content) {
            mineHeader.setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n-# <:reply:1368224908307468408> ${response.content}`);
          }

          return await interaction.editReply({
            embeds: [mineHeader, embed.setDescription(generateMiningMessage(userMining, userLevel))]
          })
        }

        if (interaction.customId === 'upgrade_mine') {
          await interaction.deferUpdate();
          let response = await upgradeMine(interaction.user.id, interaction.user.username);

          if (response.upgraded) {
            userMining.level = response.level;
          }

          if (response.content) {
            mineHeader.setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n-# <:reply:1368224908307468408> ${response.content}`);
          }

          return await interaction.editReply({
            embeds: [mineHeader, embed.setDescription(generateMiningMessage(userMining, userLevel))]
          })
        }

        if (interaction.customId === 'exchange_mine') {
          await interaction.deferUpdate();
          let response = await exchangeCoal(interaction.user.id, interaction, interaction.user.username);

          if (response.collected) {
            userMining.collected = 0;
          }

          if (response.content) {
            mineHeader.setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n-# <:reply:1368224908307468408> ${response.content}`);
          }

          return await interaction.editReply({
            embeds: [mineHeader, embed.setDescription(generateMiningMessage(userMining, userLevel))]
          })
        }

        if (interaction.customId === 'mine_help') {
          await interaction.deferReply({
            ephemeral: true
          });
          return await interaction.editReply(mineHelp());
        }

      } catch (err) {
        console.error(err)
        if (!interaction.deferred) await interaction.deferReply();
        await interaction.followUp({
          content: '<:warning:1366050875243757699> Something went wrong while performing mine command button!'
        });
      }
    });

    collector.on('end',
      async () => {
        await responseMessage.edit({
          components: []
        }).catch(() => {});
      })
  } catch (e) {
    console.error(e);
    await handleMessage(context,
      {
        content: "<:warning:1366050875243757699> Something went wrong while viewing your mine."
      });
    return;
  }
}

async function upgradeMine(userId, username) {
  try {
    const userMining = await Mining.findOne({
      userId
    });

    if (!userMining) {
      return {
        content: `⛏️ **${username}**, you haven't started mining yet. Start mining with \`mine\`.`
      }
    }

    const currentLevel = userMining.level;

    // Levels 1-10: coin-only upgrades
    if (currentLevel < 10) {
      const upgradeCost = 5000 * currentLevel;
      const userData = await getUserData(userId);

      if (userData.cash < upgradeCost) {
        return {
          content: `⛏️ **${username}**, you don't have enough cash to upgrade your mine. You need <:kasiko_coin:1300141236841086977> **${upgradeCost.toLocaleString()}** cash.`
        }
      }

      userData.cash -= upgradeCost;
      await updateUser(userId, userData);

      userMining.level += 1;
      const newCapacity = `${10 + userMining.level * 5}`;
      await userMining.save();

      return {
        content: `Congratulations! **${username}**, your mining level has increased to **Level ${userMining.level}**. Your new storage capacity is **${newCapacity} coal**. You spent <:kasiko_coin:1300141236841086977> **${upgradeCost.toLocaleString()} cash** on the upgrade.`,
        upgraded: true,
        level: userMining.level,
        newCost: 5000 * userMining.level,
        newCapacity
      };
    }

    // Levels 10+: require user level + coin cost
    // Level 11 needs user level 30, level 12 needs 40, level 13 needs 50, etc.
    const requiredUserLevel = 30 + ((currentLevel - 10) * 10);
    const userData = await getUserData(userId);
    const userLevel = userData.level || 1;

    if (userLevel < requiredUserLevel) {
      return {
        content: `⛏️ **${username}**, you need to be **Level ${requiredUserLevel}** to upgrade your mine to **Level ${currentLevel + 1}**. You are currently Level **${userLevel}**.\n-# Keep using commands to earn EXP and level up!`
      }
    }

    // Coin cost scales: 5000 * level for levels 11+
    const upgradeCost = 5000 * currentLevel;

    if (userData.cash < upgradeCost) {
      return {
        content: `⛏️ **${username}**, you don't have enough cash to upgrade your mine to **Level ${currentLevel + 1}**. You need <:kasiko_coin:1300141236841086977> **${upgradeCost.toLocaleString()}** cash and **Level ${requiredUserLevel}**.`
      }
    }

    userData.cash -= upgradeCost;
    await updateUser(userId, userData);

    userMining.level += 1;
    const newCapacity = `${10 + userMining.level * 5}`;
    await userMining.save();

    const nextRequiredLevel = 30 + ((userMining.level - 10) * 10);

    return {
      content: `Congratulations! **${username}**, your mining level has increased to **Level ${userMining.level}**. Your new storage capacity is **${newCapacity} coal**.\n-# Cost: <:kasiko_coin:1300141236841086977> **${upgradeCost.toLocaleString()}** · Next upgrade requires Level **${nextRequiredLevel}**`,
      upgraded: true,
      level: userMining.level,
      newCost: 5000 * userMining.level,
      newCapacity
    };
  } catch (error) {
    console.error("Error in upgradeMine:", error);
    return {
      content: "<:warning:1366050875243757699> Something went wrong while upgrading your mine. Please try again later."
    }
  }
}

export default {
  name: "mine",
  description: "Start mining, collect resources, or exchange coal for cash. Command `mine` for more info!",
  aliases: [],
  emoji: "<:excavator:1355034334033084577>",
  category: "🍬 Explore",
  cooldown: 10000,
  execute: async (args, context) => {
    try {

      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

      return await viewMiningStatus(userId, context, name);
    } catch (e) {
      console.error(e);
      return await handleMessage(context, `<:warning:1366050875243757699> Oops, something went wrong in mining!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },
};