import Powers from "./dragon/powers.js"
import Dragon from '../../../models/Dragon.js';
import HorizonBattle from '../../../models/Horizon.js';
import HorizonUser from '../../../models/HorizonUser.js';
import redisClient from '../../../redis.js';
import {
  selectBossTemplates
} from './boss.js';
import {
  createHorizonBattle
} from './create.js';
import fs from 'fs';
import path from 'path';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} from 'discord.js';

import {
  handleMessage,
  discordUser
} from '../../../helper.js';

import {
  GeneralEmbed,
  PlayerEmbed,
  HistoryEmbed,
  RewardsEmbed,
  HelpEmbed
} from './embeds/general.js';

import {
  joinHorizonBattle,
  exitHorizonBattle
} from './participate.js';

import {
  rewardStructure
} from './reward.js';

import {
  horizonMe
} from './me.js';

import {
  getUserData,
  updateUser
} from '../../../database.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dragonTypesPath = path.join(__dirname, '../../../data/dragons.json');
export const dragonTypes = JSON.parse(fs.readFileSync(dragonTypesPath, 'utf-8'));

let gemIcon = `<:gem2:1304673964588662826>`
let sigilsIcon = `<:mystic_sigils:1320636356069687347>`;

export async function handleHorizonAction(context, playerId, abilityId) {
  const battle = await HorizonBattle.findOne({
    players: playerId
  });
  const {
    name,
    avatar
  } = discordUser(context);

  if (!battle) return handleMessage(context, `🚫 **${name}**, you're not in an active Horizon battle.`);

  const player = battle.playerStats.find(p => p.playerId === playerId);
  if (!player) return handleMessage(context, `🚫 **${name}**, you're not in this battle.`);

  const dragon = player.currentDragon;
  if (!dragon || !dragon.health || dragon.health <= 0)
    return handleMessage(context, `💤 **${name}**, your dragon is unable to fight. Heal or wait for next round.`);

  const ability = dragon.abilities.find(a => a.id === abilityId);
  if (!ability) return handleMessage(context, `🤔 Invalid ability ID. Use \`p1\` or \`p2\`.`);

  const boss = battle.bosses[battle.currentBossIndex];
  if (!boss || boss.health <= 0)
    return handleMessage(context, `⚠️ Boss already defeated. Waiting for next one.`);

  // Apply damage and heal
  boss.health -= ability.dmg;
  player.totalDamage += ability.dmg;

  const healing = Math.min(100 - dragon.health, ability.heal);
  dragon.health += healing;

  const now = Date.now();
  player.lastActionAt = now;

  // Push to history
  battle.history ||= []; // Ensure history array exists

  battle.history.unshift({
    playerId,
    timestamp: new Date(),
    action: 'attack',
    target: 'boss',
    damage: ability.dmg,
    healing: healing > 0 ? healing: undefined,
    specialName: ability.name, // optional: only if needed
    bossIndex: battle.currentBossIndex,
    bossName: boss.name
  });

  // Keep only last 7 entries
  if (battle.history.length > 7) battle.history.pop();

  // Boss defeated
  if (boss.health <= 0) {
    const myReward = await distributeBossRewards(battle, playerId);

    battle.history.unshift({
      playerId,
      timestamp: new Date(),
      action: 'defeat',
      target: 'boss',
      damage: ability.dmg,
      specialName: 'Boss Defeated',
      bossIndex: battle.currentBossIndex,
      bossName: boss.name
    });

    if (battle.history.length > 7) battle.history.pop();

    battle.currentBossIndex += 1;

    if (battle.bosses[battle.currentBossIndex]) {
      // Reset boss health
      battle.bosses[battle.currentBossIndex].health =
      battle.bosses[battle.currentBossIndex].maxHealth;

      // heal all players' dragons
      for (let p of battle.playerStats) {
        p.currentDragon.health = 100;
        p.lastActionAt = null;
      }

      handleMessage(context, {
        embeds: [
          new EmbedBuilder()
          .setTitle("<:flame_sword:1381904987554054154> Boss Defeated!")
          .setDescription(`**${boss.name}** has been defeated!\n<:reward_box:1366435558011965500> All players received rewards.\n💵 **Your reward:** <:kasiko_coin:1300141236841086977> ${myReward}`)
          .setColor("Green")
        ]
      });
    } else {
      // Final Boss Defeated
      for (let p of battle.playerStats) {

        await HorizonUser.findOneAndUpdate(
          {
            userId: p.playerId
          },
          {
            $inc: {
              totalBattlesPlayed: 1,
              totalBattlesWon: 1,
              totalBattlesLost: 0,
              totalBossesDefeated: 5,
              totalDamageDealt: p?.totalDamage || 0,
            },
            $max: {
              highestDamageInBattle: p?.totalDamage || 0,
              mostBossesInBattle: 5
            },
            $set: {
              lastBattle: {
                code: battle.code,
                status: 'won',
                bossLevelReached: (battle?.currentBossIndex || 0) + 1,
                damageDealt: p?.totalDamage || 0,
                totalRewards: p?.rewardsGiven || 0,
                finishedAt: new Date()
              }
            },
            $setOnInsert: {
              joinedAt: new Date()
            }
          },
          {
            upsert: true
          }
        );
      }

      await battle.deleteOne();

      return handleMessage(context, `<:blue_fire:1336344769982500964> Final boss defeated!`);
    }
  }

  await HorizonUser.findOneAndUpdate(
    {
      userId: player.playerId
    },
    {
      $max: {
        highestDamageInBattle: player?.totalDamage || 0,
        mostBossesInBattle: battle.currentBossIndex + 1
      },
      $set: {
        lastBattle: {
          code: battle.code,
          bossLevelReached: (battle?.currentBossIndex || 0) + 1,
          damageDealt: player?.totalDamage || 0,
          totalRewards: player?.rewardsGiven || 0,
          finishedAt: new Date()
        }
      },
      $setOnInsert: {
        joinedAt: new Date()
      }
    },
    {
      upsert: true
    }
  );

  await battle.save();

  return handleMessage(context, {
    embeds: [
      new EmbedBuilder()
      .setDescription (`**${name}**'s <:${dragon.id}:${dragon.emoji}> **${dragon.name}** used ${ability.emoji} **${ability.name}**!\n🩸 Boss HP: ${Math.max(0, boss.health)}\n💥 Damage: ${ability.dmg}\n<:heal_heart:1381904903827361905> Heal: ${healing}`
      ).setColor('Random')
      .setAuthor({
        name: name, iconURL: avatar
      })
      .setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/dragons/shadowspire.png")
    ]
  });
}

