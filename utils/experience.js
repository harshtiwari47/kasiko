import {
  getUserData,
  updateUser
} from '../database.js';

import {
  AttachmentBuilder
} from 'discord.js'; // Import AttachmentBuilder from discord.js

import {
  createCanvas,
  loadImage
} from '@napi-rs/canvas';

const crown = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.3486 5.17917L16.1111 8.31806L12.9147 3.93556C12.8285 3.7672 12.6974 3.62592 12.536 3.52726C12.3746 3.42861 12.1892 3.3764 12 3.3764C11.8108 3.3764 11.6254 3.42861 11.464 3.52726C11.3026 3.62592 11.1715 3.7672 11.0853 3.93556L7.88889 8.31806L4.65139 5.17917C4.53548 4.99163 4.36233 4.84633 4.15752 4.76473C3.95271 4.68313 3.72709 4.66955 3.51397 4.726C3.30085 4.78245 3.11153 4.90593 2.97397 5.07821C2.8364 5.2505 2.75788 5.46245 2.75 5.68278V15.4847C2.75 16.8476 3.29142 18.1547 4.25515 19.1185C5.21887 20.0822 6.52597 20.6236 7.88889 20.6236H16.1111C17.474 20.6236 18.7811 20.0822 19.7449 19.1185C20.7086 18.1547 21.25 16.8476 21.25 15.4847V5.68278C21.2421 5.46245 21.1636 5.2505 21.026 5.07821C20.8885 4.90593 20.6991 4.78245 20.486 4.726C20.2729 4.66955 20.0473 4.68313 19.8425 4.76473C19.6377 4.84633 19.4645 4.99163 19.3486 5.17917Z" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 16.5125H16" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

async function generateLevelUpImage(user, lvlUpReward, lvl, expRequiredNextLvl, pfp) {
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
  ctx.fillText(`⁠ New Level ${lvl}⁠`, canvas.width / 1.6, padding + 100);
  ctx.font = 'italic 34px Tahoma';
  ctx.fillText(`✓⁠ You've received $${lvlUpReward} cash!`, canvas.width / 2.48, padding + 240);
  ctx.font = 'italic 27px Tahoma';
  ctx.fillText(`✓⁠ Experience required for next level: ${expRequiredNextLvl}`, canvas.width / 2.4, padding + 300);

  ctx.beginPath();
  ctx.arc(canvas.width - padding - 20, canvas.height - padding - 40, 100, 0, 2 * Math.PI);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#879ad0';
  ctx.stroke();

  try {
    const svgImage = await loadImage('data:image/svg+xml;base64,' + Buffer.from(crown).toString('base64'));
    ctx.drawImage(svgImage, 240, padding + 75, 50, 50);

    const profileImage = await loadImage(pfp);
    const imageSize = 130;
    ctx.drawImage(profileImage, padding + 40, padding + 40, imageSize, imageSize);
    const buffer = canvas.toBuffer('image/png');

    const attachment = new AttachmentBuilder(buffer, {
      name: 'kasiko-level-up-canvas-image-v2.png'
    });

    return attachment; // This will now return the attachment correctly
  } catch (err) {
    console.error('Error loading profile image:', err);
  }
}

export async function updateExpPoints(content, user, channel, guildId, prefix) {
  try {
    const userData = await getUserData(user.id);
    if (!userData) return;

    userData.exp += 10;
    if (prefix && content.includes(prefix)) userData.exp += 10;

    let threshold = 100;
    let lvl = Math.floor(Math.sqrt(userData.exp / threshold)) || 0;
    let lvlUpReward = 10;
    let lvlUp = false;

    if (lvl > userData.level) {
      userData.level = lvl;
      lvlUpReward = 2000 + userData.level * 1250;
      userData.cash += lvlUpReward;
      lvlUp = true;
    }

    // Calculate experience required for the next level
    const expRequiredNextLvl = (Math.pow(lvl + 1, 2) * threshold) - Number(userData.exp);

    try {
      let updateData = {
        exp: userData.exp,
        level: userData.level
      }

      if (lvlUp) {
        updateData.cash = userData.cash;
      }

      await updateUser(user.id, updateData, guildId);
    } catch (err) {}

    if (lvlUp) {
      const attachment = await generateLevelUpImage(user, lvlUpReward, lvl, expRequiredNextLvl, user.displayAvatarURL({
        dynamic: true
      }));

      // Send the image as an attachment
      if (attachment) {
        await channel.send({
          content: `𓇼 **${user.username}**, congratulations! You've leveled up! 🎉`,
          files: [attachment]
        });
        return;
      }
    }

    return;
  } catch (e) {
    console.error(e);
  }
}