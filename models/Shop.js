import mongoose from 'mongoose';

// Sub-schemas for different categories
const ringSchema = new mongoose.Schema({
  name: {
    type: String, required: true
  },
  amount: {
    type: Number, required: true, default: 0
    },
    id: {
      type: String, required: true
    },
  });

  const necklaceSchema = new mongoose.Schema({
    name: {
      type: String, required: true
    },
    amount: {
      type: Number, required: true, default: 0
    },
    id: {
      type: String, required: true
    },
  });

  const watchSchema = new mongoose.Schema({
    name: {
      type: String, required: true
    },
    amount: {
      type: Number, required: true, default: 0
    },
    id: {
      type: String, required: true
    },
  });

  const stripSchema = new mongoose.Schema({
    name: {
      type: String, required: true
    },
    amount: {
      type: Number, required: true, default: 0
    },
    id: {
      type: String, required: true
    },
    url: {
      type: String, required: true
    }
  });

  // Main ShopItems schema
  const shopItemsSchema = new mongoose.Schema({
    userId: {
      type: String, unique: true, required: true
    }, // Unique User ID
    rings: [ringSchema],
    necklaces: [necklaceSchema],
    watches: [watchSchema],
    strips: [stripSchema], // Strips category added
    networth: {
      type: Number, required: true
    }, // Networth as a number
  });

  // Create the model
  const ShopItem = mongoose.model('ShopItem', shopItemsSchema);

  export default ShopItem;