async function distributeBossRewards(battle, playerId) {
  const index = Math.min(battle.currentBossIndex, rewardStructure.length - 1);
  const rewards = rewardStructure[index];
  let currentPlayerReward = 0;

  const sorted = [...battle.playerStats].sort((a, b) => b.totalDamage - a.totalDamage);

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    let userData = await getUserData(player.playerId);

    if (i === 0) player.rewardsGiven = rewards.top1;
    else if (i < 3) player.rewardsGiven = rewards.top2_3;
    else player.rewardsGiven = rewards.others;

    await HorizonUser.findOneAndUpdate(
      {
        userId: player.playerId
      },
      {
        $inc: {
          'lastBattle.totalRewards': player?.rewardsGiven || 0
        }
      },
      {
        upsert: true
      }
    );

    userData.cash += player?.rewardsGiven || 0;

    if (userData) {
      if (player.playerId === playerId) currentPlayerReward = player?.rewardsGiven || 0;
      await updateUser(player.playerId, {
        cash: userData.cash
      });
    }
  }

  return currentPlayerReward
}

export default {
  name: 'horizon',
  description: 'Team dragon battle against a dragon boss. Create or join “Horizon” battles, track stats, and progress through 5 bosses.',
  aliases: ['hz',
    'attack'],
  cooldown: 10000,
  category: "🐉 Horizon",
  emoji: "<:DragonChampion_badge:1322049597517987860>",
  example: [
    "horizon",
    "horizon new",
    "horizon join <code>",
    "attack p1"
  ],
  async execute(args,
    context) {
    const subcommand = args[1]?.toLowerCase();
    const {
      name,
      id,
      username,
      avatar
    } = discordUser(context);

    if (args[0]?.toLowerCase() === "attack") {
      return await handleHorizonAction(context, id, args[1]?.toLowerCase());
    }

    if (subcommand === 'new') {
      return await createHorizonBattle(context, id, selectBossTemplates());
    }

    if (subcommand === 'join') {
      const code = args[2]?.toUpperCase();
      if (!code) return handleMessage(context, "⚠️ Provide a valid battle code. Example: `horizon join ABC123`");
      return await joinHorizonBattle(context, id, code);
    }

    if (subcommand === 'exit') {
      return await exitHorizonBattle(context, id);
    }

    if (subcommand === 'me') {
      return await horizonMe(context, id);
    }

    // Fetch the battle that this user is participating in
    const battle = await HorizonBattle.findOne({
      players: id
    });
    if (!battle) {
      const helpEmbed = await HelpEmbed(context, name, avatar);
      return await handleMessage(context, {
        embeds: helpEmbed.embeds
      });
    }

    // Extract “General” details
    const bossIndex = battle.currentBossIndex;
    const currentBoss = battle.bosses[bossIndex];
    const playerStats = battle.playerStats.find((p) => p.playerId === id);

    let General = GeneralEmbed(battle, name, avatar, currentBoss, playerStats);

    let replyMessage = await handleMessage(context, {
      embeds: General.embeds,
      components: [General.buttons],
      ephemeral: false,
    });

    const collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000
    });

    collector.on("collect", async (interaction) => {
      try {
        switch (interaction.customId) {
        case 'hb_general':
          await interaction.deferUpdate();
          let General = GeneralEmbed(battle, name, avatar, currentBoss, playerStats);

          interaction.editReply({
            embeds: General.embeds,
            components: [General.buttons],
            ephemeral: false,
          })
          break;
        case 'hb_players':
          await interaction.deferUpdate();

          let Players = await PlayerEmbed(interaction, battle, name, avatar, 0);

          interaction.editReply({
            embeds: Players.embeds,
            components: [Players.buttons],
            ephemeral: false,
          })
          break;

        case 'hb_history':
          await interaction.deferUpdate();

          let History = await HistoryEmbed(interaction, battle, name, avatar);

          interaction.editReply({
            embeds: History.embeds,
            components: [History.buttons],
            ephemeral: false,
          })
          break;

        case 'hb_rewards':
          await interaction.deferUpdate();

          let Rewards = await RewardsEmbed(interaction, battle, name, avatar);

          interaction.editReply({
            embeds: Rewards.embeds,
            components: [Rewards.buttons],
            ephemeral: false,
          })
          break;

        case 'hb_howto':
          await interaction.deferUpdate();

          const helpEmbed = await HelpEmbed(interaction, name, avatar);
          interaction.editReply({
            embeds: helpEmbed.embeds,
            ephemeral: false
          });
          break;
        }

        const [prefix, direction, pageStr] = interaction.customId.split('_');

        const page = parseInt(pageStr || '0');
        switch (direction) {
        case 'prevPlayer':
          await interaction.deferUpdate();

          Players = await PlayerEmbed(interaction, battle, name, avatar, page);

          interaction.editReply({
            embeds: Players.embeds,
            components: [Players.buttons],
            ephemeral: false,
          })
          break;
        case 'nextPlayer':
          await interaction.deferUpdate();

          Players = await PlayerEmbed(interaction, battle, name, avatar, page);

          interaction.editReply({
            embeds: Players.embeds,
            components: [Players.buttons],
            ephemeral: false,
          })
          break;
        }

      } catch (err) {}
    });

    collector.on('end',
      async () => {
        await replyMessage.edit({
          components: []
        }).catch(() => {});
      })
  }
};