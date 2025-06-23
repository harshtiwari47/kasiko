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
  getUserFishData,
  updateFishUser
} from './data.js';

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import {
  Ship
} from '../pirates/shipsHandler.js';

import UserPet from "../../../models/Pet.js";

// Load aquarium data once
const aquaData = readAquaticData();

/**
* Check if user gets a bonus reward (ship or pet food).
* Return an Embed describing the reward, or null if no reward.
*
* @param {string} userId
* @param {object} message
* @returns {Promise<EmbedBuilder|null>}
*/
async function checkExtraReward(userId, message) {
  try {
    // For debugging: let's see the random # in your console
    const randomProb = Math.floor(Math.random() * 100);

    // ~30% chance (0-29): attempt to steal a ship
    if (randomProb < 30) {
      let randomChance = Math.floor(Math.random() * 100);

      let ships = await Ship.shipsData.sort((a, b) => a.probability - b.probability);
      let userShips = await Ship.getUserShipsData(userId);

      for (let i = 0; i < ships.length; i++) {
        // If our random chance is within the ship's probability
        if (randomChance < ships[i].probability) {
          // Already has this ship?
          const alreadyOwned = userShips.ships &&
          userShips.ships.some(shipDetails => shipDetails.id === ships[i].id);

          if (alreadyOwned) {
            return null; // user already has it, so no new reward
          }

          // Add the stolen ship to the user's data
          userShips.ships.push({
            level: 1,
            id: ships[i].id,
            name: ships[i].name,
            durability: ships[i].durability,
            active: false,
          });

          await Ship.modifyUserShips(userId, userShips);

          // Return an embed about the stolen ship
          const shipEmbed = new EmbedBuilder()
          .setTitle("🚢 𝗔 𝗣𝗶𝗿𝗮𝘁𝗶𝗰𝗮𝗹 𝗣𝗹𝘂𝗻𝗱𝗲𝗿!")
          .setDescription(
            `**${message.author.username}**, you’ve *stolen* a <:${ships[i].id}:${ships[i].emoji}> **${ships[i].name}** with no master!\nIt's ${
            ['a', 'e', 'i', 'o', 'u'].includes(ships[i].rarity[0].toLowerCase()) ? 'an': 'a'
            } **${ships[i].rarity}** ship! ⚓\n\nYou’re the captain now! 🏴‍☠️`
          )

          return shipEmbed;
        }
      }
      // If we didn't find any ship that matched the randomChance
      return null;
    }

    // ~20% chance (81-99) => find 2 pet foods
    if (randomProb > 80) {
      let userPetData = await UserPet.findOne({
        id: userId
      });
      if (!userPetData) {
        userPetData = new UserPet( {
          id: userId
        });
      }
      userPetData.food += 2;
      await userPetData.save();

      // Return an embed about the pet food
      const foodEmbed = new EmbedBuilder()
      .setTitle("<:pet_food:1385884583077351464> 𝗙𝗼𝘂𝗻𝗱 𝗣𝗲𝘁 𝗙𝗼𝗼𝗱!")
      .setDescription(`**${message.author.username}** found **2 sea food** for their pets in the ocean! 🐱`)

      return foodEmbed;
    }

    // If randomProb is between 30 and 80 => no reward
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
* This function handles the entire "fishing" process and updates the provided message.
* Potentially yields up to 3 embeds in one edit:
*    1) The initial fishing embed
*    2) The success/failure fishing result
*    3) (Optional) a reward embed if user gets a ship or pet food
*
* @param {object} message - The original Discord message object.
* @param {string|null} fishName - The fish to catch (optional).
* @param {string|null} zone - The zone name (optional).
* @param {object} fishingMsg - The message object we are editing to show the fishing progress/result.
* @param {boolean} collectorEnded - Whether the collector is already ended (so we can disable the button if so).
*/
async function doFishing(message, fishName, zone = null, fishingMsg, collectorEnded) {
  try {
    const userData = await getUserData(message.author.id);
    const userFishData = await getUserFishData(message.author.id);

    // Check user has enough cash
    if (userData.cash < 1500) {
      const noCashEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Insufficient Cash')
      .setDescription(`<:warning:1366050875243757699> **${message.author.username}**, you don't have enough cash for fishing.\nMinimum Required: <:kasiko_coin:1300141236841086977> **1500** 𝑪𝒂𝒔𝒉.`);

      return fishingMsg.edit({
        embeds: [noCashEmbed],
        components: [] // remove buttons if not enough cash
      });
    }

    // 1) Figure out which fish data we’re using
    let fish;
    if (!fishName) {
      fish = aquaData[Math.floor(Math.random() * aquaData.length)];
    } else {
      const filtered = aquaData.filter((f) => f.name.toLowerCase() === fishName.toLowerCase());
      if (!filtered.length) {
        const notFound = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`<:warning:1366050875243757699> No fish data found for **${fishName}**.`);
        return fishingMsg.edit({
          embeds: [notFound],
          components: []
        });
      }
      fish = filtered[0];
    }

    // 2) Probability setup
    const randomChance = Math.floor(Math.random() * 100);
    let probability = 0;
    let cost = 800;
    let zonecost = 0;

    // If zone is provided, adjust costs
    if (zone) {
      if (zone === "openocean") {
        zonecost = 500;
      } else if (zone === "deepsea") {
        zonecost = 300;
      }
    }

    // Adjust cost/probability based on rarity
    if (fish.rarity === "legendary") {
      probability = 6;
      cost = 1500;
    } else if (fish.rarity === "rare") {
      probability = 16;
      cost = 1000;
    } else {
      probability = 50; // common or normal fish
    }

    // 3) The initial embed: "suspense"
    const initialEmbed = new EmbedBuilder()
    .setTitle("🎣 𝑭𝒊𝒔𝒉𝒊𝒏𝒈 𝒊𝒏 𝑷𝒓𝒐𝒄𝒆𝒔𝒔!")
    .setDescription(`-# 𓂁﹏𓊝 **${message.author.username}** 𝘤𝘢𝘴𝘵 𝘵𝘩𝘦𝘪𝘳 𝘭𝘪𝘯𝘦...\n𝘛𝘩𝘦𝘺'𝘳𝘦 𝘵𝘳𝘺𝘪𝘯𝘨 𝘵𝘰 𝘤𝘢𝘵𝘤𝘩 𝘢 **${fish.rarity}** fish! <:sand_timer:1386589414846631947>`)
    .setColor('#0e2c42')
    .setImage(`https://harshtiwari47.github.io/kasiko-public/images/fishing${1 + Math.floor(Math.random() * 4)}.jpg`)
    .setFooter({
      text: "𝐻𝑜𝑙𝑑 𝑜𝑛, 𝑡ℎ𝑒 𝑓𝑖𝑠ℎ 𝑖𝑠 𝑜𝑛 𝑡ℎ𝑒 𝑙𝑖𝑛𝑒..."
    });

    // Update the message with the suspense embed (clearing old components)
    await fishingMsg.edit({
      embeds: [initialEmbed],
      components: []
    });

    // 4) Show result after a short delay
    setTimeout(async () => {
      let resultEmbed;
      // Probability check => if randomChance > probability => fail to catch
      if (randomChance > probability) {
        cost = 800 + zonecost;
        userData.cash -= cost;
        await updateUser(message.author.id, userData);

        initialEmbed.setTitle("🎣 𝐍𝐨 𝐋𝐮𝐜𝐤 𝐢𝐧 𝐓𝐡𝐞 𝐏𝐨𝐧𝐝")
        initialEmbed.setDescription(`🌊 **${message.author.username}** cast their line...\nbut all they hooked was a soggy boot — <:kasiko_coin:1300141236841086977> **${cost}** 𝑪𝒂𝒔𝒉 wasted.\n-# *Better luck next time! 💦🥾*`)
      } else {
        // The fish is caught
        userData.cash -= cost;
        if (!userFishData.fishes) {
          userFishData.fishes = []
        }
        if (!userFishData.fishes.find(f => f.name.toLowerCase() === fish.name.toLowerCase())) {
          userFishData.fishes.push({
            level: 1,
            animals: 1,
            name: fish.name,
            food: 0,
          });
        } else {
          userFishData.fishes.find(f => f.name.toLowerCase() === fish.name.toLowerCase()).animals += 1;
        }

        await updateUser(message.author.id, userData);
        await updateFishUser(message.author.id, userFishData);
        
        initialEmbed.setTitle(`🎣 𝐘𝐨𝐮 𝐥𝐚𝐧𝐝𝐞𝐝 𝐚 𝐟𝐢𝐬𝐡**!**`)
        initialEmbed.setDescription(`-# 𓊝 **${message.author.username}** 𝘫𝘶𝘴𝘵 𝘯𝘢𝘣𝘣𝘦𝘥 𝘢 **${fish.rarity}** fish! 𝘙𝘦𝘦𝘭 𝘭𝘶𝘤𝘬𝘺!`)
        
        resultEmbed = new EmbedBuilder()
        .setTitle("🎣 𝐇𝐨𝐨𝐤𝐞𝐝 𝐚𝐧𝐝 𝐁𝐨𝐨𝐤𝐞𝐝")
        .setDescription(
          `**${message.author.username}** collected a **${fish.rarity}** <:${fish.name}_fish:${fish.emoji}> \`${fish.name}\`${
          zone ? ` in **${zone.toUpperCase()}**`: ''
          } for <:kasiko_coin:1300141236841086977> **${cost}** 𝑪𝒂𝒔𝒉.\n\n✦⋆ 𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`
        )
        .setColor('#58dbf7')
        .setThumbnail(`https://cdn.discordapp.com/emojis/${fish.emoji}.png`);
      }

      // 5) Check for extra reward
      const rewardEmbed = await checkExtraReward(message.author.id, message);

      // 6) Prepare the final row of components
      let row;
      if (!collectorEnded) {
        // If the collector is still active, show an enabled button
        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('re_fish')
          .setLabel('Re-fish?')
          .setEmoji('1359384731329888368')
          .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
          .setCustomId('ocean_collection')
          .setLabel(`📒`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(false)
        );
      } else {
        // If the collector ended, show the button disabled
        const disabledBtn = new ButtonBuilder()
        .setCustomId('re_fish')
        .setLabel('Re-fish?')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);

        row = new ActionRowBuilder().addComponents(disabledBtn);
      }

      // Final array of embeds
      const finalEmbeds = [initialEmbed.setImage(`https://harshtiwari47.github.io/kasiko-public/images/fishing${1 + Math.floor(Math.random() * 4)}.jpg`)];
      if (rewardEmbed) finalEmbeds.push(rewardEmbed);
      if (resultEmbed) finalEmbeds.push(resultEmbed);

      await fishingMsg.edit({
        embeds: finalEmbeds,
        components: [row]
      });
    },
      4000);
  } catch (err) {
    console.error(err);
    const errorEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setDescription(`<:warning:1366050875243757699> Something went wrong. The 🐟 fish escaped.`);
    return message.channel.send({
      embeds: [errorEmbed]
    });
  }
}

