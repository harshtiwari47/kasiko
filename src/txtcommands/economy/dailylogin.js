import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  handleMessage,
  discordUser
} from '../../../helper.js';

import {
  ContainerBuilder,
  MessageFlags
} from 'discord.js';

import {
  checkPassValidity
} from "../explore/pass.js";

import {
  increaseTask
} from "./task.js";

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

    if (!userData) {
      return await handleMessage(context, `You haven't accepted our terms and conditions! Type \`kas help\` to create an account.`);
    }

    if (userData.dailyReward && (currentTime - Number(userData.dailyReward)) < nextClaim) {
      // Calculate remaining time
      const timeLeft = nextClaim - (currentTime - Number(userData.dailyReward));
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

      let timeStr = "";
      if (hours > 0) timeStr += `${hours} hour${hours !== 1 ? 's' : ''}`;
      if (hours > 0 && (minutes > 0 || seconds > 0)) timeStr += " ";
      if (minutes > 0) timeStr += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      if (minutes > 0 && seconds > 0) timeStr += " ";
      if (seconds > 0) timeStr += `${seconds} second${seconds !== 1 ? 's' : ''}`;

      const container = new ContainerBuilder()
        .addTextDisplayComponents(td =>
          td.setContent(`💠  Sorry **${name}**, you have **already claimed** your daily reward for today! 🍹`)
        )
        .addTextDisplayComponents(td =>
          td.setContent(`🗯️ ***_Next reward_ in <:kasiko_stopwatch:1355056680387481620> ${timeStr}***. <:gift:1350355327018729517>`)
        );

      return await handleMessage(context, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // Calculate the last claim date
    const lastClaimDate = userData.dailyReward ? Number(userData.dailyReward) : 0;

    // Increment streak if the last claim was yesterday, otherwise reset
    if (currentTime - lastClaimDate < 2 * nextClaim && currentTime - lastClaimDate >= nextClaim) {
      userData.rewardStreak = (userData.rewardStreak || 0) + 1;
    } else if (currentTime - lastClaimDate >= 2 * nextClaim) {
      userData.rewardStreak = 1;
    } else if (!userData.rewardStreak) {
      userData.rewardStreak = 1;
    }

    // Calculate reward amount
    let rewardAmount = 2550 + userData.rewardStreak * 300;

    // Parallel fetch pass info and pet data
    const [passInfo, existingPet] = await Promise.all([
      checkPassValidity(userId),
      UserPet.findOne({ id: userId })
    ]);

    let additionalReward = 0;
    if (passInfo && passInfo.isValid) {
      additionalReward = passInfo.passType === "titan" ? Math.floor(0.10 * rewardAmount) : Math.floor(0.15 * rewardAmount);
      rewardAmount += additionalReward;
    }

    userData.cash = (userData.cash || 0) + rewardAmount;
    userData.dailyReward = currentTime;

    let userPetData = existingPet;
    if (!userPetData) {
      userPetData = new UserPet({ id: userId, food: 2 });
    } else {
      userPetData.food = (userPetData.food || 0) + 2;
    }

    try {
      // Parallel writes for maximum performance
      await Promise.all([
        userPetData.save(),
        increaseTask(userId, "daily"),
        updateUser(userId, userData)
      ]);
    } catch (updateErr) {
      await handleMessage(context, `ⓘ **${name}**, an unexpected error occurred while claiming daily reward!\n-# **Error**: ${updateErr.message || updateErr}`).catch(console.error);
      return;
    }

    return await handleMessage(context,
      `## <:gift:1350355327018729517>  𝘿𝙖𝙞𝙡𝙮 𝙧𝙚𝙬𝙖𝙧𝙙 𝙘𝙡𝙖𝙞𝙢𝙚𝙙***!***\n` +
      `**${name}** 𝘳𝘦𝘤𝘦𝘪𝘷𝘦𝘥 <:kasiko_coin:1300141236841086977> **\`${rewardAmount.toLocaleString()}\`**  𝑪𝒂𝒔𝒉` +
      `${passInfo.isValid ? ` **(+ <:kasiko_coin:1300141236841086977>${additionalReward.toLocaleString()})**` : ""}\n\n` +
      `<:left:1350355384111468576>   <:pet_food:1385884583077351464> **2** 𝘱𝘦𝘵 𝘧𝘰𝘰𝘥.\n` +
      `<:left:1350355384111468576>  <:orange_fire:1335980766634709084> 𝙎𝙩𝙧𝙚𝙖𝙠  ~ **${userData.rewardStreak}** day(s).\n` +
      `-# ***ⴵ  Next reward can be claimed tomorrow.***`
    ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } catch (e) {
    console.error('Error in dailylogin:', e);
    return await handleMessage(context, "Something went wrong while **claiming daily login reward**!").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "daily",
  description: "Claim your daily login reward. Pass users receive an additional 0.25x boost to their rewards. Includes a bonus of pet food!",
  aliases: ["dailylogin", "dlogin", "dr", "dl"],
  args: "",
  example: ["daily"],
  related: ["give", "cash", "profile"],
  emoji: "<:gift:1350355327018729517>",
  cooldown: 86400000,
  cooldownMessage(ttl, name) {
    const hours = Math.floor(ttl / 3600);
    const minutes = Math.floor((ttl % 3600) / 60);
    const seconds = ttl % 60;

    let timeStr = "";
    if (hours > 0) timeStr += `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (hours > 0 && (minutes > 0 || seconds > 0)) timeStr += " ";
    if (minutes > 0) timeStr += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (minutes > 0 && seconds > 0) timeStr += " ";
    if (seconds > 0) timeStr += `${seconds} second${seconds !== 1 ? 's' : ''}`;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(td =>
        td.setContent(`💠  Sorry **${name}**, you have **already claimed** your daily reward for today! 🍹`)
      )
      .addTextDisplayComponents(td =>
        td.setContent(`🗯️ ***_Next reward_ in <:kasiko_stopwatch:1355056680387481620> ${timeStr}***. <:gift:1350355327018729517>`)
      );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  },
  category: "🏦 Economy",

  // Main function to execute the daily login reward logic
  execute: (args, context) => {
    return dailylogin(context);
  }
};