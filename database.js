import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from "./models/User.js";
import UserGuild from "./models/UserGuild.js";

import redisClient from "./redis.js";

import {
  updateNetWorth
} from './utils/updateNetworth.js';

dotenv.config();

// Configure Mongoose connection with pooling and optimized settings
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50, // Increased pool size for higher concurrency
      serverSelectionTimeoutMS: 5000, // Shorter timeout for faster failover
      socketTimeoutMS: 45000, // Socket timeout
      // Consider enabling other optimizations based on your use case
    });
    console.log('MongoDB connected successfully to Atlas!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit process if DB connection fails
  }
};

connectDB();

// Cache static JSON data in memory to reduce file I/O operations
const shopDatabasePath = path.join(process.cwd(), 'database', 'shop.json');
const stockDatabasePath = path.join(process.cwd(), 'database', 'stocks.json');
const aquaticDatabasePath = path.join(process.cwd(), 'database', 'aquatic.json');

let shopData = {};
let stockData = {};
let aquaticData = {};

// Function to load JSON data into memory
const loadStaticData = () => {
  try {
    shopData = JSON.parse(fs.readFileSync(shopDatabasePath, 'utf-8'));
    stockData = JSON.parse(fs.readFileSync(stockDatabasePath, 'utf-8'));
    aquaticData = JSON.parse(fs.readFileSync(aquaticDatabasePath, 'utf-8'));
    if (Math.random() > 0.8) {
      console.log('Static data loaded into memory.');
    }
  } catch (error) {
    console.error('Error loading static data:', error);
  }
};

// Initial load
loadStaticData();

// Watch for changes in JSON files and reload
fs.watchFile(shopDatabasePath, (curr, prev) => {
  loadStaticData();
});
fs.watchFile(stockDatabasePath, (curr, prev) => {
  loadStaticData();
});
fs.watchFile(aquaticDatabasePath, (curr, prev) => {
  loadStaticData();
});

// Function to create a new user in the database using upsert to prevent duplicates
export const createUser = async (userId) => {
  try {
    const newUser = new User( {
      id: userId,
      cash: 10000,
      networth: 10000,
      maintenance: 0,
      roses: 0,
      bondXP: 0,
      charity: 0,
      trust: 100,
      exp: 120,
      level: 1,
      verified: false,
      acceptedTerms: true,
      lastBattle: null,
      lastRobbery: null,
      joined: Date.now(),
      dailyReward: null,
      rewardStreak: 1,
      stocks: {},
      cars: [],
      structures: [],
      shipBattle: {
        battleLog: []
      }
    });

    const savedUser = await newUser.save();

    // Cache the new user in Redis
    await redisClient.set(`user:${userId}`, JSON.stringify(savedUser.toObject()), {
      EX: 60, // Cache for 1 minute
    });

    return {
      success: true,
      message: 'User created successfully.',
      user: savedUser,
    };
  } catch (error) {
    // Handle duplicate key error (E11000) gracefully
    if (error.code === 11000) {
      const existingUser = await User.findOne({
        id: userId
      });
      return {
        success: true,
        message: 'User already exists.',
        user: existingUser,
      };
    }
    console.error('Error creating user:', error);
    return {
      success: false,
      message: 'Failed to create user.',
    };
  }
};

