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
    popularity: {
      type: Number,
    default: 0,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    friendly: {
      type: Number,
    default: 0
    },
    profileBio: {
      type: String,
    default: null
    },
    amountReceivedDaily: {
      date: {
        type: String,
      default: null
      },
      amount: {
        type: Number,
      default: 0
      }
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
    lastVoteTime: {
      type: Date,
    default: null
    },
    family: {
      children: {
        type: [Object],
      default: []
      },
      marriedOn: {
        type: Number
      },
      adopted: {
        type: [Object],
      default: []
      },
      dailyReward: {
        type: Number
      },
      bondXP: {
        type: Number,
      default: 0,
        min: 0,
        set: (value) => (value < 0 ? 0: value)
      },
      spouse: {
        type: String,
      default: null
      },
      customChildEmojis: {
        B: {
          type: String,
        default: null
        },
        G: {
          type: String,
        default: null
        }
      },
      ring: {
        type: String,
      default: null
      }
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
    cars: {
      type: [Object],
    default: []
    },
    structures: {
      type: [Object],
    default: []
    },
    dailyWork: {
      type: Array,
    default: [null, 0]
    },
    cookie: {
      type: Object
    },
    bankAccount: {
      type: bankAccountSchema,
    default: () => ({}), // Ensure default sub-document creation
    },
    heaven: {
      type: [{
        type: String
      }, {
        type: Number
      }, {
        type: Number
      }], // heaven id, attempts, success (0/1)
    default: [null, null, 0]
    },
    orca: {
      type: Object,
    default: {
        id: null,
        prayed: false,
        count: 0,
        dailyPrayed: {
          type: [Date, Number],
        default: [null, 0]
        },
        lastInteractDate: {
          type: Date
        },
        dailyInteractions: {
          type: Number,
        default: 0
        }
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
        type: null // basic/premium/ultra
      }
    },
    color: {
      type: String,
    default: "#f6e59a"
    },
    banner: {
      type: String,
    default: "https://harshtiwari47.github.io/kasiko-public/images/banner/kasiko-default-banner.png"
    },
    settings: {
      dm: {
        type: Boolean,
      default: true
      }
    },
    seasonalPasses: {
      type: Array,
    default: []
    },
    inventory: {
      type: Object,
    default: {}
    },
    activeBoosts: {
      type: Object,
    default: {}
    },
    tasks: {
      type: Object,
    default: {}
    }
  }, {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  });

  // Create the User model based on the schema
  const User = mongoose.model('User', userSchema);

  export default User;