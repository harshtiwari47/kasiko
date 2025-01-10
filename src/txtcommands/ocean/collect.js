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
  execute: async (args, message) => {
    try {
      return await collectAquariumReward(message.channel, message.author);
    } catch (error) {
      console.error('Error in aquarium collection:',
        error);
      return message.channel.send('⚠️ There was an error collecting your aquarium rewards. Please try again later.');
    }
  }
};