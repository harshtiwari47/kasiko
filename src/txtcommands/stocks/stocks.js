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
  buyStock
} from './req/buy.js';

import {
  portfolio
} from './req/portfolio.js';

import {
  sellStock
} from './req/sell.js';

import {
  handleBuyRequest
} from './req/buyHandler.js';

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
  let embedColor;
  switch (stock.trend.toLowerCase()) {
    case 'up':
      embedColor = '#28a745'; // Green
      break;
    case 'down':
      embedColor = '#dc3545'; // Red
      break;
    case 'stable':
    default:
      embedColor = '#007bff'; // Blue
      break;
  }

  // First Embed: General Overview
  const generalInfoEmbed = new EmbedBuilder()
    .setTitle(`${name}`)
    .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${stock.image}.png`)
    .setColor(embedColor)
    .addFields(
      {
        name: "General Overview",
        value: `**Description**: ${stock.description}\n` +
               `**Sector**: ${stock.sector}\n` +
               `**CEO**: ${stock.CEO}`,
        inline: false
      },
      {
        name: "Current Status",
        value: `**Current Price**: <:kasiko_coin:1300141236841086977> ${stock.currentPrice.toLocaleString()}\n` +
               `**Trend**: ${capitalizeFirstLetter(stock.trend)} ${stock.trend.toLowerCase() === "up" ? "<:stocks_profit:1321342107574599691>": stock.trend.toLowerCase() === "down" ? "<:stocks_loss:1321342088020885525>" : "~"}\n` +
               `**Volatility**: ${stock.volatility}`,
        inline: false
      }
    );

  // Second Embed: Financial & Performance Metrics
  const financialDetailsEmbed = new EmbedBuilder()
    .setColor(embedColor)
    .addFields(
      {
        name: "Financial Details",
        value: `**P/E Ratio**: ${stock.PEratio}\n` +
               `**Dividend Yield**: ${stock.dividendYield}\n` +
               `**Market Cap**: <:kasiko_coin:1300141236841086977> ${stock.marketCap}`,
        inline: false
      },
      {
        name: "Performance Metrics (Last 10)",
        value: `**High**: ${Math.max(...stock.last10Prices).toLocaleString()}\n` +
               `**Low**: ${Math.min(...stock.last10Prices).toLocaleString()}`,
        inline: false
      }
    );

  return [generalInfoEmbed, financialDetailsEmbed];
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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
      new ButtonBuilder().setCustomId("previousStock").setLabel("⟨ PREVIOUS").setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId("nextStock").setLabel("NEXT ⟩").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("stock_buy").setLabel("🛍️ BUY").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("stock_graph").setLabel("📈 GRAPH").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("info").setLabel("❔").setStyle(ButtonStyle.Secondary)
    );

    // Send initial message
    const message = await context.channel.send({
      embeds: stockEmbed,
      components: [buttons],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      time: 6 * 60 * 1000, // 6 minutes
    });


    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        return buttonInteraction.reply({
          content: "You can't interact with this button.",
          ephemeral: true,
        });
      }

      try {
        if (buttonInteraction.customId === "stock_buy") {
          return await handleBuyRequest(buttonInteraction.user.id, buttonInteraction.user.username, Object.keys(stockData)[currentIndex], buttonInteraction);
        }
        
        if (buttonInteraction.customId === "stock_graph") {
          await buttonInteraction.deferReply();
          let response = await stockPrice(Object.keys(stockData)[currentIndex], buttonInteraction);
          return await buttonInteraction.editReply(response);
        }
        
        if (buttonInteraction.customId === "info") {
          const stockGuideEmbed = new EmbedBuilder()
  .setColor('#2ecc71') // Green color
  .setTitle('📈 Stock Commands Guide')
  .setDescription('Explore and manage stocks easily using these commands.')
  .addFields(
    { name: 'Aliases', value: '`stocks`, `s`, `portfolio or pf`', inline: true },
    { name: 'Arguments', value: '`<command>`: Action (e.g., `price`, `buy`, `sell`)\n`[parameters]`: Additional info (e.g., stock symbol, amount)', inline: true },
    { name: 'Examples', value: `
      - \`stock\`: View all available stocks  
      - \`stock price <symbol>\`: View stock price (alias: \`p\`)
      - \`stock buy <symbol> <amount>\`: Buy a stock (alias: \`b\`)
      - \`stock sell <symbol> <amount>\`: Sell a stock (alias: \`s\`)
      - \`stock portfolio @user\`: View portfolios (alias: \`pf\`)
      - \`stock news\`: Stock news  
      - \`stock boughtprice <symbol>\`: View bought price (alias: \`bp\`)
    ` }
  )
  .setFooter({ text: 'Replace <symbol> and <amount> as needed!' });
          await buttonInteraction.deferReply();
          return await buttonInteraction.editReply( { embeds: [stockGuideEmbed] });
        }
  
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
          embeds: newStockEmbed,
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
  
  const newsEmbed = new EmbedBuilder()
  .setDescription(newspaper)
  .setColor("#e0e6ed");
    
  return message.channel.send({
      embeds: [newsEmbed]
  })
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
      .setDescription(`**${stockName}** is currently priced at <:kasiko_coin:1300141236841086977> **${stock.currentPrice.toLocaleString()}** 𝑪𝒂𝒔𝒉.`)
      .setImage('attachment://stock-chart.png')
      .setColor('#007bff')
      .setFooter({
        text: 'Stock data provided by Kasiko Stocks'
      });

      // Send the embed with the attachment
      return {
        embeds: [embed], files: [attachment]
      };
    } else {
      return {
        content: "⚠️ Stock not found."
      };
    }
  } catch (error) {
    console.error(error);
    return {
        content: "⚠️ Something went wrong while checking stock's price."
    };
  }
}

