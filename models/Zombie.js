import mongoose from 'mongoose';

let zombSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  health: {
    type: Number,
    required: true,
    default: 700,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    level: {
      type: Number,
      required: true,
    default: 1,
      min: 1,
      set: (value) => (value < 1 ? 1: value)
    },
    kill: {
      type: Number,
      required: true,
    default: 0,
      min: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    weapons: {
      type: Array,
    default: [{
        weapon: '🥊',
        name: 'Glove',
        minHunt: 1,
        maxHunt: 2,
        level: 1,
      }]
    },
    activeWeapon: {
      type: Object,
    default: {
        weapon: '🥊',
        name: 'Glove',
        minHunt: 1,
        maxHunt: 2,
        level: 1,
      }
    },
    badges: {
      type: Array,
    default: []
    },
    lastBattle: {
      active: {
        type: Boolean, default: false
      },
      time: {
        type: Date, default: null
      },
    },
    resources: {
      wood: {
        type: Number,
      default: 0,
        min: 0
      },
      metal: {
        type: Number,
      default: 0,
        min: 0
      },
      medkit: {
        type: Number,
      default: 0,
        min: 0
      },
      food: {
        type: Number,
      default: 0,
        min: 0
      }
    }
  }, {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  });

  // Create and export the model
  const Zombie = mongoose.model('Zombie', zombSchema);

  export default Zombie;