export default {
  name: "eep",
  description: "Makes a cute 'eep!' noise when startled.",
  aliases: ["eepie", "scared"],
  cooldown: 2000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    const eepMessages = [
      "Eep! 🐾 Oh no, you startled me!",
      "Eeep! *hides behind a cushion* 🥺",
      "Eep! Don’t scare me like that! 😖",
      "Eep! Oh, it’s just you... hello! 💕",
    ];

    const randomEep = eepMessages[Math.floor(Math.random() * eepMessages.length)];
    await message.reply(randomEep);
  },
};