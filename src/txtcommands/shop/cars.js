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


const items = readShopData();
const carItems = Object.values(items).filter(item => item.type === "car");

// Embed builder
function createCarEmbed(car) {
  return [new EmbedBuilder()
    .setTitle(car.name)
    .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${car.image}.png`) // Use image
    .addFields(
      {
        name: `ᯓ★ Price`, value: `**Price:** <:kasiko_coin:1300141236841086977>${car.price}\n**Maintenance Cost:** <:kasiko_coin:1300141236841086977>${car.maintenance}`, inline: false
      },
      {
        name: `ᯓ★ Car Details`, value: `**ID:** ${car.id}\n**Category:** ${car.category}\n**Owners:** ${car.owners}\n**Rarity:** ${car.rarity}\n**Color:** ${car.color}\n**Emoji:** <:${car.id}:${car.emoji}>
        `, inline: false
      }
    )
    .setFooter({
      text: `ID: ${car.id} | \`kas car ${car.id}\``
    })
    .setColor("#0b4ee2"),
    new EmbedBuilder().setDescription(car.description)]
}

export async function sendPaginatedCars(context) {
  try {
    const user = context.user || context.author; // Handles both Interaction and Message
    if (!user) return;

    if (!carItems || carItems.length === 0) {
      return context.channel.send("No cars are available to view!");
    }

    let currentIndex = 0;
    const carEmbed = createCarEmbed(carItems[currentIndex]);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId("previousCar")
      .setLabel("Previous Car")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId("nextCar")
      .setLabel("Next Car")
      .setStyle(ButtonStyle.Primary)
    );

    const message = await context.channel.send({
      embeds: carEmbed,
      components: [buttons],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      time: 180000,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        await buttonInteraction.reply({
          content: "You can't interact with this button.",
          ephemeral: true,
        });
        return; // Stop further processing
      }

      await buttonInteraction.deferUpdate();

      if (buttonInteraction.customId === "nextCar") {
        currentIndex = Math.min(currentIndex + 1, carItems.length - 1);
      } else if (buttonInteraction.customId === "previousCar") {
        currentIndex = Math.max(currentIndex - 1, 0);
      }

      const newCarEmbed = createCarEmbed(carItems[currentIndex]);
      buttons.components[0].setDisabled(currentIndex === 0);
      buttons.components[1].setDisabled(currentIndex === carItems.length - 1);

      return await message.edit({
        embeds: newCarEmbed,
        components: [buttons],
      });
    });

    collector.on("end",
      async () => {
        try {
          buttons.components.forEach((button) => button.setDisabled(true));
          return await message.edit({
            components: [buttons]
          });
        } catch (err) {
          console.error("Failed to edit message after collector ended:", err);
        }
      });
  } catch (e) {
    console.error("Error in sendPaginatedCars:",
      e);
    return context.channel.send("⚠️ Something went wrong while viewing the shop!");
  }
}

export async function viewCar(id, message) {
  const car = Object.values(carItems).filter(item => item.id === id.toLowerCase());

  if (car.length === 0) {
    return message.channel.send(`⚠️ No items with this ID exist.`);
  }

  // Create the car embed
  const carEmbed = await createCarEmbed(car[0]);

  return message.channel.send({
    embeds: carEmbed
  });
}

export async function usercars(userId, message) {
  try {
    let userData = await getUserData(userId);
    const cars = userData.cars;

    if (cars.length === 0) {
      const embed = new EmbedBuilder()
      .setColor(0xFFCC00)
      .setTitle("No Cars Found!")
      .setDescription("⚠️ User doesn't own any cars!");

      return message.channel.send({
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
    const embeds = chunkedCars.map((chunk, index) => {
      const embeds = chunk.map((car, CarIndex) => {
        const carDetails = Object.values(carItems).find(item => item.id === car.id);

        const embed = new EmbedBuilder()
        .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${carDetails.emoji}.png`)
        .setColor('#6835fe');

        // Add car details to embed
        let description = '';
        description += `ᯓ★ 𝑩𝒓𝒂𝒏𝒅 𝒏𝒂𝒎𝒆: **${carDetails.name}**\n**Owns**: ${car.items}\n**Car**: <:${car.id}_car:${carDetails.emoji}> \n**Purchased Cost**: <:kasiko_coin:1300141236841086977> ${car.purchasedPrice}\n\n`;

        embed.setDescription(description.trim());

        if (CarIndex === 0) {
          embed.setTitle(`░ <@${userId}> 's GARRAGE ░ ✩`)
        }

        // Add footer with page numbers
        if (CarIndex === (chunk.length - 1)) {
          embed.setFooter({
            text: `Page ${index + 1} of ${chunkedCars.length}`
          });
        }
        return embed;
      });

      return embeds;
    });

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

    const sentMessage = await message.channel.send({
      embeds: embeds[currentPage],
      // Send the first embed
      components: [row]
    });

    const collector = sentMessage.createMessageComponentCollector({
      filter: interaction => interaction.user.id === userId || interaction.user.id !== userId,
      time: 60000 // 1-minute timeout
    });

    collector.on('collect',
      interaction => {
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: "⚠️ Only the original user can interact with these buttons!",
            ephemeral: true // Private reply
          });
        }

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
          .setDisabled(currentPage === embeds.length - 1)
        );

        interaction.update({
          embeds: embeds[currentPage], // Update to the current page embed
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

        sentMessage.edit({
          components: [disabledRow]
        }).catch(() => {});
      });

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while visiting **User's GARRAGE**");
  }
}

