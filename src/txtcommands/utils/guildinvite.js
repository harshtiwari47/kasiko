import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default {
  name: "server",
  description: "View the main bot server (guild) link.",
  aliases: ["guild",
    "mainserver"],
  cooldown: 6000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    await message.reply("✷ 𝑱𝑶𝑰𝑵 𝑶𝑼𝑹 𝑴𝑨𝑰𝑵 𝑩𝑶𝑻 𝑺𝑬𝑹𝑽𝑬𝑹 \n Name: 𝑲𝑨𝑺𝑰𝑲𝑶  ❖ \n♥️ [Click To JOIN](https://discord.gg/DVFwCqUZnc)");
  },
};