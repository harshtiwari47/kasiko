import mongoose from 'mongoose';

const {
  Schema,
  model
} = mongoose;

const firedownUsersSchema = new Schema( {
  userId: {
    type: String,
    required: true,
    index: true,
  },
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  guildDoc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkyraidGuilds'
  },
  totalDamage: {
    type: Number,
    default: 0,
    },
    matchesParticipated: {
      type: Number,
    default: 0,
    },
    badges: [{
      type: String,
    default: [],
    },
    ],
    starPerformer: {
      type: Number,
    default: 0,
    },
  });

  export default model('SkyraidUsers', firedownUsersSchema);