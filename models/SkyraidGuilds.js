import mongoose from 'mongoose';

const {
  Schema,
  model
} = mongoose;
import SkyraidUsers from './SkyraidUsers.js';

const bossDefeatedSchema = new Schema(
  {
    'Dusk Talon': {
      type: Number,
      default: 0,
      },
      'Shadow Spire': {
        type: Number,
      default: 0,
      },
      'Infernal Ember': {
        type: Number,
      default: 0,
      },
      'Azure Fang': {
        type: Number,
      default: 0,
      },
    },
    {
      _id: false
    }
  );

  const firedownGuildsSchema = new Schema( {
    guildId: {
      type: String,
      required: true,
      index: true,
    },
    totalMatches: {
      type: Number,
    default: 0,
    },
    matchesWon: {
      type: Number,
    default: 0,
    },
    matchesCancelled: {
      type: Number,
    default: 0,
    },
    bossDefeated: {
      type: bossDefeatedSchema,
    default: () => ({}),
    },
    startRoleId: {
      type: String,
    default: null,
    },
    players: [{
      type: Schema.Types.ObjectId,
      ref: "SkyraidUsers", // Reference to the FiredownUsers model
    }],
    badges: [{
      type: String,
    default: [],
    },
    ],
  });

  export default model('SkyraidGuilds', firedownGuildsSchema);