import mongoose from 'mongoose';

// Sub-document schema for the bank account
const bankAccountSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    default: 1,
      set: (value) => (value < 1 ? 1: value)
    },
    deposit: {
      type: Number,
      required: true,
    default: 0,
      set: (value) => (value < 0 ? 0: value)
    },
    interest: {
      type: Number,
      required: true,
    default: 1.5,
      set: (value) => (value < 0.5 ? 0.75: value)
    },
    shield: {
      type: Number,
    default: 0,
    },
    open: {
      type: Boolean,
    default: false
    }
  });

  export default bankAccountSchema