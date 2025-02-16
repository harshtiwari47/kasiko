import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "nomnom",
  description: "Nom nom nom... the bot eats something delicious!",
  aliases: ["chew",
    "nom",
    "eatcute"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      const nomSounds = ["Nom nom! 🥐",
        "Chomp chomp! 🍕",
        "Mmmm... nom nom! 🍩"];
      const foods = ["a donut 🍩",
        "a slice of pizza 🍕",
        "a croissant 🥐",
        "some cookies 🍪",
        "a cupcake 🧁",
        "a burger 🍔"];
      const comments = [
        "Mmmm, so tasty! 😋",
        "Yummy in my tummy! 💖",
        "Can I have more? 🥺",
        "I’m so full now! 🐾",
      ];

      const randomSound = nomSounds[Math.floor(Math.random() * nomSounds.length)];
      const randomFood = foods[Math.floor(Math.random() * foods.length)];
      const randomComment = comments[Math.floor(Math.random() * comments.length)];

      const embed = new EmbedBuilder()
      .setDescription(`# 🍴 𝑵𝒐𝒎 𝑵𝒐𝒎 𝑻𝒊𝒎𝒆! 👄\n${randomSound}\nI just ate ${randomFood}!\n-# 🗨️ **${randomComment}**`)

      await message.channel.send({
        embeds: [embed]
      })
      return;
    } catch (err) {
      return;
    }
  },
};