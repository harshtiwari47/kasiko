import fs from 'fs';
import path from 'path';

import {
  Helper
} from '../../../helper.js';

import UserShips from "../../../models/UserShips.js";
import redisClient from "../../../redis.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname); // Get the directory of the current filter
const shipsDatabasePath = path.join(__dirname, '../../../data/ships.json');

import {
  client
} from "../../../bot.js";

import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export const allShips = () => {
  const data = fs.readFileSync(shipsDatabasePath, 'utf-8');
  return JSON.parse(data);
}

// Fetch all ships for a user
export const getUserShipsData = async (userId) => {
  try {

    const cachedData = await redisClient.get(`user:${userId}:ships`);
    if (cachedData) {
      // If data is in cache, parse and return it
      let data = UserShips.hydrate(JSON.parse(cachedData));
      return data;
    }

    let userships = await UserShips.findOne({
      id: userId
    });

    if (!userships) {
      userships = new UserShips( {
        id: userId,
        ships: []
      })
    }

    await redisClient.set(`user:${userId}:ships`, JSON.stringify(userships.toObject()));

    return userships
  } catch (error) {
    console.error('Error fetching user\`s ships data:', error);
    return null
  }
};

// Modify ship data for a user (without changing the primary key)
export const modifyUserShips = async (userId, data) => {
  try {
    // Save the updated user document
    const updatedData = await data.save();
    await redisClient.del(`user:${userId}:ships`);
    await redisClient.set(`user:${userId}:ships`, JSON.stringify(updatedData.toObject()));

    return updatedData; // Return the updated user
  } catch (error) {
    console.error('Error in transaction while saving user\'s ships data:', error);
    return 'Error in transaction';
  }
};

export const shipsData = Object.values(allShips());


