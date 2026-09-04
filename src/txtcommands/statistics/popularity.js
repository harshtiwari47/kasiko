import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
} from "discord.js";
import User from "../../../models/User.js";
import UserGuild from "../../../models/UserGuild.js";
import { client } from "../../../bot.js";

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
export async function getTopPopularityUsers(userId, guildId, limit = 30) {
  try {
    if (!guildId) {
      throw new Error("Popularity leaderboard is only available in a guild/server context.");
    }

    // Fetch top users in the server sorted by popularity in User model
    const users = await UserGuild.aggregate([
      {
        $match: {
          guildId
        }
      },
      {
        $lookup: {
          from: "users",
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
      }
    ]);

    // Fetch the invoker's popularity score
    const userDoc = await User.findOne({ id: userId }).select("popularity").lean();
    const userScore = userDoc?.popularity || 0;

    // Count how many users in this guild have higher popularity
    const higherCount = (await UserGuild.aggregate([
      { $match: { guildId } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "userData"
        }
      },
      { $unwind: "$userData" },
      { $match: { "userData.popularity": { $gt: userScore } } },
      { $count: "rank" }
    ]))?.[0]?.rank;

    const userRank = userDoc ? (higherCount !== undefined ? higherCount + 1 : 1) : "Unranked";

    return {
      users,
      userScore,
      userRank
    };
  } catch (error) {
    console.error("Error fetching top popularity users:", error);
    throw error;
  }
}

// Build the compact Discord ContainerBuilder for popularity leaderboard (Top 10 + user score)
export async function buildPopularityContainer({ userId, guildId, page = 1, disabled = false }) {
  try {
    const itemsPerPage = 10;
    const { users, userScore, userRank } = await getTopPopularityUsers(userId, guildId, itemsPerPage * 3); // Top 30

    let totalPages = Math.ceil(users.length / itemsPerPage);
    if (totalPages === 0) totalPages = 1;

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentUsers = users.slice(start, end);

    const userDetailsList = await Promise.all(
      currentUsers.map(async u => {
        try {
          const fetched = await client.users.fetch(u.userId);
          return { ...u, username: fetched.username };
        } catch {
          return { ...u, username: "Unknown User" };
        }
      })
    );

    let leaderboard = "";
    if (userDetailsList.length === 0) {
      leaderboard = "No ranked users found in this server yet! Ship with members to appear here.";
    } else {
      for (const [index, u] of userDetailsList.entries()) {
        const userIndex = ((page - 1) * itemsPerPage) + index + 1;
        let posIcon = "<:rose:1343097565738172488>";
        if (userIndex === 1) posIcon = "<:throne:1350387076834791486>";
        else if (userIndex === 2) posIcon = "🥈";
        else if (userIndex === 3) posIcon = "🥉";

        const prefix = userIndex === 1 ? "## " : userIndex === 2 ? "### " : userIndex === 3 ? "### " : "";
        leaderboard += `${prefix}**${posIcon}** **${u.username}** — <:popularity:1359565087341543435> **\`${Number(u.popularity?.toFixed(1) || 0).toLocaleString()}\`**\n`;
      }
    }

    const container = new ContainerBuilder()
      .setAccentColor(0xf06292)
      .addTextDisplayComponents(
        td => td.setContent(`### <:trophy:1352897371595477084> **SERVER POPULARITY LEADERBOARD**`),
        td => td.setContent(
          `**Your Popularity:** <:popularity:1359565087341543435> **\`${Number(userScore?.toFixed(1) || 0).toLocaleString()}\`** · Server Rank: **#${userRank}**`
        )
      )
      .addSeparatorComponents(sep => sep)
      .addTextDisplayComponents(
        td => td.setContent(`### 🏆 **TOP MEMBERS**\n${leaderboard}`),
        td => td.setContent(`-# Page ${page}/${totalPages} · Click ℹ️ Help to learn how popularity works!`)
      );

    const helpBtn = new ButtonBuilder()
      .setCustomId("pop_help")
      .setLabel("Help")
      .setEmoji("ℹ️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled);

    if (totalPages > 1) {
      container.addActionRowComponents(row =>
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("pop_prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || page === 1),
          new ButtonBuilder()
            .setCustomId("pop_next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || page === totalPages),
          helpBtn
        )
      );
    } else {
      container.addActionRowComponents(row =>
        row.addComponents(helpBtn)
      );
    }

    return {
      container,
      totalPages,
      page
    };
  } catch (error) {
    console.error("Error generating popularity leaderboard container:", error);
    const errContainer = new ContainerBuilder()
      .setAccentColor(0xed4245)
      .addTextDisplayComponents(
        td => td.setContent(`### <:checkbox_cross:1388858904095625226> **Error**`),
        td => td.setContent(`An error occurred while generating the popularity leaderboard.`)
      );
    return {
      container: errContainer,
      totalPages: 1,
      page: 1
    };
  }
}

// Build the Popularity Help & Guide ContainerBuilder
export async function buildPopularityHelpContainer({ userId, guildId, disabled = false }) {
  try {
    const userDoc = await User.findOne({ id: userId }).select("popularity").lean();
    const userScore = userDoc?.popularity || 0;

    const higherCount = (await UserGuild.aggregate([
      { $match: { guildId } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "userData"
        }
      },
      { $unwind: "$userData" },
      { $match: { "userData.popularity": { $gt: userScore } } },
      { $count: "rank" }
    ]))?.[0]?.rank;

    const userRank = userDoc ? (higherCount !== undefined ? higherCount + 1 : 1) : "Unranked";

    const helpContainer = new ContainerBuilder()
      .setAccentColor(0xf06292)
      .addTextDisplayComponents(
        td => td.setContent(`### <:popularity:1359565087341543435> **POPULARITY GUIDE & FAQ**`),
        td => td.setContent(
          `**Your Popularity:** <:popularity:1359565087341543435> **\`${Number(userScore?.toFixed(1) || 0).toLocaleString()}\`** · Server Rank: **#${userRank}**`
        )
      )
      .addSeparatorComponents(sep => sep)
      .addTextDisplayComponents(
        td => td.setContent(
          `**✨ What is Popularity?**\n` +
          `Popularity measures your social charm and reputation in Kasiko! It reflects how admired and loved you are by other players in the community.\n\n` +
          `**🔥 How to Increase:**\n` +
          `• ❤️ **Get Liked in Ship:** Earn **+1 Popularity** whenever someone clicks Like on your ship card (\`kas ship\`)\n` +
          `• <:rose:1343097565738172488> **Receive Roses:** Earn **+25 Popularity** when someone sends you 5 Private Roses in \`kas ship\`\n` +
          `• 👑 **Climb the Leaderboard:** Reach the top 3 for prestigious server throne and medal badges!\n\n` +
          `-# Tip: Use \`kas ship\` with friends and exchange roses to boost each other's score!`
        )
      )
      .addActionRowComponents(row =>
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("pop_lb")
            .setLabel("Leaderboard")
            .setEmoji("🏆")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
        )
      );

    return { container: helpContainer };
  } catch (error) {
    console.error("Error generating popularity help container:", error);
    const errContainer = new ContainerBuilder()
      .setAccentColor(0xed4245)
      .addTextDisplayComponents(
        td => td.setContent(`### <:checkbox_cross:1388858904095625226> **Error**`),
        td => td.setContent(`An error occurred while generating the popularity guide.`)
      );
    return { container: errContainer };
  }
}

