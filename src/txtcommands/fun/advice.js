import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "advice",
  description: "Get a random piece of advice!",
  aliases: [],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      const response = await fetch("https://api.adviceslip.com/advice");
      const data = await response.json();

      const embed = new EmbedBuilder()
      .setTitle("💡 ADVICE")
      .setDescription(`"${data.slip.advice}"`)
      .setColor("Random");

      await message.channel.send({
        embeds: [embed]
      });
      return;
    } catch (err) {
      console.error("Error fetching advice:", err);
      return;
    }
  },
};