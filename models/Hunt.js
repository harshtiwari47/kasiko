import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
  name: String,
  emoji: String,
  totalAnimals: {
    type: Number, default: 1
    },
    level: {
      type: Number, default: 1
    },
    exp: {
      type: Number, default: 0
    },
    type: {
      type: String, default: "common"
    },
    hp: {
      type: Number, default: 100
    }, // optional advanced usage
    attack: {
      type: Number, default: 10
    }, // optional advanced usage
  }, {
    _id: false
  });

  const boosterSchema = new mongoose.Schema({
    name: String,
    effect: String,
    rarity: Number
  }, {
    _id: false
  });

  // We can keep achievements and daily tasks as simple arrays or subdocs
  const achievementSchema = new mongoose.Schema({
    name: String,
    description: String,
    dateUnlocked: Date
  }, {
    _id: false
  });

  const dailyTaskSchema = new mongoose.Schema({
    taskName: String,
    completed: {
      type: Boolean, default: false
    },
    rewardClaimed: {
      type: Boolean, default: false
    }
  }, {
    _id: false
  });

  const userSchema = new mongoose.Schema({
    discordId: {
      type: String, required: true, unique: true
    },
    // Hunting system fields
    hunt: {
      nextRarityIndex: {
        type: Number, default: 0
      },
      animals: [animalSchema],
      boosters: [boosterSchema],
      huntsToday: {
        type: Number, default: 0
      },
      lastHuntDate: {
        type: Date, default: null
      },
      // possibly store location unlocks, etc
      unlockedLocations: {
        type: [String], default: ['Forest']
      },
    },

    // Achievements, daily tasks, etc.
    achievements: [achievementSchema],
    dailyTasks: [dailyTaskSchema],

    // Overall stats
    currency: {
      type: Number, default: 0
    },
    weapons: {
      type: [String], default: []
    },

    globalExp: {
      type: Number, default: 0
    },
    globalLevel: {
      type: Number, default: 1
    },
  }, {
    timestamps: true
  });

  export default mongoose.model('Hunt', userSchema);