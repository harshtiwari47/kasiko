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
  buySharesCommand
} from './req/buy.js';

import {
  portfolioCommand
} from './req/portfolio.js';

import {
  sellSharesCommand
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
  AttachmentBuilder,
  ComponentType
} from 'discord.js';

import dotenv from 'dotenv';
dotenv.config();

const APPTOKEN = process.env.APP_ID;

import Company from '../../../models/Company.js';

export function createStockEmbed(name, stock, ownerView = false) {
  let embedColor;
  switch (stock.trend.toLowerCase()) {
    case 'up':
      embedColor = '#7ddf93'; // Green
      break;
    case 'down':
      embedColor = '#ef6f7b'; // Red
      break;
    case 'stable':
    default:
      embedColor = '#007bff'; // Blue
      break;
  }

  // First Embed: General Overview
  const generalInfoEmbed = new EmbedBuilder()
  .setTitle(`<:company:1363405037552009427> ${name}`)
  .setColor(embedColor)
  .addFields(
    {
      name: "𝙂𝙚𝙣𝙚𝙧𝙖𝙡 𝙊𝙫𝙚𝙧𝙫𝙞𝙚𝙬",
      value: `-# ${stock.description}\n` +
      `**Sector**: ${stock.sector}\n` +
      `**CEO**: <:throne:1350387076834791486> ${stock.CEO || stock.ceo}`,
      inline: false
  },
  {
    name: "𝘾𝙪𝙧𝙧𝙚𝙣𝙩 𝙎𝙩𝙖𝙩𝙪𝙨",
    value: `**Current Price**: <:kasiko_coin:1300141236841086977> **${stock.currentPrice.toLocaleString()}**\n` +
    `**Trend**: ${capitalizeFirstLetter(stock.trend)} ${stock.trend.toLowerCase() === "up" ? "<:stocks_profit:1321342107574599691>": stock.trend.toLowerCase() === "down" ? "<:stocks_loss:1321342088020885525>": "~"}\n` +
    `**Volatility**: ${stock.volatility}`,
    inline: false
  }
);

if (stock.image) {
  generalInfoEmbed.setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${stock.image}.png`);
}

// Second Embed: Financial & Performance Metrics
const financialDetailsEmbed = new EmbedBuilder()
.setColor(embedColor)
.addFields(
  {
    name: "𝙁𝙞𝙣𝙖𝙣𝙘𝙞𝙖𝙡 𝘿𝙚𝙩𝙖𝙞𝙡𝙨",
    value: `**P/E Ratio**: ${stock.PEratio ? stock.PEratio : stock.peRatio}\n` +
    `**Dividend Yield**: ${stock.dividendYield}\n` +
    `**Market Cap**: <:kasiko_coin:1300141236841086977> ${stock.marketCap}`,
    inline: false
  },
  {
    name: "𝙋𝙚𝙧𝙛𝙤𝙧𝙢𝙖𝙣𝙘𝙚 𝙈𝙚𝙩𝙧𝙞𝙘𝙨 (Last 10)",
    value: `**High**: <:kasiko_coin:1300141236841086977> ${Math.max(...stock.last10Prices).toLocaleString()}\n` +
    `**Low**: <:kasiko_coin:1300141236841086977> ${Math.min(...stock.last10Prices).toLocaleString()}`,
    inline: false
  }
);

// Extra Embed: Owner View Internal Details (using description)
if (ownerView) {
  const shareholdersCount = stock.shareholders ? stock.shareholders.length : 0;
  
  const ownerDetails = `**Authorized Shares:** ${stock.authorizedShares}\n` +
  `**Total Shares Outstanding:** ${stock.totalSharesOutstanding}\n` +
  `**Share Holders:** ${shareholdersCount}\n` +
  `**Protection:** ${stock.protection}\n` +
  `**Work Count:** ${stock.workCount}\n` +
  `**Last Work At:** ${stock.lastWorkAt ? new Date(stock.lastWorkAt).toLocaleString(): "N/A"}\n` +
  `**Last Salary Withdrawal:** ${stock.lastSalaryWithdrawal ? new Date(stock.lastSalaryWithdrawal).toLocaleString(): "N/A"}\n` +
  `**IPO Date:** ${stock.ipoDate ? new Date(stock.ipoDate).toLocaleString(): "N/A"}\n` +
  `**Funding Rounds:** ${stock.fundingRounds ? stock.fundingRounds.length: 0}`;

  const ownerViewEmbed = new EmbedBuilder()
  .setTitle("𝗢𝗪𝗡𝗘𝗥 𝗩𝗜𝗘𝗪")
  .setColor(embedColor)
  .setDescription(ownerDetails);

  return [generalInfoEmbed,
    financialDetailsEmbed,
    ownerViewEmbed];
}

return [generalInfoEmbed,
  financialDetailsEmbed];
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string) {
return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * sendPaginatedCompanies:
 * This command queries all companies from the database and displays them in a paginated embed.
 * The user (assumed to be the one who invoked the command) can navigate through the list using buttons.
 *
 * Usage: Simply invoke the command (e.g., "company list") and it will display a paginated list.
 */
export async function sendPaginatedStocks(context) {
  try {
    // Query companies from the database, sorted by name.
    const companies = await Company.find({ isPublic: true }).sort({ name: 1 });
    const user = context.user || context.author;
    if (!user) return;
    if (!companies || companies.length === 0) {
      return context.channel.send("⚠️ No companies found.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    let currentIndex = 0;
    // Create the initial embed.
    const initialEmbed = createStockEmbed(companies[currentIndex].name, companies[currentIndex]);

    // Create navigation buttons.
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previousCompany")
        .setLabel("◀ PREVIOUS")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("nextCompany")
        .setLabel("NEXT ▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(companies.length <= 1),
      new ButtonBuilder()
         .setCustomId("stock_buy")
         .setLabel("🛍️ BUY")
         .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
         .setCustomId("stock_graph")
         .setLabel("📈 GRAPH")
         .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("info")
        .setLabel("❔")
        .setStyle(ButtonStyle.Secondary)
    );

    // Send the initial message.
    const message = await context.channel.send({
      embeds: initialEmbed,
      components: [buttons],
      fetchReply: true
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

    // Create a collector for button interactions.
    const collector = message.createMessageComponentCollector({
      filter: i => i.user.id === user.id,
      componentType: ComponentType.Button,
      time: 6 * 60 * 1000 // 6 minutes
    });

    collector.on("collect", async (interaction) => {
      // Ensure only the command invoker can interact.
      if (interaction.user.id !== user.id) {
        return interaction.reply({
          content: "You can't interact with these buttons.",
          ephemeral: true
        });
      }

      try {
        if (interaction.customId === "stock_buy") {
          return await handleBuyRequest(interaction.user.id, interaction.user.username, companies[currentIndex].name, interaction);
        }

        if (interaction.customId === "stock_graph") {
          await interaction.deferReply();
          let response = await stockPrice(companies[currentIndex].name, interaction);
          return await interaction.editReply(response);
        }
        // Handle the info button separately.
        if (interaction.customId === "info") {
          const infoEmbed = new EmbedBuilder()
            .setColor("#2ecc71")
            .setTitle("🏢 Company Listing Guide")
            .setDescription(
              "Use the **NEXT** and **PREVIOUS** buttons to navigate through the companies.\n" +
              "Each company shows its sector, CEO, current stock price, market cap, total shares, and status (private/public).\n" +
              "Additional actions (such as funding or trading) can be added as extra buttons if needed."
            )
            .setFooter({ text: "Company Listing Info" })
            .setTimestamp();
          await interaction.deferReply();
          return await interaction.editReply({ embeds: [infoEmbed] });
        }

        // Defer update to avoid timeout.
        await interaction.deferUpdate();

        // Update currentIndex based on button pressed.
        if (interaction.customId === "nextCompany") {
          currentIndex++;
        } else if (interaction.customId === "previousCompany") {
          currentIndex--;
        }

        // Update button disabled states.
        buttons.components[0].setDisabled(currentIndex === 0);
        buttons.components[1].setDisabled(currentIndex === companies.length - 1);

        // Create new embed for current company.
        const newEmbed = createStockEmbed(companies[currentIndex].name, companies[currentIndex]);
        await interaction.editReply({ embeds: newEmbed, components: [buttons] });
      } catch (err) {
        console.error("Error updating interaction:", err);
        return interaction.reply({
          content: "An error occurred while updating. Please try again.",
          ephemeral: true
        });
      }
    });

    collector.on("end", async () => {
      // Disable all buttons when the collector ends.
      buttons.components.forEach(button => button.setDisabled(true));
      try {
        await message.edit({ components: [buttons] });
      } catch (err) {
        console.error("Error disabling buttons on collector end:", err);
      }
    });
  } catch (err) {
    console.error(err);
    return context.channel.send("⚠️ Something went wrong while viewing companies!").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function updateStockPrices() {
  try {
    const companies = await Company.find({});
    for (const company of companies) {
      // Calculate a random percentage change between -5% and +5%.
      const changePercent = Math.random() * 10 - 5; // Range: -5 to +5%
      let newPrice = company.currentPrice * (1 + changePercent / 100);
      // Ensure newPrice is at least 0.1 and round to one decimal place.
      newPrice = Math.max(newPrice, 0.1);
      newPrice = Math.round(newPrice * 10) / 10;
      
      company.currentPrice = newPrice;
      
      // Update last10Prices: add the new price and remove the oldest if there are more than 10 entries.
      company.last10Prices.push(newPrice);
      if (company.last10Prices.length > 10) {
        company.last10Prices.shift();
      }
      
      // Recalculate maxPrice and minPrice from the last10Prices array.
      company.maxPrice = Math.max(...company.last10Prices);
      company.minPrice = Math.min(...company.last10Prices);
      
      // Update marketCap as currentPrice * totalSharesOutstanding.
      company.marketCap = parseFloat((company.currentPrice * company.totalSharesOutstanding).toFixed(2));
      let trendInfo = 'stable';
      
      // Update trend based on the last three prices.
      if (company.last10Prices.length >= 3) {
        const len = company.last10Prices.length;
        const [p1, p2, p3] = company.last10Prices.slice(len - 3);
        if (p3 > p2 && p2 > p1) {
          company.trend = 'up';
          trendInfo = 'up';
        } else if (p3 < p2 && p2 < p1) {
          company.trend = 'down';
          trendInfo = 'down';
        } else {
          company.trend = 'stable';
          trendInfo = 'stable';
        }
      } else {
        company.trend = 'stable';
      }
      
      // Save the updated company data.
      await company.save();

      buildNews(company.name, trendInfo, company.toObject());
    }
  } catch (err) {
    console.error("Error updating stock prices:", err);
  }
}


export async function sendNewspaper(message) {
  // Ensure currentNewspaper() is defined and returns an array of objects with "headline" and "description" properties
  let newspaperJSON = currentNewspaper();
  let newspaper = `## 📊 NEWSPAPER 🗞️\n⊹\n`;

  newspaperJSON.forEach((news, i) => {
    newspaper += `📰 **${i + 1}.** **${news.headline}**\n${news.description}\n\n`;
  });

  const newsEmbed = new EmbedBuilder()
    .setDescription(newspaper)
    .setColor("#e0e6ed");

  return await message.channel.send({
    embeds: [newsEmbed]
  }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
}

// Update stock prices on server start
await updateStockPrices();

// Update stock prices every hour (3600000 ms)
setInterval(async () => await updateStockPrices(), 3600000);

export async function stockPrice(companyName, message) {
  try {
    // Convert the provided company name to uppercase (assuming company names are stored in uppercase)
    const name = companyName.toUpperCase();
    // Find the company in the database.
    const company = await Company.findOne({ name });
    if (!company) {
      return {
        content: "⚠️ Company not found."
      };
    }

    // Generate a stock chart for the company (this function should accept a company document)
    const chartBuffer = await generateStockChart(company);

    // Create the image attachment
    const attachment = new AttachmentBuilder(chartBuffer, { name: 'company-chart.png' });

    // Create the embed with company price information.
    const embed = new EmbedBuilder()
      .setTitle(`📊 Stock Price: ${company.name}`)
      .setDescription(`**${company.name}** is currently priced at <:kasiko_coin:1300141236841086977> **${company.currentPrice.toLocaleString()}** Cash.`)
      .setImage('attachment://company-chart.png')
      .setColor('#007bff')
      .setFooter({ text: 'Company data provided by Kasiko Stocks' })
      .setTimestamp();

    return {
      embeds: [embed],
      files: [attachment]
    };
  } catch (error) {
    console.error(error);
    return {
      content: "⚠️ Something went wrong while checking the company's stock price."
    };
  }
}

export default {
  name: "stock",
  description: "View and manage stocks in the stock market.",
  aliases: ["stocks", "st", "portfolio", "pf"],
  args: "<command> [parameters]",
  example: [
    // View all available stocks
    "stock",
    // View the price of a specific stock
    "stock price <symbol>",
    // Buy a specific stock
    "stock buy <symbol> <amount>",
    // Sell a specific stock
    "stock sell <symbol> <amount>",
    // View a user's portfolio or your own
    "portfolio",
    // Stock news
    "stock news/newspaper",
  ],
  related: ["stocks", "portfolio", "buy", "sell"],
  emoji: "<:stocks_profit:1321342107574599691>",
  cooldown: 10000, // Cooldown of 10 seconds
  category: "🏦 Economy",

  execute: async (args, message) => {
    try {
      const mainArg = args[0] ? args[0].toLowerCase() : null;
      const command = args[1] ? args[1].toLowerCase() : null;

      // Direct portfolio command if invoked with "portfolio" or "pf"
      if (mainArg === "portfolio" || mainArg === "pf") {
        return portfolioCommand(message);
      }

      // If no specific command is provided, display all stocks
      if (!command) {
        return sendPaginatedStocks(message);
      }

      switch (command) {
        case "news":
        case "newspaper":
          return sendNewspaper(message);

        case "price":
        case "p": {
          if (!args[2]) {
            return message.channel.send(
              "⚠️ Please specify a stock symbol to check the price."
            ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
          const symbol = args[2].toUpperCase();
          const response = await stockPrice(symbol, message);
          return message.channel.send(response).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        case "buy":
        case "b": {
          if (!args[2] || !Helper.isNumber(args[3])) {
            return message.channel.send(
              "⚠️ Please specify a valid stock symbol and amount to buy. Example: `stock buy <symbol> <amount>`"
            ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
          const symbol = args[2].toUpperCase();
          const amount = args[3];
          return buySharesCommand(
            message,
            [null, symbol,
            amount]
          );
        }

        case "sell":
        case "s": {
          if (!args[2] || !Helper.isNumber(args[3])) {
            return message.channel.send(
              "⚠️ Please specify a valid stock symbol and amount to sell. Example: `stock sell <symbol> <amount>`"
            ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
          const symbol = args[2].toUpperCase();
          const amount = args[3];
          return sellSharesCommand(
            message,
            [null, symbol,
            amount]
          );
        }

        case "portfolio":
        case "pf":
          return portfolioCommand(message);

        case "all":
        case "view":
          return sendPaginatedStocks(message);

        default: {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("❗ Stocks Command")
            .addFields(
              { name: "`stock all`", value: "View all available stocks", inline: true },
              { name: "`stock price <symbol>`", value: "Check the price of a stock", inline: true },
              { name: "`stock buy <symbol> <amount>`", value: "Buy a stock", inline: true },
              { name: "`stock sell <symbol> <amount>`", value: "Sell a stock", inline: true },
              { name: "`stock news`", value: "Get the latest stock news", inline: true },
              { name: "`stock portfolio`", value: "View your stock portfolio", inline: true }
            );
          return message.channel.send({ embeds: [embed] }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }
    } catch (error) {
      console.error(error);
    }
  },
};