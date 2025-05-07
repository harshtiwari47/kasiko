import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "dadjoke",
  description: "Get a random dad joke!",
  aliases: ["dad"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      const response = await fetch("https://icanhazdadjoke.com/", {
        headers: {
          Accept: "application/json"
        },
      });
      const data = await response.json();

      const embed = new EmbedBuilder()
      .setTitle("🧓🏻 DAD JOKE")
      .setDescription(data.joke)
      .setColor("Random");

      await message.channel.send({
        embeds: [embed]
      });
      return;
    } catch (err) {
      console.error("Error fetching dad joke:", err);
      return;
    }
  },
};