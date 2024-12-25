import {
  battleStats
} from './battleSystem.js';

export default {
  name: "battleinfo",
  description: "View your battle statistics and information.",
  aliases: ["warinfo",
    "battlestats",
    "wi",
    "bs"],
  args: "",
  example: [
    "battleinfo",
  ],
  related: ["battle",
    "profile"],
  cooldown: 10000,
  // 1 minute cooldown
  category: "⚓ Battle",

  // Execute function
  execute: (args, message) => {
    try {
      return battleStats(message);
    } catch (e) {
      console.error(e);
      return message.channel.send("⚠️ Something went wrong while fetching your battle statistics.");
    }
  }
};