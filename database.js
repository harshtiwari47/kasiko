import fs from 'fs';
import path from 'path';

const userDatabasePath = path.join(process.cwd(), 'database', 'user.json');
const shopDatabasePath = path.join(process.cwd(), 'database', 'shop.json');
const stockDatabasePath = path.join(process.cwd(), 'database', 'stocks.json');
const aquaticDatabasePath = path.join(process.cwd(), 'database', 'aquatic.json');

// Ensure the data file exists and is initialized
if (!fs.existsSync(userDatabasePath)) {
  fs.writeFileSync(userDatabasePath, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(shopDatabasePath)) {
  fs.writeFileSync(shopDatabasePath, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(stockDatabasePath)) {
  fs.writeFileSync(stockDatabasePath, JSON.stringify({}, null, 2));
}

// Helper function to read data from the JSON file
export const readUserData = () => {
  const data = fs.readFileSync(userDatabasePath, 'utf-8');
  return JSON.parse(data);
};

export const readShopData = () => {
  const data = fs.readFileSync(shopDatabasePath, 'utf-8');
  return JSON.parse(data);
};

export const readStockData = () => {
  const data = fs.readFileSync(stockDatabasePath, 'utf-8');
  return JSON.parse(data);
};

export const readAquaticData = () => {
  const data = fs.readFileSync(aquaticDatabasePath, 'utf-8');
  return JSON.parse(data);
};

// Helper function to write data to the JSON file
export const writeUserData = (data) => {
  fs.writeFileSync(userDatabasePath, JSON.stringify(data, null, 2));
};

export const writeShopData = (data) => {
  fs.writeFileSync(shopDatabasePath, JSON.stringify(data, null, 2));
};

export const writeStockData = (data) => {
  fs.writeFileSync(stockDatabasePath, JSON.stringify(data, null, 2));
};

// Create a new user profile
export const createUser = (userId) => {
  const data = readUserData();

  if (data[userId]) {
    return "User already exist!"
  }

  const userData = {
    cash: 2000,
    networth: 0,
    maintanence: 0,
    cars: [],
    houses: [],
    aquaCollection: {},
    aquarium: [],
    aquariumCollectionTime: null,
    stocks: {},
    joined: new Date().toISOString(),
    dailyReward: null,
    rewardStreak: 0,
    charity: 0,
    trust: 0,
    verified: false
  };

  data[userId] = userData;
  writeUserData(data);
  return userData;
};

// Get user data
export const getUserData = (userId) => {
  const data = readUserData();

  if (!data[userId]) {
    createUser(userId);
  }

  return data[userId];
};

export const getShopData = (itemId) => {
  const data = readShopData();

  if (!data[itemId]) {
    return {}
  }

  return data[itemId];
};

// Update user data (partial update)
export const updateUser = (userId, newData) => {
  const data = readUserData();

  if (!data[userId]) {
    createUser(userId);
  }

  if (newData.cash < 0) {
    newData.cash = 0;
  } else if (newData.networth < 0) {
    newData.networth = 0;
  }

  const updatedData = {
    ...data[userId],
    ...newData
  };
  data[userId] = updatedData;
  writeUserData(data);
  return updatedData;
};

export const updateShop = (itemId, newData) => {
  const data = readShopData();

  if (!data[itemId]) {
    return {}
  }

  const updatedData = {
    ...data[itemId],
    ...newData
  };
  data[itemId] = updatedData;
  writeShopData(data);
  return updatedData;
};

// Delete user data
export const deleteUser = (userId) => {
  const data = readShopData();

  if (data[userId]) {
    delete data[userId];
    writeShopData(data);
    return true;
  }
  return false;
};

// Check if user exists
export const userExists = (userId) => {
  const data = readUserData();
  return data.hasOwnProperty(userId);
};

export const itemExists = (itemId) => {
  const data = readShopData();
  return data.hasOwnProperty(itemId);
};