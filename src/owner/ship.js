import fs from 'fs';
import path from 'path';

import {
  EmbedBuilder
} from "discord.js";
import { logShipOverride } from "../../utils/auditLogger.js";

const shipDatabasePath = path.join(process.cwd(), 'database', 'customScores.json');

export default {
  name: "shipcustom",
  description: "Add or remove a custom ship score for a pair of users.",
  aliases: ["ship"],
  args: "<add|remove> [@user1] [@user2] <score>",
  example: [
    "shipcustom add @user1 @user2 75",
    "shipcustom add @user1 75",
    "shipcustom remove @user1 @user2"
  ],
  emoji: "💘",
  cooldown: 0,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    const operation = args[1]?.toLowerCase();
    if (!operation || !["add", "remove"].includes(operation)) {
      return message.channel.send("❌ Please specify a valid operation: `add` or `remove`.");
    }

    const mentionedUsers = message.mentions.users.map(u => u);
    let user1, user2;
    if (mentionedUsers.length >= 2) {
      user1 = mentionedUsers[0];
      user2 = mentionedUsers[1];
    } else if (mentionedUsers.length === 1) {
      user1 = message.author;
      user2 = mentionedUsers[0];
    } else {
      return message.channel.send("❌ Please mention at least one user.");
    }

    const key = [user1.id, user2.id].sort().join("-");

    // Load the current custom scores
    let customScores = {};
    try {
      if (fs.existsSync(shipDatabasePath)) {
        const data = fs.readFileSync(shipDatabasePath, "utf8");
        customScores = JSON.parse(data);
      }
    } catch (error) {
      customScores = {};
    }

    if (operation === "add") {
      let scoreArg = mentionedUsers.length >= 2 ? args[4] : args[3];
      if (!scoreArg) {
        return message.channel.send("❌ Please provide a custom ship score.");
      }
      const score = parseInt(scoreArg, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        return message.channel.send("❌ Please provide a valid score between 0 and 100.");
      }
      
      customScores[key] = score;
      fs.writeFileSync(shipDatabasePath, JSON.stringify(customScores, null, 2));

      // Send Audit Log
      await logShipOverride({
        client: message.client,
        executor: message.author,
        user1: user1.id,
        user2: user2.id,
        score
      });

      const embed = new EmbedBuilder()
        .setColor("#ffcc00")
        .setDescription(
          `💘 **${message.author.username}** set a custom ship score of **${score}%** for <@${user1.id}> and <@${user2.id}>!`
        );
      return message.channel.send({
        embeds: [embed]
      });
    } else if (operation === "remove") {
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