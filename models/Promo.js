import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String, required: true, unique: true
  },
  plan: {
    type: String, enum: ['titan', 'pheonix', 'etheral', 'celestia'], required: true
  },
  user: {
    type: String, default: null
    }, // Will be set when redeemed
    createdAt: {
      type: Date, default: Date.now
    }
  });

  const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
  export default PromoCode;