import {
  collectAquariumReward
} from "./aquarium.js";

export default {
  name: "collect",
  description: "Collect rewards for your aquarium.",
  aliases: [],
  args: "",
  example: [
    "collect"
  ],
  related: ["aquarium"],
  cooldown: 43200000,
  // 10 seconds cooldown
  category: "🌊 Ocean Life",

  // Main function to execute the collect command
  execute: (args, message) => {
    try {
      return collectAquariumReward(message, message.author);
    } catch (error) {
      console.error('Error in aquarium collection:',
        error);
      return message.channel.send('⚠️ There was an error collecting your aquarium rewards. Please try again later.');
    }
  }
};