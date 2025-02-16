// File: iceLeaderboard.js

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import IceCreamShop from "../../../../models/IceCream.js";
import UserGuild from "../../../../models/UserGuild.js";
import {
  client
} from "../../../../bot.js";

/**
* Utility: handle reply for both slash commands and prefix-based messages.
*/
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguish slash vs. normal msg
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

/**
* Maps the chosen `sortBy` (money/reputation/served) to the correct field path
* in the DB, depending on whether we are looking at guild data (UserGuild)
* or global data (IceCreamShop).
*/
function getSortPath(sortBy, isServerFiltered) {
  // Server = data from UserGuild.icecream
  if (isServerFiltered) {
    switch (sortBy) {
      case "money":
        return "icecream.money";
      case "reputation":
        return "icecream.reputation";
      case "served":
        return "icecream.served";
      default:
        return "icecream.money"; // fallback
    }
  }
  // Global = data from IceCreamShop
  else {
    switch (sortBy) {
    case "money":
      return "money";
    case "reputation":
      return "reputation";
    case "served":
      return "customersServed";
    default:
      return "money"; // fallback
    }
  }
}

/**
* Fetch the top documents (up to `limit`) and figure out the rank of a
* specific user within that scope. If `guildId` is provided, we fetch
* from UserGuild (server rank). If not, from IceCreamShop (global rank).
*/
async function getTopEntries( {
  userId, guildId = null, limit = 30, sortBy = "money"
}) {
  try {
    const isServerFiltered = !!guildId;
    const sortField = getSortPath(sortBy, isServerFiltered);
    const sortObj = {
      [sortField]: -1
    }; // descending sort

    if (isServerFiltered) {
      // =============== SERVER (UserGuild) ===============
      const docs = await UserGuild.find({
        guildId
      })
      .sort(sortObj)
      .limit(limit)
      .select("userId guildId icecream"); // adjust as needed

      // Find the user's doc in this guild
      const userDoc = await UserGuild.findOne({
        userId, guildId
      }).select("icecream");
      if (!userDoc) {
        return {
          docs,
          userRank: "Unranked"
        };
      }

      const userValue = userDoc.icecream?.[sortBy] || 0;
      // Count how many have strictly greater value
      const rankCount = await UserGuild.countDocuments({
        guildId,
        [`icecream.${sortBy}`]: {
          $gt: userValue
        },
      });
      return {
        docs,
        userRank: rankCount + 1
      };
    } else {
      // =============== GLOBAL (IceCreamShop) ===============
      const docs = await IceCreamShop.find({})
      .sort(sortObj)
      .limit(limit)
      .select("userId shopName money reputation customersServed");

      // Find the user in IceCreamShop
      const userDoc = await IceCreamShop.findOne({
        userId
      }).select(
        "money reputation customersServed"
      );
      if (!userDoc) {
        return {
          docs,
          userRank: "Unranked"
        };
      }

      const userValue =
      sortBy === "money"
      ? userDoc.money: sortBy === "reputation"
      ? userDoc.reputation: userDoc.customersServed || 0;

      const rankCount = await IceCreamShop.countDocuments({
        [sortField]: {
          $gt: userValue
        },
      });
      return {
        docs,
        userRank: rankCount + 1
      };
    }
  } catch (error) {
    console.error("Error fetching top entries/rank:", error);
    throw error;
  }
}