/**
* Initiates the fishing process (including sending the initial "Preparing" message).
* Sets up a single button collector to allow repeated fishing attempts for 1 minute.
*
* @param {string} userId
* @param {object} message
* @param {string|null} zone - If "general", means no zone. Otherwise the zone name.
* @param {string|null} forcedAnimal - If you specifically want to attempt a certain fish
*/
async function addToCollection(userId, message, zone = null, forcedAnimal = null) {
  // A single message that we keep editing
  const initialMessage = await message.channel.send({
    content: 'Preparing your fishing rod...'
  });

  // We'll keep track if the collector has ended
  let collectorEnded = false;

  // Start the fishing process once
  await doFishing(message,
    forcedAnimal,
    zone,
    initialMessage,
    collectorEnded);

  // Create a component collector on that same message
  const collector = initialMessage.createMessageComponentCollector({
    time: 120 * 1000 // 2 minute
  });

  collector.on('collect',
    async (interaction) => {
      // Make sure it's the same user
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: 'This button is not for you!',
          ephemeral: true
        });
      }

      if (interaction.customId === 'ocean_collection') {
        await interaction.deferReply();
        return await viewCollection(interaction.user.id, interaction, interaction.user);
      }

      // Acknowledge
      await interaction.deferUpdate();

      // Re-run fishing with the same message,
      // but only if the collector not ended
      if (!collectorEnded) {
        await doFishing(message, forcedAnimal, zone, initialMessage, collectorEnded);
      }
    });

  collector.on('end',
    async () => {
      // Mark that the collector is ended
      collectorEnded = true;

      // We attempt to fetch the current message, then disable the button
      try {
        const editedMsg = await initialMessage.fetch();
        if (!editedMsg) return;

        // If there's no row or no components, do nothing
        if (!editedMsg.components.length) return;

        // Disable the button
        const row = ActionRowBuilder.from(editedMsg.components[0]);
        row.components.forEach((btn) => btn.setDisabled(true));

        await editedMsg.edit({
          components: [row]
        }).catch(() => {});
      } catch (err) {
        console.error("Error disabling button after collector end:", err);
      }
    });
}

