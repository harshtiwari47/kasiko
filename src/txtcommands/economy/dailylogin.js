import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  handleMessage,
  discordUser
} from '../../../helper.js';

import {
  checkPassValidity
} from "../explore/pass.js";

import UserPet from "../../../models/Pet.js";

export async function dailylogin(context) {
  try {
    const currentTime = Date.now();
    const nextClaim = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const {
      username,
      id: userId,
      avatar,
      name
    } = discordUser(context);

    const userData = await getUserData(userId);

    if (!userData) return;

    if (userData && userData.dailyReward && (currentTime - Number(userData.dailyReward)) < nextClaim) {
      // Calculate remaining time
      const timeLeft = nextClaim - (currentTime - Number(userData.dailyReward));
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return await handleMessage(context,
        `💠  Sorry **${name}**, you have **already claimed** your daily reward for today! 🍹\n\n` +
        `🗯️ ***_Next reward_ in ⏳ ${hours} hours and ${minutes} minutes***. 🎁`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (userData) {
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

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const passInfo = await checkPassValidity(userId);

      let additionalReward;
      if (passInfo.isValid) {
        additionalReward = 0.15 * rewardAmount;
        if (passInfo.passType === "titan") additionalReward = 0.10 * rewardAmount;
        rewardAmount += additionalReward;
      }

      userData.cash = (userData.cash || 0) + rewardAmount;

      // Update the dailyReward timestamp
      userData.dailyReward = currentTime;

      let userPetData = await UserPet.findOne({
        id: userId
      });

      if (!userPetData) {
        userPetData = await new UserPet( {
          id: userId,
        })
      }

      userPetData.food += 2;

      try {
        await userPetData.save();
        // Save the updated user data
        await updateUser(userId, userData);
      } catch (updateErr) {
        await handleMessage(context, `ⓘ **${name}**, an unexpected error occurred while claiming daily reward!\n-# **Error"": ${updateErr}`).catch(console.error);
        return;
      }

      return await handleMessage(context,
        `## <:gift:1350355327018729517>  𝘿𝙖𝙞𝙡𝙮 𝙧𝙚𝙬𝙖𝙧𝙙 𝙘𝙡𝙖𝙞𝙢𝙚𝙙***!***\n` +
        `**${name}** 𝘳𝘦𝘤𝘦𝘪𝘷𝘦𝘥 <:kasiko_coin:1300141236841086977> **\`${rewardAmount}\`**  𝑪𝒂𝒔𝒉` +
        `${passInfo.isValid ? ` **(+ <:kasiko_coin:1300141236841086977>${additionalReward})**`: ""}\n\n` +
        `<:left:1350355384111468576>   🍖 **2** 𝘱𝘦𝘵 𝘧𝘰𝘰𝘥.\n` +
        `<:left:1350355384111468576>  <:orange_fire:1335980766634709084> 𝙎𝙩𝙧𝙚𝙖𝙠  ~ **${userData.rewardStreak}** day(s).\n` +
        `-# ***ⴵ  Next reward can be claimed tomorrow.***`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else {
      return;
    }
  } catch (e) {
    console.error(e);
    return await handleMessage(context, "Something went wrong while **claiming daily login reward**!").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "daily",
  description: "Claim your daily login reward. Pass users receive an additional 0.25x boost to their rewards. Includes a bonus of pet food!",
  aliases: ["dailylogin",
    "dlogin",
    "dr",
    "dl"],
  args: "",
  example: ["daily"],
  related: ["give",
    "cash",
    "profile"],
  emoji: "⏳",
  cooldown: 86400000,
  category: "🏦 Economy",

  // Main function to execute the daily login reward logic
  execute: (args, context) => {
    dailylogin(context);
  }
};