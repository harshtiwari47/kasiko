import mongoose from 'mongoose';

const OrcaSchema = new mongoose.Schema({
  serverId: { type: String, required: true },
  lastAppearance: { type: Date, default: null },
  hunter: { type: String, default: null },
  hunterId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: { expires: '1h' } }, // TTL index
});

export default mongoose.model('Orca', OrcaSchema);