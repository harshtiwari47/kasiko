import {
  PermissionsBitField,
  ChannelType
} from "discord.js";
import Server from "../../../models/Server.js";
import redisClient from "../../../redis.js";

export default {
  name: "channel",
  description: "Enable or disable the bot in a channel or all channels.",
  aliases: [],
  // e.g. usage: channel off all, channel on all, channel off #general, channel on #general
  example: [
    "channel off all",
    "channel on all",
    "channel off|on #some-channel",
    "channel off|on"
  ],
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      // Check if the user has moderator permissions
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.channel.send("❌ You need `Manage Server` permissions to run this command.");
      }

      // Load the server doc from Mongo
      const serverId = message.guild.id;
      let serverDoc = await Server.findOne({
        id: serverId
      });

      if (!serverDoc) {
        // Create if it doesn't exist
        serverDoc = new Server( {
          id: serverId,
          name: message.guild.name,
          ownerId: message.guild.ownerId,
          permissions: 'restricted_channels', // By default or your logic
          channels: [],
        });
      }

      // Make sure we operate in "restricted_channels" mode
      // so that `isAllowed=false` actually means something.
      // If you always want to restrict, forcibly set it:
      serverDoc.permissions = 'restricted_channels';

      const subCommand = args[1]?.toLowerCase(); // e.g. "off" or "on"
      let target = args[2]?.toLowerCase(); // e.g. "all" or a channel mention

      if (!subCommand || !["on", "off"].includes(subCommand)) {
        const currentChannelStatus = serverDoc.channels.find(ch => ch.id === message.channel.id)?.isAllowed;
        return message.channel.send(
          `Please specify \`on\` or \`off\`, e.g. \`channel on all\` or \`channel off #channel\`.\n\n` +
          `★ **Current channel status:** Bot is **${currentChannelStatus ? "ALLOWED": "NOT ALLOWED"}** in this channel.`
        );
      }

      if (!target) {
        target = message.channel.id;
      }

      // Helper function: set isAllowed in the embedded doc
      const updateChannelAllowance = (channelId, allowed) => {
        const idx = serverDoc.channels.findIndex((ch) => ch.id === channelId);
        if (idx === -1) {
          // Channel not in doc - add it
          serverDoc.channels.push({
            id: channelId,
            name: message.guild.channels.cache.get(channelId)?.name || "unknown",
            isAllowed: allowed,
          });
        } else {
          // Update existing
          serverDoc.channels[idx].isAllowed = allowed;
        }
      };

      if (target === "all") {
        // Enable/disable the bot in ALL channels
        const allowed = subCommand === "on"; // on -> true, off -> false
        // For each channel in the guild, update or insert
        message.guild.channels.cache.forEach((ch) => {
          // Only text channels
          if (ch.type === ChannelType.GuildText) {
            updateChannelAllowance(ch.id, allowed);
          }
        });
        await serverDoc.save();
        return message.channel.send(
          `All text channels have been set to **${allowed ? "ALLOWED": "NOT ALLOWED"}** for the bot.`
        );
      }

      // Otherwise, the user wants to enable/disable a specific channel
      // Typically they mention it like "#general"
      // So we can parse that mention to get the channel ID:
      let channelMention = message.mentions.channels.first();
      if (!channelMention) {
        channelMention = message.channel;
      }

      // Example: user typed "channel off #general"
      // channelMention.id is the actual Snowflake
      const allowedFlag = subCommand === "on";
      updateChannelAllowance(channelMention.id, allowedFlag);
      await serverDoc.save();

      try {
        const serverKey = `server:${message.guild.id}`;
        const cachedServer = await redisClient.get(serverKey);
        if (cachedServer) {
          await redisClient.del(serverKey);
        }
      } catch (e) {}

      return message.channel.send(
        `Bot has been set to **${allowedFlag ? "ALLOWED": "NOT ALLOWED"}** in ${channelMention.toString()}.`
      );
    } catch (e) {
      console.error(e);
      const botPermissions = message.channel.permissionsFor(message.client.user);
      if (botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
        return message.channel.send("❌ An error occurred while toggling the bot in channel(s).");
      }
    }
  },
};