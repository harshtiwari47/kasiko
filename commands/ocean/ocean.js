import {
  getUserData,
  updateUser,
  readAquaticData,
} from '../../database.js';

const aquaData = readAquaticData();

async function addToCollection(animal, message, zone = null) {
  try {
    const userData = getUserData(message.author.id);

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
      updateUser(message.author.id, userData);

      return message.channel.send(`🎣 𝐍𝐨 𝐋𝐮𝐜𝐤 𝐢𝐧 𝐓𝐡𝐞 𝐏𝐨𝐧𝐝\n\n**@${message.author.username}** cast their line... but all they got was a soggy boot from <:kasiko_coin:1300141236841086977> ${cost} 𝑪𝒂𝒔𝒉. Better luck next time! 🥾💦`);
    }

    if (!userData.aquaCollection[animal]) {
      userData.aquaCollection[animal] = {
        level: 1,
        animals: 1,
        name: animal
      }
    } else {
      userData.aquaCollection[animal]["animals"] += 1;
    }

    userData.cash -= cost;

    updateUser(message.author.id, userData);

    return message.channel.send(`🎣 𝐇𝐨𝐨𝐤𝐞𝐝 𝐚𝐧𝐝 𝐁𝐨𝐨𝐤𝐞𝐝\n\n**@${message.author.username}** collected a _${fish[0].rarity}_ <:${fish[0].name}_fish:${fish[0].emoji}> **\`${animal}\`** ${zone? "in the **" + zone.toUpperCase() + "**": ""} from <:kasiko_coin:1300141236841086977> ${cost} 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`);
  } catch (e) {
    console.error(e);
    return message.channel.send(`⚠️ Something went wrong. The 🐟 fish escaped.`);
  }
}

export async function listZones(channel) {
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