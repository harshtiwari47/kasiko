import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MessageFlags
} from "discord.js";
import User from "../../../models/User.js";
import UserGuild from "../../../models/UserGuild.js"; // Import the new model
import {
  client
} from "../../../bot.js";
import {
  Helper
} from "../../../helper.js";

// ... [handleMessage and other functions remain unchanged]
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    // For normal text-based usage
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function getTopUsers(userId, guildId = null, limit = 30) {
  try {
    if (guildId) {
      // Fetch top users by net worth within the guild

      const users = await UserGuild.aggregate([{
        $match: {
          guildId
        }
      }, // Filter for guild users
        {
          $lookup: {
            from: "users", // MongoDB collection name (lowercase plural by default)
            localField: "userId",
            foreignField: "id",
            as: "userData"
          }
        },
        {
          $unwind: "$userData"
        }, // Convert array into object
        {
          $sort: {
            "userData.networth": -1
          }
        },
        {
          $limit: limit
        },
        {
          $project: {
            userId: 1,
            guildId: 1,
            networth: "$userData.networth",
            cash: "$userData.cash",
            level: "$userData.level"
          }
        }]);

      const user = await User.findOne({
        "id": userId
      }).select("networth");

      if (!user) {
        return {
          users,
          userRank: "Unranked",
        };
      }

      const userRank = (await UserGuild.aggregate([{
        $match: {
          guildId
        } // Filter for guild users
      },
        {
          $lookup: {
            from: "users", // Join with 'users' collection
            localField: "userId",
            foreignField: "id",
            as: "userData"
          }
        },
        {
          $unwind: "$userData" // Convert array to object
        },
        {
          $match: {
            "userData.networth": {
              $gt: user.networth
            } // Compare net worth
          }
        },
        {
          $count: "rank" // Count users with higher net worth
        }]))?.[0]?.rank + 1 ?? 0; // Default rank to 0 if undefined


      return {
        users,
        userRank
      };
    } else {
      // Existing global ranking logic
      const users = await User.find({})
      .sort({
        networth: -1
      })
      .limit(limit)
      .select("id networth cash level");

      const user = await User.findOne({
        id: userId
      }).select("networth");

      if (!user) {
        return {
          users,
          userRank: "Unranked",
        };
      }

      const userRank = (await User.countDocuments({
        networth: {
          $gt: user.networth
        }
      })) + 1;

      return {
        users,
        userRank,
      };
    }
  } catch (error) {
    console.error("Error fetching top users and rank:", error);
    throw error;
  }
}

async function createLeaderboardEmbed( {
  userId, page = 1, guildId = null
}) {
  try {
    const itemsPerPage = 10;
    const {
      users,
      userRank
    } = await getTopUsers(userId, guildId, itemsPerPage * 3); // Fetch top 30

    if (users.length === 0) {
      return {
        embed: new ContainerBuilder()
        .setAccentColor(0xed971e)
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`### <:trophy:1352897371595477084> 𝗡𝗘𝗧𝗪𝗢𝗥𝗧𝗛 𝗟𝗘𝗔𝗗𝗘𝗥𝗕𝗢𝗔𝗥𝗗`)
        )
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`No users found!`)
        )
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`Your position is: Not ranked`)
        ),
        totalPages: 1,
      };
    }

    // Pagination logic
    let totalPages = Math.ceil(users.length / itemsPerPage);
    if (totalPages === 0) totalPages = 1; // Ensure at least one page

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentUsers = users.slice(start, end);

    // Build the leaderboard string
    let leaderboard = "";
    for (const [index, user] of currentUsers.entries()) {
      let userDetails;
      try {
        userDetails = await client.users.fetch(user.userId || user.id); // Adjust based on model
      } catch (err) {
        userDetails = {
          username: "Unknown User"
        };
      }

      let userIndex = ((page - 1) * 10) + index + 1;
      let posIcon = userIndex < 11 ? "<:lighting_icon_kasiko:1354393463931670568>": "<:lighting_icon_kasiko:1354393463931670568>";

      if (userIndex === 1) posIcon = "<:throne:1350387076834791486>";
      if (userIndex === 2) posIcon = "🥈";
      if (userIndex === 3) posIcon = "🥉";

      const globalRank = start + index + 1;
      leaderboard += `${userIndex === 1 ? "## ": userIndex === 2 ? "### ": userIndex === 3 ? "### ": ""}**${posIcon}** **${userDetails.username}** - <:kasiko_coin:1300141236841086977> **\`${Number(user?.networth?.toFixed(1) || 0).toLocaleString()}\`**\n`;
    }

    // Find the position of the command invoker
    const userPosition = userRank && userRank <= itemsPerPage * 3 ? userRank: userRank || "Unranked";

    // Create the embed
    const embed = new ContainerBuilder()
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`### <:trophy:1352897371595477084> 𝗡𝗘𝗧𝗪𝗢𝗥𝗧𝗛 𝗟𝗘𝗔𝗗𝗘𝗥𝗕𝗢𝗔𝗥𝗗`)
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(` ִֶָ𓂃 ࣪˖ ִֶָ\n${leaderboard}`)
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`𝘗𝘢𝘨𝘦 ${page}/${totalPages} | 𝘠𝘰𝘶𝘳 𝘱𝘰𝘴𝘪𝘵𝘪𝘰𝘯: ${userPosition > 0 ? userPosition: "Not ranked"}`)
    )

    return {
      embed,
      totalPages
    };
  } catch (error) {
    console.error("Oops! An error occurred while generating the leaderboard", error);
    return {
      embed: new ContainerBuilder()
      .setAccentColor(0xed971e)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# An error occurred while generating the leaderboard.`)
      ),
      totalPages: 1,
    };
  }
}

