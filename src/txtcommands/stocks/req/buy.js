import {
  getUserData,
  updateUser,
  readStockData,
  writeStockData
} from '../../../../database.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data);
  } else {
    return context.send(data);
  }
}

export async function buyStock(userId, username, stockName, amount, context) {
  try {
    const stockData = readStockData();

    let userData = await getUserData(userId);
    const numShares = parseInt(amount, 10);

    if (!stockData[stockName]) {
      return await handleMessage(context, {
        content: "⚠️ Stock not found."
      });
    }
     
    if (!userData.stocks) userData.stocks = {}
    // Calculate total unique stocks with shares > 0
    const totalUniqueStocks = Object.keys(userData.stocks.toJSON()).filter(stock => userData.stocks[stock] && userData.stocks[stock].shares > 0).length;

    if (totalUniqueStocks >= 6) {
      return await handleMessage(context, {
        content: `⚠️ **${username}**, you can't own more than six companies' stocks!`
      });
    }

    const stockPrice = stockData[stockName].currentPrice;
    let totalCost = stockPrice * numShares;
    totalCost = Number(totalCost.toFixed(0));

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Initialize stock data if it doesn't exist
    if (!userData.stocks[stockName]) {
      userData.stocks[stockName] = {
        shares: 0,
        cost: 0,
        dailySold: [],
        dailyPurchased: {
          date: todayDateString,
          count: 0
        }
      };
    }

    // Handle existing data structures
    let dailyPurchased = userData.stocks[stockName].dailyPurchased;
    if (Array.isArray(dailyPurchased)) {
      // Convert array [date, count] to object { date, count }
      dailyPurchased = {
        date: dailyPurchased[0] ? new Date(dailyPurchased[0]).toISOString().split('T')[0]: null,
        count: dailyPurchased[1] ? dailyPurchased[1]: 0
      };
      userData.stocks[stockName].dailyPurchased = dailyPurchased;
    } else if (dailyPurchased === null || dailyPurchased === undefined) {
      // Initialize if undefined or invalid
      dailyPurchased = {
        date: todayDateString,
        count: 0
      };
      userData.stocks[stockName].dailyPurchased = dailyPurchased;
    }

    // Reset dailyPurchased if it's a new day
    if (userData.stocks[stockName].dailyPurchased.date !== todayDateString) {
      userData.stocks[stockName].dailyPurchased = {
        date: todayDateString,
        count: 0
      };
    }

    // Calculate total shares owned by the user across all stocks
    const totalSharesOwned = Object.values(userData.stocks).reduce((sum, stock) => sum + (stock.shares || 0), 0);

    // Check purchase limits
    const dailyPurchasedCount = userData.stocks[stockName].dailyPurchased.count;
    if (dailyPurchasedCount + numShares > 100) {
      return await handleMessage(context, {
        content: `⚠️ **${username}**, you can't buy more than 100 shares of **${stockName}** today.`
      });
    }

    if (totalSharesOwned + numShares > 200) {
      return await handleMessage(context, {
        content: `⚠️ **${username}**, you can't own more than 200 shares in total.`
      });
    }

    if ((userData.cash || 0) < totalCost) {
      return await handleMessage(context, {
        content: `⚠️ **${username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉.`
      });
    }

    // Process the purchase
    userData.cash = Number(((userData.cash || 0) - totalCost).toFixed(1));

    userData.stocks[stockName].shares += numShares;
    userData.stocks[stockName].cost += totalCost;
    userData.stocks[stockName].dailyPurchased.count += numShares;

    // Update user data
    await updateUser(userId, userData);

    return await handleMessage(context, {
      content: `
      📊 𝐒𝐭𝐨𝐜𝐤(𝐬) 𝐏𝐮𝐫𝐜𝐡𝐚𝐬𝐞𝐝\n\n**${username}** bought **${numShares}** shares of **${stockName}** for <:kasiko_coin:1300141236841086977>**${totalCost.toLocaleString()}** 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏
      `
    });
  } catch (e) {
    console.error(e);
    return await handleMessage(context, {
      content: "⚠️ Something went wrong while buying stock(s)."
    });
  }
}