import Company from '../../../../models/Company.js';
import {
  getUserData,
  updateUser
} from '../../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function buySharesCommand(message, args) {
  try {
    const userId = message.user ? message.user.id: message.author.id;
    const username = message.user ? message.user.username: message.author.username;

    // Expected usage: stock buy <companyName> <numShares>
    const companyName = args[1];
    const sharesArg = args[2];

    if (!companyName || !sharesArg) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide the company name and the number of shares to buy.\n**Usage:** \`stock buy <companyName> <numShares>\``
      });
    }

    const numShares = parseInt(sharesArg, 10);
    if (isNaN(numShares) || numShares <= 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a valid number of shares greater than 0.`
      });
    }

    // Check that the amount does not exceed 100 shares per transaction
    if (numShares > 100) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you cannot buy more than 100 shares in a single transaction.`
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

    // Prevent company owners from buying shares in their own company
    if (company.owner === userId) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you cannot buy shares in your own company.`
      });
    }

    // Check if user is buying a new unique company stock.
    // If the user isn't already a shareholder in this company, ensure they don't own shares in 7 companies already.
    const alreadyOwned = company.shareholders.some(s => s.userId === userId);
    if (!alreadyOwned) {
      const userCompaniesCount = await Company.countDocuments({
        'shareholders.userId': userId
      });
      if (userCompaniesCount >= 7) {
        return handleMessage(message, {
          content: `ⓘ **${username}**, you cannot own more than 7 unique company stocks.`
        });
      }
    }

    // Retrieve the user's data
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: "User data not found."
      });
    }

    // Calculate the total cost based on the company’s current price
    const currentPrice = company.currentPrice;
    const totalCost = currentPrice * numShares;
    if (userData.cash < totalCost) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have enough cash to buy ${numShares} shares. Total cost: <:kasiko_coin:1300141236841086977> ${totalCost}.`
      });
    }

    // Check if issuing new shares would exceed the authorized shares limit
    if (company.totalSharesOutstanding + numShares > company.authorizedShares) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, buying ${numShares} shares would exceed the authorized shares limit.`
      });
    }

    // Deduct the cost from the user's cash
    userData.cash -= totalCost;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Update the company's shareholders list
    let shareholder = company.shareholders.find(s => s.userId === userId);
    if (shareholder) {
      shareholder.shares += numShares;
      shareholder.lastInvestedAt = new Date();
      // Assume that the shareholder record has a 'cost' property; if not, initialize it.
      shareholder.cost = (shareholder.cost || 0) + totalCost;
    } else {
      company.shareholders.push({
        userId,
        shares: numShares,
        role: 'investor',
        lastInvestedAt: new Date(),
        cost: totalCost
      });
    }

    // -----------------------------
    // Price update mechanism
    // -----------------------------
    // Save the shares outstanding before adding new shares.
    const previousSharesOutstanding = company.totalSharesOutstanding;
    // Increase total shares outstanding by the number of shares purchased.
    company.totalSharesOutstanding += numShares;

    // Define a price impact factor.
    // This simple model increases the price by a percentage proportional to the volume traded relative to outstanding shares.
    const priceImpactFactor = 0.05; // For example, a 5% impact if traded shares equal the pre-trade outstanding shares.
    const oldPrice = company.currentPrice;
    const impact = priceImpactFactor * (numShares / previousSharesOutstanding);
    const newPrice = oldPrice * (1 + impact);

    // Update the current price (the schema's setter will round it)
    company.currentPrice = newPrice;

    // Update the rolling last10Prices array.
    company.last10Prices.push(newPrice);
    if (company.last10Prices.length > 10) {
      company.last10Prices.shift();
    }

    // Append a new price point to the full price history.
    company.priceHistory.push({
      price: newPrice,
      date: new Date()
    });

    // Update the maximum and minimum price records.
    company.maxPrice = Math.max(company.maxPrice, newPrice);
    company.minPrice = Math.min(company.minPrice, newPrice);

    // Update the trend based on the price change.
    if (newPrice > oldPrice) {
      company.trend = 'up';
    } else if (newPrice < oldPrice) {
      company.trend = 'down';
    } else {
      company.trend = 'stable';
    }

    // Recalculate the market capitalization.
    company.marketCap = company.currentPrice * company.totalSharesOutstanding;

    await company.save();

    const description = `**:bar_chart: 𝐒𝐡𝐚𝐫𝐞𝐬 𝐏𝐮𝐫𝐜𝐡𝐚𝐬𝐞𝐝**\n\n🛍️ **${username}**, you have purchased **${numShares}** shares of **${company.name}** for <:kasiko_coin:1300141236841086977> **${totalCost}**.\nɴᴇᴡ ꜱᴛᴏᴄᴋ ᴘʀɪᴄᴇ: **${company.currentPrice.toFixed(2)}**\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`

    return handleMessage(message, {
      content: description
    });

  } catch (error) {
    console.error("Error in buySharesCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your share purchase.\n**Error**: ${error.message}`
    });
  }
}