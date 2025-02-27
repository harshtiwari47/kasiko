import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  owner: { 
    type: String, // Discord user id as string
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  sector: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: 'A budding new company ready to take on the world.' 
  },
  CEO: { 
    type: String, 
    required: true 
  },
  marketCap: { 
    type: Number, 
    default: 0 
  },
  currentPrice: { 
    type: Number, 
    default: 100 
  },
  last10Prices: { 
    type: [Number], 
    default: [] 
  },
  maxPrice: { 
    type: Number, 
    default: 0 
  },
  minPrice: { 
    type: Number, 
    default: 0 
  },
  trend: { 
    type: String, 
    enum: ['up', 'down', 'stable'], 
    default: 'stable' 
  },
  volatility: { 
    type: Number, 
    default: 1 
  },
  PEratio: { 
    type: Number, 
    default: 0 
  },
  dividendYield: { 
    type: String, 
    default: '0%' 
  },
  protection: { 
    type: Number, 
    default: 100 
  },
  // Fields for work and salary mechanics:
  workCount: { 
    type: Number, 
    default: 0 
  },
  lastWorkAt: { 
    type: Date, 
    default: null 
  },
  lastSalaryWithdrawal: { 
    type: Date, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Company', companySchema);