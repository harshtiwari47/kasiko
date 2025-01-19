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
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    // For normal text-based usage
    return context.channel.send(data);
  }
}

export async function sellCommand(context, {
  animalName = ""
}) {
  try {
    const animals = JSON.parse(animalsData).animals; // Load global animals data
    const userId = context.user?.id || context.author?.id;

    // Find the user by their Discord ID
    let user = await User.findOne({
      discordId: userId
    });
    if (!user) {
      return handleMessage(context, {
        content: `No profile found. Go hunt first!`
      });
    }

    const userData = await getUserData(userId);

    // Find the animal to sell in the user's collection
    const animalToSellIndex = user.hunt.animals.findIndex(a => a.name.toLowerCase() === animalName.toLowerCase());
    if (animalToSellIndex === -1) {
      return handleMessage(context, {
        content: `You don't have an animal named **${animalName}** to sell!`
      });
    }

    const animalToSell = user.hunt.animals[animalToSellIndex];

    // Find the global definition of the animal
    const globalDef = animals.find(a => a.name.toLowerCase() === animalToSell.name.toLowerCase());

    // Calculate the price based on rarity and level
    const rarityMultiplier = (globalDef?.rarity || 1) * 1500;
    const levelBonus = (animalToSell.level || 1) * 250;
    const totalPrice = rarityMultiplier + levelBonus;

    // Remove the animal from the user's collection
    if (animalToSell.totalAnimals > 1) {
      animalToSell.totalAnimals -= 1;
    } else {
      user.hunt.animals.splice(animalToSellIndex, 1);
    }

    // Add the earned currency to the user's balance
    userData.cash += totalPrice;
    await user.save();
    await updateUser(userId, userData)

    // Send a success message
    return handleMessage(context, {
      content: [
        `You sold a **${animalToSell.emoji} ${animalToSell.name}** (Lvl.${animalToSell.level})`,
        `and earned <:kasiko_coin:1300141236841086977> **${totalPrice}** cash!`
      ].join('\n')
    });
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
    "sell wolf",
    "sell tiger"
  ],
  related: ["hunt",
    "cage"],
  cooldown: 5000,
  category: "🦌 Hunt",

  execute: async (args, context) => {
    try {
      let animalName = args[1] ? args[1].toLowerCase(): null;
      await sellCommand(context, {
        animalName
      });
    } catch (e) {
      console.error(e);
    }
  }
};