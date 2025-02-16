import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "boop",
  description: "Sends a cute 'boop' to someone!",
  aliases: ["boopboop",
    "poke"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    args.shift();
    try {
      const boopTargets = args.join(" ") || `<@${message.author.id}>`;
      const boopMessages = [
        "Boop! 🐽",
        "Boop boop! ✨",
        "You just got booped! 💕",
        "Boop! You're adorable!",
        "Boop incoming! 🚀",
        "Boop! Gotcha! 😆",
        "A wild boop appears! 🎉",
        "Boop! Because you deserve one. 💖",
        "Boopity boop boop! 🎶",
        "Boop! Just a little reminder that you're awesome! 🌟",
        "Boop! Now you have +10 happiness. 😊",
        "Boop! You’ve been officially booped! ✅",
        "Boop! Tag, you're it! 🏃‍♂️",
        "Boop detected! 🚨",
        "Surprise boop! 🎊",
        "A friendly boop just for you! 💕",
        "Boop! Keep being amazing! 🌈",
        "A stealthy boop appears! 🥷",
        "Boop! Consider yourself virtually hugged. 🤗",
        "Boop! Because why not? 😋",
        "Boop! Sending good vibes your way. 🌞",
        "Double boop! One for luck! 🍀",
        "Triple boop! Feeling special yet? 😘",
        "Boop! Just because you're awesome! 🎇",
        "Boop! Now you have boop energy! ⚡",
        "You've been booped by the boop fairy! 🧚‍♂️",
        "Boop alert! Too much cuteness detected! 🚀",
        "Boop! 100% certified fun. 🏅",
        "Boopity boop! This message is full of joy! 🎶",
        "Boop! This message has been blessed with extra happiness! ✨"
      ];
      const randomBoop = boopMessages[Math.floor(Math.random() * boopMessages.length)];

      const embed = new EmbedBuilder()
      .setTitle("✨ Boop!")
      .setDescription(`${randomBoop} ${boopTargets}`)
      .setColor("#FFC0CB");

      await message.reply({
        embeds: [embed]
      })
      return;
    } catch (err) {
      console.error(err)
    }
  },
};