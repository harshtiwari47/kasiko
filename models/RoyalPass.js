import mongoose from 'mongoose';

const royalPassSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Ensure each user has only one Royal Pass
  },
  level: {
    type: Number,
    default: 1,
    },
    progress: {
      type: Number,
    default: 0,
    },
    month: {
      type: Number,
      required: true, // Store the current month to reset progress each month
    },
    rewardsClaimed: [{
      type: {
        type: String, // The type of reward ('cash', 'badge', 'pet', etc.)
        required: true,
      },
      name: String, // The name of the reward (e.g., 'Royal Starter' for badges)
      amount: Number, // The amount for rewards like 'cash'
    }]
  }, {
    timestamps: true,
  });

  const RoyalPass = mongoose.model('RoyalPass', royalPassSchema);

  export default RoyalPass;