export async function boughtPrice(message, stockName) {
  const userData = await getUserData(message.author.id);

  if (!(userData && userData.stocks && userData.stocks[stockName] && userData.stocks[stockName].shares > 0)) {
    return message.channel.send(`📊⚠️ **${message.author.username}**, you don't own any stocks of **${stockName}**!`)
  }

  const stockPrice = stockData[stockName].currentPrice;

  const embed = new EmbedBuilder()
  .setColor('#f5bbaf')
  .setDescription(`
    📊 **${message.author.username}**, you have bought **${userData.stocks[stockName].shares}** of **${stockName}** for price <:kasiko_coin:1300141236841086977> **${userData.stocks[stockName].cost.toFixed(0).toLocaleString()}**.\nCurrent Value: <:kasiko_coin:1300141236841086977> **${(Number(stockPrice) * Number(userData.stocks[stockName].shares)).toFixed(1).toLocaleString()}**.
    `);

  return message.channel.send({
    embeds: [embed]
  });
}

export default {
  name: "stock",
  description: "View and manage stocks in the stock market.",
  aliases: ["stocks",
    "s",
    "portfolio",
    "pf"],
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
    "stock portfolio @user",
    "portfolio",
    "pf @user",
    // View a user's portfolio or your own
    "stock news/newspaper",
    // stocks news,
    "stock bp <symbol>",
    "stock boughtprice <symbol>"
  ],
  related: ["stocks",
    "portfolio",
    "buy",
    "sell"],
  emoji: "📈",
  cooldown: 10000,
  // Cooldown of 10 seconds
  category: "🏦 Economy",

  execute: async (args, message) => {
    try {
    const command = args[1] ? args[1].toLowerCase(): null;

    if (args[0] === "portfolio" || args[0] === "pf") {
      if (args[1] && Helper.isUserMention(args[1], message)) {
        return portfolio(Helper.extractUserId(args[1]), message.channel, message.author.id); // View mentioned user's portfolio
      }
      return portfolio(message.author.id, message.channel, message.author.id); // View the user's own Portfolio
    }

    if (!command) return sendPaginatedStocks(message); // Show all available Stocks
    switch (command) {
    case "news":
    case "newspaper":
      return sendNewspaper(message);

    case "price":
    case "p":
      if (args[2]) {
        let response = await stockPrice(args[2].toUpperCase(), message); // Show stock price for the given symbol
        return await message.channel.send(response);
      }
      return message.channel.send("⚠️ Please specify a stock symbol to check the price.");

    case "boughtprice":
    case "bp":

      if (args[2]) {
        if (!stockData[args[2].toUpperCase()]) {
          return message.channel.send("⚠️ Stock not found.");
        }

        return boughtPrice(message, args[2].toUpperCase());
      }

      return message.channel.send("⚠️ Please specify a stock symbol to check it's bought price.");

    case "buy":
    case "b":
      if (args[2] && Helper.isNumber(args[3])) {
        return buyStock(message.author.id, message.author.username, args[2].toUpperCase(), args[3], message.channel); // Buy a stock
      }
      return message.channel.send("⚠️ Please specify a valid stock symbol and amount to buy. Example: `stock buy <symbol> <amount>`");

    case "sell":
    case "s":
      if (args[2] && Helper.isNumber(args[3])) {
        return sellStock(message.author.id, message.author.username, args[2].toUpperCase(), args[3], message.channel); // Sell a stock
      }
      return message.channel.send("⚠️ Please specify a valid stock symbol and amount to sell. Example: `stock sell <symbol> <amount>`");

    case "portfolio":
    case "pf":
      if (args[2] && Helper.isUserMention(args[2], message)) {
        return portfolio(Helper.extractUserId(args[2]), message.channel, message.author.id); // View mentioned user's portfolio
      }
      return portfolio(message.author.id, message.channel, message.author.id); // View the user's own portfolio

    case "all":
    case "view":
      return sendPaginatedStocks(message); // Show all available stocks

    default:
    const embed = new EmbedBuilder()
  .setColor(0xFF0000) // Hex color as a number
  .setTitle('❗ Stocks Command')
  .addFields(
    { name: '`stock all`', value: 'View all available stocks', inline: true },
    { name: '`stock price <symbol>`', value: 'Check the price of a stock', inline: true },
    { name: '`stock buy <symbol> <amount>`', value: 'Buy a stock', inline: true },
    { name: '`stock sell <symbol> <amount>`', value: 'Sell a stock', inline: true },
    { name: '`stock news`', value: 'Get the latest stock news', inline: true },
    { name: '`stock portfolio`', value: 'View your stock portfolio', inline: true }
  )

    return message.channel.send({ embeds: [embed] });
    }
    } catch (e) {
      console.log(e);
    }
  }
};