//------------------------------------ Other Functions -------------------------------------//

export async function listZones(message) {
  const zones = ["CoralReef", "KelpForest", "DeepSea", "OpenOcean"];
  return message.channel.send(
    `🌊 **𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐙𝐨𝐧𝐞𝐬**: ${zones.join(", ")}\nOr use \`general\` if you don't want to pick a zone.`
  );
}

/**
* Explore a specific zone; picks a random fish from that zone's set
* or "general" to get from the entire aquaData
*/
export async function exploreZone(userId, zoneName, message) {
  try {
    const animalsByZone = {
      coralreef: ["Clownfish", "Turtle", "Octopus", "Lionfish"],
      kelpforest: ["Otter", "Garibaldifish", "Pufferfish"],
      deepsea: ["Anglerfish"],
      openocean: ["Dolphin", "Shark", "Whale", "Swordfish"],
    };

    if (zoneName === "general") {
      // If "general", fish from entire aquaData
      return addToCollection(userId, message, null, null);
    }

    const zoneAnimals = animalsByZone[zoneName.toLowerCase()];
    if (zoneAnimals) {
      const randomAnimal = zoneAnimals[Math.floor(Math.random() * zoneAnimals.length)];
      return addToCollection(userId, message, zoneName, randomAnimal);
    } else {
      message.channel.send(`<:warning:1366050875243757699> Zone "${zoneName.toUpperCase()}" not found.`);
    }
  } catch (e) {
    console.error(e);
    message.channel.send(`<:warning:1366050875243757699> Something went wrong while exploring **${zoneName.toUpperCase()}**.`);
  }
}

