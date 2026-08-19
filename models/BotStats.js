import mongoose from 'mongoose';

const botStatsSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true,
    index: true
  },
  totalCommands: {
    type: Number,
    default: 0
  },
  commands: {
    type: Map,
    of: Number,
    default: {}
  },
  activeUsersCount: {
    type: Number,
    default: 0
  },
  activeGuildsCount: {
    type: Number,
    default: 0
  },
  guildUsage: {
    type: Map,
    of: Number, // guildId -> count
    default: {}
  },
  userUsage: {
    type: Map,
    of: Number, // userId -> count
    default: {}
  },
  hourlyActivity: {
    type: [Number], // Array of 24 numbers (0-23 hours)
    default: () => new Array(24).fill(0)
  },
  serverCountSnapshot: {
    type: Number,
    default: 0
  },
  memberCountSnapshot: {
    type: Number,
    default: 0
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const BotStats = mongoose.models.BotStats || mongoose.model('BotStats', botStatsSchema);

export default BotStats;
