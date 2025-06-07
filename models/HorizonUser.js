import mongoose from 'mongoose';

const UserBattleStatsSchema = new mongoose.Schema({
  userId: {
    type: String, required: true, unique: true
  },
  totalBattlesPlayed: {
    type: Number, default: 0
    },
    totalBattlesWon: {
      type: Number, default: 0
    },
    totalBattlesLost: {
      type: Number, default: 0
    },
    totalBossesDefeated: {
      type: Number, default: 0
    },
    totalDamageDealt: {
      type: Number, default: 0
    },
    highestDamageInBattle: {
      type: Number, default: 0
    },
    mostBossesInBattle: {
      type: Number, default: 0
    },
    lastBattle: {
      code: {
        type: String
      },
      status: {
        type: String,
        enum: ['won', 'lost', 'left', 'ongoing'],
      default: 'ongoing'
      },
      bossLevelReached: {
        type: Number, default: 0
      },
      damageDealt: {
        type: Number, default: 0
      },
      totalRewards: {
        type: Number, default: 0
      },
      finishedAt: {
        type: Date
      }
    },
    joinedAt: {
      type: Date, default: Date.now
    },
    updatedAt: {
      type: Date, default: Date.now
    }
  });

  UserBattleStatsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });

  export default mongoose.model('HorizonUser', UserBattleStatsSchema);