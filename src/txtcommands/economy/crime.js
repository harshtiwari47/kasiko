import { getUserData, updateUser } from '../../../database.js';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

export async function crime(id, channel, user) {
  try {
    const userData = await getUserData(id);
    if (!userData || !user) {
      return "Oops! Something went wrong while planning your caper 🚨!";
    }
    
    const outcome = Math.floor(Math.random() * 20) + 1;
    let crimeMessage = "";
    let earnedCash = 0;
    let penalty = 0;
    
    // Big Success outcomes (Cases 1-4): 20-30% chance total
    if (outcome >= 1 && outcome <= 4) {
      earnedCash = Math.floor(Math.random() * 1000) + 2000; // 2000 to 3000 cash
      userData.cash += earnedCash;
      await updateUser(id, { cash: userData.cash });
      switch (outcome) {
        case 1:
          crimeMessage = "💰 **{username}**, you pulled off a daring bank heist and escaped with a fortune! You earned <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 2:
          crimeMessage = "🚁 **{username}**, you orchestrated a helicopter jewel heist! Against all odds, you scored <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 3:
          crimeMessage = "🎲 **{username}**, you gambled on a risky scheme that paid off big—bagging <:kasiko_coin:1300141236841086977>**{cash}** cash!";
          break;
        case 4:
          crimeMessage = "🏦 **{username}**, you infiltrated a high-security vault and made off with <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
      }
    }
    // Moderate Success outcomes (Cases 5-12): 40% chance total
    else if (outcome >= 5 && outcome <= 12) {
      earnedCash = Math.floor(Math.random() * 800) + 800; // 800 to 1600 cash
      userData.cash += earnedCash;
      await updateUser(id, { cash: userData.cash });
      switch (outcome) {
        case 5:
          crimeMessage = "🕶️ **{username}**, you pickpocketed a wealthy tourist and netted <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 6:
          crimeMessage = "💻 **{username}**, you hacked a small business and siphoned <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 7:
          crimeMessage = "🚗 **{username}**, you carjacked a fancy ride and later sold it for <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 8:
          crimeMessage = "🏪 **{username}**, you broke into a boutique and made off with <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 9:
          crimeMessage = "📱 **{username}**, your phishing scam was a success—you pocketed <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 10:
          crimeMessage = "🎭 **{username}**, you pulled off an elaborate identity scam and earned <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 11:
          crimeMessage = "🔓 **{username}**, you cracked a digital lock on a crypto wallet, netting <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
        case 12:
          crimeMessage = "📦 **{username}**, you intercepted a delivery and made a quick cash grab of <:kasiko_coin:1300141236841086977>**{cash}** cash.";
          break;
      }
    }
    // Failure outcomes (Cases 13-20): 40% chance total
    else if (outcome >= 13 && outcome <= 20) {
      penalty = Math.floor(Math.random() * 200) + 100; // 100 to 300 cash fine
      if (userData.cash >= penalty) {
        userData.cash -= penalty;
      } else {
        userData.cash = 0;
      }
      await updateUser(id, { cash: userData.cash });
      switch (outcome) {
        case 13:
          crimeMessage = "🚓 **{username}**, your plan fell apart and the cops nabbed you! Fined <:kasiko_coin:1300141236841086977>**{penalty}** cash.";
          break;
        case 14:
          crimeMessage = "🔔 **{username}**, your heist went sideways and you had to pay <:kasiko_coin:1300141236841086977>**{penalty}** cash in bribes.";
          break;
        case 15:
          crimeMessage = "🚨 **{username}**, your scam backfired and you got caught! Lost <:kasiko_coin:1300141236841086977>**{penalty}** cash.";
          break;
        case 16:
          crimeMessage = "👮 **{username}**, you triggered an alarm and the police closed in—losing you <:kasiko_coin:1300141236841086977>**{penalty}** cash.";
          break;
        case 17:
          crimeMessage = "🚔 **{username}**, your criminal plan was exposed. You were fined <:kasiko_coin:1300141236841086977>**{penalty}** cash.";
          break;
        case 18:
          crimeMessage = "🔒 **{username}**, a high-tech security system caught you red-handed. Lost <:kasiko_coin:1300141236841086977>**{penalty}** cash.";
          break;
        case 19:
          crimeMessage = "⚠️ **{username}**, the authorities closed in fast. You had to pay <:kasiko_coin:1300141236841086977>**{penalty}** cash as a penalty.";
          break;
        case 20:
          crimeMessage = "❌ **{username}**, your scheme crumbled at the last minute. You ended up losing <:kasiko_coin:1300141236841086977>**{penalty}** cash.";
          break;
      }
    }
    
    return crimeMessage
      .replace("{username}", user.username)
      .replace("{cash}", earnedCash ? earnedCash.toLocaleString() : "")
      .replace("{penalty}", penalty ? penalty.toLocaleString() : "");
  } catch (e) {
    console.error(e);
    return "Oops! Something went wrong during your risky criminal endeavor 🚨!";
  }
}

export default {
  name: "crime",
  description: "Attempt a daring crime with 20 possible outcomes—will you score big or get caught?",
  aliases: ["steal", "heist", "rob"],
  args: "",
  example: ["cr"],
  emoji: "🚨",
  cooldown: 15000, // 15 seconds cooldown
  category: "🏦 Economy",
  execute: async (args, message) => {
    let crimeReply = await crime(message.author.id, message.channel, message.author);

    const finalEmbed = new EmbedBuilder()
      .setDescription(crimeReply)
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL({ dynamic: true })
      })

    await message.channel.send({ embeds: [finalEmbed] })
      .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return;
  },

  // Slash command interaction handler
  interact: async (interaction) => {
    try {
      const userId = interaction.user.id;
      const user = interaction.user;
      const channel = interaction.channel;

      const crimeReply = await crime(userId, channel, user);

      const finalEmbed = new EmbedBuilder()
        .setDescription(crimeReply)
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })

      await interaction.editReply({ embeds: [finalEmbed] });
      return;
    } catch (e) {
      console.error(e);
      await interaction.editReply({
        content: "Oops! Something went wrong during your crime attempt 🚨. Please try again later!"
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      return;
    }
  }
};