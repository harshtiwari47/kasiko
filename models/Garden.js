import mongoose from 'mongoose';

const GardenSchema = new mongoose.Schema(
  {},
  {
    timestamps: true, // Automatically add `createdAt` and `updatedAt`.
  }
);

const Garden = mongoose.model('Garden', GardenSchema);

export default Garden;