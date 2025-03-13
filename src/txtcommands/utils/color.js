import {
  EmbedBuilder,
  AttachmentBuilder
} from "discord.js";
import { createCanvas } from "@napi-rs/canvas";

export default {
  name: "color",
  description: "Generates a random hex color code and displays it in an embed with a thumbnail.",
  aliases: ["randomcolor", "hexcolor"],
  cooldown: 10000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      // Generate a random hex color code
      const randomColor = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;

      // Create a canvas for the thumbnail
      const canvasSize = 150; // Size of the thumbnail image
      const canvas = createCanvas(canvasSize, canvasSize);
      const ctx = canvas.getContext("2d");

      // Fill the canvas with the random color
      ctx.fillStyle = randomColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const imageBuffer = canvas.toBuffer("image/png");

      const attachment = new AttachmentBuilder(imageBuffer, { name: "color.png" });

      const embed = new EmbedBuilder()
        .setTitle("🎨 Random Color Generated")
        .setDescription(`**Color Code:** \`${randomColor}\``)
        .setColor(randomColor)
        .setThumbnail("attachment://color.png");

      await message.reply({
        embeds: [embed],
        files: [attachment]
      });
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
    }
  },
};