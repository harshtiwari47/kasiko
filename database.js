import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from "./models/User.js";

import {
  updateNetWorth
} from './utils/updateNetworth.js';

dotenv.config();

export const connectDB = async () => {
  mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully to Atlas!');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
};

connectDB();

const shopDatabasePath = path.join(process.cwd(), 'database', 'shop.json');
const stockDatabasePath = path.join(process.cwd(), 'database', 'stocks.json');
const aquaticDatabasePath = path.join(process.cwd(), 'database', 'aquatic.json');

// Function to create a new user in the database
export const createUser = async (userId) => {
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({
      id: userId
    });
    if (existingUser) {
      return {
        success: false,
        message: 'User already exists.'
      };
    }

    // Create a new user if not found
    const newUser = new User( {
      id: userId,
      cash: 0, // Default values
      networth: 0,
      maintenance: 0,
      spouse: null,
      roses: 0,
      bondXP: 0,
      charity: 0,
      trust: 100,
      exp: 0,
      level: 1, // Starting level
      verified: false,
      acceptedTerms: true,
      lastBattle: null,
      lastRobbery: null,
      aquariumCollectionTime: null,
      marriedOn: null,
      joined: Date.now(), // Timestamp of joining
      dailyReward: null,
      rewardStreak: 0,
      stocks: {},
      cars: [],
      structures: [],
      aquaCollection: {},
      aquarium: [],
      children: [],
      battleLog: [],
    });

    await newUser.save(); // Save to the database
    return {
      success: true,
      message: 'User created successfully.'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      message: 'Failed to create user.'
    };
  }
};

// Function to retrieve user data from the database
export const getUserData = async (userId) => {
  try {
    const user = await User.findOne({
      id: userId
    });
    let createdUserData = {
      success: true
    };
    if (!user) {
      createdUserData = await createUser(userId);
    }
    if (!createdUserData.success) return console.error('Failed creating new user');
    return user
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null
  }
};

// Function to check if a user exists in the database
export const userExists = async (userId) => {
  try {
    const user = await User.findOne({
      id: userId
    });
    return user ? true: false;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

// Function to update user data
export const updateUser = async (userId, user) => {
  try {
    // update net worth
    await updateNetWorth(userId);

    user.cash = Number(user.cash.toFixed(1));
    user.networth = Number(user.networth.toFixed(1));

    if (user.cash < 0) user.cash = 0;
    if (user.networth < 0) user.networth = 0;
    // Save the updated user document
    const updatedUser = await user.save();

    return updatedUser; // Return the updated user

  } catch (error) {
    console.error('Error in transaction:', error);
    return 'Error in transaction';
  }
};

// Function to delete a user from the database
export const deleteUser = async (userId) => {
  try {
    const user = await User.findOne({
      id: userId
    });
    if (!user) {
      return null
    }

    await user.remove(); // Delete the user from the database
    return {
      success: true,
      message: 'User deleted successfully.'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return null
  }
};

export const userAcceptedTerms = async (userId) => {
  try {
    const user = await User.findOne({
      id: userId
    });
    if (!user) return false;
    if (user) return user.acceptedTerms;
  } catch (e) {
    console.error(e);
  }
}

// other
export const itemExists = (itemId) => {
  const data = readShopData();
  return data.hasOwnProperty(itemId);
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

export const getShopData = (itemId) => {
  const data = readShopData();

  if (!data[itemId]) {
    return {}
  }

  return data[itemId];
};


export const writeShopData = (data) => {
  fs.writeFileSync(shopDatabasePath, JSON.stringify(data, null, 2));
};

export const writeStockData = (data) => {
  fs.writeFileSync(stockDatabasePath, JSON.stringify(data, null, 2));
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