import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "avatar",
  description: "Displays detailed information about a user's avatar.",
  aliases: ["avatarinfo",
    "avinfo",
    "av"],
  cooldown: 10000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first() || message.author;

      const avatarURL = target.displayAvatarURL({
        format: "png", dynamic: true, size: 1024
      });

      const embed = new EmbedBuilder()
      .setTitle(`${target.tag}'s Avatar Information`)
      .setColor(0x00aaff)
      .setImage(avatarURL)
      .setDescription(`
        **[Avatar URL](<${avatarURL}>)**
        **Avatar Type:** ${avatarURL.endsWith(".gif") ? "GIF": "PNG"}
        `)

      await message.reply({
        embeds: [embed]
      });
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
    }
  },
};