function createActionRow( {
  isServerFiltered, currentPage, totalPages
}) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId("previous")
    .setLabel("◀")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(currentPage === 1),
    new ButtonBuilder()
    .setCustomId("next")
    .setLabel("▶")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(currentPage === totalPages),
    new ButtonBuilder()
    .setCustomId("server")
    .setLabel(isServerFiltered ? "GLOBAL": "SERVER")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(false)
    .setEmoji({
      id: isServerFiltered ? "1392106326816985089": "1392106814664999024"
    })
  );
}

export async function leaderboard(context) {
  try {
    const userId = context.user ? context.user.id: context.author.id; // Support for both interactions and messages
    const guildId = context.guild?.id || null; // Current guild/server ID

    // Initial state
    let currentPage = 1;
    let isServerFiltered = false;

    // Create the initial embed and get totalPages
    let {
      embed: initialEmbed,
      totalPages
    } = await createLeaderboardEmbed( {
        userId,
        page: currentPage,
        guildId: isServerFiltered ? guildId: null,
      });

    // Create the initial action row with currentPage and totalPages
    let actionRow = createActionRow( {
      isServerFiltered,
      currentPage,
      totalPages,
    });

    // Send the initial message using handleMessage
    const messageData = {
      components: [initialEmbed,
        actionRow],
      flags: MessageFlags.IsComponentsV2
    };
    const sentMessage = await handleMessage(context, messageData);

    // Create a message component collector
    const filter = (interaction) => {
      if (interaction.isButton()) {
        // Ensure only the command invoker can interact
        const invokerId = context.user ? context.user.id: context.author.id;
        return interaction.user.id === invokerId;
      }
      return false;
    };

    const collector = sentMessage.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 3 * 60 * 1000, // 3 minutes
    });

    collector.on("collect", async (interaction) => {
      try {
        await interaction.deferUpdate(); // Acknowledge the interaction

        switch (interaction.customId) {
          case "previous":
            if (currentPage > 1) currentPage--;
            break;
          case "next":
            if (currentPage < totalPages) currentPage++;
            break;
          case "server":
            isServerFiltered = !isServerFiltered;
            currentPage = 1; // Reset to first page when filter changes
            break;
          default:
            break;
        }

        // Re-fetch the embed and totalPages after state changes
        const {
          embed: updatedEmbed,
          totalPages: newTotalPages
        } = await createLeaderboardEmbed( {
            userId,
            page: currentPage,
            guildId: isServerFiltered ? guildId: null,
          });

        // Update totalPages in case it has changed due to filtering
        totalPages = newTotalPages;

        // Create the updated action row with new currentPage and totalPages
        const updatedActionRow = createActionRow( {
          isServerFiltered,
          currentPage,
          totalPages,
        });

        // Edit the original message with the new embed and action row
        await sentMessage.edit({
          components: [updatedEmbed, updatedActionRow],
          flags: MessageFlags.IsComponentsV2
        })
      } catch (e) {
        if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
          console.error(e);
        }
      }
    });

    collector.on("end",
      async () => {
        // Disable all buttons after the collector ends
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("◀")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId("next")
          .setLabel("▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId("server")
          .setLabel(isServerFiltered ? "Global": "Server")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
        );

        if (!sentMessage?.edit) return;
        // Edit the message to disable buttons
        await sentMessage.edit({
          components: [initialEmbed, disabledRow],
          flags: MessageFlags.IsComponentsV2
        });
      });
  } catch (error) {
    console.error("Error fetching leaderboard:",
      error);
    await handleMessage(context,
      {
        content: "Oops! Something went wrong while fetching the leaderboard!",
      });
  }
}

// Export the command module
export default {
  name: "leaderboard",
  description:
  "Displays the top 30 current global or server-specific leaderboard rankings according to users' net worth.",
  aliases: ["top", "ranking", "lb"],
  args: "",
  emoji: "<:throne:1350387076834791486>",
  example: ["leaderboard"],
  related: ["leaderboard", "profile", "stat"],
  cooldown: 10000, // Cooldown of 10 seconds
  category: "📰 Information",

  execute: (args,
    context) => {
    // Call the leaderboard function to display the current leaderboard
    return leaderboard(context);
  },
};