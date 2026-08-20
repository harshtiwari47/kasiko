import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder,
  DiscordAPIError,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  logError
} from '../../../logger.js'; // Custom logging function for errors
import {
  checkTimeGap,
  formatTTL,
  discordUser,
  handleMessage,
  Helper
} from '../../../helper.js';

import {
  checkPassValidity
} from "../explore/pass.js";

export async function attemptRobbery(userId, targetUserId, message) {
  try {
    const { username } = discordUser(message);
    if (!message.author) {
      message.author = message.user || { id: userId, username, displayAvatarURL: () => '' };
    }
    if (message.isCommand || message.isChatInputCommand || !message.channel?.send) {
      message.channel = {
        guild: message.guild,
        send: (data) => handleMessage(message, data)
      };
    }

    // Get user data (cash) and target data
    const userData = await getUserData(userId);
    const targetData = await getUserData(targetUserId);

    if (!userData) return;
    if (!targetData) {
      return handleMessage(message, `ⓘ **${username}**, mentioned user is not found!`);
    };

    const userCash = (userData.cash || 0);
    const targetCash = (targetData.cash || 0);

    // The robber needs more than 5000 cash to attempt a robbery
    if (userCash < 5000) {
      return handleMessage(message, `🚫 **${username}**, 𝘪𝘵 𝘵𝘢𝘬𝘦𝘴 𝘢𝘵 𝘭𝘦𝘢𝘴𝘵 <:kasiko_coin:1300141236841086977> 5,000 𝘵𝘰 𝘱𝘶𝘭𝘭 𝘰𝘧𝘧 𝘢 𝘳𝘰𝘣𝘣𝘦𝘳𝘺. 𝘙𝘪𝘨𝘩𝘵 𝘯𝘰𝘸, 𝘺𝘰𝘶'𝘳𝘦 𝘳𝘶𝘯𝘯𝘪𝘯𝘨 𝘰𝘯 𝘩𝘰𝘱𝘦𝘴 𝘢𝘯𝘥 𝘶𝘯𝘱𝘢𝘪𝘥 𝘣𝘪𝘭𝘭𝘴.`);
    }

    if (targetCash < 1000) {
      return message.channel.send(`ⓘ **${username}**, the mentioned player needs at least <:kasiko_coin:1300141236841086977> **1000** cash to attempt a robbery!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    /* if (userData.lastRobbery && checkTimeGap(userData.lastRobbery, Date.now()) < 6) {
      const remainingTime = 5 - checkTimeGap(userData.lastRobbery, Date.now(), {
        format: 'hours'
      }).toFixed(2);
      return message.channel.send(`🎃 <@${userId}>, you cannot rob again for another ${remainingTime.toFixed(1)} hours.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } */

    userData.lastRobbery = Date.now();

    const robberyAmount = Math.floor(targetCash * 0.1); // Victim loses 10% of their cash
    const num1 = Math.floor(Math.random() * 500) + 1; // Random number under 1000 for difficulty
    const num2 = Math.floor(Math.random() * 500) + 1; // Random number under 1000 for difficulty
    const correctAnswer = num1 + num2;

    // Create the exciting embed for the robbery
    const embed = new EmbedBuilder()
    .setTitle('👀🗝️ **𝐑𝐨𝐛𝐛𝐞𝐫𝐲 𝐀𝐭𝐭𝐞𝐦𝐩𝐭!**')
    .setDescription(
      `**${username}**, you're attempting to **rob** **${message.mentions.users.first().username}**! 🙀`
    )
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/robber.png`)
    .addFields(
      {
        name: '<:sand_timer:1386589414846631947> **Time is ticking**...',
        value: 'Answer within **25 seconds** or the law catches up with you!\n- No need to use a prefix.'
      },
      {
        name: '<:warning:1366050875243757699> **Be Careful!**',
        value: 'If your opponent solves the puzzle first, you will lose the challenge!'
      }
    )


    const embedQues = new EmbedBuilder()
    .setDescription(`Before you strike, solve this quick puzzle to **succeed**:\n## What is **${num1} + ${num2}**? 💡`)
    .setFooter({
      text: '⚠ Failing risks capture and loss of cash!'
    })

    const robberyMessage = await message.channel.send({
      embeds: [embed, embedQues]
    });

    // Start collecting the input from the robber
    const filter = response => (response.author.id === userId || response.author.id === targetUserId) && Number.isInteger(Number(response.content)); // Only collect the robber's response
    const collector = message.channel.createMessageCollector({
      filter,
      time: 25000, // 25 seconds for the robbery attempt
      max: 1, // Only collect one response
      errors: ['time'] // Handle timeout error
    });

    collector.on('collect', async (response) => {
      try {
        const answer = parseInt(response.content, 10);
        if (answer === correctAnswer && response.author.id !== targetUserId) {

          // Successful robbery logic
          const caughtChance = Math.random();
          const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

          await delay(2000); // Delay for suspense

          if (!robberyMessage || !robberyMessage?.edit) return;

          await robberyMessage.edit({
            content: `**${message.author.username}** is _entering_ the victim's cash values... 🔓`,
            embeds: [new EmbedBuilder().setDescription(`🗝️ 𝐑𝐨𝐛𝐛𝐞𝐫𝐲 𝐒𝐭𝐚𝐫𝐭𝐞𝐝!`)]
          });

          await delay(4000); // Delay for suspense
          if (!robberyMessage || !robberyMessage?.edit) return;
          await robberyMessage.edit(`**${message.author.username}** is _putting money_ in their bag... 💵`);

          const passInfo = await checkPassValidity(targetUserId);
          let additionalReward = 0;
          if (passInfo.isValid) {
            if (passInfo.passType === "etheral" || passInfo.passType === "celestia") {
              additionalReward = 0.2;
            }
          }

          if (caughtChance < (0.3 + additionalReward)) {
            // 30% chance of getting caught
            const penalty = Math.floor(userCash * 0.1);
            userData.cash = Math.max(0, userCash - penalty);
            targetData.cash = targetCash + penalty;

            try {
              await updateUser(userId, {
                cash: userData.cash,
                lastRobbery: userData.lastRobbery
              });
              await updateUser(targetUserId, {
                cash: targetData.cash
              });
            } catch (updateErr) {
              if (!robberyMessage || !robberyMessage?.edit) return;
              await robberyMessage.edit(`ⓘ **${username}**, due to unexpected error your robbery attempt is failed!\n-# **Error"": ${updateErr}`).catch(console.error);
              return;
            }

            const caughtEmbed = new EmbedBuilder()
            .setColor('#ff3333')
            .setTitle('🚔 **𝐂𝐨𝐫𝐫𝐞𝐜𝐭 𝐁𝐮𝐭 𝐂𝐚𝐮𝐠𝐡𝐭!**')
            .setDescription(
              `<:alert:1366050815089053808> **${username}**, 𝗒𝗈𝗎 𝗀𝗈𝗍 𝖼𝖺𝗎𝗀𝗁𝗍 𝗂𝗇 𝗍𝗁𝖾 𝖺𝖼𝗍! 🤧\n` +
              `-# 𝘠𝘰𝘶 𝘸𝘦𝘳𝘦 𝘵𝘰𝘰 𝘴𝘭𝘰𝘸, 𝘢𝘯𝘥 𝘵𝘩𝘦 𝘱𝘰𝘭𝘪𝘤𝘦 𝘵𝘰𝘰𝘬 𝘺𝘰𝘶𝘳 **10% cash** 𝘢𝘴 𝘱𝘶𝘯𝘪𝘴𝘩𝘮𝘦𝘯𝘵.`
            )
            .addFields(
              {
                name: '<:moneybag:1365976001179553792> **𝙋𝙚𝙣𝙖𝙡𝙩𝙮:**', value: `You lost <:kasiko_coin:1300141236841086977> **${penalty.toLocaleString()}** cash.`
              },
              {
                name: '💵 **𝙑𝙞𝙘𝙩𝙞𝙢 𝙍𝙚𝙬𝙖𝙧𝙙𝙚𝙙:**', value: `${message.mentions.users.first().username} received <:kasiko_coin:1300141236841086977> **${penalty.toLocaleString()}** cash.`
              }
            )
            .setFooter({
              text: 'Better luck next time... 🔥'
            })
            .setTimestamp();

            if (!robberyMessage || !robberyMessage?.edit) return;
            return robberyMessage.edit({
              embeds: [caughtEmbed]
            }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          } else {
            // Successful robbery with realistic reward
            const successAmount = Math.floor(robberyAmount * 0.8); // Robber gets 80% of the victim's loss
            const randomPercentage = Math.floor(Math.random() * 6) + 5; // Random percentage between 5-10%
            const bonusReward = Math.floor(targetCash * (randomPercentage / 100));

            userData.cash = userCash + successAmount + bonusReward;
            targetData.cash = Math.max(0, targetCash - robberyAmount);

            try {
              await updateUser(userId, {
                cash: userData.cash,
                lastRobbery: userData.lastRobbery
              });
              await updateUser(targetUserId, {
                cash: targetData.cash
              });
            } catch (updateErr) {
              if (!robberyMessage || !robberyMessage?.edit) return;
              await robberyMessage.edit(`ⓘ **${username}**, due to unexpected error your robbery attempt is failed!\n-# **Error"": ${updateErr}`).catch(console.error);
              return;
            }

            const successEmbed = new EmbedBuilder()
            .setTitle('💸 **𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐑𝐨𝐛𝐛𝐞𝐫𝐲!**')
            .setDescription(
              `**${message.author.username}** successfully robbed <:kasiko_coin:1300141236841086977> **${(successAmount + bonusReward).toLocaleString()}** from **${message.mentions.users.first().username}**! 💥`
            )
            .addFields(
              {
                name: '<:moneybag:1365976001179553792> **𝙔𝙤𝙪 𝙩𝙤𝙤𝙠:**', value: `<:kasiko_coin:1300141236841086977> **${(successAmount + bonusReward).toLocaleString()}** cash`
              },
              {
                name: '💵 **𝙑𝙞𝙘𝙩𝙞𝙢 𝙡𝙤𝙨𝙩:**', value: `<:kasiko_coin:1300141236841086977> **${robberyAmount.toLocaleString()}** cash`
              }
            )
            .setFooter({
              text: 'ᴇɴᴊᴏʏ ʏᴏᴜʀ ꜱᴘᴏɪʟꜱ! 🤑'
            })
            .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/robber.png`)

            if (!robberyMessage || !robberyMessage?.edit) return;
            return robberyMessage.edit({
              embeds: [successEmbed]
            }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        } else if (response.author.id === targetUserId && answer === correctAnswer) {
          // Failed robbery attempt
          const penalty = Math.floor(userCash * 0.1);

          userData.cash = Math.max(0, userCash - penalty);
          targetData.cash = targetCash + penalty;

          try {
            await updateUser(userId, {
              cash: userData.cash,
              lastRobbery: userData.lastRobbery
            });
            await updateUser(targetUserId, {
              cash: targetData.cash
            });
          } catch (updateErr) {
            if (!robberyMessage || !robberyMessage?.edit) return;
            await robberyMessage.edit(`ⓘ **${username}**, due to an unexpected error, your robbery attempt has failed!\n- **Error:** ${updateErr}`).catch(console.error);
            return;
          }

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

          if (!robberyMessage || !robberyMessage?.edit) return;
          return robberyMessage.edit({
            embeds: [robberyFailedEmbed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else if (response.author.id !== targetUserId) {
          // Failed robbery attempt
          const penalty = Math.floor(userCash * 0.1);

          userData.cash = Math.max(0, userCash - penalty);
          targetData.cash = targetCash + penalty;

          try {
            await updateUser(userId, {
              cash: userData.cash,
              lastRobbery: userData.lastRobbery
            });
            await updateUser(targetUserId, {
              cash: targetData.cash
            });
          } catch (updateErr) {
            if (!robberyMessage || !robberyMessage?.edit) return;
            await robberyMessage.edit(`ⓘ **${username}**, due to unexpected error your robbery attempt is failed!\n-# **Error"": ${updateErr}`).catch(console.error);
            return;
          }

          const failEmbed = new EmbedBuilder()
          .setColor('#ff3333') // Red for failure
          .setTitle('<:alert:1366050815089053808> **𝐘𝐨𝐮 𝐆𝐨𝐭 𝐂𝐚𝐮𝐠𝐡𝐭!**')
          .setDescription(
            `**${message.author.username}**, you failed to solve the puzzle! 😱\n` +
            `The victim's security team caught you, and you lost **10% of your cash**.`
          )
          .addFields(
            {
              name: '<:moneybag:1365976001179553792> **Penalty:**', value: `You lost <:kasiko_coin:1300141236841086977> **${penalty.toLocaleString()}** cash.`
            },
            {
              name: '💵 **Victim Rewarded:**', value: `${message.mentions.users.first().username} <:kasiko_coin:1300141236841086977> received **${penalty.toLocaleString()}** cash.`
            }
          )
          .setFooter({
            text: 'Better luck next time... 🔥'
          })
          .setTimestamp();

          if (!robberyMessage || !robberyMessage?.edit) return;
          return robberyMessage.edit({
            embeds: [failEmbed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

        } else {
          const ownerPresentEmbed = new EmbedBuilder()
          .setTitle('🚪 **𝐂𝐚𝐮𝐠𝐡𝐭 𝐢𝐧 𝐭𝐡𝐞 𝐀𝐜𝐭!**')
          .setDescription(
            `**${message.author.username}**, your robbery attempt was interrupted!\n` +
            `**${message.mentions.users.first().username}** was present and stopped you before you could take anything. 😬`
          )
          .addFields(
            {
              name: '<:kasiko_coin:1300141236841086977> **No Cash Taken:**',
              value: `You got caught, so nothing was stolen!`
            }
          )
          .setFooter({
            text: 'Maybe wait for a better moment? 👀'
          })

          if (!robberyMessage || !robberyMessage?.edit) return;
          return robberyMessage.edit({
            embeds: [ownerPresentEmbed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      } catch (err) {
        await robberyMessage.edit(`ⓘ **${username}**, due to an unexpected error, your robbery attempt has failed!\n- **Error:** ${updateErr}`).catch(console.error);
        return;
      }
    });

    collector.on('end',
      (collected, reason) => {
        if (reason === 'time') {
          const timeoutEmbed = new EmbedBuilder()
          .setColor('#231c00') // Yellow for timeout
          .setTitle('<:sand_timer:1386589414846631947> **𝐓𝐢𝐦𝐞 𝐢𝐬 𝐮𝐩!** ')
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

          if (!robberyMessage || !robberyMessage?.edit) return;
          return robberyMessage.edit({
            embeds: [timeoutEmbed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      });
  } catch (error) {
    if (error.message !== "Unknown Message" && error.message !== "Missing Permissions") {
      console.error(error);
    }
    return message.channel.send("<:alert:1366050815089053808> **An unexpected error occurred. Please try again later.**").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "rob",
  description: "Attempt to rob another player by cracking their vault password! Solve a math problem to succeed—if you do, you'll steal a portion of their cash. But beware, failure may have consequences!",
  aliases: [],
  args: "<target>",
  example: ["rob @player"],
  cooldown: 18000000,
  related: ["give",
    "bank"],
  emoji: "<:moneybag:1365976001179553792>",
  category: "🏦 Economy",
  cooldownMessage(ttl, name) {
    const timeStr = formatTTL(ttl);
    const container = new ContainerBuilder()
    .addTextDisplayComponents(td =>
      td.setContent(`🎃 Sorry **${name}**, you cannot rob again for another  <:kasiko_stopwatch:1355056680387481620> **${timeStr}**`)
    )
    .addTextDisplayComponents(td =>
      td.setContent(`-# 𝘠𝘰𝘶𝘳 𝘳𝘰𝘣𝘣𝘪𝘯𝘨 𝘤𝘢𝘳𝘦𝘦𝘳 𝘪𝘴 𝘤𝘶𝘳𝘳𝘦𝘯𝘵𝘭𝘺 𝘰𝘯 𝘢 𝘤𝘰𝘧𝘧𝘦𝘦 𝘣𝘳𝘦𝘢𝘬.`)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  },
  execute: async (args, message) => {
    const action = args[0] ? args[0].toLowerCase() : null;
    const { id: senderId, username } = discordUser(message);

    if (action === "rob") {
      let targetUserId = null;
      if (message.mentions?.users?.size) {
        targetUserId = message.mentions.users.first().id;
      } else if (args[1]) {
        targetUserId = Helper.extractUserId(args[1]) || args[1].replace(/[<@!>]/g, '');
      }

      if (!targetUserId) {
        return handleMessage(message, `ⓘ **${username}**, please mention a valid user to rob.\n-# **USE**: \`rob @user\``);
      }

      if (targetUserId === senderId) {
        return handleMessage(message, `ⓘ **${username}**, you cannot rob yourself! 🤷🏻`);
      }

      return attemptRobbery(senderId, targetUserId, message);
    }
  }
};