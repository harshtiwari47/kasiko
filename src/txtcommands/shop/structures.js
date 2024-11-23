// under maintenance
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

import { Helper } from '../../../helper.js';

import dotenv from 'dotenv';
dotenv.config();

const APPTOKEN = process.env.APP_ID;


const items = readShopData();
const structureItems = Object.values(items).filter(item => item.type === "structures");

// Embed builder
function createStructureEmbed(structure) {
  return new EmbedBuilder()
  .setTitle(structure.name)
  .setDescription(structure.description)
  .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${structure.image}.png`) // Use image
  .addFields(
    {
      name: "ᯓ★ Price", value: `<:kasiko_coin:1300141236841086977>${structure.price}`, inline: true
    },
    {
      name: "ᯓ★ Category", value: structure.category, inline: true
    },
    {
      name: "ᯓ★ owners", value: `${structure.owners}`, inline: true
    },
    {
      name: "ᯓ★ Rarity", value: structure.rarity, inline: true
    },
    {
      name: "ᯓ★ Maintenance Cost", value: `<:kasiko_coin:1300141236841086977>${structure.maintenance}`, inline: true
    },
    {
      name: "ᯓ★ Floors", value: `${structure.floors}`, inline: true
    },
    {
      name: "ᯓ★ Amenities", value: `${structure.amenities.join(", ")}`, inline: true
    },
    {
      name: "ᯓ★ Location", value: `${structure.location}`, inline: true
    },
    {
      name: "ᯓ★ Color", value: structure.color, inline: true
    }
  )
  .setFooter({
    text: `ID: ${structure.id} | \`kas structure ${structure.id}\``
  })
  .setColor("#0b4ee2");
}

export async function sendPaginatedStructures(context) {
    try {
        const user = context.user || context.author; // Handles both Interaction and Message
        if (!user) return;

        // Validate structureItems
        if (!structureItems || structureItems.length === 0) {
            return context.channel.send("No structures are available to view!");
        }

        let currentIndex = 0;
        const structureEmbed = createStructureEmbed(structureItems[currentIndex]);

        // Buttons for navigation
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("previousStructure")
                .setLabel("Previous Structure")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("nextStructure")
                .setLabel("Next Structure")
                .setStyle(ButtonStyle.Primary)
        );

        // Send initial message
        const message = await context.channel.send({
            embeds: [structureEmbed],
            components: [buttons],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            time: 180000, // 3 minutes
        });

        collector.on("collect", async (buttonInteraction) => {
            if (buttonInteraction.user.id !== user.id) {
                await buttonInteraction.reply({
                    content: "You can't interact with this button.",
                    ephemeral: true,
                });
                return; // Stop further handling for unauthorized users
            }

            try {
                // Defer the interaction
                await buttonInteraction.deferUpdate();

                // Update index based on button click
                if (buttonInteraction.customId === "nextStructure") {
                    currentIndex = Math.min(currentIndex + 1, structureItems.length - 1);
                } else if (buttonInteraction.customId === "previousStructure") {
                    currentIndex = Math.max(currentIndex - 1, 0);
                }

                // Update embed and button state
                const newStructureEmbed = createStructureEmbed(structureItems[currentIndex]);
                buttons.components[0].setDisabled(currentIndex === 0);
                buttons.components[1].setDisabled(currentIndex === structureItems.length - 1);

                await message.edit({
                    embeds: [newStructureEmbed],
                    components: [buttons],
                });
            } catch (err) {
                console.error("Error during interaction handling:", err);
            }
        });

        collector.on("end", async () => {
            try {
                buttons.components.forEach((button) => button.setDisabled(true));
                await message.edit({
                    components: [buttons],
                });
            } catch (err) {
                console.error("Failed to edit message after collector ended:", err);
            }
        });
    } catch (e) {
        console.error("Error in sendPaginatedStructures:", e);
        return context.channel.send("⚠️ Something went wrong while viewing the structures!");
    }
}

export async function viewStructure(id, message) {
  const structure = Object.values(structureItems).filter(item => item.id === id);

  if (structure.length === 0) {
    return message.channel.send(`⚠️ No items with this ID exist.`);
  }

  // Create the structure embed
  const structureEmbed = await createStructureEmbed(structure[0]);

  return message.channel.send({
    embeds: [structureEmbed]
  });
}

