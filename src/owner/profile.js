import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import { logAssetChange } from "../../utils/auditLogger.js";

export default {
  name: "profile",
  description: "Set banner image or profile color for a user (Management Only).",
  aliases: ["banner", "color"],
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
      return message.channel.send("❌ Usage: `kasow banner @user <image_url>` or `kasow color @user <hex_color>`");
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
      const cleanHex = input.startsWith("#") ? input : `#${input}`;
      await updateUser(target.id, {
        color: cleanHex
      });

      // Send Audit Log
      await logAssetChange({
        client: message.client,
        executor: message.author,
        target,
        assetType: 'profile_color',
        action: 'updated',
        value: cleanHex
      });

      embed.setDescription(`Profile color for **${target.username}** updated to **${cleanHex}**.`)
        .setColor(cleanHex);

      // Handle banner URL
    } else if (input.startsWith("http://") || input.startsWith("https://")) {
      await updateUser(target.id, {
        banner: input
      });

      // Send Audit Log
      await logAssetChange({
        client: message.client,
        executor: message.author,
        target,
        assetType: 'profile_banner',
        action: 'updated',
        value: input
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