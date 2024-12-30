import {
  ButtonInteraction,
  EmbedBuilder
} from 'discord.js';
import Battle from '../models/Battle.js';
import Dragon from '../models/Dragon.js';
import SkyraidUsers from '../models/SkyraidUsers.js';
import SkyraidGuilds from '../models/SkyraidGuilds.js';
import {
  userExists
} from '../database.js';

import fs from 'fs';
import path from 'path';
import {
  getUserDataDragon,
  saveUserData
} from "../src/txtcommands/explore/dragon.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Load all dragon types from JSON
const dragonTypesPath = path.join(__dirname, '../data/dragons.json');
const dragonTypes = JSON.parse(fs.readFileSync(dragonTypesPath, 'utf-8'));

// powers
const powerspath = path.join(__dirname, '../src/txtcommands/explore/dragon/powers.json');
const powerTypes = JSON.parse(fs.readFileSync(powerspath, 'utf-8'));

export async function handleButtonInteraction(interaction) {
  if (interaction.customId === 'register_battle' && interaction.isButton()) {
    if (interaction.replied || interaction.deferred) return; // Do not reply again
    // Defer the reply immediately to indicate processing
    await interaction.deferUpdate();
    let userExistence = await userExists(interaction.user.id);
    if (!userExistence) {
      await interaction.followUp({
        content: `You haven't accepted our terms and conditions! Type \`kas terms\` in a server where the bot is available to create an account.`,
        ephemeral: true, // Only visible to the user
      });
      return;
    }
    // Find the ongoing battle
    const battle = await Battle.findOne({
      guildId: interaction.guild.id, status: 'waiting'
    });
    if (!battle) {
      return interaction.followUp({
        content: 'There is no ongoing battle to register for.', ephemeral: true
      });
    }

    // Check if the user has already registered
    if (battle.players.find(player => player.userId === interaction.user.id)) {
      return interaction.followUp({
        content: 'You have already registered for this battle.', ephemeral: true
      });
    }

    // Check if the battle is full
    if (battle.players.length >= 50) {
      return interaction.followUp({
        content: 'The battle is full. Maximum 50 players have already registered.', ephemeral: true
      });
    }

    const userData = await getUserDataDragon(interaction.user.id);

    if (!userData.dragons) userData.dragons = []

    if (userData.dragons.length === 0) {
      return interaction.followUp({
        content: `❗ You have no dragons. Use \`dragon summon\` to get started!`
      });
    }

    let targetDragon = userData.dragons[userData.active || 0];

    if (!targetDragon.isHatched) {
      return interaction.followUp({
        content: `❗ This dragon is still an egg! Hatch it first using \`dragon hatch <index>\`.`
      });
    }

    const chosenType = dragonTypes.find(t => t.id === targetDragon.typeId);

    let power1 = powerTypes.find(p => p.name.toLowerCase() === chosenType.strengths[0].toLowerCase());
    let power2 = powerTypes.find(p => p.name.toLowerCase() === chosenType.strengths[1].toLowerCase());

    power1.level = userData.powers.find(p => p.typeId === power1.name)?.level || 1;
    power2.level = userData.powers.find(p => p.typeId === power2.name)?.level || 1;

    // Add the player to the battle
    battle.players.push({
      userId: interaction.user.id,
      dragonName: targetDragon.customName ? targetDragon.customName: targetDragon.typeId,
      dragonStage: targetDragon.stage ? targetDragon.stage: 2,
      dragonId: targetDragon.typeId,
      emoji: chosenType.emoji,
      health: 100,
      damageContributed: 0,
      powers: [{
        id: "p1",
        name: power1.name,
        dmg: power1.dmg * power1.level,
        level: power1.level,
        defence: power1.defence * power1.level,
        emoji: power1.emoji,
        heal: power1.heal * power1.level
      },
        {
          id: "p2",
          name: power2.name,
          dmg: power2.dmg * power2.level,
          level: power2.level,
          defence: power2.defence * power2.level,
          emoji: power2.emoji,
          heal: power2.heal * power2.level
        }]
    });

    await battle.save();

    try {
      const guildId = interaction.guild.id;
      const userId = interaction.user.id;

      // Find the user in the database
      let user = await SkyraidUsers.findOne({
        userId, guildId
      });

      let guild = await SkyraidGuilds.findOne({
        guildId
      });

      if (!user) {
        // If user doesn't exist, create a new record
        user = new SkyraidUsers( {
          userId,
          guildId,
          guildDoc: guild["_id"],
          totalDamage: 0,
          matchesParticipated: 1,
          badges: [],
          starPerformer: 0,
        });
      } else {
        // Update existing user
        user.matchesParticipated += 1;
      }

      if (!guild.players.includes(user["_id"])) {
        guild.players.push(user["_id"]);
      }

      await guild.save();

      await user.save();
    } catch (error) {
      console.error('Error updating user stats:', error);
    }

    // Update the embed message to reflect the new participant
    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    embed.setFooter({
      text: `TOTAL PARTICIPANTS — ${battle.players.length}`
    });

    await interaction.editReply({
      embeds: [embed]
    });

    // Reply to the user after processing
    return interaction.followUp({
      content: `You have successfully registered for the battle!\n**DRAGON**: <:${targetDragon.typeId}${targetDragon.stage}:${chosenType.emoji}> ${targetDragon.customName ? targetDragon.customName: targetDragon.typeId}\n**P1**: ${power1.emoji} ${power1.name}\n**P2**: ${power2.emoji} ${power2.name}`, ephemeral: true
    });
  }
}