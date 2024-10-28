import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../database.js';

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
      return message.channel.send("¯⁠\⁠_⁠(⁠ツ⁠)⁠_⁠/⁠¯ Giving **yourself** <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉?\nThat’s like trying to give your own reflection a high five—totally __unnecessary and a little weird__!");
    }

    let userData = getUserData(userId);

    if (userData.cash < amount) {
      return message.channel.send("⚠️🧾 You don't have **enough** <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉!");
    }
    
    const replyMessage = await sendConfirmation(message, userId, amount, recipientId);

    // Create a collector to capture button interactions from the author only
    const filter = (i) => i.user.id === message.author.id &&
    (i.customId === 'confirmgiving' || i.customId === 'cancelgiving');

    const collector = replyMessage.createMessageComponentCollector({
      filter,
      time: 15000
    });

    collector.on('collect', async (i) => {
      // Disable buttons after selection
      const rowDisabled = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
        .setCustomId('confirmgiving')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
        new ButtonBuilder()
        .setCustomId('cancelgiving')
        .setLabel('No')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
      );

      if (i.customId === 'confirmgiving') {
        
                let userData = getUserData(userId);
        let recipientData = getUserData(recipientId);

        userData.cash -= Number(amount);
        userData.charity += Number(amount);
        recipientData.cash += Number(amount);

        updateUser(userId, userData);
        updateUser(recipientId, recipientData);
        
        return await i.update({
          content: `🧾 **<@${userId}>** has generously sent <:kasiko_coin:1300141236841086977>**${amount}** 𝑪𝒂𝒔𝒉 to **<@${recipientId}>**. Your support helps each other level up—keep the teamwork!`,
          components: [rowDisabled]
        });

      } else if (i.customId === 'cancelgiving') {
        return await i.update({
          content: 'Cash transfer cancelled!',
          components: [rowDisabled]
        });
      }
    });

    collector.on('end',
      async (collected, reason) => {
        if (reason === 'time') {
          const rowDisabled = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
            .setCustomId('confirmgiving')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId('cancelgiving')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
          );

          return await replyMessage.edit({
            components: [rowDisabled]
          });
        }
      });

  } catch (e) {
    console.error(e);
    return await message.channel.send("Something went wrong while processing the transaction. Please try again.");
  }
}