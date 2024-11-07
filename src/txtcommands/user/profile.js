import {
  EmbedBuilder
} from 'discord.js';
import {
  getUserData
} from '../../../database.js';
import {
  client
} from "../../../bot.js";
import {
  updateNetWorth
} from '../../../utils/updateNetworth.js';

import { Helper } from '../../../helper.js';

// create an embed card based on user data
async function createUserEmbed(userId, username, userData) {
  try {
    const joinDate = new Date(userData.joined);
    const isToday = joinDate.toDateString() === new Date().toDateString();

    const currentTime = Date.now();
    let dailyRewardsDetail = "Not claimed";
    // Check if 24 hours have passed since the last collection
    const nextClaim = 24 * 60 * 60 * 1000; // 12 hours in milliseconds
    if (userData.dailyReward && (currentTime - userData.dailyReward) < nextClaim) {
      dailyRewardsDetail = "Claimed";
    } else {
      dailyRewardsDetail = "Not claimed";
    }

    let partner = {
      "username": "Not married"
    };

    let totalCars = userData.cars.reduce((sum, car) => {
      sum += car.items
      return sum
    }, 0);
    
   let totalStructures = userData.structures.reduce((sum, structure) => {
      sum += structure.items
      return sum
    }, 0);

    if (userData.spouse) {
      partner = await client.users.fetch(userData.spouse) || {
        "username": "Failed to Fetch"
      };
    }

    const embed = new EmbedBuilder()
    .setColor('#ed971e')
    .setTitle(`⌞ ⌝  <@${userId.toString()}>' Profile ✨`)
    .setDescription('Building wealth, earning trust, and growing an empire – every journey starts with zero. 💸\n⟡ ₊ .⋆ ✦⋆𓂁﹏  𓂃⋆.˚ ⊹⟡')
    .addFields(
      {
        name: 'ᯓ★𝑪𝒂𝒔𝒉', value: `<:kasiko_coin:1300141236841086977> ${Number(userData.cash.toFixed(1))}`, inline: true
      },
      {
        name: 'ᯓ★𝐍𝐞𝐭𝐰𝐨𝐫𝐭𝐡', value: `<:kasiko_coin:1300141236841086977> ${userData.networth}`, inline: true
      },
      {
        name: 'ᯓ★𝑺𝒑𝒐𝒖𝒔𝒆 ', value: `**${partner.username}**`, inline: true
      },
      {
        name: 'ᯓ★𝐂𝐚𝐫𝐬', value: `${totalCars}`, inline: true
      },
      {
        name: 'ᯓ★𝐇𝐨𝐮𝐬𝐞𝐬', value: `${totalStructures}`, inline: true
      },
      {
        name: 'ᯓ★Daily Rewards', value: `${dailyRewardsDetail}`, inline: true
      },
      {
        name: 'ᯓ★Charity', value: `<:kasiko_coin:1300141236841086977>${userData.charity}`, inline: true
      },
      {
        name: 'ᯓ★Trust Level', value: `${userData.trust}`, inline: true
      }
    )
    .setTimestamp()
    .setFooter({
      text: 'Kasiko', iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    });

    return embed;
  } catch (error) {
    console.error('Error creating user embed:', error);
  }
}

export async function profile(id, channel) {
  try {
    const user = await channel.guild.members.fetch(id);
    updateNetWorth(id);
    let userData = getUserData(id);

    let userProfile = await createUserEmbed(id, user.username, userData);
    return await channel.send({
      embeds: [userProfile]
    });
  } catch (e) {
    console.log(e)
    return channel.send("Oops! something went wrong while exploring user's profile!");
  }
}

export default {
  name: "profile",
  description: "Displays the user's profile or another user's profile if mentioned.",
  aliases: ["userinfo", "profileinfo", "p"],
  args: "<@user> (optional)",
  example: [
    "profile", // View your own profile
    "profile @user", // View another user's profile
  ],
  related: ["userinfo", "profile", "user", "info"],
  cooldown: 5000, // Cooldown of 5 seconds
  category: "User",

  execute: (args, message) => {
    // If the user mentions someone, display their profile
    if (args[1] && Helper.isUserMention(args[1])) {
      return profile(Helper.extractUserId(args[1]), message.channel);
    }
    // Otherwise, display the message author's profile
    return profile(message.author.id, message.channel);
  }
};