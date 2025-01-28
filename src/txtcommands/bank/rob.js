import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder,
  DiscordAPIError
} from 'discord.js';
import {
  logError
} from '../../../logger.js'; // Custom logging function for errors
import {
  checkTimeGap
} from '../../../helper.js';

export async function attemptRobbery(userId, targetUserId, message) {
  try {
    // Get user data (cash) and target data
    const userData = await getUserData(userId);
    const targetData = await getUserData(targetUserId);

    const userCash = userData.cash;
    const targetCash = targetData.cash;

    // The robber needs more than 5000 cash to attempt a robbery
    if (userCash < 5000) {
      return message.channel.send("You need at least <:kasiko_coin:1300141236841086977> **5000** cash to attempt a robbery!");
    }

    if (userData.lastRobbery && checkTimeGap(userData.lastRobbery, Date.now()) < 12) {
      const remainingTime = 12 - checkTimeGap(userData.lastRobbery, Date.now(), {
        format: 'hours'
      }).toFixed(2);
      return message.channel.send(`<@${userId}>, you cannot rob again for another ${remainingTime.toFixed(1)} hours.`);
    }

    userData.lastRobbery = Date.now();

    const robberyAmount = Math.floor(targetCash * 0.1); // Victim loses 10% of their cash
    const num1 = Math.floor(Math.random() * 500) + 1; // Random number under 1000 for difficulty
    const num2 = Math.floor(Math.random() * 500) + 1; // Random number under 1000 for difficulty
    const correctAnswer = num1 + num2;

    // Create the exciting embed for the robbery
    const embed = new EmbedBuilder()
    .setColor('#980707') // Spicy red color
    .setTitle('👀🗝️ **𝐑𝐨𝐛𝐛𝐞𝐫𝐲 𝐀𝐭𝐭𝐞𝐦𝐩𝐭!**')
    .setDescription(
      `**${message.author.username}**, you're attempting to **rob** **${message.mentions.users.first().username}**! 🙀\n` +
      `Before you strike, solve this quick puzzle to **succeed**:\nWhat is **${num1} + ${num2}**? 💡`
    )
    .addFields(
      {
        name: '⚠️ **Be careful**!', value: 'If you fail, you risk getting caught and losing your cash!'
      },
      {
        name: '⏳ **Time is ticking**...', value: 'Answer within **25 seconds** or the law catches up with you!'
      }
    )
    .setFooter({
      text: 'Good luck! You might need it... 🔥'
    })
    .setTimestamp();

    const robberyMessage = await message.channel.send({
      embeds: [embed]
    });

    // Start collecting the input from the robber
    const filter = response => response.author.id === userId || response.author.id === targetUserId; // Only collect the robber's response
    const collector = message.channel.createMessageCollector({
      filter,
      time: 25000, // 25 seconds for the robbery attempt
      max: 1, // Only collect one response
      errors: ['time'] // Handle timeout error
    });

    collector.on('collect', async (response) => {
      const answer = parseInt(response.content, 10);
      if (answer === correctAnswer && response.author.id !== targetUserId) {

        // Successful robbery logic
        const caughtChance = Math.random();
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(2000); // Delay for suspense
        await robberyMessage.edit(`${message.author.username} is entering the victim's cash values...`);

        await delay(4000); // Delay for suspense
        await robberyMessage.edit(`${message.author.username} is putting money in their bag...`);

        if (caughtChance < 0.3) {
          // 30% chance of getting caught
          const penalty = Math.floor(userCash * 0.1);
          userData.cash = userCash - penalty;
          targetData.cash = targetCash + penalty;

          await updateUser(userId, userData);
          await updateUser(targetUserId, targetData);

          const caughtEmbed = new EmbedBuilder()
          .setColor('#ff3333')
          .setTitle('🚔 **𝐂𝐨𝐫𝐫𝐞𝐜𝐭 𝐁𝐮𝐭 𝐂𝐚𝐮𝐠𝐡𝐭!**')
          .setDescription(
            `**${message.author.username}**, you got caught in the act! 😨\n` +
            `You were too slow, and the police took your **10% cash** as punishment. 🚨`
          )
          .addFields(
            {
              name: '💰 **Penalty:**', value: `You lost <:kasiko_coin:1300141236841086977> **${penalty.toLocaleString()}** cash.`
            },
            {
              name: '💵 **Victim Rewarded:**', value: `${message.mentions.users.first().username} received <:kasiko_coin:1300141236841086977> **${penalty.toLocaleString()}** cash.`
            }
          )
          .setFooter({
            text: 'Better luck next time... 🔥'
          })
          .setTimestamp();

          return robberyMessage.edit({
            embeds: [caughtEmbed]
          });
        } else {
          // Successful robbery with realistic reward
          const successAmount = Math.floor(robberyAmount * 0.8); // Robber gets 80% of the victim's loss
          const randomPercentage = Math.floor(Math.random() * 6) + 5; // Random percentage between 5-10%
          const bonusReward = Math.floor(targetCash * (randomPercentage / 100));

          userData.cash = userCash + successAmount + bonusReward;
          targetData.cash = targetCash - robberyAmount;

          await updateUser(userId, userData);
          await updateUser(targetUserId, targetData);

          const successEmbed = new EmbedBuilder()
          .setColor('#32cd32') // Green for success
          .setTitle('🎉 **𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐑𝐨𝐛𝐛𝐞𝐫𝐲!**')
          .setDescription(
            `**${message.author.username}** successfully robbed <:kasiko_coin:1300141236841086977> **${(successAmount + bonusReward).toLocaleString()}** from **${message.mentions.users.first().username}**! 💰💥`
          )
          .addFields(
            {
              name: '💰 **You took:**', value: `<:kasiko_coin:1300141236841086977> **${(successAmount + bonusReward).toLocaleString()}** cash`
            },
            {
              name: '💵 **Victim lost:**', value: `<:kasiko_coin:1300141236841086977> **${robberyAmount.toLocaleString()}** cash`
            }
          )
          .setFooter({
            text: 'Enjoy your spoils! 🤑'
          })
          .setTimestamp();

          return robberyMessage.edit({
            embeds: [successEmbed]
          });
        }
      } else if (response.author.id === targetUserId && answer === correctAnswer) {
        // Failed robbery attempt
        const penalty = Math.floor(userCash * 0.1);

        userData.cash = userCash - penalty;
        targetData.cash = targetCash + penalty;

        await updateUser(userId, userData);
        await updateUser(targetUserId, targetData);

        const robberyFailedEmbed = new EmbedBuilder()
        .setColor('#ff0000') // Red for failure
        .setTitle('❌ **𝑹𝒐𝒃𝒃𝒆𝒓𝒚 𝑭𝒂𝒊𝒍𝒆𝒅!**')
        .setDescription(
          `**${message.author.username}**, your robbery attempt has failed!\n` +
          `**${message.mentions.users.first().username}** managed to answer correctly in time! 🎯`
        )
        .addFields(
          {
            name: '<:kasiko_coin:1300141236841086977> **No Cash Taken:**',
            value: `You didn't manage to steal any money. Better luck next time!`
          }
        )
        .setFooter({
          text: 'The puzzle master wins! 🏆'
        })
        .setTimestamp();

        return robberyMessage.edit({
          embeds: [robberyFailedEmbed]
        });
      } else if (response.author.id !== targetUserId) {
        // Failed robbery attempt
        const penalty = Math.floor(userCash * 0.1);

        userData.cash = userCash - penalty;
        targetData.cash = targetCash + penalty;

        await updateUser(userId, userData);
        await updateUser(targetUserId, targetData);

        const failEmbed = new EmbedBuilder()
        .setColor('#ff3333') // Red for failure
        .setTitle('🚨 **𝐘𝐨𝐮 𝐆𝐨𝐭 𝐂𝐚𝐮𝐠𝐡𝐭!**')
        .setDescription(
          `**${message.author.username}**, you failed to solve the puzzle! 😱\n` +
          `The victim's security team caught you, and you lost **10% of your cash**.`
        )
        .addFields(
          {
            name: '💰 **Penalty:**', value: `You lost <:kasiko_coin:1300141236841086977> **${penalty.toLocaleString()}** cash.`
          },
          {
            name: '💵 **Victim Rewarded:**', value: `${message.mentions.users.first().username} <:kasiko_coin:1300141236841086977> received **${penalty.toLocaleString()}** cash.`
          }
        )
        .setFooter({
          text: 'Better luck next time... 🔥'
        })
        .setTimestamp();

        return robberyMessage.edit({
          embeds: [failEmbed]
        });
      }
    });

    collector.on('end',
      (collected, reason) => {
        if (reason === 'time') {
          const timeoutEmbed = new EmbedBuilder()
          .setColor('#231c00') // Yellow for timeout
          .setTitle('⏳ **𝐓𝐢𝐦𝐞 𝐢𝐬 𝐮𝐩!** ')
          .setDescription(
            `**${message.author.username}**, you ran out of time to solve the puzzle!\n` +
            `You missed your chance to rob **${message.mentions.users.first().username}**. 😞`
          )
          .addFields(
            {
              name: '<:kasiko_coin:1300141236841086977> **No Cash Taken:**', value: `No cash was taken, but the opportunity is lost!`
            }
          )
          .setFooter({
            text: 'Better luck next time! 🕰️'
          })
          .setTimestamp();

          return robberyMessage.edit({
            embeds: [timeoutEmbed]
          });
        }
      });
  } catch (error) {
    console.error("Error during robbery: ",
      error);
    return message.channel.send("🚨 **An unexpected error occurred. Please try again later.**");
  }
}

export default {
  name: "rob",
  description: "Rob another player by attempting to steal currency. If successful, you gain part of their cash.",
  aliases: [],
  args: "<target>",
  example: ["rob @player"],
  cooldown: 43200000,
  category: "🏦 Economy",
  related: ["give", "bank"],
  execute: async (args,
    message) => {
    const action = args[0] ? args[0].toLowerCase(): null;

    if (action === "rob") {
      if (!message.mentions.users.size) {
        return message.channel.send("Please mention a valid user to rob.");
      }
      const targetUser = message.mentions.users.first();
      if (targetUser.id === message.author.id) {
        return message.channel.send("You cannot rob yourself.");
      }

      // Call a function to attempt robbery with math challenge
      return attemptRobbery(message.author.id, targetUser.id, message);
    }
  }
}