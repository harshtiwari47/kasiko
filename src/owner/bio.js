import { getUserData, updateUser } from "../../database.js";
import { EmbedBuilder } from "discord.js";

export default {
  name: "bio",
  description: "Add or delete a user's profile bio. The bio must be between 10 and 100 characters.",
  aliases: [],
  args: "<action> <userId | mention> [new bio]",
  example: [
    'bio add 123456789012345678 "This is my new bio"',
    "bio delete 123456789012345678"
  ],
  emoji: "📝",
  cooldown: 10000,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    // Ensure action and user are provided.
    if (!args[1] || !args[2]) {
      return message.channel.send("❌ Please provide an action (add/delete) and a user.");
    }

    const action = args[1].toLowerCase();
    // Extract a valid user ID from a mention or raw ID.
    const userId = args[2].replace(/[^0-9]/g, "");
    if (!userId) {
      return message.channel.send("❌ Invalid user specified.");
    }

    let userData = await getUserData(userId);
    if (!userData) {
      return message.channel.send("❌ Could not retrieve the user's data.");
    }

    // Handle adding/updating the bio.
    if (action === "add") {
      const newBio = args.slice(3).join(" ").trim();
      if (!newBio) {
        return message.channel.send("❌ Please provide a bio.");
      }
      if (newBio.length < 10 || newBio.length > 100) {
        return message.channel.send("❌ The bio must be between 10 and 100 characters long.");
      }

      userData.profileBio = newBio;

      try {
        await updateUser(userId, { profileBio: newBio });
        const embed = new EmbedBuilder()
          .setDescription(`📝 Updated bio for <@${userId}>:\n"${newBio}"`)
          .setColor("#ffcc00");

        return message.channel.send({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        return message.channel.send("❌ Something went wrong while updating the bio.");
      }
    } 
    // Handle deleting the bio by setting it to null.
    else if (action === "delete") {
      try {
        await updateUser(userId, { profileBio: null });
        const embed = new EmbedBuilder()
          .setDescription(`📝 Deleted bio for <@${userId}>.`)
          .setColor("#ffcc00");

        return message.channel.send({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        return message.channel.send("❌ Something went wrong while deleting the bio.");
      }
    } 
    else {
      return message.channel.send("❌ Invalid action. Please use `add` or `delete`.");
    }
  }
};