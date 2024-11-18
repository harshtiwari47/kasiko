import mongoose from 'mongoose';

// Ship schema
const shipSchema = new mongoose.Schema({
  level: {
    type: Number, required: true
  },
  id: {
    type: String, required: true
  },
  name: {
    type: String, required: true
  },
  durability: {
    type: Number, required: true
  },
  active: {
    type: Boolean, required: true
  }
});

// Main schema where the user ID is the primary key and ships are stored as an array
const userShipsSchema = new mongoose.Schema({
  id: {
    type: String, required: true, unique: true
  }, // The userId for each user
  ships: {
    type: [shipSchema],
  }
});

// Create the model for user ships
const UserShips = mongoose.model('UserShips', userShipsSchema);

export default UserShips;