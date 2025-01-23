import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';
import Server from '../../../models/Server.js';
import redisClient from "../../../redis.js";

export default {
  data: new SlashCommandBuilder()
  .setName('channel')
  .setDescription('Enable or disable the bot in a channel or all channels.')
  // Only allow users with "Manage Server" perms to use this command
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(option =>
    option
    .setName('action')
    .setDescription('Choose whether to turn the bot on or off in a channel.')
    .setRequired(true)
    .addChoices(
      {
        name: 'on', value: 'on'
      },
      {
        name: 'off', value: 'off'
      }
    )
  )
  .addChannelOption(option =>
    option
    .setName('target')
    .setDescription(
      'Select a channel to target. If omitted, it applies to the current channel.'
    )
    .addChannelTypes(
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement // Add more types if needed
    )
    .setRequired(false)
  ),

  async execute(interaction) {
    // Defer in case of any async DB work
    await interaction.deferReply({
      ephemeral: false
    });

    try {
      // Extract user choices
      const subCommand = interaction.options.getString('action'); // 'on' or 'off'
      const target = interaction.options.getChannel('target'); // "#general", etc.

      if (!interaction.guild || !(interaction.channel && interaction.channel.id)) {
        return await interaction.editReply(
          '❌ You are not allowed to use this command here!'
        );
      }

      // Fetch (or create) the Server document
      const serverId = interaction.guild.id;
      let serverDoc = await Server.findOne({
        id: serverId
      });
      if (!serverDoc) {
        serverDoc = new Server( {
          id: serverId,
          name: interaction.guild.name,
          ownerId: interaction.guild.ownerId,
          permissions: 'restricted_channels',
          channels: []
        });
      }

      // Force restricted_channels permission mode
      serverDoc.permissions = 'restricted_channels';

      // Helper to add/update isAllowed for a channel in the DB doc
      const updateChannelAllowance = (channelId, allowed) => {
        const idx = serverDoc.channels.findIndex(ch => ch.id === channelId);
        if (idx === -1) {
          // Channel not in doc yet
          serverDoc.channels.push({
            id: channelId,
            name: interaction.guild.channels.cache.get(channelId)?.name || 'unknown',
            isAllowed: allowed
          });
        } else {
          // Update existing
          serverDoc.channels[idx].isAllowed = allowed;
        }
      };

      const allowedFlag = subCommand === 'on'; // 'on' -> true, 'off' -> false

      // Otherwise, toggle for a specific channel
      // If user provided a mention like #general, parse that snowflake from the mention
      // If they didn’t provide anything, default to the current interaction channel
      let channelId;

      // Attempt to match a mention, e.g. "<#1234567890123456>"
      if (target && target.id) {
        channelId = target.id;
      } else {
        // No target means use the channel in which this slash cmd was used
        if (interaction.channel && interaction.channel.id) {
          channelId = interaction.channel.id;
        }
      }

      updateChannelAllowance(channelId, allowedFlag);
      await serverDoc.save();

      try {
        const serverKey = `server:${interaction.guild.id}`;
        const cachedServer = await redisClient.get(serverKey);
        if (cachedServer) {
          await redisClient.del(serverKey);
        }
      } catch (e) {}

      return await interaction.editReply({
        content: `Bot is now **${allowedFlag ? 'ALLOWED': 'NOT ALLOWED'}** in <#${channelId}>.`
      });
    } catch (err) {
      console.error('[channel command error]', err);
      return await interaction.editReply(
        '❌ An error occurred while toggling the bot in channel(s).'
      );
    }
  }
};