async function showUserShips(userId, message) {
  try {
    const userData = await getUserShipsData(userId);
    const user = await message.client.users.fetch(userId).catch(() => ({
      username: "Failed to Fetch"
    }));

    const ships = userData.ships.map(ship => {
      const shipDetails = shipsData.find(shipInfo => shipInfo.id === ship.id);
      return {
        id: ship.id,
        name: shipDetails.name,
        durability: ship.durability,
        dmg: ship.level * shipDetails.dmg,
        rarity: shipDetails.rarity,
        health: ship.level * shipDetails.health,
        emoji: shipDetails.emoji,
        active: ship.active,
        level: ship.level
      };
    });

    if (!ships.length) {
      const embed = new EmbedBuilder()
      .setColor(0x1E90FF)
      .setTitle(`⚓🏴‍☠️ ${user.username}'s 𝐒𝐡𝐢𝐩𝐬 ⛵`)
      .setDescription("No ships found! Ships can be found in oceans while catching.\n˙✧˖° 🌊⋆｡˚꩜");

      return message.channel.send({
        embeds: [embed]
      });
    }

    // Split ships into chunks of 3
    const chunkedShips = [];
    for (let i = 0; i < ships.length; i += 3) {
      chunkedShips.push(ships.slice(i, i + 3));
    }

    const embeds = chunkedShips.map((shipChunk, index) => {
      const description = shipChunk.map(({
        id,
        active,
        emoji,
        name,
        durability,
        dmg,
        health,
        rarity,
        level
      }) =>
        `**<:${id}:${emoji}> ${name}** ${active ? "**⚓ ᗩᑕTIᐯE**": ""}\n` +
        `> **Durability:** ${durability} | **Dmg:** ${dmg} | **Health:** ${health} | **Lvl:** ${level}\n` +
        `> **Rarity:** ${rarity} | **ID:** ${id}\n`
      ).join('\n');

      return new EmbedBuilder()
      .setColor(0x1e90ff)
      .setDescription(description.trim())
      .setFooter({
        text: `Page ${index + 1} of ${chunkedShips.length} | \`kas help ships\``
      });
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
      .setDisabled(chunkedShips.length === 1)
    );

    const embedImage = new EmbedBuilder()
    .setColor(0x1e54ff)
    .setTitle(`⚓ **${user.username}'**s 𝐒𝐡𝐢𝐩𝐬`)
    .setDescription('ˢʰⁱᵖˢ ᶜᵃⁿ ᵇᵉ ᶠᵒᵘⁿᵈ ʷʰⁱˡᵉ ᶠⁱˢʰⁱⁿᵍ ⁱⁿ ᵗʰᵉ ᵒᶜᵉᵃⁿ! 🏴‍☠️ ')
    .setThumbnail('https://cdn.discordapp.com/emojis/1304674341849665626.png');

    const sentMessage = await message.channel.send({
      embeds: [embedImage, embeds[currentPage]],
      components: [row]
    });

    const collector = sentMessage.createMessageComponentCollector({
      filter: interaction => interaction.user.id === message.author.id,
      time: 60000 // 1 minute
    });

    collector.on('collect', interaction => {
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
        embeds: [embedImage, embeds[currentPage]],
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
    message.channel.send({
      content: "⚠️ Something went wrong while fetching user's ships."
    });
  }
}

async function activeShip(userId, message) {
  try {
    let userShips = await getUserShipsData(userId);

    let activeShip = userShips.ships.find(ship => ship.active);

    if (!activeShip) {
      return message.channel.send({
        content: `⚠️ No active ship found for battle! Try to set one from your collection \`ship active <shipId>\``,
      });
    }

    let shipDetails = shipsData.find(ship => ship.id === activeShip.id);
    const embed = new EmbedBuilder()
    .setColor(0x1d4ed8) // You can customize the color
    .setTitle(`${message.author.username}'s 𝕮𝖚𝖗𝖗𝖊𝖓𝖙 𝕾𝖍𝖎𝖕 ⚓`)
    .setDescription(`**${message.author.username}**, Commanding the Seas with <:${shipDetails.id}:${shipDetails.emoji}> **${activeShip.name}**`)
    .addFields(
      {
        name: "𝐷𝑎𝑚𝑎𝑔𝑒", value: `${activeShip.level * shipDetails.dmg} ✧`, inline: true
      },
      {
        name: "𝐻𝑒𝑎𝑙𝑡ℎ", value: `${activeShip.level * shipDetails.health}`, inline: true
      },
      {
        name: "𝐷𝑢𝑟𝑎𝑏𝑖𝑙𝑖𝑡𝑦", value: `${activeShip.durability}`, inline: true
      },
      {
        name: "𝐿𝑒𝑣𝑒𝑙", value: `${activeShip.level}`, inline: true
      },
      {
        name: "𝑵𝒆𝒙𝒕 𝑳𝒆𝒗𝒆𝒍 𝑪𝒐𝒔𝒕", value: `<:coin:1304675604171460728>${(activeShip.level + 1) * shipDetails.levelUpCost}`, inline: true
      },
      {
        name: "𝑹𝒆𝒑𝒂𝒊𝒓 𝑪𝒐𝒔𝒕 (+25 Durability)", value: `<:coin:1304675604171460728>${shipDetails.repairCost}`, inline: true
      },
    )
    .setImage(shipDetails.imageURL || null) // Optional: Add the ship's image
    .setFooter({
      text: "Use `kas active repair` for repair or `kas active up` for level up. 🌊"
    });

    return message.channel.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(e);
    return message.channel.send({
      content: "⚠️ Something went wrong while fetching user's active ship.",
    });
  }
}

async function setActiveShip(shipId, userId, message) {
  try {
    let userShips = await getUserShipsData(userId);

    if (!shipId) return message.channel.send(`**${message.author.username}**, please provide a valid ship ID.`);

    if (!userShips.ships.some(ship => ship.id && ship.id === shipId.toLowerCase())) return message.channel.send("⚠️ No ship found with this id.");

    let activeShip = userShips.ships.findIndex(ship => ship.active);

    if (activeShip && userShips.ships[activeShip] && userShips.ships[activeShip].id === shipId) return message.channel.send("⚠️ Your ship is already active for battle & defence.");

    let toActiveShip = userShips.ships.findIndex(ship => ship.id === shipId.toLowerCase());

    if (userShips.ships[activeShip] && userShips.ships[activeShip].active === true) {
      userShips.ships[activeShip].active = false;
    }
    userShips.ships[toActiveShip].active = true;

    await modifyUserShips(userId, userShips);

    return message.channel.send(`**${message.author.username}**, your current active ship is set to **${userShips.ships[toActiveShip].name}**\n⭑𓂃\n\`Kas ship active\` for more details, \`kas active repair\` for repair & \`kas active up\` for level up. ˙✧˖° 🌊⋆｡˚꩜`);

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while setting ship active.");
  }
}

async function levelUp(userId, message) {
  try {
    let userData = await getUserData(userId);
    let userShips = await getUserShipsData(userId);
    let activeShip = userShips.ships.findIndex(ship => ship.active);

    if (!userShips.ships[activeShip]) return message.channel.send("⚠️ No active ship found.");
    let shipDetails = shipsData.find(ship => ship.id === userShips.ships[activeShip].id);

    let cost = userShips.ships[activeShip].level * shipDetails.levelUpCost;

    if (userData.cash < cost) {
      return message.channel.send(`⚠️ You don't have enough cash to level up the ship. Required cash: <:coin:1304675604171460728>${cost}`);
    }

    userData.cash -= cost;
    userShips.ships[activeShip].level += 1;

    await updateUser(userId, userData);
    await modifyUserShips(userId, userShips);

    return message.channel.send(`🎉 𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧𝐬 ! You've successfully leveled up your ship, <:${shipDetails.id}:${shipDetails.emoji}> **${shipDetails.name}**, to Level **${userShips.ships[activeShip].level}** costing <:coin:1304675604171460728>${cost}. Keep going, captain!🏴‍☠️⚓`);

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while leveling up the ship.");
  }
}

async function repair(times = 1, userId, message) {
  try {
    let userData = await getUserData(userId);
    let userShips = await getUserShipsData(userId);

    let activeShip = userShips.ships.findIndex(ship => ship.active);

    if (!userShips.ships[activeShip]) return message.channel.send("⚠️ No active ship found.");
    let shipDetails = shipsData.find(ship => ship.id === userShips.ships[activeShip].id);

    let cost = shipDetails.repairCost * times;

    if (userData.cash < cost) {
      return message.channel.send(`⚠️ You don't have enough cash to repair the ship. Required cash: <:coin:1304675604171460728>${cost}`);
    }

    userData.cash -= cost;
    userShips.ships[activeShip].durability += 25 * times;

    await updateUser(userId, userData);
    await modifyUserShips(userId, userShips);

    return message.channel.send(`🎉 𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧𝐬 ! You've successfully repaired your ship, <:${shipDetails.id}:${shipDetails.emoji}> **${shipDetails.name}**, to durability **${userShips.ships[activeShip].durability}** (+${25 * times}) costing <:coin:1304675604171460728>${cost}.⚓🏴‍☠️`);

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while repairing ship.");
  }
}

export const Ship = {
  allShips,
  getUserShipsData,
  modifyUserShips,
  showUserShips,
  shipsData,
  activeShip,
  setActiveShip,
  levelUp,
  repair
};


export default {
  name: "ship",
  description: "View or engage in pirate battles, attack others, check ship stats, weapon stats, and battle messages.",
  aliases: ["ship",
    "ships",
    "active"],
  // Aliases allow calling the command with different variations for battles or ships
  args: "<action> [target]",
  example: [
    "ship",
    "ship active <shipId (optional: specify to set as active)>",
    "active",
    "active <option> (option: use 'up' to level up or 'repair <count>' for number of repairs; count is optional)",
  ],
  related: ["battle",
    "stat",
    "profile"],
  cooldown: 5000,
  category: "Battle",

  // Execute function based on the command alias
  execute: (args,
    message) => {
    const action = args[0] ? args[0].toLowerCase(): null;

    switch (action) {
    case "ship":
    case "ships":
      if (args[1]) {
        if (args[1].toLowerCase() === "active" && !args[2]) {
          return Ship.activeShip(message.author.id, message);
        } else {
          return Ship.setActiveShip(args[2], message.author.id, message);
        }
      } else {
        // If the command is "ship", show ship stats
        return Ship.showUserShips(message.author.id, message);
      }
      break;
    case "active":
      if (args[1]) {
        if (args[1] === "up") {
          return Ship.levelUp(message.author.id, message);
        } else if (args[1] === "repair") {
          let times = args[2] && Helper.isNumber(args[2]) ? args[2]: 1;
          return Ship.repair(times, message.author.id, message);
        }
      } else {
        return Ship.activeShip(message.author.id, message);
      }
      break;
    default:
      return message.channel.send("⚔️ **Invalid Command**\nUse `ship/ships` to view all ships' stats, `active` to see stats of your current active ship, `ship active <shipId>` to set an active ship, `active up` to level up, or `active repair`/`active repair <times>` to increase durability in a pirate battle.");
    }
  }
}