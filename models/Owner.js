import mongoose from "mongoose";

const OwnerSchema = new mongoose.Schema({
  ownerId: {
    type: String, required: true, unique: true
  },
  ownerType: {
    type: String, required: true
  },
  dateJoined: {
    type: Date, default: Date.now
    },
    lastRewardWithdraw: {
      type: Date, default: null
    },
    totalCashWithdrawn: {
      type: Number, default: 0
    },
    dailyWithdrawn: {
      date: {
        type: Date,
      default: null
      },
      amount: {
        type: Number,
      default: null
      }
    },
    totalServersContributed: {
      type: Number, default: 0
    },
    retired: {
      type: Boolean, default: false
    },
  });

  const OwnerModel = mongoose.model("Owner", OwnerSchema);

  export default OwnerModel;