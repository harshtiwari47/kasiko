import {
  getUserData,
  updateUser,
  readStockData,
  readShopData
} from '../database.js';

import Company from "../models/Company.js";
  
import {
  getOrCreateShopDoc
} from "../src/txtcommands/shop/shopDocHelper.js"

import redisClient from '../redis.js';

async function getTotalCurrentStockPrice(userId) {
  const cacheKey = `totalStockPrice:${userId}`;

  try {
    const cachedValue = await redisClient.get(cacheKey);
    if (cachedValue) {
      return parseFloat(cachedValue); // Return cached value if it exists
    }

    const companies = await Company.find({
      "shareholders.userId": userId
    });

    let totalStockPrice = 0;

    companies.forEach(company => {
      const shareholder = company.shareholders.find(s => s.userId === userId);
      if (!shareholder) return;

      const sharesOwned = shareholder.shares;
      const currentValue = sharesOwned * company.currentPrice; // Calculate value

      totalStockPrice += currentValue;
    });

    // Store the result in Redis for 5 minutes (300 seconds)
    await redisClient.set(cacheKey,
      totalStockPrice.toString(),
      {
        EX: 300
      });

    return totalStockPrice;
  } catch (error) {
    console.error("Error fetching total stock price:",
      error);
    throw new Error("Failed to fetch stock price");
  }
}

export async function calculateNetWorth(userData) {

  if (!userData) return 0;
  if (!userData?.id) return 0;

  const stockData = readStockData();
  const items = readShopData();
  const carItems = Object.values(items).filter(item => item.type === "car");
  const strItems = Object.values(items).filter(item => item.type === "structures");

  // Get additional shop data.
  const userShopData = await getOrCreateShopDoc(userData.id);
  if (!userShopData) return 0;

  let totalNetWorth = userData.cash + (userShopData.networth || 0);

  // Include bank account deposit.
  if (userData.bankAccount) {
    totalNetWorth += userData.bankAccount.deposit || 0;
  }

  try {
    totalNetWorth += await getTotalCurrentStockPrice(userData.id) || 0;
  } catch (eRROR) {
    console.error(eRROR.message, "userId ", userData.id);
  }

  // Calculate car values.
  if (userData.cars && typeof userData.cars === "object") {
    for (const usercar of userData.cars) {
      const carItem = carItems.find(car => car.id === usercar.id);
      if (carItem) {
        totalNetWorth += carItem.price * usercar.items;
      }
    }
  }

  // Calculate house/structure values.
  if (userData.structures && typeof userData.structures === "object") {
    for (const userstr of userData.structures) {
      const strItem = strItems.find(structure => structure.id === userstr.id);
      if (strItem) {
        totalNetWorth += strItem.price * userstr.items;
      }
    }
  }

  return Number(totalNetWorth.toFixed(2));
}