/*
import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  PermissionsBitField
} from 'discord.js';
import Server from '../../../models/Server.js';

export default {
  data: new SlashCommandBuilder()
  .setName('manage-bot')
  .setDescription('Manage the bot permissions for specific channels.')
  .addSubcommand(subcommand =>
    subcommand
    .setName('list')
    .setDescription('List all channels and their bot status.'))
  .addSubcommand(subcommand =>
    subcommand
    .setName('allow')
    .setDescription('Enable the bot for a specific channel.')
    .addChannelOption(option =>
      option
      .setName('channel')
      .setDescription('The channel to enable the bot in.')
      .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
    .setName('disallow')
    .setDescription('Disable the bot for a specific channel.')
    .addChannelOption(option =>
      option
      .setName('channel')
      .setDescription('The channel to disable the bot in.')
      .setRequired(true))),
  async execute(interaction) {
    try {
      // Acknowledge the interaction immediately to avoid expiration
      await interaction.deferReply({
        ephemeral: true
      });

      // Check if the user has administrative privileges
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.editReply({
          content: '❌ You do not have the required permissions to use this command.',
        });
      }

      // Get the subcommand
      const subcommand = interaction.options.getSubcommand();

      // Get the server (guild) information
      const serverId = interaction.guild.id;
      const serverName = interaction.guild.name;
      const serverOwnerId = interaction.guild.ownerId;

      // Find or create the server in the database
      let server = await Server.findOne({
        id: serverId
      });
      if (!server) {
        server = new Server( {
          id: serverId,
          name: serverName,
          ownerId: serverOwnerId,
          allChannelsAllowed: true,
          channels: [],
        });
      }

      const channelTypeMap = {
        0: 'text',
        // Discord text channel
        2: 'voice',
        // Discord voice channel
        4: 'category',
        // Discord category
      };

      if (subcommand === 'allow' || subcommand === 'disallow') {
        // Get the target channel
        const targetChannel = interaction.options.getChannel('channel');
        if (!targetChannel) {
          return interaction.editReply({
            content: '❌ Invalid channel selected.'
          });
        }

        // Map the channel type
        const mappedType = channelTypeMap[targetChannel.type];
        if (!mappedType) {
          return interaction.editReply({
            content: '❌ Unsupported channel type.'
          });
        }

        // Update permissions and database
        const isAllowed = subcommand === 'allow';
        const existingChannel = server.channels.find((ch) => ch.id === targetChannel.id);

        if (existingChannel) {
          existingChannel.isAllowed = isAllowed;
        } else {
          server.channels.push({
            id: targetChannel.id,
            name: targetChannel.name,
            type: mappedType,
            isAllowed,
          });
        }

        // If first block, switch from all_channels to restricted
        if (server.allChannelsAllowed && subcommand === 'disallow') {
          server.allChannelsAllowed = false;
        }

        // Save the server data
        await server.save();

        // Update bot permissions
        await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          SendMessages: isAllowed,
        });

        return interaction.editReply({
          content: `✅ Bot has been ${isAllowed ? 'enabled': 'disabled'} for channel: ${targetChannel.name}.`,
        });
      }

      if (subcommand === 'list') {
        const allowedChannels = server.allChannelsAllowed
        ? 'All channels are allowed.': server.channels
        .filter((ch) => ch.isAllowed)
        .map((ch) => `• ${ch.name} (${ch.type})`)
        .join('\n') || 'None';

        const disallowedChannels = server.allChannelsAllowed
        ? 'None': server.channels
        .filter((ch) => !ch.isAllowed)
        .map((ch) => `• ${ch.name} (${ch.type})`)
        .join('\n') || 'None';

        return interaction.editReply({
          embeds: [{
            title: 'Bot Channel Management',
            fields: [{
              name: 'Allowed Channels', value: allowedChannels
            },
              {
                name: 'Disallowed Channels', value: disallowedChannels
              },
            ],
            color: 0x00ff00,
          },
          ],
        });
      }

      // Unknown subcommand
      return interaction.editReply({
        content: '❌ Unknown subcommand.',
      });
    } catch (error) {
      console.error(`Error executing command manage-bot: ${error}`);
      return interaction.editReply({
        content: '❌ An error occurred while processing the command.',
      });
    }
  }
};

*/