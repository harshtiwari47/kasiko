//📑 TODO: make sure user can't send invitation to themselves

import {
  getUserData,
  updateUser,
  readStockData,
  writeStockData
} from '../database.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import {
  client
} from "../bot.js";

export const sendConfirmation = async (title, description, color, message, id) => {
  // Create an embed for the confirmation message
  const embed = new EmbedBuilder()
  .setColor(color)
  .setAuthor({
    name: message.author.username, iconURL: message.author.displayAvatarURL({
      dynamic: true
    })
  })
  .setTitle(title)
  .setDescription(description)
  .addFields(
    {
      name: 'Warning', value: "This is just for fun in-game! No real-life commitments are involved.",
    }
  )
  .setTimestamp();

  // Action row with buttons
  const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
    .setCustomId('confirm' + id)
    .setLabel('Yes')
    .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
    .setCustomId('cancel' + id)
    .setLabel('No')
    .setStyle(ButtonStyle.Danger)
  );

  // Send the confirmation message and return it
  const replyMessage = await message.channel.send({
    embeds: [embed],
    components: [row]
  });

  return replyMessage; // Return the message
};

export async function marriage(message) {
  try {
    let userData = getUserData(message.author.id);

    if (userData.spouse) {
      let marrydate = new Date(userData.marriedOn) || new Date(); // The user's marriage date
      let currentDate = new Date(); // Current date
      let partner = await client.users.fetch(userData.spouse) || {
        "username": "Failed to Fetch"
      };

      let countdownInDays = Math.ceil((marrydate - currentDate) / (1000 * 60 * 60 * 24));

      return message.channel.send(`♥️ 𝑹𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\nYou are married to **${partner.username} 💒**.\n✿⁠ Couple BondXP: **♡ ${userData.bondXP}**\n✿⁠ Married: **${countdownInDays}  days ago**`);
    } else {
      return message.channel.send("♥️ 𝑹𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n**You are not married**.\nType `Kas .marry @username` to propose 💐 to someone!");
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while performing `marriage` command.")
  }
}

export async function marry(user, message) {
  try {
    let userData = getUserData(message.author.id);
    let invitedUserData = getUserData(user);
    const guild = await message.channel.guild.members.fetch(user);
    
    if (message.author.id === user) {
      message.channel.send(`⚠️ You can not propose yourself!`);
    }

    if (userData.spouse && userData.spouse !== user) {
      message.channel.send(`⚠️ You are already married to **<@${userData.spouse}>**.`);
    } else if (userData.spouse && userData.spouse === user) {
      message.channel.send(`⚠️ You are __already married__ to each other.`);
    } else {
      const title = "💍 𝑴𝒂𝒓𝒓𝒊𝒂𝒈𝒆 𝑷𝒓𝒐𝒑𝒐𝒔𝒂𝒍";
      const description = `<@${message.author.id}> has proposed 💐 to you! Do you accept **<@${guild.user.id}>**?`;
      const replyMessage = await sendConfirmation(title, description, "#ee87ca", message, "marry");

      const filter = (i) => i.user.id === user &&
      (i.customId === 'confirmmarry' || i.customId === 'cancelmarry');

      const collector = replyMessage.createMessageComponentCollector({
        filter,
        time: 45000
      });

      collector.on('collect', async (i) => {
        // Disable buttons after selection
        const rowDisabled = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
          .setCustomId('confirmmarry')
          .setLabel('Yes')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('cancelmarry')
          .setLabel('No')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
        );

        if (i.customId === 'confirmmarry') {
          let date = Date.now();
          userData.spouse = user;
          userData.marriedOn = date;
          invitedUserData.spouse = message.author.id;
          invitedUserData.marriedOn = date;

          updateUser(message.author.id, userData);
          updateUser(user, invitedUserData);

          return await i.update({
            content: `🤵🏻👰🏻🎉 **<@${user}>** has accepted <@${message.author.id}>'s proposal! 🎉\n**Congratulations to the happy couple! 💍**`,
            components: [rowDisabled]
          });

        } else if (i.customId === 'cancelmarry') {
          return await i.update({
            content: `<@${user}> has declined <@${message.author.id}>'s proposal. 💔 Better luck next time!`,
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
              .setCustomId('confirmmarry')
              .setLabel('Yes')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
              new ButtonBuilder()
              .setCustomId('cancelmarry')
              .setLabel('No')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
            );

            return await replyMessage.edit({
              components: [rowDisabled]
            });
          }
        });
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while sending proposal.")
  }
}

export async function divorce(user, message) {
  try {
    let userData = getUserData(message.author.id);
    let invitedUserData = getUserData(user);
    const guild = await message.channel.guild.members.fetch(user);

    if (userData.spouse && userData.spouse !== user) {
      message.channel.send(`⚠️ You are not married to **${guild.user.username}**.`);
    } else if (!userData.spouse) {
      message.channel.send(`⚠️ Find your partner first! 😸. You are __not married__.`);
    } else if (userData.spouse && userData.spouse === user) {

      const title = "💔🥀 𝑫𝒊𝒗𝒐𝒓𝒄𝒆 𝑪𝒐𝒏𝒇𝒊𝒓𝒎𝒂𝒕𝒊𝒐𝒏 ";
      const description = `<@${message.author.id}> wants to divorce you. Do you agree <@${user}>?`;
      const replyMessage = await sendConfirmation(title, description, "#450830", message, "divorce");

      const filter = (i) => i.user.id === user &&
      (i.customId === 'confirmdivorce' || i.customId === 'canceldivorce');

      const collector = replyMessage.createMessageComponentCollector({
        filter,
        time: 45000
      });

      collector.on('collect', async (i) => {
        // Disable buttons after selection
        const rowDisabled = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
          .setCustomId('confirmdivorce')
          .setLabel('Yes')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('canceldivorce')
          .setLabel('No')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
        );

        if (i.customId === 'confirmdivorce') {

          userData.spouse = null;
          invitedUserData.spouse = null;

          updateUser(message.author.id, userData);
          updateUser(user, invitedUserData);

          return await i.update({
            content: `💔 **<@${user}>** has accepted the divorce from <@${message.author.id}>.\n**The two have now parted ways.**`,
            components: [rowDisabled]
          });

        } else if (i.customId === 'canceldivorce') {
          return await i.update({
            content: `🚫 **<@${user}>** has declined the divorce proposal from <@${message.author.id}>.\n**The marriage remains intact!**`,
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
              .setCustomId('confirmdivorce')
              .setLabel('Yes')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
              new ButtonBuilder()
              .setCustomId('canceldivorce')
              .setLabel('No')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
            );

            return await replyMessage.edit({
              components: [rowDisabled]
            });
          }
        });
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while sending proposal.")
  }
}

export async function roses(message) {
  try {
    let userData = await getUserData(message.author.id);

    // Check if roses data exists
    if (userData && typeof userData.roses === 'number') {
      return message.channel.send(`**${message.author.username}**, you currently have **${userData.roses}** roses! 🌹`);
    } else {
      return message.channel.send(`😢 | **${message.author.username}**, you don't have any roses yet. Start buying some! \`Kas .shop roses <amount>\` 🌹`);
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ An error occurred while retrieving your roses. Please try again later.");
  }
}

export async function sendRoses(toUser, amount, message) {
  try {
    let senderData = getUserData(message.author.id);

    let recipientData = getUserData(toUser);

    // Check if the sender has enough roses
    if (senderData.roses >= amount) {
      // Deduct roses from the sender
      senderData.roses -= amount;

      // Add roses to the recipient
      if (senderData.spouse && senderData.spouse === toUser) {
        senderData.bondXP += 10;
        recipientData.bondXP += 10;
        updateUser(toUser, recipientData);
        updateUser(message.author.id, senderData);

        return message.channel.send(`💖 | **${message.author.username}** has sent **${amount}** roses to their spouse <@${toUser}>! Your bond has grown stronger, increasing bondXP by 10! 🌹`);
      } else {
        recipientData.roses = (recipientData.roses || 0) + amount;
        updateUser(toUser, recipientData);
        updateUser(message.author.id, senderData);

        return message.channel.send(`🌹 | **${message.author.username}** has sent **${amount}** roses to <@${toUser}>! 🌹`);
      }

    } else {
      // Notify the sender they don't have enough roses
      return message.channel.send(`🚫 | **${message.author.username}**, you don’t have enough roses to send.`);
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ An error occurred while sending roses. Please try again later.");
  }
}

export const Marriage = {
  marriage,
  marry,
  divorce,
  roses,
  sendRoses
}