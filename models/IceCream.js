import mongoose from 'mongoose';

// Define the ice cream flavor schema
const icecreamSchema = new mongoose.Schema({
  name: {
    type: String, required: true // required constraint
  },
  icecream: {
    type: String
  },
  items: {
    type: Number,
    default: 1,
      min: 0 // default value for items
    }
  });

  // Define the ice cream shop schema
  const iceCreamShopSchema = new mongoose.Schema({
    userId: {
      type: String, required: true, unique: true
    },
    shopName: {
      type: String, required: true
    },
    customersServed: {
      type: Number, default: 0
    },
    loyaltyPoints: {
      type: Number, default: 40, min: 0
    },
    money: {
      type: Number, default: 100, min: 0// Initial money for setup
    },
    shopLevel: {
      type: Number, default: 1, min: 1
    },
    shopLayout: {
      type: Number, default: 1, min: 1
    },
    flavors: {
      type: [icecreamSchema],
    default: [{
        name: "Kulfi",
        icecream: "Kulfi <:kulfi:1308433408946339840>",
        items: 1
      }]
    },
    reputation: {
      type: Number, default: 50, min: 0 // Shop's initial reputation
    },
    dailyBonusClaimed: {
      type: Boolean, default: false
    },
    lastVisit: {
      type: Date, default: Date.now
    }
  });

  // Create the IceCreamShop model
  const IceCreamShop = mongoose.model('IceCreamShop', iceCreamShopSchema);

  export default IceCreamShop;