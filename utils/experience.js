import {
  getUserData,
  updateUser
} from '../database.js';

export async function updateExpPoints(content, user, channel) {
  try {
    const userData = await getUserData(user.id);
    if (!userData) return
    userData.exp += 10;
    if (content.includes("kas")) userData.exp += 10;

    let threshold = 100;
    let lvl = Math.floor(Math.sqrt(userData.exp / threshold)) || 0;
    let lvlUpReward = 0;
    let lvlUp = false;

    if (!(lvl === userData.level)) {
      userData.level = lvl;
      lvlUpReward = 1500 + userData.level * 1000;
      userData.cash += lvlUpReward;
      lvlUp = true;
    }

    await updateUser(user.id, userData);

    if (lvlUp) {
      return channel.send(`🎉 **${user.username}** has leveled up! 🎉\n\n💰 You've received <:kasiko_coin:1300141236841086977> **${lvlUpReward}** 𝑪𝒂𝒔𝒉 as a reward!\n🏆 **New Level:** ${lvl}`);
    }
    return;
  } catch (e) {
    console.error(e);
  }
}