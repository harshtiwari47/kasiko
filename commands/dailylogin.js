import {
  getUserData,
  updateUser
} from '../database.js';

export async function dailylogin(message) {
  try {
    const currentTime = Date.now();
    const nextClaim = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const userData = getUserData(message.author.id);

    if (userData && userData.dailyReward && (currentTime - Number(userData.dailyReward)) < nextClaim) {
      // Calculate remaining time
      const timeLeft = nextClaim - (currentTime - Number(userData.dailyReward));
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return message.channel.send(
        `Sorry **${message.author.username}**, you have **already claimed** your daily reward for today.\n` +
        `You can collect again in ⏳ **${hours} hours and ${minutes} minutes**. 🎁`
      );
    } else {
      // Calculate the last claim date
      const lastClaimDate = userData.dailyReward ? Number(userData.dailyReward) : 0;

      // Increment streak if the last claim was yesterday, otherwise reset
      if (currentTime - lastClaimDate < 2 * nextClaim && currentTime - lastClaimDate >= nextClaim) {
        userData.rewardStreak = (userData.rewardStreak || 0) + 1;
      } else {
        userData.rewardStreak = 1;
      }

      // Calculate reward amount
      let rewardAmount = 1250 + userData.rewardStreak * 400;
      userData.cash = (userData.cash || 0) + rewardAmount;

      // Update the dailyReward timestamp
      userData.dailyReward = currentTime;

      // Save the updated user data
      updateUser(message.author.id, userData);

      return message.channel.send(
        `🎁 **Daily reward claimed!**\n**${message.author.username}** received <:kasiko_coin:1300141236841086977> **${rewardAmount} Cash**.\n` +
        `Your current streak is 🔥 **${userData.rewardStreak}** day(s).\n` +
        `Next reward can be claimed tomorrow.`
      );
    }
  } catch (e) {
    console.error(e);
    return message.channel.send("Something went wrong while **claiming daily login reward**!");
  }
}