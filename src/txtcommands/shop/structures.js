import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import {
  getShopData,
  updateShop,
  readShopData,
  writeShopData,
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper
} from '../../../helper.js';
import dotenv from 'dotenv';
dotenv.config();

const APPTOKEN = process.env.APP_ID;

/**
* Universal function to handle responses for both slash commands and
* normal message commands:
* - If it's an interaction-based context (slash command), we `defer` and `editReply`.
* - Otherwise, we do a simple `context.send()`.
*/
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command vs. normal message
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    // For normal text-based usage:
    return context.channel.send(data);
  }
}

const items = readShopData();
const structureItems = Object.values(items).filter(item => item.type === "structures");

/**
* Creates an array of two Embeds (like a 2-page spread) for a single structure
*/
function createStructureEmbed(structure) {
  let iconRarity = ``;
  if (structure.rarity.substring(0, 1).toUpperCase() === "L") iconRarity = `<:legendary:1323917783745953812>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "U") iconRarity = `<:uncommon:1323917867644882985>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "C") iconRarity = `<:common:1323917805191434240>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "R") iconRarity = `<:rare:1323917826448166923>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "E") iconRarity = `<:epic:1324666103028387851>`

  return [
    new EmbedBuilder()
    .setTitle(structure.name)
    .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${structure.image}.png`)
    .addFields(
      {
        name: `ᯓ★ Price`,
        value: [
          `**Price:** <:kasiko_coin:1300141236841086977>${structure.price.toLocaleString()}`,
          `**Maintenance Cost:** <:kasiko_coin:1300141236841086977>${structure.maintenance.toLocaleString()}`
        ].join("\n"),
        inline: false
      },
      {
        name: `ᯓ★ Details`,
        value: [
          `**ID:** ${structure.id}`,
          `**Category:** ${structure.category}`,
          `**Rarity:** ${iconRarity}`,
          `**Floors:** ${structure.floors}`,
          `**Color:** ${structure.color}`,
          `**Location:** ${structure.location}`
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({
      text: `ID: ${structure.id} | \`kas structure ${structure.id}\``
    })
    .setColor("#0b4ee2"),

    new EmbedBuilder()
    .setDescription(structure.description)
    .addFields({
      name: `ᯓ★ Amenities`,
      value: structure.amenities?.join(", ") || "None listed",
      inline: true
    })
  ];
}

/**
* Paginated view of ALL structures in the shop, with navigation + buy button
*/
export async function sendPaginatedStructures(context) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    if (!structureItems || structureItems.length === 0) {
      return handleMessage(context, {
        content: "No structures are available to view!"
      });
    }

    let currentIndex = 0;
    const structureEmbed = createStructureEmbed(structureItems[currentIndex]);

    // Buttons: Previous, Next, and Buy
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId("previousStructure")
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId("nextStructure")
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId("buyStructure")
      .setLabel("🛍️ BUY")
      .setStyle(ButtonStyle.Success)
    );

    // Send the initial paginated message using our unified handleMessage
    const messageSent = await handleMessage(context, {
      embeds: structureEmbed,
      components: [buttons]
    });

    // Create collector for buttons
    const collector = messageSent.createMessageComponentCollector({
      time: 180000
    }); // 3 minutes

    collector.on("collect", async (buttonInteraction) => {
      // Optional: lock interaction to the same user who triggered the command[thinking]


      if (buttonInteraction.user.id !== userId) {
        return buttonInteraction.reply({
          content: "You cannot interact with these buttons.", ephemeral: true
        });
      }

      // Defer the interaction, so it won't show "thinking..."
      await buttonInteraction.deferUpdate();

      if (buttonInteraction.customId === "nextStructure") {
        currentIndex = Math.min(currentIndex + 1, structureItems.length - 1);
      } else if (buttonInteraction.customId === "previousStructure") {
        currentIndex = Math.max(currentIndex - 1, 0);
      } else if (buttonInteraction.customId === "buyStructure") {
        // Attempt to buy the current structure
        const currentStructure = structureItems[currentIndex];
        return buystructure(context, currentStructure.id);
      }

      // Update the embed
      const newStructureEmbed = createStructureEmbed(structureItems[currentIndex]);
      // Update button states
      buttons.components[0].setDisabled(currentIndex === 0); // Previous
      buttons.components[1].setDisabled(currentIndex === structureItems.length - 1); // Next

      // Re-edit the original message
      await messageSent.edit({
        embeds: newStructureEmbed,
        components: [buttons]
      });
    });

    collector.on("end",
      async () => {
        try {
          // Disable all buttons after time expires
          buttons.components.forEach(button => button.setDisabled(true));
          await messageSent.edit({
            components: [buttons]
          });
        } catch (err) {
          console.error("Failed to edit message after collector ended:", err);
        }
      });
  } catch (e) {
    console.error("Error in sendPaginatedStructures:",
      e);
    return handleMessage(context,
      {
        content: "⚠️ Something went wrong while viewing the structures!"
      });
  }
}

