import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "badge",
  description: "Add or remove a badge from a user's profile.",
  aliases: [],
  args: "<add|remove> [@user] <badgeID>",
  example: ["badge add @user 123",
    "badge remove 123"],
  emoji: "🏷️",
  cooldown: 10000,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    // Get the operation (should be "add" or "remove")
    const operation = args[1];
    if (!operation || !["add", "remove"].includes(operation.toLowerCase())) {
      return message.channel.send("❌ Please specify a valid operation: `add` or `remove`.");
    }

    if (args[3]) {
      args[3] = args[3].replace("<", "");
      args[3] = args[3].replace(">", "");
    }

    // Determine if a user is mentioned.
    // If a valid user is mentioned, use that user's ID and shift the badgeID index.
    let targetUser = message.mentions.users.first();
    let badgeId;
    if (targetUser) {
      badgeId = "<" + args[3] + ">";
    } else {
      targetUser = message.author;
      badgeId = "<" + args[2] + ">";
    }

    if (!badgeId) {
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
    if (operation.toLowerCase() === "add") {
      // Check if the user already has the badge.
      if (userData.badges.includes(badgeId)) {
        return message.channel.send("❌ The user already has this badge.");
      }
      userData.badges.push(badgeId);
    } else if (operation.toLowerCase() === "remove") {
      // Check if the badge exists.
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
      const embed = new EmbedBuilder()
      .setColor("#ffcc00")
      .setDescription(
        operation.toLowerCase() === "add"
        ? `🏷️ **${message.author.username}** added badge **${badgeId}** to <@${targetUser.id}>!`: `🏷️ **${message.author.username}** removed badge **${badgeId}** from <@${targetUser.id}>!`
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