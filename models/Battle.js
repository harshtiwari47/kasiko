import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    dragonId: {
      type: String,
      required: true,
    },
    dragonStage: {
      type: Number,
      default: 2
      },
      dragonName: {
        type: String,
      },
      emoji: {
        type: String
      },
      health: {
        type: Number,
      default: 100,
      },
      damageContributed: {
        type: Number,
      default: 0,
      },
      powers: {
        type: [Object],
      default: [],
      },
      totalDmg: {
        type: Number,
      default: 100
      }
    },
    {
      _id: false
    }
  );

  const bossSchema = new mongoose.Schema(
    {
      typeId: {
        type: String,
        required: true,
      },
      health: {
        type: Number,
        required: true,
      },
      abilities: {
        type: [String],
      default: [],
      },
      level: {
        type: Number,
      default: 1
      },
      slogan: {
        type: String
      },
      image: {
        type: String
      },
      emoji: {
        type: String
      }
    },
    {
      _id: false
    }
  );

  const battleSchema = new mongoose.Schema({
    guildId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
    default: null
    },
    boss: {
      type: bossSchema,
      required: true,
    },
    players: {
      type: [playerSchema],
    default: [],
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting',
    },
    createdAt: {
      type: Date,
    default: Date.now,
      index: {
        expires: '24h'
      }
    },
    battleStartedAt: {
      type: Date,
    default: null,
    },
  }, {
    timestamps: true
  });

  export default mongoose.model('Battle', battleSchema);