import { EmbedBuilder } from "discord.js";

export default {
  name: "uselessfact",
  description: "Get a random useless fact!",
  aliases: ["fact"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      const response = await fetch("https://uselessfacts.jsph.pl/random.json?language=en");
      const data = await response.json();

      const embed = new EmbedBuilder()
        .setTitle("🤯 USELESS FACT")
        .setDescription(data.text)
        .setColor("Random");

      await message.channel.send({ embeds: [embed] });
      return;
    } catch (err) {
      console.error("Error fetching useless fact:", err);
      return;
    }
  },
};