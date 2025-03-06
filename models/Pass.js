import mongoose from 'mongoose';

const passSchema = new mongoose.Schema({
  userId: {
    type: String, required: true
  },
  plan: {
    type: String, enum: ['titan', 'pheonix', 'etheral', 'celestia'], required: true
  },
  level: {
    type: Number, default: 1
    },
    activeDate: {
      type: Date, default: Date.now, required: true
    },
    expiryDate: {
      type: Date, required: true
    },
    premium: {
      type: Boolean, default: false
    }
  }, {
    timestamps: true
  });

  const Pass = mongoose.model('Pass', passSchema);
  export default Pass;