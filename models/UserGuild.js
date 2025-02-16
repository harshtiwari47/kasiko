import mongoose from "mongoose";

const UserGuildSchema = new mongoose.Schema({
  userId: {
    type: String, required: true, ref: 'User'
  },
  guildId: {
    type: String, required: true
  },
  icecream: {
    money: {
      type: Number,
      default: 0
      },
      reputation: {
        type: Number,
      default: 0
      },
      served: {
        type: Number,
      default: 0
      }
    }
  });

  UserGuildSchema.index({
    userId: 1, guildId: 1
  }, {
    unique: true
  });

  const UserGuild = mongoose.model("UserGuild", UserGuildSchema);
  export default UserGuild;