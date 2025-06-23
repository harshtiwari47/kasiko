import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder
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

        const Container = new ContainerBuilder()
        .setAccentColor(0x95b9ea)
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`## Thank you for inviting me!`)
        )
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`-# Hello **${guild.name}** Explorer!\n-# Get ready to dive into a modern, vast economy world like no other – with 300+ exciting game commands waiting for you. Build. Compete. Conquer.\n-# Whether you're hunting, fishing, battling foes, or growing your empire, there's always something new to unlock. Join a thriving community, and let the games begin.`)
        )
        .addSeparatorComponents(separate => separate)
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`**Important Links**`)
        )
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`[Terms and Conditions](https://kasiko.vercel.app/terms.html) | ` +
            `[Support](https://kasiko.vercel.app/contact.html)`)
        )
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`**Getting Started**`)
        )
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`- Start commands with \`kas\` (e.g., \`kas help\`).\n` +
            `- Use \`kas help <command>\` for details on specific commands.`)
        )
        .addActionRowComponents([
          new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
            .setLabel("𝖲𝗎𝗉𝗉𝗈𝗋𝗍 𝖲𝖾𝗋𝗏𝖾𝗋")
            .setEmoji({
              id: "1355140550462017609"
            })
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.gg/DVFwCqUZnc"),
          )
        ])
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`-# Welcome aboard! Let’s make this journey exciting.`)
        )

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
            components: [Container],
            flags: MessageFlags.IsComponentsV2
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
      console.error(`Unexpected error in guildCreate handler for guild ${guild.id}:`, e.message);
      return;
    }
  },
};

export default WelcomeMsg;