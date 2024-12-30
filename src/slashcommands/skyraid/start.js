import {
  SlashCommandBuilder
} from 'discord.js';
import Battle from '../../../models/Battle.js';
import {
  EmbedBuilder
} from 'discord.js';
import {
  startBattleLoop
} from '../../../utils/battleUtils.js';
import {
  PermissionsBitField
} from 'discord.js';
import {
  userExists
} from '../../../database.js';

export default {
  execute: async (interaction) => {
    if (interaction.replied || interaction.deferred) return; // Do not reply against
    // Defer the reply immediately to indicate processing
    await interaction.deferReply();

    let userExistence = await userExists(interaction.user.id);
    if (!userExistence) {
      await interaction.followUp({
        content: `You haven't accepted our terms and conditions! Type \`kas terms\` in a server where the bot is available to create an account.`,
        ephemeral: true, // Only visible to the user
      });
      return;
    }

    // Check for Manage Server permission
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.followUp({
        content: 'You do not have permission to use this command.', ephemeral: true
      });
    }

    const battle = await Battle.findOne({
      guildId: interaction.guild.id, status: 'waiting'
    });
    if (!battle) {
      return interaction.followUp({
        content: 'There is no ongoing battle to start.', ephemeral: true
      });
    }

    if (battle.players.length < 2) {
      return interaction.followUp({
        content: 'Not enough players to start the battle. Minimum 2 players required.', ephemeral: true
      });
    }

    battle.status = 'active';
    battle.battleStartedAt = new Date();

    let dmgCanContributeTotal = battle.players.reduce((dmgCanContribute, player, i) => {
      dmgCanContribute += player.totalDmg;
      return dmgCanContribute;
    }, 0);

    let newHealth = 0;

    if (dmgCanContributeTotal > battle.boss.health) {
      newHealth = dmgCanContributeTotal + (dmgCanContributeTotal/2 + Math.floor(Math.random() * (dmgCanContributeTotal/2)));
      battle.boss.health = newHealth;
    }

    await battle.save();

    // Notify the channel
    const embed = new EmbedBuilder()
    .setDescription(`# 🚨🔥 Battle Started!\nThe battle against ${battle.boss.emoji} **${battle.boss.typeId}** has begun! Good luck to all participants.${(battle.boss.health/battle.players.length < battle.players.length * 100) ? "\n-# \`⚠️🏺 Oh no, boss used a special potion, new health: ❤️ " + (newHealth) + "\`": ""}`)
    .setImage(battle.boss.image)
    .setColor('#7fe4da');

    const embed2 = new EmbedBuilder()
    .setDescription(`Use \`kas use p1|p2\` or \`/skyraid use p1|p2\` to unleash powers from your __chosen dragon__ against **the boss**. Use \`kas current\` to view your ***dragon, powers, and health***. Remain on the battleground! 🐲`);

    await interaction.editReply({
      embeds: [embed, embed2]
    });

    // Start the battle loop
    startBattleLoop(interaction.guild.id, interaction.channel.id);
  }
};