import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "avatar",
  description: "Displays detailed information about a user's avatar.",
  aliases: ["avatarinfo",
    "avinfo"],
  cooldown: 8000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    const target = message.mentions.users.first() || message.author;

    const avatarURL = target.displayAvatarURL({
      format: "png", dynamic: true, size: 1024
    });

    const embed = new EmbedBuilder()
    .setTitle(`${target.tag}'s Avatar Information`)
    .setColor(0x00aaff)
    .setThumbnail(avatarURL)
    .addFields(
      {
        name: "Username", value: target.username, inline: true
      },
      {
        name: "Tag", value: `#${target.discriminator}`, inline: true
      },
      {
        name: "Avatar URL", value: `[Click here](${avatarURL})`, inline: true
      },
      {
        name: "Avatar Type", value: avatarURL.endsWith(".gif") ? "GIF": "PNG", inline: true
      },
      {
        name: "Avatar Size", value: "1024px (max size)", inline: true
      }
    )
    .setTimestamp();

    await message.reply({
      embeds: [embed]
    });
  },
};