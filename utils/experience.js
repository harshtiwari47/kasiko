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

import {
  AttachmentBuilder
} from 'discord.js'; // Import AttachmentBuilder from discord.js

import {
  createCanvas,
  loadImage
} from '@napi-rs/canvas';

function generateLevelUpImage(user, lvlUpReward, lvl, expRequiredNextLvl) {
  const padding = 20;
  const canvas = createCanvas(800 + 2 * padding, 400 + 2 * padding);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#879ad0');
  gradient.addColorStop(0.5, '#2c1861');
  gradient.addColorStop(1, '#001f42');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const contentWidth = canvas.width - 2 * padding;
  const contentHeight = canvas.height - 2 * padding;
  ctx.fillStyle = gradient;
  ctx.fillRect(padding, padding, contentWidth, contentHeight);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 30px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 55px Tahoma';
  ctx.fillText(`🏆 New Level ${lvl}`, canvas.width / 1.6, padding + 100);
  ctx.font = 'italic 34px Tahoma';
  ctx.fillText(`💰 You've received $${lvlUpReward} 𝑪𝒂𝒔𝒉!`, canvas.width / 2.48, padding + 240);
  ctx.font = 'italic 27px Tahoma';
  ctx.fillText(`🌀 Experience required for next level: ${expRequiredNextLvl}`, canvas.width / 2.4, padding + 300);

  ctx.beginPath();
  ctx.arc(canvas.width - padding - 20, canvas.height - padding - 40, 100, 0, 2 * Math.PI);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#879ad0';
  ctx.stroke();

  loadImage('https://www.w3schools.com/w3images/avatar2.png')
  .then((profileImage) => {
    const imageSize = 130;
    ctx.drawImage(profileImage, padding + 40, padding + 40, imageSize, imageSize);
    const buffer = canvas.toBuffer('image/png');

    const attachment = new AttachmentBuilder(buffer, {
      name: 'level-up-image.png'
    });
    return attachment;
  })
  .catch((err) => {
    console.error('Error loading profile image:', err);
  });
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
      if (attachment) {
        channel.send({
          files: [attachment]
        });
      }
    }

    return;
  } catch (e) {
    console.error(e);
  }
}