export async function popularity(context) {
  try {
    const userId = context.user ? context.user.id : context.author.id;
    const guildId = context.guild?.id;
    if (!guildId) {
      const dmContainer = new ContainerBuilder()
        .setAccentColor(0xed4245)
        .addTextDisplayComponents(
          td => td.setContent(`⚠️ This command can only be used in a server.`)
        );
      return handleMessage(context, {
        components: [dmContainer],
        flags: MessageFlags.IsComponentsV2
      });
    }

    let currentPage = 1;
    let currentView = "leaderboard";
    let { container, totalPages } = await buildPopularityContainer({
      userId,
      guildId,
      page: currentPage
    });

    const sentMessage = await handleMessage(context, {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    if (!sentMessage) return;

    const filter = (interaction) => {
      if (interaction.isButton()) {
        const invokerId = context.user ? context.user.id : context.author.id;
        return interaction.user.id === invokerId && ["pop_prev", "pop_next", "pop_help", "pop_lb"].includes(interaction.customId);
      }
      return false;
    };

    const collector = sentMessage.createMessageComponentCollector ? sentMessage.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 3 * 60 * 1000,
    }) : null;

    if (!collector) return;

    collector.on("collect", async (interaction) => {
      try {
        await interaction.deferUpdate().catch(() => {});

        if (interaction.customId === "pop_help") {
          currentView = "help";
          const { container: helpContainer } = await buildPopularityHelpContainer({
            userId,
            guildId
          });
          return await sentMessage.edit({
            components: [helpContainer],
            flags: MessageFlags.IsComponentsV2
          });
        }

        if (interaction.customId === "pop_lb") {
          currentView = "leaderboard";
          const { container: lbContainer } = await buildPopularityContainer({
            userId,
            guildId,
            page: currentPage
          });
          return await sentMessage.edit({
            components: [lbContainer],
            flags: MessageFlags.IsComponentsV2
          });
        }

        if (interaction.customId === "pop_prev" && currentPage > 1) {
          currentPage--;
        } else if (interaction.customId === "pop_next" && currentPage < totalPages) {
          currentPage++;
        }

        currentView = "leaderboard";
        const { container: updatedContainer } = await buildPopularityContainer({
          userId,
          guildId,
          page: currentPage
        });

        await sentMessage.edit({
          components: [updatedContainer],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (e) {
        if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
          console.error(e);
        }
      }
    });

    collector.on("end", async () => {
      try {
        if (!sentMessage?.edit) return;
        if (currentView === "help") {
          const { container: disabledHelp } = await buildPopularityHelpContainer({
            userId,
            guildId,
            disabled: true
          });
          await sentMessage.edit({
            components: [disabledHelp],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        } else {
          const { container: disabledContainer } = await buildPopularityContainer({
            userId,
            guildId,
            page: currentPage,
            disabled: true
          });
          await sentMessage.edit({
            components: [disabledContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      } catch {}
    });
  } catch (error) {
    console.error("Error in popularity leaderboard command:", error);
    const errContainer = new ContainerBuilder()
      .setAccentColor(0xed4245)
      .addTextDisplayComponents(
        td => td.setContent(`Oops! Something went wrong while fetching the popularity leaderboard!`)
      );
    await handleMessage(context, {
      components: [errContainer],
      flags: MessageFlags.IsComponentsV2
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
  cooldown: 10000,
  category: "📰 Information",

  execute: (args, context) => {
    return popularity(context);
  },
};