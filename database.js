import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from "./models/User.js";
import UserGuild from "./models/UserGuild.js";

import redisClient from "./redis.js";

import {
  calculateNetWorth
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
      },
      inventory: {}
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

// ── L1 In-Memory Fast Cache (Ultra-low latency: ~0.001ms) ───────────────────
const L1_USER_CACHE = new Map();
const L1_USER_EXISTS_CACHE = new Map();
const L1_USER_TTL_MS = 15000; // 15 seconds L1 TTL for active user objects
const L1_EXISTS_TTL_MS = 300000; // 5 minutes L1 TTL for user existence

// Periodic cleanup of expired L1 entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of L1_USER_CACHE.entries()) {
    if (val.expiresAt <= now) L1_USER_CACHE.delete(key);
  }
  for (const [key, val] of L1_USER_EXISTS_CACHE.entries()) {
    if (val.expiresAt <= now) L1_USER_EXISTS_CACHE.delete(key);
  }
}, 120000).unref();

// Function to retrieve user data with multi-tiered L1 memory + L2 Redis caching
export const getUserData = async (userId) => {
  try {
    const now = Date.now();

    // 1. Check L1 In-Memory Cache (Instant ~0.001ms)
    const l1Cached = L1_USER_CACHE.get(userId);
    if (l1Cached && l1Cached.expiresAt > now) {
      return new User(l1Cached.userObject);
    }

    // 2. Check L2 Redis Cache
    const cachedUser = await redisClient.get(`user:${userId}`);

    if (cachedUser) {
      const userObject = JSON.parse(cachedUser);
      // Populate L1 cache
      L1_USER_CACHE.set(userId, { userObject, expiresAt: now + L1_USER_TTL_MS });
      L1_USER_EXISTS_CACHE.set(userId, { exists: true, expiresAt: now + L1_EXISTS_TTL_MS });
      return new User(userObject);
    }

    // 3. Fetch from MongoDB
    const user = await User.findOne({
      id: userId
    });

    if (user) {
      const userObject = user.toObject();
      // Populate L1 cache
      L1_USER_CACHE.set(userId, { userObject, expiresAt: now + L1_USER_TTL_MS });
      L1_USER_EXISTS_CACHE.set(userId, { exists: true, expiresAt: now + L1_EXISTS_TTL_MS });

      // Cache in Redis asynchronously
      redisClient.set(`user:${userId}`, JSON.stringify(userObject), {
        EX: 60, // Cache for 1 minute
      }).catch(() => {});

      return user;
    }

    // If user doesn't exist, create a new one
    const createdUserData = await createUser(userId);
    if (createdUserData.success) {
      const savedUserObj = createdUserData.user.toObject();
      L1_USER_CACHE.set(userId, { userObject: savedUserObj, expiresAt: now + L1_USER_TTL_MS });
      L1_USER_EXISTS_CACHE.set(userId, { exists: true, expiresAt: now + L1_EXISTS_TTL_MS });
      return createdUserData.user;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Function to check if a user exists using L1 in-memory + L2 Redis cache
export const userExists = async (userId) => {
  try {
    const now = Date.now();

    // 1. Check L1 In-Memory Cache (Instant ~0.0001ms)
    const l1Cached = L1_USER_EXISTS_CACHE.get(userId);
    if (l1Cached && l1Cached.expiresAt > now) {
      return l1Cached.exists;
    }

    // 2. Check L2 Redis exists cache
    const cachedExists = await redisClient.get(`user:${userId}:exists`);
    if (cachedExists) {
      const exists = JSON.parse(cachedExists);
      L1_USER_EXISTS_CACHE.set(userId, { exists, expiresAt: now + L1_EXISTS_TTL_MS });
      return exists;
    }

    // 3. Fetch from MongoDB
    const exists = await User.exists({
      id: userId
    });

    const hasUser = Boolean(exists);
    L1_USER_EXISTS_CACHE.set(userId, { exists: hasUser, expiresAt: now + L1_EXISTS_TTL_MS });

    if (hasUser) {
      // Cache the existence in Redis
      redisClient.set(`user:${userId}:exists`, JSON.stringify(true), {
        EX: 3600, // Cache for 1 hour
      }).catch(() => {});
    }

    return hasUser;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

/**
* Updates a user document.
* @param {String} userId - The user’s ID.
* @param {Object|Mongoose.Document} userData - Either a Mongoose document (with modifiedPaths and isModified) or a plain object containing the update.
* @param {String|null} guildId - Optional guild ID. If provided, ensures a UserGuild record exists.
* @returns {Promise<Mongoose.Document>} The updated user document.
*/
export const updateUser = async (userId, userData, guildId = null) => {
  const maxRetries = 3;
  let attempt = 0;
  const filter = {
    id: userId
  };

  while (attempt < maxRetries) {
    let session;
    try {
      attempt++;

      if (!userData || typeof userData !== 'object') {
        throw new Error('No valid user data provided for update.');
      }

      const isMongooseDoc = typeof userData.modifiedPaths === 'function';
      let updates = {};
      if (isMongooseDoc) {
        if (!userData.isModified()) {
          return userData;
        }
        userData.modifiedPaths().forEach((path) => {
          updates[path] = userData[path];
        });
      } else {
        // For a plain object, assume all fields are to be updated.
        updates = {
          ...userData
        };
      }

      // Ensure cash and networth are rounded and not negative.
      if (updates.hasOwnProperty('cash')) {
        updates.cash = Math.max(Number(parseFloat(updates.cash).toFixed(1)), 0);
      }
      if (updates.hasOwnProperty('networth')) {
        updates.networth = Math.max(Number(parseFloat(updates.networth).toFixed(1)), 0);
      }

      // Begin a session and start a transaction.
      session = await mongoose.startSession();
      session.startTransaction();

      // If a guildId is provided, upsert the UserGuild record using the same session.
      if (guildId) {
        await UserGuild.findOneAndUpdate(
          {
            userId, guildId
          },
          {},
          {
            upsert: true, setDefaultsOnInsert: true, new: true, session
          }
        );
      }

      // Get the current user data within the transaction.
      const currentUser = await User.findOne(filter).session(session);
      if (!currentUser) {
        throw new Error('User not found for update.');
      }

      // Merge the pending updates into the current data (simulate the final state).
      const finalUserData = {
        ...currentUser.toObject(),
        ...updates
      };

      // Recalculate net worth based on the simulated final state.
      let newNetWorth;

      if (updates.cash) {
        newNetWorth = await calculateNetWorth(finalUserData);
        updates.networth = newNetWorth;
      }

      const updatedUser = await User.findOneAndUpdate(
        filter,
        {
          $set: updates
        },
        {
          new: true, session
        }
      );
      if (!updatedUser) {
        throw new Error('User not found after update.');
      }

      // Commit the transaction.
      await session.commitTransaction();
      session.endSession();

      const updatedObj = updatedUser.toObject();
      const now = Date.now();

      // Synchronously update ultra-fast L1 cache
      L1_USER_CACHE.set(userId, { userObject: updatedObj, expiresAt: now + L1_USER_TTL_MS });
      L1_USER_EXISTS_CACHE.set(userId, { exists: true, expiresAt: now + L1_EXISTS_TTL_MS });

      // Update Redis cache asynchronously without blocking.
      redisClient
      .set(`user:${userId}`, JSON.stringify(updatedObj), {
        EX: 60
      })
      .catch((err) => console.error('Redis cache update error:', err));

      return updatedUser;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      if (attempt >= maxRetries) {
        console.error(`Error updating user after ${attempt} attempts:`, error);
        throw error;
      }
      // Optionally wait before retrying.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

// Function to delete a user from the database
export const deleteUser = async (userId) => {
  try {
    // Evict from L1 cache
    L1_USER_CACHE.delete(userId);
    L1_USER_EXISTS_CACHE.set(userId, { exists: false, expiresAt: Date.now() + L1_EXISTS_TTL_MS });

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