import {
  SlashCommandBuilder
} from 'discord.js';
import Battle from '../../../models/Battle.js';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ComponentType
} from 'discord.js';
import {
  PermissionsBitField
} from 'discord.js';

import {
  client
} from "../../../bot.js";

import SkyraidUsers from '../../../models/SkyraidUsers.js';
import SkyraidGuilds from '../../../models/SkyraidGuilds.js';

export default {
  /**
  * Executes the cancel command.
  * @param {Interaction} interaction - The command interaction.
  * @param {Client} client - The Discord client instance.
  */
  execute: async (interaction) => {
    if (interaction.replied || interaction.deferred) return; // Do not reply again

    // Defer the reply immediately to indicate processing
    await interaction.deferReply();

    // Find the battle with status 'waiting' for this guild
    const battle = await Battle.findOne({
      guildId: interaction.guild.id, status: 'waiting'
    });

    if (!battle) {
      return interaction.followUp({
        content: 'ℹ️ There is no ongoing battle to cancel.',
        ephemeral: true
      });
    }

    try {
      const guildId = interaction.guild.id;
      let guild = await SkyraidGuilds.findOne({
        guildId
      });

      if (!guild) {
        // If guild doesn't exist, create a new record
        guild = new SkyraidGuilds( {
          guildId,
          totalMatches: 1,
          matchesWon: 0,
          matchesCancelled: 1,
          bossDefeated: {
            'Dusk Talon': 0,
            'Shadow Spire': 0,
            'Infernal Ember': 0,
            'Azure Fang': 0,
          },
          players: [],
          badges: [],
        });
      } else {
        // Update existing guild
        guild.matchesCancelled += 1;
      }
      // Check for Manage Server permission
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        if ((!guild.startRoleId) || (guild.startRoleId && !interaction.member.roles.cache.has(guild.startRoleId))) {
          return interaction.followUp({
            content: 'You do not have permission to use this command.', ephemeral: true
          });
        }
      }

      await guild.save();
    } catch (error) {
      console.error('Error updating guild stats:', error);
    }

    // Update the battle status to 'cancelled'
    battle.status = 'cancelled';
    await battle.save();

    // Create an embed message to notify the channel about the cancellation
    const cancelEmbed = new EmbedBuilder()
    .setTitle('❌ Battle Cancelled')
    .setDescription(`The scheduled server-wide battle against the **${battle.boss.typeId}** dragon boss has been officially cancelled. This decision was made by <@${interaction.user.id}>.`)
    .setTimestamp();

    // Send the embed message to the channel
    await interaction.followUp({
      embeds: [cancelEmbed]
    });

    if (battle.messageId) {
      try {
        const channel = await client.channels.fetch(battle.channelId);
        if (channel && channel.isTextBased()) {
          const battleMessage = await channel.messages.fetch(battle.messageId);
          if (battleMessage) {
            // Clone the existing action rows and disable all buttons
            const disabledComponents = battleMessage.components.map(actionRow => {
              // Use ActionRowBuilder.from to properly clone the action row
              const newActionRow = ActionRowBuilder.from(actionRow);
              newActionRow.components = newActionRow.components.map(component => {
                if (component.type === ComponentType.Button) {
                  // Clone the button and disable it
                  return ButtonBuilder.from(component).setDisabled(true);
                }
                return component;
              });
              return newActionRow;
            });

            // Edit the message to disable the buttons
            await battleMessage.edit({
              components: disabledComponents
            });
          }
        }
      } catch (error) {
        console.error('Failed to disable registration buttons:', error);
      }
    }

    await Battle.findByIdAndDelete(battle._id);
  }
};