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

export async function sellStock(userId, username, stockName, amount, context) {
  try {
    const stockData = readStockData();

    let userData = await getUserData(userId);
    const numShares = parseInt(amount, 10);
    stockName = stockName.toUpperCase().trim();

    if (!stockData[stockName] || !userData.stocks || !userData.stocks[stockName] || userData.stocks[stockName].shares < numShares) {
      return await handleMessage(context, {
        content: `⚠️ **${username}**, you don’t own enough shares or stock not found.`
      });
    }

    const stockPrice = stockData[stockName].currentPrice;
    const earnings = stockPrice * numShares;

    userData.cash = Number(((userData.cash || 0) + earnings).toFixed(1));

    // Average weighted cost
    if (
      typeof userData.stocks[stockName].cost === 'number' &&
      typeof userData.stocks[stockName].shares === 'number' &&
      userData.stocks[stockName].shares !== 0 &&
      typeof numShares === 'number'
    ) {
      const averageCostPerShare = userData.stocks[stockName].cost / userData.stocks[stockName].shares;
      userData.stocks[stockName].cost -= Number((averageCostPerShare * numShares).toFixed(1));
    } else {
      console.error("Invalid data for cost calculation:", userData.stocks[stockName]);
    }

    userData.stocks[stockName].shares -= numShares;

    if (userData.stocks[stockName].shares === 0) {
      // Preserve dailyPurchased data
      const dailyPurchased = userData.stocks[stockName].dailyPurchased;
      delete userData.stocks[stockName];
      userData.stocks[stockName] = {
        dailyPurchased: dailyPurchased,
        shares: 0,
        cost: 0,
        dailySold: []
      };
    }

    // Update user data
    await updateUser(userId, userData);

    return await handleMessage(context, {
      content: `📊 𝐒𝐭𝐨𝐜𝐤(𝐬) 𝐒𝐨𝐥𝐝\n\n**${username}** sold **${numShares}** shares of **${stockName}** for <:kasiko_coin:1300141236841086977>**${earnings.toFixed(1).toLocaleString()}** 𝑪𝒂𝒔𝒉.`
    });
  } catch (e) {
    console.error(e);
    return await handleMessage(context, {
      content: "⚠️ Something went wrong while selling stock(s)."
    });
  }
}