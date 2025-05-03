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
    if (cachedData && cachedData.ships) {
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

    await redisClient.set(`user:${userId}:ships`, JSON.stringify(userships.toObject()), {
      EX: 60, // Cache for 1 minute
    });

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
    await redisClient.set(`user:${userId}:ships`, JSON.stringify(updatedData.toObject()), {
      EX: 60, // Cache for 1 minute
    });

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
      .setDescription("No ships found! Ships can be found in oceans while catching.\n❔ Use: \`kas catch\` for fishing!\n˙✧˖° 🌊⋆｡˚꩜");

      return message.channel.send({
        embeds: [embed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

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
      content: "<:warning:1366050875243757699> Something went wrong while fetching user's ships."
    }).catch(err => ![50001,
      50013,
      10008].includes(err.code) && console.error(err));
  }
}

async function activeShip(userId, message) {
  try {
    let userShips = await getUserShipsData(userId);

    let activeShip = userShips.ships.find(ship => ship.active);

    if (!activeShip) {
      return message.channel.send({
        content: `<:warning:1366050875243757699> No active ship found for battle! Try to set one from your collection (\`kas ships\`) using \`ships active <shipId>\``,
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    let shipDetails = shipsData.find(ship => ship.id === activeShip.id);
    const embed = new EmbedBuilder()
    .setTitle(`${message.author.username.toUpperCase()}'s 𝘾𝙐𝙍𝙍𝙀𝙉𝙏 𝙎𝙃𝙄𝙋 ⚓`)
    .setDescription(`Commanding the Seas with <:${shipDetails.id}:${shipDetails.emoji}> **${activeShip.name}**`)
    .addFields(
      {
        name: "STATS", value: `\`\`\`𝘋𝘈𝘔𝘈𝘎𝘌: ${activeShip.level * shipDetails.dmg} 𝘏𝘌𝘈𝘓𝘛𝘏: ${activeShip.level * shipDetails.health}\n𝘋𝘜𝘙𝘈𝘉𝘐𝘓𝘐𝘛𝘠: ${activeShip.durability} 𝘓𝘌𝘝𝘌𝘓: ${activeShip.level}\`\`\``, inline: false
      },
      {
        name: "*NEXT LEVEL COST*", value: `-# <:coin:1304675604171460728> ${(activeShip.level + 1) * shipDetails.levelUpCost}`, inline: true
      },
      {
        name: "*REPAIR COST*", value: `-# <:coin:1304675604171460728> ${shipDetails.repairCost}  (*+25 Durability*)`, inline: true
      },
    )
    .setThumbnail(`https://cdn.discordapp.com/emojis/${shipDetails.emoji}.png`) // Optional: Add the ship's image
    .setFooter({
      text: "ᴜꜱᴇ `ᴋᴀꜱ ᴀᴄᴛɪᴠᴇ ʀᴇᴘᴀɪʀ` ꜰᴏʀ ʀᴇᴘᴀɪʀ ᴏʀ `ᴋᴀꜱ ᴀᴄᴛɪᴠᴇ ᴜᴘ` ꜰᴏʀ ʟᴇᴠᴇʟ ᴜᴘ. 🌊"
    });

    return message.channel.send({
      embeds: [embed]
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } catch (e) {
    console.error(e);
    return message.channel.send({
      content: "<:warning:1366050875243757699> Something went wrong while fetching user's active ship.",
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function setActiveShip(shipId, userId, message) {
  try {
    let userShips = await getUserShipsData(userId);

    if (!shipId) return message.channel.send(`**${message.author.username}**, please provide a valid ship ID.`);

    if (!userShips.ships.some(ship => ship.id && ship.id === shipId.toLowerCase())) return message.channel.send("<:warning:1366050875243757699> No ship found with this id.");

    let activeShip = userShips.ships.findIndex(ship => ship.active);

    if (activeShip && userShips.ships[activeShip] && userShips.ships[activeShip].id === shipId) return message.channel.send("<:warning:1366050875243757699> Your ship is already active for battle & defence.");

    let toActiveShip = userShips.ships.findIndex(ship => ship.id === shipId.toLowerCase());

    if (userShips.ships[activeShip] && userShips.ships[activeShip].active === true) {
      userShips.ships[activeShip].active = false;
    }
    userShips.ships[toActiveShip].active = true;

    await modifyUserShips(userId, userShips);

    return message.channel.send(`**${message.author.username}**, your current active ship is set to **${userShips.ships[toActiveShip].name}**\n⭑𓂃\n\`Kas ships active\` for more details, \`kas active repair\` for repair & \`kas active up\` for level up. ˙✧˖° 🌊⋆｡˚꩜`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while setting ship active.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function levelUp(userId, message) {
  try {
    let userData = await getUserData(userId);
    let userShips = await getUserShipsData(userId);
    let activeShip = userShips.ships.findIndex(ship => ship.active);

    if (!userShips.ships[activeShip]) return message.channel.send("<:warning:1366050875243757699> No active ship found for battle! Try to set one from your collection (\`kas ships\`) using \`ships active <shipId>\`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    let shipDetails = shipsData.find(ship => ship.id === userShips.ships[activeShip].id);

    let cost = userShips.ships[activeShip].level * shipDetails.levelUpCost;

    if (userData.cash < cost) {
      return message.channel.send(`<:warning:1366050875243757699> You don't have enough cash to level up the ship. Required cash: <:coin:1304675604171460728>${cost}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    userData.cash -= cost;
    userShips.ships[activeShip].level += 1;

    await updateUser(userId, userData);
    await modifyUserShips(userId, userShips);

    return message.channel.send(`<:celebration:1368113208023318558> 𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀, ${message.author.username.toUpperCase()}!\n𝘠𝘰𝘶𝘳 𝘴𝘩𝘪𝘱, <:${shipDetails.id}:${shipDetails.emoji}> **${shipDetails.name}**, 𝘩𝘢𝘴 𝘭𝘦𝘷𝘦𝘭𝘦𝘥 𝘶𝘱!\n\n**𝘕𝘦𝘸 𝘓𝘦𝘷𝘦𝘭**: **${userShips.ships[activeShip].level}**\n**𝘊𝘰𝘴𝘵**: <:coin:1304675604171460728>${cost}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while leveling up the ship.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function repair(times = 1, userId, message) {
  try {
    let userData = await getUserData(userId);
    let userShips = await getUserShipsData(userId);

    let activeShip = userShips.ships.findIndex(ship => ship.active);

    if (!userShips.ships[activeShip]) return message.channel.send("<:warning:1366050875243757699> No active ship found for battle! Try to set one from your collection (\`kas ships\`) using \`ships active <shipId>\`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    let shipDetails = shipsData.find(ship => ship.id === userShips.ships[activeShip].id);

    let cost = shipDetails.repairCost * times;

    if (userData.cash < cost) {
      return message.channel.send(`<:warning:1366050875243757699> You don't have enough cash to repair the ship. Required cash: <:coin:1304675604171460728>${cost}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    userData.cash -= cost;
    userShips.ships[activeShip].durability += 25 * times;

    await updateUser(userId, userData);
    await modifyUserShips(userId, userShips);

    return message.channel.send(`<:celebration:1368113208023318558> 𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀, ${message.author.username.toUpperCase()}!\n𝘠𝘰𝘶𝘳 𝘴𝘩𝘪𝘱, <:${shipDetails.id}:${shipDetails.emoji}> **${shipDetails.name}**, 𝘩𝘢𝘴 𝘣𝘦𝘦𝘯 𝘴𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺 𝘳𝘦𝘱𝘢𝘪𝘳𝘦𝘥.\n\n**𝘋𝘶𝘳𝘢𝘣𝘪𝘭𝘪𝘵𝘺**: **${userShips.ships[activeShip].durability}** (*+${25 * times}*)\n**𝘊𝘰𝘴𝘵**: <:coin:1304675604171460728> ${cost}️`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

  } catch (e) {
    console.error(e);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while repairing ship.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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
  name: "ships",
  description: "Embark on thrilling pirate battles, attack rivals, activate your ship, upgrade its power, repair damages, and track your ship's stats!",
  aliases: ["active"],
  // Aliases allow calling the command with different variations for battles or ships
  args: "<action> [target]",
  example: [
    "ships",
    "ships active <shipId>",
    "active",
    "active up",
    "active repair 10"
  ],
  related: ["battle",
    "stat",
    "profile"],
  cooldown: 8000,
  emoji: "⛵",
  category: "⚓ Pirates",

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
      return message.channel.send("<:warning:1366050875243757699> **Invalid Command**\nUse `ship/ships` to view all ships' stats, `active` to see stats of your current active ship, `ships active <shipId>` to set an active ship, `active up` to level up, or `active repair`/`active repair <times>` to increase durability in a pirate battle.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
}