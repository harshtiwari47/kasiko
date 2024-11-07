import {
  getUserData,
  updateUser,
  readStockData,
  writeStockData
} from '../../../database.js';

import {
  updateNetWorth
} from '../../../utils/updateNetworth.js';

import { Helper } from '../../../helper.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import dotenv from 'dotenv';
dotenv.config();

const APPTOKEN = process.env.APP_ID;

const stockData = readStockData();

function createStockEmbed(name, stock) {
  return new EmbedBuilder()
  .setTitle(String(name))
  .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${stock.image}.png`) // Use image
  .addFields(
    {
      name: "ᯓ★ Current Price", value: `<:kasiko_coin:1300141236841086977>${stock.currentPrice}`, inline: true
    },
    {
      name: "ᯓ★  Trend", value: `${stock.trend}`, inline: true
    },
    {
      name: "ᯓ★ Sector", value: `${stock.sector}`, inline: true
    },
    {
      name: "ᯓ★ Market", value: `<:kasiko_coin:1300141236841086977>${stock.marketCap}`, inline: true
    },
    {
      name: "ᯓ★ Volatility", value: `${stock.volatility}`, inline: true
    },
    {
      name: "ᯓ★  High (last 10)", value: `${Math.max(...stock.last10Prices)}`, inline: true
    },
    {
      name: "ᯓ★ Low (last 10)", value: `${Math.min(...stock.last10Prices)}`, inline: true
    }
  )
  .setFooter({
    text: `Stock Information`
  })
  .setColor("#e20b65");
}

export async function sendPaginatedStocks(context) {
  try {
    const stockDataArray = Object.values(stockData);
    const user = context.user || context.author; // Handles both Interaction and Message
    if (!user) return; // Handle the case where neither user nor author exists

    let currentIndex = 0;
    const stockEmbed = createStockEmbed(Object.keys(stockData)[currentIndex], stockDataArray[currentIndex]);

    // Buttons for navigation
    const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setCustomId("previousStock")
      .setLabel("previousStock")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId("nextStock")
      .setLabel("nextStock")
      .setStyle(ButtonStyle.Primary)
    );

    // Send initial message
    const message = await context.channel.send({
      embeds: [stockEmbed], components: [buttons], fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
      time: 360000
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        return buttonInteraction.reply({
          content: "You can't interact with this button.", ephemeral: true
        });
      }

      // Update index based on button click
      if (buttonInteraction.customId === "nextStock") {
        currentIndex++;
      } else if (buttonInteraction.customId === "previousStock") {
        currentIndex--;
      }

      // Update embed and button state
      const newStockEmbed = createStockEmbed(Object.keys(stockData)[currentIndex], stockDataArray[currentIndex]);
      buttons.components[0].setDisabled(currentIndex === 0);
      buttons.components[1].setDisabled(currentIndex === stockDataArray.length - 1);

      await buttonInteraction.update({
        embeds: [newStockEmbed], components: [buttons]
      });
    });

    collector.on("end",
      () => {
        buttons.components.forEach(button => button.setDisabled(true));
        message.edit({
          components: [buttons]
        });
      });
  } catch (e) {
    console.error(e);
    return context.channel.send("⚠️ Something went wrong while viewing stock!");
  }
}

function updateStockPrices() {
  for (const stock in stockData) {
    const changePercent = (Math.random() * 10 - 5) * stockData[stock].volatility; // +/- 5% * volatility change
    let newPrice = Math.max(stockData[stock].maxmin[1], stockData[stock].currentPrice * (1 + changePercent / 100));
    if (newPrice > stockData[stock].maxmin[0]) newPrice = stockData[stock].maxmin[0];
    stockData[stock].currentPrice = parseFloat(newPrice.toFixed(2));
    stockData[stock].last10Prices.push(parseFloat(newPrice.toFixed(2)));

    if (stockData[stock].last10Prices.length > 10) {
      stockData[stock].last10Prices.shift(); // Remove the oldest price
    }
  }

  writeStockData(stockData);
}

// Update stock prices every hour (3600000 ms)
setInterval(updateStockPrices, 360000);


export async function stockPrice(stockName, message) {
  try {
    if (stockData[stockName]) {
      message.channel.send(`📊 𝐒𝐭𝐨𝐜𝐤 𝐏𝐫𝐢𝐜𝐞\n\n**${stockName}** is currently priced at <:kasiko_coin:1300141236841086977>**${stockData[stockName].currentPrice}** 𝑪𝒂𝒔𝒉.`);
    } else {
      message.channel.send("⚠️ Stock not found.");
    }
  } catch (e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while checking stock's price.");
  }
}

export async function buyStock(stockName, amount, message) {
  try {
    const userId = message.author.id;
    let userData = getUserData(userId);
    const numShares = parseInt(amount);

    if (!stockData[stockName]) {
      return message.channel.send("⚠️ Stock not found.");
    }

    const stockPrice = stockData[stockName].currentPrice;
    let totalCost = stockPrice * numShares;
    totalCost = Number(totalCost.toFixed(0));

    if ((userData.cash || 0) >= totalCost) {
      userData.cash = (userData.cash || 0) - totalCost;
      userData.stocks[stockName] = (userData.stocks[stockName] || 0) + numShares;

      updateNetWorth(message.author.id);

      // update user data
      updateUser(message.author.id,
        userData);
      return message.channel.send(`📊 𝐒𝐭𝐨𝐜𝐤(𝐬) 𝐏𝐮𝐫𝐜𝐡𝐚𝐬𝐞𝐝\n\n**${message.author.username}** bought **${numShares}** shares of **${stockName}** for <:kasiko_coin:1300141236841086977>**${totalCost}** 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`);
    } else {
      return message.channel.send(`⚠️ **${message.author.username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉.`);
    }
  } catch(e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while buying stock(s).");
  }
}

export async function sellStock(stockName, amount, message) {
  try {
    const userId = message.author.id;
    let userData = getUserData(userId);
    const numShares = parseInt(amount);

    if (!stockData[stockName] || !userData.stocks || userData.stocks[stockName] < numShares) {
      return message.channel.send(`⚠️ **${message.author.username}**, you don’t own enough shares or stock not found.`);
    }

    const stockPrice = stockData[stockName].currentPrice;
    const earnings = stockPrice * numShares;

    userData.cash = Number(((userData.cash || 0) + earnings).toFixed(1));
    userData.stocks[stockName] -= numShares;
    if (userData.stocks[stockName] === 0) delete userData.stocks[stockName];


    updateNetWorth(message.author.id);


    // update user data
    updateUser(message.author.id,
      userData);

    message.channel.send(`📊 𝐒𝐭𝐨𝐜𝐤(𝐬) 𝐒𝐨𝐥𝐝\n\n**${message.author.username}** sold **${numShares}** shares of **${stockName}** for <:kasiko_coin:1300141236841086977>**${earnings.toFixed(1)}** 𝑪𝒂𝒔𝒉.`);
  } catch (e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while selling stock(s).");
  }
}

export async function portfolio(userId, message) {
  try {
    let userData = getUserData(userId);

    if (!userData.stocks) return message.channel.send("⚠️ User don't own any 📊 stocks.");

    let portfolioDetails = `▒░✩ <@${userId}>'s 𝐒𝐭𝐨𝐜𝐤𝐬 𝐏𝐨𝐫𝐭𝐟𝐨𝐥𝐢𝐨\n▁▁▁▁▁▁▁▁▁\n`;
    let portfolioValue = 0;

    for (const stockName in userData.stocks) {
      const numShares = userData.stocks[stockName];
      const stockPrice = stockData[stockName].currentPrice;
      const stockValue = numShares * stockPrice;
      portfolioValue += stockValue;
      portfolioDetails += `ᯓ★ **${stockName}**: **${numShares}** shares worth <:kasiko_coin:1300141236841086977>**${stockValue.toFixed(0)}** 𝑪𝒂𝒔𝒉\n`;
    }
    portfolioDetails += `\n𝑇𝑜𝑡𝑎𝑙 𝑃𝑜𝑟𝑡𝑓𝑜𝑙𝑖𝑜 𝑉𝑎𝑙𝑢𝑒: <:kasiko_coin:1300141236841086977>${portfolioValue.toFixed(0)} 𝑪𝒂𝒔𝒉`;
    message.channel.send(portfolioDetails);
  } catch (e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while viewing stock portfolio.");
  }
}


