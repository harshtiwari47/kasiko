import mongoose from 'mongoose';

const removedServerSchema = new mongoose.Schema({
  id: String,
  name: String,
  removedAt: Date
});

const ServerRemoved = mongoose.model('RemovedServer', removedServerSchema);

export default ServerRemoved;