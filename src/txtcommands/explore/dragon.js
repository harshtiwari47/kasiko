import fs from 'fs';
import path from 'path';
import {
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

import {
  client
} from "../../../bot.js";

import Powers from "./dragon/powers.js"

import Dragon from '../../../models/Dragon.js';
import redisClient from '../../../redis.js';
import Helper from '../../../helper.js';

// Load all dragon types from JSON
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dragonTypesPath = path.join(__dirname, '../../../data/dragons.json');
const dragonTypes = JSON.parse(fs.readFileSync(dragonTypesPath, 'utf-8'));

let gemIcon = `<:gem2:1304673964588662826>`
let sigilsIcon = `<:mystic_sigils:1320636356069687347>`

export default {
  name: 'dragon',
  description: 'Manage all Dragon-based actions (summon, hatch, , train, battle, etc.)',
  aliases: ['drg',
    'd'],
  cooldown: 10000,
  category: "🍬 Explore",
  emoji: "🐉",
  example: [
    "dragon"
  ],
  async execute(args, message) {
    args.shift();
    const subCommand = args[0]?.toLowerCase();

    // Define commands as an array of objects
    const commands = [{
      command: "summon",
      description: "Summon a new random dragon egg. You can summon up to 4 times per day."
    },
      {
        command: "hatch <unhatched index?>",
        description: "Hatch one of your unhatched eggs (default first)"
      },
      {
        command: "feed <index?> <amt?>",
        description: "Feed a dragon with some gems (default dragon #1, 10 gems)"
      },
      {
        command: "adventure <index?>",
        description: "Send your dragon on an adventure and wait to see whether he succeeds or fails. You will gain +2 Sigils for each win and lose -1 for each loss"
      },
      {
        command: "train <index?>",
        description: "Train one of your dragons"
      },
      {
        command: "daily",
        description: "Claim daily gems"
      },
      {
        command: "list",
        description: "Show all your dragons"
      },
      {
        command: "leaderboard",
        description: "Show top players by total gems"
      },
      {
        command: "gems | sigils | metals",
        description: "Check your stats for Gems, Sigils, and Metals"
      },
      {
        command: "powers",
        description: "Check all your dragons' powers"
      },
      {
        command: "pat | walk | play <index?>",
        description: "Enjoy your time with dragon"
      },
      {
        command: "rename <index> <nickname>",
        description: "Give a nickname to your dragon (less than 20 characters & no space)"
      },
      {
        command: "active <index>",
        description: "Set your active dragon in battle to use its powers."
      },
    ];

    // Function to generate a page embed
    function getPageEmbed(page) {
      const itemsPerPage = 4;
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageCommands = commands.slice(start, end);

      const embed = new EmbedBuilder()
      .setTitle("Dragon Commands")
      .setDescription("## dragon <command>\n" +
        pageCommands.map((cmd) => `**${cmd.command}**\n-# ${cmd.description}`).join("\n\n")
      )
      .setFooter({
        text: `Page ${page + 1} of ${Math.ceil(commands.length / itemsPerPage)}`
      });

      return embed;
    }

    // Handle interaction
    async function handleCommandInteraction(message) {
      try {
        let currentPage = 0;
        const totalPages = Math.ceil(commands.length / 4);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(totalPages <= 1)
        );

        const embed = getPageEmbed(currentPage);
        const sentMessage = await message.channel.send({
          embeds: [embed], components: [row]
        });

        const collector = sentMessage.createMessageComponentCollector({
          filter: (interaction) => interaction.user.id === message.author.id,
          time: 90000, // 1.5-minute timeout
        });

        collector.on("collect", async (interaction) => {
          if (interaction.customId === "prev") {
            currentPage = Math.max(0, currentPage - 1);
          } else if (interaction.customId === "next") {
            currentPage = Math.min(totalPages - 1, currentPage + 1);
          }

          const newEmbed = getPageEmbed(currentPage);

          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
            new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
          );

          await interaction.update({
            embeds: [newEmbed], components: [newRow]
          });
        });

        collector.on("end",
          () => {
            const disabledRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
              .setCustomId("prev")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
              new ButtonBuilder()
              .setCustomId("next")
              .setLabel("Next")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
            );
            sentMessage.edit({
              components: [disabledRow]
            });
          });
      } catch (e) {}
    }

    // Use the function in your command handler
    if (!subCommand) {
      try {
        return handleCommandInteraction(message);
      } catch (e) {
        console.error(e);
      }
    }

    // Route subcommands
    switch (subCommand) {
    case 'summon':
    case 'sm':
      return summonDragon(message);
    case 'hatch':
    case 'h':
      return hatchDragon(args, message);
    case 'feed':
    case 'f':
      return feedDragon(args, message);
    case 'train':
    case 't':
      return trainDragon(args, message);
    case 'daily':
    case 'dr':
      return dailyReward(message);
    case 'list':
    case 'l':
      return listDragons(message);
    case 'adventure':
    case 'adv':
    case 'a':
      return adventure(args, message)
    case 'leaderboard':
    case 'lb':
      return showLeaderboard(message, client);
    case 'gem':
    case 'gems':
    case 'g':
      return checkGems(message);
    case 'metal':
    case 'metals':
    case 'm':
      return Powers.myMetals(message);
    case 'power':
    case 'powers':
    case 'strengths':
    case 'strength':
    case 'p':
      if (args[1] && (args[1] === "upgrade" || args[1] === "up")) {
        let pId = args[2];

        if (!pId) {
          return message.channel.send(`❗ Please mention the ID of the power you want to upgrade!\nUse \`dragon power upgrade <id>\``);
        }

        return Powers.upgradePower(pId, message);
      }
      return Powers.myPowers(message);
    case 's':
    case 'sigil':
    case 'sigils':
      return checkSigils(message);
    case 'pat':
    case 'walk':
    case 'play':
      return actions(args, message);
    case 'r':
    case 'rename':
    case 'nick':
    case 'n':
    case 'nickname':
      return changeNickname(args, message);
    case 'ac':
    case 'activate':
    case 'active':
      return changeActive(args, message);
    default:
      return message.channel.send('❓ Unknown subcommand. Use `dragon` to see available options.');
    }
  }
};

  /**
  * Retrieve user data from Redis or MongoDB
  */
  export async function getUserDataDragon(userId) {
    const cacheKey = `user:${userId}:dragons`;
    let userData = await redisClient.get(cacheKey);

    if (userData) {
      return JSON.parse(userData);
    } else {
      // Fetch from MongoDB
      const user = await Dragon.findOne({
        userId
      });
      if (user) {
        userData = user.toObject();
      } else {
        // Create new user if not exists
        userData = {
          userId: userId,
          gems: 120,
          dragons: [],
          lastDaily: null,
          createdAt: new Date(),
          sigils: 0,
          powers: [],
          metals: {
            gold: 0,
            silver: 0,
            bronze: 0
          }
        };
      }

      // Cache in Redis with an expiration (e.g., 1 hour)
      await redisClient.set(cacheKey, JSON.stringify(userData), {
        EX: 360
      });
      return userData;
    }
  }

  /**
  * Save user data to Redis
  */
  export async function saveUserData(userId, userData) {
    const cacheKey = `user:${userId}:dragons`;

    await Dragon.findOneAndUpdate(
      {
        userId
      },
      userData,
      {
        upsert: true, new: true, runValidators: true
      }
    );

    await redisClient.set(cacheKey, JSON.stringify(userData), {
      EX: 3600
    });
  }

  /**
  * Check if a user can attempt an action or is in cooldown.
  * @param {string} userId - The user ID.
  * @param {RedisClient} redisClient - The Redis client instance.
  * @returns {Promise<boolean>} - Returns true if the user can attempt, false if in cooldown.
  */
  async function canAttemptAction(userId, redisClient) {

    const maxAttempts = 4;
    const cooldownTime = 24 * 60 * 60; // 24 hours in secondsLeft

    const cacheKey = `user:${userId}:dragons:catch`;

    // Increment the attempt count
    const currentCount = await redisClient.incr(cacheKey);

    if (currentCount === 1) {
      // If this is the first attempt, set an expiration time for the key
      await redisClient.expire(cacheKey, cooldownTime);
    }

    // Check if the current attempts exceed the maximum allowed
    if (currentCount > maxAttempts) {
      const ttl = await redisClient.ttl(cacheKey);

      // Convert seconds to human-readable format
      const hours = Math.floor(ttl / 3600);
      const minutes = Math.floor((ttl % 3600) / 60);
      const seconds = ttl % 60;

      const readableTime = `${hours}h ${minutes}m ${seconds}s`;

      return {
        canAttempt: false,
        message: `<:warning:1366050875243757699> You are on _cooldown_. Please try summoning again after **${readableTime}**! <:dragon:1368113270443216926>`,
      };
    }

    return {
      canAttempt: true // User can attempt
    }
  }

  /**
  * Summon a new random dragon egg.
  * Probability determined by dragons.json
  */
  async function summonDragon(message) {
    const userId = message.author.id;
    let userData = await getUserDataDragon(userId);

    // Summon cost and gems deduction
    const summonCost = 10;
    if (userData.gems < summonCost) {
      return message.reply(`<:warning:1366050875243757699> You need at least **${summonCost}** gems to summon a dragon egg.`);
    }

    let atempt = await canAttemptAction(userId, redisClient);

    if (!atempt.canAttempt) {
      return message.reply(`<:warning:1366050875243757699> ${atempt.message}`);
    }

    if (userData.dragons.length === dragonTypes.length) {
      return message.channel.send(
        `☕ You have summoned the maximum number of dragons for now, but stay tuned for more in the future!`
      );
    }

    userData.gems -= summonCost;

    // Weighted random pick from dragonTypes
    const chosenType = Helper.pickDragonType(dragonTypes);

    // Check if the user already has this type of dragon
    const hasDragon = userData.dragons.some(dragon => dragon.typeId === chosenType.id);


    const attachment = new AttachmentBuilder('https://harshtiwari47.github.io/kasiko-public/images/dragons/dragon-hunt-failed.png');

    if (hasDragon) {
      return message.channel.send({
        content: `<:dragon:1368113270443216926> **${message.author.username}**, *you already have a* 🥚 **${chosenType.name}** *dragon egg.* ❌\n\n**COST** ~ ${gemIcon} ${summonCost} GEMS\n-# 𝘕𝘰 𝘯𝘦𝘸 𝘦𝘨𝘨 𝘵𝘩𝘪𝘴 𝘵𝘪𝘮𝘦 — 𝘣𝘦𝘵𝘵𝘦𝘳 𝘭𝘶𝘤𝘬 𝘯𝘦𝘹𝘵 𝘵𝘪𝘮𝘦!`,
        files: [attachment]
      });
    }

    // Add a 30% chance of successfully summoning a new dragon egg
    const successChance = Math.random();
    if (successChance < 0.8) {
      // If successful, add an unhatched egg
      userData.dragons.push({
        typeId: chosenType.id,
        stage: 1,
        experience: 0,
        health: 100,
        hunger: 100,
        isHatched: false,
        hatchedTime: null
      });

      await saveUserData(userId, userData);

      let rarity = "mythic";

      if (chosenType.rarity > 0.8) rarity = "common";
      if (chosenType.rarity > 0.6) rarity = "uncommon";
      if (chosenType.rarity > 0.4) rarity = "rare";
      if (chosenType.rarity > 0.2) rarity = "lengendary";

      const summonEmbed = new EmbedBuilder()
      .setColor(chosenType.color)
      .setDescription(`<:dragon:1368113270443216926> **${message.author.username}** successfully summoned a **${chosenType.name}** egg! (Unhatched)\n\n🥚 **EGG TYPE**: ${chosenType.name}\n🔮 **RARITY**: ${rarity}\n-# ${chosenType.description}`)
      .setImage(chosenType.images[0])
      .setThumbnail(chosenType.images[1])
      .setAuthor({
        name: message.author.username, iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })

      return message.channel.send({
        embeds: [summonEmbed]
      });
    } else {
      return message.channel.send({
        content: `<:dragon:1368113270443216926> *No luck this time*, **${message.author.username}**!\n*You couldn't summon a* 🥚 **${chosenType.name}** *egg*. ❌\n**COST** ~ ${gemIcon} ${summonCost} GEMS`,
        files: [attachment]
      });
    }
  }

  /**
  * Hatch one of your unhatched eggs.
  * @param args e.g. "dragon hatch 2" -> hatch the 2nd unhatched egg
  */
  async function hatchDragon(args, message) {
    const index = parseInt(args[1]) || 1; // default to the first egg
    const userId = message.author.id;
    let userData = await getUserDataDragon(userId);

    // Filter only unhatched
    const unhatched = userData.dragons.filter(d => !d.isHatched);
    if (unhatched.length === 0) {
      return message.channel.send(`❗ You have no unhatched eggs. Summon more with \`dragon summon\`.`);
    }

    // Adjust index to 0-based
    const eggIndex = index - 1;
    if (eggIndex < 0 || eggIndex >= unhatched.length) {
      return message.channel.send(`❗ Invalid egg index. You have ${unhatched.length} unhatched egg(s).`);
    }

    // The actual egg object in userData.dragons
    const egg = unhatched[eggIndex];
    const realIndex = userData.dragons.findIndex(d => d === egg);

    // Send the initial suspense message
    const suspenseMessage = await message.channel.send(`🌟 **${message.author.username}** is preparing to hatch the egg...`);

    // Simulate the suspense with updates every few seconds
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds pause
    await suspenseMessage.edit(`🔥 The egg is starting to crack...`);

    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds pause
    await suspenseMessage.edit(`💥 The egg is shaking... Something powerful is about to emerge!`);

    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds pause

    // Mark as hatched
    userData.dragons[realIndex].isHatched = true;
    // Optionally set stage to 1 or 2 (depending on your logic)
    userData.dragons[realIndex].stage += 1;
    userData.dragons[realIndex].experience = 0; // Reset experience
    userData.dragons[realIndex].health = 100;
    userData.dragons[realIndex].hunger = 100;

    await saveUserData(userId, userData);

    const typeId = userData.dragons[realIndex].typeId;
    const chosenType = dragonTypes.find(t => t.id === typeId);

    // Final message announcing the hatch
    const finalEmbed = new EmbedBuilder()
    .setDescription(`# Flames Awaken\n\n> 🎉 **${message.author.username}**'s **\`${chosenType?.name || typeId}\`** has hatched into a glorious surprise!\n\n-# **🐣✨ Say hello to <:${chosenType.id}2:${chosenType.emoji}>!**`)
    .setAuthor({
      name: message.author.username, iconURL: message.author.displayAvatarURL({
        dynamic: true
      })
    })
    .setThumbnail(`https://cdn.discordapp.com/emojis/${chosenType.emoji}.png>`)
    .setColor(chosenType.color)

    await suspenseMessage.edit({
      content: '',
      embeds: [finalEmbed]
    });
  }

  function randomHungerMessage() {
    const hungryMessages = [
      "I'm too hungry to move! 🥺 Feed me first, please? 🍗",
      "No energy... need yummy gems! 💎🐉",
      "My tummy is growling! Can you hear it? 🥴",
      "I can’t train on an empty stomach! Feed me, hooman! 😩",
      "Hungry dragon is a grumpy dragon! 🍖🐾",
      "Help! My belly is empty! 😢",
      "I promise to train after a snack! Pretty please? 🥺✨",
      "No gems, no training! That’s the rule! 😋",
      "I’ll train my hardest after some food, I promise! 💕",
      "Even mighty dragons need a meal break! 🐉💖",
      "Can’t fly on an empty stomach! Please, feed me! 🦋🍴",
      "Dragon fuel: more food! 🐉🍖",
      "I'm all out of fire because I’m so hungry! 🔥🛑",
      "Don't make me search for my own snack... you don't want that! 😱",
      "My flames are getting weak! Help me recharge with some food! 🍗🔥",
      "Do you see how big I am? I need more food! 🍔😋",
      "Food makes me fierce, and I need that training boost! 🍲⚡",
      "Don’t make me beg... just one snack, and I’ll train harder! 🥺",
      "I’m a dragon of action... but only after a snack! 🍕",
      "My scales are getting grumpy, feed me to smooth them out! 🐉💥",
      "A full belly makes me a happy dragon! Can you help me out? 🍽️💖",
      "This dragon is too hangry to train! 😤🍗",
      "A little snack and I’m back to my best self! 🤩🍔",
      "Trust me, my fire burns better after food! 🔥🍖",
      "My wings need food to soar, feed me now! 🍴🐉",
      "Without gems and food, I’m just a lazy dragon... help! 😴💎",
      "Even dragons have cravings! Can you help me with that? 🍩🐉",
      "What’s a dragon without a snack break? Not a happy one! 🍖🐾"
    ];

    const randomHungryMessage = hungryMessages[Math.floor(Math.random() * hungryMessages.length)];
    return randomHungryMessage;
  }

  async function feedDragonSimple(userId, dragonIndex) {
    let gemIcon = '<:gems:123456789>';

    const userData = await getUserDataDragon(userId);
    if (!userData.dragons || !userData.dragons.length) {
      return {
        success: false,
        message: `You have no dragons to feed! Summon one with \`dragon summon\`.`,
      };
    }
    if (dragonIndex < 0 || dragonIndex >= userData.dragons.length) {
      return {
        success: false,
        message: `Invalid dragon index. You only have ${userData.dragons.length} dragon(s).\n-# ❔ **EXAMPLE**:\n**feed \` <index> \` \` <times> \``,
      };
    }

    const targetDragon = userData.dragons[dragonIndex];
    const FEED_COST = targetDragon.hunger - 70 < 0 ? targetDragon.hunger: targetDragon.hunger - 70;
    if (userData.gems < FEED_COST) {
      return {
        success: false,
        message: `Not enough ${gemIcon} gems! You only have ${gemIcon} **${userData.gems}** gems.`,
      };
    }

    userData.gems -= FEED_COST;
    // Reduce hunger
    targetDragon.hunger = Math.max(0, targetDragon.hunger - FEED_COST);

    await saveUserData(userId, userData);

    return {
      success: true,
      message: `You fed **${targetDragon.customName ?? targetDragon.typeId.toUpperCase()}** with ${gemIcon} **${FEED_COST}** gems!`,
    };
  }

  async function doAdventureLogic(userId, dragonIndex, author) {
    const userData = await getUserDataDragon(userId);

    if (!userData.dragons?.length) {
      return {
        error: true,
        reason: 'no_dragons',
        errorMessage: `❗ You have no dragons to send on adventure! Summon one with \`dragon summon\`.`,
      };
    }
    if (dragonIndex < 0 || dragonIndex >= userData.dragons.length) {
      return {
        error: true,
        reason: 'invalid_index',
        errorMessage: `❗ Invalid dragon index. You only have ${userData.dragons.length} dragon(s).`,
      };
    }

    const targetDragon = userData.dragons[dragonIndex];
    if (!targetDragon.isHatched) {
      return {
        error: true,
        reason: 'egg',
        errorMessage: `❗ **${targetDragon.customName ?? targetDragon.typeId.toUpperCase()}** is still an egg! Hatch it first using \`dragon hatch <index>\`.`,
      };
    }

    if (targetDragon.hunger >= 80) {
      return {
        error: true,
        reason: 'too_hungry',
        errorMessage: `🍽️ Your dragon **${targetDragon.customName ?? targetDragon.typeId.toUpperCase()}** is too hungry to adventure. Please feed it first!\n-# ${randomHungerMessage().replace("train", "adventure")}`,
        feedAmountReq: targetDragon.hunger - 60
      };
    }

    const outcomeMessage = {
      success: [{
        message: `${targetDragon.typeId}'s sharp senses led it to a hidden gem-filled cave, and it looted a collection of rare jewels! 💎🏆`,
      },
        {
          message: `After a fierce chase, ${targetDragon.typeId} caught the gem-encrusted creature and claimed the sparkling bounty! 🐉💎`,
        },
        {
          message: `${targetDragon.typeId} uncovered an ancient chest, unlocking it with ease and revealing a stash of glittering gems inside! 🔓💎`,
        },
        {
          message: `With a well-aimed strike, ${targetDragon.typeId} defeated the gem guardians and looted their sparkling treasure! ⚔️💎`,
        },
        {
          message: `${targetDragon.typeId}'s persistence paid off, finding a trove of precious gems hidden deep in the mountains, adding to its hoard! 🏔️💎`,
        },
      ],
      fail: [{
        message: `${targetDragon.typeId}'s claws missed the elusive gem-encrusted creature, and it vanished into the shadows before it could strike. 😔`,
      },
        {
          message: `${targetDragon.typeId} found a hidden treasure chest, but it was trapped! The gems inside remain out of reach. 🛑💎`,
        },
        {
          message: `${targetDragon.typeId}'s fiery breath ignited the ancient gem guardians, but they were too quick to escape with the precious stones. 🔥👹`,
        },
        {
          message: `Despite ${targetDragon.typeId}'s keen senses, the gem-laden creature slipped past its grasp, leaving only glittering dust behind. 🏃‍♂️💨`,
        },
        {
          message: `${targetDragon.typeId} ventured deep into a cave filled with traps, but it triggered one, narrowly escaping with no gems to show for it. <:warning:1366050875243757699>🕳️`,
        },
      ],
    };

    // Probability
    let probability = Math.random();
    let hunger = Math.floor(Math.random() * (20 * targetDragon.stage));
    targetDragon.hunger = Math.min(100, targetDragon.hunger + hunger);

    let type = 'success';
    let resultText = '';
    let goldIcon = `<:gold:1320978185084473365>`
    let silverIcon = `<:silver:1320978175563661352>`
    let bronzeIcon = `<:bronze:1320978165702725714>`

    if (probability > (0.5 - targetDragon.stage / 70)) {
      // success
      type = 'success';
      let winningGems = Helper.randomInt(10, probability > 0.85 ? 50: 30);
      userData.sigils += 2;
      userData.gems += winningGems;

      let winningMetals = Helper.randomInt(5, probability > 0.85 ? 25: 15);
      let metalWinMessage = '';
      let metalWinProb = Math.random();
      if (metalWinProb > 0.75) {
        userData.metals.gold += winningMetals;
        metalWinMessage = `${goldIcon} **+${winningMetals}**`;
      } else if (metalWinProb > 0.4) {
        userData.metals.silver += winningMetals;
        metalWinMessage = `${silverIcon} **+${winningMetals}**`;
      } else {
        userData.metals.bronze += winningMetals;
        metalWinMessage = `${bronzeIcon} **+${winningMetals}**`;
      }

      resultText = `-# ***REWARDS***\n${gemIcon} **+${winningGems}** ${sigilsIcon} **+2**\n🍽️ **+${hunger}** ${metalWinMessage}`;
    } else {
      // fail
      userData.sigils = Math.max(0, userData.sigils - 1);
      type = 'fail';
      resultText = `-# ***LOSS***\n${sigilsIcon} **-1** 🍽️ **+${hunger}**`;
    }

    const outcomeObj =
    outcomeMessage[type][
      Math.floor(Math.random() * outcomeMessage[type].length)
    ];

    await saveUserData(userId, userData);

    const chosenType = dragonTypes.find((t) => t.id === targetDragon.typeId) || {};
    const randomLocationImg = `https://harshtiwari47.github.io/kasiko-public/images/dragons/adv-loc${
    1 + Math.floor(Math.random() * 5)
    }.jpg`;

    const finalEmbed = new EmbedBuilder()
    .setAuthor({
      name: author.username, iconURL: author.displayAvatarURL({
        dynamic: true
      })
    })
    .setDescription(`# ${targetDragon.customName ?? targetDragon.typeId.toUpperCase()}'𝒔 𝑨𝒅𝒗𝒆𝒏𝒕𝒖𝒓𝒆\n` + `${outcomeObj.message}\n\n${resultText}`)
    .setColor(type === 'fail' ? '#000000': chosenType.color || '#ffffff')
    .setImage(randomLocationImg);

    return {
      error: false,
      finalEmbed,
    };
  }

  async function doAdventureCycle(
    message,
    userId,
    dragonIndex,
    adventureMsg,
    collectorEnded
  ) {
    const userData = await getUserDataDragon(userId);
    const targetDragon = userData.dragons?.[dragonIndex];
    if (!targetDragon) {
      return adventureMsg.edit({
        content: '',
        embeds: [
          new EmbedBuilder().setDescription(`❗ Dragon not found or invalid index.`),
        ],
        components: [],
      });
    }

    const chosenType = dragonTypes.find((t) => t.id === targetDragon.typeId) || {};
    const suspenseEmbed = new EmbedBuilder()
    .setTitle(`${targetDragon.customName ?? targetDragon.typeId.toUpperCase()}'𝒔 𝑨𝒅𝒗𝒆𝒏𝒕𝒖𝒓𝒆`)
    .setDescription(
      `Your dragon **${
      targetDragon.customName ?? targetDragon.typeId.toUpperCase()
      }** is embarking on a mysterious adventure...\n⏳ *Please wait...*`
    )
    .setColor(chosenType.color || '#ffffff')
    .setImage(
      chosenType.landscapes?.[0] ||
      `https://harshtiwari47.github.io/kasiko-public/images/dragons/drg-adventure.jpg`
    );

    // Temporarily disable both buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('adventure_again')
      .setLabel('𝑨𝑮𝑨𝑰𝑵 🔁')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId('feed_dragon')
      .setLabel(`𝑭𝑬𝑬𝑫 💎`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(true)
    );

    await adventureMsg.edit({
      content: '',
      embeds: [suspenseEmbed],
      components: [row],
    });

    // Wait 4 seconds
    await new Promise((r) => setTimeout(r, 4000));

    // Now do final logic
    const advResult = await doAdventureLogic(userId, dragonIndex, message.author);

    if (advResult.error) {
      if (advResult.reason === 'too_hungry' && !collectorEnded) {
        const hungryEmbed = new EmbedBuilder()
        .setTitle(`${targetDragon.customName ?? targetDragon.typeId.toUpperCase()} 𝒊𝒔 𝑻𝒐𝒐 𝑯𝒖𝒏𝒈𝒓𝒚!`)
        .setDescription(advResult.errorMessage)
        .setColor('#ff9900');

        // Disable "Adventure again", enable "Feed"
        const rowHungry = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('adventure_again')
          .setLabel('𝑨𝑮𝑨𝑰𝑵 🔁')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('feed_dragon')
          .setLabel(`𝑭𝑬𝑬𝑫 💎`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(false)
        );

        return adventureMsg.edit({
          embeds: [hungryEmbed],
          components: [rowHungry],
        });
      } else {
        // Any other error -> remove buttons entirely
        return adventureMsg.edit({
          embeds: [new EmbedBuilder().setDescription(advResult.errorMessage)],
          components: [],
        });
      }
    }

    // If success/fail embed
    if (!collectorEnded) {
      // Re-enable both
      const rowFinal = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('adventure_again')
        .setLabel('𝑨𝑮𝑨𝑰𝑵 🔁')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false),
        new ButtonBuilder()
        .setCustomId('feed_dragon')
        .setLabel(`𝑭𝑬𝑬𝑫 💎`)
        .setStyle(ButtonStyle.Success)
        .setDisabled(false)
      );

      return adventureMsg.edit({
        embeds: [advResult.finalEmbed],
        components: [rowFinal],
      });
    } else {
      // Collector ended, disable both
      const rowFinalDisabled = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('adventure_again')
        .setLabel('𝑨𝑮𝑨𝑰𝑵 🔁')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
        new ButtonBuilder()
        .setCustomId('feed_dragon')
        .setLabel(`𝑭𝑬𝑬𝑫 💎`)
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
      );

      return adventureMsg.edit({
        embeds: [advResult.finalEmbed],
        components: [rowFinalDisabled],
      });
    }
  }

  /**
  * Send your dragon on adventure e.g. "dragon adventure 1"
  */

  export async function adventure(args, message) {
    const userId = message.author.id;
    const index = parseInt(args[1]) || 1;
    const dragonIndex = index - 1;

    const initialMessage = await message.channel.send({
      content: 'Preparing your dragon’s adventure...',
    });

    let collectorEnded = false;

    // Start the first adventure cycle
    await doAdventureCycle(message, userId, dragonIndex, initialMessage, collectorEnded);

    // Create a component collector
    const collector = initialMessage.createMessageComponentCollector({
      time: 120 * 1000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.replied || interaction.deferred) return; // Do not reply again
      // Only the original user
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: 'You are not allowed to interact!',
          ephemeral: true,
        });
      }

      await interaction.deferUpdate();

      if (collectorEnded) {
        return; // Do nothing if it's ended
      }

      if (interaction.customId === 'adventure_again') {
        await doAdventureCycle(message, userId, dragonIndex, initialMessage, collectorEnded);
      } else if (interaction.customId === 'feed_dragon') {
        // Feed
        const feedResult = await feedDragonSimple(userId, dragonIndex);

        if (!feedResult.success) {
          // If feed failed, just send ephemeral error
          await interaction.followUp({
            content: feedResult.message,
            ephemeral: true,
          });
          return;
        }

        // If feed succeeded, let's reload user data to show updated gems & hunger
        const updatedUserData = await getUserDataDragon(userId);
        const updatedDragon = updatedUserData.dragons[dragonIndex];

        // Show ephemeral success with updated stats
        await interaction.followUp({
          content: `${feedResult.message}\n` +
          `You now have **${updatedUserData.gems}** gems left.\n` +
          `Dragon's hunger is now **${updatedDragon.hunger}**.`,
          ephemeral: true,
        });

        // Then re-run the cycle to see if we can now adventure
        await doAdventureCycle(message, userId, dragonIndex, initialMessage, collectorEnded);
      }
    });

    collector.on('end',
      async () => {
        collectorEnded = true;
        try {
          const fetchedMsg = await message.channel.messages.fetch(initialMessage.id);
          if (!fetchedMsg) return;
          if (!fetchedMsg.components.length) return;

          const oldRow = fetchedMsg.components[0];
          const row = ActionRowBuilder.from(oldRow);
          row.components.forEach((btn) => btn.setDisabled(true));

          await fetchedMsg.edit({
            components: [row],
          });
        } catch (err) {
          console.error('Error disabling adventure buttons:', err);
        }
      });
  }


  /**
  * Feed a dragon with gems. e.g. "dragon feed 1 10" -> feed the 1st dragon with 10 gems
  */
  async function feedDragon(args, message) {
    const index = parseInt(args[1]) || 1;
    const amount = parseInt(args[2]) || 10; // default feeding cost
    const userId = message.author.id;

    if (amount < 1) {
      return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you must use at least 1 gem to feed your dragon.`);
    }

    let userData = await getUserDataDragon(userId);

    if (userData.dragons.length === 0) {
      return message.channel.send(`❗ You have no dragons to feed! Summon one with \`dragon summon\`.`);
    }

    const dragonIndex = index - 1;
    if (dragonIndex < 0 || dragonIndex >= userData.dragons.length) {
      return message.channel.send(`❗ Invalid dragon index. You only have ${userData.dragons.length} dragon(s).`);
    }

    // Check gems
    if (userData.gems < amount) {
      return message.channel.send(`❗ Not enough gems! You only have **${userData.gems}** gems.`);
    }


    // Deduct gems
    userData.gems -= amount;

    // Reduce hunger
    const targetDragon = userData.dragons[dragonIndex];
    const chosenType = dragonTypes.find(t => t.id === targetDragon.typeId);
    targetDragon.hunger = Math.min(100, Math.max(0, targetDragon.hunger - amount));

    await saveUserData(userId, userData);

    const reactions = [
      "Yum yum in my tum! 🐉💖",
      "You’re my favorite human! 💕",
      "That was scrumdiddlyumptious! 🥰",
      "Oh my scales, so tasty! 🌈",
      "My tummy says thank you! 🎉",
      "More snacks, more love! 🐾💓",
      "I'm a happy little dragon now! 🐉✨",
      "Feed me forever, please? 🥺",
      "I could eat that all day! 😋🐾",
      "Big hugs for the yummy gems! 🤗💎"
    ]

    return message.channel.send(`🍗 **${message.author.username}**, fed dragon <:${chosenType.id}2:${chosenType.emoji}> **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}** with ${gemIcon} **${amount}** gems.\n🍽️ Hunger is now **${targetDragon.hunger}**.\n-# ${reactions[Math.floor(Math.random() * reactions.length)]}`);
  }

  /**
  * Train a dragon. e.g. "dragon train 2" -> train the 2nd dragon
  * This could have a cooldown using Redis.
  */
  async function trainDragon(args, message) {
    const index = parseInt(args[1]) || 1;
    const userId = message.author.id;

    // Rate limiting
    const cooldownKey = `train_${userId}`;
    const cooldownExpiry = await redisClient.get(cooldownKey);
    if (cooldownExpiry && Date.now() < parseInt(cooldownExpiry, 10)) {
      const secondsLeft = Math.ceil((parseInt(cooldownExpiry, 10) - Date.now()) / 1000);
      return message.channel.send(`⏳ You must wait **${Math.ceil(secondsLeft/60)}** more minutes before training again.`);
    }

    let userData = await getUserDataDragon(userId);

    if (userData.dragons.length === 0) {
      return message.channel.send(`❗ You have no dragons to train!`);
    }

    const dragonIndex = index - 1;
    if (dragonIndex < 0 || dragonIndex >= userData.dragons.length) {
      return message.channel.send(`❗ Invalid dragon index. You only have ${userData.dragons.length} dragon(s).`);
    }

    let targetDragon = userData.dragons[dragonIndex];
    if (!targetDragon.isHatched) {
      return message.channel.send(`❗ This dragon is still an egg! Hatch it first using \`dragon hatch <index>\`.`);
    }

    // Check hunger before training
    if (targetDragon.hunger >= 60) {
      return message.channel.send(`🍽️ ***${message.author.username}***! Your dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, is too hungry to train. Please feed it!\n\n-# - ${randomHungerMessage()}`);
    }

    const attachment = new AttachmentBuilder('https://harshtiwari47.github.io/kasiko-public/images/dragons/dragon-training.png');

    // Perform training
    const experienceGained = Helper.randomInt(5, 10);
    targetDragon.experience += experienceGained;
    userData.sigils += 1;
    let hunger = Math.floor(Math.random() * (10 * targetDragon.stage));
    targetDragon.hunger = Math.min(100, Math.max(0, targetDragon.hunger + (hunger)));

    const chosenType = dragonTypes.find(t => t.id === targetDragon.typeId);

    // Check for stage up: e.g., need 100 XP per stage
    const threshold = targetDragon.stage * 100;
    let leveledUp = false;
    if (targetDragon.experience >= threshold) {
      targetDragon.stage += 1;
      targetDragon.experience = targetDragon.experience - threshold;
      targetDragon.hunger = 100;
      leveledUp = true;

      const levelUpEmbed = new EmbedBuilder()
      .setDescription(`🏆 Your dragon, <:${chosenType.id}2:${chosenType.emoji}> **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, advanced to **Stage ${targetDragon.stage}**!\n\n🍽️ **Hunger**: 100 ~ ${sigilsIcon} **Sigils**: +1`)
      .setAuthor({
        name: message.author.username, iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })
      .setColor(chosenType.color);

      await message.channel.send({
        embeds: [levelUpEmbed]
      });

    } else {
      const messagesTrain = [
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, just earned **${experienceGained} XP**! Ready for the next challenge? <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, is on fire! **${experienceGained} XP** gained! <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, just crushed it and earned **${experienceGained} XP**! <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**) gained **${experienceGained} XP** and is stronger than ever! <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, collected **${experienceGained} XP**! The adventure continues! <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, achieved greatness with **${experienceGained} XP**! Next level, here we come! <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, earned **${experienceGained} XP**! Ready to train harder? <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, is leveling up fast! **${experienceGained} XP** gained! Keep it up! <:dragon:1368113270443216926>`,
        `dragon, **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**, earned a massive **${experienceGained} XP**! Who’s next for a challenge? <:dragon:1368113270443216926>`
      ];

      // Select a random message
      const randomMessage = messagesTrain[Math.floor(Math.random() * messagesTrain.length)];

      // Send the random message
      await message.channel.send({
        content: `<:${chosenType.id}2:${chosenType.emoji}> **${message.author.username}**! Your ${randomMessage}\n\n-# **🍽️ 𝗛𝗨𝗡𝗚𝗘𝗥: +${hunger}** **${sigilsIcon} 𝗦𝗜𝗚𝗜𝗟𝗦: +1**`,
        files: [attachment]
      });
    }

    await saveUserData(userId, userData);

    // Set cooldown (e.g., 5 minutes)
    const fiveMinsFromNow = Date.now() + 3 * 60_000;
    await redisClient.set(cooldownKey, fiveMinsFromNow);

    return;
  }

  /**
  * Claim daily rewards
  */
  async function dailyReward(message) {
    const userId = message.author.id;
    let userData = await getUserDataDragon(userId);
    const now = new Date();
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours

    // Ensure lastDaily is a Date object
    const lastDailyDate = userData.lastDaily ? new Date(userData.lastDaily): null;

    if (lastDailyDate && now - lastDailyDate < cooldown) {
      const nextClaim = new Date(lastDailyDate.getTime() + cooldown);
      const timeLeft = nextClaim - now;
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return message.channel.send(`⏳ You've already claimed your daily reward. Try again in **${hoursLeft}h ${minutesLeft}m**.`);
    }

    // Random daily reward
    const reward = Helper.randomInt(80, 200);
    userData.gems += reward;
    userData.lastDaily = now;

    try {
      await saveUserData(userId, userData);
      return message.channel.send(`## <:dragon:1368113270443216926> 𝘿𝘼𝙄𝙇𝙔 𝘿𝙍𝘼𝙂𝙊𝙉 𝙍𝙀𝙒𝘼𝙍𝘿\n## ${gemIcon} **\` ${message.author.username}\`**\`, you claimed \`**\`${reward}\`**\` daily gems!\`\n\n<:kasiko_stopwatch:1355056680387481620> 𝑪𝒐𝒎𝒆 𝒃𝒂𝒄𝒌 𝒕𝒐𝒎𝒐𝒓𝒓𝒐𝒘 𝒕𝒐 𝒄𝒍𝒂𝒊𝒎 𝒚𝒐𝒖𝒓 𝒏𝒆𝒙𝒕 𝒅𝒂𝒊𝒍𝒚 𝒓𝒆𝒘𝒂𝒓𝒅.`);
    } catch (error) {
      console.error("Failed to save user data:", error);
      return message.channel.send("An error occurred while saving your reward. Please try again later.");
    }
  }

  /**
  * List user's dragons with pagination
  */
  async function listDragons(message) {
    const userId = message.author.id;
    let userData = await getUserDataDragon(userId);

    if (!userData || userData.dragons.length === 0) {
      return message.channel.send(`❗ You have no dragons. Use \`dragon summon\` to get started!`);
    }

    const itemsPerPage = 1;
    const totalPages = Math.ceil(userData.dragons.length / itemsPerPage);
    let currentPage = 1;

    const generateEmbed = (page) => {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const dragonsToShow = userData.dragons.slice(start, end);

      return dragonsToShow.flatMap((d, i) => {
        let description = '';
        const globalIndex = start + i + 1;
        const dType = dragonTypes.find(t => t.id === d.typeId);
        description += `-# **${dType?.name || d.typeId}**\n\n` +
        `**Nickname**: ${d.customName ? d.customName: "Default"}\n` +
        `**Stage**: ${d.stage} | **INDEX: ${globalIndex}**\n` +
        `**XP**: ${d.experience}\n` +
        `**Health**: ${d.health}\n` +
        `**Hunger**: ${d.hunger}\n` +
        `**Strength**: ${dType.strengths.join(", ")}\n` +
        `**Hatched**: ${d.isHatched ? 'Yes': 'No'}\n`;

        const embed = new EmbedBuilder()
        .setColor(dType.color)
        .setDescription(description)
        .setThumbnail(dType.images[d.stage - 1]);

        if (i === 0) {
          embed.setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({
              dynamic: true
            })
          });
        }

        const desEmbed = new EmbedBuilder()
        .setDescription(`${dType.description}`)
        .setFooter({
          text: `Page ${page} of ${totalPages}`
        });
        if (dType.landscapes) {
          desEmbed.setImage(dType.landscapes[0])
        }

        return [embed,
          desEmbed];
      });
    };

    const embedMessage = await message.channel.send({
      embeds: generateEmbed(currentPage),
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('prevPage')
          .setLabel('Previous 🐉')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 1),
          new ButtonBuilder()
          .setCustomId('nextPage')
          .setLabel('Next 🐉')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages)
        )
      ]
    });

    const filter = (interaction) => {
      return interaction.user.id === message.author.id && ['prevPage', 'nextPage'].includes(interaction.customId);
    };

    const collector = embedMessage.createMessageComponentCollector({
      filter,
      time: 60000,
      componentType: ComponentType.Button
    });

    collector.on('collect',
      async (interaction) => {
        if (interaction.customId === 'prevPage') {
          currentPage--;
        } else if (interaction.customId === 'nextPage') {
          currentPage++;
        }

        await interaction.update({
          embeds: generateEmbed(currentPage),
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
              .setCustomId('prevPage')
              .setLabel('Previous 🐉')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
              new ButtonBuilder()
              .setCustomId('nextPage')
              .setLabel('Next 🐉')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages)
            )
          ]
        });
      });

    collector.on('end',
      async () => {
        await embedMessage.edit({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
              .setCustomId('prevPage')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
              new ButtonBuilder()
              .setCustomId('nextPage')
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
            )
          ]
        });
      });
  }

  /**
  * Show top 10 players by total gems
  */
  async function showLeaderboard(message, client) {
    // Fetch top 10 users sorted by gems
    const topUsers = await Dragon.find().sort({
      sigils: -1
    }).limit(10);

    if (topUsers.length === 0) {
      return message.channel.send(`🏆 No dragons found on the leaderboard yet.`);
    }

    let leaderboard = '';
    for (let i = 0; i < topUsers.length; i++) {
      try {
        const user = await client.users.fetch(topUsers[i].userId);
        leaderboard += `**${i + 1}. ${user.username}** — **${topUsers[i].sigils}** ${sigilsIcon} | ${topUsers[i].gems} ${gemIcon} | ${topUsers[i].dragons.length} Dragons\n`;
      } catch (err) {
        console.log(err)
        leaderboard += `**${i + 1}. Unknown User** — **${topUsers[i].sigils}** ${sigilsIcon} | ${topUsers[i].gems} ${gemIcon} | ${topUsers[i].dragons.length} Dragons\n`;
      }
    }

    const embedTitle = new EmbedBuilder()
    .setDescription(`### 🏆 Dragon Leaderboard 🐉`)
    .setImage(`https://harshtiwari47.github.io/kasiko-public/images/dragons/rosabelle-flying.jpg`)
    .setColor("#e9c9dd")

    const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setDescription(leaderboard)
    .setTimestamp();

    return message.channel.send({
      embeds: [embedTitle, embed]
    });
  }

  /**
  * Calculate dragon power based on stats and type advantages
  */
  function calculateDragonPower(dragon, typeAdvantage) {
    let power = (dragon.stage * 10) + dragon.experience + Helper.randomInt(0, 50);
    power += typeAdvantage * 10; // Advantage boosts power, disadvantage reduces it
    return power;
  }

  /**
  * Determine battle outcome
  * Returns 1 if attacker wins, -1 if defender wins, 0 for draw
  */
  function determineBattleOutcome(attackerPower, defenderPower) {
    const totalPower = attackerPower + defenderPower;
    const randomFactor = Helper.randomInt(0, totalPower);

    if (randomFactor < attackerPower) {
      return 1; // Attacker wins
    } else if (randomFactor < totalPower) {
      return -1; // Defender wins
    } else {
      return 0; // Draw
    }
  }

  /**
  * Check current gem balance
  */
  async function checkGems(message) {
    const userId = message.author.id;
    let userData = await getUserDataDragon(userId);

    return message.channel.send(`${gemIcon} **${message.author.username}**, you currently have **${userData.gems}** gems.`);
  }

  /**
  * Check current gem balance
  */
  async function checkSigils(message) {
    const userId = message.author.id;
    let userData = await getUserDataDragon(userId);

    return message.channel.send(`${sigilsIcon} **${message.author.username}**, you currently have **${userData.sigils}** mythical sigils.`);
  }

  /**
  *  Other commands pat, walk, play
  */

  async function actions(args, message) {
    const messages = {
      "pat": [
        "You gently pat the dragon's warm scales, feeling its low rumble of approval.\n💤 🤍",
        "The dragon lowers its head, enjoying the soft pats on its crest.\n💤 🤍",
        "You pat the dragon’s snout, and it closes its eyes, clearly at ease.\n💤 🤍",
        "As you pat the dragon, its tail sways happily, thumping against the ground.\n💤 🤍",
        "The dragon’s scales feel surprisingly smooth as it leans into your touch.\n💤 🤍"
      ],
      "play": [
        "You toss a glowing orb, and the dragon leaps to catch it mid-air.\n🟡 ⚡",
        "The dragon playfully nudges you with its massive wing, challenging you to keep up.\n🤗 ⛹🏻",
        "A game of hide-and-seek with the dragon becomes thrilling as it easily sniffs you out.\n🌳👀💭",
        "The dragon breathes a tiny puff of smoke, showing off during your playtime.\n💨🔥🎭",
        "You and the dragon race across the open field, its wings beating rhythmically beside you.\n🏃‍♀️🌬️✨"
      ],
      "walk": [
        "You walk alongside the dragon as it surveys the horizon with keen eyes.\n👣 ✨",
        "The dragon’s footsteps echo as you explore the vast landscape together.\n🐾 ✨",
        "Walking through the dense forest, the dragon clears a path with its tail.\n🌲 ✨",
        "The dragon matches your pace, its majestic presence making the stroll unforgettable.\n🌳 ✨",
        "As you walk, the dragon stretches its wings, casting a shadow over the path.\n✨ 🐾"
      ]
    }

    const action = args[0] || "pat"; // default pat
    const index = parseInt(args[1]) || 1;
    const userId = message.author.id;

    let userData = await getUserDataDragon(userId);

    if (userData.dragons.length === 0) {
      return message.channel.send(`❗ You have no dragons to ${action}! Summon one with \`dragon summon\`.`);
    }

    const dragonIndex = index - 1;
    if (dragonIndex < 0 || dragonIndex >= userData.dragons.length) {
      return message.channel.send(`❗ Invalid dragon index. You only have ${userData.dragons.length} dragon(s).`);
    }

    let targetDragon = userData.dragons[dragonIndex];
    const chosenType = dragonTypes.find(t => t.id === targetDragon.typeId);

    const embed = new EmbedBuilder()
    .setDescription(`## ${action.toUpperCase()} TIME\n> ${messages[action][Math.floor(Math.random() * messages[action].length)]}\n\n-# **EXPERIENCE : +1**`)
    .setThumbnail(chosenType.images[targetDragon.stage - 1])
    .setColor(chosenType.color)
    .setAuthor({
      name: message.author.username, iconURL: message.author.displayAvatarURL({
        dynamic: true
      })
    })

    if (chosenType.landscapes && chosenType.landscapes[0]) {
      embed.setImage(chosenType.landscapes[0])
    }

    targetDragon.experience += 1;

    const threshold = targetDragon.stage * 100;
    let leveledUp = false;
    if (targetDragon.experience >= threshold) {
      targetDragon.stage += 1;
      targetDragon.experience = targetDragon.experience - threshold;
      targetDragon.hunger = 100;
      leveledUp = true;

      const levelUpEmbed = new EmbedBuilder()
      .setDescription(`🏆 Your dragon (<:${chosenType.id}2:${chosenType.emoji}> **${targetDragon.customName ? targetDragon.customName: targetDragon.typeId.toUpperCase()}**) advanced to **Stage ${targetDragon.stage}**!\n-# 🍽️ **Hunger**: 100 | ${sigilsIcon} **Sigils**: +1`)
      .setAuthor({
        name: message.author.username, iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })
      .setColor(chosenType.color);

      await message.channel.send({
        embeds: [levelUpEmbed]
      });
    }

    await saveUserData(userId, userData);

    return await message.channel.send({
      embeds: [embed]
    });
  }

  async function changeActive(args, message) {
    const userId = message.author.id;

    let userData = await getUserDataDragon(userId);

    if (userData.dragons.length === 0) {
      return message.channel.send(`❗ You have no dragons to ${action}! Summon one with \`dragon summon\`.`);
    }

    if (!args[1] || ! Number.isInteger(Number(args[1]))) {
      let targetDragon = userData.dragons[userData.active || 0];

      return message.channel.send(`❗Your active dragon is **${targetDragon.typeId.toUpperCase()}**! Use \`dragon active <index>\` to change it.`);
    }

    const index = parseInt(args[1]); // Dragon Index

    const dragonIndex = Math.max(index - 1, 0);

    if (dragonIndex < 0 || dragonIndex >= userData.dragons.length) {
      return message.channel.send(`❗ Invalid dragon index. You only have ${userData.dragons.length} dragon(s).`);
    }

    let targetDragon = userData.dragons[dragonIndex];

    userData.active = index;

    await saveUserData(userId, userData);

    return message.channel.send(`✅ **${message.author.username}**, you have successfully set your **${targetDragon.typeId.toUpperCase()}** dragon as active for the next battle. Your dragon is ready for adventure!`);
  }

  async function changeNickname(args, message) {
    if (!args[2]) {
      return message.channel.send(`❗ Nickname is missing in arguments. Use Example: \`dragon rename 1 Puppy\`.`);
    }

    if (!args[1] || ! Number.isInteger(Number(args[1]))) {
      return message.channel.send(`❗ Dragons index is missing in arguments. Use Example: \`dragon rename 1 Puppy\`.`);
    }

    const index = parseInt(args[1]); // Dragon Index
    const name = args[2]; // name

    if (name.length > 20) {
      return message.channel.send("❗Dragon nickname must be under 20 characters and cannot include spaces.");
    }

    const userId = message.author.id;

    let userData = await getUserDataDragon(userId);

    if (userData.dragons.length === 0) {
      return message.channel.send(`❗ You have no dragons to ${action}! Summon one with \`dragon summon\`.`);
    }

    const dragonIndex = index - 1;
    if (dragonIndex < 0 || dragonIndex >= userData.dragons.length) {
      return message.channel.send(`❗ Invalid dragon index. You only have ${userData.dragons.length} dragon(s).`);
    }

    let targetDragon = userData.dragons[dragonIndex];
    const chosenType = dragonTypes.find(t => t.id === targetDragon.typeId);

    if (userData.dragons.some(drag => drag.customName && drag.customName.toLowerCase() === name.toLowerCase())) {
      return message.channel.send(`❗ Oops! One of your dragons already has this nickname. Please choose another.`);
    }

    targetDragon.customName = name;

    await saveUserData(userId, userData);

    return message.channel.send(`✅ **${message.author.username}**, you have successfully given your **${targetDragon.typeId.toUpperCase()}** dragon the sweet nickname **${name}**. Your dragon is happy!`);
  }