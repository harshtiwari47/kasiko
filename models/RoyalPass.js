import mongoose from 'mongoose';

const {
  Schema
} = mongoose;

const rewardSchema = new Schema( {
  type: {
    type: String,
    required: true,
    enum: ['cash', 'badge', 'pet'], // other types as necessary
  },
  name: {
    type: String, // e.g., 'Royal Starter' for badges
  },
  amount: {
    type: Number, // Applicable for rewards like 'cash'
  },
  emoji: {
    type: String
  },
  id: {
    type: String,
    required: true
  }
}, {
  _id: false
}); // Disable _id for subdocuments to save space

const royalPassSchema = new Schema( {
  userId: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
      min: 0,
    },
    progress: {
      type: Number,
    default: 0,
      min: 0,
    },
    month: {
      type: Number,
      required: true, // Store the current month (0-11)
      min: 0,
      max: 11,
    },
    rewardsClaimed: [rewardSchema],
    isPremium: {
      type: Boolean, default: false
    },
  }, {
    timestamps: true,
  });

  // Create a compound index to ensure one RoyalPass per user per month
  royalPassSchema.index({
    userId: 1, month: 1
  }, {
    unique: true
  });

  const RoyalPass = mongoose.model('RoyalPass', royalPassSchema);

  export default RoyalPass;