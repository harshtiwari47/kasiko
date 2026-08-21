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

// Precompute O(1) animal lookup Map (avoids linear .find() on every battle)
const _animalBaseStatsMap = new Map();
for (const animal of (animalsData.animals || [])) {
  _animalBaseStatsMap.set(animal.name.toLowerCase(), {
    baseHp: animal.baseHp || 30,
    baseAttack: animal.baseAttack || 5,
    emoji: animal.emoji || '🐾',
    rarity: animal.rarity || 1,
    type: animal.type || 'common'
  });
}
const _defaultBaseStats = { baseHp: 30, baseAttack: 5, emoji: '🐾', rarity: 1, type: 'common' };

function getAnimalBaseStats(animalName) {
  return _animalBaseStatsMap.get(animalName.toLowerCase()) || _defaultBaseStats;
}

function calculateAnimalStats(animal) {
  const n = typeof animal?.toObject === 'function' ? animal.toObject() : animal;
  const animalName = n?.name || animal?.name || 'Unknown';
  const baseStats = getAnimalBaseStats(animalName);
  const level = Math.max(1, n?.level || animal?.level || 1);
  const maxHp = (baseStats.baseHp || 30) + ((level - 1) * 8);
  const attack = (baseStats.baseAttack || 5) + ((level - 1) * 2);
  const hp = animal?.currentHp !== undefined ? animal.currentHp : (animal?.hp !== undefined && animal.hp <= maxHp ? animal.hp : maxHp);

  return {
    ...n,
    name: animalName,
    level,
    maxHp,
    hp: Math.max(0, hp),
    attack,
    baseHp: baseStats.baseHp,
    baseAttack: baseStats.baseAttack,
    emoji: baseStats.emoji || n?.emoji || animal?.emoji || '🐾',
    rarity: baseStats.rarity,
    type: baseStats.type
  };
}

function calculateAttackAction(attacker, defender) {
  // Dodge chance (8%)
  if (Math.random() < 0.08) {
    return { damage: 0, isCrit: false, isDodge: true };
  }

  // Slightly boosted base damage so 4 rounds is decisive
  const effectiveAtk = attacker.attack * 1.35;
  const variance = effectiveAtk * 0.25;
  const min = Math.max(2, Math.floor(effectiveAtk - variance));
  const max = Math.floor(effectiveAtk + variance);
  let damage = Math.floor(Math.random() * (max - min + 1)) + min;

  // Critical Hit chance (14%) -> 1.5x damage
  let isCrit = false;
  if (Math.random() < 0.14) {
    isCrit = true;
    damage = Math.floor(damage * 1.5);
  }

  return { damage, isCrit, isDodge: false };
}

// ─── Canvas battle result image ──────────────────────────────────────────────

function getDiscordEmojiId(rawEmoji) {
  if (!rawEmoji) return null;
  const match = (rawEmoji + '').trim().match(/^<a?:[\w]+:(\d+)>$/);
  return match ? match[1] : null;
}

