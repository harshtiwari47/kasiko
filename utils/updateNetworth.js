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
  const strItems = Object.values(items).filter(item => item.type === "structures");


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
    
     // Calculate house values
    if (userData.structures) {
      for (const userstr of userData.structures) {
        const strItem = strItems.find(structure => structure.id === userstr.id);
        if (strItem) {
          totalNetWorth += strItem.price * userstr.items;
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