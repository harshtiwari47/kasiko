import mongoose from 'mongoose';

const giveawaySchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  channelId: {
    type: String,
    required: true,
    index: true
  },
  guildId: {
    type: String,
    default: null
  },
  prize: {
    type: Number,
    required: true,
    min: 1
  },
  alertRoleId: {
    type: String,
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endsAt: {
    type: Date,
    required: true,
    index: true
  },
  ended: {
    type: Boolean,
    default: false,
    index: true
  },
  winnerId: {
    type: String,
    default: null
  },
  entries: {
    type: [String],
    default: []
  },
  entryCount: {
    type: Number,
    default: 0
  },
  isDaily: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Giveaway', giveawaySchema);