// Function to retrieve user data with improved caching and maintain Mongoose documents
export const getUserData = async (userId) => {
  try {
    // Attempt to retrieve from Redis cache
    const cachedUser = await redisClient.get(`user:${userId}`);

    if (cachedUser) {
      // Return a Mongoose document from the cached data
      const userObject = JSON.parse(cachedUser);
      const user = new User(userObject);
      return user;
    }

    // Fetch from MongoDB
    const user = await User.findOne({
      id: userId
    });

    if (user) {
      // Cache the user data in Redis
      await redisClient.set(`user:${userId}`, JSON.stringify(user.toObject()), {
        EX: 60, // Cache for 1 minute
      });
      return user;
    }

    // If user doesn't exist, create a new one
    const createdUserData = await createUser(userId);
    if (createdUserData.success) {
      return createdUserData.user;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Function to check if a user exists using Redis cache and lean query
export const userExists = async (userId) => {
  try {
    // Check Redis exists cache
    const cachedExists = await redisClient.get(`user:${userId}:exists`);
    if (cachedExists) {
      return JSON.parse(cachedExists);
    }

    // Fetch from MongoDB
    const exists = await User.exists({
      id: userId
    });

    if (exists) {
      // Cache the existence in Redis
      await redisClient.set(`user:${userId}:exists`, JSON.stringify(true), {
        EX: 3600, // Cache for 1 hour
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

// Function to update user data using Mongoose documents and modifiedPaths
export const updateUser = async (userId, userData, guildId = null) => {
  try {
    if (!userData || !userData.isModified) {
      console.error('Invalid user data provided for update.');
      return null;
    }

    // Calculate new net worth
    const newNetWorth = await updateNetWorth(userId);

    if (newNetWorth && newNetWorth > 0) {
      userData.networth = newNetWorth;
    }

    // Ensure cash and networth don't drop below zero
    userData.cash = Math.max(Number(userData.cash.toFixed(1)), 0);
    userData.networth = Math.max(Number(userData.networth.toFixed(1)), 0);

    // Collect modified fields
    const updates = {};
    userData.modifiedPaths().forEach((path) => {
      updates[path] = userData[path];
    });

    if (Object.keys(updates).length === 0) {
      // No changes to update
      return userData;
    }

    if (guildId) {
      await UserGuild.findOneAndUpdate(
        {
          userId,
          guildId
        },
        {
          $set: {
            level: userData.level,
            networth: userData.networth,
            cash: userData.cash
          }
        },
        {
          upsert: true
        }
      );
    }

    // Perform atomic update using $set
    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      {
        $set: updates
      },
      {
        new: true
      }
    );

    if (updatedUser) {
      // Update Redis cache
      await redisClient.set(`user:${userId}`, JSON.stringify(updatedUser.toObject()), {
        EX: 60, // Cache for 1 minute
      });
    }

    return updatedUser; // Return the updated user
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

// Function to delete a user from the database
export const deleteUser = async (userId) => {
  try {
    const result = await User.deleteOne({
      id: userId
    });

    if (result.deletedCount === 1) {
      // Remove user from Redis cache
      await redisClient.del(`user:${userId}`);
      await redisClient.del(`user:${userId}:exists`);
      return {
        success: true,
        message: 'User deleted successfully.',
      };
    }

    return {
      success: false,
      message: 'User not found.',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      message: 'Failed to delete user.',
    };
  }
};

// Static data handling with in-memory cache
export const itemExists = (itemId) => {
  return shopData.hasOwnProperty(itemId);
};

export const updateShop = (itemId, newData) => {
  if (!shopData[itemId]) {
    return {};
  }

  shopData[itemId] = {
    ...shopData[itemId],
    ...newData
  };
  fs.writeFile(shopDatabasePath, JSON.stringify(shopData, null, 2), (err) => {
    if (err) console.error('Error writing shop data:', err);
  });
  return shopData[itemId];
};

export const getShopData = (itemId) => {
  return shopData[itemId] || {};
};

export const writeShopData = (data) => {
  shopData = data;
  fs.writeFile(shopDatabasePath,
    JSON.stringify(shopData, null, 2),
    (err) => {
      if (err) console.error('Error writing shop data:', err);
    });
};

export const writeStockData = (data) => {
  stockData = data;
  fs.writeFile(stockDatabasePath,
    JSON.stringify(stockData, null, 2),
    (err) => {
      if (err) console.error('Error writing stock data:', err);
    });
};

export const readShopData = () => {
  return shopData;
};

export const readStockData = () => {
  return stockData;
};

export const readAquaticData = () => {
  return aquaticData;
};