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
} from '../../../database.js';

import { Helper } from '../../../helper.js';

import {
  Car
} from './cars.js';
import {
  Structure
} from './structures.js';

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



export default {
  name: "shop",
  description: "View and purchase items in the shop (cars, structures, roses, etc.).",
  aliases: ["store", "market"], // Additional aliases like "store" and "market"
  args: "<category> [parameters]",
  example: [
    "shop car", // Show available cars in the shop
    "shop structure/house/building", // Show available structures in the shop
    "shop buy car <car_id>", // Buy a specific car
    "shop buy structure <structure_id>", // Buy a specific structure
    "shop buy roses <amount>", // Buy roses
    "shop sell car <car_id>", // Sell a specific car
    "shop sell structure <structure_id>" // Sell a specific structure
  ],
  related: ["cars", "structures", "roses", "buy", "sell"],
  cooldown: 2000, // Cooldown of 2 seconds
  category: "Shop",

  execute: (args, message) => {
    const category = args[1] ? args[1].toLowerCase() : null;
    const itemId = args[3] ? args[3].toLowerCase() : null;

    // Handle different categories (e.g., cars, structures, roses)
    switch (category) {
      case "cr":
      case "car":
      case "cars":
        return Car.sendPaginatedCars(message); // Show paginated cars in the shop

      case "structure":
      case "building":
      case "house":
        return Structure.sendPaginatedStructures(message); // Show paginated structures in the shop

      case "roses":
        if (args[2] && Helper.isNumber(args[2])) {
          const amount = parseInt(args[2]);
          if (amount > 0) {
            return buyRoses(amount, message); // Buy the specified number of roses
          } else {
            return message.channel.send("⚠️ Please specify a valid number of roses to buy.");
          }
        } else {
          return message.channel.send("⚠️ Please specify a valid amount of roses to buy. Example: `.shop roses <amount>`");
        }

      case "buy":
      case "b":
        if (args[2] && itemId) {
          switch (args[2].toLowerCase()) {
            case "car":
              return Car.buycar(message, itemId); // Buy a car with the given itemId
            case "structure":
            case "building":
            case "house":
              return Structure.buystructure(message, itemId); // Buy a structure with the given itemId
            default:
              return message.channel.send("⚠️ Invalid item category. Please specify 'car' or 'structure'.\nExample: `shop buy car <id>`");
          }
        } else {
          return message.channel.send("⚠️ Invalid purchase request. Example: `.shop buy <car/structure> <item_id>`");
        }

      case "sell":
      case "s":
        if (args[2] && itemId) {
          switch (args[2].toLowerCase()) {
            case "car":
              return Car.sellcar(message, itemId); // Sell a car with the given itemId
            case "structure":
            case "building":
            case "house":
              return Structure.sellstructure(message, itemId); // Sell a structure with the given itemId
            default:
              return message.channel.send("⚠️ Invalid item category. Please specify 'car' or 'structure'.\nExample: `shop sell car <id>`");
          }
        } else {
          return message.channel.send("⚠️ Invalid sell request. Example: `.shop sell <car/structure> <item_id>`");
        }

      default:
      return message.channel.send("🛒 SHOP\nUse `shop car` or `shop structure` to view items.\nUse `shop buy car <id>`, `shop buy structure <id>`, and `shop roses <amount>` to buy items, and `shop sell car <id>`, `shop sell structure <id>`, and `shop sell roses <amount>` to sell items.");
    }
  }
};