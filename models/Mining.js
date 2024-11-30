import mongoose from 'mongoose';

const miningSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  startTime: { type: Date, default: null },
  level: { type: Number, default: 1 },
  collected: { type: Number, default: 0 },
  storage: { type: Number, default: 10 }, // Storage capacity increases with level
});

export const Mining = mongoose.model('Mining', miningSchema);