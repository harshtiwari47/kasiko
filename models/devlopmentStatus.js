import mongoose from 'mongoose';

const developmentStatusSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
});

// Static method to check if any development status is active
developmentStatusSchema.statics.isActive = async function () {
  const now = new Date();
  return this.findOne({
    startTime: {
      $lte: now
    },
    endTime: {
      $gte: now
    },
  });
};

const DevelopmentStatus = mongoose.model('DevelopmentStatus', developmentStatusSchema);

export default DevelopmentStatus;