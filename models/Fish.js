import mongoose from 'mongoose';

// AnimalDetail Schema (for individual animal tracking)
const animalDetailSchema = new mongoose.Schema({
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
    name: {
      type: String,
      required: true,
    default: "Dolphin"
    },
    food: {
      type: Number,
    default: 0,
      set: (value) => (value < 0 ? 0: value)
    }
  });

  // Main Animal Schema (includes references to individual animal details)
  const fishSchema = new mongoose.Schema({
    Dolphin: {
      type: animalDetailSchema
    },
    Clownfish: {
      type: animalDetailSchema
    },
    Turtle: {
      type: animalDetailSchema
    },
    Otter: {
      type: animalDetailSchema
    },
    Garibaldifish: {
      type: animalDetailSchema
    },
    Anglerfish: {
      type: animalDetailSchema
    },
    Shark: {
      type: animalDetailSchema
    },
    Whale: {
      type: animalDetailSchema
    },
    Octopus: {
      type: animalDetailSchema
    },
    Pufferfish: {
      type: animalDetailSchema
    },
    Lionfish: {
      type: animalDetailSchema
    },
    Swordfish: {
      type: animalDetailSchema
    }
  });

  export default fishSchema;