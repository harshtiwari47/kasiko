import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";
import User from "../../../models/User.js";
import UserGuild from "../../../models/UserGuild.js";
import { client } from "../../../bot.js";
import { handleMessage, discordUser } from "../../../helper.js";

async function getTopUsers(userId, guildId = null, limit = 30) {
  try {
    if (guildId) {
      const users = await UserGuild.aggregate([
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
        { $sort: { "userData.networth": -1 } },
        { $limit: limit },
        {
          $project: {
            userId: 1,
            guildId: 1,
            networth: "$userData.networth",
            cash: "$userData.cash",
            level: "$userData.level"
          }
        }
      ]);

      const user = await User.findOne({ id: userId }).select("networth");
      if (!user) {
        return { users, userRank: "Unranked" };
      }

      const userRank = (await UserGuild.aggregate([
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
        { $match: { "userData.networth": { $gt: user.networth } } },
        { $count: "rank" }
      ]))?.[0]?.rank + 1 ?? 0;

      return { users, userRank };
    } else {
      const users = await User.find({})
        .sort({ networth: -1 })
        .limit(limit)
        .select("id networth cash level");

      const user = await User.findOne({ id: userId }).select("networth");
      if (!user) {
        return { users, userRank: "Unranked" };
      }

      const userRank = (await User.countDocuments({
        networth: { $gt: user.networth }
      })) + 1;

      return { users, userRank };
    }
  } catch (error) {
    console.error("Error fetching top users and rank:", error);
    return { users: [], userRank: "Unranked" };
  }
}

async function createLeaderboardEmbed({
  userId,
  page = 1,
  guildId = null,
  isServerFiltered = false
}) {
  try {
    const itemsPerPage = 10;
    const { users, userRank } = await getTopUsers(userId, isServerFiltered ? guildId : null, itemsPerPage * 3);

    if (!users || users.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(0xED971E)
        .setTitle(`<:trophy:1352897371595477084> NET WORTH LEADERBOARD ${isServerFiltered ? '(Server)' : '(Global)'}`)
        .setDescription("No users found on this leaderboard yet.")
        .setFooter({ text: "Page 1/1 • Your position: Unranked" });

      return {
        embed: emptyEmbed,
        totalPages: 1
      };
    }

    let totalPages = Math.ceil(users.length / itemsPerPage);
    if (totalPages < 1) totalPages = 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentUsers = users.slice(start, end);

    let leaderboard = "";
    for (const [index, user] of currentUsers.entries()) {
      let username = "Unknown User";
      try {
        const u = await client.users.fetch(user.userId || user.id).catch(() => null);
        if (u) username = u.globalName || u.username;
      } catch (err) {}

      let userIndex = start + index + 1;
      let posIcon = "<:lighting_icon_kasiko:1354393463931670568>";
      if (userIndex === 1) posIcon = "<:throne:1350387076834791486>";
      if (userIndex === 2) posIcon = "🥈";
      if (userIndex === 3) posIcon = "🥉";

      const networthVal = Number(user?.networth || 0).toLocaleString();
      leaderboard += `${userIndex <= 3 ? "### " : ""}${posIcon} **${username}** — <:kasiko_coin:1300141236841086977> **\`${networthVal}\`**\n`;
    }

    const userPosition = userRank && userRank <= itemsPerPage * 3 ? userRank : userRank || "Unranked";

    const embed = new EmbedBuilder()
      .setColor(0xED971E)
      .setTitle(`<:trophy:1352897371595477084> NET WORTH LEADERBOARD ${isServerFiltered ? '(Server)' : '(Global)'}`)
      .setDescription(`ִֶָ𓂃 ࣪˖ ִֶָ\n${leaderboard || "No data available."}`)
      .setFooter({
        text: `Page ${page}/${totalPages} • Your position: ${typeof userPosition === 'number' && userPosition > 0 ? `#${userPosition}` : userPosition}`
      })
      .setTimestamp();

    return {
      embed,
      totalPages
    };
  } catch (error) {
    console.error("Oops! An error occurred while generating the leaderboard", error);
    const errorEmbed = new EmbedBuilder()
      .setColor(0xED971E)
      .setTitle("<:trophy:1352897371595477084> NET WORTH LEADERBOARD")
      .setDescription("An error occurred while generating the leaderboard. Please try again later.")
      .setFooter({ text: "Page 1/1" });

    return {
      embed: errorEmbed,
      totalPages: 1
    };
  }
}

