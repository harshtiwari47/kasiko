import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import {
  getUserData,
  updateUser,
  getShopData,
  updateShop,
  readShopData,
  writeShopData
} from '../../database.js';

export async function buyRoses(amount, message) {
  try {
    const userId = message.author.id;
    let userData = getUserData(userId);
    const rosesAmount = amount * 1000;


    if (userData.cash >= rosesAmount) {

      userData.cash -= rosesAmount;
      userData.roses += amount;

      updateUser(message.author.id, userData);
      return message.channel.send(`**${message.author.username}** bought **${amount}** 🌹 for <:kasiko_coin:1300141236841086977>**${rosesAmount}** 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`);
    } else {
      return message.channel.send(`⚠️ **${message.author.username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉 to purchase a 🌹.`);
    }
  } catch(e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while buying rose(s).");
  }
}