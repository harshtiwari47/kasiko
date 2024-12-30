import Battle from '../models/Battle.js';

import SkyraidUsers from '../models/SkyraidUsers.js';
import SkyraidGuilds from '../models/SkyraidGuilds.js';

import {
  EmbedBuilder
} from 'discord.js';
import mongoose from 'mongoose';
import {
  client
} from "../bot.js";
import fs from 'fs';
import path from 'path';

import {
  getUserData,
  updateUser
} from '../database.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const powerspath = path.join(__dirname, '../src/txtcommands/explore/dragon/powers.json');
const powerTypes = JSON.parse(fs.readFileSync(powerspath, 'utf-8'));


// Function to start the battle loop
export async function startBattleLoop(guildId, channelId) {
  try {
    const battle = await Battle.findOne({
      guildId, channelId, status: 'active'
    });
    if (!battle) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const battleInterval = setInterval(async () => {
      if (battle.boss.health <= 0) {
        // Boss defeated
        clearInterval(battleInterval);
        await endBattle(battle, channel, 'boss');
        return;
      }

      const alivePlayers = battle.players.filter(player => player.health > 0);
      if (alivePlayers.length <= 0) {
        // All players defeated
        clearInterval(battleInterval);
        await endBattle(battle, channel, 'players');
        return;
      }

      // Dragon attacks a random player
      const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      let bossPower = powerTypes[Math.floor(Math.random() * powerTypes.length)]

      const damage = bossPower.dmg * battle.boss.level;

      // Find index of the player in the original array
      const playerIndex = battle.players.findIndex(player => player.userId === randomPlayer.userId);
      if (playerIndex !== -1) {
        battle.players[playerIndex].health -= damage;
        if (battle.players[playerIndex].health < 0) {
          battle.players[playerIndex].health = 0;
        }

        const updates = {};
        battle.modifiedPaths().forEach((path) => {
          updates[path] = battle[path];
        });

        if (Object.keys(updates).length > 0) {
          // Perform atomic update using $set
          await Battle.findByIdAndUpdate(
            battle._id,
            {
              $set: updates
            },
            {
              new: true
            }
          );
        }
      }

      const user = await client.users.fetch(randomPlayer.userId);

      // Notify the channel about the attack
      const attackEmbed = new EmbedBuilder()
      .setDescription(`# ${battle.boss.emoji} Dragon Attack!\nThe **${battle.boss.typeId}** used a **${bossPower.emoji}** **${bossPower.name}** attack on <@${randomPlayer.userId}> dealing 🩸 **${damage} damage**!`)
      .setColor('#dcb18e')
      .setFooter({
        text: `❤️ PLAYER HEALTH:** ${battle.players[playerIndex].health}`
      })
      .setThumbnail(user.displayAvatarURL({
        dynamic: true, size: 1024
      }))

      channel.send({
        embeds: [attackEmbed]
      });
    },
      18000); // Every 18 seconds
  } catch (e) {
    console.error(e);
  }
  // Optionally, you can handle boss abilities, player actions, etc., here
}

