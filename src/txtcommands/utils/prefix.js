import {
  EmbedBuilder
} from "discord.js";
import redisClient from "../../../redis.js";
import Server from '../../../models/Server.js';
import {
  PermissionsBitField
} from 'discord.js';


export default {
  name: "prefix",
  description: "Set a custom prefix for the bot in the server.",
  aliases: ["changeprefix"],
  cooldown: 5000,
  example: ["prefix",
    "prefix <custom prefix>"],
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      args.shift();
      // Check if the user has moderator permissions
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.reply("❌ You need `Manage Server` permissions to set a custom prefix.");
      }

      // Ensure an argument is provided
      const newPrefix = args[0];
      let prefix = "kas";
      if (!newPrefix) {
        const key = `prefixs:${message.guild.id}`;
        const customPrefix = await redisClient.get(key);

        if (customPrefix) {
          prefix = customPrefix;
        }
        return message.reply(`☕ The current prefix for **Kasiko** in this server is **${prefix}**`);
      }

      // Validate the new prefix (max 20 chars, no special characters, etc.)
      const prefixRegex = /^[a-zA-Z0-9,@#$_&\-+()/*"':;!?,.~`|=^]{1,20}$/;
      if (!prefixRegex.test(newPrefix)) {
        return message.reply(
          "❌ Prefix must be under 20 characters long and contain no special characters."
        );
      }

      const lowerCasePrefix = newPrefix.toLowerCase();
      const serverId = message.guild.id;
      const serverName = message.guild.name;
      const serverOwnerId = message.guild.ownerId;

      const key = `prefixs:${serverId}`;

      let newServer = await Server.findOne({
        id: serverId
      });

      try {
        if (!newServer) {
          newServer = new Server( {
            id: serverId,
            name: serverName,
            ownerId: serverOwnerId,
            allChannelsAllowed: true,
            channels: [],
            prefix: "kas"
          });
        }
      } catch (e) {
        console.error(e);
        return;
      }

      try {
        // Save the new prefix to Redis with a 3-month expiration
        await redisClient.set(key, lowerCasePrefix, {
          EX: 60
        });
        newServer.prefix = lowerCasePrefix;

        await newServer.save();

        // Confirmation message
        const embed = new EmbedBuilder()
        .setTitle("✅ Prefix Updated")
        .setDescription(
          `The prefix for this server has been set to:\n## **\`${lowerCasePrefix}\`**`
        )
        .setColor("#00FF00");

        await message.reply({
          embeds: [embed]
        });
      } catch (err) {
        console.error("Error setting prefix:", err);
        return message.reply("❌ An error occurred while setting the prefix. Please try again.");
      }
    } catch (e) {
      console.error(e);
    }
  },
};