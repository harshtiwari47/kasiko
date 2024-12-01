import mongoose from 'mongoose';

const gatePathSchema = new mongoose.Schema({
  hour: {
    type: String,
    required: true,
    unique: true
  },
  path: {
    type: [String],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 43200
    }
  });

  const HeavenGates = mongoose.model('GatePath', gatePathSchema);

  export default HeavenGates;