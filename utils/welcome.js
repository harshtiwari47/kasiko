import {
  EmbedBuilder
} from 'discord.js';
import Server from '../models/Server.js';
import {
  client
} from "../bot.js";
import {
  InteractionType,
  PermissionsBitField,
  ChannelType
} from 'discord.js';

const WelcomeMsg = {
  name: 'guildCreate',
  async execute(guild) {
    try {

      if (!guild.members.me) {
        console.error('Bot member not found in the guild.');
        return;
      }

      const requiredPermissions = [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.UseExternalEmojis,
        PermissionsBitField.Flags.UseExternalStickers,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.UseApplicationCommands,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.ReadMessageHistory,
      ];

      const welcomeChannel = guild.channels.cache.find(channel => {
        if (channel.type === ChannelType.GuildText) {
          const permissions = channel.permissionsFor(guild.members.me);
          if (permissions) {
            const missingPermissions = requiredPermissions.filter(perm => !permissions.has(perm));
            if (missingPermissions.length === 0) return true;
          }
          return false;
        }
        return false;
      });

      if (welcomeChannel) {
        const serverId = guild.id;
        const serverName = guild.name;
        const serverOwnerId = guild.ownerId;

        const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Thank you for inviting me!')
        .setDescription(
          `Hello **${guild.name}**! I'm here to assist with games, utilities, and more.\n\n` +
          `To start using me, type \`kas help\` or use the \`/help\` command for guidance.`
        )
        .addFields(
          {
            name: '**Important Links**',
            value:
            `[Terms and Conditions](https://kasiko-bot.vercel.app/terms.html) | ` +
            `[Support](https://kasiko-bot.vercel.app/contact.html)`
          },
          {
            name: '**Getting Started**',
            value:
            `- Start commands with \`kas\` (e.g., \`kas help\`).\n` +
            `- Use \`kas help <command>\` for details on specific commands.`
          }
        )
        .setFooter({
          text: 'Welcome aboard! Let’s make this journey exciting.',
          iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png',
        })
        .setTimestamp();

        const existingServer = await Server.findOne({
          id: serverId
        });

        try {
          let newServer;

          if (!existingServer) {
            newServer = new Server( {
              id: serverId,
              name: serverName,
              ownerId: serverOwnerId,
              allChannelsAllowed: true,
              channels: [],
            });

            await newServer.save()
          }

        } catch (e) {
          console.error(e);
          return;
        }

        try {
          let welcomemsg = await welcomeChannel.send({
            embeds: [embed]
          });
          return;
        } catch (e) {
          console.error(e);
          return;
        }
      } else {
        console.warn(`No accessible text channel found in guild: ${guild.name} (${guild.id})`);
        return;
      }
      return;
    } catch (e) {
      console.error(`Unexpected error in guildCreate handler for guild ${guild.id}:`, error);
      return;
    }
  },
};

export default WelcomeMsg;