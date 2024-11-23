import {
  getUserData,
  updateUser,
  readAquaticData,
} from '../../../database.js';
import {
  viewCollection
} from './aquarium.js';
import {
  Helper
} from '../../../helper.js';

import {
  Ship
} from '../battle/shipsHandler.js';

import UserPet from "../../../models/Pet.js";

const aquaData = readAquaticData();

async function addToCollection(animal, message, zone = null) {
  try {
    const userData = await getUserData(message.author.id);

    if (userData.cash < 1500) {
      return message.channel.send(`⚠️ **${message.author.username}**, you have insufficient cash for fishing.\nMinimum Cash: <:kasiko_coin:1300141236841086977> 1500 𝑪𝒂𝒔𝒉.`);
    }

    let fish = aquaData.filter(fish => fish.name === animal);
    let randomChance = Math.floor(Math.random() * 100);
    let probability = 0;
    let cost = 800;
    let zonecost = 0;

    if (zone && zone === "openocean") {
      zonecost = 500;
    } else if (zone && zone === "deepsea") {
      zonecost = 300;
    }

    if (fish[0].rarity === "legendary") {
      probability = 6;
      cost = 1500;
    } else if (fish[0].rarity === "rare") {
      probability = 12;
      cost = 1000;
    } else {
      probability = 40;
    }

    if (randomChance > probability) {
      cost = 800 + zonecost;
      userData.cash -= cost;
      await updateUser(message.author.id, userData);

      return message.channel.send(`🎣 𝐍𝐨 𝐋𝐮𝐜𝐤 𝐢𝐧 𝐓𝐡𝐞 𝐏𝐨𝐧𝐝\n\n**@${message.author.username}** cast their line... but all they got was a soggy boot from <:kasiko_coin:1300141236841086977> ${cost} 𝑪𝒂𝒔𝒉. Better luck next time! 🥾💦`);
    }

    if (!userData.aquaCollection || !userData.aquaCollection[animal]) {
      if (!userData.aquaCollection) userData.aquaCollection = {};
      userData.aquaCollection[animal] = {
        level: 1,
        animals: 1,
        name: animal,
        food: 0,
      }
    } else {
      userData.aquaCollection[animal]["animals"] += 1;
    }

    userData.cash -= cost;

    await updateUser(message.author.id, userData);

    return message.channel.send(`🎣 𝐇𝐨𝐨𝐤𝐞𝐝 𝐚𝐧𝐝 𝐁𝐨𝐨𝐤𝐞𝐝\n\n**@${message.author.username}** collected a _${fish[0].rarity}_ <:${fish[0].name}_fish:${fish[0].emoji}> **\`${animal}\`** ${zone? "in the **" + zone.toUpperCase() + "**": ""} from <:kasiko_coin:1300141236841086977> ${cost} 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`);
  } catch (e) {
    console.error(e);
    return message.channel.send(`⚠️ Something went wrong. The 🐟 fish escaped.`);
  }
}

export async function listZones(message) {
  const zones = ["CoralReef",
    "KelpForest",
    "DeepSea",
    "OpenOcean"];
  message.channel.send(`🌊 **𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐙𝐨𝐧𝐞**: ${zones.join(", ")}`);
}

export async function exploreZone(userId, zoneName, message) {
  try {
    const animals = {
      "coralreef": [
        "Clownfish",
        "Turtle",
        "Octopus",
        "Lionfish"
      ],
      "kelpforest": [
        "Otter",
        "Garibaldifish",
        "Pufferfish"
      ],
      "deepsea": [
        "Anglerfish"
      ],
      "openocean": [
        "Dolphin",
        "Shark",
        "Whale",
        "Swordfish"
      ]
    };

    const zoneAnimals = animals[zoneName];
    if (zoneAnimals) {
      const animalFound = zoneAnimals[Math.floor(Math.random() * zoneAnimals.length)];
      return addToCollection(animalFound, message, zoneName);
    } else {
      message.channel.send(`⚠️ Zone "${zoneName.toUpperCase()}" not found.`);
    }
  } catch (e) {
    console.error(e);
    message.channel.send(`⚠️ Something went wrong while exploring **${zoneName.toUpperCase()}**.`);
  }
}

