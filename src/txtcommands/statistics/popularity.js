import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import UserGuild from "../../../models/UserGuild.js";
import {
  client
} from "../../../bot.js";
import {
  Helper
} from "../../../helper.js";

// Helper to send a message or reply based on context
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

// Get top users based on server-specific popularity
async function getTopUsers(userId, guildId, limit = 30) {
  try {
    // Since popularity is only relevant in a server setting, we expect a valid guildId.
    if (!guildId) {
      throw new Error("Popularity leaderboard is only available in a guild/server context.");
    }

    // Fetch top users in the server sorted by the popularity field (highest first)
    const users = await UserGuild.aggregate([{
      $match: {
        guildId
      }
    },
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
      },
      {
        $sort: {
          "userData.popularity": -1
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          userId: 1,
          popularity: "$userData.popularity"
        }
      }]);

    // Fetch the current user's record in the server
    const userRecord = await UserGuild.findOne({
      userId, guildId
    }).select("popularity");

    if (!userRecord) {
      return {
        users,
        userRank: "Unranked",
      };
    }

    // Count how many users have a higher popularity value
    const higherCount = await UserGuild.countDocuments({
      guildId,
      popularity: {
        $gt: userRecord.popularity
      }
    });

    const userRank = higherCount + 1;

    return {
      users,
      userRank
    };
  } catch (error) {
    console.error("Error fetching top users (popularity):", error);
    throw error;
  }
}

// Create the popularity leaderboard embed
async function createLeaderboardEmbed( {
  userId, page = 1, guildId
}) {
  try {
    const itemsPerPage = 10;
    const {
      users,
      userRank
    } = await getTopUsers(userId, guildId, itemsPerPage * 3); // Top 30

    if (users.length === 0) {
      return {
        embed: new EmbedBuilder()
        .setColor("#ed971e")
        .setTitle(`<:trophy:1352897371595477084> 𝗦𝗘𝗥𝗩𝗘𝗥 𝗣𝗢𝗣𝗨𝗟𝗔𝗥𝗜𝗧𝗬  ✧`)
        .setDescription("No users found!")
        .setFooter({
          text: `Your position: Not ranked`
        }),
        totalPages: 1,
      };
    }

    let totalPages = Math.ceil(users.length / itemsPerPage);
    if (totalPages === 0) totalPages = 1;

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentUsers = users.slice(start, end);

    let leaderboard = "";
    for (const [index, user] of currentUsers.entries()) {
      let userDetails;
      try {
        userDetails = await client.users.fetch(user.userId);
      } catch (err) {
        userDetails = {
          username: "Unknown User"
        };
      }

      // Calculate user's overall rank based on their position in the paginated list.
      let userIndex = ((page - 1) * itemsPerPage) + index + 1;
      let posIcon = "<:pop_icon:123456789012345678>"; // replace with an appropriate popularity icon
      console.log(user.popularity)
      // Optionally show special icons for top positions.
      if (userIndex === 1) posIcon = "<:crown:123456789012345678>";
      else if (userIndex === 2) posIcon = "🥈";
      else if (userIndex === 3) posIcon = "🥉";

      leaderboard += `${userIndex === 1 ? "## ": userIndex === 2 ? "### ": userIndex === 3 ? "### ": ""}**${posIcon}** **${userDetails.username}** - <:popularity:1359565087341543435> **\`${Number(user.popularity?.toFixed(1) || 0).toLocaleString()}\`**\n`;
    }

    const userPosition = userRank && typeof userRank === "number" ? userRank: "Unranked";

    const embed = new EmbedBuilder()
    .setTitle(`<:trophy:1352897371595477084> 𝗦𝗘𝗥𝗩𝗘𝗥 𝗣𝗢𝗣𝗨𝗟𝗔𝗥𝗜𝗧𝗬  ✧`)
    .setDescription(leaderboard)
    .setFooter({
      text: `Page ${page}/${totalPages} | Your position: ${userPosition}`
    });

    return {
      embed,
      totalPages
    };
  } catch (error) {
    console.error("Error generating popularity leaderboard embed:", error);
    return {
      embed: new EmbedBuilder()
      .setColor("#ed971e")
      .setTitle("Error")
      .setDescription("An error occurred while generating the popularity leaderboard.")
      .setTimestamp(),
      totalPages: 1,
    };
  }
}

// Create an action row with navigation buttons for the leaderboard
function createActionRow( {
  currentPage, totalPages
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
    .setDisabled(currentPage === totalPages)
  );
}

// Main function to execute the popularity leaderboard command.
export async function popularity(context) {
  try {
    // Get the invoker's userId and require a guild context.
    const userId = context.user ? context.user.id: context.author.id;
    const guildId = context.guild?.id;
    if (!guildId) {
      return handleMessage(context, {
        content: "This command can only be used in a server."
      });
    }

    let currentPage = 1;

    // Create the initial embed and calculate total pages.
    let {
      embed: initialEmbed,
      totalPages
    } = await createLeaderboardEmbed( {
        userId,
        page: currentPage,
        guildId,
      });

    let actionRow = createActionRow( {
      currentPage, totalPages
    });

    const messageData = {
      embeds: [initialEmbed],
      components: [actionRow],
    };

    const sentMessage = await handleMessage(context, messageData);

    // Set up a collector for button interactions.
    const filter = (interaction) => {
      if (interaction.isButton()) {
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
        await interaction.deferUpdate();
        switch (interaction.customId) {
          case "previous":
            if (currentPage > 1) currentPage--;
            break;
          case "next":
            if (currentPage < totalPages) currentPage++;
            break;
          default:
            break;
        }

        const {
          embed: updatedEmbed,
          totalPages: newTotalPages
        } = await createLeaderboardEmbed( {
            userId,
            page: currentPage,
            guildId,
          });
        totalPages = newTotalPages;
        const updatedActionRow = createActionRow( {
          currentPage, totalPages
        });
        await sentMessage.edit({
          embeds: [updatedEmbed],
          components: [updatedActionRow],
        });
      } catch (e) {
        if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
          console.error(e);
        }
      }
    });

    collector.on("end",
      async () => {
        // Disable all buttons after expiration.
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
          .setDisabled(true)
        );
        if (!sentMessage?.edit) return;
        await sentMessage.edit({
          components: [disabledRow],
        });
      });
  } catch (error) {
    console.error("Error in popularity leaderboard command:",
      error);
    await handleMessage(context,
      {
        content: "Oops! Something went wrong while fetching the popularity leaderboard!",
      });
  }
}

export default {
  name: "popularity",
  description:
  "Displays the top server-specific popularity leaderboard ranking users by their popularity score from ship.",
  aliases: ["poplb"],
  args: "",
  emoji: "🔥",
  example: ["popularity"],
  related: ["leaderboard", "profile", "stat"],
  cooldown: 10000, // 10 second cooldown
  category: "📰 Information",

  execute: (args,
    context) => {
    return popularity(context);
  },
};