import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: false,
    sparse: true,
  },
  name: {
    type: String,
    required: false, // Name of the channel
  },
  isAllowed: {
    type: Boolean,
    default: true, // Whether the bot is allowed to operate in this channel
    },
    type: {
      type: String,
      enum: ['text', 'voice', 'category'], // Type of the channel
    },
    categoryId: {
      type: String, // Optional: Category ID for better organization
    },
    createdAt: {
      type: Date,
    default: Date.now, // Timestamp when the channel entry was created
    },
    updatedAt: {
      type: Date,
    default: Date.now, // Last updated timestamp
    },
  });

  // Server model with embedded channels
  const serverSchema = new mongoose.Schema({
    id: {
      type: String,
      required: true,
      unique: true, // Unique identifier for the server (guild ID)
    },
    name: {
      type: String,
      required: true, // Name of the server (guild name)
    },
    ownerId: {
      type: String,
      required: true, // ID of the server owner
    },
    permissions: {
      type: String,
      enum: ['all_channels', 'restricted_channels'],
    default: 'all_channels', // Server-wide bot permissions
    },
    isAdminSet: {
      type: Boolean,
    default: false, // Whether permissions were explicitly set by an admin
    },
    createdAt: {
      type: Date,
    default: Date.now, // Timestamp when the server entry was created
    },
    updatedAt: {
      type: Date,
    default: Date.now, // Last updated timestamp
    },
    allowMentions: {
      type: Boolean,
    default: true, // Whether the bot can be mentioned in the server
    },
    allowDms: {
      type: Boolean,
    default: true, // Whether the bot is allowed to send direct messages to members
    },
    language: {
      type: String,
    default: 'en', // Preferred language for bot messages in this server
    },
    channels: {
      type: [channelSchema], // Embedded array of channels
    default: [],
    },
    prefix: {
      type: String,
    default: "kas"
    }
  });

  serverSchema.pre('save', function (next) {
    this.updatedAt = new Date(); // Update `updatedAt` timestamp on save
    next();
  });

  const Server = mongoose.model('Server', serverSchema);

  export default Server;