function discordEmojiUrl(emojiId) {
  return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=64`;
}

async function drawAnimalIcon(ctx, rawEmoji, animalName, x, y, size = 24, imageCache = new Map()) {
  const emojiId = getDiscordEmojiId(rawEmoji);

  if (emojiId) {
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

  // Fallback: colored circle with letter
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

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';

function emojiToTwemojiUrl(char) {
  const cp = [...char]
    .filter(c => c.codePointAt(0) !== 0xFE0F)
    .map(c => c.codePointAt(0).toString(16))
    .join('-');
  return `${TWEMOJI_BASE}/${cp}.png`;
}

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

async function drawTextWithEmoji(ctx, text, startX, baselineY, fontSize, color, cache) {
  const cleaned = (text || '').replace(/<a?:[\w]+:\d+>/g, '').replace(/\s+/g, ' ').trim();
  const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';

  let cx = startX;
  let lastIndex = 0;

  for (const match of cleaned.matchAll(EMOJI_RE)) {
    const before = cleaned.slice(lastIndex, match.index);
    if (before) {
      ctx.fillText(before, cx, baselineY);
      cx += ctx.measureText(before).width;
    }
    const img = await loadTwemojiImg(match[0], cache);
    if (img) {
      ctx.drawImage(img, cx, baselineY - fontSize * 0.82, fontSize * 1.1, fontSize * 1.1);
      cx += fontSize * 1.1 + 2;
    }
    lastIndex = match.index + match[0].length;
  }

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
  cashReward, passBonus, droppedItems,
  winStreak = 0
}) {
  const imageCache = new Map();
  const W = 780, H = 420;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

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

  const glowColor = winner === 'user' ? '#00e676' : winner === 'opp' ? '#ff3d00' : '#7986cb';

  // ── Background ────────────────────────────────────────────────────────────
  let bgLoaded = false;
  try {
    if (fs.existsSync(BattleBgPath)) {
      const bgImg = await loadImage(BattleBgPath);
      ctx.drawImage(bgImg, 0, 0, W, H);
      ctx.fillStyle = 'rgba(7, 9, 20, 0.82)';
      ctx.fillRect(0, 0, W, H);
      bgLoaded = true;
    }
  } catch (_) { /* fallback */ }

  if (!bgLoaded) {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0d1e');
    bg.addColorStop(1, '#0e1226');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Accent radial glow at the top
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 280);
  glow.addColorStop(0, glowColor + '40');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Header Title & Winner Banner ──────────────────────────────────────────
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('W I L D L I F E   A R E N A', W / 2, 18);

  const bannerText = winner === 'user' ? `${username} wins!`
    : winner === 'opp' ? `${opponentUsername} wins!`
      : `Battle Tied!`;

  const bW = 340, bH = 38, bX = (W - bW) / 2, bY = 26;
  roundRect(bX, bY, bW, bH, 19);
  ctx.fillStyle = glowColor + '1a';
  ctx.fill();
  roundRect(bX, bY, bW, bH, 19);
  ctx.strokeStyle = glowColor + 'aa';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  {
    const bannerFullText = winner === 'tie' ? '🤝 ' + bannerText : '🏆 ' + bannerText;
    ctx.font = 'bold 15px sans-serif';
    const textWidth = ctx.measureText(bannerText).width;
    const emojiWidth = 15 * 1.1 + 4;
    const totalWidth = emojiWidth + textWidth;
    const bannerStartX = W / 2 - totalWidth / 2;
    await drawTextWithEmoji(ctx, bannerFullText, bannerStartX, bY + 24, 15, glowColor, imageCache);
  }

  // ── Team Cards ────────────────────────────────────────────────────────────
  const panelY = 76, panelH = 250, panelW = 356, gap = 18;
  const leftX = gap, rightX = W - panelW - gap;

  async function drawTeamCard(px, team, teamName, totalHp, aliveCount, isWinner) {
    // Card background
    roundRect(px, panelY, panelW, panelH, 16);
    const pg = ctx.createLinearGradient(px, panelY, px, panelY + panelH);
    pg.addColorStop(0, isWinner ? glowColor + '1f' : 'rgba(255,255,255,0.06)');
    pg.addColorStop(1, 'rgba(10, 13, 26, 0.85)');
    ctx.fillStyle = pg;
    ctx.fill();

    roundRect(px, panelY, panelW, panelH, 16);
    ctx.strokeStyle = isWinner ? glowColor + '99' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = isWinner ? 1.5 : 1;
    ctx.stroke();

    // Card Header: Name + Life Status
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(teamName, px + 14, panelY + 22);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = aliveCount > 0 ? '#81c784' : '#e57373';
    ctx.textAlign = 'right';
    ctx.fillText(`${totalHp} HP · ${aliveCount}/3 alive`, px + panelW - 14, panelY + 22);
    ctx.textAlign = 'left';

    // 3 Animal Rows
    let ay = panelY + 36;
    for (const animal of team.slice(0, 3)) {
      const stats = calculateAnimalStats(animal);
      const maxHp = stats.maxHp;
      const curHp = Math.max(0, stats.hp);
      const ratio = curHp / Math.max(maxHp, 1);
      const hpColor = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336';
      const isAlive = curHp > 0;

      // Sub-card row container
      roundRect(px + 10, ay, panelW - 20, 62, 10);
      ctx.fillStyle = isAlive ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 50, 50, 0.02)';
      ctx.fill();
      roundRect(px + 10, ay, panelW - 20, 62, 10);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Animal icon
      await drawAnimalIcon(ctx, stats.emoji, stats.name, px + 18, ay + 14, 34, imageCache);

      // Animal name & stats
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = isAlive ? '#f0f4f8' : 'rgba(255,255,255,0.35)';
      ctx.fillText(stats.name, px + 62, ay + 26);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText(`Lv.${stats.level} · ${stats.attack} ATK`, px + 62, ay + 44);

      // HP status text & HP bar (right side)
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = isAlive ? '#81c784' : '#e57373';
      ctx.textAlign = 'right';
      ctx.fillText(isAlive ? `${curHp}/${maxHp} HP` : 'FAINTED', px + panelW - 20, ay + 26);
      ctx.textAlign = 'left';

      drawHpBar(px + panelW - 110, ay + 36, 90, 5, curHp, maxHp, isAlive ? hpColor : 'rgba(255,255,255,0.08)');

      ay += 68;
    }
  }

  await drawTeamCard(leftX, userTeam, username, userTeamHp, userTeamAlive, winner === 'user');
  await drawTeamCard(rightX, oppTeam, opponentUsername, oppTeamHp, oppTeamAlive, winner === 'opp');

  // Center VS Badge
  const vsX = W / 2, vsY = panelY + panelH / 2;
  ctx.beginPath();
  ctx.arc(vsX, vsY, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#101428';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();

  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'center';
  ctx.fillText('VS', vsX, vsY + 4);

  // ── Footer Reward Strip ───────────────────────────────────────────────────
  const fY = panelY + panelH + 12, fH = 64;
  roundRect(gap, fY, W - gap * 2, fH, 14);
  ctx.fillStyle = 'rgba(18, 22, 40, 0.85)';
  ctx.fill();
  roundRect(gap, fY, W - gap * 2, fH, 14);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '11px sans-serif';

  let line1 = '';
  if (winner !== 'tie') {
    const wName = winner === 'user' ? username : opponentUsername;
    line1 = `💰 ${wName} earned +${cashReward.toLocaleString()} cash`;
    if (passBonus > 0) line1 += ` (+${passBonus.toLocaleString()} pass bonus)`;
  } else {
    line1 = '🤝 Battle ended in a tie · No rewards granted.';
  }

  if (droppedItems && droppedItems.length > 0) {
    line1 += `  ·  🎁 ${droppedItems.map(d => `${d.item.emoji} ${d.item.name} ×${d.amount}`).join(', ')}`;
  }

  const line2 = '✨ All animals are safe · Full team gained combat EXP!';

  await drawTextWithEmoji(ctx, line1, gap + 16, fY + 25, 11, 'rgba(255,255,255,0.7)', imageCache);
  await drawTextWithEmoji(ctx, line2, gap + 16, fY + 47, 10, 'rgba(255,255,255,0.38)', imageCache);

  return canvas.toBuffer('image/png');
}

// ─── Live-update container builder (during battle) ───────────────────────────

function buildBattleContainer({
  username, opponentUsername,
  userTeamDisplay, oppTeamDisplay,
  statusLine = '', logLine = '',
  winnerColor = 0x5865F2,
}) {
  const C = new ContainerBuilder()
    .setAccentColor(winnerColor)
    .addTextDisplayComponents(t => t.setContent(`### <:claw:1493561807091138631> **Animal Battle Arena**`))
    .addSeparatorComponents(s => s)
    .addSectionComponents(section =>
      section
        .addTextDisplayComponents(t => t.setContent(`**${username}**\n${userTeamDisplay}`))
        .setThumbnailAccessory(thumb => {
          thumb.setDescription('Forest Battle').setURL('attachment://battle_thumbnail.png');
          return thumb;
        })
    )
    .addSeparatorComponents(s => s)
    .addTextDisplayComponents(t => t.setContent(`**${opponentUsername}**\n${oppTeamDisplay}`))
    .addSeparatorComponents(s => s);

  if (statusLine && statusLine.trim()) C.addTextDisplayComponents(t => t.setContent(statusLine));
  if (logLine && logLine.trim()) C.addTextDisplayComponents(t => t.setContent(logLine));

  return C;
}

