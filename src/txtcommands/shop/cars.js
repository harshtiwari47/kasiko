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
  Helper,
  handleMessage
} from '../../../helper.js';
import dotenv from 'dotenv';
dotenv.config();

import {
  checkPassValidity
} from "../explore/pass.js";

const APPTOKEN = process.env.APP_ID;

const items = readShopData();
const carItems = Object.values(items).filter(item => item.type === "car");

//  Creates an embed for a single car
//
function createCarEmbed(car, username = null) {
  let iconRarity = ``;
  if (car.rarity.substring(0, 1).toUpperCase() === "L") iconRarity = `<:legendary:1323917783745953812>`
  if (car.rarity.substring(0, 1).toUpperCase() === "U") iconRarity = `<:uncommon:1323917867644882985>`
  if (car.rarity.substring(0, 1).toUpperCase() === "C") iconRarity = `<:common:1323917805191434240>`
  if (car.rarity.substring(0, 1).toUpperCase() === "R") iconRarity = `<:rare:1323917826448166923>`
  if (car.rarity.substring(0, 1).toUpperCase() === "E") iconRarity = `<:epic:1324666103028387851>`
  if (car.rarity.substring(0, 2).toUpperCase() === "EX") iconRarity = `<:exclusive:1347533975840882708>`

  const mainEmbed = new EmbedBuilder()
  .setThumbnail(car.image && car.image.startsWith(`https`) ? car.image: `https://cdn.discordapp.com/app-assets/${APPTOKEN}/${car.image}.png`) // Use image
  .setDescription(`## ${car.name}\n-# ***ᯓ★ Price***\n**Price:** <:kasiko_coin:1300141236841086977>${car.price.toLocaleString()}\n**Maintenance Cost:** <:kasiko_coin:1300141236841086977>${car.maintenance.toLocaleString()}`)
  .setColor(car?.hexcolor ?? "Random")

  const middleEmbed = new EmbedBuilder()
  .setDescription(`-# ***ᯓ★ Car Details***\n<:reply:1368224908307468408> **ID:** ${car.id}\n**CATEGORY:** ${car.category}\n**TYPE:** ${iconRarity}\n**COLOR:** ${car.color} <:${car.id}:${car.emoji}>\n\n*\`${car.description}\`*`)
  .setFooter({
    text: `${username? "@" + username + " ◌ ": ""}car ${car.id}`
  })

  if (car.banner) {
    middleEmbed.setImage(car.banner);
  }

  return [mainEmbed,
    middleEmbed]
}

//
// ─────────────────────────────────────────────────────────────
//   View all cars in a "paginated" style + add a Buy button
// ─────────────────────────────────────────────────────────────
//
export async function sendPaginatedCars(context) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    if (!carItems || carItems.length === 0) {
      return handleMessage(context, {
        content: "No cars are available to view!"
      });
    }

    const Pass = await checkPassValidity(userId);

    let currentIndex = 0;
    const carEmbed = createCarEmbed(carItems[currentIndex], username);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId("previousCar")
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId("nextCar")
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId("buyCar")
      .setLabel("🛍️ BUY")
      .setStyle(ButtonStyle.Success)
    );

    // Send the initial paginated message
    const messageSent = await handleMessage(context, {
      embeds: carEmbed,
      components: [buttons]
    });

    // Create collector (works for both slash commands & normal messages)
    const collector = messageSent.createMessageComponentCollector({
      time: 180000
    });

    collector.on("collect", async (buttonInteraction) => {
      // Only proceed if the same user who triggered the command clicks
      if (buttonInteraction.user.id !== userId) {
        return buttonInteraction.reply({
          content: "You cannot interact with these buttons.",
          ephemeral: true
        });
      }

      await buttonInteraction.deferUpdate();

      if (buttonInteraction.customId === "nextCar") {
        currentIndex = Math.min(currentIndex + 1, carItems.length - 1);
      } else if (buttonInteraction.customId === "previousCar") {
        currentIndex = Math.max(currentIndex - 1, 0);
      } else if (buttonInteraction.customId === "buyCar") {
        // Attempt to buy the current car
        const currentCar = carItems[currentIndex];
        return buycar(context, currentCar.id);
      }

      const currentCar = carItems[currentIndex];

      const newCarEmbed = createCarEmbed(carItems[currentIndex], username);
      buttons.components[0].setDisabled(currentIndex === 0); // Previous
      buttons.components[1].setDisabled(currentIndex === carItems.length - 1); // Next

      if (Pass.isValid && (Pass.passType === "etheral" || Pass.passType === "celestia") && currentCar?.exclusive) {
        buttons.components[2]?.setDisabled(false);
      } else if (currentCar?.exclusive) {
        buttons.components[2]?.setDisabled(true); // buy
      }

      // Re-render the embed with updated pagination
      await messageSent.edit({
        content: '',
        embeds: newCarEmbed,
        components: [buttons],
      })
    });

    collector.on("end",
      async () => {
        try {
          buttons.components.forEach((button) => button.setDisabled(true));
          await messageSent.edit({
            components: [buttons]
          });
        } catch (err) {
          console.error("Failed to edit message after collector ended:", err);
        }
      });
  } catch (e) {
    console.error("Error in sendPaginatedCars:",
      e);
    return handleMessage(context,
      {
        content: "⚠️ Something went wrong while viewing the shop!"
      });
  }
}

