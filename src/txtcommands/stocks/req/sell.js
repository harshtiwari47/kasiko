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
    const username = message.user ? (message.user.globalName || message.user.username) : (message.author.globalName || message.author.username);

    // Clean arguments: remove nulls, undefined, and command name prefixes
    const cleanArgs = (Array.isArray(args) ? args : [])
      .filter(a => a !== null && a !== undefined)
      .map(a => String(a).trim())
      .filter(a => {
        const lower = a.toLowerCase();
        return lower !== 'stock' && lower !== 'stocks' && lower !== 'sell' && lower !== 's';
      });

    if (cleanArgs.length === 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide the company name and number of shares to sell.\n-# **Usage:** \`kas stock sell <company> <amount|all>\` or \`/stocks sell\``
      });
    }

    let companyName = null;
    let sharesArg = null;

    if (cleanArgs.length === 1) {
      companyName = cleanArgs[0];
      sharesArg = 'all';
    } else {
      const firstLower = cleanArgs[0].toLowerCase();
      const secondLower = cleanArgs[1].toLowerCase();

      // Check if amount was provided first (e.g. `sell 10 AAPL` or `sell all AAPL`)
      if (firstLower === 'all' || firstLower === 'max' || (!isNaN(parseInt(firstLower, 10)) && isNaN(parseInt(secondLower, 10)))) {
        sharesArg = cleanArgs[0];
        companyName = cleanArgs.slice(1).join(' ');
      } else {
        companyName = cleanArgs[0];
        sharesArg = cleanArgs.slice(1).join(' ');
      }
    }

    if (!companyName) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a valid company name.`
      });
    }

    // Find the company (case-insensitive)
    const company = await Company.findOne({
      name: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') }
    });

    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, no company found with the name or symbol **${companyName.toUpperCase()}**.`
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
    const shareholder = company.shareholders.find(s => s.userId === userId);
    if (!shareholder || shareholder.shares <= 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not own any shares of **${company.name}**.`
      });
    }

    // Resolve number of shares to sell (supports 'all' / 'max')
    let numShares;
    const sharesArgLower = String(sharesArg).toLowerCase().trim();
    if (sharesArgLower === 'all' || sharesArgLower === 'max') {
      numShares = shareholder.shares;
    } else {
      numShares = parseInt(sharesArg, 10);
    }

    if (isNaN(numShares) || numShares <= 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a valid number of shares greater than 0 (or \`all\`).`
      });
    }

    // Ensure the user has enough shares to sell
    if (shareholder.shares < numShares) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have **${numShares.toLocaleString()}** shares to sell. You currently own **${shareholder.shares.toLocaleString()}** shares of **${company.name}**.`
      });
    }

    // Calculate total sale value and profit/loss
    const currentPrice = Number(company.currentPrice || 100);
    const totalSaleValue = Math.round(currentPrice * numShares * 10) / 10;
    const avgCostPerShare = (shareholder.cost || 0) / (shareholder.shares || 1);
    const costBasisSold = Math.round(avgCostPerShare * numShares * 10) / 10;
    const netProfitLoss = Math.round((totalSaleValue - costBasisSold) * 10) / 10;
    const isProfit = netProfitLoss >= 0;

    // Increase the user's cash by the sale value
    userData.cash = (userData.cash || 0) + totalSaleValue;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Update shareholder record
    shareholder.shares -= numShares;
    shareholder.cost = Math.max(0, (shareholder.cost || 0) - (avgCostPerShare * numShares));

    if (shareholder.shares <= 0) {
      company.shareholders = company.shareholders.filter(s => s.userId !== userId);
    }
    company.markModified('shareholders');

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
    company.markModified('last10Prices');

    // Append to price history
    company.priceHistory = company.priceHistory || [];
    company.priceHistory.push({
      price: newPrice,
      date: new Date()
    });
    if (company.priceHistory.length > 50) {
      company.priceHistory.shift();
    }
    company.markModified('priceHistory');

    company.maxPrice = Math.max(...company.last10Prices, newPrice);
    company.minPrice = Math.min(...company.last10Prices, newPrice);
    company.trend = newPrice < oldPrice ? 'down' : (newPrice > oldPrice ? 'up' : 'stable');

    await company.save();

    // Record trade volume & invalidate portfolio cache
    await redisClient.incrByFloat(`stock:vol:sell:${company.name}`, numShares).catch(() => {});
    await redisClient.del(`totalStockPrice:${userId}`).catch(() => {});

    const pnlIcon = isProfit ? '<:stocks_profit:1321342107574599691>' : '<:stocks_loss:1321342088020885525>';
    const pnlText = isProfit
      ? `${pnlIcon} **Profit:** +<:kasiko_coin:1300141236841086977> **${netProfitLoss.toLocaleString()}**`
      : `${pnlIcon} **Loss:** -<:kasiko_coin:1300141236841086977> **${Math.abs(netProfitLoss).toLocaleString()}**`;

    const description =
      `## <:stocks:1391426624666337431> **Shares Sold Successfully**\n\n` +
      `**${username}**, you sold **${numShares.toLocaleString()}** shares of **${company.name}** for <:kasiko_coin:1300141236841086977> **${totalSaleValue.toLocaleString()}** Cash!\n` +
      `• **Execution Price:** <:kasiko_coin:1300141236841086977> **${currentPrice.toFixed(2)}** / share\n` +
      `• **Net Performance:** ${pnlText}\n` +
      `• **New Market Price:** <:kasiko_coin:1300141236841086977> **${newPrice.toFixed(2)}**\n` +
      `• **Wallet Balance:** <:kasiko_coin:1300141236841086977> **${userData.cash.toLocaleString()}**\n\n` +
      `-# 💡 Use \`kas portfolio\` to manage remaining holdings or \`kas stocks\` to view the market.`;

    return handleMessage(message, {
      content: description
    });

  } catch (error) {
    console.error("Error in sellSharesCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your share sale.\n-# **Error**: ${error.message}`
    });
  }
}

export default sellSharesCommand;