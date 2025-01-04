import { EmbedBuilder } from "discord.js";

export default {
  name: "nomnom",
  description: "Nom nom nom... the bot eats something delicious!",
  aliases: ["chew",
    "nom",
    "eatcute"],
  cooldown: 4000,
  category: "🧩 Fun",

  execute: async (args, message) => {
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
    .setTitle("🍴 Nom Nom Time!")
    .setDescription(`${randomSound}\n\nI just ate ${randomFood}!\n\n**Comment:** ${randomComment}`)

    await message.channel.send({
      embeds: [embed]
    });
  },
};