export default {
  name: "stock",
  description: "View and manage stocks in the stock market.",
  aliases: ["stocks", "s"],
  args: "<command> [parameters]",
  example: [
    "stock", // View all available stocks
    "stock price <symbol>", // View the price of a specific stock
    "stock buy <symbol> <amount>", // Buy a specific stock
    "stock sell <symbol> <amount>", // Sell a specific stock
    "stock portfolio [@user]", // View a user's portfolio or your own
  ],
  related: ["stocks", "portfolio", "buy", "sell"],
  cooldown: 2000, // Cooldown of 2 seconds
  category: "Stocks",

  execute: (args, message) => {
    const command = args[1] ? args[1].toLowerCase() : null;

    switch (command) {
      case "price":
      case "p":
        if (args[2]) {
          return stockPrice(args[2].toUpperCase(), message); // Show stock price for the given symbol
        }
        return message.channel.send("⚠️ Please specify a stock symbol to check the price.");

      case "buy":
      case "b":
        if (args[2] && Helper.isNumber(args[3])) {
          return buyStock(args[2].toUpperCase(), args[3], message); // Buy a stock
        }
        return message.channel.send("⚠️ Please specify a valid stock symbol and amount to buy. Example: `.buyStock <symbol> <amount>`");

      case "sell":
      case "s":
        if (args[2] && Helper.isNumber(args[3])) {
          return sellStock(args[2].toUpperCase(), args[3], message); // Sell a stock
        }
        return message.channel.send("⚠️ Please specify a valid stock symbol and amount to sell. Example: `.sellStock <symbol> <amount>`");

      case "portfolio":
      case "pf":
        if (args[2] && Helper.isUserMention(args[2])) {
          return portfolio(Helper.extractUserId(args[2]), message); // View mentioned user's portfolio
        }
        return portfolio(message.author.id, message); // View the user's own portfolio

      case "all":
      case "view":
        return sendPaginatedStocks(message); // Show all available stocks

      default:
        return message.channel.send("⚠️ Invalid command. Use `stock all`, `stock price <symbol>`, `stock buy <symbol> <amount>`, `stock sell <symbol> <amount>`, or `stock portfolio`.");
    }
  }
};