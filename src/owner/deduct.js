import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import OwnerModel from "../../models/Owner.js";
import {
  client
} from "../../bot.js";

export default {
  name: "deduct",
  description: "Deduct any amount of cash from a user's account (Owner Only), or from yourself if no user is specified.",
  aliases: [],
  args: "<amount> [userId]",
  example: [
    "deduct 5000",
    "deduct 5000 123456789012345678"
  ],
  emoji: "💸",
  cooldown: 10000,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    // Parse the amount to deduct
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.channel.send("❌ Please enter a valid amount to deduct.");
    }

    // Check if the author is an owner
    let ownerDoc = await OwnerModel.findOne({
      ownerId: message.author.id
    });

    if (!ownerDoc && message.author.id !== "1318158188822138972") {
      return message.channel.send("❌ You are not an owner.")
        .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Daily‐deduction tracking (limit: 7,500,000 per day)
    const now = new Date().toISOString().split("T")[0];
    const lastDate = ownerDoc?.dailyDeducted?.date;
    let todayDeducted = ownerDoc?.dailyDeducted?.amount || 0;

    if (lastDate === now && todayDeducted + amount > 7500000 && message.author.id !== "1318158188822138972") {
      return message.channel.send(
        `❌ You can only deduct **${(7500000 - todayDeducted) || 0}** more today! 💔`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (lastDate !== now) {
      todayDeducted = 0;
    }

    // Prepare the logs channel and base embed
    const logsChannel = client.channels?.cache?.get("1361928841307623506");
    const embedTransaction = new EmbedBuilder()
      .setTitle("𝗡𝗘𝗪 𝗗𝗘𝗗𝗨𝗖𝗧𝗜𝗢𝗡")
      .setColor("Random");

    // Determine if a target user was mentioned or provided
    const target = message.mentions.users.first();
    const hasExplicitId = args[2] && !target;
    const recipientId = target
      ? target.id
      : hasExplicitId && args[2].length >= 18
        ? args[2]
        : message.author.id;

    // Fetch the Discord user object (if they passed an ID)
    let discordUser;
    try {
      if (!target && hasExplicitId) {
        discordUser = await client.users.fetch(recipientId);
      } else if (target) {
        discordUser = target;
      } else {
        // No mention or ID → operate on author
        discordUser = message.author;
      }
    } catch {
      return message.channel.send("❌ That doesn’t look like a valid user ID.");
    }

    // Fetch the target’s account data
    let userData = await getUserData(recipientId);
    if (!userData) {
      return message.channel.send("❌ Failed to retrieve the target user's account data.");
    }

    // Ensure they have enough cash to deduct
    if (userData.cash < amount) {
      return message.channel.send(
        `❌ <@${recipientId}> only has **${userData.cash.toLocaleString()}** cash.`
      );
    }

    // Perform the deduction
    userData.cash = Math.max(0, userData.cash - amount);
    try {
      await updateUser(recipientId, { cash: userData.cash });

      // Update OwnerModel’s dailyDeducted and totalCashDeducted
      await OwnerModel.findOneAndUpdate(
        { ownerId: message.author.id },
        {
          "dailyDeducted.date": now,
          "dailyDeducted.amount": todayDeducted + amount,
          "totalCashDeducted": (ownerDoc?.totalCashDeducted || 0) + amount
        },
        { new: true }
      );

      // Build the transaction embed
      embedTransaction.setDescription([
        `💸 **From:** ${message.author.tag}`,
        `**To:** ${discordUser.tag}`,
        `**Amount Deducted:** <:kasiko_coin:1300141236841086977> ${amount.toLocaleString()}`
      ].join("\n"));

      // Send to logs channel if available
      if (logsChannel) {
        logsChannel.send({ embeds: [embedTransaction] });
      }

      // Confirmation embed to the channel
      const embed = new EmbedBuilder()
        .setDescription(
          `💸 **${message.author.username}** deducted <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** ` +
          `from <@${recipientId}>'s account!`
        )
        .setColor("#ff6666");
      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return message.channel.send("❌ Something went wrong while processing the deduction.")
        .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};