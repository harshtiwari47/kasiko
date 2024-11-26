import mongoose from 'mongoose';
import bankAccountSchema from './Bank.js';
import Stock from './Stocks.js';
import fishSchema from './Fish.js';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  cash: {
    type: Number,
    required: true,
    min: 0
  },
  networth: {
    type: Number,
    required: true,
    min: 0
  },
  maintenance: {
    type: Number,
    required: true,
    min: 0
  },
  spouse: {
    type: String,
    default: null
    },
    roses: {
      type: Number,
    default: 0,
      min: 0
    },
    bondXP: {
      type: Number,
    default: 0,
      min: 0
    },
    charity: {
      type: Number,
      required: true,
      min: 0
    },
    trust: {
      type: Number,
      required: true,
      min: 0
    },
    exp: {
      type: Number,
      required: true,
      min: 0
    },
    level: {
      type: Number,
      required: true,
      min: 1
    },
    verified: {
      type: Boolean,
    default: false
    },
    acceptedTerms: {
      type: Boolean,
    default: false
    },
    lastBattle: {
      type: Number
    },
    lastRobbery: {
      type: Number
    },
    aquariumCollectionTime: {
      type: Number
    },
    marriedOn: {
      type: Number
    },
    joined: {
      type: Number,
      required: true
    },
    dailyReward: {
      type: Number
    },
    rewardStreak: {
      type: Number,
      min: 1
    },
    stocks: {
      type: Stock
    },
    cars: {
      type: [Object],
    default: []
    },
    structures: {
      type: [Object],
    default: []
    },
    aquaCollection: {
      type: fishSchema
    },
    aquarium: {
      type: [String],
    default: []
    },
    children: {
      type: [String],
    default: []
    },
    battleLog: {
      type: [String],
    default: []
    },
    bankAccount: {
      type: bankAccountSchema,
    default: () => ({}), // Ensure default sub-document creation
    }
  }, {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  });

  // Create the User model based on the schema
  const User = mongoose.model('User', userSchema);

  export default User;