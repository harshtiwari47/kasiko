import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from "./models/User.js";

import redisClient from "./redis.js";

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
      trust: 200,
      exp: 120,
      level: 1, // Starting level
      verified: false,
      acceptedTerms: true,
      lastBattle: null,
      lastRobbery: null,
      aquariumCollectionTime: null,
      marriedOn: null,
      joined: Date.now(), // Timestamp of joining
      dailyReward: null,
      rewardStreak: 1,
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
    // Check external Redis cache
    const cachedUser = await redisClient.get(`user:${userId}`);

    if (cachedUser) {
      const user = User.hydrate(JSON.parse(cachedUser));
      return user;
    }

    // Fetch from the database
    const user = await User.findOne({
      id: userId
    });
    let createdUserData = {
      success: true
    };

    if (!user) {
      createdUserData = await createUser(userId);
    }

    if (!createdUserData.success) {
      console.error('Failed creating new user');
      return null;
    }

    // Cache user data in external Redis
    if (user) {
      await redisClient.set(`user:${userId}`, JSON.stringify(user.toObject()), {
        EX: 60
      }); // Cache for 3 min
    }

    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Function to check if a user exists in the database
export const userExists = async (userId) => {
  try {
    // Check Redis exists cache
    const cachedUser = await redisClient.get(`user:${userId}:exists`);
    if (cachedUser) {
      return true;
    }

    // Fetch from database
    const user = await User.findOne({
      id: userId
    });
    if (user) {
      // Cache the user data
      await redisClient.set(`user:${userId}:exists`, JSON.stringify(true), {
        EX: 3600
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

// Function to update user data
export const updateUser = async (userId, user) => {
  try {
    // Update net worth
    let newNetWorth = await updateNetWorth(userId);

    user.networth = newNetWorth && (newNetWorth > 0) ? newNetWorth: user.networth;

    user.cash = Number(user.cash.toFixed(1));
    user.networth = Number(user.networth.toFixed(1));

    const updates = {};
    user.modifiedPaths().forEach((path) => {
      updates[path] = user[path];
    });

    // Save updated user to database
    const updatedUser = await User.findByIdAndUpdate(
      user["_id"],
      {
        $set: updates
      },
      {
        new: true
      }
    );

    // Update Redis cache
    await redisClient.set(`user:${userId}`, JSON.stringify(updatedUser.toObject()), {
      EX: 60
    });

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