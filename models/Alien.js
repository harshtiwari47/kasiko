import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  credits: { type: Number, default: 0 },
  resources: { type: Map, of: Number, default: {} }, // To store resources like coal, iron, etc.
  lastAction: {
    action: { type: String },
    time: { type: Date },
  },
});

playerSchema.methods.addCredits = async function(amount) {
  this.credits += amount;
  await this.save();
};

playerSchema.methods.addResources = async function(resource, amount) {
  if (this.resources.has(resource)) {
    this.resources.set(resource, this.resources.get(resource) + amount);
  } else {
    this.resources.set(resource, amount);
  }
  await this.save();
};

const Player = mongoose.model('Player', playerSchema);
export default Player;