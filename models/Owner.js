import mongoose from "mongoose";

const OwnerSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ownerType: {
    type: String,
    required: true,
    default: 'staff'
  },
  role: {
    type: String,
    default: function() {
      return this.ownerType || 'staff';
    }
  },
  level: {
    type: Number,
    default: 40
  },
  assignedBy: {
    type: String,
    default: 'system'
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  lastRewardWithdraw: {
    type: Date,
    default: null
  },
  totalCashWithdrawn: {
    type: Number,
    default: 0
  },
  dailyWithdrawn: {
    date: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  totalServersContributed: {
    type: Number,
    default: 0
  },
  retired: {
    type: Boolean,
    default: false
  },
  dailyDeducted: {
    date: String,
    amount: Number
  },
  totalCashDeducted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const OwnerModel = mongoose.models.Owner || mongoose.model("Owner", OwnerSchema);

export default OwnerModel;