//
// ─────────────────────────────────────────────────────────────
//   View details of a single car by ID
// ─────────────────────────────────────────────────────────────
//
export async function viewCar(context, carId) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;
    const car = carItems.filter(item => item.id === carId.toLowerCase());

    if (car.length === 0) {
      return handleMessage(context, {
        content: "⚠️ No items with this ID exist."
      });
    }

    const carEmbed = createCarEmbed(car[0], username);
    return handleMessage(context, {
      embeds: carEmbed
    });
  } catch (e) {
    console.error("Error in viewCar:", e);
    return handleMessage(context, {
      content: "⚠️ Something went wrong while viewing the car!"
    });
  }
}

//
// ─────────────────────────────────────────────────────────────
//   View user’s owned cars (Paginated user GARRAGE)
// ─────────────────────────────────────────────────────────────
//
export async function usercars(context, targetUserId) {
  try {
    // If no user was provided, use the context caller
    const userId = targetUserId || context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    const userData = await getUserData(userId);
    const cars = userData.cars.sort((a, b) => b.purchasedPrice - a.purchasedPrice) || [];

    if (!cars.length) {
      const embed = new EmbedBuilder()
      .setColor(0xFFCC00)
      .setTitle("No Cars Found!")
      .setDescription("⚠️ User doesn't own any cars!");

      return handleMessage(context, {
        embeds: [embed]
      });
    }

    // Split cars into chunks of 2
    const chunkedCars = [];
    const chunkSize = 2; // Two cars per embed
    for (let i = 0; i < cars.length; i += chunkSize) {
      chunkedCars.push(cars.slice(i, i + chunkSize));
    }

    // Create embeds for the car chunks
    const embedsArray = chunkedCars.map((chunk, chunkIndex) => {
      return chunk.map((car, carIndexInChunk) => {
        const carDetails = carItems.find(item => item.id === car.id);
        const embed = new EmbedBuilder()
        .setColor(carDetails?.hexcolor ?? "Random")
        .setThumbnail(carDetails.image && carDetails.image.startsWith(`https`) ? carDetails.image: `https://cdn.discordapp.com/app-assets/${APPTOKEN}/${carDetails.image}.png`) // Use image

        let description = '';
        description += `ᯓ★ 𝑩𝒓𝒂𝒏𝒅 𝒏𝒂𝒎𝒆: **${carDetails.name}**\n`;
        description += ` <:follow_reply:1368224897003946004> **𝘖𝘸𝘯𝘴**: ${car.items}\n`;
        description += ` <:follow_reply:1368224897003946004> **𝘊𝘢𝘳**: <:${car.id}_car:${carDetails.emoji}> \n`;
        description += ` <:reply:1368224908307468408> **𝘗𝘶𝘳𝘤𝘩𝘢𝘴𝘦𝘥 𝘊𝘰𝘴𝘵**: <:kasiko_coin:1300141236841086977> ${car.purchasedPrice.toLocaleString()}\n`;
        description += ` \`\`\`ID: ${carDetails.id}\`\`\`\n`;

        embed.setDescription(description.trim());

        if (carIndexInChunk === 0) {
          embed.setTitle(`<@${userId}>'s GARRAGE ✩`);
        }

        // Add footer with page numbers
        if (carIndexInChunk === chunk.length - 1) {
          embed.setFooter({
            text: `Page ${chunkIndex + 1} of ${chunkedCars.length}`
          });
        }
        return embed;
      });
    });

    // Flatten the array-of-arrays (each chunk is an array of multiple embeds)
    // but keep track that each chunk is displayed as a "page".
    let currentPage = 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(chunkedCars.length === 1)
    );

    const messageSent = await handleMessage(context, {
      embeds: embedsArray[currentPage],
      components: [row]
    });

    const collector = messageSent.createMessageComponentCollector({
      time: 120000 // 2-minute timeout
    });

    collector.on('collect', interaction => {
      // If the user is not the same who triggered the command, optional check
      // if (interaction.user.id !== context.user?.id) {
      //   return interaction.reply({ content: "You cannot change pages.", ephemeral: true });
      // }

      if (interaction.customId === 'next') {
        currentPage++;
      } else if (interaction.customId === 'prev') {
        currentPage--;
      }

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
        new ButtonBuilder()
        .setCustomId('next')
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
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('next')
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
        content: "⚠️ Something went wrong while visiting **User's GARRAGE**"
      });
  }
}

