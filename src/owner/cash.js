import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "withdraw",
  description: "Withdraw any amount of cash from your account (Owner Only) or transfer it to another user.",
  aliases: [],
  args: "<amount> [userId]",
  example: ["withdraw 5000",
    "withdraw 5000 123456789012345678"],
  emoji: "🏦",
  cooldown: 10000,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.channel.send("❌ Please enter a valid amount to withdraw.");
    }

    // If a userId is provided in args[2], transfer the amount to that account.
    if (args[2]) {
      const recipientId = args[2];
      let recipientData = await getUserData(recipientId);
      if (!recipientData) {
        return message.channel.send("❌ Failed to retrieve the target user's account data.");
      }

      recipientData.cash += amount;

      try {
        await updateUser(recipientId, {
          cash: recipientData.cash
        });
        const embed = new EmbedBuilder()
        .setDescription(`🏦 **${message.author.username}** transferred <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash to <@${recipientId}>!`)
        .setColor("#ffcc00");

        return message.channel.send({
          embeds: [embed]
        });
      } catch (err) {
        console.error(err);
        return message.channel.send("❌ Something went wrong while processing the transfer.");
      }
    } else {
      // Otherwise, process the withdrawal for the message author.
      let userData = await getUserData(message.author.id);
      if (!userData) {
        return message.channel.send("❌ Failed to retrieve your account data.");
      }

      userData.cash += amount;

      try {
        await updateUser(message.author.id, {
          cash: userData.cash
        });

        const embed = new EmbedBuilder()
        .setDescription(`🏦 **${message.author.username}** withdrew <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash!`)
        .setColor("#ffcc00");

        return message.channel.send({
          embeds: [embed]
        });
      } catch (err) {
        console.error(err);
        return message.channel.send("❌ Something went wrong while processing your withdrawal.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    }
  }
};