import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

// COLOR Command
export default {
  name: "color",
  description: "Generates a random hex color code and displays it in an embed.",
  aliases: ["randomcolor", "hexcolor"],
  cooldown: 8000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    const embed = new EmbedBuilder()
      .setTitle("🎨 Random Color Generated")
      .setDescription(`**Color Code:** \`${randomColor}\``)
      .setColor(randomColor);

    await message.reply({ embeds: [embed] });
  },
};