import mongoose from 'mongoose';

const powerSubSchema = new mongoose.Schema({
  typeId: {
    type: String, // e.g., "Glacial Barrier", "Inferno Roar"
    required: true
  },
  level: {
    type: Number,
    default: 1
    }
  },
  {
    _id: false
  });

  const dragonSubSchema = new mongoose.Schema({
    typeId: {
      type: String,
      required: true
    },
    customName: {
      type: String,
    default: null,
    },
    stage: {
      type: Number,
    default: 1
    },
    experience: {
      type: Number,
    default: 0
    },
    health: {
      type: Number,
    default: 100
    },
    hunger: {
      type: Number,
    default: 0,
      set: (value) => Math.max(0, Math.min(value, 100))
    },
    isHatched: {
      type: Boolean,
    default: false
    }
  }, {
    _id: false
  });

  const userSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
      unique: true
    },
    gems: {
      type: Number,
    default: 100
    },
    dragons: {
      type: [dragonSubSchema],
    default: []
    },
    lastDaily: {
      type: Date,
    default: null,
      set: (value) => (value < 0 ? 0: value)
    },
    sigils: {
      type: Number,
    default: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    createdAt: {
      type: Date,
    default: Date.now
    },
    metals: {
      gold: {
        type: Number,
      default: 0
      },
      silver: {
        type: Number,
      default: 0
      },
      bronze: {
        type: Number,
      default: 0
      }
    },
    powers: {
      type: [powerSubSchema],
    default: []
    }
  });

  export default mongoose.model('Dragon', userSchema);