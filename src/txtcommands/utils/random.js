import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default {
  name: "random",
  description: "Generates a random number between 1 and 10.",
  aliases: ["rand", "number"],
  cooldown: 4000,
  category: "Utility",

  execute: async (args, message) => {
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    await message.reply(`🎲 𝐑𝐚𝐧𝐝𝐨𝐦 𝐍𝐮𝐦𝐛𝐞𝐫: **${randomNumber}**`);
  },
};
