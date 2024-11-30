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

import {
  Helper
} from '../../../helper.js';

import {
  Car
} from './cars.js';
import {
  Structure
} from './structures.js';

export async function buyRoses(amount, message) {
  try {
    const userId = message.author.id;
    let userData = await getUserData(userId);
    const rosesAmount = amount * 1000;


    if (userData.cash >= rosesAmount) {

      userData.cash -= rosesAmount;
      userData.roses += amount;

      await updateUser(message.author.id, userData);
      return message.channel.send(`**${message.author.username}** bought **${amount}** 🌹 for <:kasiko_coin:1300141236841086977>**${rosesAmount}** 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`);
    } else {
      return message.channel.send(`⚠️ **${message.author.username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉 to purchase a 🌹. You need <:kasiko_coin:1300141236841086977> ${rosesAmount} 𝑪𝒂𝒔𝒉`);
    }
  } catch(e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while buying rose(s).");
  }
}



export default {
  name: "shop",
  description: "View and purchase items in the shop (cars, structures, roses, etc.).",
  aliases: ["store",
    "market",
    "buy",
    "sell"],
  // Additional aliases like "store" and "market"
  args: "<category> [parameters]",
  example: [
    "shop car",
    // Show available cars in the shop
    "shop structure/house/building",
    // Show available structures in the shop
    "buy car <car_id>",
    // Buy a specific car
    "buy structure <structure_id>",
    // Buy a specific structure
    "buy roses <amount>",
    // Buy roses
    "sell car <car_id>",
    // Sell a specific car
    "sell structure <structure_id>" // Sell a specific structure
  ],
  related: ["cars",
    "structures",
    "roses",
    "buy",
    "sell"],
  cooldown: 8000,
  // Cooldown of 8 seconds
  category: "Shop",

  execute: (args, message) => {
    const category = args[1] ? args[1].toLowerCase(): null;
    const itemId = args[2] ? args[2].toLowerCase(): null;

    if (args[0].toLowerCase() !== "shop" && (args[0].toLowerCase() === "buy" || args[0].toLowerCase() === "sell")) {
      if (args[0].toLowerCase() === "buy") {
        if (args[1] && itemId) {
          switch (args[1].toLowerCase()) {

          case "car":
            return Car.buycar(message, itemId); // Buy a car with the given itemId

          case "structure":
          case "building":
          case "house":
            return Structure.buystructure(message, itemId); // Buy a structure with the given itemId

          case "roses":
          case "rose":


            if (!args[2]) args[2] = 1;
            if (args[2] && Helper.isNumber(args[2])) {
              const amount = parseInt(args[2]);
              if (amount > 0) {
                return buyRoses(amount, message); // Buy the specified number of roses
              } else {
                return message.channel.send("⚠️ Please specify a valid number of roses to buy.");
              }
            } else {
              return message.channel.send("⚠️ Please specify a valid amount of roses to buy. Example: `buy roses <amount>`");
            }

          default:
            return message.channel.send("⚠️ Invalid item category. Please specify 'car', 'roses' or 'structure'.\nExample: `buy car <id>`");
          }
        } else {
          return message.channel.send("⚠️ Invalid purchase request. Example: `buy <car/structure/roses> <item_id/amount>`");
        }
      }
      if (args[0].toLowerCase() === "sell") {
        if (args[1] && itemId) {
          switch (args[1].toLowerCase()) {
          case "car":
            return Car.sellcar(message, itemId); // Sell a car with the given itemId
          case "structure":
          case "building":
          case "house":
            return Structure.sellstructure(message, itemId); // Sell a structure with the given itemId
          default:
            return message.channel.send("⚠️ Invalid item category. Please specify 'car' or 'structure'.\nExample: `sell car <id>`");
          }
        } else {
          return message.channel.send("⚠️ Invalid sell request. Example: `sell <car/structure> <item_id>`");
        }
      }

      return message.channel.send(`⚠️ Please use a valid command! \`kas buy/sell <category> <itemId/amount>\``);
    }

    // Handle different categories (e.g., cars, structures)
    switch (category) {
    case "cr":
    case "car":
    case "cars":
      return Car.sendPaginatedCars(message); // Show paginated cars in the shop

    case "structure":
    case "building":
    case "house":
      return Structure.sendPaginatedStructures(message); // Show paginated structures in the shop

    default:
      return message.channel.send("🛒 𝑺𝑯𝑶𝑷\nUse `shop car` or `shop structure` to view items.\n𝑃𝑢𝑟𝑐ℎ𝑎𝑠𝑒 :\n- `buy car <id>` to buy a car.\n- `buy structure <id>` to buy house or building.\n- `buy roses <amount>` to buy roses.\n𝑆𝑒𝑙𝑙:\n- `sell car <id>`, or `sell structure <id>`, to sell items.");
    }
  }
};