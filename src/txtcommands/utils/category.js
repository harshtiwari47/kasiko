import Server from "../../../models/Server.js";
import {
  PermissionsBitField,
  ChannelType,
  EmbedBuilder
} from "discord.js";
import redisClient from "../../../redis.js";

import {
  categoryMappings
} from "../../categories.js";

export default {
  name: "category",
  description: "Enable or disable the bot for specific categories.",
  aliases: [],
  example: [
    "category on all",
    "category off battle",
    "category on fun",
    "category off all"
  ],
  category: "🔧 Utility",
  cooldown: 10000,
  execute: async (args, message) => {
    try {
      // Check if the user has moderator permissions
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.channel.send("❌ You need `Manage Server` permissions to run this command.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Load the server doc from Mongo
      const serverId = message.guild.id;
      let serverDoc = await Server.findOne({
        id: serverId
      });

      if (!serverDoc) {
        serverDoc = new Server( {
          id: serverId,
          name: message.guild.name,
          ownerId: message.guild.ownerId,
          permissions: 'restricted_channels',
          channels: [],
        });
      }

      // Extract sub-command and category input
      const subCommand = args[1]?.toLowerCase(); // e.g., "on" or "off"
      const categoryInput = args[2]?.toLowerCase(); // e.g., "fun", "all", etc.

      // Find or create channel info in serverDoc
      let channelIndex = serverDoc.channels.findIndex((ch) => ch.id === message.channel.id);
      let currentChannel;

      if (channelIndex !== -1) {
        currentChannel = serverDoc.channels[channelIndex];
      } else {
        serverDoc.channels.push({
          id: message.channel.id,
          name: message.guild.channels.cache.get(message.channel.id)?.name || "unknown",
          isAllowed: true,
          category: {
            allAllowed: true,
            notAllowedCategories: [],
          }
        });
        currentChannel = serverDoc.channels[serverDoc.channels.length - 1];
      }

      // Helper function to generate an Embed showing current category statuses
      const getCategoryStatusEmbed = () => {
        const embed = new EmbedBuilder()
        .setTitle("Category Settings")
        .setDescription(`Below is a list of all categories and their current status in **#${currentChannel.name}**.`)
        .setColor("#2F3136"); // Choose an embed color of your preference

        // Construct the list of categories with status icons
        const fields = Object.entries(categoryMappings).map(([key, value]) => {
          if (value === "all") return null; // "all" is a special category—skip it in the listing

          // If channel's "allAllowed" is true and category is not in notAllowedCategories => ✅
          // Otherwise => ❌
          let isEnabled = currentChannel.category.allAllowed &&
          !currentChannel.category.notAllowedCategories.includes(value);

          // If allAllowed is false, we also check whether this category is in notAllowedCategories
          if (!currentChannel.category.allAllowed) {
            isEnabled = !currentChannel.category.notAllowedCategories.includes(value);
          }

          return {
            name: value,
            value: isEnabled ? "✅ Enabled": "❌ Disabled",
            inline: true,
          };
        }).filter(Boolean);

        embed.addFields(fields);
        return embed;
      };

      // If subCommand is missing or invalid, show the user a help embed + usage
      if (!subCommand || !["on", "off"].includes(subCommand) || !categoryInput) {
        // Send an embed with the current category statuses
        const embed = getCategoryStatusEmbed();

        const helpEmbed = new EmbedBuilder()
        .setDescription("𝗠𝗮𝗻𝗮𝗴𝗲 𝗞𝗮𝘀𝗶𝗸𝗼 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝗶𝗲𝘀\n" +
          "`category on <category>` - Enable the bot for a specific category in this channel.\n" +
          "`category off <category>` - Disable the bot for a specific category in this channel.\n\n" +
          "Examples:\n" +
          "`category on all`\n" +
          "`category off fun`\n\n"
        )
        .setFooter({
          text: "Use `channel` to manage channel settings!"
        })

        // Provide usage/help in the content property
        return message.channel.send({
          embeds: [helpEmbed, embed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // If we reached here, we have a valid subCommand ("on"/"off") and a categoryInput
      const categoryName = categoryMappings[categoryInput];
      if (!categoryName) {
        // invalid category => show the help embed again
        const embed = getCategoryStatusEmbed();
        return message.channel.send({
          content: `❌ Invalid category: \`${categoryInput}\`. Please provide a valid category.`,
          embeds: [embed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // "allowedFlag" is true if we're enabling a category, false if disabling.
      const allowedFlag = subCommand === "on";

      if (categoryName === "all") {
        // "all" means turn on/off ALL categories in this channel
        if (allowedFlag) {
          // "category on all": Allow bot in all categories
          currentChannel.category.allAllowed = true;
          currentChannel.category.notAllowedCategories = [];
        } else {
          // "category off all": Disallow bot in all categories
          currentChannel.category.allAllowed = false;
          currentChannel.category.notAllowedCategories = Object.values(categoryMappings).filter((cat) => cat !== "all");
        }

        await serverDoc.save();

        try {
          const serverKey = `server:${message.guild.id}`;
          const cachedServer = await redisClient.get(serverKey);
          if (cachedServer) {
            await redisClient.del(serverKey);
          }
        } catch (e) {
          console.error("Failed to clear Redis cache:", e);
        }

        return message.channel.send(
          `✅ The bot is now **${allowedFlag ? "ALLOWED": "NOT ALLOWED"}** in **all** categories for this channel.`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Update a specific category
      if (allowedFlag) {
        // Enabling this category => remove from "notAllowedCategories"
        currentChannel.category.notAllowedCategories = currentChannel.category.notAllowedCategories.filter(
          (cat) => cat !== categoryName
        );
      } else {
        // Disabling this category => add to "notAllowedCategories"
        if (!currentChannel.category.notAllowedCategories.includes(categoryName)) {
          currentChannel.category.notAllowedCategories.push(categoryName);
        }
      }

      // If there are no categories in `notAllowedCategories`, we consider `allAllowed` = true
      if (currentChannel.category.notAllowedCategories.length === 0) {
        currentChannel.category.allAllowed = true;
      } else {
        currentChannel.category.allAllowed = false;
      }

      await serverDoc.save();

      // Invalidate Redis cache if present
      try {
        const serverKey = `server:${message.guild.id}`;
        const cachedServer = await redisClient.get(serverKey);
        if (cachedServer) {
          await redisClient.del(serverKey);
        }
      } catch (e) {
        console.error("Failed to clear Redis cache:", e);
      }

      // Finally, let the user know the update was successful
      return message.channel.send(
        `✅ The bot is now **${allowedFlag ? "ALLOWED": "NOT ALLOWED"}** in the \`${categoryName}\` category for this channel.`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
      const botPermissions = message.channel.permissionsFor(message.client.user);
      if (botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
        return message.channel.send("❌ An error occurred while updating the category settings.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    }
  },
};