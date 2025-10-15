import User from '../../../models/Hunt.js';
import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
* Show general cage info: display only the emojis of the user's animals,
* plus an embed field for exclusive species.
*/
async function showCageOverview(context, user) {
  const username = context.user?.username || context.author?.username;

  if (!user.hunt.animals || (user.hunt.animals && user.hunt.animals.length === 0)) {
    return handleMessage(context, {
      embeds: [
        new EmbedBuilder()
        .setDescription(`<:forest_tree:1354366758596776070> **${username}**, your cage is currently empty! Try using the **hunt** command first.`)
      ]
    });
  }

  // Helper to convert a number to subscript digits
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
  const toSubscript = (num) =>
  num.toString().split('').map(digit => subscriptNumbers[digit] || digit).join('');

  // All animal emojis with counts
  const animalEmojis = user.hunt.animals
  .map(animal => animal.type === 'exclusive' ? '' : `${animal.emoji} ${toSubscript(animal.totalAnimals)}`)
  .join(' ');

  // Filter for exclusive species
  const exclusiveAnimals = user.hunt.animals.filter(animal => animal.type === 'exclusive');
  let exclusiveEmojis = '';
  if (exclusiveAnimals.length > 0) {
    exclusiveEmojis = exclusiveAnimals
    .map(animal => `${animal.emoji} ${toSubscript(animal.totalAnimals)}`)
    .join(' ');
  }

  const Container = new ContainerBuilder()
  .addTextDisplayComponents(
    textDisplay => textDisplay.setContent(`### **${username.toUpperCase()}**'𝕤 𝔸𝕟𝕚𝕞𝕒𝕝 ℂ𝕒𝕘𝕖 <:forest_tree:1354366758596776070>`)
  )
  .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`<:hunting_exp:1354384431091290162> 𝘏𝘜𝘕𝘛𝘐𝘕𝘎 𝘌𝘟𝘗: ${user.globalExp} <:rifle1:1352119137421234187><:rifle2:1352119217687625799> 𝘓𝘝𝘓: ${user.globalLevel}`)
  )
  .addSeparatorComponents(separate => separate)
  .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`## ${animalEmojis}`)
  )
  .addTextDisplayComponents(
    textDisplay => textDisplay.setContent(`<:exclusive:1347533975840882708> EXCLUSIVE SPECIES`)
  )
  .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`${exclusiveAnimals.length > 0 ? "## " + exclusiveEmojis : 'ᴜɴʟᴏᴄᴋ ᴛʜᴇᴍ ᴛʜʀᴏᴜɢʜ ᴛʜᴇ ᴋᴀꜱɪᴋᴏ ᴘᴀꜱꜱ.'}`)
  )
  .addTextDisplayComponents(
    textDisplay => textDisplay.setContent(`-# Tip: use \` cage \`**\`<name> \`** for details, \` sell \`**\`<name> <amount> \`** to sell.`)
  )

  return handleMessage(context, {
    components: [Container],
    flags: MessageFlags.IsComponentsV2
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
      `-# *\`\`\`${chosenAnimalData?.description}\`\`\`*`,
     // `\n<:follow_reply:1368224897003946004> **𝗟𝗘𝗩𝗘𝗟**: **${foundAnimal.level}**`,
     // `<:follow_reply:1368224897003946004> **𝗘𝗫𝗣**: **${foundAnimal.exp}**`,
      `<:follow_reply:1368224897003946004> **𝗧𝗢𝗧𝗔𝗟**: **${foundAnimal.totalAnimals}**`,
      `<:reply:1368224908307468408> **𝗧𝗬𝗣𝗘**: *${chosenAnimalData.type === "exclusive" ? "<:exclusive:1347533975840882708> EX": "GEN"}*`,
      `-# Use \`sell ${foundAnimal.name} all\`  to sell!`
    ].join('\n')
  )
  .setThumbnail(`https://cdn.discordapp.com/emojis/${chosenAnimalData?.emojiId}.png`)
  .setFooter({
    text: `ᴜꜱᴇ "ᴄᴀɢᴇ" ᴡɪᴛʜ ɴᴏ ᴀʀɢᴜᴍᴇɴᴛꜱ ᴛᴏ ꜱᴇᴇ ᴀʟʟ ʏᴏᴜʀ ᴀɴɪᴍᴀʟꜱ.`
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
  emoji: "<:Lion:1330380232095432835>",
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