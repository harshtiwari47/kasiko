import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  campaignId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rewards: {
    cash: {
      type: Number,
      default: 0
    },
    items: [{
      id: String,
      amount: Number
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed'],
    default: 'draft',
    index: true
  },
  totalTargetUsers: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  closedDmCount: {
    type: Number,
    default: 0
  },
  optedOutCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  processedUserIds: {
    type: [String],
    default: []
  },
  lastProcessedAt: {
    type: Date,
    default: null
  },
  reportChannelId: {
    type: String,
    default: null
  },
  claimedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Broadcast', broadcastSchema);
