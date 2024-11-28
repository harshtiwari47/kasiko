import {
  getUserData,
  updateUser,
  readStockData,
  writeStockData
} from '../../../database.js';

import {
  generateStockChart
} from './canvas.js';

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
  EmbedBuilder,
  AttachmentBuilder
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
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("previousStock").setLabel("Previous").setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId("nextStock").setLabel("Next").setStyle(ButtonStyle.Primary)
    );

    // Send initial message
    const message = await context.channel.send({
      embeds: [stockEmbed],
      components: [buttons],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      time: 3 * 60 * 1000, // 3 minutes
    });


    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        return buttonInteraction.reply({
          content: "You can't interact with this button.",
          ephemeral: true,
        });
      }

      try {
        await buttonInteraction.deferUpdate(); // Prevent timeout
        if (buttonInteraction.customId === "nextStock") currentIndex++;
        else if (buttonInteraction.customId === "previousStock") currentIndex--;

        // Update embed and button states
        const newStockEmbed = createStockEmbed(
          Object.keys(stockData)[currentIndex],
          stockDataArray[currentIndex]
        );
        buttons.components[0].setDisabled(currentIndex === 0);
        buttons.components[1].setDisabled(currentIndex === stockDataArray.length - 1);

        return await buttonInteraction.editReply({
          embeds: [newStockEmbed],
          components: [buttons],
        });
      } catch (err) {
        console.error("Error updating interaction:", err);
        return buttonInteraction.reply({
          content: "An error occurred while updating. Please try again.",
          ephemeral: true,
        });
      }
    });

    collector.on("end",
      async () => {
        buttons.components.forEach((button) => button.setDisabled(true));
        try {
          return await message.edit({
            components: [buttons],
          });
        } catch (err) {
          console.error("Error disabling buttons on collector end:", err);
        }
      });

  } catch (err) {
    console.error(err);
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
    // Check if the stock exists
    if (stockData[stockName]) {
      const stock = stockData[stockName];

      // Generate the stock chart
      const chartBuffer = await generateStockChart(stock);

      // Create the image attachment
      const attachment = new AttachmentBuilder(chartBuffer, {
        name: 'stock-chart.png'
      });

      // Create the embed
      const embed = new EmbedBuilder()
      .setTitle(`📊 Stock Price: ${stockName}`)
      .setDescription(`**${stockName}** is currently priced at <:kasiko_coin:1300141236841086977> **${stock.currentPrice}** 𝑪𝒂𝒔𝒉.`)
      .setImage('attachment://stock-chart.png')
      .setColor('#007bff')
      .setFooter({
        text: 'Stock data provided by Heroliq Stocks'
      });

      // Send the embed with the attachment
      await message.channel.send({
        embeds: [embed], files: [attachment]
      });
    } else {
      message.channel.send("⚠️ Stock not found.");
    }
  } catch (error) {
    console.error(error);
    message.channel.send("⚠️ Something went wrong while checking stock's price.");
  }
}

