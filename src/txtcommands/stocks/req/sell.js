import Company from '../../../../models/Company.js';
import {
  getUserData,
  updateUser
} from '../../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';
import redisClient from '../../../../redis.js';

import {
  handleMessage,
  discordUser
} from '../../../../helper.js';

export async function sellSharesCommand(message, args) {
  try {
    const userId = message.user ? message.user.id : message.author.id;
    const username = message.user ? message.user.username : message.author.username;
    
    // Expected usage: stock sell <companyName> <numShares>
    const companyName = args[1];
    const sharesArg = args[2];

    if (!companyName || !sharesArg) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide the company name and the number of shares to sell.\n**Usage:** \`stock sell <companyName> <numShares>\``
      });
    }

    const numShares = parseInt(sharesArg, 10);
    if (isNaN(numShares) || numShares <= 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a valid number of shares greater than 0.`
      });
    }

    // Find the company (assuming names are stored in uppercase)
    const company = await Company.findOne({
      name: companyName.toUpperCase()
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, no company found with the name **${companyName.toUpperCase()}**.`
      });
    }

    // Retrieve the user's data
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: "User data not found."
      });
    }

    // Check if the user owns any shares of this company
    let shareholder = company.shareholders.find(s => s.userId === userId);
    if (!shareholder) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not own any shares of **${company.name}**.`
      });
    }

    // Ensure the user has enough shares to sell
    if (shareholder.shares < numShares) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have ${numShares} shares to sell. You currently own ${shareholder.shares} shares.`
      });
    }

    // Calculate the total sale value based on the company’s current price
    const currentPrice = company.currentPrice;
    const totalSaleValue = Math.round(currentPrice * numShares * 10) / 10;

    // Increase the user's cash by the sale value
    userData.cash = (userData.cash || 0) + totalSaleValue;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Update the shareholder's record proportionally
    const avgCostPerShare = (shareholder.cost || 0) / (shareholder.shares || 1);
    shareholder.shares -= numShares;
    shareholder.cost = Math.max(0, (shareholder.cost || 0) - (avgCostPerShare * numShares));

    if (shareholder.shares <= 0) {
      company.shareholders = company.shareholders.filter(s => s.userId !== userId);
    }

    // -----------------------------
    // Downward Price impact mechanism
    // -----------------------------
    const previousSharesOutstanding = Math.max(1, company.totalSharesOutstanding || 1000);
    const priceImpactFactor = 0.05;
    const oldPrice = company.currentPrice;
    const impact = Math.min(0.20, priceImpactFactor * (numShares / previousSharesOutstanding));
    const newPrice = Math.max(0.1, Math.round(oldPrice * (1 - impact) * 10) / 10);

    company.currentPrice = newPrice;
    company.totalSharesOutstanding = Math.max(1, previousSharesOutstanding - numShares);
    company.marketCap = parseFloat((company.currentPrice * company.totalSharesOutstanding).toFixed(2));

    // Update rolling last10Prices array
    company.last10Prices = company.last10Prices || [];
    company.last10Prices.push(newPrice);
    if (company.last10Prices.length > 10) {
      company.last10Prices.shift();
    }

    // Append to price history
    company.priceHistory = company.priceHistory || [];
    company.priceHistory.push({
      price: newPrice,
      date: new Date()
    });
    if (company.priceHistory.length > 50) {
      company.priceHistory.shift();
    }

    company.maxPrice = Math.max(...company.last10Prices, newPrice);
    company.minPrice = Math.min(...company.last10Prices, newPrice);
    company.trend = newPrice < oldPrice ? 'down' : (newPrice > oldPrice ? 'up' : 'stable');

    await company.save();

    // Record trade volume & invalidate portfolio cache
    await redisClient.incrByFloat(`stock:vol:sell:${company.name}`, numShares).catch(() => {});
    await redisClient.del(`totalStockPrice:${userId}`).catch(() => {});

    const description = `## 📊 𝐒𝐡𝐚𝐫𝐞𝐬 𝐒𝐨𝐥𝐝\n\n\n**${username}**, you have sold **${numShares}** shares of **${company.name}** for <:kasiko_coin:1300141236841086977> **${totalSaleValue.toLocaleString()}** 𝑪𝒂𝒔𝒉.\nɴᴇᴡ ꜱᴛᴏᴄᴋ ᴘʀɪᴄᴇ: **${company.currentPrice.toFixed(2)}**`;

    return handleMessage(message, {
      content: description
    });

  } catch (error) {
    console.error("Error in sellSharesCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your share sale.\n**Error**: ${error.message}`
    });
  }
}