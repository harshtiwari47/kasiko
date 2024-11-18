import {
  getUserData,
  updateUser,
  readStockData,
  readShopData
} from '../database.js';

export async function updateNetWorth(userId) {
  new Promise(async (resolve, reject) => {
    const stockData = readStockData();
    const items = readShopData();
    const carItems = Object.values(items).filter(item => item.type === "car");
    const strItems = Object.values(items).filter(item => item.type === "structures");


    try {
      const userData = await getUserData(userId);
      if (!userData) return;
      let totalNetWorth = userData.cash || 0;

      // bank
      if (userData.bankAccount) {
        totalNetWorth += userData.bankAccount.deposit || 0;
      }

      // Calculate stock values
      if (userData.stocks && typeof userData.stocks === "object") {
        for (const stockName in userData.stocks.toJSON()) {
          if (stockName === "_id") continue;
          if (userData.stocks[stockName] && stockData[stockName].currentPrice) {
            const numShares = userData.stocks[stockName].shares;
            const stockPrice = stockData[stockName].currentPrice;
            totalNetWorth += numShares * stockPrice;
          }
        }
      }

      // Calculate car values
      if (userData.cars && typeof userData.cars === "object") {
        for (const usercar of userData.cars) {
          const carItem = carItems.find(car => car.id === usercar.id);
          if (carItem) {
            totalNetWorth += carItem.price * usercar.items;
          }
        }
      }

      // Calculate house values
      if (userData.structures && typeof userData.structures === "object") {
        for (const userstr of userData.structures) {
          const strItem = strItems.find(structure => structure.id === userstr.id);
          if (strItem) {
            totalNetWorth += strItem.price * userstr.items;
          }
        }
      }

      // Update net worth in user data
      userData.networth = Number(totalNetWorth.toFixed(2));
      await updateUser(userId, userData);
      resolve(userData.networth);
    } catch (e) {
      console.error(e)
      reject(0);
    }
  });
}