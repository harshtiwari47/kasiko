import {
  getUserData,
  updateUser,
  readStockData,
  readShopData
} from '../database.js';

import {
  getOrCreateShopDoc
} from "../src/txtcommands/shop/shopDocHelper.js"

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

  // Calculate stock values.
  if (userData.stocks && typeof userData.stocks === "object") {
    for (const stockName in userData.stocks.toJSON()) {
      if (stockName === "_id") continue;
      if (userData.stocks[stockName] && stockData[stockName] && stockData[stockName].currentPrice) {
        const numShares = userData.stocks[stockName].shares;
        const stockPrice = stockData[stockName].currentPrice;
        totalNetWorth += numShares * stockPrice;
      }
    }
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