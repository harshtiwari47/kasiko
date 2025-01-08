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
  isBan: {
    type: Boolean,
    default: false
    },
    cash: {
      type: Number,
      required: true,
      min: 0,
    default: 1000,
      set: (value) => (value < 0 ? 0: value)
    },
    networth: {
      type: Number,
      required: true,
    default: 1000,
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
    friendly: {
      type: Number,
    default: 0
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
    shipBattle: {
      lastBattle: {
        type: Number,
      default: null
      },
      win: {
        type: Number,
      default: 0
      },
      lost: {
        type: Number,
      default: 0
      },
      battleLog: {
        type: [String],
      default: []
      }
    },
    lastRobbery: {
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
      type: Object
    },
    cookie: {
      type: Object
    },
    aquarium: {
      type: [String],
    default: []
    },
    children: {
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
    },
    orca: {
      type: Object,
    default: {
        id: null,
        prayed: false,
        count: 0
      }
    },
    badges: {
      type: Array,
    default: []
    },
    pass: {
      type: Object,
    default: {
        month: -1, // number 0-11
        year: -1, // number
        type: null // premium/basic
      }
    },
    color: {
      type: String,
    default: "#f6e59a"
    },
    seasonalPasses: {
      type: Array,
    default: []
    }
  }, {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  });

  // Create the User model based on the schema
  const User = mongoose.model('User', userSchema);

  export default User;