/**
* Build the embed for the current page. We'll display up to 10 entries per page.
*/
async function createLeaderboardEmbed( {
  userId,
  guildId = null,
  sortBy = "money",
  page = 1,
}) {
  try {
    const itemsPerPage = 10;
    const isServerFiltered = !!guildId;

    // Grab up to 30 for pagination
    const {
      docs,
      userRank
    } = await getTopEntries({
        userId,
        guildId,
        limit: itemsPerPage * 3,
        sortBy,
      });

    if (docs.length === 0) {
      return {
        embed: new EmbedBuilder()
        .setColor("#ed971e")
        .setTitle(`🍦 𝑰𝑪𝑬 𝑪𝑹𝑬𝑨𝑴 𝑺𝑯𝑶𝑷 𝑳𝑬𝑨𝑫𝑬𝑹𝑩𝑶𝑨𝑹𝑫 (${sortBy.toUpperCase()})`)
        .setDescription("No records found!")
        .setFooter({
          text: "Your position: Unranked"
        }),
        totalPages: 1,
      };
    }

    // Pagination calculations
    let totalPages = Math.ceil(docs.length / itemsPerPage);
    if (totalPages === 0) totalPages = 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDocs = docs.slice(startIndex, endIndex);

    // Build the leaderboard string
    let description = "";
    for (const [index, doc] of currentDocs.entries()) {
      const rank = startIndex + index + 1;

      // Attempt to fetch the user for display name
      let userObj;
      try {
        userObj = await client.users.fetch(doc.userId);
      } catch {
        userObj = {
          username: "Unknown User"
        };
      }

      // Symbol for top 3
      let posIcon = "𖦹";
      if (rank === 1) posIcon = "🥇";
      if (rank === 2) posIcon = "🥈";
      if (rank === 3) posIcon = "🥉";

      // Which value to display?
      let statValue = 0;
      if (isServerFiltered) {
        // doc.icecream[sortBy]
        statValue = doc.icecream?.[sortBy] || 0;
      } else {
        // doc.money, doc.reputation, doc.customersServed
        statValue =
        sortBy === "money"
        ? doc.money: sortBy === "reputation"
        ? doc.reputation: doc.customersServed || 0;
      }

      description += `**${posIcon} \`${Number(rank) !== 1 && Number(rank) !== 2 && Number(rank) !== 3 ? rank: "🍨"}\`** - **${userObj.username}**: **${statValue.toLocaleString()}**\n`;
    }

    // If userRank is numeric, display it. Else "Unranked"
    const footerRank = typeof userRank === "number" ? userRank: "Unranked";

    // Build the embed
    const embed = new EmbedBuilder()
    .setTitle(
      `🍦 𝑰𝑪𝑬 𝑪𝑹𝑬𝑨𝑴 𝑺𝑯𝑶𝑷 𝑳𝑬𝑨𝑫𝑬𝑹𝑩𝑶𝑨𝑹𝑫 (${sortBy.toUpperCase()} - ${
      isServerFiltered ? "𝑆𝑒𝑟𝑣𝑒𝑟": "𝐺𝑙𝑜𝑏𝑎𝑙"
      })`
    )
    .setDescription(`ִֶָ𓂃 ࣪˖ ִֶָ\n${description}`)
    .setFooter({
      text: `ᴘᴀɢᴇ ${page}/${totalPages} | ʏᴏᴜʀ ᴘᴏꜱɪᴛɪᴏɴ: ${footerRank}`,
    });

    return {
      embed,
      totalPages
    };
  } catch (error) {
    console.error("Error creating leaderboard embed:", error);
    return {
      embed: new EmbedBuilder()
      .setColor("#ed971e")
      .setTitle("Error")
      .setDescription("An error occurred while generating the leaderboard.")
      .setTimestamp(),
      totalPages: 1,
    };
  }
}

/**
* Create the row of buttons used for pagination and the server/global toggle.
*/
function createActionRow( {
  currentPage, totalPages, isServerFiltered
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
    .setLabel(isServerFiltered ? "GLOBAL ⚜️": "SERVER 💛")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(false)
  );
}

/**
* Main command function to display and handle the Ice Cream Shop leaderboard UI.
*/
export async function iceLeaderboard(context, sortByArg = "money") {
  try {
    // We get user & guild from the context
    const userId = context.user ? context.user.id: context.author.id;
    const guildId = context.guild?.id || null;

    // Starting state
    let currentPage = 1;
    let isServerFiltered = false; // false => Global by default

    // Build the initial embed
    let {
      embed: initialEmbed,
      totalPages
    } = await createLeaderboardEmbed( {
        userId,
        guildId: isServerFiltered ? guildId: null,
        sortBy: sortByArg,
        page: currentPage,
      });

    // Build the initial action row
    let actionRow = createActionRow( {
      currentPage,
      totalPages,
      isServerFiltered,
    });

    // Send the initial message
    const sentMessage = await handleMessage(context, {
      embeds: [initialEmbed],
      components: [actionRow],
    });

    // Collector to handle button interactions
    const filter = (i) => {
      if (!i.isButton()) return false;
      const invokerId = context.user ? context.user.id: context.author.id;
      return i.user.id === invokerId;
    };

    const collector = sentMessage.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 3 * 60 * 1000, // 3 min
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();

      switch (interaction.customId) {
      case "previous":
        if (currentPage > 1) currentPage--;
        break;
      case "next":
        if (currentPage < totalPages) currentPage++;
        break;
      case "server":
        // Toggle between server & global
        isServerFiltered = !isServerFiltered;
        currentPage = 1; // reset
        break;
      default:
        break;
      }

      // Re-fetch with updated state
      const {
        embed: updatedEmbed,
        totalPages: newTotal
      } =
      await createLeaderboardEmbed( {
        userId,
        guildId: isServerFiltered ? guildId: null,
        sortBy: sortByArg,
        page: currentPage,
      });
      totalPages = newTotal;

      // Rebuild action row
      const updatedRow = createActionRow( {
        currentPage,
        totalPages,
        isServerFiltered,
      });

      // Edit the original
      if (!sentMessage || !sentMessage?.edit) return;

      await sentMessage.edit({
        embeds: [updatedEmbed],
        components: [updatedRow],
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    });

    collector.on("end",
      async () => {
        // Disable all buttons after collector ends
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
          .setLabel(isServerFiltered ? "GLOBAL": "SERVER")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
        );

        try {
          await sentMessage.edit({
            components: [disabledRow]
          });
        } catch {
          // message might already be deleted or uneditable
        }
      });
  } catch (error) {
    console.error("Error displaying the ice shop leaderboard:",
      error);
    return handleMessage(context,
      {
        content: "Oops! Something went wrong while fetching the leaderboard!",
      });
  }
}