export async function buyStock(stockName, amount, message) {
  try {
    const userId = message.author.id;
    let userData = await getUserData(userId);
    const numShares = parseInt(amount);

    if (!stockData[stockName]) {
      return message.channel.send("⚠️ Stock not found.");
    }

    let totalUniqueStocks = Object.keys(userData.stocks.toJSON()).reduce((sum, stock) => {
      if (stock.shares && stock.shares > 0) {
        sum += 1
      }
      return sum;
    },
      0);

    if (userData.stocks && totalUniqueStocks > 5) {
      return message.channel.send(`⚠️ **${message.author.username}**, you can't own more than five companies' stocks!`)
    }

    const stockPrice = stockData[stockName].currentPrice;
    let totalCost = stockPrice * numShares;
    totalCost = Number(totalCost.toFixed(0));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total shares owned by the user across all stocks
    const totalSharesOwned = Object.values(userData.stocks.toJSON()).reduce((sum, stock) => stock.name ? sum + stock.shares: 0, 0);

    // Check limits before processing purchase
    if (userData.stocks[stockName] && numShares > 100 - userData.stocks[stockName].dailyPurchased[1]) {
      return message.channel.send(`⚠️ **${message.author.username}**, you can't buy more than 100 shares of **${stockName}** today.`);
    } else if (totalSharesOwned + numShares > 200) {
      return message.channel.send(`⚠️ **${message.author.username}**, you can't own more than 200 shares in total.`);
    } else if ((userData.cash || 0) >= totalCost) {
      // Process the purchase
      userData.cash = Number(((userData.cash || 0) - totalCost).toFixed(1));

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

      // Update user data
      await updateUser(message.author.id, userData);

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
    let userData = await getUserData(userId);
    const numShares = parseInt(amount);
    stockName = stockName.toUpperCase().trim();

    if (!stockData[stockName] || !userData.stocks || !userData.stocks[stockName] || userData.stocks[stockName].shares < numShares) {
      return message.channel.send(`⚠️ **${message.author.username}**, you don’t own enough shares or stock not found.`);
    }

    const stockPrice = stockData[stockName].currentPrice;
    const earnings = stockPrice * numShares;

    userData.cash = Number(((userData.cash || 0) + earnings).toFixed(1));

    // average weighted cost
    if (
      userData.stocks[stockName] &&
      typeof userData.stocks[stockName].cost === 'number' &&
      typeof userData.stocks[stockName].shares === 'number' &&
      userData.stocks[stockName].shares !== 0 &&
      typeof numShares === 'number'
    ) {
      userData.stocks[stockName].cost -= Number(((userData.stocks[stockName].cost / userData.stocks[stockName].shares) * numShares).toFixed(1));
    } else {
      console.error("Invalid data for cost calculation:", userData.stocks[stockName]);
    }

    userData.stocks[stockName].shares -= numShares;

    if (userData.stocks[stockName].shares === 0) {
      let dailyPurchased = userData.stocks[stockName].dailyPurchased;
      delete userData.stocks[stockName];
      userData.stocks[stockName] = {};
      userData.stocks[stockName].dailyPurchased = dailyPurchased;
      userData.stocks[stockName].cost = 0;
      userData.stocks[stockName].shares = 0;
    }

    // update user data
    await updateUser(message.author.id,
      userData);

    message.channel.send(`📊 𝐒𝐭𝐨𝐜𝐤(𝐬) 𝐒𝐨𝐥𝐝\n\n**${message.author.username}** sold **${numShares}** shares of **${stockName}** for <:kasiko_coin:1300141236841086977>**${earnings.toFixed(1)}** 𝑪𝒂𝒔𝒉.`);
  } catch (e) {
    console.error(e);
    message.channel.send("⚠️ Something went wrong while selling stock(s).");
  }
}

export async function portfolio(userId, message) {
  try {
    let userData = await getUserData(userId);

    if (!userData.stocks) {
      return message.channel.send({
        content: "⚠️ User doesn't own any 📊 stocks.",
      });
    }

    let portfolioDetails = "";
    let portfolioValue = 0;
    let cost = 0;

    for (const stockName in userData.stocks.toJSON()) {
      if (stockName === "_id") continue;
      if (
        userData &&
        userData.stocks &&
        userData.stocks[stockName] &&
        stockData[stockName] &&
        userData.stocks[stockName].shares === 0
      )
        continue;

      const numShares = userData.stocks[stockName].shares;
      const stockPrice = stockData[stockName].currentPrice;
      const stockValue = numShares * stockPrice;

      portfolioValue += stockValue;
      cost += userData.stocks[stockName].cost;

      portfolioDetails += `ᯓ★ **${stockName}**: **${numShares}** shares worth <:kasiko_coin:1300141236841086977>**${stockValue.toFixed(
        0
      )}** 𝑪𝒂𝒔𝒉\n`;
    }

    const profitLossPercent = ((portfolioValue - cost) / cost) * 100;
    const profitLossLabel = profitLossPercent >= 0 ? "Profit": "Loss";
    const profitLossSymbol = profitLossPercent >= 0 ? "+": "-";
    const finalPercentage = `${profitLossSymbol}${Math.abs(profitLossPercent).toFixed(2)}`;

    // Embed 1: Portfolio Overview
    const embed1 = new EmbedBuilder()
    .setTitle(`📈 <@${userId}>'s 𝐒𝐭𝐨𝐜𝐤𝐬 𝐏𝐨𝐫𝐭𝐟𝐨𝐥𝐢𝐨`)
    .setDescription(portfolioDetails || "No stocks found.")
    .addFields([{
      name: "𝑻𝒐𝒕𝒂𝒍 𝑷𝒐𝒓𝒕𝒇𝒐𝒍𝒊𝒐 𝑽𝒂𝒍𝒖𝒆",
      value: `<:kasiko_coin:1300141236841086977>${portfolioValue.toFixed(0)} 𝑪𝒂𝒔𝒉`,
    },
    ])
    .setColor("#f2dada");

    // Embed 2: Portfolio Summary
    const embed2 = new EmbedBuilder()
    .addFields([{
      name: "𝑻𝒐𝒕𝒂𝒍 𝑩𝒓𝒐𝒖𝒈𝒉𝒕 𝑷𝒓𝒊𝒄𝒆",
      value: `<:kasiko_coin:1300141236841086977>${cost.toFixed(0)} 𝑪𝒂𝒔𝒉`,
    },
      {
        name: `𝑁𝑒𝑡 ${profitLossLabel}`,
        value: `${isNaN(finalPercentage) ? "0": finalPercentage}%`,
      },
    ])
    .setColor(profitLossPercent >= 0 ? "#a8dabf": "#f56056");

    // Send Embeds
    return await message.channel.send({
      embeds: [embed1, embed2]
    });
    //await message.channel.send({ embeds: [embed2] });
  } catch (e) {
    console.error(e);
    return message.channel.send({
      content: "⚠️ Something went wrong while viewing stock portfolio.",
    });
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
    if (!command) return sendPaginatedStocks(message); // Show all available Stocks
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
      return message.channel.send("⚠️ Please specify a valid stock symbol and amount to buy. Example: `stock buy <symbol> <amount>`");

    case "sell":
    case "s":
      if (args[2] && Helper.isNumber(args[3])) {
        return sellStock(args[2].toUpperCase(), args[3], message); // Sell a stock
      }
      return message.channel.send("⚠️ Please specify a valid stock symbol and amount to sell. Example: `stock sell <symbol> <amount>`");

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