import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper
} from '../../../helper.js';

export const sendConfirmation = async (message, userId, amount, recipient) => {
  // Create an embed for the confirmation message
  const embed = new EmbedBuilder()
  .setColor('#f83131')
  .setAuthor({
    name: message.author.username, iconURL: message.author.displayAvatarURL({
      dynamic: true
    })
  })
  .setTitle('Confirm Transaction')
  .setDescription(`Are you sure you want to send <:kasiko_coin:1300141236841086977> **${Number(amount).toLocaleString()}** to <@${recipient}>?`)
  .addFields(
    {
      name: 'Warning', value: 'We do not allow any form of monetary trade or exchange.'
    }
  )
  .setTimestamp();

  return embed; // Return the message for use in `give`
};

export async function give(message, userId, amount, recipientId) {
  try {
    if (userId === recipientId) {
      return message.channel.send(
        "¯⁠\\⁠_⁠(⁠ツ⁠)⁠_⁠/⁠¯ Giving **yourself** <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉?\nThat’s like trying to give your own reflection a high five—totally __unnecessary and a little weird__!"
      )
    }

    let userData = await getUserData(userId);
    let recipientData = await getUserData(recipientId);

    if (!userData) return;

    if (!recipientData) {
      return message.channel.send(`ⓘ **${username}**, mentioned user is not found!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const username = message.author.username;

    if (userData.cash < amount) {
      return message.channel.send(
        `ⓘ 🧾 **${username}**, you don't have **enough** <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉!`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Get today's date as a string key (e.g., "2025-03-04")
    const todayKey = new Date().toISOString().split('T')[0];

    // Retrieve the current amount received today; default to 0 if not set
    let todayReceived = recipientData.dailyAmountReceived.get(todayKey) || 0;

    // Calculate the daily limit: recipientData.level * 100000 capped at 6,000,000
    const maxDailyLimit = recipientData.level * 100000;
    const dailyLimit = Math.min(maxDailyLimit, 6000000);

    let remainingLimit = dailyLimit;

    if ((todayReceived + amount) > remainingLimit) {
      return message.channel.send(
        `⚠ **<@${recipientId}>** has already received **${todayReceived.toLocaleString()}** today.\n` +
        `The daily limit is **${dailyLimit.toLocaleString()}**.\n` +
        `ッ They can receive up to <:kasiko_coin:1300141236841086977> **${remainingLimit.toLocaleString()}** more today.\n\n` +
        `ⓘ  Try sending <:kasiko_coin:1300141236841086977> **${remainingLimit.toLocaleString()}** or less.`
      );
    }

    const embed = await sendConfirmation(message, userId, amount, recipientId);

    if (!embed) return;

    // Action row with buttons
    const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setCustomId('confirmgiving')
      .setLabel('✅ YES')
      .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
      .setCustomId('cancelgiving')
      .setLabel('❌ NO')
      .setStyle(ButtonStyle.Danger)
    );

    // Send the confirmation message and return it
    const replyMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    })


    // Create the collector
    const collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000, // 15 seconds
    });

    // Handle button interactions
    collector.on("collect", async (interaction) => {
      try {
        if (interaction.user.id !== message.author.id) {
          return await interaction.reply({
            content: "⚠️ You cannot interact with this button.",
            ephemeral: true,
          });
        }

        const rowDisabled = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId("confirmgiving")
          .setLabel("✅ YES")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId("cancelgiving")
          .setLabel("❌ NO")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
        );

        if (interaction.customId === "confirmgiving") {
          // Defer and then update
          await interaction.deferUpdate();

          // Perform logic for transferring cash
          userData.cash -= Number(amount);
          userData.charity += Number(amount);
          recipientData.cash += Number(amount);

          recipientData.dailyAmountReceived.set(todayKey, todayReceived + Number(amount));

          try {
            await updateUser(userId, {
              cash: userData.cash,
              charity: userData.charity
            });
            await updateUser(recipientId, {
              cash: recipientData.cash,
              dailyAmountReceived: recipientData.dailyAmountReceived
            });
          } catch (upErr) {
            await interaction.editReply({
              content: "❌ Transaction error.",
              components: [rowDisabled],
            }).catch(console.error);
          }

          // Send confirmation
          await interaction.editReply({
            content: `🧾✅ **<@${userId}>** successfully transferred <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** to **<@${recipientId}>**!\n-# **💸 Keep spreading the wealth!**`,
            embeds: [],
            components: [],
          })

          collector.stop();
        } else if (interaction.customId === "cancelgiving") {
          await interaction.deferUpdate();
          await interaction.editReply({
            content: "❌ Transaction cancelled.",
            components: [rowDisabled],
          })
          collector.stop();
        }
      } catch (err) {
        console.error("Error handling interaction:", err);
        if (interaction.replied || interaction.deferred) {
          await message.channel.send(`⚠️ An error occurred during the transaction!`).catch(console.error);
        } else {
          await interaction.update({
            content: "⚠️ An error occurred. Please try again.",
            ephemeral: true,
          }).catch(console.error);
        }
      }
    });

    // Handle collector end
    collector.on("end",
      async collected => {
        if (collected.size === 0) {
          try {
            const rowDisabled = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
              .setCustomId("confirmgiving")
              .setLabel("Yes")
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
              new ButtonBuilder()
              .setCustomId("cancelgiving")
              .setLabel("No")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
            );

            if (!replyMessage || !replyMessage?.edit) return;

            await replyMessage.edit({
              content: `⏱️ Transaction timeout!`,
              embeds: [],
              components: [rowDisabled],
            })
            return;
          } catch (err) {
            console.error("Error disabling buttons after timeout:", err);
          }
        }
      });
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return message.channel.send(
      "⚠️ Something went wrong while processing the transaction. Please try again."
    ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "give",
  description: "Transfer in-game cash to another user.",
  aliases: ["send",
    "transfer"],
  args: "<amount> <user>",
  example: ["give 100 @user"],
  related: ["daily",
    "cash"],
  cooldown: 10000,
  emoji: "🤝🏻",
  category: "🏦 Economy",
  execute: (args,
    message) => {

    if (!message.mentions.users.size) {
      return message.channel.send(
        `ⓘ **${message.author.username}**, please mention a user to share cash with! The amount must be an integer.\n**Usage:** \`give <amount> @user\``
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    if (!args[1] || !Helper.isNumber(args[1])) {
      return message.channel.send(
        `ⓘ **${message.author.username}**, the cash amount is invalid! It must be a whole number.\n**Usage:** \`give <amount> @user\``
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    return give(message, message.author.id, args[1], message.mentions.users.first().id);
  }
};