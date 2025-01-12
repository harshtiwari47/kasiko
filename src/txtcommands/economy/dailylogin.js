import {
  getUserData,
  updateUser
} from '../../../database.js';

import UserPet from "../../../models/Pet.js";

export async function dailylogin(message) {
  try {
    const currentTime = Date.now();
    const nextClaim = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const userData = await getUserData(message.author.id);

    if (userData && userData.dailyReward && (currentTime - Number(userData.dailyReward)) < nextClaim) {
      // Calculate remaining time
      const timeLeft = nextClaim - (currentTime - Number(userData.dailyReward));
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return message.channel.send(
        `Sorry **${message.author.username}**, you have **already claimed** your daily reward for today.\n` +
        `-# Next reward in ⏳ **${hours} hours and ${minutes} minutes**. 🎁`
      );
    } else {
      // Calculate the last claim date
      const lastClaimDate = userData.dailyReward ? Number(userData.dailyReward): 0;

      // Increment streak if the last claim was yesterday, otherwise reset
      if (currentTime - lastClaimDate < 2 * nextClaim && currentTime - lastClaimDate >= nextClaim) {
        userData.rewardStreak = (userData.rewardStreak || 0) + 1;
      } else {
        userData.rewardStreak = 1;
      }

      // Calculate reward amount
      let rewardAmount = 2550 + userData.rewardStreak * 300;

      if (userData.family.spouse) {
        let additionalReward = 0.25 * rewardAmount;
        rewardAmount += additionalReward;
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth && userData.pass.type === "premium") {
        let additionalReward = 0.25 * rewardAmount;
        rewardAmount += additionalReward;
      } else if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth) {
        let additionalReward = 0.20 * rewardAmount;
        rewardAmount += additionalReward;
      }

      userData.cash = (userData.cash || 0) + rewardAmount;

      // Update the dailyReward timestamp
      userData.dailyReward = currentTime;

      let userPetData = await UserPet.findOne({
        id: message.author.id
      });

      if (!userPetData) {
        userPetData = await new UserPet( {
          id: message.author.id,
        })
      }
      userPetData.food += 2;

      await userPetData.save();

      // Save the updated user data
      await updateUser(message.author.id, userData);

      return message.channel.send(
        `🎁 **Daily reward claimed!**\n**${message.author.username}** received <:kasiko_coin:1300141236841086977> **${rewardAmount}** Cash & 🍖 **2** pet food.\n` +
        `🔥 Streak ~ **${userData.rewardStreak}** day(s).\n` +
        `⏱️ Next reward can be claimed tomorrow.`
      );
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("Something went wrong while **claiming daily login reward**!");
  }
}

export default {
  name: "daily",
  description: "Claim your daily login reward. Married users can enjoy an additional 0.25 boost to their rewards.",
  aliases: ["dailylogin",
    "dlogin",
    "dr",
    "dl"],
  args: "",
  example: ["daily"],
  related: ["give",
    "cash",
    "profile"],
  cooldown: 86400000,
  category: "🏦 Economy",

  // Main function to execute the daily login reward logic
  execute: (args, message) => {
    dailylogin(message);
  }
};