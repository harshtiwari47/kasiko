import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import OwnerModel from "../../models/Owner.js";

export default {
  name: "profile",
  description: "Set banner image or profile color for a user (Owner Only).",
  aliases: [],
  args: "<@user> <hex_color | image_url>",
  example: [
    "color @user #ff9900",
    "banner @user https://example.com/banner.png"
  ],
  emoji: "🎨",
  cooldown: 5000,
  category: "🧑🏻‍💻 Owner",

  execute: async (args, message) => {
    const target = message.mentions.users.first();
    const input = args[2];

    if (!target || !input) {
      return message.channel.send("❌ Usage: `profile @user <hex_color | image_url>`");
    }

    // Permission check
    const ownerDoc = await OwnerModel.findOne({
      ownerId: message.author.id
    });
    if (!ownerDoc && message.author.id !== "1318158188822138972") {
      return message.channel.send("❌ You are not an owner.");
    }

    const userData = await getUserData(target.id);
    if (!userData) {
      return message.channel.send("❌ Couldn't find the user's data.");
    }

    const embed = new EmbedBuilder()
    .setTitle("✅ Profile Updated")
    .setColor("Green");

    // Handle color
    if (/^#?[0-9A-Fa-f]{6}$/.test(input)) {
      const cleanHex = input.startsWith("#") ? input: `#${input}`;
      await updateUser(target.id, {
        color: cleanHex
      });

      embed.setDescription(`Profile color for **${target.username}** updated to **${cleanHex}**.`)
      .setColor(cleanHex);

      // Handle banner URL
    } else if (input.startsWith("http://") || input.startsWith("https://")) {
      await updateUser(target.id, {
        banner: input
      });

      embed.setDescription(`Banner for **${target.username}** updated.`)
      .setImage(input);

    } else {
      return message.channel.send("❌ Please provide a valid hex color or image URL.");
    }

    return message.channel.send({
      embeds: [embed]
    });
  }
};