// Function to end the battle
async function endBattle(battle, channel, reason) {
  try {
    battle.status = 'completed';

    const battleupdates = {};
    battle.modifiedPaths().forEach((path) => {
      battleupdates[path] = battle[path];
    });

    if (Object.keys(updates).length > 0) {
      // Perform atomic update using $set
      await Battle.findByIdAndUpdate(
        battle._id,
        {
          $set: battleupdates
        },
        {
          new: true
        }
      );
    }

    const guildId = battle["guildId"];

    let guild = await SkyraidGuilds.findOne({
      guildId
    });

    if (!channel.send) {
      channel = await client.channels.fetch(battle["channelId"]).catch(() => null);
    }

    if (!channel.send) return;
    let badgesWon = [];

    let guildBadges = ["<:celebration_crown:1322863245811515412>",
      "<:radiant_star:1322863272113868810>",
      "<:bursting_nova:1322863295190925372>",
      "<:lightning_bolt:1322863131055357983>",
      "<:diamond_core:1322863151162589185>",
      "<:heart_of_valor:1322863190702559242>",
      "<:shades_of_glory:1322863218091360387>"];

    try {
      if (!guild) {
        // If guild doesn't exist, create a new record
        guild = new SkyraidGuilds( {
          guildId,
          totalMatches: 1,
          matchesWon: reason === 'boss' ? 1: 0,
          matchesCancelled: cancelled ? 1: 0,
          bossDefeated: {
            [battle.boss.typeId]: 1
          },
          players: [],
          badges: [],
        });
      } else {
        // Update existing guild
        guild.matchesWon += reason === 'boss' ? 1: 0;
        guild.bossDefeated[battle.boss.typeId] += reason === 'boss' ? 1: 0;

        if (reason === 'boss') {
          guild.bossDefeated[battle.boss.typeId] += 1;
        }

        if (guild.bossDefeated[battle.boss.typeId] === 5 && !guild.badges.some(b => b === "<:heart_of_valor:1322863190702559242>")) {
          badgesWon.push("<:heart_of_valor:1322863190702559242>");
          guild.badges.push("<:heart_of_valor:1322863190702559242>")
        }

        if (guild.matchesWon === 1 && !guild.badges.some(b => b === "<:celebration_crown:1322863245811515412>")) {
          badgesWon.push("<:celebration_crown:1322863245811515412>");
          guild.badges.push("<:celebration_crown:1322863245811515412>")
        }

        if (guild.matchesWon === 5 && !guild.badges.some(b => b === "<:radiant_star:1322863272113868810>")) {
          badgesWon.push("<:radiant_star:1322863272113868810>");
          guild.badges.push("<:radiant_star:1322863272113868810>")
        }

        if (guild.matchesWon === 15 && !guild.badges.some(b => b === "<:diamond_core:1322863151162589185>")) {
          badgesWon.push("<:diamond_core:1322863151162589185>");
          guild.badges.push("<:diamond_core:1322863151162589185>")
        }

        if (guild.matchesWon === 25 && !guild.badges.some(b => b === "<:lightning_bolt:1322863131055357983>")) {
          badgesWon.push("<:lightning_bolt:1322863131055357983>");
          guild.badges.push("<:lightning_bolt:1322863131055357983>")
        }

        if (guild.matchesWon === 45 && !guild.badges.some(b => b === "<:bursting_nova:1322863295190925372>")) {
          badgesWon.push("<:bursting_nova:1322863295190925372>");
          guild.badges.push("<:bursting_nova:1322863295190925372>")
        }

        if (guild.matchesWon === 65 && !guild.badges.some(b => b === "<:shades_of_glory:1322863218091360387>")) {
          badgesWon.push("<:shades_of_glory:1322863218091360387>");
          guild.badges.push("<:shades_of_glory:1322863218091360387>")
        }
      }

      const updates = {};
      guild.modifiedPaths().forEach((path) => {
        updates[path] = guild[path];
      });

      if (Object.keys(updates).length > 0) {
        // Perform atomic update using $set
        await SkyraidGuilds.findByIdAndUpdate(
          guild._id,
          {
            $set: updates
          },
          {
            new: true
          }
        );
      }

    } catch (error) {
      console.error('Error updating guild stats:', error);
    }

    const sortedPlayers = [...battle.players].sort((a, b) => b.damageContributed - a.damageContributed);
    const highestDamageBy = sortedPlayers[0]?.userId || null;
    const secondDamageBy = sortedPlayers[1]?.userId || null;

    for (const player of battle.players) {
      const {
        userId,
        damageContributed
      } = player;
      let isStarPerformer;

      if (highestDamageBy && highestDamageBy === userId) {
        isStarPerformer = false;
      } else {
        isStarPerformer = false;
      }
      let userData = await getUserData(userId);

      let earnedBadges = [];

      if (isStarPerformer) {
        earnedBadges = ["<:StarPerformer_badge:1322048049324884019>"]
        if (reason === 'boss') {
          userData.cash += 50000;
        }
      } else {
        if (reason === 'boss') {
          if (secondDamageBy && secondDamageBy === userId) {
            userData.cash += 25000;
          } else {
            userData.cash += 5000;
          }
        }
      }
      await updateUser(userId, userData);
      await updateUserStats(userId, battle.guildId, damageContributed, true, isStarPerformer, earnedBadges);
    }

    if (reason === 'boss') {
      // Players won
      const embed = new EmbedBuilder()
      .setTitle('🎉 Battle Won! 🎉')
      .setDescription(`Congratulations! The **${battle.boss.typeId}** has been defeated.${badgesWon.length > 0 ? `\n## BADGES WON: ` + badgesWon.join(" "): ""}`)
      .setColor('#00FF00')
      .setTimestamp();

      const starUserInfo = await client.users.fetch(highestDamageBy);

      const starEmbed = new EmbedBuilder()
      .setDescription(`## 💫 STAR PERFORMER: <@${highestDamageBy}>`)
      .setThumbnail(starUserInfo.displayAvatarURL({
        dynamic: true, size: 1024
      }));

      const rewardEmbed = new EmbedBuilder()
      .setDescription(`## 💵 Rewards\n💫 STAR PERFORMER: <:kasiko_coin:1300141236841086977> +50k${secondDamageBy ? `\n🔥 <@${secondDamageBy}>: <:kasiko_coin:1300141236841086977> 25k`: ""}\n🗡️ Others: <:kasiko_coin:1300141236841086977> 5k`)

      channel.send({
        embeds: [embed, starEmbed, rewardEmbed]
      });
    } else if (reason === 'players') {
      // Dragon won
      const embed = new EmbedBuilder()
      .setDescription(`# 😢 Battle Lost\nEvery single player has fallen at the hands of the **${battle.boss.typeId}**, a fierce and relentless force that left no room for escape or survival.\n❤️ BOSS HP: ${battle.boss.health}`)
      .setImage(battle.boss.image)
      .setColor('#FF0000')
      .setTimestamp();

      channel.send({
        embeds: [embed]
      });
    }

    // Clean up the battle data
    await Battle.findByIdAndDelete(battle._id);
  } catch (err) {
    console.error(err);
  }
}


export async function updateUserStats(userId, guildId, damage = 0, participated = true, isStarPerformer = false, badges = []) {
  try {
    // Find the user in the database
    let user = await SkyraidUsers.findOne({
      userId, guildId
    });

    if (!user) {
      // If user doesn't exist, create a new record
      user = new SkyraidUsers( {
        userId,
        guildId,
        totalDamage: damage,
        matchesParticipated: participated ? 1: 0,
        badges: badges,
        starPerformer: isStarPerformer ? 1: 0,
      });
    } else {
      // Update existing user
      user.totalDamage += damage;
      if (isStarPerformer) user.starPerformer += 1;
      if (badges.length > 0) {
        user.badges.push(...badges.filter(badge => !user.badges.includes(badge)));
      }
    }

    const updates = {};
    user.modifiedPaths().forEach((path) => {
      updates[path] = user[path];
    });

    if (Object.keys(updates).length > 0) {
      await SkyraidUsers.findByIdAndUpdate(
        user._id,
        {
          $set: updates
        },
        {
          new: true
        }
      );
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

/**
* Handles the use of a power by a player.
* @param {Object} options - The options for the use action.
* @param {string} options.guildId - The ID of the guild.
* @param {string} options.channelId - The ID of the channel.
* @param {string} options.userId - The ID of the user.
* @param {string} options.power - The power being used ('p1' or 'p2').
* @param {Object} client - The Discord client instance.
* @returns {Object} - An object containing the embed messages and a flag indicating if the battle ended.
*/
export async function handleUsePower( {
  guildId,
  channelId,
  userId,
  power,
}) {
  try {
    const updateOps = {};
    let embedDescription = '';
    let battleEnded = false;

    // Fetch the user to get username and other info
    const user = await client.users.fetch(userId);
    if (!user) {
      return {
        replyContent: 'User not found.',
        ephemeral: true,
      };
    }

    // Find the active battle
    const battle = await Battle.findOne({
      guildId,
      status: 'active',
      'players.userId': userId,
      'players.health': {
        $gt: 0
      }, // Ensure player is alive
    });

    if (!battle) {
      return {
        replyContent: 'There is no active battle right now or you are not participating.',
        ephemeral: true,
      };
    }

    // Locate the player
    const player = battle.players.find((p) => p.userId === userId);
    if (!player) {
      throw new Error('Player not found in battle.');
    }

    // Find the selected power
    const selectedPower = player.powers.find(
      (p) => p.id.toLowerCase() === power.toLowerCase()
    );
    if (!selectedPower) {
      throw new Error('Invalid power selected.');
    }

    // Apply power effects
    if (selectedPower.dmg > 0) {
      const damage = selectedPower.dmg;
      battle.boss.health = Math.max(battle.boss.health - damage, 0);
      player.damageContributed += damage;
      embedDescription += `${selectedPower.emoji} **${selectedPower.name}** used by **${user.username}** dealt **${damage} damage** to the boss!\n`;
    }

    if (selectedPower.heal > 0) {
      const healAmount = selectedPower.heal;
      player.health = Math.min(player.health + healAmount, 100);
      embedDescription += `${selectedPower.emoji} **${selectedPower.name}** used by **${user.username}** healed **${healAmount} HP**!\n`;
    }

    if (selectedPower.defence > 0) {
      const defenceAmount = selectedPower.defence;
      player.health = Math.min(player.health + defenceAmount, 100);
      embedDescription += `${selectedPower.emoji} **${selectedPower.name}** used by **${user.username}** defended **${defenceAmount} HP**!\n`;
    }

    const updates = {};
    battle.modifiedPaths().forEach((path) => {
      updates[path] = battle[path];
    });

    if (Object.keys(updates).length > 0) {
      await Battle.findByIdAndUpdate(
        battle._id,
        {
          $set: updates
        },
        {
          new: true
        }
      );
    }

    // Construct the embed
    const titles = [
      `The Rise of <@${userId}>`,
      `<@${userId}> Unleashes Power`,
      `Epic Move by <@${userId}>`,
      `<@${userId}> Strikes Again!`,
      `Legends in Action: <@${userId}>`,
      `The Mastery of <@${userId}>`,
      `<@${userId}> Joins the Battle`,
      `Unstoppable Force: <@${userId}>`,
      `<@${userId}>'s Moment of Glory`,
      `The Power Chronicles: <@${userId}>`,
    ];

    const embed = new EmbedBuilder()
    .setTitle(
      `<:${player.dragonId}${player.dragonStage}:${player.emoji}> ${
      titles[Math.floor(Math.random() * titles.length)]
      }`
    )
    .setDescription(embedDescription)
    .setThumbnail(battle.boss.image)
    .setColor('#0054ff'); // Optional

    // Check if boss is defeated after the attack
    if (battle.boss.health <= 0) {
      await endBattle(battle, channelId, 'boss');
      battleEnded = true;
    }

    // Fetch the channel
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found.`);
      return {
        replyContent: 'Channel not found.',
        ephemeral: true,
      };
    }

    return {
      embed,
      battleEnded,
      channel,
    };
  } catch (error) {
    console.error('Error in handleUsePower:', error);

    if (error.message === 'Invalid power selected.') {
      return {
        replyContent: 'Invalid power selected.',
        ephemeral: true,
      };
    }

    if (error.message === 'Player not found in battle.') {
      return {
        replyContent: 'You are not participating in this battle.',
        ephemeral: true,
      };
    }

    if (error.name === 'VersionError') {
      return {
        replyContent: '⏱️ Please wait and try again!',
        ephemeral: true,
      };
    }

    return {
      replyContent: 'An unexpected error occurred while using your power.',
      ephemeral: true,
    };
  }
}

export async function getPlayerSvInfo( {
  guildId, channelId, userId
}) {
  const battle = await Battle.findOne({
    guildId,
    status: {
      $in: ['active', 'waiting']
    }
  });

  if (!battle) {
    return {
      success: false,
      replyContent: 'There is no active battle right now.'
    };
  }

  const player = battle.players.find((p) => p.userId === userId);
  if (!player) {
    return {
      success: false,
      replyContent: 'You are not participating in this battle.'
    };
  }

  if (player.health <= 0) {
    return {
      success: false,
      replyContent: 'You have been defeated and cannot use abilities.'
    }
  }

  let embedDescription = `❤️ HEALTH: **${player.health}**\n` +
  `🐉 DRAGON: <:${player.dragonId}${player.dragonStage}:${player.emoji}> **${player.dragonId}**\n` +
  `🗡️ **P1**: **${player.powers[0].emoji} ${player.powers[0].name}**\n` +
  `🗡 **P2**: **${player.powers[1].emoji} ${player.powers[1].name}**\n` +
  `Keep fighting and protect your server! 🐾`;

  const embed = new EmbedBuilder()
  .setTitle(`🐲 <@${player.userId}>'s LIVE STATS`)
  .setDescription(embedDescription)
  .setColor('#1c5140')

  return {
    success: true,
    embed
  }
}