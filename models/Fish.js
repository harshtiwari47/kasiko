import mongoose from 'mongoose';

const animalDetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    default: 1,
      set: (value) => (value < 1 ? 1: value)
    },
    animals: {
      type: Number,
    default: 1,
      set: (value) => (value < 1 ? 1: value)
    },
    food: {
      type: Number,
    default: 0,
      set: (value) => (value < 0 ? 0: value)
    }
  });

  const aquariumSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
      unique: true
    },
    fishes: {
      type: [animalDetailSchema],
    default: []
    },
    aquarium: {
      type: Array,
    default: []
    },
    rods: {
      Bamboo: {
        type: Number,
      default: 0
      },
      Fiberglass: {
        type: Number,
      default: 0
      },
      Carbon: {
        type: Number,
      default: 0
      },
      Titanium: {
        type: Number,
      default: 0
      },
      Neptune: {
        type: Number,
      default: 0
      }
    },
    aquariumCollectionTime: {
      type: Number
    }
  });

  const FishCollection = mongoose.model('Fishes', aquariumSchema);

  export default FishCollection;