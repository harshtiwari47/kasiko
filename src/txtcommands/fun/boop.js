import { EmbedBuilder } from "discord.js";

export default {
  name: "boop",
  description: "Sends a cute 'boop' to someone!",
  aliases: ["boopboop", "poke"],
  cooldown: 3000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    args.shift();
    const boopTargets = args.join(" ") || `<@${message.author.id}>`;
    const boopMessages = [
      "Boop! 🐽",
      "Boop boop! ✨",
      "You just got booped! 💕",
      "Boop! You're adorable!",
    ];
    const randomBoop = boopMessages[Math.floor(Math.random() * boopMessages.length)];

    const embed = new EmbedBuilder()
      .setTitle("✨ Boop!")
      .setDescription(`${randomBoop} ${boopTargets}`)
      .setColor("#FFC0CB");

    await message.reply({ embeds: [embed] });
  },
};