async function collect(userId, message) {
  collectAnimal(userId, message);

  let randomProb = Math.floor(Math.random() * 100);
  if (randomProb < 30) {
    stealShip(userId, message);
  } else if (randomProb > 80 && randomProb < 100) {
    let userPetData = await UserPet.findOne({
      id: userId
    });

    if (!userPetData) {
      userPetData = await new UserPet( {
        id: userId,
      });
    }
    userPetData.food += 2;

    await userPetData.save();

    message.channel.send(`You found **2 sea food** for your pets in the ocean 🐱.`)
  }
  return;
}

export async function stealShip(userId, message) {
  try {
    let randomChance = Math.floor(Math.random() * 100);
    let ships = await Ship.shipsData.sort((a, b) => a.probability - b.probability);
    let shipDetail = {}
    let shipStolen = false;
    let userShips = await Ship.getUserShipsData(userId);
    for (let i = 0; i < ships.length; i++) {
      if (randomChance < ships[i].probability) {
        shipDetail = ships[i];

        if (userShips.ships && userShips.ships.some(shipDetails => shipDetails.id && shipDetails.id === ships[i].id)) return

        shipStolen = true;
        userShips.ships.push({
          level: 1,
          id: ships[i].id,
          name: ships[i].name,
          durability: ships[i].durability,
          active: false
        });

        await Ship.modifyUserShips(userId, userShips);
        break;
      }
    }
    if (!shipStolen) return
    return message.channel.send(`🚢 **ᗩᕼOY, @${message.author.username}!**\n\nYou’ve *stolen* a <:${shipDetail.id}:${shipDetail.emoji}> **${shipDetail.name}** with no master! It's  ${['a', 'e', 'i', 'o', 'u'].includes(shipDetail.rarity[0].toLowerCase()) ? 'an': 'a'} **${shipDetail.rarity}** ship 🔥! ⚓ You’re the captain now! 🏴‍☠️`);
  } catch (e) {
    console.error(e);
    return message.channel.send("⚠️ Something went wrong while stealing ship!");
  }
}

export async function collectAnimal(userId, message) {
  try {
    const foundAnimals = [
      "Clownfish",
      "Turtle",
      "Otter",
      "Garibaldifish",
      "Anglerfish",
      "Dolphin",
      "Shark",
      "Whale",
      "Octopus",
      "Pufferfish",
      "Lionfish",
      "Swordfish"
    ];
    const animal = foundAnimals[Math.floor(Math.random() * foundAnimals.length)];
    return addToCollection(animal, message);
  } catch (e) {
    message.channel.send(`⚠️ Something went wrong while catching a fish.`);
  }
}

export default {
  name: "ocean",
  description: "Explore ocean zones, collect animals, and manage ocean-related activities.",
  aliases: ["oc",
    "o",
    "catch"],
  // Short alias for the ocean command
  args: "<action> [parameters]",
  example: [
    "ocean zone",
    // List available zones
    "ocean explore <zone>",
    // Explore a specific zone
    "catch",
    // Catch an animal in the ocean
    "ocean collection <@username optional>" // view an animal collection
  ],
  related: ["aquarium",
    "collection",
    "explore"],
  cooldown: 5000,
  // Cooldown of 10 seconds
  category: "Ocean Life",

  execute: (args, message) => {
    // Extract the subcommand from the user's input
    if (args[0] === "catch") return collect(message.author.id, message);
    const subcommand = args[1] ? args[1].toLowerCase(): null;

    const zone = args[2] ? args[2].toLowerCase(): null;
    // Handle different subcommands for the "ocean" command
    switch (subcommand) {
    case "zone":
      return listZones(message); // List all available zones

    case "explore":
      if (zone) {
        return exploreZone(message.author.id, zone, message); // Explore the specified zone
      } else {
        return message.channel.send("⚠️ Please specify a zone to explore. Example: `.ocean explore <zone>`");
      }

    case "cl":
    case "collection":
      if (args[2] && Helper.isUserMention(args[2])) {
        return viewCollection(Helper.extractUserId(args[2]), message.channel);
      }

      return viewCollection(message.author.id, message.channel);


    case "catch":
    case "c":
      return collect(message.author.id, message); // Catch an animal in the Ocean

    default:
      return message.channel.send("⚠️ 🌊🐚 ocean subcommand.\nUse `ocean zone`, `ocean explore <zone>`, `ocean collection <@username (optional)>`, `catch` for fishing 🎣 or `ocean catch`.");
    }
  }
};