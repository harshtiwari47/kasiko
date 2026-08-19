import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import { logAssetChange } from "../../utils/auditLogger.js";

export default {
  name: "badge",
  description: "Add or remove a badge from a user's profile.",
  aliases: ["emoji"],
  args: "<add|remove> [@user] <badgeID>",
  example: [
    "badge add @user 123",
    "badge remove 123"
  ],
  emoji: "🏷️",
  cooldown: 10000,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    // Get the operation (should be "add" or "remove")
    const operation = args[1]?.toLowerCase();
    if (!operation || !["add", "remove"].includes(operation)) {
      return message.channel.send("❌ Please specify a valid operation: `add` or `remove`.");
    }

    if (args[3]) {
      args[3] = args[3].replace("<", "").replace(">", "");
    }

    let targetUser = message.mentions.users.first();
    let badgeId;
    if (targetUser) {
      badgeId = "<" + args[3] + ">";
    } else {
      targetUser = message.author;
      badgeId = "<" + args[2] + ">";
    }

    if (!badgeId || badgeId === "<undefined>") {
      return message.channel.send("❌ Please provide a badge ID.");
    }

    // Retrieve the target user's data.
    let userData = await getUserData(targetUser.id);
    if (!userData) {
      return message.channel.send("❌ Failed to retrieve the target user's account data.");
    }

    // Ensure the badges property is an array.
    if (!Array.isArray(userData.badges)) {
      userData.badges = [];
    }

    // Process the operation.
    if (operation === "add") {
      if (userData.badges.includes(badgeId)) {
        return message.channel.send("❌ The user already has this badge.");
      }
      userData.badges.push(badgeId);
    } else if (operation === "remove") {
      if (!userData.badges.includes(badgeId)) {
        return message.channel.send("❌ The user does not have this badge.");
      }
      userData.badges = userData.badges.filter(badge => badge !== badgeId);
    }

    // Update the user data.
    try {
      await updateUser(targetUser.id, {
        badges: userData.badges
      });

      // Send Audit Log
      await logAssetChange({
        client: message.client,
        executor: message.author,
        target: targetUser,
        assetType: 'badge',
        action: operation,
        value: badgeId
      });

      const embed = new EmbedBuilder()
        .setColor("#ffcc00")
        .setDescription(
          operation === "add"
            ? `🏷️ **${message.author.username}** added badge **${badgeId}** to <@${targetUser.id}>!`
            : `🏷️ **${message.author.username}** removed badge **${badgeId}** from <@${targetUser.id}>!`
        );

      return message.channel.send({
        embeds: [embed]
      });
    } catch (err) {
      console.error(err);
      return message.channel.send("❌ Something went wrong while updating the badge information.");
    }
  }
};