/**
* View details of a specific structure by ID
*/
export async function viewStructure(context, structureId) {
  try {
    const structure = structureItems.filter(item => item.id.toLowerCase() === structureId.toLowerCase());

    if (structure.length === 0) {
      return handleMessage(context, {
        content: `⚠️ No items with ID "${structureId}" exist.`
      });
    }

    const structureEmbed = createStructureEmbed(structure[0]);
    return handleMessage(context, {
      embeds: structureEmbed
    });
  } catch (e) {
    console.error("Error in viewStructure:", e);
    return handleMessage(context, {
      content: "⚠️ Something went wrong while viewing the structure!"
    });
  }
}

/**
* View the structures owned by a given user
*/
export async function userstructures(context, targetUserId) {
  try {
    const userId = targetUserId || context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    const userData = await getUserData(userId);
    const structures = userData.structures || [];

    if (structures.length === 0) {
      const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription("⚠️ User doesn't own any structures!");
      return handleMessage(context, {
        embeds: [embed]
      });
    }

    // Split structures into chunks of 2
    const chunkedStructures = [];
    const chunkSize = 2;
    for (let i = 0; i < structures.length; i += chunkSize) {
      chunkedStructures.push(structures.slice(i, i + chunkSize));
    }

    // Create a 2D array of embeds: each chunk => array of Embeds
    const embedsArray = chunkedStructures.map((chunk, chunkIndex) => {
      return chunk.map((structure, structureIndex) => {
        const propertyDetails = structureItems.find(item => item.id === structure.id);
        const embed = new EmbedBuilder()
        .setColor('#6835fe')
        .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${propertyDetails.image}.png`);

        let description = '';
        description += `ᯓ★ 𝑵𝑨𝑴𝑬: **${propertyDetails.name}**\n`;
        description += `**𝑶𝑾𝑵𝑺**: ${structure.items}\n`;
        description += `**𝑷𝒖𝒓𝒄𝒉𝒂𝒔𝒆𝒅 𝑪𝒐𝒔𝒕**: <:kasiko_coin:1300141236841086977> ${structure.purchasedPrice.toLocaleString()}\n`;

        embed.setDescription(description.trim());

        // Title for the first structure in each chunk
        if (structureIndex === 0) {
          embed.setTitle(`<@${userId}>'s Properties 🏙️`);
        }
        // Footer with page number on the last embed of that chunk
        if (structureIndex === chunk.length - 1) {
          embed.setFooter({
            text: `Page ${chunkIndex + 1} of ${chunkedStructures.length}`
          });
        }
        return embed;
      });
    });

    // We handle each chunk as a "page"
    let currentPage = 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('prevStructurePage')
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId('nextStructurePage')
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(chunkedStructures.length === 1)
    );

    // Send first page (array of multiple embeds)
    const messageSent = await handleMessage(context, {
      embeds: embedsArray[currentPage],
      components: [row]
    });

    // Create collector
    const collector = messageSent.createMessageComponentCollector({
      time: 60000
    }); // 1 minute

    collector.on('collect', interaction => {
      // Optional: restrict to the original user if needed
      // if (interaction.user.id !== userId) {
      //   return interaction.reply({ content: "You cannot change pages.", ephemeral: true });
      // }

      if (interaction.customId === 'nextStructurePage') {
        currentPage++;
      } else if (interaction.customId === 'prevStructurePage') {
        currentPage--;
      }

      // Rebuild row with updated button states
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('prevStructurePage')
        .setLabel('◀')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
        new ButtonBuilder()
        .setCustomId('nextStructurePage')
        .setLabel('▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === embedsArray.length - 1)
      );

      interaction.update({
        embeds: embedsArray[currentPage],
        components: [updatedRow]
      });
    });

    collector.on('end',
      () => {
        // Disable buttons after time
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('prevStructurePage')
          .setLabel('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('nextStructurePage')
          .setLabel('▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
        );

        messageSent.edit({
          components: [disabledRow]
        }).catch(() => {});
      });
  } catch (e) {
    console.error(e);
    return handleMessage(context,
      {
        content: "⚠️ Something went wrong while visiting **User's Properties**"
      });
  }
}