/**
* Basic "catch" command logic (when user simply types "catch").
*/
async function collect(userId, message) {
  const userData = await getUserData(userId);
  if (userData.cash < 1500) {
    return message.channel.send(
      `<:warning:1366050875243757699> **${message.author.username}**, you have insufficient cash for fishing.\nMinimum Cash: <:kasiko_coin:1300141236841086977> 1500 𝑪𝒂𝒔𝒉.`
    );
  }

  // Catch a random fish (no zone)
  await addToCollection(userId, message);
  return;
}

/**
* For direct usage if you want a random animal from the local array
*/
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
    const randomAnimal = foundAnimals[Math.floor(Math.random() * foundAnimals.length)];
    return addToCollection(userId, message, null, randomAnimal);
  } catch (e) {
    message.channel.send(`<:warning:1366050875243757699> Something went wrong while catching a fish.`);
  }
}

//------------------------------------ The Default Export (Command) -------------------------------------//

export default {
  name: "ocean",
  description: "Explore ocean zones, collect animals, and manage ocean-related activities.",
  aliases: ["oc",
    "o",
    "catch",
    "fishing",
    "fish",
    "fishes"],
  // Short alias for the ocean command
  args: "<action> [parameters]",
  example: [
    "ocean zone",
    // List available zones
    "ocean explore <zone|general>",
    // Explore a specific zone or general
    "catch",
    // Catch an animal in the ocean
    "ocean collection <@username optional>" // view an animal collection
  ],
  related: ["aquarium",
    "catch"],
  emoji: "<:fishing_rod_virtual:1359384731329888368>",
  cooldown: 10000,
  // Cooldown of 10 seconds
  category: "🌊 Ocean Life",

  async execute(args, message) {
    if (args[0] === "catch" || args[0] === "fishing") {
      // User just typed "catch"
      return collect(message.author.id, message);
    }

    if (args[0] === "fishes" || args[0] === "fish") {
      const mentionedUser = message.mentions.users.first();

      if (mentionedUser) {
        return viewCollection(message.author.id, message, mentionedUser);
      }
      return viewCollection(message.author.id, message, message.author);
    }

    const subcommand = args[1] ? args[1].toLowerCase(): null;
    const zone = args[2] ? args[2].toLowerCase(): null;

    switch (subcommand) {
    case "zone":
      return listZones(message);

    case "explore":
      if (!zone) {
        return message.channel.send("<:warning:1366050875243757699> Please specify a zone to explore. Example: `ocean explore <zone>` or `ocean explore general`");
      }
      return exploreZone(message.author.id, zone, message);

    case "cl":
    case "collection":
      const mentionedUser = message.mentions.users.first();

      if (mentionedUser) {
        return viewCollection(message.author.id, message, mentionedUser);
      }
      return viewCollection(message.author.id, message, message.author);
    case "fish":
      // "ocean fish <zone|general>"
      if (zone) {
        return exploreZone(message.author.id, zone, message);
      } else {
        // If no zone is given, treat as general
        return addToCollection(message.author.id, message, null, null);
      }

    case "catch":
    case "c":
      return collect(message.author.id, message);

    default:
      const oceanEmbed = new EmbedBuilder()
      .setColor('#1E90FF') // Ocean-like color
      .setTitle('🌊🐚 Ocean Command')
      .setDescription('Explore the vast ocean with these commands:')
      .addFields(
        {
          name: '`catch` or `ocean catch`', value: 'Start fishing 🎣 and catch random items!', inline: false
        },
        {
          name: '`ocean zone`', value: 'View available ocean zones.', inline: false
        },
        {
          name: '`ocean explore <zone|general>`', value: 'Explore a specific ocean zone or general.', inline: false
        },
        {
          name: '`ocean fish <zone|general>`', value: 'Fish in a specific zone or general.', inline: false
        },
        {
          name: '`fishes <@username (optional)>`', value: 'View your or someone else\'s ocean collection.', inline: false
        }
      )
      .setFooter({
        text: 'Happy fishing! 🎣'
      });

      return message.channel.send({
        embeds: [oceanEmbed]
      });
    }
  },
};