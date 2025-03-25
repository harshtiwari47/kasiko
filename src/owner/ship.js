import fs from 'fs';
import path from 'path';

import {
  EmbedBuilder
} from "discord.js";

const shipDatabasePath = path.join(process.cwd(), 'database', 'customScores.json');

export default {
  name: "shipcustom",
  description: "Add or remove a custom ship score for a pair of users.",
  aliases: [],
  args: "<add|remove> [@user1] [@user2] <score>",
  example: [
    "shipcustom add @user1 @user2 75",
    "shipcustom add @user1 75  // (uses message author & mentioned user)",
    "shipcustom remove @user1 @user2"
  ],
  emoji: "💘",
  cooldown: 0,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {

    const operation = args[1];
    if (!operation || !["add", "remove"].includes(operation.toLowerCase())) {
      return message.channel.send("❌ Please specify a valid operation: `add` or `remove`.");
    }

    // Determine the target users.
    // If two users are mentioned, use those; if only one is mentioned, ship message author with that user.
    const mentionedUsers = message.mentions.users.map(u => u);
    let user1,
    user2;
    if (mentionedUsers.length >= 2) {
      user1 = mentionedUsers[0];
      user2 = mentionedUsers[1];
    } else if (mentionedUsers.length === 1) {
      user1 = message.author;
      user2 = mentionedUsers[0];
    } else {
      return message.channel.send("❌ Please mention at least one user.");
    }

    // Build a sorted key (order doesn't matter)
    const key = [user1.id,
      user2.id].sort().join("-");

    // Load the current custom scores from customScores.json (or initialize an empty object)
    let customScores = {};
    try {
      const data = fs.readFileSync(shipDatabasePath, "utf8");
      customScores = JSON.parse(data);
    } catch (error) {
      customScores = {};
    }

    // Process the operation.
    if (operation.toLowerCase() === "add") {
      // Determine the index for the score argument.
      // If two users are mentioned, the score should be at args[4] (command, subcommand, mention, mention, score).
      // If only one user is mentioned, then at args[3] (command, subcommand, mention, score).
      let scoreArg = mentionedUsers.length >= 2 ? args[4]: args[3];
      if (!scoreArg) {
        return message.channel.send("❌ Please provide a custom ship score.");
      }
      const score = parseInt(scoreArg, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        return message.channel.send("❌ Please provide a valid score between 0 and 100.");
      }
      
      customScores[key] = score;
      fs.writeFileSync(shipDatabasePath, JSON.stringify(customScores, null, 2));
      const embed = new EmbedBuilder()
      .setColor("#ffcc00")
      .setDescription(
        `💘 **${message.author.username}** set a custom ship score of **${score}%** for <@${user1.id}> and <@${user2.id}>!`
      );
      return message.channel.send({
        embeds: [embed]
      });
    } else if (operation.toLowerCase() === "remove") {
      if (!customScores.hasOwnProperty(key)) {
        return message.channel.send("❌ No custom ship score found for these users.");
      }
      delete customScores[key];
      fs.writeFileSync(shipDatabasePath, JSON.stringify(customScores, null, 2));
      const embed = new EmbedBuilder()
      .setColor("#ffcc00")
      .setDescription(
        `💘 **${message.author.username}** removed the custom ship score for <@${user1.id}> and <@${user2.id}>!`
      );
      return message.channel.send({
        embeds: [embed]
      });
    }
  }
};