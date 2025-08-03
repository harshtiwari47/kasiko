import {
  AttachmentBuilder
} from 'discord.js';
import {
  createCanvas,
  loadImage
} from '@napi-rs/canvas';
import {
  handleMessage,
  discordUser
} from '../../../helper.js';

export default {
  name: 'pfpmatch',
  description: 'Generates a combined match image of two users\' avatars.',
  aliases: ['pfpm',
    'matchpfp'],
  cooldown: 10000,
  category: '🔧 Utility',

  execute: async (args, message) => {
    try {
      // Determine targets
      const mentions = message.mentions.users;
      let userA,
      userB;
      if (mentions.size === 0) {
        return handleMessage(message, {
          content: '❌ Please mention at least one user to match.'
        });
      } else if (mentions.size === 1) {
        userA = mentions.first();
        userB = message.author;
      } else {
        // pick first two
        [userA,
          userB] = mentions.map(u => u).slice(0, 2);
      }

      // Fetch avatars
      const urlA = userA.displayAvatarURL({
        format: 'png', size: 512, dynamic: false
      });
      const urlB = userB.displayAvatarURL({
        format: 'png', size: 512, dynamic: false
      });
      const [imgA,
        imgB] = await Promise.all([
          loadImage(urlA),
          loadImage(urlB)
        ]);

      // Create canvas
      const size = 512;
      const canvas = createCanvas(size * 2, size);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#2f3136';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw avatars with circular clipping
      const drawSquareImage = (x, y, img) => {
        ctx.drawImage(img, x, y, size, size);
      };

      drawSquareImage(0, 0, imgA);
      drawSquareImage(size, 0, imgB);

      // Convert to buffer and create attachment
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, {
        name: 'pfp-match.png'
      });

      // Send
      await handleMessage(message, {
        content: `<:bot:1359577258959962152> Match: **${userA.tag}** x **${userB.tag}**`,
        files: [attachment]
      });
    } catch (e) {
      console.error('pfpmatch error:', e);
      // Friendly error message
      await handleMessage(message, {
        content: '⚠️ An error occurred while generating the match. Please try again later.'
      });
    }
  }
};