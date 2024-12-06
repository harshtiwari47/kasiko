import mongoose from 'mongoose';
const {
  Schema
} = mongoose;

const taskSchema = new Schema( {
  name: {
    type: String, required: true
  },
  exp: {
    type: Number, default: 0
    },
    required: {
      type: Number, required: true
    },
    reward: {
      type: Number, required: true
    },
    completed: {
      type: Boolean, default: false
    },
    rarity: {
      type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common'
    },
    description: {
      type: String, maxlength: 60
    }
  }, {
    timestamps: true
  });

  const userSchema = new Schema( {
    id: {
      type: String, required: true, unique: true
    },
    eligible: {
      type: Boolean, default: true
    },
    method: {
      type: String, enum: ['purchase', 'cash'], default: 'cash'
    },
    tasks: {
      type: Map, of: taskSchema
    }
  }, {
    timestamps: true,
  });

  const PassTasks = mongoose.model('passtasks', userSchema);

  export default PassTasks;