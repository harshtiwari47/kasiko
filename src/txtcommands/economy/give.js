import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
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

  return replyMessage; // Return the message for use in `give`
};

export async function give(message, userId, amount, recipientId) {
    try {
        if (userId === recipientId) {
            return message.channel.send(
                "¯⁠\\⁠_⁠(⁠ツ⁠)⁠_⁠/⁠¯ Giving **yourself** <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉?\nThat’s like trying to give your own reflection a high five—totally __unnecessary and a little weird__!"
            );
        }

        let userData = await getUserData(userId);

        if (userData.cash < amount) {
            return message.channel.send(
                "⚠️🧾 You don't have **enough** <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉!"
            );
        }

        const replyMessage = await sendConfirmation(message, userId, amount, recipientId);

        // Create a filter to ensure only the original user interacts
        const filter = (i) =>
            i.user.id === message.author.id &&
            (i.customId === "confirmgiving" || i.customId === "cancelgiving");

        // Create the collector
        const collector = replyMessage.createMessageComponentCollector({
            filter,
            time: 15000, // 15 seconds
        });

        // Handle button interactions
        collector.on("collect", async (interaction) => {
            try {
                // Disable buttons after a choice
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
                    // Fetch user and recipient data
                    let userData = await getUserData(userId);
                    let recipientData = await getUserData(recipientId);

                    if (userData.cash < amount) {
                        return await interaction.update({
                            content:
                                "⚠️🧾 You no longer have enough <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉 to complete this transaction.",
                            components: [rowDisabled],
                        });
                    }

                    // Update balances
                    userData.cash -= Number(amount);
                    userData.charity = (userData.charity || 0) + Number(amount);
                    recipientData.cash = (recipientData.cash || 0) + Number(amount);

                    await updateUser(userId, userData);
                    await updateUser(recipientId, recipientData);

                    return await interaction.update({
                        content: `🧾 **<@${userId}>** has generously sent <:kasiko_coin:1300141236841086977> **${amount}** 𝑪𝒂𝒔𝒉 to **<@${recipientId}>**. Your support helps each other level up—keep the teamwork!`,
                        components: [rowDisabled],
                    });
                } else if (interaction.customId === "cancelgiving") {
                    return await interaction.update({
                        content: "Cash transfer cancelled!",
                        components: [rowDisabled],
                    });
                }
            } catch (err) {
                console.error("Error handling button interaction:", err);
                await interaction.reply({
                    content: "⚠️ Something went wrong. Please try again.",
                    ephemeral: true,
                });
            }
        });

        // Handle collector end
        collector.on("end", async (_, reason) => {
            if (reason === "time") {
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

                    await replyMessage.edit({
                        components: [rowDisabled],
                    });
                } catch (err) {
                    console.error("Error disabling buttons after timeout:", err);
                }
            }
        });
    } catch (e) {
        console.error("Error in give function:", e);
        return await message.channel.send(
            "⚠️ Something went wrong while processing the transaction. Please try again."
        );
    }
}

export default {
  name: "give",
  description: "Transfer in-game cash to another user.",
  aliases: ["send", "transfer"],
  args: "<amount> <user>",
  example: "give 100 @username",
  related: ["daily", "cash"],
  cooldown: 5000,
  category: "Economy",
  execute: (args,
    message) => {
    if (Helper.isNumber(args[1]) && args[2] && Helper.isUserMention(args[2])) {
      give(message, message.author.id, args[1], Helper.extractUserId(args[2]));
    } else {
      message.channel.send("⚠️ Invalid cash amount or no user mentioned! Cash amount should be an integer. `Kas give <amount> <user>`");
    }
  }
};