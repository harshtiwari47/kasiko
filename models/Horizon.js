import mongoose from 'mongoose';

// Special Power schema (used by bosses)
const SpecialPowerSchema = new mongoose.Schema({
  name: {
    type: String, required: true
  }, // e.g., "InfernoStrike"
  type: {
    type: String, enum: ['damage', 'heal'], required: true
  },
  value: {
    type: Number, required: true
  },
  description: {
    type: String, default: ''
    }
  });

  // Boss schema
  const BossSchema = new mongoose.Schema({
    name: {
      type: String, required: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Normal', 'Hard', 'Epic', 'Legendary'],
    default: 'Normal'
    },
    image: {
      type: String, default: null
    },
    health: {
      type: Number, required: true
    },
    maxHealth: {
      type: Number, required: true
    },
    damage: {
      type: Number, required: true
    },
    specialPowers: {
      type: [SpecialPowerSchema], default: []
    },
    specialCooldown: {
      type: Number, default: 3
    },
    lastSpecialUsedAt: {
      type: Date, default: null
    },
    description: {
      type: String, default: ''
    }
  });

  // Battle history schema (last 7 events)
  const BattleEventSchema = new mongoose.Schema({
    timestamp: {
      type: Date, default: Date.now
    },
    playerId: {
      type: String, required: true
    },
    action: {
      type: String, required: false
    }, // 'attack', 'heal', 'special'
    target: {
      type: String, required: true
    }, // 'boss' or playerId
    damage: {
      type: Number, required: false
    },
    healing: {
      type: Number, required: false
    },
    specialName: {
      type: String, default: null
    },
    bossIndex: {
      type: Number, default: null
    },
    bossName: {
      type: String, default: null
    }
  });

  // Player contribution schema
  const PlayerStatsSchema = new mongoose.Schema({
    playerId: {
      type: String, required: true
    },
    totalDamage: {
      type: Number, default: 0
    },
    totalHealing: {
      type: Number, default: 0
    },
    currentDragon: {
      id: {
        type: String, required: true
      },
      name: {
        type: String
      },
      level: {
        type: Number, default: 1
      },
      emoji: String,
      health: {
        type: Number,
      default: 100
      },
      image: String,
      rarity: {
        type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary'], default: 'Common'
      },
      abilities: [{
        id: String,
        name: String,
        dmg: Number,
        level: Number,
        defence: Number,
        emoji: String,
        heal: Number
      }]
    },
    rewardsGiven: {
      type: Number,
      default: 0
    },
    dragonDamagePower: Number,
    lastActionAt: {
      type: Date, default: Date.now
    }
  });

  // Main Horizon Battle schema
  const HorizonBattleSchema = new mongoose.Schema({
    code: {
      type: String, required: true, unique: true, uppercase: true
    },
    players: [{
      type: String, required: true
    }], // Discord user IDs
    leaderId: {
      type: String, default: null
    }, // Assigned or calculated
    currentBossIndex: {
      type: Number, default: 0
    },
    bosses: {
      type: [BossSchema], required: true
    },
    playerStats: {
      type: [PlayerStatsSchema], default: []
    },
    history: {
      type: [BattleEventSchema], default: []
    }, // You can limit in logic to last 7
    createdAt: {
      type: Date, default: Date.now
    },
    lastUpdatedAt: {
      type: Date, default: Date.now
    }
  });

  const HorizonBattle = mongoose.model('HorizonBattle', HorizonBattleSchema);

  export default HorizonBattle;