import User from '../../../models/Hunt.js';
import {
  ContainerBuilder,
  MessageFlags,
  AttachmentBuilder
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import { ITEM_DEFINITIONS } from '../../inventory.js';
import { checkPassValidity } from '../explore/pass.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AnimalsDatabasePath = path.join(__dirname, './animals.json');
const animalsData = JSON.parse(fs.readFileSync(AnimalsDatabasePath, 'utf-8'));

const BattleBgPath = path.join(__dirname, './battle_bg.png');
const BattleThumbnailPath = path.join(__dirname, './battle_thumbnail.png');

// ─── Message helpers ────────────────────────────────────────────────────────

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function sendEditableInitial(context, payload) {
  if (context.isCommand) {
    try {
      if (!context.deferred) await context.deferReply().catch(() => { });
      return await context.editReply(payload);
    } catch (err) {
      console.error('sendEditableInitial error', err);
      return null;
    }
  } else {
    try {
      return await context.channel.send(payload);
    } catch (err) {
      console.error('sendEditableInitial error', err);
      return null;
    }
  }
}

async function editExisting(context, sentMsg, payload) {
  try {
    if (context.isCommand) {
      await context.editReply(payload).catch(() => { });
    } else if (sentMsg && typeof sentMsg.edit === 'function') {
      await sentMsg.edit(payload).catch(() => { });
    }
  } catch (e) { /* ignore */ }
}

// ─── Stat helpers ────────────────────────────────────────────────────────────

function getAnimalBaseStats(animalName) {
  const animal = animalsData.animals.find(a => a.name.toLowerCase() === animalName.toLowerCase());
  if (!animal) return { baseHp: 30, baseAttack: 5 };
  return {
    baseHp: animal.baseHp || 30,
    baseAttack: animal.baseAttack || 5,
    emoji: animal.emoji || '🐾',
    rarity: animal.rarity || 1,
    type: animal.type || 'common'
  };
}

function calculateAnimalStats(animal) {
  const n = typeof animal?.toObject === 'function' ? animal.toObject() : animal;
  const animalName = n?.name || animal?.name || 'Unknown';
  const baseStats = getAnimalBaseStats(animalName);
  const level = n?.level || animal?.level || 1;
  const hp = (baseStats.baseHp || 30) + ((level - 1) * 5);
  const attack = (baseStats.baseAttack || 5) + ((level - 1) * 1);
  return {
    ...n,
    name: animalName,
    level,
    hp: Math.max(hp, n?.hp || animal?.hp || hp),
    attack: Math.max(attack, n?.attack || animal?.attack || attack),
    baseHp: baseStats.baseHp,
    baseAttack: baseStats.baseAttack,
    emoji: baseStats.emoji || n?.emoji || animal?.emoji,
    rarity: baseStats.rarity,
    type: baseStats.type
  };
}

function calculateDamage(attack) {
  const variance = attack * 0.3;
  const min = Math.max(1, Math.floor(attack - variance));
  const max = Math.floor(attack + variance);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Canvas battle result image ──────────────────────────────────────────────

/**
 * Extracts the numeric emoji ID from a Discord custom emoji string.
 * Input:  "<:Bear:1348527811224145940>"  or  "<a:Flame:123456789>"
 * Output: "1348527811224145940"  |  null
 */
function getDiscordEmojiId(rawEmoji) {
  if (!rawEmoji) return null;
  const match = (rawEmoji + '').trim().match(/^<a?:[\w]+:(\d+)>$/);
  return match ? match[1] : null;
}

/**
 * Returns the Discord CDN PNG URL for a given emoji ID.
 */
function discordEmojiUrl(emojiId) {
  return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=64`;
}

/**
 * Draws the animal icon on the canvas.
 * - Tries to load the custom emoji image from Discord CDN (using emojiId).
 * - Falls back to a colored letter badge if the image cannot be loaded.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string|null}  rawEmoji   - raw emoji string from animals.json, e.g. "<:Bear:1348527811224145940>"
 * @param {string}       animalName - display name used for the fallback badge
 * @param {number}       x          - left edge of the icon area
 * @param {number}       y          - top edge of the icon area
 * @param {number}       size       - icon diameter in pixels
 * @param {Map}          imageCache - shared cache: emojiId → Image | 'failed'
 */
async function drawAnimalIcon(ctx, rawEmoji, animalName, x, y, size = 24, imageCache = new Map()) {
  const emojiId = getDiscordEmojiId(rawEmoji);

  if (emojiId) {
    // Try to get from cache first
    let img = imageCache.get(emojiId);

    if (!img) {
      try {
        img = await loadImage(discordEmojiUrl(emojiId));
        imageCache.set(emojiId, img);
      } catch (_) {
        imageCache.set(emojiId, 'failed');
        img = 'failed';
      }
    }

    if (img && img !== 'failed') {
      // Draw as a circle-clipped image for a clean look
      const cx = x + size / 2;
      const cy = y + size / 2;
      const r = size / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
      return;
    }
  }

  // ── Fallback: colored circle with first letter ──────────────────────────
  const letter = (animalName || '?')[0].toUpperCase();
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#ff5722'];
  const color = colors[letter.charCodeAt(0) % colors.length];
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color + '55';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = `bold ${Math.floor(size * 0.55)}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(letter, cx, cy + Math.floor(size * 0.2));
  ctx.textAlign = 'left';
}

// ─── Twemoji helpers (render unicode emoji as images on canvas) ───────────────

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';

/**
 * Converts a unicode emoji character to its Twemoji CDN PNG URL.
 * Strips variation-selector U+FE0F before building the codepoint path.
 */
function emojiToTwemojiUrl(char) {
  const cp = [...char]
    .filter(c => c.codePointAt(0) !== 0xFE0F)
    .map(c => c.codePointAt(0).toString(16))
    .join('-');
  return `${TWEMOJI_BASE}/${cp}.png`;
}

/** Loads a twemoji image, caches the result (null on failure). */
async function loadTwemojiImg(char, cache) {
  if (cache.has(char)) return cache.get(char);
  try {
    const img = await loadImage(emojiToTwemojiUrl(char));
    cache.set(char, img);
    return img;
  } catch (_) {
    cache.set(char, null);
    return null;
  }
}

/**
 * Draws a mixed text+emoji string on the canvas.
 * Emoji are fetched from Twemoji CDN and drawn as inline images.
 * Discord custom emoji strings like <:name:id> are stripped silently.
 * Returns the final cursor X position.
 */
async function drawTextWithEmoji(ctx, text, startX, baselineY, fontSize, color, cache) {
  // Strip Discord custom emoji (they are not Unicode and can't be fetched from Twemoji)
  const cleaned = (text || '').replace(/<a?:[\w]+:\d+>/g, '').replace(/\s+/g, ' ').trim();

  // Regex that matches most Unicode emoji (Emoji_Presentation + Extended_Pictographic)
  const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';

  let cx = startX;
  let lastIndex = 0;

  for (const match of cleaned.matchAll(EMOJI_RE)) {
    // Draw plain text before this emoji
    const before = cleaned.slice(lastIndex, match.index);
    if (before) {
      ctx.fillText(before, cx, baselineY);
      cx += ctx.measureText(before).width;
    }
    // Draw the emoji as a Twemoji image
    const img = await loadTwemojiImg(match[0], cache);
    if (img) {
      ctx.drawImage(img, cx, baselineY - fontSize * 0.82, fontSize * 1.1, fontSize * 1.1);
      cx += fontSize * 1.1 + 2;
    }
    lastIndex = match.index + match[0].length;
  }

  // Draw any remaining plain text
  const rest = cleaned.slice(lastIndex);
  if (rest) {
    ctx.fillText(rest, cx, baselineY);
    cx += ctx.measureText(rest).width;
  }
  return cx;
}

async function generateBattleImage({
  username, opponentUsername,
  userTeam, oppTeam,
  winner,
  userTeamHp, oppTeamHp,
  userTeamAlive, oppTeamAlive,
  cashReward, passBonus, droppedItems
}) {
  // Shared image cache for this render call — avoids duplicate CDN fetches
  const imageCache = new Map();
  const W = 760, H = 420;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Helpers ──────────────────────────────────────────────────────────────
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawHpBar(x, y, w, h, current, max, color) {
    roundRect(x, y, w, h, h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    const ratio = Math.max(0, Math.min(1, current / Math.max(max, 1)));
    if (ratio > 0) {
      roundRect(x, y, Math.max(h, w * ratio), h, h / 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  // ── Background: forest image with dark overlay ───────────────────────────
  const glowColor = winner === 'user' ? '#00c853' : winner === 'opp' ? '#ff3d00' : '#9e9e9e';

  let bgLoaded = false;
  try {
    if (fs.existsSync(BattleBgPath)) {
      const bgImg = await loadImage(BattleBgPath);
      ctx.drawImage(bgImg, 0, 0, W, H);
      // Dark overlay so text remains readable
      ctx.fillStyle = 'rgba(4, 6, 18, 0.74)';
      ctx.fillRect(0, 0, W, H);
      bgLoaded = true;
    }
  } catch (_) { /* fallback */ }

  if (!bgLoaded) {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0c18');
    bg.addColorStop(1, '#0f1122');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
  }

  // Accent glow on top
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 300);
  glow.addColorStop(0, glowColor + '55');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Title ────────────────────────────────────────────────────────────────
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('ANIMAL BATTLE', W / 2, 24);

  // ── Winner banner ─────────────────────────────────────────────────────────
  const bannerText = winner === 'user' ? `${username} wins!`
    : winner === 'opp' ? `${opponentUsername} wins!`
      : `Tie!`;

  const bW = 300, bH = 42, bX = (W - bW) / 2, bY = 34;
  roundRect(bX, bY, bW, bH, 21);
  ctx.fillStyle = glowColor + '22';
  ctx.fill();
  roundRect(bX, bY, bW, bH, 21);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw winner banner text with emoji images (Twemoji CDN)
  {
    const bannerFullText = winner === 'tie' ? '🤝 ' + bannerText : '🏆 ' + bannerText;
    ctx.font = 'bold 17px sans-serif';
    // Estimate total width to center: one emoji + space + plain text
    const emojiWidth = 17 * 1.1 + 2 + ctx.measureText(' ').width;
    const textWidth = ctx.measureText(bannerText).width;
    const totalWidth = emojiWidth + textWidth;
    const bannerStartX = W / 2 - totalWidth / 2;
    await drawTextWithEmoji(ctx, bannerFullText, bannerStartX, bY + 27, 17, glowColor, imageCache);
  }

  // ── Team panels ───────────────────────────────────────────────────────────
  const panelY = 96, panelH = 210, panelW = 330, gap = 20;
  const leftX = gap, rightX = W - panelW - gap;

  async function drawTeam(px, team, teamName, alive, isWinner) {
    // Panel bg
    roundRect(px, panelY, panelW, panelH, 14);
    const pg = ctx.createLinearGradient(px, panelY, px, panelY + panelH);
    pg.addColorStop(0, isWinner ? glowColor + '28' : 'rgba(255,255,255,0.09)');
    pg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = pg;
    ctx.fill();

    // Border
    roundRect(px, panelY, panelW, panelH, 14);
    ctx.strokeStyle = isWinner ? glowColor + 'cc' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = isWinner ? 2 : 1;
    ctx.stroke();

    // Winner glow shadow
    if (isWinner) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14;
      roundRect(px, panelY, panelW, panelH, 14);
      ctx.strokeStyle = glowColor + '66';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Team name
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(teamName, px + 14, panelY + 22);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`${alive} alive`, px + 14, panelY + 36);

    // Animals
    let ay = panelY + 52;
    for (const animal of team.slice(0, 3)) {
      const stats = calculateAnimalStats(animal);
      const maxHp = stats.baseHp + ((stats.level - 1) * 5);
      const curHp = Math.max(0, stats.hp);
      const ratio = curHp / Math.max(maxHp, 1);
      const hpColor = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336';

      // Load emoji image from Discord CDN (or fall back to letter badge)
      await drawAnimalIcon(ctx, stats.emoji, stats.name, px + 10, ay, 24, imageCache);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText(stats.name, px + 42, ay + 8);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.fillText(`Lv.${stats.level}  ·  ATK ${stats.attack}`, px + 42, ay + 21);

      drawHpBar(px + 42, ay + 26, panelW - 60, 5, curHp, maxHp, hpColor);

      ctx.font = '9px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'right';
      ctx.fillText(`${curHp} HP`, px + panelW - 12, ay + 33);
      ctx.textAlign = 'left';

      ay += 50;
    }
  }

  await drawTeam(leftX, userTeam, username, userTeamAlive, winner === 'user');
  await drawTeam(rightX, oppTeam, opponentUsername, oppTeamAlive, winner === 'opp');

  // VS badge
  const vsX = W / 2, vsY = panelY + panelH / 2;
  roundRect(vsX - 20, vsY - 16, 40, 32, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  roundRect(vsX - 20, vsY - 16, 40, 32, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textAlign = 'center';
  ctx.fillText('VS', vsX, vsY + 5);

  // ── Footer strip ──────────────────────────────────────────────────────────
  const fY = panelY + panelH + 16, fH = 54;
  roundRect(gap, fY, W - gap * 2, fH, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();
  roundRect(gap, fY, W - gap * 2, fH, 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '11px sans-serif';

  let line1 = '', line2 = '';

  if (winner !== 'tie') {
    const wName = winner === 'user' ? username : opponentUsername;
    line1 = `💰 ${wName} earned +${cashReward.toLocaleString()} cash`;
    if (passBonus > 0) line1 += `  (+${passBonus.toLocaleString()} pass bonus)`;
  } else {
    line1 = 'No rewards for a tie.';
  }

  if (droppedItems && droppedItems.length > 0) {
    line1 += `   🎁 ${droppedItems.map(d => `${d.item.emoji} ${d.item.name} ×${d.amount}`).join(', ')}`;
  }

  line2 = '✨ All animals are safe.';

  await drawTextWithEmoji(ctx, line1, gap + 14, fY + 20, 11, 'rgba(255,255,255,0.55)', imageCache);
  await drawTextWithEmoji(ctx, line2, gap + 14, fY + 38, 11, 'rgba(255,255,255,0.3)', imageCache);

  return canvas.toBuffer('image/png');
}

// ─── Live-update container builder ───────────────────────────────────────────

function buildBattleContainer({
  username, opponentUsername,
  userTeamDisplay, oppTeamDisplay,
  statusLine = '', logLine = '',
  winnerBlock = '', includeImage = false,
  winnerColor = 0x808080,
  userAvatarUrl = null,
}) {
  // Fallback icon if no avatar is available
  const ICON_SWORDS = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2694.png'; // ⚔️

  const C = new ContainerBuilder()
    .setAccentColor(winnerColor)
    // ── Header: title + challenger avatar (author icon) ───────────────────────
    .addSectionComponents(section =>
      section
        .addTextDisplayComponents(t => t.setContent(`## Animal Battle`))
    )
    .addSeparatorComponents(s => s)
    // ── Challenger team: forest image thumbnail ────────────────────────────────
    .addSectionComponents(section =>
      section
        .addTextDisplayComponents(t => t.setContent(`**${username}**\n${userTeamDisplay}`))
        .setThumbnailAccessory(thumb => {
          thumb.setDescription('Forest Battle').setURL('attachment://battle_thumbnail.png');
          return thumb;
        })
    )
    .addSeparatorComponents(s => s)
    // ── Opponent team: plain text (no thumbnail) ───────────────────────────
    .addTextDisplayComponents(t => t.setContent(`**${opponentUsername}**\n${oppTeamDisplay}`))
    .addSeparatorComponents(s => s);

  if (statusLine && statusLine.trim()) C.addTextDisplayComponents(t => t.setContent(statusLine));
  if (logLine && logLine.trim()) C.addTextDisplayComponents(t => t.setContent(logLine));

  if (winnerBlock && winnerBlock.trim()) {
    // C.addSeparatorComponents(s => s);
    C.addTextDisplayComponents(t => t.setContent(winnerBlock));
  }

  // Embed canvas result image using attachment:// protocol
  if (includeImage) {
    C.addMediaGalleryComponents(
      media => media.addItems(item => item.setURL('attachment://battle-result.png'))
    );
  }

  return C;
}

// ─── Team helpers ─────────────────────────────────────────────────────────────

/**
 * Builds a battle team from the user's saved preferred team list.
 *
 * - Iterates the preferred team entries and matches each against the user's
 *   actual animal collection (case-insensitive, must have totalAnimals > 0).
 * - If some preferred animals are missing (sold/dead), fills remaining slots
 *   with random animals from the rest of the collection.
 * - Returns [] only if the preferredTeam list itself is empty/null,
 *   signalling the caller to fall back to a fully random team.
 */
function buildTeamFromPreferred(preferredTeam, userAnimals, maxSize = 3) {
  if (!preferredTeam || preferredTeam.length === 0) return [];

  const chosen = [];
  const seen = new Set();

  // ── Step 1: pick animals that are still in the collection ─────────────────
  for (const entry of preferredTeam) {
    const name = entry?.name || (typeof entry === 'string' ? entry : null);
    if (!name) continue;
    const found = userAnimals.find(
      a => a.name?.toLowerCase() === name.toLowerCase() && (a.totalAnimals || 1) > 0
    );
    if (found && !seen.has(found.name.toLowerCase())) {
      chosen.push(found);
      seen.add(found.name.toLowerCase());
      if (chosen.length >= maxSize) break;
    }
  }

  // ── Step 2: if slots remain, fill with random animals not already chosen ──
  if (chosen.length < maxSize) {
    const remaining = userAnimals
      .filter(a => (a.totalAnimals || 1) > 0 && !seen.has((a.name || '').toLowerCase()))
      .sort(() => Math.random() - 0.5);
    for (const animal of remaining) {
      if (chosen.length >= maxSize) break;
      chosen.push(animal);
      seen.add((animal.name || '').toLowerCase());
    }
  }

  return chosen;
}

function selectRandomTeam(animals, maxSize = 3) {
  const available = animals.filter(a => (a.totalAnimals || 1) > 0);
  return [...available].sort(() => Math.random() - 0.5).slice(0, Math.min(maxSize, available.length));
}

// ─── Battle engine ────────────────────────────────────────────────────────────

async function runBattleWithProgress(userTeam, oppTeam, onUpdate, delayMs = 900, maxRounds = 20) {
  const userAliveStats = userTeam.map(calculateAnimalStats);
  const oppAliveStats = oppTeam.map(calculateAnimalStats);
  let userAlive = [...userAliveStats];
  let oppAlive = [...oppAliveStats];
  let round = 1;

  while (round <= maxRounds && userAlive.length > 0 && oppAlive.length > 0) {
    // User attacks
    const ua = userAlive[Math.floor(Math.random() * userAlive.length)];
    const od = oppAlive[Math.floor(Math.random() * oppAlive.length)];
    const ud = calculateDamage(ua.attack);
    od.hp -= ud;

    let log = `⚔️ **Round ${round}** — ${ua.emoji} **${ua.name}** → ${od.emoji} **${od.name}** \`-${ud} HP\``;
    if (od.hp <= 0) { log += `\n💀 **${od.name}** defeated!`; oppAlive = oppAlive.filter(a => a !== od); }
    await onUpdate({ round, logLine: log, userAlive: [...userAlive], oppAlive: [...oppAlive] });
    if (oppAlive.length === 0) break;

    // Opponent attacks
    const oa = oppAlive[Math.floor(Math.random() * oppAlive.length)];
    const ud2 = userAlive[Math.floor(Math.random() * userAlive.length)];
    const od2 = calculateDamage(oa.attack);
    ud2.hp -= od2;

    let log2 = `⚔️ **Round ${round}** — ${oa.emoji} **${oa.name}** → ${ud2.emoji} **${ud2.name}** \`-${od2} HP\``;
    if (ud2.hp <= 0) { log2 += `\n💀 **${ud2.name}** defeated!`; userAlive = userAlive.filter(a => a !== ud2); }
    await onUpdate({ round, logLine: log2, userAlive: [...userAlive], oppAlive: [...oppAlive] });

    round++;
    await new Promise(res => setTimeout(res, delayMs));
  }

  let winner;
  if (userAlive.length > 0 && oppAlive.length === 0) winner = 'user';
  else if (oppAlive.length > 0 && userAlive.length === 0) winner = 'opp';
  else {
    const uHp = userAlive.reduce((s, a) => s + Math.max(0, a.hp), 0);
    const oHp = oppAlive.reduce((s, a) => s + Math.max(0, a.hp), 0);
    winner = uHp > oHp ? 'user' : oHp > uHp ? 'opp' : 'tie';
  }

  return {
    winner,
    userTeamHp: userAlive.reduce((s, a) => s + Math.max(0, a.hp), 0),
    oppTeamHp: oppAlive.reduce((s, a) => s + Math.max(0, a.hp), 0),
    userTeamAlive: userAlive.length,
    oppTeamAlive: oppAlive.length
  };
}

// ─── Rewards & death ──────────────────────────────────────────────────────────

function removeAnimals(user, team) {
  team.forEach(animal => {
    const idx = user.hunt.animals.findIndex(a =>
      a.name === animal.name && (a.level === animal.level || !animal.level)
    );
    if (idx !== -1) {
      if (user.hunt.animals[idx].totalAnimals > 1) user.hunt.animals[idx].totalAnimals -= 1;
      else user.hunt.animals.splice(idx, 1);
    }
  });
}

async function grantBattleRewards({ userId, defeatedTeam = [], winningTeam = [], huntUser = null }) {
  const userData = await getUserData(userId);
  if (!userData) return { cashReward: 0, items: [], passBonus: 0 };

  const teamStrength = defeatedTeam.reduce((sum, a) => {
    const s = calculateAnimalStats(a);
    return sum + s.hp + (s.attack * 10);
  }, 0);
  let cashReward = Math.floor(500 + teamStrength * 0.5);

  let passBonus = 0;
  const passInfo = await checkPassValidity(userId);
  if (passInfo.isValid) {
    const mult = (passInfo.passType === 'etheral' || passInfo.passType === 'celestia') ? 0.15 : 0.10;
    passBonus = Math.floor(cashReward * mult);
    cashReward += passBonus;
  }

  const avgRarity = defeatedTeam.length > 0
    ? defeatedTeam.reduce((s, a) => s + (getAnimalBaseStats(a.name).rarity || 1), 0) / defeatedTeam.length
    : 1;

  const dropChance = Math.min(0.2 + (avgRarity - 1) * 0.05, 0.5);
  const droppedItems = [];

  if (Math.random() < dropChance) {
    const itemRarity = avgRarity >= 4 ? 'rare' : avgRarity >= 3 ? 'uncommon' : 'common';
    const pools = { common: ['food', 'milk'], uncommon: ['food', 'premium_food', 'torch', 'lollipop'], rare: ['premium_food', 'torch', 'drink', 'ticket'] };
    const pool = pools[itemRarity] || pools.common;
    const item = ITEM_DEFINITIONS[pool[Math.floor(Math.random() * pool.length)]];
    if (item) {
      const amount = itemRarity === 'rare' ? 1 + Math.floor(Math.random() * 2) : 1;
      await updateUser(userId, { [`inventory.${item.id}`]: (userData.inventory?.[item.id] || 0) + amount });
      droppedItems.push({ item, amount });
    }
  }

  userData.cash += cashReward;

  // ── EXP gain for winning team (50 XP per animal) ──────────────────────
  if (huntUser?.hunt?.animals) {
    const XP_GAIN = 50;
    winningTeam.forEach(animal => {
      const idx = huntUser.hunt.animals.findIndex(a =>
        a.name === animal.name && (a.level === animal.level || !animal.level)
      );
      if (idx !== -1 && huntUser.hunt.animals[idx]) {
        huntUser.hunt.animals[idx].exp = (huntUser.hunt.animals[idx].exp || 0) + XP_GAIN;
        // Level-up loop
        while (huntUser.hunt.animals[idx].exp >= (huntUser.hunt.animals[idx].level || 1) * 25) {
          const neededExp = (huntUser.hunt.animals[idx].level || 1) * 25;
          huntUser.hunt.animals[idx].level = (huntUser.hunt.animals[idx].level || 1) + 1;
          huntUser.hunt.animals[idx].exp -= neededExp;
          const base = getAnimalBaseStats(animal.name);
          huntUser.hunt.animals[idx].hp = base.baseHp + ((huntUser.hunt.animals[idx].level - 1) * 5);
          huntUser.hunt.animals[idx].attack = base.baseAttack + (huntUser.hunt.animals[idx].level - 1);
        }
      }
    });
  }

  await updateUser(userId, { cash: userData.cash });
  return { cashReward, items: droppedItems, passBonus };
}

// ─── Main command ──────────────────────────────────────────────────────────────

export async function battleCommand(context, { opponentId }) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    if (!opponentId || opponentId === userId)
      return handleMessage(context, { content: `<:warning:1366050875243757699> Mention a valid opponent. You can't battle yourself.` });

    let opponentUser;
    try { opponentUser = await context.client?.users?.fetch(opponentId) || null; }
    catch (e) { return handleMessage(context, { content: `<:warning:1366050875243757699>  Opponent not found.` }); }

    if (opponentUser?.bot)
      return handleMessage(context, { content: `<:warning:1366050875243757699> Can't battle bot accounts.` });

    const opponentUsername = opponentUser?.username || 'Unknown';

    // Avatar URLs for the card thumbnails (Discord CDN — always accessible)
    const userAvatarUrl = (context.user || context.author)?.displayAvatarURL({ size: 64, extension: 'png' }) || null;
    const oppAvatarUrl = opponentUser?.displayAvatarURL({ size: 64, extension: 'png' }) || null;

    let user = await User.findOne({ discordId: userId });
    let opp = await User.findOne({ discordId: opponentId });

    if (!user) { user = new User({ discordId: userId, hunt: { animals: [], unlockedLocations: ['Forest'] } }); await user.save(); }
    if (!opp) { opp = new User({ discordId: opponentId, hunt: { animals: [], unlockedLocations: ['Forest'] } }); await opp.save(); }

    const userAnimals = user.hunt?.animals || [];
    const oppAnimals = opp.hunt?.animals || [];

    if (userAnimals.length === 0)
      return handleMessage(context, { content: `<:warning:1366050875243757699> **${username}**, you have no animals. Use \`kas hunt\` first.` });
    if (oppAnimals.length === 0)
      return handleMessage(context, { content: `<:warning:1366050875243757699> **${opponentUsername}** has no animals.` });

    // If team is set, buildTeamFromPreferred uses saved animals + fills slots randomly.
    // Only falls back to selectRandomTeam if user has no team saved at all.
    const userTeam = user.hunt?.team?.length > 0
      ? buildTeamFromPreferred(user.hunt.team, userAnimals, 3)
      : selectRandomTeam(userAnimals, 3);

    const oppTeam = opp.hunt?.team?.length > 0
      ? buildTeamFromPreferred(opp.hunt.team, oppAnimals, 3)
      : selectRandomTeam(oppAnimals, 3);

    if (userTeam.length === 0 || oppTeam.length === 0)
      return handleMessage(context, { content: `<:warning:1366050875243757699> One player has no available animals.` });

    const userTeamDisplay = userTeam.map(a => {
      const s = calculateAnimalStats(a);
      return `${s.emoji} **${a.name}** Lv.${a.level || 1} · ${s.hp} HP · ${s.attack} ATK`;
    }).join('\n');

    const oppTeamDisplay = oppTeam.map(a => {
      const s = calculateAnimalStats(a);
      return `${s.emoji} **${a.name}** Lv.${a.level || 1} · ${s.hp} HP · ${s.attack} ATK`;
    }).join('\n');

    // Build thumbnail attachment for the forest image (used in challenger team section)
    const thumbnailAttachment = fs.existsSync(BattleThumbnailPath)
      ? new AttachmentBuilder(fs.readFileSync(BattleThumbnailPath), { name: 'battle_thumbnail.png' })
      : null;

    // ── Initial card ────────────────────────────────────────────────────────
    const initialContainer = buildBattleContainer({
      username, opponentUsername,
      userTeamDisplay, oppTeamDisplay,
      statusLine: '*Preparing the arena...*',
      logLine: '', winnerBlock: '', includeImage: false, winnerColor: 0x808080,
      userAvatarUrl
    });

    const sentMsg = await sendEditableInitial(context, {
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      ...(thumbnailAttachment ? { files: [thumbnailAttachment] } : {})
    });

    // ── Live battle ─────────────────────────────────────────────────────────
    const battleResult = await runBattleWithProgress(userTeam, oppTeam, async (update) => {
      const uHp = update.userAlive.reduce((s, a) => s + Math.max(0, a.hp), 0);
      const oHp = update.oppAlive.reduce((s, a) => s + Math.max(0, a.hp), 0);
      const statusLine = `${username} **${uHp} HP** (${update.userAlive.length} alive)  ·  ${opponentUsername} **${oHp} HP** (${update.oppAlive.length} alive)`;

      const c = buildBattleContainer({
        username, opponentUsername,
        userTeamDisplay, oppTeamDisplay,
        statusLine, logLine: update.logLine,
        winnerBlock: '', includeImage: false, winnerColor: 0x808080,
        userAvatarUrl
      });
      await editExisting(context, sentMsg, {
        components: [c],
        flags: MessageFlags.IsComponentsV2,
        ...(thumbnailAttachment ? { files: [thumbnailAttachment] } : {})
      });
    }, 900);

    // ── Rewards ─────────────────────────────────────────────────────────────
    // Animals never die from battle — zoo count only changes on sell.
    let cashReward = 0, droppedItems = [], passBonus = 0;

    if (battleResult.winner === 'user') {
      const r = await grantBattleRewards({ userId, defeatedTeam: oppTeam, winningTeam: userTeam, huntUser: user });
      cashReward = r.cashReward; droppedItems = r.items; passBonus = r.passBonus;
    } else if (battleResult.winner === 'opp') {
      const r = await grantBattleRewards({ userId: opponentId, defeatedTeam: userTeam, winningTeam: oppTeam, huntUser: opp });
      cashReward = r.cashReward; droppedItems = r.items; passBonus = r.passBonus;
    }

    await user.save();
    await opp.save();

    // ── Final result text ───────────────────────────────────────────────────
    const winnerColor = battleResult.winner === 'user' ? 0x00c853 : battleResult.winner === 'opp' ? 0xff3d00 : 0x808080;
    const winnerName = battleResult.winner === 'user' ? username : opponentUsername;
    const loserName = battleResult.winner === 'user' ? opponentUsername : username;
    let winnerBlock = battleResult.winner === 'user' ? `<:trophy:1352897371595477084> **${username}** wins!`
      : battleResult.winner === 'opp' ? `<:trophy:1352897371595477084> **${opponentUsername}** wins!`
        : `🤝 Tie!`;

    winnerBlock += `\n${username} **${Math.max(0, battleResult.userTeamHp)} HP** · ${opponentUsername} **${Math.max(0, battleResult.oppTeamHp)} HP**`;

    if (battleResult.winner !== 'tie') {
      winnerBlock += `\n<:moneybag:1365976001179553792> **${winnerName}** earned <:kasiko_coin:1300141236841086977> **${cashReward.toLocaleString()}**`;
      if (passBonus > 0) winnerBlock += ` *(+${passBonus.toLocaleString()} pass bonus)*`;
    }
    if (droppedItems.length > 0)
      winnerBlock += `\n<:reward_box:1366435558011965500>  ${droppedItems.map(d => `${d.item.emoji} **${d.item.name}** ×${d.amount}`).join(', ')}`;
    winnerBlock += `\n<a:custom_exclusive_badge_23:1355149433137926394> All animals are safe.`;

    // ── Generate canvas image ───────────────────────────────────────────────
    let attachment = null;
    try {
      const buf = await generateBattleImage({
        username, opponentUsername,
        userTeam, oppTeam,
        winner: battleResult.winner,
        userTeamHp: battleResult.userTeamHp,
        oppTeamHp: battleResult.oppTeamHp,
        userTeamAlive: battleResult.userTeamAlive,
        oppTeamAlive: battleResult.oppTeamAlive,
        cashReward, passBonus, droppedItems
      });
      attachment = new AttachmentBuilder(buf, { name: 'battle-result.png' });
    } catch (e) {
      console.error('Battle canvas error:', e);
    }

    // ── Edit existing message with final result ─────────────────────────────
    const finalContainer = buildBattleContainer({
      username, opponentUsername,
      userTeamDisplay, oppTeamDisplay,
      statusLine: '', logLine: '',
      winnerBlock,
      includeImage: !!attachment,
      winnerColor,
      userAvatarUrl
    });

    await editExisting(context, sentMsg, {
      components: [finalContainer],
      flags: MessageFlags.IsComponentsV2,
      files: [
        ...(thumbnailAttachment ? [thumbnailAttachment] : []),
        ...(attachment ? [attachment] : [])
      ]
    });

  } catch (error) {
    console.error('Animal battle error:', error);
    return handleMessage(context, { content: `<:alert:1366050815089053808> ${error.message || 'Battle error.'}` });
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default {
  name: 'animalbattle',
  description: 'Battle another player with your animals! Up to 3 animals each.',
  aliases: ['abattle', 'ab', 'animalfight', 'afight'],
  args: '<@opponent>',
  example: ['animalbattle @user', 'abattle @friend', 'ab @opponent'],
  emoji: '⚔️',
  cooldown: 30000,
  category: '🦌 Wildlife',

  execute: async (args, context) => {
    args.shift();
    let opponentId = null;
    const mentionedUser = context.mentions?.users?.first?.();
    if (mentionedUser) {
      opponentId = mentionedUser.id;
    } else if (args[0]) {
      const m = args[0].match(/<@!?(\d+)>/);
      opponentId = m ? m[1] : args[0];
    }
    if (!opponentId)
      return handleMessage(context, { content: `<:warning:1366050875243757699> Mention an opponent.\n**Usage:** \`kas ab @user\`` });
    await battleCommand(context, { opponentId });
  }
};
