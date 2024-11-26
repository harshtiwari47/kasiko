import mongoose from 'mongoose';

// StockDetail Schema (for individual stock tracking)
const stockDetailSchema = new mongoose.Schema({
  dailyPurchased: [Number, Number],
  dailySold: [Number, Number],
  cost: {
    type: Number, default: 0, min: 0
    }, // Current cost of the stock
    shares: {
      type: Number, default: 0, min: 0
    }, // Current number of shares
    history: [{
      timestamp: {
        type: Number, // Timestamp of the history record
        required: true
      },
      cost: {
        type: Number,
        min: 0
      }, // Stock cost at that time
      shares: {
        type: Number
      }, // Stock shares at that time
    }]
  });

  // Main Stock Schema (includes references to individual stock details)
  const stockSchema = new mongoose.Schema({
    TECHCORP: {
      type: stockDetailSchema
    },
    AUTOWORKS: {
      type: stockDetailSchema
    },
    ECOENERGY: {
      type: stockDetailSchema
    },
    FOODIE: {
      type: stockDetailSchema
    },
    MEDICAL: {
      type: stockDetailSchema
    },
    RETAILER: {
      type: stockDetailSchema
    },
    FINTECH: {
      type: stockDetailSchema
    },
    TRAVEL: {
      type: stockDetailSchema
    },
    EDUCATECH: {
      type: stockDetailSchema
    },
    CLEANENERGY: {
      type: stockDetailSchema
    },
    BIOGENICS: {
      type: stockDetailSchema
    },
    AEROSPACE: {
      type: stockDetailSchema
    },
    CYBERPROTECT: {
      type: stockDetailSchema
    },
    GREENSCAPE: {
      type: stockDetailSchema
    },
    WATERWORKS: {
      type: stockDetailSchema
    },
    NEWMEDIA: {
      type: stockDetailSchema
    },
    GLOBALTRADE: {
      type: stockDetailSchema
    }
  });

  const Stock = stockSchema;

  export default Stock;