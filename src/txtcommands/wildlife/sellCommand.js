import User from '../../../models/Hunt.js';
import fs from 'fs';
import path from 'path';

import {
  getUserData,
  updateUser
} from '../../../database.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname); // Get the directory of the current filter
const AnimalsDatabasePath = path.join(__dirname, './animals.json');
let animalsData = fs.readFileSync(AnimalsDatabasePath,
  'utf-8');

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    // For normal text-based usage
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function sellCommand(context, { animalName = "", sellAll = false, amount = 1, sellEvery = false }) {
  try {
    const animals = JSON.parse(animalsData).animals; // Load global animals data
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    // Find the user by their Discord ID
    let user = await User.findOne({ discordId: userId });
    if (!user) {
      return handleMessage(context, {
        content: `No profile found. Go hunt first!`
      });
    }

    const userData = await getUserData(userId);
    if (!userData) return;

    // Helper to compute single-animal price given the user's owned animal object
    function computeSinglePrice(userAnimal, globalDef) {
      const rarityMultiplier = (globalDef?.rarity || 1) * 1500;
      const levelBonus = (userAnimal.level || 1) * 250;
      const exclusiveAnimalsRewards = (globalDef?.rarity || 1) * 2000;
      return rarityMultiplier + levelBonus + (globalDef?.type === "exclusive" ? exclusiveAnimalsRewards : 0);
    }

    // sell all animals in the user's collection
    if (sellEvery) {
      const ownedAnimals = user.hunt.animals;
      if (!ownedAnimals || ownedAnimals.length === 0) {
        return handleMessage(context, {
          content: `ⓘ ${username}, you don't have any animals to sell!`
        });
      }
      let grandTotalPrice = 0;
      let totalCount = 0;
      // collect breakdown for message
      const breakdownLines = [];

      for (const userAnimal of ownedAnimals) {
        const count = userAnimal.totalAnimals || 0;
        if (count <= 0) continue;
        const globalDef = animals.find(a => a.name.toLowerCase() === userAnimal.name.toLowerCase());
        const singlePrice = computeSinglePrice(userAnimal, globalDef);
        const subtotal = singlePrice * count;
        grandTotalPrice += subtotal;
        totalCount += count;
        breakdownLines.push(`- ${userAnimal.emoji || ""} **${userAnimal.name}** x${count}: **${subtotal}** 𝒄𝒂𝒔𝒉`);
      }
      // Clear all animals
      user.hunt.animals = [];

      // Update currency and save
      userData.cash += grandTotalPrice;
      try {
        await user.save();
        await updateUser(userId, userData);
      } catch (err) {
        return handleMessage(context, {
          content: `**Error**: ${err.message}`
        });
      }

      // Construct a summary message. If many species.
      const header = `<:forest_tree:1354366758596776070> **${username.toUpperCase()}** sold **all your animals** (${totalCount} total) and earned <:kasiko_coin:1300141236841086977> **${grandTotalPrice}** 𝒄𝒂𝒔𝒉! <a:pink_butterfly:1354375085917601862>`;
      
      const breakdownText = breakdownLines.length <= 10
        ? "\n" + breakdownLines.join("\n")
        : "\n" + breakdownLines.slice(0, 10).join("\n") + `\n…and ${breakdownLines.length - 10} more species sold.`;
      const messageContent = header + breakdownText;

      return handleMessage(context, { content: messageContent });
    }

    // sell specific animalName

    if (!animalName || animalName.trim() === "") {
      return handleMessage(context, {
        content: `ⓘ ${username}, you need to specify an animal name to sell! 🐰\n\n**For viewing the animal list, use:** \`cage\`\n**Example for selling:** \`sellanimal monkey\``
      });
    }
    // Find the animal to sell in the user's collection
    const idx = user.hunt.animals.findIndex(a => a.name.toLowerCase() === animalName.toLowerCase());
    if (idx === -1) {
      return handleMessage(context, {
        content: `ⓘ | <:forest_tree:1354366758596776070> **${username}**, you don't have an animal named **${animalName}** to sell! 🐰\n**For viewing the animal list, use:** \`cage\`\n**Example for selling:** \`sellanimal monkey\``
      });
    }
    const animalToSell = user.hunt.animals[idx];
    const globalDef = animals.find(a => a.name.toLowerCase() === animalToSell.name.toLowerCase());
    const singlePrice = computeSinglePrice(animalToSell, globalDef);

    let totalPrice = 0;
    let soldCount = 0;

    // sellAll for this animal 
    if (sellAll) {
      soldCount = animalToSell.totalAnimals;
      totalPrice = singlePrice * soldCount;
      // Remove from collection
      user.hunt.animals.splice(idx, 1);

    } else if (amount !== undefined && amount !== null && amount !== "" && amount !== 0) {
      // Parse and validate amount
      const parsed = parseInt(amount, 10);
      if (isNaN(parsed) || parsed < 1) {
        return handleMessage(context, {
          content: `ⓘ ${username}, invalid amount **${amount}** to sell. Please provide a positive integer greater than 0.`
        });
      }
      if (parsed > animalToSell.totalAnimals) {
        return handleMessage(context, {
          content: `ⓘ ${username}, you only have **${animalToSell.totalAnimals}** ${animalToSell.name}(s), cannot sell ${parsed}.`
        });
      }
      soldCount = parsed;
      totalPrice = singlePrice * soldCount;
      if (animalToSell.totalAnimals > parsed) {
        animalToSell.totalAnimals -= parsed;
      } else {
        // totalAnimals
        user.hunt.animals.splice(idx, 1);
      }

    } else {
      // Default: sell one
      soldCount = 1;
      totalPrice = singlePrice;
      if (animalToSell.totalAnimals > 1) {
        animalToSell.totalAnimals -= 1;
      } else {
        user.hunt.animals.splice(idx, 1);
      }
    }

    // Update currency and save
    userData.cash += totalPrice;
    try {
      await user.save();
      await updateUser(userId, userData);
    } catch (err) {
      return handleMessage(context, {
        content: `**Error**: ${err.message}`
      });
    }

    // Construct success message
    let messageContent;
    if (soldCount > 1) {
      // plural
      // Use the emoji from the globalDef if desired. But after removal, animalToSell may be removed; use the name directly.
      messageContent = `<:forest_tree:1354366758596776070> **${username.toUpperCase()}** sold **${soldCount} ${animalToSell.name}${soldCount > 1 ? "s" : ""}** and earned <:kasiko_coin:1300141236841086977> **${totalPrice}** 𝒄𝒂𝒔𝒉! <a:pink_butterfly:1354375085917601862>`;
    } else {
      // exactly one
      messageContent = `<:forest_tree:1354366758596776070> **${username.toUpperCase()}** sold a **${animalToSell.emoji} ${animalToSell.name}** (1x) from their 𝙘𝙖𝙜𝙚 and earned <:kasiko_coin:1300141236841086977> **${totalPrice}** 𝒄𝒂𝒔𝒉! <a:pink_butterfly:1354375085917601862>`;
    }

    return handleMessage(context, { content: messageContent });

  } catch (error) {
    console.error(error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`
    });
  }
}

export default {
  name: "sellanimal",
  description: "Sell an animal from your collection for cash.",
  aliases: ["sa",
    "as"],
  args: "[animalName]",
  example: [
    "sellanimal wolf",
    "sa tiger all"
  ],
  emoji: "🦊",
  related: ["hunt",
    "cage"],
  cooldown: 10000,
  category: "🦌 Wildlife",

  execute: async (args, context) => {
    try {
      let animalName = args[1] ? args[1].toLowerCase() : null;
      // Check if a third argument "all" is present
      let sellAll = args[2] && String(args[2]).toLowerCase() === 'all';
      await sellCommand(context, { animalName, sellAll });
    } catch (e) {
      console.error(e);
    }
  }
};