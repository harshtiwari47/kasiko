import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname); // Get the directory of the current filter
const shipsDatabasePath = path.join(__dirname, '../../../data/ships.json');
const userShipsPath = path.join(__dirname, '../../../database/ships.json');

import {
  client
} from "../../../bot.js";

import {
  getUserData,
  updateUser
} from '../../../database.js';

if (!fs.existsSync(userShipsPath)) {
  fs.writeFileSync(userShipsPath, JSON.stringify({}, null, 2));
}

export const allShips = () => {
  const data = fs.readFileSync(shipsDatabasePath, 'utf-8');
  return JSON.parse(data);
}

export const getUsersShips = () => {
  const data = fs.readFileSync(userShipsPath, 'utf-8');
  return JSON.parse(data);
};

export const getUserShipsData = (userId) => {
  const data = getUsersShips();

  if (!data[userId]) {
   data[userId] = initializeUserShips(userId);
  }

  return data[userId];
};

export const saveUsersShips = (data) => {
  fs.writeFileSync(userShipsPath, JSON.stringify(data, null, 2));
};

export const doesUserShipExist = (userId) => {
  const data = getUsersShips();
  return data.hasOwnProperty(userId);
};

export const initializeUserShips = (userId) => {
  const data = getUsersShips();

  if (data[userId]) {
    return data[userId]
  }

  const userData = [];

  data[userId] = userData;
  saveUsersShips(data);
  return userData;
};

export const modifyUserShips = (userId, newData) => {
  const data = getUsersShips();

  if (!data[userId]) {
    initializeUserShips(userId);
  }

  data[userId] = newData;
  saveUsersShips(data);
};


export const shipsData = Object.values(allShips());

