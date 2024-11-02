import {
  EmbedBuilder
} from 'discord.js';
import {
  getUserData
} from '../database.js';
import {
  updateNetWorth
} from '../utils/updateNetworth.js';

// create an embed card based on user data
async function createUserEmbed(userId, username, userData) {
  try {
    const joinDate = new Date(userData.joined);
    const isToday = joinDate.toDateString() === new Date().toDateString();

    const embed = new EmbedBuilder()
    .setColor('#ed971e')
    .setTitle(`⌞ ⌝  <@${userId.toString()}>' Profile ✨`)
    .setDescription('Building wealth, earning trust, and growing an empire – every journey starts with zero. 💸\n⟡ ₊ .⋆ ✦⋆𓂁﹏  𓂃⋆.˚ ⊹⟡')
    .addFields(
      {
        name: 'ᯓ★𝑪𝒂𝒔𝒉', value: `<:kasiko_coin:1300141236841086977> ${userData.cash}`, inline: true
      },
      {
        name: 'ᯓ★𝐍𝐞𝐭𝐰𝐨𝐫𝐭𝐡', value: `<:kasiko_coin:1300141236841086977> ${userData.networth}`, inline: true
      },
      {
        name: 'ᯓ★𝐂𝐚𝐫𝐬', value: `${userData.cars.length}`, inline: true
      },
      {
        name: 'ᯓ★𝐇𝐨𝐮𝐬𝐞𝐬', value: `${userData.houses.length}`, inline: true
      },
      {
        name: 'ᯓ★Daily Reward', value: userData.dailyReward !== null ? userData.dailyReward: 'Not claimed', inline: true
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
      text: 'Kasiko', iconURL: 'https://cdn.discordapp.com/avatars/1300081477358452756/cbafd10eba2293768dd9c4c0c7d0623f.png'
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