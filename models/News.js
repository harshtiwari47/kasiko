import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const News = mongoose.model('News', newsSchema);

export default News;