export async function buycar(message, carId) {
  try {
    const car = Object.values(carItems).filter(item => item.id === carId);
    let userData = await getUserData(message.author.id);

    if (car.length === 0) {
      return message.channel.send(`⚠️ No items with this ID exist.`);
    }

    if (userData.cash < car[0].price) {
      return message.channel.send(`⚠️ **${message.author.username}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉.`);
    }

    if (car[0].rarity === "Legendary" && userData.networth < 100000) {
      return message.channel.send(`⚠️ **${message.author.username}**, your <:kasiko_coin:1300141236841086977> **networth** is too low to purchase this item (minimum required networth: <:kasiko_coin:1300141236841086977> 100000).`);
    }

    if (!userData.cars.some(car => car.id === carId)) {
      let userCarData = {
        id: car[0].id,
        purchasedPrice: car[0].price,
        purchasedDate: new Date().toISOString(),
        items: 1
      }
      items[carId].owners += 1;
      userData.cars.push(userCarData);
    } else {
      userData.cars = userData.cars.map(car => {
        if (car.id === carId) {
          car.items += 1;
        }
        return car;
      });
    }

    userData.cash -= car[0].price;
    userData.maintenance += car[0].maintenance;

    await updateUser(message.author.id,
      userData);
    writeShopData(items);

    const embed = new EmbedBuilder()
    .setColor('#35e955')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(`\n✩▓▅▁𝐍𝐞𝐰 𝐂𝐚𝐫▁▅▓✩\n\n Everyone congrats 👏🏻 **${message.author.username}** for purchasing brand-new <:${car[0].id}_car:${car[0].emoji}> **${car[0].name}** car 🎉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
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

export async function sellcar(message, carId) {
  try {
    const car = Object.values(carItems).filter(item => item.id === carId);
    let userData = await getUserData(message.author.id);
    const userCar = Object.values(userData.cars).filter(item => item.id === carId);

    if (car.length === 0) {
      return message.channel.send(`⚠️ No items with this ID exist.`);
    }

    if (!userData.cars.some(car => car.id === carId)) {
      return message.channel.send(`⚠️ You don't own this car.`);
    }

    userData.cars = userData.cars.map(car => {
      if (car.id === carId) {
        car.items -= 1;
        return car;
      }
      items[carId].owners -= 1;
      return car;
    }).filter(car => car.items > 0);

    userData.cash += Number(car[0].price);
    userData.maintenance -= Number(car[0].maintenance);

    writeShopData(items);
    await updateUser(message.author.id,
      userData);

    const embed = new EmbedBuilder()
    .setColor('#e93535')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(`**${message.author.username}** successfully sold a <:${car[0].id}_car:${car[0].emoji}> **${car[0].name}** car for <:kasiko_coin:1300141236841086977> **${car[0].price}** 𝑪𝒂𝒔𝒉.\nOriginally purchased that car for <:kasiko_coin:1300141236841086977>${userCar[0].purchasedPrice}.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
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

export const Car = {
  sendPaginatedCars,
  viewCar,
  usercars,
  buycar,
  sellcar
}


function handleCarCommands(args, message) {
  if (!args[1]) return usercars(message.author.id, message);
  if (Helper.isUserMention(args[1])) return usercars(Helper.extractUserId(args[1]), message);
  return viewCar(args[1], message);
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
  related: ["shop",
    "structures",
    "buildings",
    "houses"],
  cooldown: 4000,
  category: "Shop",

  // Execute the function when the command is called
  execute: (args, message) => handleCarCommands(args, message)
};