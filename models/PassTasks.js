import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the task schema as a subdocument
const taskSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  exp: {
    type: Number,
    default: 0,
  },
  required: {
    type: Number,
    required: true,
  },
  reward: {
    type: Number,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  description: {
    type: String,
    maxlength: 60,
  },
}, { _id: false }); // Disable _id for subdocuments to save space

// Define the main PassTasks schema
const passTasksSchema = new Schema({
  id: { // User ID
    type: String,
    required: true,
    unique: true, // Ensure each user has only one PassTasks document
  },
  eligible: {
    type: Boolean,
    default: true,
  },
  method: {
    type: String,
    enum: ['purchase', 'cash'],
    default: 'cash',
  },
  totalExp: { // New field to store total experience
    type: Number,
    default: 0,
  },
  tasks: { // Changed from Map to plain Object
    type: Object,
    required: true,
    default: {},
  },
}, {
  timestamps: true,
});

const PassTasks = mongoose.model('PassTasks', passTasksSchema);

export default PassTasks;