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
import {
  JEWELRY
} from './jewelry.js';

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
  description: "View and purchase items in the shop (cars, structures, roses, jewelry, etc.).",
  aliases: ["store", "market", "buy", "sell"],
  args: "<category> [parameters]",
  example: [
    "shop car",
    // Show available cars in the shop
    "shop structure/house/building",
    // Show available structures in the shop
    "shop jewelry",
    // Show available jewelry in the shop
    "buy car <car_id>",
    // Buy a specific car
    "buy structure <structure_id>",
    // Buy a specific structure
    "buy jewelry <jewelry_id>",
    // Buy a specific jewelry item
    "buy roses <amount>",
    // Buy roses
    "sell car <car_id>",
    // Sell a specific car
    "sell structure <structure_id>",
    // Sell a specific structure
    "sell jewelry <jewelry_id>"
    // Sell a specific jewelry item
  ],
  related: ["cars", "structures", "jewelry", "roses", "buy", "sell"],
  cooldown: 8000,
  category: "🛍️ Shop",

  execute: (args, message) => {
    const category = args[1] ? args[1].toLowerCase() : null;
    const itemId = args[2] ? args[2].toLowerCase() : null;

    // Handle "buy" and "sell" commands
    if (args[0].toLowerCase() !== "shop" && (args[0].toLowerCase() === "buy" || args[0].toLowerCase() === "sell")) {
      // BUY logic
      if (args[0].toLowerCase() === "buy") {
        if (args[1] && itemId) {
          switch (args[1].toLowerCase()) {
            case "car":
              return Car.buycar(message, itemId);

            case "structure":
            case "building":
            case "house":
              return Structure.buystructure(message, itemId);

            case "jewelry":
            case "jewellery":
            case "rings":
            case "ring":
            case "necklace":
            case "watches":
            case "watch":
            case "strips":
              return JEWELRY.buyJewelryItem(message, itemId);

            case "roses":
            case "rose":
              // If no amount is provided, set a default of 1
              if (!args[2]) args[2] = 1;
              if (Helper.isNumber(args[2])) {
                const amount = parseInt(args[2]);
                if (amount > 0) {
                  return buyRoses(amount, message);
                } else {
                  return message.channel.send("⚠️ Please specify a valid number of roses to buy.");
                }
              } else {
                return message.channel.send("⚠️ Please specify a valid amount of roses to buy.\nExample: `buy roses <amount>`");
              }

            default:
              return message.channel.send("⚠️ Invalid category. Please specify one of: `car`, `structure`, `jewelry`, or `roses`.\nExample: `buy car <id>`");
          }
        } else {
          return message.channel.send("⚠️ Invalid purchase request.\nExample: `buy car <id>` or `buy roses <amount>`");
        }
      }

      // SELL logic
      if (args[0].toLowerCase() === "sell") {
        if (args[1] && itemId) {
          switch (args[1].toLowerCase()) {
            case "car":
              return Car.sellcar(message, itemId);

            case "structure":
            case "building":
            case "house":
              return Structure.sellstructure(message, itemId);

            case "jewelry":
            case "jewellery":
            case "rings":
            case "ring":
            case "necklace":
            case "watches":
            case "watch":
            case "strips":
              return JEWELRY.sellJewelryItem(message, itemId);

            default:
              return message.channel.send("⚠️ Invalid category. Please specify one of: `car`, `structure`, or `jewelry`.\nExample: `sell car <id>`");
          }
        } else {
          return message.channel.send("⚠️ Invalid sell request.\nExample: `sell car <id>` or `sell jewelry <id>`");
        }
      }

      // If command not recognized
      return message.channel.send("⚠️ Please use a valid command!\n`kas buy/sell <category> <itemId/amount>`");
    }

    // Handle "shop" categories (viewing items)
    switch (category) {
      case "cr":
      case "car":
      case "cars":
        return Car.sendPaginatedCars(message);

      case "jewelry":
      case "jewellery":
      case "rings":
      case "ring":
      case "necklace":
      case "watches":
      case "watch":
      case "strips":
        return JEWELRY.sendPaginatedJewelry(message);

      case "structure":
      case "building":
      case "house":
        return Structure.sendPaginatedStructures(message);

      // Default: Send an embed with instructions
      default: {
        const embed = new EmbedBuilder()
          .setColor(0x1F8B4C)
          .setTitle("🛒 SHOP COMMANDS")
          .setDescription("Browse and trade various items. Use one of the categories below to view listings or see how to buy/sell items.")
          .addFields(
            {
              name: "❔ View Items",
              value:
                "• **shop car** – View available cars\n" +
                "• **shop structure** – View houses/buildings\n" +
                "• **shop jewelry** – View jewelry items\n" +
                "• **(or)** **shop** – Show this guide",
              inline: false
            },
            {
              name: "❔ How to Buy",
              value:
                "• **buy car `<car_id>`** – Buy a specific car\n" +
                "• **buy structure `<structure_id>`** – Buy a house or building\n" +
                "• **buy jewelry `<jewelry_id>`** – Buy a piece of jewelry\n" +
                "• **buy roses `<amount>`** – Buy a certain number of roses",
              inline: false
            },
            {
              name: "❔ How to Sell",
              value:
                "• **sell car `<car_id>`** – Sell a specific car\n" +
                "• **sell structure `<structure_id>`** – Sell a house or building\n" +
                "• **sell jewelry `<jewelry_id>`** – Sell a piece of jewelry",
              inline: false
            }
          )
          .setFooter({ text: "Happy shopping! Use the commands above to get started." });

        return message.channel.send({ embeds: [embed] });
      }
    }
  }
};