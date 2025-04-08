import {
  createCanvas,
  loadImage
} from '@napi-rs/canvas';
import {
  AttachmentBuilder
} from 'discord.js';

/**
* Creates an aquarium image with three fish rendered over a background.
*
* @param {string} fishUrl1 - External URL for the left fish image.
* @param {string} fishUrl2 - External URL for the center fish image.
* @param {string} fishUrl3 - External URL for the right fish image.
* @param {string} backgroundUrl - External URL for the aquarium background image.
* @returns {Promise<AttachmentBuilder>} - A Discord AttachmentBuilder with the generated image.
*/
export async function createAquariumImage(fishUrl1, fishUrl2, fishUrl3, backgroundUrl) {
  // Canvas dimensions for the background
  const canvasWidth = 1280;
  const canvasHeight = 680;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Load the background and fish images concurrently.
  const [background,
    fish1,
    fish2,
    fish3] = await Promise.all([
      loadImage(backgroundUrl),
      loadImage(fishUrl1),
      loadImage(fishUrl2),
      loadImage(fishUrl3),
    ]);

  // Draw the background image to fill the canvas.
  ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

  // Define the fixed size for each fish image.
  const fishWidth = 380;
  const fishHeight = 380;

  // Calculate the center positions of three equally divided columns.
  const colWidth = canvasWidth / 3.5;
  const leftCenterX = colWidth / 2;
  const centerCenterX = colWidth + colWidth / 2;
  const rightCenterX = 2 * colWidth + colWidth / 2;

  // Calculate the x positions to center the fish images in their columns.
  const leftFishX = (leftCenterX - fishWidth / 2) + 60;
  const centerFishX = (centerCenterX - fishWidth / 2) + 50;
  const rightFishX = (rightCenterX - fishWidth / 2) + 40;

  // Set the y positions:
  // The center fish is placed near the top (with a 50px top margin).
  // The left and right fish are positioned slightly lower near the bottom (with a 50px bottom margin).
  const centerFishY = 50;
  const sideFishY = canvasHeight - fishHeight - 50;


  // Draw the fish images:
  // - Fish 1 (left) at the left column, slightly bottom.
  // - Fish 2 (center) at the center column, near the top.
  // - Fish 3 (right) at the right column, slightly bottom.
  ctx.globalAlpha = 0.78;
  ctx.drawImage(fish1, leftFishX, sideFishY, fishWidth, fishHeight);
  ctx.globalAlpha = 0.78;
  ctx.drawImage(fish2, centerFishX, centerFishY, fishWidth, fishHeight);
  ctx.globalAlpha = 0.78;
  ctx.drawImage(fish3, rightFishX, sideFishY, fishWidth, fishHeight);

  const buffer = canvas.toBuffer('image/png');

  return new AttachmentBuilder(buffer, {
    name: 'aquarium.png'
  });
}