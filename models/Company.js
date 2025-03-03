import mongoose from 'mongoose';

// Helper setter function for prices.
const roundPrice = (val) => {
  if (val < 0) return 0;
  return Math.round(val * 10) / 10;
};

// Schema for each shareholder record
const shareholderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  shares: {
    type: Number,
    required: true,
    min: 0
  },
  role: {
    type: String,
    enum: ['founder', 'funder', 'investor'],
    required: true
  },
  lastInvestedAt: {
    type: Date
  }
}, {
  _id: false
});

// Schema for recording a funding round (primary market funding)
const fundingRoundSchema = new mongoose.Schema({
  round: {
    type: String,
    enum: ['seed', 'seriesA', 'seriesB', 'IPO', 'directFunding', 'other', 'buy', 'sell'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  sharesIssued: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
    },
    cost: {
      type: Number,
    default: 0,
      min: 0
    }
  }, {
    _id: false
  });

  // Schema for recording individual price points
  const pricePointSchema = new mongoose.Schema({
    price: {
      type: Number,
      required: true,
      min: 0,
      set: roundPrice
    },
    date: {
      type: Date,
    default: Date.now
    }
  }, {
    _id: false
  });

  const companySchema = new mongoose.Schema({
    owner: {
      type: String, // Discord user ID
      required: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    sector: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
    default: 'A budding new company ready to take on the world.'
    },
    ceo: {
      type: String,
      required: true,
      trim: true
    },
    marketCap: {
      type: Number,
    default: 0,
      min: 0,
      set: roundPrice
    },
    currentPrice: {
      type: Number,
    default: 100,
      min: 0,
      set: roundPrice
    },
    last10Prices: {
      type: [Number],
    default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: 'last10Prices cannot have more than 10 entries.'
      }
    },
    maxPrice: {
      type: Number,
    default: 100,
      min: 0,
      set: roundPrice
    },
    minPrice: {
      type: Number,
    default: 100,
      min: 0,
      set: roundPrice
    },
    trend: {
      type: String,
      enum: ['up', 'down', 'stable'],
    default: 'stable'
    },
    volatility: {
      type: Number,
    default: 1,
      min: 0
    },
    peRatio: {
      type: Number,
    default: 0,
      min: 0
    },
    dividendYield: {
      type: Number,
    default: 0,
      min: 0
    },
    protection: {
      type: Number,
    default: 100,
      set: roundPrice
    },
    workCount: {
      type: Number,
    default: 0,
      min: 0
    },
    lastWorkAt: {
      type: Date,
    default: null
    },
    lastSalaryWithdrawal: {
      type: Date,
    default: null
    },
    // New properties for equity and funding
    totalSharesOutstanding: {
      type: Number,
    default: 1000, // For example, the founder starts with 1,000 shares.
      min: 0
    },
    authorizedShares: {
      type: Number,
    default: 10000, // Maximum number of shares the company can issue.
      min: 0
    },
    shareholders: {
      type: [shareholderSchema],
    default: [] // Founder’s record can be added here at creation.
    },
    fundingRounds: {
      type: [fundingRoundSchema],
    default: []
    },
    priceHistory: {
      type: [pricePointSchema],
    default: []
    },
    isPublic: {
      type: Boolean,
    default: false
    },
    ipoDate: {
      type: Date,
    default: null
    }
  }, {
    timestamps: true // Adds createdAt and updatedAt automatically.
  });

  export default mongoose.model('Company', companySchema);