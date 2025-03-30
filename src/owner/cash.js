import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import OwnerModel from "../../models/Owner.js";


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

    let ownerDoc = await OwnerModel.findOne({
      ownerId: message.author.id
    });

    if (!ownerDoc && message.author.id !== "1318158188822138972") {
      return message.channel.send("❌ You are not an owner.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const now = new Date().toISOString().split('T')[0];
    const lastDate = ownerDoc?.dailyWithdrawn?.date;
    let todayWithdrawn = (ownerDoc?.dailyWithdrawn?.amount || 0);


    // If the reward has been claimed within the last 24 hours, calculate remaining time
    if (lastDate === now && (todayWithdrawn + amount > 7500000)) {
      return message.channel.send(`❌ You can only withdraw **${(7500000 - todayWithdrawn) || 0}** today! 🏄🏻`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else {
      todayWithdrawn = 0;
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

        await OwnerModel.findOneAndUpdate({
          ownerId: message.author.id
        }, {
          "dailyWithdrawn.date": now,
          "dailyWithdrawn.amount": todayWithdrawn + amount,
          "dailyWithdrawn.totalCashWithdrawn": (ownerDoc?.totalCashWithdrawn || 0) + amount
        }, {
          new: true
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

        await OwnerModel.findOneAndUpdate({
          ownerId: message.author.id
        }, {
          "dailyWithdrawn.date": now,
          "dailyWithdrawn.amount": todayWithdrawn + amount,
          "dailyWithdrawn.totalCashWithdrawn": (ownerDoc?.totalCashWithdrawn || 0) + amount
        }, {
          new: true
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