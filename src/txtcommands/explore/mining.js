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
} from "./dragon/powers.js";
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper
} from '../../../helper.js';

const COAL_EMOJI = '<:coal:1312372037058170950>';
const COAL_VALUE = 100; // 1 coal = 100 cash

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data);
  } else {
    return context.send(data);
  }
}

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
      content: `⚠️ Something went wrong while starting your mining session. Please try again later.`
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
      content: `**${username}**, you collected **${coalToAdd} ${COAL_EMOJI}**\nCurrent storage: **${userMining.collected} ${COAL_EMOJI}**\n${metalFound ? "Wait, you’ve found something while mining:" + metalFound: ""}`,
      collected: `${userMining.collected}`
    }
  } catch (e) {
    console.error(e);
    return {
      content: "⚠️ Something went wrong while collecting your mine."
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
    const cashEarned = coalExchanged * COAL_VALUE;

    userData.cash += cashEarned;
    // Update UserData and reset collected coal
    await updateUser(userId, userData);

    userMining.collected = 0;
    await userMining.save();

    return {
      content: `**${username}**, you exchanged **${coalExchanged} ${COAL_EMOJI}** for <:kasiko_coin:1300141236841086977> **${cashEarned.toLocaleString()} cash**.`,
      collected: true
    };
  } catch (e) {
    console.error(e);
    return {
      content: "⚠️ Something went wrong while exchanging your coals."
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

async function viewMiningStatus(userId, context, username) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and message

  try {
    let miningStatus = await startMining(userId, username);

    const userMining = await Mining.findOne({
      userId
    });

    const timeElapsed = Math.floor((Date.now() - new Date(userMining.startTime)) / 600000); // Minutes divided by 10
    const availableCoal = Math.min(timeElapsed + userMining.level, 10 + userMining.level * 5 - userMining.collected);

    const mineHeader = new EmbedBuilder()
    .setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n${miningStatus.content}`)

    const embed = new EmbedBuilder()
    .setColor(0x17140f)
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/coal-mine.jpg`)
    .addFields(
      {
        name: "Level", value: `${userMining.level}`, inline: true
      },
      {
        name: "Storage Capacity", value: `${10 + userMining.level * 5} ${COAL_EMOJI}`, inline: true
      },
      {
        name: "Collected", value: `${userMining.collected} ${COAL_EMOJI}`, inline: true
      },
      {
        name: "Available to Collect", value: `${availableCoal} ${COAL_EMOJI}`, inline: true
      },
      {
        name: "Upgrade Cost", value: `<:kasiko_coin:1300141236841086977> ${(5000 * userMining.level).toLocaleString()}`, inline: true
      }
    )
    .setFooter({
      text: "Happy Mining!"
    });

    let canCollect = true;

    const rowComp = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('collect_mine')
      .setLabel('Collect ⛏️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(canCollect ? false: true),
      new ButtonBuilder()
      .setCustomId('upgrade_mine')
      .setLabel(`Upgrade 🔼`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false),
      new ButtonBuilder()
      .setCustomId('exchange_mine')
      .setLabel(`Exchange 💰`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false),
      new ButtonBuilder()
      .setCustomId('mine_help')
      .setLabel(`⚠️`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false)
    );


    let responseMessage = await handleMessage(context, {
      embeds: [mineHeader, embed],
      components: [rowComp]
    });

    const collector = responseMessage.createMessageComponentCollector({
      time: 120 * 1000,
    });

    let collectorEnded = false;

    collector.on('collect', async (interaction) => {
      if (interaction.replied || interaction.deferred) return; // Do not reply again
      try {
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: 'You are not allowed to interact!',
            ephemeral: true,
          });
        }

        if (interaction.customId === 'collect_mine') {
          await interaction.deferUpdate();
          let response = await collectResources(interaction.user.id, interaction, interaction.user.username);

          const fields = embed.data.fields;
          if (response.collected) {
            fields[2].value = `${response.collected}`;
            fields[3].value = `0`;
          }

          if (response.content) {
            mineHeader.setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n${response.content}`);
          }

          return await interaction.editReply({
            embeds: [mineHeader, embed.setFields(fields)]
          })
        }

        if (interaction.customId === 'upgrade_mine') {
          await interaction.deferUpdate();
          let response = await upgradeMine(interaction.user.id, interaction.user.username);

          const fields = embed.data.fields;
          if (response.upgraded) {
            fields[0].value = `${response.level}`;
            fields[1].value = `${response.newCapacity}`;
            fields[4].value = "<:kasiko_coin:1300141236841086977> " + response.newCost;
          }

          if (response.content) {
            mineHeader.setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n${response.content}`);
          }

          return await interaction.editReply({
            embeds: [mineHeader, embed.setFields(fields)]
          })
        }

        if (interaction.customId === 'exchange_mine') {
          await interaction.deferUpdate();
          let response = await exchangeCoal(interaction.user.id, interaction, interaction.user.username);

          const fields = embed.data.fields;
          if (response.collected) {
            fields[2].value = `0`;
          }

          if (response.content) {
            mineHeader.setDescription(`## <:mine:1323958606814515202> 𝐌𝐢𝐧𝐢𝐧𝐠 𝐒𝐭𝐚𝐭𝐮𝐬\n${response.content}`);
          }

          return await interaction.editReply({
            embeds: [mineHeader, embed.setFields(fields)]
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
          content: '⚠️ Something went wrong while performing mine command button!'
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
        content: "⚠️ Something went wrong while viewing your mine."
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

    const maxLevel = 10;
    if (userMining.level >= maxLevel) {
      return {
        content: `⛏️ **${username}**, you have already reached the maximum mining level!`
      }
    }

    const upgradeCost = 5000 * userMining.level;

    const userData = await getUserData(userId);

    // Check if the user has enough cash for the upgrade
    if (userData.cash < upgradeCost) {
      return {
        content: `⛏️ **${username}**, you don't have enough cash to upgrade your mine. You need **${upgradeCost} cash**.`
      }
    }

    // Deduct the cash for the upgrade
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
  } catch (error) {
    console.error("Error in upgradeMine:", error);
    return {
      content: "⚠️ Something went wrong while upgrading your mine. Please try again later."
    }
  }
}

export default {
  name: "mine",
  description: "Start mining, collect resources, or exchange coal for cash. Type `mine help` for more info!",
  aliases: [],
  category: "🌱 Explore",
  cooldown: 100000,
  execute: async (args, message) => {
    try {
      const action = args[1] ? args[1].toLowerCase(): null;

      if (!args[1]) {
        return await viewMiningStatus(message.author.id, message.channel, message.author.username);
      }

      switch (action) {
      case "start":
        return await startMining(message.author.id, message.author.username);
        break;
      case "help":
        return await message.channel.send(mineHelp());
        break;
      default:
        return await viewMiningStatus(message.author.id, message.channel, message.author.username);
      }
    } catch (e) {
      console.error(e);
      return message.channel.send(`⚠️ Oops, something went wrong in mining!`)
    }
  },
};