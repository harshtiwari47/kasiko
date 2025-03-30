import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import OwnerModel from "../../models/Owner.js";

export default {
  name: "reward",
  description: "Claim your daily reward of 75,000 cash (Owner Only)",
  aliases: [],
  args: "",
  example: ["reward"],
  emoji: "💰",
  cooldown: 10000,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    const ownerId = message.author.id;

    // Retrieve owner document from MongoDB
    let ownerDoc = await OwnerModel.findOne({
      ownerId
    });
    if (!ownerDoc) {
      return message.channel.send("❌ You are not an owner.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const now = new Date();
    const lastReward = ownerDoc.lastRewardWithdraw;

    // If the reward has been claimed within the last 24 hours, calculate remaining time
    if (lastReward && (now - new Date(lastReward)) < 24 * 60 * 60 * 1000) {
      const remainingTime = 24 * 60 * 60 * 1000 - (now - new Date(lastReward));
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      return message.channel.send(`❌ You have already claimed your reward. Please wait ${hours}h ${minutes}m before claiming again.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Reward claim allowed
    const rewardAmount = 75000;
    let userData = await getUserData(ownerId);
    if (!userData) {
      return message.channel.send("❌ Failed to retrieve your account data.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Update the user's cash balance
    userData.cash += rewardAmount;
    try {
      await updateUser(ownerId, {
        cash: userData.cash
      });

      // Prepare fields to update in the owner's document
      const updateFields = {
        lastRewardWithdraw: now
      };

      await OwnerModel.findOneAndUpdate({
        ownerId
      }, updateFields, {
        new: true
      });

      const embed = new EmbedBuilder()
      .setDescription(`💰 **${message.author.username}** claimed their daily reward of <:kasiko_coin:1300141236841086977> **${rewardAmount.toLocaleString()}** cash!`)
      .setColor("#00ff00");

      return message.channel.send({
        embeds: [embed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (err) {
      console.error(err);
      return message.channel.send("❌ Something went wrong while processing your reward.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};