/**
* Buy a specific structure by ID
*/
export async function buystructure(context, structureId) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    const structureArr = structureItems.filter(item => item.id === structureId);
    if (!structureArr.length) {
      return handleMessage(context, {
        content: `⚠️ No items with this ID exist.`
      });
    }

    const structure = structureArr[0];
    const userData = await getUserData(userId);

    // Check for sufficient cash
    if (userData.cash < structure.price) {
      return handleMessage(context, {
        content: `⚠️ **${username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝐬𝒉 to buy the structure.`
      });
    }

    // Check networth requirement
    if (structure.rarity === "legendary" && userData.networth < 1000000) {
      return handleMessage(context, {
        content: `⚠️ **${username}**, your <:kasiko_coin:1300141236841086977> **networth** is too low to purchase this item (minimum required networth: <:kasiko_coin:1300141236841086977> 1,000,000).`
      });
    }

    // If user doesn't have this structure, add a new record, else increment
    const userHasStructure = userData.structures.some(s => s.id === structureId);
    if (!userHasStructure) {
      const newStructure = {
        id: structure.id,
        purchasedPrice: structure.price,
        purchasedDate: new Date().toISOString(),
        items: 1
      };
      items[structureId].owners += 1;
      userData.structures.push(newStructure);
    } else {
      userData.structures = userData.structures.map(s => {
        if (s.id === structureId) {
          s.items += 1;
        }
        return s;
      });
    }

    userData.cash -= structure.price;
    userData.maintenance += structure.maintenance;

    // Update DB
    await updateUser(userId,
      userData);
    writeShopData(items);

    const embed = new EmbedBuilder()
    .setColor('#35e955')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(
      `Everyone congratulate 👏🏻 **${username}** for purchasing a brand-new **${structure.name}**! 🎉`
    )
    .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${structure.image}.png`)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    return handleMessage(context,
      {
        embeds: [embed]
      });
  } catch (e) {
    console.error(e);
    return handleMessage(context,
      {
        content: `⚠️ **${context.user?.username || context.author?.username}**, something went wrong while buying the structure!`
      });
  }
}

/**
* Sell a specific structure by ID
*/
export async function sellstructure(context, structureId) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    const structureArr = structureItems.filter(item => item.id === structureId);
    if (!structureArr.length) {
      return handleMessage(context, {
        content: `⚠️ No items with this ID exist.`
      });
    }

    const structure = structureArr[0];
    const userData = await getUserData(userId);
    const userStructure = userData.structures.filter(s => s.id === structureId);

    if (!userStructure.length) {
      return handleMessage(context, {
        content: `⚠️ You don't own this structure.`
      });
    }

    // Decrease user's ownership count
    userData.structures = userData.structures.map(s => {
      if (s.id === structureId) {
        s.items -= 1;
      }
      return s;
    }).filter(s => s.items > 0);

    // Decrement owners count in shop data
    items[structureId].owners -= 1;

    // Add cash back to user
    userData.cash += Number(structure.price);
    // Decrease maintenance for the sold structure
    userData.maintenance -= Number(structure.maintenance);

    writeShopData(items);
    await updateUser(userId,
      userData);

    const embed = new EmbedBuilder()
    .setColor('#e93535')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(
      `**${username}** successfully sold a **${structure.name}** for <:kasiko_coin:1300141236841086977> **${structure.price.toLocaleString()}** 𝑪𝒂𝐬𝒉.\n` +
      `Originally purchased that structure for <:kasiko_coin:1300141236841086977>${userStructure[0].purchasedPrice.toLocaleString()}.`
    )
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    return handleMessage(context,
      {
        embeds: [embed]
      });
  } catch (e) {
    console.error(e);
    return handleMessage(context,
      {
        content: `⚠️ **${context.user?.username || context.author?.username}**, something went wrong while selling the structure!`
      });
  }
}

/**
* Export all structure-related methods as a single object
*/
export const Structure = {
  sendPaginatedStructures,
  viewStructure,
  userstructures,
  buystructure,
  sellstructure
};

/**
* Command dispatcher for "structures" command usage
* (Adjust as needed for your own command structure)
*/
function handleStructureCommands(context, args) {
  const userId = context.user?.id || context.author?.id;

  // No second argument => view the command user's structures
  if (!args[1]) {
    return Structure.userstructures(context, userId);
  }

  // If the second argument is a user mention => show that user's structures
  if (Helper.isUserMention(args[1], context)) {
    const mentionedUserId = Helper.extractUserId(args[1]);
    return Structure.userstructures(context, mentionedUserId);
  }

  // Otherwise treat it as a structure ID => show that structure's details
  return Structure.viewStructure(context, args[1]);
}

export default {
  name: "structures",
  description: "View owned structures, check another user's structures, or view details of a specific structure by ID.",
  aliases: ["buildings",
    "structure",
    "houses",
    "building",
    "house"],
  args: "[user] | <structure_id>",
  example: [
    "structures",
    // View the command user's structures
    "structures @User",
    // View structures of a mentioned user
    "structures <id>" // View details of a specific structure by ID
  ],
  related: ["shop",
    "properties",
    "market"],
  cooldown: 4000,
  category: "🛍️ Shop",

  // Execute function when command is called
  execute: (args, context) => handleStructureCommands(context, args)
};