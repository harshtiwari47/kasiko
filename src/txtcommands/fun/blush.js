import { EmbedBuilder } from "discord.js";

export default {
  name: "blush",
  description: "The bot blushes shyly and reacts cutely!",
  aliases: ["shy", "cute"],
  cooldown: 3000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    const blushMessages = [
      "Oh my... y-you noticed me? 👉👈 (⁄ ⁄•⁄ω⁄•⁄ ⁄)",
      "*Blushes furiously* D-did you just call me cute? 🥺",
      "W-wait, are you teasing me? (⊙.⊙)💦",
      "UwU… stop it, I’m gonna die of embarrassment! (>///<)",
    ];

    const asciiBlushes = [
      "(⁄ ⁄•⁄ω⁄•⁄ ⁄)",
      "(≧◡≦)",
      "(⌒_⌒;)",
      "(*≧ω≦)",
    ];

    const randomMessage = blushMessages[Math.floor(Math.random() * blushMessages.length)];
    const randomASCII = asciiBlushes[Math.floor(Math.random() * asciiBlushes.length)];

    const embed = new EmbedBuilder()
      .setTitle("🌸 Blushes!")
      .setDescription(`${randomMessage}\n\n*${randomASCII}*`)
      .setColor("#FFC0CB");

    await message.reply({ embeds: [embed] });
  },
};