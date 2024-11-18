import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export default  {
  name: "guild",
  description: "View the main bot server (guild) link.",
  aliases: ["server", "mainserver"],
  cooldown: 4000,
  category: "Utility",

  execute: async (args, message) => {
    await message.reply("✷ 𝑱𝑶𝑰𝑵 𝑶𝑼𝑹 𝑴𝑨𝑰𝑵 𝑩𝑶𝑻 𝑺𝑬𝑹𝑽𝑬𝑹 \n [Click Here](https://discord.gg/mainserverlink)");
  },
};