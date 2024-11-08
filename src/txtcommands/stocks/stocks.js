import {
  getUserData,
  updateUser,
  readStockData,
  writeStockData
} from '../../../database.js';

import {
  updateNetWorth
} from '../../../utils/updateNetworth.js';

import {
  Helper
} from '../../../helper.js';
import {
  buildNews,
  currentNewspaper
} from './stockNews.js';

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

    newPrice = parseFloat(newPrice.toFixed(2));
    stockData[stock].currentPrice = newPrice;
    stockData[stock].last10Prices.push(newPrice);

    if (stockData[stock].last10Prices.length > 10) {
      stockData[stock].last10Prices.shift(); // Remove the oldest price
    }

    // Calculate trend based on the last 3 prices in last10Prices
    const prices = stockData[stock].last10Prices;
    if (prices.length >= 3) {
      const [p1,
        p2,
        p3] = prices.slice(-3); // Get the last 3 prices

      if (p3 > p2 && p2 > p1) {
        stockData[stock].trend = "up";
      } else if (p3 < p2 && p2 < p1) {
        stockData[stock].trend = "down";
      } else {
        stockData[stock].trend = "stable";
      }
    } else {
      stockData[stock].trend = "stable"; // Default to stable if not enough data
    }

    if (Math.random() * 100 < 50) {
      let stockTrend = stockData[stock].trend;
      if (stockTrend === "stable") stockTrend = "";
      buildNews(stock, stockTrend, stockData[stock]);
    }
  }

  writeStockData(stockData);
}

export async function sendNewspaper(message) {
  let newspaperJSON = currentNewspaper();
  let newspaper = `## 📊 NEWSPAPER 🗞️\n⊹\n`;

  newspaperJSON.forEach((news, i) => {
    newspaper += `📰 **${i+1}. ** **${news.headline}**\n${news.description}\n\n`
  });

  return message.channel.send(newspaper)
}

// Update stock prices every server start 
updateStockPrices();
// Update stock prices every hour (600000 ms)
setInterval(updateStockPrices, 600000);


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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total shares owned by the user across all stocks
    const totalSharesOwned = Object.values(userData.stocks).reduce((sum, stock) => sum + stock.shares, 0);

    // Check limits before processing purchase
    if (userData.stocks[stockName] && numShares > 100 - userData.stocks[stockName].dailyPurchased[1]) {
      return message.channel.send(`⚠️ **${message.author.username}**, you can't buy more than 100 shares of **${stockName}** today.`);
    } else if (totalSharesOwned + numShares > 200) {
      return message.channel.send(`⚠️ **${message.author.username}**, you can't own more than 200 shares in total.`);
    } else if ((userData.cash || 0) >= totalCost) {
      // Process the purchase
      userData.cash = (userData.cash || 0) - totalCost;

      if (userData.stocks[stockName]) {
        userData.stocks[stockName].shares += numShares;
        userData.stocks[stockName].cost += totalCost;


        // Initialize or update daily purchased shares count
        if (userData.stocks[stockName] && !userData.stocks[stockName]?.dailyPurchased || userData.stocks[stockName].dailyPurchased[0] !== today.getTime()) {
          userData.stocks[stockName].dailyPurchased = [today.getTime(),
            0];
        }

        userData.stocks[stockName].dailyPurchased[1] += numShares; // Update daily purchased count
      } else {
        userData.stocks[stockName] = {
          shares: numShares,
          cost: totalCost,
          dailySold: [],
          dailyPurchased: [today.getTime(),
            numShares] // Track daily purchased count for new stock
        };
      }

      // Update net worth and user data
      updateNetWorth(message.author.id);
      updateUser(message.author.id, userData);

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

    if (!stockData[stockName] || !userData.stocks || userData.stocks[stockName].shares < numShares) {
      return message.channel.send(`⚠️ **${message.author.username}**, you don’t own enough shares or stock not found.`);
    }

    const stockPrice = stockData[stockName].currentPrice;
    const earnings = stockPrice * numShares;

    userData.cash = Number(((userData.cash || 0) + earnings).toFixed(1));
    userData.stocks[stockName].shares -= numShares;
    if (userData.stocks[stockName].shares === 0) {
      let dailyPurchased = userData.stocks[stockName].dailyPurchased;
      delete userData.stocks[stockName];
      userData.stocks[stockName].dailyPurchased = dailyPurchased;
    }


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
    let cost = 0;

    for (const stockName in userData.stocks) {
      const numShares = userData.stocks[stockName].shares;
      const stockPrice = stockData[stockName].currentPrice;
      const stockValue = numShares * stockPrice;
      portfolioValue += stockValue;
      cost += userData.stocks[stockName].cost;
      portfolioDetails += `ᯓ★ **${stockName}**: **${numShares}** shares worth <:kasiko_coin:1300141236841086977>**${stockValue.toFixed(0)}** 𝑪𝒂𝒔𝒉\n`;
    }
    const profitLossPercent = ((portfolioValue - cost) / cost) * 100;
    const profitLossLabel = profitLossPercent >= 0 ? "Profit": "Loss";
    const profitLossSymbol = profitLossPercent >= 0 ? "+": "-";

    portfolioDetails += `\n𝑇𝑜𝑡𝑎𝑙 𝑃𝑜𝑟𝑡𝑓𝑜𝑙𝑖𝑜 𝑉𝑎𝑙𝑢𝑒: <:kasiko_coin:1300141236841086977>${portfolioValue.toFixed(0)} 𝑪𝒂𝒔𝒉`;
    portfolioDetails += `\n𝑇𝑜𝑡𝑎𝑙 𝐵𝑟𝑜𝑢𝑔ℎ𝑡 𝑃𝑟𝑖𝑐𝑒: <:kasiko_coin:1300141236841086977>${cost.toFixed(0)} 𝑪𝒂𝒔𝒉`;
    portfolioDetails += `\n𝑁𝑒𝑡 ${profitLossLabel}: ${profitLossSymbol}${Math.abs(profitLossPercent).toFixed(2)}%`;
    message.channel.send(portfolioDetails);
  } catch (e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while viewing stock portfolio.");
  }
}


export default {
  name: "stock",
  description: "View and manage stocks in the stock market.",
  aliases: ["stocks",
    "s"],
  args: "<command> [parameters]",
  example: [
    "stock",
    // View all available stocks
    "stock price <symbol>",
    // View the price of a specific stock
    "stock buy <symbol> <amount>",
    // Buy a specific stock
    "stock sell <symbol> <amount>",
    // Sell a specific stock
    "stock portfolio [@user]",
    // View a user's portfolio or your own
    "stock news/newspaper",
    // View a user's portfolio or your own
  ],
  related: ["stocks",
    "portfolio",
    "buy",
    "sell"],
  cooldown: 2000,
  // Cooldown of 2 seconds
  category: "Stocks",

  execute: (args, message) => {
    const command = args[1] ? args[1].toLowerCase(): null;

    switch (command) {
    case "news":
    case "newspaper":
      return sendNewspaper(message);

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
      return message.channel.send("⚠️ Invalid command. Use `stock all`, `stock price <symbol>`, `stock buy <symbol> <amount>`, `stock sell <symbol> <amount>`, `stock news` or `stock portfolio`.");
    }
  }
};