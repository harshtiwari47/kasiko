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

export async function sellCommand(context, { animalName = "", sellAll = false }) {
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

    if (!animalName || animalName === "") {
      return handleMessage(context, {
        content: `ⓘ ${username} need to specify an animal name to sell! 🐰\n\n**For viewing the animal list, use:** \`cage\`\n**Example for selling:** \`sellanimal monkey\``
      });
    }

    // Find the animal to sell in the user's collection
    const animalToSellIndex = user.hunt.animals.findIndex(a => a.name.toLowerCase() === animalName.toLowerCase());
    if (animalToSellIndex === -1) {
      return handleMessage(context, {
        content: `ⓘ | <:forest_tree:1354366758596776070> **${username}**, you don't have an animal named **${animalName}** to sell! 🐰\n**For viewing the animal list, use:** \`cage\`\n**Example for selling:** \`sellanimal monkey\``
      });
    }

    const animalToSell = user.hunt.animals[animalToSellIndex];
    const globalDef = animals.find(a => a.name.toLowerCase() === animalToSell.name.toLowerCase());

    // Calculate the price for one animal
    const rarityMultiplier = (globalDef?.rarity || 1) * 1500;
    const levelBonus = (animalToSell.level || 1) * 250;
    const exclusiveAnimalsRewards = (globalDef?.rarity || 1) * 2000;
    const singlePrice = rarityMultiplier + levelBonus + (globalDef.type === "exclusive" ? exclusiveAnimalsRewards : 0);

    let totalPrice;
    if (sellAll) {
      // Multiply by the total number of animals available
      totalPrice = singlePrice * animalToSell.totalAnimals;
      // Remove the animal completely from the user's collection
      user.hunt.animals.splice(animalToSellIndex, 1);
    } else {
      totalPrice = singlePrice;
      // Decrease count or remove one instance
      if (animalToSell.totalAnimals > 1) {
        animalToSell.totalAnimals -= 1;
      } else {
        user.hunt.animals.splice(animalToSellIndex, 1);
      }
    }

    // Add the earned currency to the user's balance
    userData.cash += totalPrice;
    try {
      await user.save();
      await updateUser(userId, userData);
    } catch (err) {
      return handleMessage(context, {
        content: `**Error**: ${err.message}`
      });
    }

    // Send a success message
    const messageContent = sellAll
      ? `<:forest_tree:1354366758596776070> **${username.toUpperCase()}** sold **all ${animalToSell.name}** and earned <:kasiko_coin:1300141236841086977> **${totalPrice}** 𝒄𝒂𝒔𝒉! <a:pink_butterfly:1354375085917601862>`
      : `<:forest_tree:1354366758596776070> **${username.toUpperCase()}** sold a **${animalToSell.emoji} ${animalToSell.name}** (1x) from their 𝙘𝙖𝙜𝙚 and earned <:kasiko_coin:1300141236841086977> **${totalPrice}** 𝒄𝒂𝒔𝒉! <a:pink_butterfly:1354375085917601862>`;

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
  cooldown: 5000,
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