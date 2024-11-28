import {
  getUserData,
  updateUser
} from '../database.js';

/* export async function updateExpPoints(content, user, channel) {
  try {
    const userData = await getUserData(user.id);
    if (!userData) return
    userData.exp += 10;
    if (content.includes("kas")) userData.exp += 10;

    let threshold = 100;
    let lvl = Math.floor(Math.sqrt(userData.exp / threshold)) || 0;
    let lvlUpReward = 10;
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
*/

import { createCanvas } from '@napi-rs/canvas'; // import the necessary functions
import { AttachmentBuilder } from 'discord.js'; // Import AttachmentBuilder from discord.js

// Function to generate the level-up image
async function generateLevelUpImage(user, lvlUpReward, lvl, expRequiredNextLvl) {
  // Create canvas and set its dimensions
  const canvas = createCanvas(700, 350);
  const ctx = canvas.getContext('2d');

  // Set background color
  ctx.fillStyle = '#2f3136';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set text styles
  ctx.fillStyle = 'white';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text on the canvas
  ctx.fillText(`🎉 **${user.username}** has leveled up! 🎉`, canvas.width / 2, 50);
  ctx.fillText(`💰 You've received **${lvlUpReward}** 𝑪𝒂𝒔𝒉 as a reward!`, canvas.width / 2, 120);
  ctx.fillText(`🏆 **New Level:** ${lvl}`, canvas.width / 2, 190);

  // Include the experience required for next level
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`🌟 Experience required for next level: ${expRequiredNextLvl}`, canvas.width / 2, 260);

  // Create the attachment from the canvas
  const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'level-up-image.png' });
  return attachment;
}

export async function updateExpPoints(content, user, channel) {
  try {
    const userData = await getUserData(user.id);
    if (!userData) return;
    
    userData.exp += 10;
    if (content.includes("kas")) userData.exp += 10;

    let threshold = 100;
    let lvl = Math.floor(Math.sqrt(userData.exp / threshold)) || 0;
    let lvlUpReward = 10;
    let lvlUp = false;

    if (!(lvl === userData.level)) {
      userData.level = lvl;
      lvlUpReward = 1500 + userData.level * 1000;
      userData.cash += lvlUpReward;
      lvlUp = true;
    }

    // Calculate experience required for the next level
    const expRequiredNextLvl = (Math.pow(lvl + 1, 2) - Math.pow(lvl, 2)) * threshold;

    await updateUser(user.id, userData);

    if (!lvlUp) {
      // Generate the image for the level-up
     // const attachment = await generateLevelUpImage(user, lvlUpReward, lvl, expRequiredNextLvl);
      const attachment = await generateLevelUpImage(user, 1000, 2, 1000);

      // Send the image as an attachment
      return channel.send({ files: [attachment] });
    }

    return;
  } catch (e) {
    console.error(e);
  }
}