// ─── Sleek final result container ─────────────────────────────────────────────

function buildFinalBattleContainer({
  titleText,
  lifeStatusText = '',
  streakText = '',
  rewardText = '',
  winnerColor = 0x00c853,
}) {
  const C = new ContainerBuilder()
    .setAccentColor(winnerColor)
    .addTextDisplayComponents(t => t.setContent(`### ${titleText}`))
    .addSeparatorComponents(s => s);

  if (lifeStatusText && lifeStatusText.trim()) {
    C.addTextDisplayComponents(t => t.setContent(lifeStatusText));
  }

  if (streakText && streakText.trim()) {
    C.addTextDisplayComponents(t => t.setContent(streakText));
  }

  if (rewardText && rewardText.trim()) {
    C.addTextDisplayComponents(t => t.setContent(rewardText));
  }

  C.addMediaGalleryComponents(
    media => media.addItems(item => item.setURL('attachment://battle-result.png'))
  );

  return C;
}

// ─── Team helpers ─────────────────────────────────────────────────────────────

function buildTeamFromPreferred(preferredTeam, userAnimals, maxSize = 3) {
  if (!preferredTeam || preferredTeam.length === 0) return [];
  const chosen = [];
  const seen = new Set();

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

function generateWildTeam(avgLevel = 1) {
  const available = animalsData.animals.filter(a => a.type !== 'exclusive');
  const chosen = [...available].sort(() => Math.random() - 0.5).slice(0, 3);
  return chosen.map(a => {
    const level = Math.max(1, avgLevel + Math.floor(Math.random() * 3) - 1);
    const stats = getAnimalBaseStats(a.name);
    const maxHp = stats.baseHp + ((level - 1) * 8);
    const attack = stats.baseAttack + ((level - 1) * 2);
    return {
      name: a.name,
      level,
      hp: maxHp,
      maxHp,
      attack,
      emoji: a.emoji,
      rarity: stats.rarity,
      type: stats.type
    };
  });
}

function formatTeamDisplay(team) {
  return team.map(a => {
    const s = calculateAnimalStats(a);
    const hpStr = s.hp > 0 ? `\`${s.hp}/${s.maxHp} HP\`` : `\`FAINTED\``;
    return `${s.emoji} **${s.name}** (Lv.${s.level}) · ${hpStr}`;
  }).join('\n');
}

// ─── Battle engine (Max 4 Rounds) ───────────────────────────────────────────

async function runBattleWithProgress(userTeam, oppTeam, onUpdate, delayMs = 1100, maxRounds = 4) {
  const userAlive = userTeam.map(calculateAnimalStats);
  const oppAlive = oppTeam.map(calculateAnimalStats);
  let round = 1;

  while (round <= maxRounds) {
    const uActive = userAlive.filter(a => a.hp > 0);
    const oActive = oppAlive.filter(a => a.hp > 0);

    if (uActive.length === 0 || oActive.length === 0) break;

    const userFirst = Math.random() < 0.5;
    const logs = [];

    if (userFirst) {
      // User strikes
      const ua = uActive[Math.floor(Math.random() * uActive.length)];
      const od = oActive[Math.floor(Math.random() * oActive.length)];
      const act = calculateAttackAction(ua, od);
      od.hp = Math.max(0, od.hp - act.damage);

      let log1 = `<:claw:1493561807091138631> ${ua.emoji} **${ua.name}** attacked ${od.emoji} **${od.name}** for **${act.damage} HP**!`;
      if (act.isDodge) log1 = `💨 ${od.emoji} **${od.name}** dodged ${ua.emoji} **${ua.name}**'s attack!`;
      else if (act.isCrit) log1 += ` 💥 *(Crit!)*`;
      if (od.hp <= 0) log1 += `\n<:dead_skull:1493557754747420732> **${od.name}** fainted!`;
      logs.push(log1);

      // Opponent retaliates if any remain alive
      const remainingOpp = oppAlive.filter(a => a.hp > 0);
      if (remainingOpp.length > 0) {
        const oa = remainingOpp[Math.floor(Math.random() * remainingOpp.length)];
        const ud = userAlive.filter(a => a.hp > 0)[Math.floor(Math.random() * userAlive.filter(a => a.hp > 0).length)];
        if (ud) {
          const act2 = calculateAttackAction(oa, ud);
          ud.hp = Math.max(0, ud.hp - act2.damage);

          let log2 = `<:claw:1493561807091138631> ${oa.emoji} **${oa.name}** struck back at ${ud.emoji} **${ud.name}** for **${act2.damage} HP**!`;
          if (act2.isDodge) log2 = `💨 ${ud.emoji} **${ud.name}** dodged ${oa.emoji} **${oa.name}**'s attack!`;
          else if (act2.isCrit) log2 += ` 💥 *(Crit!)*`;
          if (ud.hp <= 0) log2 += `\n<:dead_skull:1493557754747420732> **${ud.name}** fainted!`;
          logs.push(log2);
        }
      }
    } else {
      // Opponent strikes first
      const oa = oActive[Math.floor(Math.random() * oActive.length)];
      const ud = uActive[Math.floor(Math.random() * uActive.length)];
      const act = calculateAttackAction(oa, ud);
      ud.hp = Math.max(0, ud.hp - act.damage);

      let log1 = `<:claw:1493561807091138631> ${oa.emoji} **${oa.name}** attacked ${ud.emoji} **${ud.name}** for **${act.damage} HP**!`;
      if (act.isDodge) log1 = `💨 ${ud.emoji} **${ud.name}** dodged ${oa.emoji} **${oa.name}**'s attack!`;
      else if (act.isCrit) log1 += ` 💥 *(Crit!)*`;
      if (ud.hp <= 0) log1 += `\n<:dead_skull:1493557754747420732> **${ud.name}** fainted!`;
      logs.push(log1);

      // User retaliates if any remain alive
      const remainingUser = userAlive.filter(a => a.hp > 0);
      if (remainingUser.length > 0) {
        const ua = remainingUser[Math.floor(Math.random() * remainingUser.length)];
        const od = oppAlive.filter(a => a.hp > 0)[Math.floor(Math.random() * oppAlive.filter(a => a.hp > 0).length)];
        if (od) {
          const act2 = calculateAttackAction(ua, od);
          od.hp = Math.max(0, od.hp - act2.damage);

          let log2 = `<:claw:1493561807091138631> ${ua.emoji} **${ua.name}** struck back at ${od.emoji} **${od.name}** for **${act2.damage} HP**!`;
          if (act2.isDodge) log2 = `💨 ${od.emoji} **${od.name}** dodged ${ua.emoji} **${ua.name}**'s attack!`;
          else if (act2.isCrit) log2 += ` 💥 *(Crit!)*`;
          if (od.hp <= 0) log2 += `\n<:dead_skull:1493557754747420732> **${od.name}** fainted!`;
          logs.push(log2);
        }
      }
    }

    const roundLog = `**Round ${round} / ${maxRounds}**\n` + logs.join('\n');
    await onUpdate({
      round,
      logLine: roundLog,
      userTeamState: userAlive,
      oppTeamState: oppAlive
    });

    if (userAlive.filter(a => a.hp > 0).length === 0 || oppAlive.filter(a => a.hp > 0).length === 0) {
      break;
    }

    round++;
    await new Promise(res => setTimeout(res, delayMs));
  }

  const uFinalAlive = userAlive.filter(a => a.hp > 0);
  const oFinalAlive = oppAlive.filter(a => a.hp > 0);

  let winner;
  if (uFinalAlive.length > 0 && oFinalAlive.length === 0) winner = 'user';
  else if (oFinalAlive.length > 0 && uFinalAlive.length === 0) winner = 'opp';
  else {
    const uHp = userAlive.reduce((s, a) => s + Math.max(0, a.hp), 0);
    const oHp = oppAlive.reduce((s, a) => s + Math.max(0, a.hp), 0);
    winner = uHp > oHp ? 'user' : oHp > uHp ? 'opp' : 'tie';
  }

  return {
    winner,
    userFinalTeam: userAlive,
    oppFinalTeam: oppAlive,
    userTeamHp: userAlive.reduce((s, a) => s + Math.max(0, a.hp), 0),
    oppTeamHp: oppAlive.reduce((s, a) => s + Math.max(0, a.hp), 0),
    userTeamAlive: uFinalAlive.length,
    oppTeamAlive: oFinalAlive.length
  };
}

// ─── Rewards & EXP ──────────────────────────────────────────────────────────

function applyTeamExp(huntUser, team, expAmount) {
  if (!huntUser?.hunt?.animals) return;
  team.forEach(tAnimal => {
    const idx = huntUser.hunt.animals.findIndex(a =>
      a.name.toLowerCase() === tAnimal.name.toLowerCase()
    );
    if (idx !== -1 && huntUser.hunt.animals[idx]) {
      const animal = huntUser.hunt.animals[idx];
      animal.exp = (animal.exp || 0) + expAmount;

      // Level-up curve: (level * 30) XP
      while (animal.exp >= (animal.level || 1) * 30) {
        const needed = (animal.level || 1) * 30;
        animal.level = (animal.level || 1) + 1;
        animal.exp -= needed;
        const base = getAnimalBaseStats(animal.name);
        animal.hp = base.baseHp + ((animal.level - 1) * 8);
        animal.attack = base.baseAttack + ((animal.level - 1) * 2);
      }

      // Sync saved team member level
      if (huntUser.hunt.team && huntUser.hunt.team.length > 0) {
        const teamIdx = huntUser.hunt.team.findIndex(t => t.name.toLowerCase() === animal.name.toLowerCase());
        if (teamIdx !== -1) {
          huntUser.hunt.team[teamIdx].level = animal.level;
        }
      }
    }
  });
}

async function grantBattleRewards({ userId, defeatedTeam = [], winningTeam = [], huntUser = null, isWinner = true }) {
  const userData = await getUserData(userId);
  if (!userData) return { cashReward: 0, items: [], passBonus: 0 };

  const teamStrength = defeatedTeam.reduce((sum, a) => {
    const s = calculateAnimalStats(a);
    return sum + s.maxHp + (s.attack * 8);
  }, 0);

  let cashReward = isWinner ? Math.floor(500 + teamStrength * 0.6) : 0;
  let passBonus = 0;

  if (isWinner && cashReward > 0) {
    const passInfo = await checkPassValidity(userId);
    if (passInfo.isValid) {
      const mult = (passInfo.passType === 'etheral' || passInfo.passType === 'celestia') ? 0.15 : 0.10;
      passBonus = Math.floor(cashReward * mult);
      cashReward += passBonus;
    }
  }

  const droppedItems = [];
  if (isWinner) {
    const avgRarity = defeatedTeam.length > 0
      ? defeatedTeam.reduce((s, a) => s + (getAnimalBaseStats(a.name).rarity || 1), 0) / defeatedTeam.length
      : 1;

    const dropChance = Math.min(0.25 + (avgRarity - 1) * 0.06, 0.6);
    if (Math.random() < dropChance) {
      const itemRarity = avgRarity >= 4 ? 'rare' : avgRarity >= 3 ? 'uncommon' : 'common';
      const pools = {
        common: ['food', 'milk'],
        uncommon: ['food', 'torch', 'lollipop'],
        rare: ['torch', 'drink', 'ticket', 'rose']
      };
      const pool = pools[itemRarity] || pools.common;
      const item = ITEM_DEFINITIONS[pool[Math.floor(Math.random() * pool.length)]];
      if (item) {
        const amount = itemRarity === 'rare' ? 1 + Math.floor(Math.random() * 2) : 1;
        await updateUser(userId, { [`inventory.${item.id}`]: (userData.inventory?.[item.id] || 0) + amount });
        droppedItems.push({ item, amount });
      }
    }
  }

  // Grant EXP (Winner: 50 XP per animal, Loser: 20 XP participation)
  const expReward = isWinner ? 50 : 20;
  applyTeamExp(huntUser, winningTeam, expReward);

  if (cashReward > 0) {
    userData.cash = (userData.cash || 0) + cashReward;
    await updateUser(userId, { cash: userData.cash });
  }

  return { cashReward, items: droppedItems, passBonus };
}

// ─── Main command ──────────────────────────────────────────────────────────────

export async function battleCommand(context, { opponentId = null, isWild = false } = {}) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    let opponentUser = null;
    let opponentUsername = 'Wild Wildlife';
    let isNpcBattle = isWild;

    if (!isNpcBattle && opponentId && opponentId !== userId) {
      try {
        opponentUser = await context.client?.users?.fetch(opponentId) || null;
      } catch (e) {
        opponentUser = null;
      }

      if (opponentUser?.bot) {
        isNpcBattle = true;
        opponentUsername = 'Forest Guardians';
      } else if (opponentUser) {
        opponentUsername = opponentUser.username || 'Opponent';
      } else {
        isNpcBattle = true;
        opponentUsername = 'Wild Wildlife';
      }
    } else {
      isNpcBattle = true;
      opponentUsername = 'Wild Wildlife';
    }

    let user = await User.findOne({ discordId: userId });
    if (!user) {
      user = new User({ discordId: userId, hunt: { animals: [], unlockedLocations: ['Forest'] } });
      await user.save();
    }

    const userAnimals = user.hunt?.animals || [];
    if (userAnimals.length === 0) {
      return handleMessage(context, {
        content: `<:warning:1366050875243757699> **${username}**, you have no animals. Use \`kas hunt\` to capture some first!`
      });
    }

    const userTeam = user.hunt?.team?.length > 0
      ? buildTeamFromPreferred(user.hunt.team, userAnimals, 3)
      : selectRandomTeam(userAnimals, 3);

    if (userTeam.length === 0) {
      return handleMessage(context, {
        content: `<:warning:1366050875243757699> You have no available animals for battle.`
      });
    }

    const userAvgLevel = Math.round(userTeam.reduce((s, a) => s + (a.level || 1), 0) / userTeam.length);

    let opp = null;
    let oppTeam = [];

    if (!isNpcBattle && opponentUser) {
      opp = await User.findOne({ discordId: opponentUser.id });
      if (!opp) {
        opp = new User({ discordId: opponentUser.id, hunt: { animals: [], unlockedLocations: ['Forest'] } });
        await opp.save();
      }
      const oppAnimals = opp.hunt?.animals || [];
      if (oppAnimals.length === 0) {
        return handleMessage(context, {
          content: `<:warning:1366050875243757699> **${opponentUsername}** has no animals in their cage.`
        });
      }
      oppTeam = opp.hunt?.team?.length > 0
        ? buildTeamFromPreferred(opp.hunt.team, oppAnimals, 3)
        : selectRandomTeam(oppAnimals, 3);
    } else {
      oppTeam = generateWildTeam(userAvgLevel);
    }

    const thumbnailAttachment = fs.existsSync(BattleThumbnailPath)
      ? new AttachmentBuilder(fs.readFileSync(BattleThumbnailPath), { name: 'battle_thumbnail.png' })
      : null;

    // ── Initial card (Round 1 / 4) ──────────────────────────────────────────
    const initialContainer = buildBattleContainer({
      username,
      opponentUsername,
      userTeamDisplay: formatTeamDisplay(userTeam),
      oppTeamDisplay: formatTeamDisplay(oppTeam),
      statusLine: '⏳ *Entering the battle arena...*',
      logLine: '',
      winnerColor: 0x5865F2,
    });

    const sentMsg = await sendEditableInitial(context, {
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      ...(thumbnailAttachment ? { files: [thumbnailAttachment] } : {})
    });

    // ── Live battle (Max 4 Rounds) ──────────────────────────────────────────
    const battleResult = await runBattleWithProgress(userTeam, oppTeam, async (update) => {
      const uHp = update.userTeamState.reduce((s, a) => s + Math.max(0, a.hp), 0);
      const oHp = update.oppTeamState.reduce((s, a) => s + Math.max(0, a.hp), 0);
      const uAlive = update.userTeamState.filter(a => a.hp > 0).length;
      const oAlive = update.oppTeamState.filter(a => a.hp > 0).length;

      const statusLine = `🟢 **Round ${update.round} / 4** · ${username} **${uHp} HP** (${uAlive} alive) vs ${opponentUsername} **${oHp} HP** (${oAlive} alive)`;

      const c = buildBattleContainer({
        username,
        opponentUsername,
        userTeamDisplay: formatTeamDisplay(update.userTeamState),
        oppTeamDisplay: formatTeamDisplay(update.oppTeamState),
        statusLine,
        logLine: update.logLine,
        winnerColor: 0x5865F2,
      });

      await editExisting(context, sentMsg, {
        components: [c],
        flags: MessageFlags.IsComponentsV2,
        ...(thumbnailAttachment ? { files: [thumbnailAttachment] } : {})
      });
    }, 1100, 4);

    // ── Win Streak & Stats Tracking ─────────────────────────────────────────
    if (battleResult.winner === 'user') {
      user.hunt.winStreak = (user.hunt.winStreak || 0) + 1;
      user.hunt.battlesWon = (user.hunt.battlesWon || 0) + 1;
      if (user.hunt.winStreak > (user.hunt.highestWinStreak || 0)) {
        user.hunt.highestWinStreak = user.hunt.winStreak;
      }
      if (opp) {
        opp.hunt.winStreak = 0;
        opp.hunt.battlesLost = (opp.hunt.battlesLost || 0) + 1;
      }
    } else if (battleResult.winner === 'opp') {
      user.hunt.winStreak = 0;
      user.hunt.battlesLost = (user.hunt.battlesLost || 0) + 1;
      if (opp) {
        opp.hunt.winStreak = (opp.hunt.winStreak || 0) + 1;
        opp.hunt.battlesWon = (opp.hunt.battlesWon || 0) + 1;
        if (opp.hunt.winStreak > (opp.hunt.highestWinStreak || 0)) {
          opp.hunt.highestWinStreak = opp.hunt.winStreak;
        }
      }
    }

    // ── Rewards ─────────────────────────────────────────────────────────────
    let cashReward = 0, droppedItems = [], passBonus = 0;

    if (battleResult.winner === 'user') {
      const r = await grantBattleRewards({
        userId,
        defeatedTeam: oppTeam,
        winningTeam: userTeam,
        huntUser: user,
        isWinner: true
      });
      cashReward = r.cashReward;
      droppedItems = r.items;
      passBonus = r.passBonus;

      if (!isNpcBattle && opp && opponentUser) {
        await grantBattleRewards({
          userId: opponentUser.id,
          defeatedTeam: userTeam,
          winningTeam: oppTeam,
          huntUser: opp,
          isWinner: false
        });
      }
    } else if (battleResult.winner === 'opp') {
      if (!isNpcBattle && opp && opponentUser) {
        const r = await grantBattleRewards({
          userId: opponentUser.id,
          defeatedTeam: userTeam,
          winningTeam: oppTeam,
          huntUser: opp,
          isWinner: true
        });
        cashReward = r.cashReward;
        droppedItems = r.items;
        passBonus = r.passBonus;
      }

      await grantBattleRewards({
        userId,
        defeatedTeam: oppTeam,
        winningTeam: userTeam,
        huntUser: user,
        isWinner: false
      });
    }

    await user.save();
    if (opp) await opp.save();

    // ── Sleek Final Result Construction ─────────────────────────────────────
    const winnerColor = battleResult.winner === 'user' ? 0x00c853 : battleResult.winner === 'opp' ? 0xff3d00 : 0x808080;
    const winnerTitle = battleResult.winner === 'user'
      ? `<:trophy:1352897371595477084> **${username}** won the battle!`
      : battleResult.winner === 'opp'
        ? `<:trophy:1352897371595477084> **${opponentUsername}** won the battle!`
        : `🤝 **Battle Tied!**`;

    const uIcon = battleResult.userTeamHp > 0 ? '<:heal_heart:1381904903827361905>' : '💔';
    const oIcon = battleResult.oppTeamHp > 0 ? '<:heal_heart:1381904903827361905>' : '💔';
    const lifeStatusText = `${uIcon} **${username}:** \`${battleResult.userTeamHp} HP\` (${battleResult.userTeamAlive} alive)   ·   ${oIcon} **${opponentUsername}:** \`${battleResult.oppTeamHp} HP\` (${battleResult.oppTeamAlive} alive)`;

    const streakCount = user.hunt.winStreak || 0;
    const bestStreak = user.hunt.highestWinStreak || 0;
    let streakText = '';
    if (battleResult.winner === 'user') {
      streakText = `🔥 **Win Streak:** \`${streakCount}\` *(Best: ${bestStreak})*`;
    } else if (battleResult.winner === 'opp') {
      streakText = `💔 **Streak Reset:** \`0\` *(Best: ${bestStreak})*`;
    } else {
      streakText = `🔥 **Win Streak:** \`${streakCount}\` *(Best: ${bestStreak})*`;
    }

    let rewardText = '';
    if (battleResult.winner !== 'tie' && cashReward > 0) {
      const wName = battleResult.winner === 'user' ? username : opponentUsername;
      rewardText = `<:moneybag:1365976001179553792> **${wName}** earned <:kasiko_coin:1300141236841086977> **${cashReward.toLocaleString()}**`;
      if (passBonus > 0) rewardText += ` *(+${passBonus.toLocaleString()} pass bonus)*`;
      if (droppedItems.length > 0) {
        rewardText += ` · 🎁 ${droppedItems.map(d => `${d.item.emoji} ${d.item.name} ×${d.amount}`).join(', ')}`;
      }
    }

    // ── Generate Canvas Result Image ────────────────────────────────────────
    let attachment = null;
    try {
      const buf = await generateBattleImage({
        username,
        opponentUsername,
        userTeam: battleResult.userFinalTeam,
        oppTeam: battleResult.oppFinalTeam,
        winner: battleResult.winner,
        userTeamHp: battleResult.userTeamHp,
        oppTeamHp: battleResult.oppTeamHp,
        userTeamAlive: battleResult.userTeamAlive,
        oppTeamAlive: battleResult.oppTeamAlive,
        cashReward,
        passBonus,
        droppedItems,
        winStreak: user.hunt.winStreak
      });
      attachment = new AttachmentBuilder(buf, { name: 'battle-result.png' });
    } catch (e) {
      console.error('Battle canvas error:', e);
    }

    // ── Edit into sleek final container ─────────────────────────────────────
    const finalContainer = buildFinalBattleContainer({
      titleText: winnerTitle,
      lifeStatusText,
      streakText,
      rewardText,
      winnerColor,
    });

    await editExisting(context, sentMsg, {
      components: [finalContainer],
      flags: MessageFlags.IsComponentsV2,
      files: [
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
  description: 'Battle wild beasts or challenge other players with your animals!',
  aliases: ['abattle', 'ab', 'animalfight', 'afight'],
  args: '[@opponent|wild]',
  example: ['animalbattle @user', 'abattle wild', 'ab'],
  emoji: '<:claw:1493561807091138631>',
  cooldown: 15000,
  category: '🦌 Wildlife',

  execute: async (args, context) => {
    args.shift();
    let opponentId = null;
    let isWild = false;

    const mentionedUser = context.mentions?.users?.first?.();
    if (mentionedUser) {
      opponentId = mentionedUser.id;
    } else if (args[0]) {
      const firstArg = args[0].toLowerCase();
      if (firstArg === 'wild' || firstArg === 'npc' || firstArg === 'solo') {
        isWild = true;
      } else {
        const m = args[0].match(/<@!?(\d+)>/);
        opponentId = m ? m[1] : args[0];
      }
    } else {
      isWild = true;
    }

    await battleCommand(context, { opponentId, isWild });
  }
};
