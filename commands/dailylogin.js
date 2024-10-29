import {
  getUserData,
  updateUser
} from '../database.js';

export async function dailylogin(id, channel) {
  try {
  const today = new Date().toISOString().split('T')[0];
  const todayinMillis = new Date();
  const guild = await channel.guild.members.fetch(id);
  let userData = getUserData(id);

  // Calculate time remaining until nextRewardAt
  let lastClaimSet = new Date();
  lastClaimSet = lastClaimSet.setDate(lastClaimSet.getDate() - 2);
  const nextRewardAt = new Date(userData.dailyReward || lastClaimSet);
  nextRewardAt.setUTCHours(nextRewardAt.getUTCHours() + 24, nextRewardAt.getUTCMinutes(), nextRewardAt.getUTCSeconds(), nextRewardAt.getUTCMilliseconds()); // Sets to the next day
  const countdownMs = nextRewardAt - todayinMillis;

  // Convert countdownMs to hours, minutes, and seconds
  const hours = Math.floor(countdownMs / (1000 * 60 * 60));
  const minutes = Math.floor((countdownMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countdownMs % (1000 * 60)) / 1000);
  const countdown = `${hours}h ${minutes}m ${seconds}s`;

  // Check if the dailyReward is set and if it was claimed today
  if (userData.dailyReward && userData.dailyReward.split('T')[0] === today) {
    channel.send(`Sorry **@${guild.user.username}**, you have **already claimed** your daily reward for today.\nPlease wait ⏳ **${countdown}** until you can claim again. 🎁`);
  } else {
    // If it's a new claim day, check the streak
    const lastClaimDate = userData.dailyReward ? userData.dailyReward.split('T')[0]: null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Increment streak if the last claim was yesterday, otherwise reset
    if (lastClaimDate === yesterdayStr) {
      userData.rewardStreak = (userData.rewardStreak || 0) + 1;
    } else {
      userData.rewardStreak = 1;
    }
    
    let rewardAmount = 1250 + userData.rewardStreak * 10;
    userData.cash += Number(rewardAmount);

    // Update the dailyReward to today's date
    userData.dailyReward = new Date().toISOString();
    channel.send(`🎁 𝑫𝒂𝒊𝒍𝒚 𝒓𝒆𝒘𝒂𝒓𝒅 𝒄𝒍𝒂𝒊𝒎𝒆𝒅!\n **@${guild.user.username}** received <:kasiko_coin:1300141236841086977>**${rewardAmount}** 𝑪𝒂𝒔𝒉. Your current streak is 🔥 **${userData.rewardStreak}** day(s).\n⁠⁠✷ Next reward can be claimed in: ⏳ ${countdown}\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ `);

    // Save the updated user data
    updateUser(id, userData);
  }
  } catch (e) {
    console.error(e);
    channel.send("Something went wrong while **claiming daily login reward**!");
  }
}