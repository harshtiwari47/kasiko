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
    min: 0,
    set: (value) => (value < 0 ? 0: value)
  },
  networth: {
    type: Number,
    required: true,
    min: 0,
    set: (value) => (value < 0 ? 0: value)
  },
  maintenance: {
    type: Number,
    required: true,
    min: 0,
    set: (value) => (value < 0 ? 0: value)
  },
  spouse: {
    type: String,
    default: null
    },
    roses: {
      type: Number,
    default: 0,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    bondXP: {
      type: Number,
    default: 0,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    charity: {
      type: Number,
      required: true,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    trust: {
      type: Number,
      required: true,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    exp: {
      type: Number,
      required: true,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      set: (value) => (value < 1 ? 1: value)
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
      min: 1,
      set: (value) => (value < 1 ? 1: value)
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
    },
    heaven: {
      type: [String, Number, Number], // heaven id, attempts, success (0/1)
    default: [null, null, 0]
    }
  }, {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  });

  // Create the User model based on the schema
  const User = mongoose.model('User', userSchema);

  export default User;