export async function userstructures(userId, message) {
  try {
    let userData = await getUserData(userId);
    const structures = userData.structures;

    let Properties = "";

    if (structures.length === 0) {
      Properties = "⚠️ User doesn't own any structures!";
    } else {
      structures.forEach((structure, i) => {
        let propertyDetails = Object.values(structureItems).filter(item => item.id === structure.id);
        Properties += `\nᯓ★ 𝑺𝒕𝒓𝒖𝒄𝒕𝒖𝒓𝒆𝒔: **${propertyDetails[0].name}**\n**Owns**: ${structure.items}\n**Structure**: [View Property](https://cdn.discordapp.com/app-assets/${APPTOKEN}/${propertyDetails[0].image}.png)\n**Purchased Cost**: ${structure.purchasedPrice}\n`;
      })
    }

    const embed = new EmbedBuilder()
    .setColor('#6835fe')
    .setTitle(`░ <@${userId}> 's Properties ░ ✩`)
    .setDescription(Properties)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    return message.channel.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(e)
    return message.channel.send("⚠️ something went wrong while visiting **User's Properties**");
  }
}

export async function buystructure(message, structureId) {
  try {
    const structure = Object.values(structureItems).filter(item => item.id === structureId);
    let userData = await getUserData(message.author.id);

    if (structure.length === 0) {
      return message.channel.send(`⚠️ No items with this ID exist.`);
    }

    if (userData.cash < structure[0].price) {
      return message.channel.send(`⚠️ **${message.author.username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉 to buy the structure.`);
    }

    if (structure[0].rarity === "legendary" && userData.networth < 1000000) {
      return message.channel.send(`⚠️ **${message.author.username}**, your <:kasiko_coin:1300141236841086977> **networth** is too low to purchase this item (minimum required networth: <:kasiko_coin:1300141236841086977> 1000000).`);
    }

    if (!userData.structures.some(structure => structure.id === structureId)) {
      let userStructureData = {
        id: structure[0].id,
        purchasedPrice: structure[0].price,
        purchasedDate: new Date().toISOString(),
        items: 1
      }
      items[structureId].owners += 1;
      userData.structures.push(userStructureData);
    } else {
      userData.structures = userData.structures.map(structure => {
        if (structure.id === structureId) {
          structure.items += 1;
        }
        return structure;
      });
    }

    userData.cash -= structure[0].price;
    userData.maintenance += structure[0].maintenance;

    await updateUser(message.author.id,
      userData);
    writeShopData(items);

    const embed = new EmbedBuilder()
    .setColor('#35e955')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐮𝐥')
    .setDescription(`\n Everyone congrats 👏🏻 **${message.author.username}** for purchasing a brand-new structure! 🎉\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
    .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${structure[0].image}.png`)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    return message.channel.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(e);
    return message.channel.send(`⚠️ **${message.author.username}**, something went wrong while transition!`);
  }
}

export async function sellstructure(message, structureId) {
  try {
    const structure = Object.values(structureItems).filter(item => item.id === structureId);
    let userData = await getUserData(message.author.id);
    const userStructure = Object.values(userData.structures).filter(item => item.id === structureId);

    if (structure.length === 0) {
      return message.channel.send(`⚠️ No items with this ID exist.`);
    }

    if (!userData.structures.some(structure => structure.id === structureId)) {
      return message.channel.send(`⚠️ You don't own this structure.`);
    }

    userData.structures = userData.structures.map(structure => {
      if (structure.id === structureId) {
        structure.items -= 1;
        return structure;
      }
      items[structureId].owners -= 1;
      return structure;
    }).filter(structure => structure.items > 0);

    userData.cash += Number(structure[0].price);
    userData.maintenance -= Number(structure[0].maintenance);

    writeShopData(items);
    await updateUser(message.author.id,
      userData);

    const embed = new EmbedBuilder()
    .setColor('#e93535')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(`**${message.author.username}** successfully sold a **${structure[0].name}** structure for <:kasiko_coin:1300141236841086977> **${structure[0].price}** 𝑪𝒂𝒔𝒉.\nOriginally purchased that structure for <:kasiko_coin:1300141236841086977>${userStructure[0].purchasedPrice}.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    return message.channel.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(e);
    return message.channel.send(`⚠️ **${message.author.username}**, something went wrong while transition!`);
  }
}

export const Structure = {
  sendPaginatedStructures,
  viewStructure,
  userstructures,
  buystructure,
  sellstructure
}

function handleStructureCommands(args, message) {
  if (!args[1]) return Structure.userstructures(message.author.id, message);
  if (Helper.isUserMention(args[1])) return Structure.userstructures(Helper.extractUserId(args[1]), message);
  return Structure.viewStructure(args[1], message);
}

export default {
  name: "structures",
  description: "View owned structures, check another user's structures, or view details of a specific structure by ID.",
  aliases: ["buildings", "structure", "houses", "building", "house"],
  args: "[user] | <structure_id>",
  example: [
    "structures",               // View the command user's structures
    "structures @User",         // View structures of a mentioned user
    "structures <structure_id>" // View details of a specific structure by ID
  ],
  related: ["shop", "properties", "market"],
  cooldown: 4000, //4s
  category: "Shop",

  // Execute the function when the command is called
  execute: (args, message) => handleStructureCommands(args, message)
};