async function showUserShips(userId, message) {
  try {
    const userData = getUserShipsData(userId);
    let user = await client.users.fetch(userId) || {
        "username": "Failed to Fetch" }
    
    const ships = userData.map(ship => {
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

    const sendmessage = ships.map(({
      id, active, emoji, name, durability, dmg, health, rarity, level
    }) =>
      `**<:${id}:${emoji}> ${name}** ${active ? "**⚓ ᗩᑕTIᐯE **": ""}\n` +
      `> **𝐷𝑢𝑟𝑎𝑏𝑖𝑙𝑖𝑡𝑦:** ${durability} | **𝐷𝑚𝑔:** ${dmg} | **𝐻𝑒𝑎𝑙𝑡ℎ :** ${health} | **𝐿𝑣𝑙**: ${level}\n` +
      `> **Rarity:** ${rarity} | **ID:** ${id}\n` +
      ' '
    ).join('\n');

    message.channel.send(`⚓🏴‍☠️ **${user.username}'s 𝐒𝐡𝐢𝐩𝐬** ⛵\n\n${sendmessage || "No ships found! Ships can be found in oceans while catching."} \n˙✧˖° 🌊⋆｡˚꩜`);
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while fetching user's ships.");
  }
}

async function activeShip(userId, message) {
  try {
    let userShips = getUserShipsData(userId);

    let activeShip = userShips.find(ship => ship.active);

    if (!activeShip) return message.channel.send(`⚠️ No active ship found for battle! Try to set one from your collection \`ship active <shipId>\``);

    let shipDetails = shipsData.find(ship => ship.id === activeShip.id);

    let shipCard = `**𝐷𝑎𝑚𝑎𝑔𝑒 **: ${activeShip.level * shipDetails.dmg} ✧ **𝐻𝑒𝑎𝑙𝑡ℎ **: ${activeShip.level * shipDetails.health}\n**𝐷𝑢𝑟𝑎𝑏𝑖𝑙𝑖𝑡𝑦 **: ${activeShip.durability} ✧ **𝐿𝑒𝑣𝑒𝑙 **: ${activeShip.level}\n⭑𓂃𓂃⭑\n**𝑵𝒆𝒙𝒕 𝑳𝒆𝒗𝒆𝒍 𝑪𝒐𝒔𝒕**: <:coin:1304675604171460728>${(activeShip.level + 1) * shipDetails.levelUpCost}\n**𝑹𝒆𝒑𝒂𝒊𝒓 𝑪𝒐𝒔𝒕 (+25 Durability)**: <:coin:1304675604171460728>${shipDetails.repairCost}
    `;
    return message.channel.send(`**${message.author.username}**, your current active ship is <:${shipDetails.id}:${shipDetails.emoji}> **${activeShip.name}**\n⭑𓂃𓂃⭑\n${shipCard}\n\`kas active repair\` for repair \`kas active up\` for level up˙✧˖° 🌊⋆｡˚꩜`);

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while fetching user's active ship.");
  }
}

async function setActiveShip(shipId, userId, message) {
  try {
    let userShips = getUserShipsData(userId);

    if (!userShips.some(ship => ship.id === shipId.toLowerCase())) return message.channel.send("⚠️ No ship found with this id.");

    let activeShip = userShips.findIndex(ship => ship.active);

    if (activeShip && userShips[activeShip] && userShips[activeShip].id === shipId) return message.channel.send("⚠️ Your ship is already active for battle & defence.");

    let toActiveShip = userShips.findIndex(ship => ship.id === shipId.toLowerCase());

    if (userShips[activeShip] && userShips[activeShip].active === true) {
      userShips[activeShip].active = false;
    }
    userShips[toActiveShip].active = true;

    modifyUserShips(userId, userShips);

    return message.channel.send(`**${message.author.username}**, your current active ship is set to **${userShips[toActiveShip].name}**\n⭑𓂃\n\`Kas ship active\` for more details, \`kas active repair\` for repair & \`kas active up\` for level up. ˙✧˖° 🌊⋆｡˚꩜`);

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while setting ship active.");
  }
}

async function levelUp(userId, message) {
  try {
    let userData = getUserData(userId);
    let userShips = getUserShipsData(userId);

    let activeShip = userShips.findIndex(ship => ship.active);

    if (!userShips[activeShip]) return message.channel.send("⚠️ No active ship found.");
    let shipDetails = shipsData.find(ship => ship.id === userShips[activeShip].id);

    let cost = userShips[activeShip].level * shipDetails.levelUpCost;

    if (userData.cash < cost) {
      return message.channel.send(`⚠️ You don't have enough cash to level up the ship. Required cash: <:coin:1304675604171460728>${cost}`);
    }

    userData.cash -= cost;
    userShips[activeShip].level += 1;

    updateUser(userId, userData);
    modifyUserShips(userId, userShips);

    return message.channel.send(`🎉 𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧𝐬 ! You've successfully leveled up your ship, <:${shipDetails.id}:${shipDetails.emoji}> **${shipDetails.name}**, to Level **${userShips[activeShip].level}** costing <:coin:1304675604171460728>${cost}. Keep going, captain!🏴‍☠️⚓`);

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while leveling up the ship.");
  }
}

async function repair(times = 1, userId, message) {
  try {
    let userData = getUserData(userId);
    let userShips = getUserShipsData(userId);

    let activeShip = userShips.findIndex(ship => ship.active);

    if (!userShips[activeShip]) return message.channel.send("⚠️ No active ship found.");
    let shipDetails = shipsData.find(ship => ship.id === userShips[activeShip].id);

    let cost = shipDetails.repairCost * times;

    if (userData.cash < cost) {
      return message.channel.send(`⚠️ You don't have enough cash to repair the ship. Required cash: <:coin:1304675604171460728>${cost}`);
    }

    userData.cash -= cost;
    userShips[activeShip].durability += 25 * times;

    updateUser(userId, userData);
    modifyUserShips(userId, userShips);

    return message.channel.send(`🎉 𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧𝐬 ! You've successfully repaired your ship, <:${shipDetails.id}:${shipDetails.emoji}> **${shipDetails.name}**, to durability **${userShips[activeShip].durability}** (+${25 * times}) costing <:coin:1304675604171460728>${cost}.⚓🏴‍☠️`);

  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while repairing ship.");
  }
}

export const Ship = {
  allShips,
  getUserShipsData,
  getUsersShips,
  saveUsersShips,
  doesUserShipExist,
  initializeUserShips,
  modifyUserShips,
  showUserShips,
  shipsData,
  activeShip,
  setActiveShip,
  levelUp,
  repair
};