//
// ─────────────────────────────────────────────────────────────
//   Buy a car by ID
// ─────────────────────────────────────────────────────────────
//
export async function buycar(context, carId) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    const car = carItems.filter(item => item.id === carId);
    if (!car.length) {
      return handleMessage(context, {
        content: `⚠️ No items with this ID exist.`
      });
    }

    let userData = await getUserData(userId);
    if (userData.cash < car[0].price) {
      return handleMessage(context, {
        content: `⚠️ **${username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉.`
      });
    }

    if (car[0].rarity === "legendary" && userData.networth < 500000) {
      return handleMessage(context, {
        content: `⚠️ **${username}**, your <:kasiko_coin:1300141236841086977> **networth** is too low to purchase this item (minimum required networth: <:kasiko_coin:1300141236841086977> 500,000).`
      });
    }

    // If the user doesn't have this car yet, add a new object; otherwise increment the quantity.
    const userHasCar = userData.cars.some(userCar => userCar.id === carId);
    if (!userHasCar) {
      const userCarData = {
        id: car[0].id,
        purchasedPrice: car[0].price,
        purchasedDate: new Date().toISOString(),
        items: 1
      };
      items[carId].owners += 1;
      userData.cars.push(userCarData);
    } else {
      userData.cars = userData.cars.map(userCar => {
        if (userCar.id === carId) {
          userCar.items += 1;
        }
        return userCar;
      });
    }

    userData.cash -= car[0].price;
    userData.maintenance += car[0].maintenance;
    await updateUser(userId,
      userData);
    writeShopData(items);

    const embed = new EmbedBuilder()
    .setColor('#35e955')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(
      `Everyone congrats 👏🏻 **${username}** for purchasing a brand-new <:${car[0].id}_car:${car[0].emoji}> **${car[0].name}** car 🎉.`
    )
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
        content: `⚠️ **${context.user?.username || context.author?.username}**, something went wrong while buying the car!`
      });
  }
}

//
// ─────────────────────────────────────────────────────────────
//   Sell a car by ID
// ─────────────────────────────────────────────────────────────
//
export async function sellcar(context, carId) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    const car = carItems.filter(item => item.id === carId);
    if (!car.length) {
      return handleMessage(context, {
        content: `⚠️ No items with this ID exist.`
      });
    }

    let userData = await getUserData(userId);

    const userCarIndex = userData.cars.findIndex(item => item.id === carId);
    const userCar = userData.cars[userCarIndex];

    if (!userCar) {
      return handleMessage(context, {
        content: `⚠️ You don't own this car.`
      });
    }

    const amountToAdd = Math.floor(Number(car[0].price || 0) - (0.18 * Number(car[0].price || 0)))

    const embed = new EmbedBuilder()
    .setColor('#e93535')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(
      `**${username}** successfully sold a <:${car[0].id}_car:${car[0].emoji}> **${car[0].name}** car for <:kasiko_coin:1300141236841086977> **${amountToAdd.toLocaleString()}** 𝑪𝒂𝒔𝒉.\n` +
      `Originally purchased that car for <:kasiko_coin:1300141236841086977>${userCar.purchasedPrice}.`
    )
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png'
    })
    .setTimestamp();

    if (userCar.items > 1) {
      userCar.items -= 1;
    } else {
      userData.cars.splice(userCarIndex, 1);
    }

    // Give user back the full price (if that’s the logic you want)
    userData.cash += amountToAdd;
    userData.maintenance -= Number(car[0].maintenance);

    await updateUser(userId, {
      cash: userData.cash,
      maintenance: userData.maintenance,
      cars: userData.cars
    });

    await handleMessage(context,
      {
        embeds: [embed]
      });

    return;
  } catch (e) {
    console.error(e);
    await handleMessage(context,
      {
        content: `⚠️ **${context.user?.username || context.author?.username}**, something went wrong while selling the car!`
      });

    return;
  }
}

//
// ─────────────────────────────────────────────────────────────
//   The "Car" module to export all functionalities
// ─────────────────────────────────────────────────────────────
//
export const Car = {
  sendPaginatedCars,
  viewCar,
  usercars,
  buycar,
  sellcar
};

//
// ─────────────────────────────────────────────────────────────
//   A dispatcher function for the "cars" command
//   (Example usage; you can adapt as needed)
// ─────────────────────────────────────────────────────────────
//
function handleCarCommands(context, args, user) {
  const userId = user?.id;

  // If no second arg => show the command user's cars
  if (!args[1]) {
    return usercars(context, userId);
  }

  // If the second arg is a user mention => show that user's cars
  if (Helper.isUserMention(args[1], context)) {
    const mentionedUserId = Helper.extractUserId(args[1]);
    return usercars(context, mentionedUserId);
  }

  // Otherwise, treat the second arg as a car ID => show details of that car
  return viewCar(context, args[1]);
}

export default {
  name: "cars",
  description: "View owned cars, check another user's cars, or view details of a specific car by ID.",
  aliases: ["car",
    "cr"],
  args: "[user] | <car_id>",
  example: [
    "cars",
    // View the command user's cars
    "cars @User",
    // View cars of a mentioned user
    "cars <car_id>",
    // View details of a specific car by ID
  ],
  emoji: "<:nebula_rs:1347467277846450208>",
  related: ["shop",
    "structures",
    "buildings",
    "houses"],
  cooldown: 10000,
  category: "🛍️ Shop",

  // Execute function when the command is called
  execute: (args, message) => handleCarCommands(message, args, message.author)
};