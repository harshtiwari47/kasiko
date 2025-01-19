import Server from "../../../models/Server.js";
import {
  PermissionsBitField,
  ChannelType
} from "discord.js";

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
        serverDoc = new Server( {
          id: serverId,
          name: message.guild.name,
          ownerId: message.guild.ownerId,
          permissions: 'restricted_channels',
          channels: [],
        });
      }

      const subCommand = args[1]?.toLowerCase(); // e.g., "on" or "off"
      const categoryInput = args[2]?.toLowerCase(); // e.g., "fun", "all", etc.

      if (!subCommand || !["on", "off"].includes(subCommand)) {
        return message.channel.send("Please specify `on` or `off`, e.g., `category on all` or `category off fun`.");
      }

      if (!categoryInput) {
        return message.channel.send("Please specify a category, e.g., `fun` or `all`.");
      }

      // Map user inputs to category names
      const categoryMappings = {
        fun: "🧩 Fun",
        economy: "🏦 Economy",
        utility: "🔧 Utility",
        battle: "⚓ Battle",
        explore: "🍬 Explore",
        shop: "🛍️ Shop",
        user: "👤 User",
        games: "🎲 Games",
        hunt: "🦌 Hunt",
        ocean: "🌊 Ocean Life",
        skyraid: "🐉 Skyraid",
        information: "📰 Information",
        all: "all",
      };

      const categoryName = categoryMappings[categoryInput];
      if (!categoryName) {
        return message.channel.send(`❌ Invalid category: \`${categoryInput}\`. Please provide a valid category.`);
      }

      const allowedFlag = subCommand === "on";

      let channelIndex = serverDoc.channels.findIndex((ch) => ch.id === message.channel.id);
      let currentChannel;

      if (channelIndex !== -1) {
        currentChannel = serverDoc.channels[channelIndex]
      } else {
        serverDoc.channels.push({
          id: message.channel.id,
          name: message.guild.channels.cache.get(channelId)?.name || "unknown",
          isAllowed: true,
        });

        currentChannel = serverDoc.channels[serverDoc.channels.length - 1]
      }

      if (categoryName === "all") {
        if (!allowedFlag) {
          // "category off all": Disallow bot in all categories
          currentChannel.category = {
            allAllowed: false,
            notAllowedCategories: Object.values(categoryMappings).filter((cat) => cat !== "all"),
          };
        } else {
          // "category on all": Allow bot in all categories
          currentChannel.category = {
            allAllowed: true,
            notAllowedCategories: []
          };
        }

        await serverDoc.save();
        return message.channel.send(
          `✅ The bot is now **${allowedFlag ? "ALLOWED": "NOT ALLOWED"}** in all categories.`
        );
      }

      // Update specific category
      if (allowedFlag) {
        // Remove from `notAllowedCategories` if enabling
        currentChannel.category.notAllowedCategories = currentChannel.category.notAllowedCategories.filter(
          (cat) => cat !== categoryName
        );
      } else {
        // Add to `notAllowedCategories` if disabling
        if (!currentChannel.category.notAllowedCategories.includes(categoryName)) {
          currentChannel.category.notAllowedCategories.push(categoryName);
        }
      }

      if (currentChannel.category.notAllowedCategories.length === 0) {
        currentChannel.category.allAllowed = true; // Specific categories take precedence
      } else {
        currentChannel.category.allAllowed = false; // Specific categories take precedence
      }
      await serverDoc.save();

      return message.channel.send(
        `✅ The bot is now **${allowedFlag ? "ALLOWED": "NOT ALLOWED"}** in the \`${categoryName}\` category.`
      );
    } catch (e) {
      console.error(e);
      return message.channel.send("❌ An error occurred while updating the category settings.");
    }
  },
};