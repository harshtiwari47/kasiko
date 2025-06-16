import mongoose from 'mongoose';

const flowerSchema = new mongoose.Schema({
  tulip: {
    type: Number, default: 0
    },
    cherryBlossom: {
      type: Number, default: 0
    },
    rose: {
      type: Number, default: 0
    },
    hibiscus: {
      type: Number, default: 0
    },
    sunflower: {
      type: Number, default: 0
    },
    daisy: {
      type: Number, default: 0
    },
    lily: {
      type: Number, default: 0
    },
    hyacinth: {
      type: Number, default: 0
    }
  });

  const gardenSchema = new mongoose.Schema({
    userId: {
      type: String, required: true, unique: true
    },
    level: {
      type: Number, default: 1
    },
    startTime: {
      type: Date, default: null
    },
    waterActive: {
      type: Boolean, default: false
    }, // whether the garden has a watering bonus active
    lastWatered: {
      type: Date, default: null
    }, // track last watering time
    flowers: {
      type: flowerSchema, default: () => ({})
    },
  });

  export const Garden = mongoose.model('Garden', gardenSchema);