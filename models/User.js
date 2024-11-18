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
    required: true
  },
  networth: {
    type: Number,
    required: true
  },
  maintenance: {
    type: Number,
    required: true
  },
  spouse: {
    type: String,
    default: null
    },
    roses: {
      type: Number,
    default: 0
    },
    bondXP: {
      type: Number,
    default: 0
    },
    charity: {
      type: Number,
      required: true
    },
    trust: {
      type: Number,
      required: true
    },
    exp: {
      type: Number,
      required: true
    },
    level: {
      type: Number,
      required: true
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
      type: Number
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