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
} from '../database.js';

import dotenv from 'dotenv';
dotenv.config();

const APPTOKEN = process.env.APP_ID;


const items = readShopData();
const carItems = Object.values(items).filter(item => item.type === "car");

// Embed builder
function createCarEmbed(car) {
  return new EmbedBuilder()
  .setTitle(car.name)
  .setDescription(car.description)
  .setThumbnail(`https://cdn.discordapp.com/app-assets/${APPTOKEN}/${car.image}.png`) // Use image
  .addFields(
    {
      name: "ᯓ★ Price", value: `<:kasiko_coin:1300141236841086977>${car.price}`, inline: true
    },
    {
      name: "ᯓ★ Original Price", value: `<:kasiko_coin:1300141236841086977>${car.originalPrice}`, inline: true
    },
    {
      name: "ᯓ★ Category", value: car.category, inline: true
    },
    {
      name: "ᯓ★ owners", value: `${car.owners}`, inline: true
    },
    {
      name: "ᯓ★ Rarity", value: car.rarity, inline: true
    },
    {
      name: "ᯓ★ Maintenance Cost", value: `<:kasiko_coin:1300141236841086977>$${car.maintenance}`, inline: true
    },
    {
      name: "ᯓ★ Emoji", value: `<:${car.id}:${car.emoji}>`, inline: true
    },
    {
      name: "ᯓ★ Color", value: car.color, inline: true
    }
  )
  .setFooter({
    text: `ID: ${car.id}`
  })
  .setColor("#0b4ee2");
}

export async function sendPaginatedCars(context) {
  try {
    const user = context.user || context.author; // Handles both Interaction and Message
    if (!user) return; // Handle the case where neither user nor author exists

    let currentIndex = 0;
    const carEmbed = createCarEmbed(carItems[currentIndex]);

    // Buttons for navigation
    const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setCustomId("previousCar")
      .setLabel("PreviousCar")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId("nextCar")
      .setLabel("NextCar")
      .setStyle(ButtonStyle.Primary)
    );

    // Send initial message
    const message = await context.channel.send({
      embeds: [carEmbed], components: [buttons], fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
      time: 180000
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id) {
        return buttonInteraction.reply({
          content: "You can't interact with this button.", ephemeral: true
        });
      }

      // Update index based on button click
      if (buttonInteraction.customId === "nextCar") {
        currentIndex++;
      } else if (buttonInteraction.customId === "previousCar") {
        currentIndex--;
      }

      // Update embed and button state
      const newCarEmbed = createCarEmbed(carItems[currentIndex]);
      buttons.components[0].setDisabled(currentIndex === 0);
      buttons.components[1].setDisabled(currentIndex === carItems.length - 1);

      await buttonInteraction.update({
        embeds: [newCarEmbed], components: [buttons]
      });
    });

    collector.on("end",
      () => {
        buttons.components.forEach(button => button.setDisabled(true));
        message.edit({
          components: [buttons]
        });
      });
  } catch (e) {
    console.error(e);
    return context.channel.send("⚠️ Something went wrong while viewing shop!");
  }
}

export async function viewCar(id, message) {
  const car = Object.values(carItems).filter(item => item.id === id);

  if (car.length === 0) {
    return message.channel.send(`⚠️ No items with this ID exist.`);
  }

  // Create the car embed
  const carEmbed = await createCarEmbed(car[0]);

  return message.channel.send({
    embeds: [carEmbed]
  });
}

export async function usercars(userId, message) {
  try {
    let userData = getUserData(userId);
    const cars = userData.cars;

    let Garrage = "";

    if (cars.length === 0) {
      Garrage = "⚠️ User doesn't own any cars!";
    } else {
      cars.forEach((car, i) => {
        let carDetails = Object.values(carItems).filter(item => item.id === car.id);
        Garrage += `\nᯓ★ 𝑩𝒓𝒂𝒏𝒅 𝒏𝒂𝒎𝒆: **${carDetails[0].name}**\n**Owns**: ${car.items}\n**Car**: <:${car.id}_car:${carDetails[0].emoji}> \n**Purchased Cost**: ${car.purchasedPrice}\n`;
      })
    }

    const embed = new EmbedBuilder()
    .setColor('#6835fe')
    .setTitle(`░ <@${userId}> 's GARRAGE ░ ✩`)
    .setDescription(Garrage)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/avatars/1300081477358452756/cbafd10eba2293768dd9c4c0c7d0623f.png'
    })
    .setTimestamp();

    return message.channel.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(e)
    return message.channel.send("⚠️ something went wrong while visiting **User's Garrage**");
  }
}

export async function buycar(message, carId) {
  try {
    const car = Object.values(carItems).filter(item => item.id === carId);
    let userData = getUserData(message.author.id);

    if (car.length === 0) {
      return message.channel.send(`⚠️ No items with this ID exist.`);
    }

    if (userData.cash < car[0].price) {
      return message.channel.send(`⚠️ **$ {
        message.author.username
        }**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉.`);
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
    userData.networth += car[0].price;
    userData.maintanence += car[0].maintenance;
    
    items[carId].owners += 1;

    updateUser(message.author.id,
      userData);
    writeShopData(items);

    const embed = new EmbedBuilder()
    .setColor('#35e955')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(`\n✩▓▅▁𝐍𝐞𝐰 𝐂𝐚𝐫▁▅▓✩\n\n Everyone congrats 👏🏻 **${message.author.username}** for purchasing brand-new <:${car[0].id}_car:${car[0].emoji}> **${car[0].name}** car 🎉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/avatars/1300081477358452756/cbafd10eba2293768dd9c4c0c7d0623f.png'
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
    let userData = getUserData(message.author.id);
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
      return car;
    }).filter(car => car.items > 0);

    userData.networth -= userCar[0].purchasedPrice;
    userData.cash += Number(car[0].price);
    userData.maintanence -= Number(car[0].maintenance);
    
    items[carId].owners -= 1;
    
    writeShopData(items);
    updateUser(message.author.id,
      userData);

    const embed = new EmbedBuilder()
    .setColor('#e93535')
    .setTitle('🧾 𝐓𝐫𝐚𝐧𝐬𝐢𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥')
    .setDescription(`**${message.author.username}** successfully sold a <:${car[0].id}_car:${car[0].emoji}> **${car[0].name}** car for <:kasiko_coin:1300141236841086977> **${car[0].price}** 𝑪𝒂𝒔𝒉.\nOriginally purchased that car for <:kasiko_coin:1300141236841086977>${userCar[0].purchasedPrice}.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/avatars/1300081477358452756/cbafd10eba2293768dd9c4c0c7d0623f.png'
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