function createActionRow({ isServerFiltered, currentPage, totalPages, hasGuild }) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("lb_prev")
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId("lb_next")
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage >= totalPages)
  );

  if (hasGuild) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("lb_server")
        .setLabel(isServerFiltered ? "🌐 GLOBAL" : "🏰 SERVER")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

export async function leaderboard(context, requestedScope = null) {
  try {
    const { id: userId } = discordUser(context);
    const guildId = context.guild?.id || null;
    const hasGuild = !!guildId;

    let isServerFiltered = requestedScope === 'server';
    if (isServerFiltered && !hasGuild) {
      isServerFiltered = false;
    }

    let currentPage = 1;

    let { embed: currentEmbed, totalPages } = await createLeaderboardEmbed({
      userId,
      page: currentPage,
      guildId,
      isServerFiltered
    });

    let actionRow = createActionRow({
      isServerFiltered,
      currentPage,
      totalPages,
      hasGuild
    });

    const sentMessage = await handleMessage(context, {
      embeds: [currentEmbed],
      components: [actionRow]
    });

    if (!sentMessage?.createMessageComponentCollector) return;

    const collector = sentMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === userId,
      componentType: ComponentType.Button,
      time: 180000 // 3 minutes
    });

    collector.on("collect", async (interaction) => {
      try {
        if (interaction.customId === "lb_prev") {
          if (currentPage > 1) currentPage--;
        } else if (interaction.customId === "lb_next") {
          if (currentPage < totalPages) currentPage++;
        } else if (interaction.customId === "lb_server") {
          if (!hasGuild) {
            return await interaction.reply({
              content: "<:warning:1366050875243757699> Server leaderboard is only available inside a Discord Server.",
              ephemeral: true
            });
          }
          isServerFiltered = !isServerFiltered;
          currentPage = 1;
        }

        const updated = await createLeaderboardEmbed({
          userId,
          page: currentPage,
          guildId,
          isServerFiltered
        });

        currentEmbed = updated.embed;
        totalPages = updated.totalPages;

        const updatedRow = createActionRow({
          isServerFiltered,
          currentPage,
          totalPages,
          hasGuild
        });

        await interaction.update({
          embeds: [currentEmbed],
          components: [updatedRow]
        }).catch(async () => {
          if (sentMessage?.edit) {
            await sentMessage.edit({
              embeds: [currentEmbed],
              components: [updatedRow]
            }).catch(() => {});
          }
        });
      } catch (e) {
        console.error("[Leaderboard Collector] Error:", e);
      }
    });

    collector.on("end", async () => {
      try {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("lb_prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("lb_next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        if (hasGuild) {
          disabledRow.addComponents(
            new ButtonBuilder()
              .setCustomId("lb_server")
              .setLabel(isServerFiltered ? "🌐 GLOBAL" : "🏰 SERVER")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        }

        if (sentMessage?.edit) {
          await sentMessage.edit({
            embeds: [currentEmbed],
            components: [disabledRow]
          }).catch(() => {});
        }
      } catch (e) {}
    });

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    await handleMessage(context, {
      content: "Oops! Something went wrong while fetching the leaderboard!"
    });
  }
}

export default {
  name: "leaderboard",
  description: "Displays current global or server-specific leaderboard rankings according to users' net worth.",
  aliases: ["top", "ranking", "lb"],
  args: "[server]",
  emoji: "<:throne:1350387076834791486>",
  example: ["leaderboard", "leaderboard server"],
  related: ["profile", "balance"],
  cooldown: 5000,
  category: "📊 Statistics",

  execute: (args, context) => {
    const scope = args[1]?.toLowerCase() === 'server' ? 'server' : null;
    return leaderboard(context, scope);
  }
};
