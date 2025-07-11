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
    if (!context.replied && !context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    // For normal text-based usage:
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

const items = readShopData();
const structureItems = Object.values(items).filter(item => item.type === "structures");

/**
* Creates an array of two Embeds (like a 2-page spread) for a single structure
*/
function createStructureEmbed(structure, username = null) {
  let iconRarity = ``;
  if (structure.rarity.substring(0, 1).toUpperCase() === "L") iconRarity = `<:legendary:1323917783745953812>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "U") iconRarity = `<:uncommon:1323917867644882985>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "C") iconRarity = `<:common:1323917805191434240>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "R") iconRarity = `<:rare:1323917826448166923>`
  if (structure.rarity.substring(0, 1).toUpperCase() === "E") iconRarity = `<:epic:1324666103028387851>`

  return [
    new EmbedBuilder()
    .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${structure.image}.png`)
    .setDescription(`### ${structure.name}`)
    .addFields(
      {
        name: `ᯓ★ Price`,
        value: [
          `**Price:** <:kasiko_coin:1300141236841086977>${structure.price.toLocaleString()}`,
          `**Maintenance Cost:** <:kasiko_coin:1300141236841086977>${structure.maintenance.toLocaleString()}`
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({
      text: `${username? "@" + username + " ◌ ": ""}structure ${structure.id}`
    })
    .setColor(structure?.hexcolor ?? "Random"),

    new EmbedBuilder()
    .setDescription(`-# **ᯓ★ Details**\n<:reply:1368224908307468408> **ID:** ${structure.id}\n**Category:** ${structure.category}\n**Rarity:** ${iconRarity} **Floors:** ${structure.floors}\n**Color:** ${structure.color}\n**Location:** ${structure.location}\n\n*\`${structure.description}\`*`)
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
    const structureEmbed = createStructureEmbed(structureItems[currentIndex], username);

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
      const newStructureEmbed = createStructureEmbed(structureItems[currentIndex], username);
      // Update button states
      buttons.components[0].setDisabled(currentIndex === 0); // Previous
      buttons.components[1].setDisabled(currentIndex === structureItems.length - 1); // Next

      // Re-edit the original message
      await messageSent.edit({
        content: '',
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

    const structureEmbed = createStructureEmbed(structure[0], username);
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
        .setColor(propertyDetails?.hexcolor ?? "Random")
        .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${propertyDetails.image}.png`);

        let description = '';
        description += `ᯓ★ 𝑵𝑨𝑴𝑬: **${propertyDetails.name}**\n`;
        description += `<:follow_reply:1368224897003946004> **𝘖𝘸𝘯𝘴**: ${structure.items}\n`;
        description += `<:reply:1368224908307468408> **𝘗𝘶𝘳𝘤𝘩𝘢𝘴𝘦𝘥 𝘊𝘰𝘴𝘵**: <:kasiko_coin:1300141236841086977> ${structure.purchasedPrice.toLocaleString()}\n`;
        description += `\`\`\`ID: ${structure.id}\`\`\`\n`;

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
      time: 120000
    }); // 2 minute

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
        content: '',
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

    // Find structure in available items
    const structure = structureItems.find(item => item.id === structureId);
    if (!structure) {
      return handleMessage(context, {
        content: `⚠️ No items with this ID exist.`
      });
    }

    // Fetch user data
    const userData = await getUserData(userId);
    const structureIndex = userData.structures.findIndex(s => s.id === structureId);

    if (structureIndex === -1) {
      return handleMessage(context, {
        content: `⚠️ You don't own this structure.`
      });
    }

    const userStructure = userData.structures[structureIndex];

    // Remove or update structure count
    if (userStructure.items > 1) {
      userData.structures[structureIndex].items -= 1;
    } else {
      userData.structures.splice(structureIndex, 1);
    }

    const amountToAdd = Math.floor(Number(structure.price || 0) - (0.25 * Number(structure.price || 0)));

    // Add cash and decrease maintenance
    userData.cash += amountToAdd;
    userData.maintenance -= Number(structure.maintenance);

    await updateUser(userId, {
      cash: userData.cash,
      maintenance: userData.maintenance,
      structures: userData.structures
    });

    // Create embed message
    const embed = new EmbedBuilder()
    .setColor('#e93535')
    .setTitle('🧾 Transaction Successful')
    .setDescription(
      `**${username}** successfully sold a **${structure.name}** for <:kasiko_coin:1300141236841086977> **${Number(amountToAdd).toLocaleString()}** Cash.\n` +
      `Originally purchased for <:kasiko_coin:1300141236841086977> **${Number(userStructure.purchasedPrice).toLocaleString()}**.`
    )
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    await handleMessage(context, {
      embeds: [embed]
    });
    return;
  } catch (e) {
    console.error(e);
    await handleMessage(context, {
      content: `⚠️ **${context.user?.username || context.author?.username}**, something went wrong while selling the structure!`
    });
    return;
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
  const username = context.user?.username || context.author?.username;

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
  return Structure.viewStructure(context, args[1], username);
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
  emoji: "🏠",
  related: ["shop",
    "properties",
    "market"],
  cooldown: 10000,
  category: "🛍️ Shop",

  // Execute function when command is called
  execute: (args, context) => handleStructureCommands(context, args)
};