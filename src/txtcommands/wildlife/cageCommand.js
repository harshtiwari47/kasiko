import User from '../../../models/Hunt.js';
import {
  EmbedBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const AnimalsDatabasePath = path.join(__dirname, './animals.json');
const allAnimalsData = fs.readFileSync(AnimalsDatabasePath, 'utf-8');

// A helper function for sending or editing replies
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

/**
* Show general cage info: display only the emojis of the user's animals.
*/
async function showCageOverview(context, user) {
  const username = context.user?.username || context.author?.username;

  if (!user.hunt.animals || (user.hunt.animals && user.hunt.animals.length === 0)) {
    return handleMessage(context, {
      embeds: [new EmbedBuilder().setDescription(`🍃 **${username}**, your cage is currently empty! Try using the **hunt** command first.`)]
    });
  }

  // Just display the emojis of each animal
  const subscriptNumbers = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉'
  };

  const toSubscript = (num) => num.toString().split('').map(digit => subscriptNumbers[digit] || digit).join('');

  const animalEmojis = user.hunt.animals
  .map((animal) => `${animal.emoji} ${toSubscript(animal.totalAnimals)}`)
  .join(' ');

  const embed = new EmbedBuilder()
  .setTitle(`**${username.toUpperCase()}**'𝕤 𝔸𝕟𝕚𝕞𝕒𝕝 ℂ𝕒𝕘𝕖 <:forest_tree:1354366758596776070>`)
  .setDescription(`<:hunting_exp:1354384431091290162> 𝘏𝘜𝘕𝘛𝘐𝘕𝘎 𝘌𝘟𝘗: ${user.globalExp} <:rifle1:1352119137421234187><:rifle2:1352119217687625799>\n## ${animalEmojis}`)
  .setFooter({
    text: `Tip: use "cage <animalName>" to see more details about a specific animal.`
  });

  return handleMessage(context, {
    embeds: [embed]
  });
}

/**
* Show details for one specific animal (by name or partial name, if you want).
*/
async function showAnimalDetail(context, user, animalName) {
  const animalsData = JSON.parse(allAnimalsData).animals;

  if (!user.hunt.animals || (user.hunt.animals && user.hunt.animals.length === 0)) {
    return handleMessage(context, {
      content: `Your cage is empty. Nothing to show!`
    });
  }

  // Find the animal by name (case-insensitive).
  // If you store a unique 'id' for each animal, you could match that instead.
  const foundAnimal = user.hunt.animals.find((animal) =>
    animal.name.toLowerCase() === animalName.toLowerCase()
  );

  const indexOfAni = animalsData.findIndex((ani) => {
    return ani.name.toLowerCase() === animalName.toLowerCase()
  })

  let chosenAnimalData;

  if (indexOfAni !== -1) {
    chosenAnimalData = animalsData[indexOfAni];
  }

  if (!foundAnimal) {
    return handleMessage(context, {
      content: `Couldn't find an animal with the name: **${animalName}**.`
    });
  }

  // Build an embed for that specific animal
  // Include stats or additional fields for an enhanced experience
  const embed = new EmbedBuilder()
  .setTitle(`${foundAnimal.emoji} ${foundAnimal.name}`)
  .setDescription(
    [
      `**𝗟𝗘𝗩𝗘𝗟** : **${foundAnimal.level}**`,
      `**𝗘𝗫𝗣** : **${foundAnimal.exp}**`,
      `**𝗛𝗣** : **${foundAnimal.hp}**`,
      `**𝗔𝗧𝗧𝗔𝗖𝗞** : **${foundAnimal.attack}**`,
      `**𝗧𝗢𝗧𝗔𝗟** : **${foundAnimal.totalAnimals}**`,
      `-# ${chosenAnimalData?.description}`
    ].join('\n')
  )
  .setThumbnail(`https://cdn.discordapp.com/emojis/${chosenAnimalData?.emojiId}.png`)
  .setFooter({
    text: `Use "cage" with no arguments to see all your animals.`
  });

  return handleMessage(context, {
    embeds: [embed]
  });
}

/**
* Main command function:
*  - If no argument -> show cage overview (emojis only).
*  - If an argument (like 'deer') -> show that animal's details.
*/
export async function cageCommand(context) {
  try {
    // For slash commands, you might extract arguments differently.
    // For text commands, we can assume arguments are in context.args.
    const args = context.args || [];
    const userId = context.user?.id || context.author?.id;

    let user = await User.findOne({
      discordId: userId
    });
    if (!user) {
      return handleMessage(context, {
        content: `You have no hunting profile yet. Go hunt some animals first!`
      });
    }

    // Check if an argument is provided
    if (args && args.length > 0) {
      // Combine args if you allow multi-word names, or just take args[0] if single-word
      const animalName = args.join(' ');
      return showAnimalDetail(context, user, animalName);
    } else {
      // No argument: show the overview
      return showCageOverview(context, user);
    }
  } catch (error) {
    console.error(error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`
    });
  }
}

export default {
  name: "cage",
  description: "View your animal collection in the cage or details about one animal.",
  aliases: ["animals",
    "animalcage",
    "animal",
    "zoo"],
  args: "<animalName> (optional)",
  example: [
    "cage",
    "cage deer",
    "animals wolf"
  ],
  related: ["hunt",
    "profile"],
  emoji: "🪶",
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🦌 Wildlife",

  execute: async (args, context) => {
    args.shift()
    // We pass in 'args' so that the command can parse them
    context.args = args;
    try {
      await cageCommand(context);
    } catch (e) {
      console.error(e);
    }
  }
};