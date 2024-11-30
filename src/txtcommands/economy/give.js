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
  .setDescription(`Are you sure you want to send <:kasiko_coin:1300141236841086977> **${amount}** to <@${recipient}>?`)
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
      );
    }

    let userData = await getUserData(userId);
    let recipientData = await getUserData(recipientId);

    if (userData.cash < amount) {
      return message.channel.send(
        "⚠️🧾 You don't have **enough** <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉!"
      );
    }

    const embed = await sendConfirmation(message, userId, amount, recipientId);

    // Action row with buttons
    const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setCustomId('confirmgiving')
      .setLabel('Yes')
      .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
      .setCustomId('cancelgiving')
      .setLabel('No')
      .setStyle(ButtonStyle.Danger)
    );

    // Send the confirmation message and return it
    const replyMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });


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
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId("cancelgiving")
          .setLabel("No")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
        );

        if (interaction.customId === "confirmgiving") {
          // Defer and then update
          await interaction.deferUpdate();

          // Perform logic for transferring cash
          userData.cash -= Number(amount);
          recipientData.cash += Number(amount);
          await updateUser(userId, userData);
          await updateUser(recipientId, recipientData);

          // Send confirmation
          await interaction.editReply({
            content: `🧾✅ **<@${userId}>** successfully transferred <:kasiko_coin:1300141236841086977> **${amount}** to **<@${recipientId}>**! 💸 Keep spreading the wealth!`,
            embeds: [embed.setColor('#81f1a6')],
            components: [rowDisabled],
          });

          collector.stop();
        } else if (interaction.customId === "cancelgiving") {
          await interaction.deferUpdate();
          await interaction.editReply({
            content: "❌ Transaction cancelled.",
            components: [rowDisabled],
          });
          collector.stop();
        }
      } catch (err) {
        console.error("Error handling interaction:", err);
        if (interaction.replied || interaction.deferred) {
          await message.channel.send(`⚠️ An error occurred during the transaction!`)
        } else {
          await interaction.update({
            content: "⚠️ An error occurred. Please try again.",
            ephemeral: true,
          });
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

            return await replyMessage.edit({
              components: [rowDisabled],
            });
          } catch (err) {
            console.error("Error disabling buttons after timeout:", err);
          }
        }
      });
  } catch (e) {
    console.error("Error in give function:",
      e);
    return message.channel.send(
      "⚠️ Something went wrong while processing the transaction. Please try again."
    );
  }
}

export default {
  name: "give",
  description: "Transfer in-game cash to another user.",
  aliases: ["send", "transfer"],
  args: "<amount> <user>",
  example: ["give 100 @user"],
  related: ["daily", "cash"],
  cooldown: 15000,
  category: "Economy",
  execute: (args,
    message) => {
    if (Helper.isNumber(args[1]) && args[2] && Helper.isUserMention(args[2], message)) {
      give(message, message.author.id, args[1], Helper.extractUserId(args[2]));
    } else {
      return message.channel.send("⚠️ Invalid cash amount or no user mentioned! Cash amount should be an integer. `Kas give <amount> <user>`");
    }
  }
};