import { EmbedBuilder } from "discord.js";

export default {
  name: "duck",
  description: "Quacks up your day with a random duck fact and image!",
  aliases: ["quack", "duckfact"],
  cooldown: 5000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    const duckFacts = [
      "Ducks have waterproof feathers!",
      "A group of ducks is called a raft, team, or paddling.",
      "Ducks have been domesticated for over 4000 years.",
      "Baby ducks are called ducklings. Cute, right?",
    ];

    const randomFact = duckFacts[Math.floor(Math.random() * duckFacts.length)];
    const randomImage = `https://random-d.uk/api/${Math.floor(Math.random() * 100) + 1}.jpg`;

    const embed = new EmbedBuilder()
      .setTitle("🦆 Quack! Here's a Duck Fact!")
      .setDescription(`**Fact:** ${randomFact}`)
      .setImage(randomImage)
      .setColor("#FFD700");

    await message.reply({ embeds: [embed] });
  },
};