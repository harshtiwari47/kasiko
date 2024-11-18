import mongoose from 'mongoose';

// Sub-document schema for the bank account
const bankAccountSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    default: 1,
    },
    deposit: {
      type: Number,
      required: true,
    default: 0,
    },
    interest: {
      type: Number,
      required: true,
    default: 1.5,
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