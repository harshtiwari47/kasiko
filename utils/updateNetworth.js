import {
  getUserData,
  updateUser,
  readStockData,
  readShopData
} from '../database.js';

export function updateNetWorth(userId) {

  const stockData = readStockData();
  const items = readShopData();
  const carItems = Object.values(items).filter(item => item.type === "car");


  try {
    const userData = getUserData(userId);
    if (!userData) return;
    let totalNetWorth = userData.cash || 0;
    // Calculate stock values
    if (userData.stocks) {
      for (const stockName in userData.stocks) {
        const numShares = userData.stocks[stockName].shares;
        const stockPrice = stockData[stockName].currentPrice;
        totalNetWorth += numShares * stockPrice;
      }
    }

    // Calculate car values
    if (userData.cars) {
      for (const usercar of userData.cars) {
        const carItem = carItems.find(car => car.id === usercar.id);
        if (carItem) {
          totalNetWorth += carItem.price * usercar.items;
        }
      }
    }

    // Update net worth in user data
    userData.networth = Number(totalNetWorth.toFixed(2));
    updateUser(userId, userData);
  } catch (e) {
    console.error(e)
  }
}