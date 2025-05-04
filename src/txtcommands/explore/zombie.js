import {
  getUserData,
  updateUser
} from "../../../database.js";
import fs from 'fs';
import path from 'path';

import Zombie from "../../../models/Zombie.js";

// Load all dragon types from JSON
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const storyPath = path.join(__dirname, './zombie/story.json');
const Chapters = JSON.parse(fs.readFileSync(storyPath, 'utf-8'));

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} from "discord.js";

import zombieSurvivalBadges from "./zombie/zombieSurvivalBadges.js";
import weaponsStats from "./zombie/weaponsStats.js";
import redisClient from "../../../redis.js";

import locations from "./zombie/locations.js";
import emojiList from "./zombie/emojiList.js";
import {
  handleLocItems
} from "./zombie/handleItems.js";

function getShelterImg(level) {
  if (level > 15) level = 15;

  return `https://harshtiwari47.github.io/kasiko-public/images/zombie/shelterimg${level}.png`
}

function createZombieEmbed(gameData) {
  const TitleEmbed = new EmbedBuilder()
  .setDescription(`### <:lily:1318792945343791214> <@${gameData.id}>'s Apocalypse Stats`)
  .setColor("#301414")

  const zombieStatsEmbed = new EmbedBuilder()
  .setColor('#141c30') // Background color
  .setImage(getShelterImg(gameData.level))
  .setDescription(
    `### <:lily:1318792945343791214> <@${gameData.id}>'s Apocalypse Stats\n` +
    `**❤️ Health:** ${gameData.health} HP\n` +
    `**${emojiList.shelter} Level:** Level ${gameData.level}\n` +
    `**${emojiList.zombie} Kills:** ${gameData.kill} kills\n` +
    `**${emojiList.shovel} Active Weapon:** ***${gameData.activeWeapon.weapon} ${gameData.activeWeapon.name}*** (Lvl: **${gameData.activeWeapon.level}**)`
  )
  .setFooter({
    text: `📖 zombie story ${gameData.level}`
  });

  const zombieResourcesEmbed = new EmbedBuilder()
  .setColor('#1a371b')
  .setTitle(`Resources`)
  .setDescription(
    `**${emojiList.wood} Wood:** ${gameData.resources.wood} units\n` +
    `**${emojiList.metal} Metal:** ${gameData.resources.metal} units\n` +
    `**${emojiList.medkit} Medkits:** ${gameData.resources.medkit} units\n` +
    `**${emojiList.carrot} Food:** ${gameData.resources.food} units\n` +
    `-# \`kas zombie help\``
  )
  .setFooter({
    text: 'Zombie Resources Information'
  });

  return [
    zombieStatsEmbed,
    zombieResourcesEmbed];
}

export async function readStory(chapter, message) {
  try {
    let Pages = Chapters[`chapter${chapter}`].pages;
    if (!Pages) {
      return message.channel.send(`❗Chapter ${chapter} not found.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    let title = Chapters[`chapter${chapter}`].title;

    let currentPage = 0;
    let totalPages = 4;

    const generateEmbed = (page) => {
      return new EmbedBuilder()
      .setTitle(title)
      .setDescription(Pages[page].replace("$_username_", message.author.username))
      .setAuthor({
        name: message.author.username, iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })
      .setColor("#173221")
      .setImage(getShelterImg(chapter))
      .setFooter({
        text: `PAGE: ${page + 1}`
      });
    }

    const embedMessage = await message.channel.send({
      embeds: [generateEmbed(currentPage)],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('prevPage')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
          new ButtonBuilder()
          .setCustomId('nextPage')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages)
        )
      ]
    });

    const filter = (interaction) => {
      return interaction.user.id === message.author.id && ['prevPage',
        'nextPage'].includes(interaction.customId);
    };

    const collector = embedMessage.createMessageComponentCollector({
      filter,
      time: 60000,
      componentType: ComponentType.Button
    });

    collector.on('collect',
      async (interaction) => {
        try {
          if (interaction.customId === 'prevPage') {
            currentPage--;
          } else if (interaction.customId === 'nextPage') {
            currentPage++;
          }

          await interaction.update({
            embeds: [generateEmbed(currentPage)],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId('prevPage')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
                new ButtonBuilder()
                .setCustomId('nextPage')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages)
              )
            ]
          });
        } catch (err) {}
      });

    collector.on('end',
      async () => {
        try {
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
        } catch (err) {}
      });
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
  }
}

export async function zombieSurvival(id, playerInfo, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let disableOptions = [];
    let gameData = {}

    playerInfo.lastBattle.time = new Date();
    playerInfo.lastBattle.active = true;

    await redisClient.set(`user:${id}:zombieBattle`,
      JSON.stringify(true),
      {
        EX: 120,
        // Cache for 2 min
      });

    // Initialize player data if missing
    if (!gameData.health) gameData.health = 100; // Default health: 100
    if (!gameData.stamina) gameData.stamina = 50; // Default stamina: 50
    if (!gameData.supplies) gameData.supplies = 0; // Default supplies: 0
    if (!gameData.zombiesKilled) gameData.zombiesKilled = 0; // Default zombies killed: 0
    if (!gameData.weaponDurability) gameData.weaponDurability = 100; // Default weapon durability: 100

    let targetLocation = locations.filter(loc => playerInfo.kill >= loc.killRequired);
    targetLocation = targetLocation[Math.floor(Math.random() * targetLocation.length)];


    let currentZombies = 2; // NEW: how many are actively attacking
    let totalZombiesSpawned = 2; // to cap at gameData.ZombiesToKill

    let dealLocationItems = handleLocItems(gameData, targetLocation, currentZombies);
    gameData = (dealLocationItems?.gameData || gameData);
    currentZombies = (dealLocationItems?.currentZombies || currentZombies);

    // bonus supplies
    gameData.supplies += targetLocation.bonousSupplies;

    gameData.ZombiesToKill = ((2 * playerInfo.level) + Math.ceil(Math.random() * targetLocation.maxZombies));

    // Starting game embed
    const introEmbed = new EmbedBuilder()
    .setDescription(
      `## ${emojiList.zombie} ᤁᴏ꧑ხıɛ ᥉ᤙɾ᥎ı᥎ɑꝇ\n-# **${guild.user.username.toUpperCase()}**, you find yourself surrounded in a zombie-infested world. Your goal: **SURVIVE**!\n\n` +
      `**𝗟𝗢𝗖𝗔𝗧𝗜𝗢𝗡**  ${targetLocation?.name}\n` +
      `**𝗧𝗜𝗠𝗘**  2 minutes\n` +
      "> ◎ `𝘠𝘰𝘶 𝘤𝘢𝘯 𝘵𝘢𝘬𝘦 𝘢𝘤𝘵𝘪𝘰𝘯𝘴 𝘭𝘪𝘬𝘦 `**`ꜱᴇᴀʀᴄʜ`**`, `**`ꜰɪɢʜᴛ`**`, `**`ʜɪᴅᴇ`**`, `**`ᴄʀᴀꜰᴛ ᴡᴇᴀᴘᴏɴ`**`, 𝘰𝘳 `**`ꜱᴘᴇᴄɪᴀʟ ᴡᴇᴀᴘᴏɴ`**`. 𝘊𝘩𝘰𝘰𝘴𝘦 𝘸𝘪𝘴𝘦𝘭𝘺 𝘵𝘰 𝘮𝘢𝘯𝘢𝘨𝘦 𝘺𝘰𝘶𝘳 `**`ʜᴇᴀʟᴛʜ`**`, `**`ꜱᴛᴀᴍɪɴᴀ`**`, 𝘢𝘯𝘥 `**`ꜱᴜᴘᴘʟɪᴇꜱ`**.\n" +
      `${dealLocationItems?.message && dealLocationItems?.message !== "" ? dealLocationItems?.message: ""} ${targetLocation.bonousSupplies ? `\n-# **𝖡𝗈𝗇𝗎𝗌 𝖲𝗎𝗉𝗉𝗅𝗂𝖾𝗌** ${emojiList.supplies} ${targetLocation.bonousSupplies}`: ""}`
    )
    .setImage(targetLocation?.url)
    .setColor(targetLocation?.color)
    .setFooter({
      text: "𝘔𝘢𝘬𝘦 𝘺𝘰𝘶𝘳 𝘤𝘩𝘰𝘪𝘤𝘦 𝘣𝘺 𝘤𝘭𝘪𝘤𝘬𝘪𝘯𝘨 𝘵𝘩𝘦 𝘣𝘶𝘵𝘵𝘰𝘯𝘴 𝘣𝘦𝘭𝘰𝘸."
    });

    // Action Buttons
    const actionRow = (disable = [], activeWeapon) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("search")
        .setLabel("🔍 Search")
        .setDisabled(disable.some(id => id === "search"))
        .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
        .setCustomId("fight")
        .setLabel("Fight")
        .setEmoji("1366433331650232330")
        .setDisabled(disable.some(id => id === "fight"))
        .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
        .setCustomId("hide")
        .setDisabled(disable.some(id => id === "hide"))
        .setLabel("Hide")
        .setEmoji("1366433228138872893")
        .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
        .setCustomId("craft")
        .setDisabled(disable.some(id => id === "craft"))
        .setLabel("🔧 Craft Weapon")
        .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
        .setCustomId("weapon")
        .setDisabled(disable.some(id => id === "weapon"))
        .setLabel(`${activeWeapon.weapon} ${activeWeapon.name}`)
        .setStyle(ButtonStyle.Secondary),
      );
    }

    const gameMessage = await channel.send({
      embeds: [introEmbed],
      components: [actionRow(disableOptions, playerInfo.activeWeapon)]
    });

    const zombiesEmbed = (logDetails, isFooter = false) => {
      const EmbedGen = new EmbedBuilder()
      .setTitle('𝙕𝙤𝙢𝙗𝙞𝙚𝙨 𝙒𝙖𝙫𝙚')
      .setDescription(
        `𝗭𝗢𝗠𝗕𝗜𝗘𝗦: **${gameData.ZombiesToKill}**\n` +
        `𝗔𝗧𝗧𝗔𝗖𝗞𝗜𝗡𝗚: ${currentZombies}\n` +
        `${logDetails && !isFooter ? logDetails: ""}`
      )
      .setThumbnail(targetLocation?.url);

      if (isFooter) {
        EmbedGen.setFooter({
          text: logDetails
        })
      }

      return EmbedGen;
    }

    const generateStatusEmbed = (embedColor) => {
      return new EmbedBuilder()
      .setDescription(
        `❤️ **Health:** ${gameData.health} ` +
        `⚡ **Stamina:** ${gameData.stamina}\n` +
        `${emojiList.tools} **Weapon Durability:** ${gameData.weaponDurability}\n` +
        `${emojiList.supplies} **Supplies:** ${gameData.supplies} ` +
        `${emojiList.zombie} **Zombies Killed:** ${gameData.zombiesKilled}`)
      .setColor(embedColor ? embedColor: "#d32b2b");
    }

    let zombiesEmbedShow = zombiesEmbed();

    // Spawn wave every 30s
    const spawnTimer = setInterval(async () => {
      // compute how many left we can spawn
      const remaining = gameData.ZombiesToKill - totalZombiesSpawned;
      if (remaining <= 0) {
        clearInterval(spawnTimer);
        return;
      }
      const newZombies = Math.min(
        remaining,
        Math.floor(Math.random() * Math.min((playerInfo.activeWeapon.minHunt + Math.floor(Math.random() * playerInfo.activeWeapon.maxHunt)), playerInfo.activeWeapon.maxHunt)) + 1 // 1–4 spawns
      );
      currentZombies += newZombies;
      totalZombiesSpawned += newZombies;

      // Update the “zombiesEmbedShow” with arrival message
      zombiesEmbedShow = zombiesEmbed(
        `💀 **${newZombies}** more zombies have appeared! `
      );

      const currentEmbeds = gameMessage?.embeds?.map(e => EmbedBuilder.from(e));
      const updatedEmbeds = currentEmbeds?.map(embed =>
        embed.data.title === "𝙕𝙤𝙢𝙗𝙞𝙚𝙨 𝙒𝙖𝙫𝙚" ? zombiesEmbedShow: embed
      );

      if (gameData.weaponDurability > 0) {
        if (disableOptions.some(id => id === "fight")) {
          disableOptions = disableOptions.filter(id => id !== "fight");
        }
      }

      await gameMessage?.edit({
        embeds: updatedEmbeds,
        components: [actionRow(disableOptions, playerInfo.activeWeapon)]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    },
      20_000);


    // Collect Button Clicks
    const filter = (interaction) => interaction.user.id === id;
    const collector = gameMessage.createMessageComponentCollector({
      filter,
      time: 120000 // 2 - minute timeout
    });

    const damageTimer = setInterval(async () => {
      if (currentZombies > 0) {
        const dmg = currentZombies * 4;
        gameData.health -= dmg;

        zombiesEmbedShow = zombiesEmbed(
          `⚠️ ${currentZombies} zombie${currentZombies > 1 ? "s": ""} attacked you for ${dmg} damage!`, true
        );

        const currentEmbeds = gameMessage?.embeds?.map(e => EmbedBuilder.from(e));
        const updatedEmbeds = currentEmbeds?.map(embed =>
          embed.data.title === "𝙕𝙤𝙢𝙗𝙞𝙚𝙨 𝙒𝙖𝙫𝙚" ? zombiesEmbedShow: embed
        );

        updatedEmbeds.pop();

        updatedEmbeds.push(generateStatusEmbed());

        if (gameData.health < 0) {
          collector.stop();
        }

        await gameMessage?.edit({
          embeds: updatedEmbeds
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    },
      10_000);


    collector.on("collect",
      async (interaction) => {
        try {
          const choice = interaction.customId;
          let outcome = "";
          let embedColor = "DarkRed";
          let image = null;
          let statusTitle = `Zombie Survival Update ${emojiList.zombie}`;
          let lilyHelp = `Best of luck, Survivor!`;

          let zombies = {
            1: "1367864990723342397",
            2: "1367865070167527496",
            3: "1367865100697866406",
            4: "1367865129965719672",
            5: "1367865157111517284",
            6: "1367865183329845298",
            7: "1367865215441440859",
            8: "1367865252158504990",
            9: "1367865301273940069",
            10: "1367865323843485726",
            11: "1367865347918528602",
            12: "1367865368281878528",
            13: "1367865390612480021",
            14: "1367865409331527800",
            15: "1367865426255806475"
          }

          let zombieThumb = null;

          // Handle Player Actions
          if (choice === "search") {
            const supplies = Math.floor(Math.random() * 100) + 20;
            gameData.supplies += supplies;
            gameData.stamina -= 10;

            let dealLocationItemsSearch = handleLocItems(gameData, targetLocation, currentZombies);
            gameData = (dealLocationItemsSearch?.gameData || gameData);
            currentZombies = (dealLocationItemsSearch?.currentZombies || currentZombies);

            outcome = `🔍 **${guild.user.username}** scavenged the area and found **${supplies} supplies**!\n- Stamina reduced by 10.${dealLocationItemsSearch?.message ? dealLocationItemsSearch.message: ""}`;
            embedColor = "Blue";
            image = "https://harshtiwari47.github.io/kasiko-public/images/zmb6.jpg";
            lilyHelp = "Use ***search*** to gather supplies to craft your weapon 🛠, but lose stamina! ⚡";
          } else if (choice === "fight") {
            const damage = Math.floor(Math.random() * 30) + 20;
            image = "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg";
            gameData.zombiesKilled += 1;
            gameData.weaponDurability -= Math.floor(Math.random() * 20) + 10;
            currentZombies = Math.max(0, currentZombies - 1);

            zombieThumb = `https://cdn.discordapp.com/emojis/${zombies[Math.floor(1 + Math.random() * 5)]}.png`

            outcome = `${emojiList.fist} **${guild.user.username}** 𝘣𝘳𝘢𝘷𝘦𝘭𝘺 𝘧𝘰𝘶𝘨𝘩𝘵 𝘢 𝘻𝘰𝘮𝘣𝘪𝘦!\n` +
            `- :boom: 𝗞𝗜𝗟𝗟𝗘𝗗 **1**`;
            embedColor = "Red";
            lilyHelp = "Use ***fight*** to battle zombies, but it risks your HP and weapon durability! 🪤";

            zombiesEmbedShow = zombiesEmbed();
          } else if (choice === "hide") {
            const success = Math.random() < 0.7;
            if (success) {
              outcome = `${emojiList.shield} You successfully hid from the zombies and regained **10 stamina**.`;
              gameData.stamina += 10;
            } else {
              gameData.health -= 15;
              outcome = `${emojiList.zombie} A zombie spotted you while hiding! You lost **15 health**.`;
            }
            image = "https://harshtiwari47.github.io/kasiko-public/images/zmb3.jpg";
            embedColor = "Yellow";
            lilyHelp = "Use ***hide*** to regain some ⚡ stamina, helping you in your search 🔍!";

          } else if (choice === "craft") {
            image = "https://harshtiwari47.github.io/kasiko-public/images/zmb5.jpg";

            if (gameData.supplies >= 50) {
              gameData.supplies -= 50;
              gameData.weaponDurability += 30;
              outcome = `🔧 You crafted and repaired your weapon! **Durability +30** (Cost: 50 supplies).`;
              embedColor = "Blue";
            } else {
              outcome = `<:alert:1366050815089053808> Not enough supplies to craft! You need at least **50 supplies**.`;
              embedColor = "Green";
            }

            lilyHelp = "Using ***craft weapon*** enhances your defense and boosts weapon durability for fight! 🛠";
          } else if (choice === "weapon") {
            image = "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg";
            let killedZombies = Math.min((playerInfo.activeWeapon.minHunt + Math.floor(Math.random() * playerInfo.activeWeapon.maxHunt)), playerInfo.activeWeapon.maxHunt);
            gameData.zombiesKilled += Math.min(currentZombies, killedZombies);
            currentZombies = Math.max(0, currentZombies - killedZombies);

            outcome = `${emojiList.shovel} **${guild.user.username}** used their weapon ${playerInfo.activeWeapon.weapon} and killed ${killedZombies} zombie${killedZombies === 1 ? '': 's'}!\n`;

            disableOptions.push("weapon");
            embedColor = "#822fea";
            zombieThumb = `https://cdn.discordapp.com/emojis/${zombies[Math.floor(1 + Math.random() * 5)]}.png`

            lilyHelp = "Your special weapon can be used once for maximum impact! 💥";

            zombiesEmbedShow = zombiesEmbed();
          }

          if (gameData.stamina < 1) {
            disableOptions.push("search");
          } else if (disableOptions.some(id => id === "search")) {
            disableOptions = disableOptions.filter(id => id !== "search");
          }

          if (gameData.weaponDurability < 1) {
            disableOptions.push("fight");
          } else if (disableOptions.some(id => id === "fight")) {
            disableOptions = disableOptions.filter(id => id !== "fight");
          }

          if (currentZombies <= 0) {
            if (!disableOptions.some(opt => opt === "fight")) {
              disableOptions.push("fight");
            }
          } else if (disableOptions.some(id => id === "fight") && gameData.weaponDurability >= 0) {
            disableOptions = disableOptions.filter(id => id !== "fight");
          }

          // Check if user is dead
          if (gameData.health <= 0) {
            collector.stop();
            return;
          }

          const statusTitleEmbed = new EmbedBuilder()
          .setDescription(`### ${statusTitle}\n-# <:lily:1318792945343791214> ${lilyHelp}`)

          // Update Game Status
          const statusDesEmbed = new EmbedBuilder()
          .setDescription(`${outcome}`);

          const statusEmbed = generateStatusEmbed(embedColor);

          if (image) {
            statusTitleEmbed.setThumbnail(image)
          } else {
            statusTitleEmbed.setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/zmb2.png")
          }

          if (zombieThumb) {
            statusDesEmbed.setThumbnail(zombieThumb)
          }

          await interaction.update({
            embeds: [statusTitleEmbed, statusDesEmbed, zombiesEmbedShow, statusEmbed],
            components: [actionRow(disableOptions, playerInfo.activeWeapon)]
          });
        } catch (err) {
          console.log(err)
        }
      });

    collector.on("end",
      async () => {
        try {
          await gameMessage.delete().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          clearInterval(spawnTimer);
          clearInterval(damageTimer);

          let rewardMessage = "";

          let reward = Math.random();

          let userData = await getUserData(id);
          const zombiesKilledReward = gameData.zombiesKilled * 200;

          if (reward > 0.825 && gameData.zombiesKilled > 7) {
            let cash = 15000 + Math.floor(Math.random() * 15000) + zombiesKilledReward;
            let wood = 20 + Math.floor(Math.random() * 30);
            let medkit = 1 + Math.floor(Math.random() * 2);
            let metal = 10 + Math.floor(Math.random() * 30);

            rewardMessage =
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash}**\n` +
            `- - ${emojiList.wood} Wood: **${wood}**\n` +
            `- - ${emojiList.medkit} Medkit: **${medkit}**\n` +
            `- - ${emojiList.metal} Metal: **${metal}**`;

            playerInfo.resources.wood += wood;
            playerInfo.resources.medkit += medkit;
            playerInfo.resources.metal += metal;

            userData.cash += cash;
          } else if (reward > 0.6769 && gameData.zombiesKilled > 4) {
            let cash = 10000 + Math.floor(Math.random() * 10000) + zombiesKilledReward;
            let wood = 20 + Math.floor(Math.random() * 25);
            let medkit = 1 + Math.floor(Math.random() * 1);
            let metal = 10 + Math.floor(Math.random() * 25);

            rewardMessage =
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash}**\n` +
            `- - ${emojiList.wood} Wood: **${wood}**\n` +
            `- - ${emojiList.medkit} Medkit: **${medkit}**\n` +
            `- - ${emojiList.metal} Metal: **${metal}**`;

            playerInfo.resources.wood += wood;
            playerInfo.resources.medkit += medkit;
            playerInfo.resources.metal += metal;

            userData.cash += cash;
          } else if (reward > 0.5269 && gameData.zombiesKilled > 3) {
            let cash = 5000 + Math.floor(Math.random() * 5000) + zombiesKilledReward;
            let wood = 20 + Math.floor(Math.random() * 10);
            let food = 1 + Math.floor(Math.random() * 20);
            let metal = 10 + Math.floor(Math.random() * 10);

            rewardMessage =
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash}**\n` +
            `- - ${emojiList.wood} Wood: **${wood}**\n` +
            `- - ${emojiList.carrot} Food: **${food}**\n` +
            `- - ${emojiList.metal} Metal: **${metal}**`;

            playerInfo.resources.wood += wood;
            playerInfo.resources.food += food;
            playerInfo.resources.metal += metal;

            let userData = await getUserData(id);
            userData.cash += cash;
            await updateUser(id, userData);

          } else if (gameData.zombiesKilled > 2) {
            let wood = 10 + Math.floor(Math.random() * 10);
            let food = 1 + Math.floor(Math.random() * 20);
            let cash = zombiesKilledReward;

            rewardMessage =
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash}**\n` +
            `- - ${emojiList.wood} Wood: **${wood}**\n` +
            `- - ${emojiList.carrot} Food: **${food}**`;

            playerInfo.resources.wood += wood;
            playerInfo.resources.food += food;
          }

          playerInfo.health -= 100 - gameData.health;
          playerInfo.kill += gameData.zombiesKilled;
          playerInfo.lastBattle.active = false;

          await playerInfo.save();

          userData.cash += (gameData?.supplies || 0) * 10;

          if (gameData.zombiesKilled >= gameData.ZombiesToKill) userData.cash += 10000;

          await updateUser(id, userData);

          await channel.send({
            content: "## ```𝑨 𝒗𝒊𝒄𝒊𝒐𝒖𝒔 𝒉𝒐𝒓𝒅𝒆 𝒐𝒇 𝒛𝒐𝒎𝒃𝒊𝒆𝒔 𝒉𝒂𝒔 𝒂𝒕𝒕𝒂𝒄𝒌𝒆𝒅!```\n" + `<:zombie3:1318799748139974689> \`𝚄𝚗𝚏𝚘𝚛𝚝𝚞𝚗𝚊𝚝𝚎𝚕𝚢, \`**\`${guild.user.username}\`** \`𝚌𝚘𝚞𝚕𝚍𝚗'𝚝 𝚎𝚜𝚌𝚊𝚙𝚎 𝚒𝚗 𝚝𝚒𝚖𝚎.\` ${emojiList.scratch}\n## ${emojiList.reward} **Rewards Earned:**\n${rewardMessage}`,
            embeds: [
              new EmbedBuilder()
              .setDescription(
                `## <:lily:1318792945343791214> 𝒁𝒐𝒎𝒃𝒊𝒆 𝑨𝒑𝒐𝒄𝒂𝒍𝒚𝒑𝒔𝒆 𝑺𝒕𝒓𝒊𝒌𝒆𝒔!\n` +
                `- ${emojiList.zombie} 𝗧𝗼𝘁𝗮𝗹 𝗭𝗼𝗺𝗯𝗶𝗲𝘀 𝗞𝗶𝗹𝗹𝗲𝗱: **${gameData.zombiesKilled}**\n` +
                `- ${emojiList.supplies} 𝗦𝘂𝗽𝗽𝗹𝗶𝗲𝘀 𝗚𝗮𝘁𝗵𝗲𝗿𝗲𝗱: **${gameData.supplies}**\n` +
                `𝘚𝘶𝘱𝘱𝘭𝘪𝘦𝘴 𝘣𝘰𝘯𝘶𝘴 ~ <:kasiko_coin:1300141236841086977> **${gameData.supplies * 10}**\n` +
                `${gameData.zombiesKilled >= gameData.ZombiesToKill ? `𝘊𝘰𝘮𝘱𝘭𝘦𝘵𝘪𝘰𝘯 𝘉𝘰𝘯𝘶𝘴 ~ <:kasiko_coin:1300141236841086977> **10,000**`: ``}`
              )
              .setColor("DarkGrey")
            ]
          });
        } catch (err) {}
      });
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return channel.send(`⚠ Something went wrong during the zombie survival! Please try again.\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function viewUserLocationCollection(playerInfo, message) {
  try {
    const itemsPerPage = 1; // Number of locations per page const totalPages = Math.ceil(locations.length / itemsPerPage); let currentPage = 0;
    const totalPages = Math.ceil(locations.length / itemsPerPage);
    let currentPage = 0;

    // Create pagination buttons
    const prevButton = new ButtonBuilder()
    .setCustomId('prev_loc')
    .setLabel('◀ Previous')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

    const nextButton = new ButtonBuilder()
    .setCustomId('next_loc')
    .setLabel('Next ▶')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(totalPages <= 1);

    const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

    // Helper to generate embed for the current page
    const generateEmbed = () => {
      const embed = new EmbedBuilder()
      .setDescription(`## 🗺️ ${message.author.username}' s 𝑨𝒑𝒐𝒄𝒂𝒍𝒚𝒑𝒔𝒆 𝑳𝒐𝒄𝒂𝒕𝒊𝒐𝒏𝒔\n` + '-# Here are the game locations and their unlock status:');

      const start = currentPage * itemsPerPage;
      const end = Math.min(start + itemsPerPage, locations.length);

      locations.slice(start, end).forEach((loc) => {
        const unlocked = playerInfo.kill >= loc.killRequired;
        embed.addFields({
          name: `${loc.name} — ${unlocked ? 'ᴜɴʟᴏᴄᴋᴇᴅ': '🔒 ʟᴏᴄᴋᴇᴅ'}`,
          value:
          `- **${emojiList.zombie} Kills Required**: ${loc.killRequired}\n` +
          `- **${emojiList.supplies} Bonus Supplies**: ${loc.bonousSupplies}\n` +
          `- **🎒 Items Found**: ${loc.items.length ? loc.items.map(item => `${item.icon} **${item.name}**`).join(", "): "Unknown"}`,
          inline: false
        });
        embed.setImage(loc.url);
      });

      return embed;
    };

    // Send initial embed with pagination
    const reply = await message.channel.send({
      embeds: [generateEmbed()],
      components: [row],
    });

    // Collector to handle button interactions
    const filter = (i) => i.isButton() && i.user.id === message.author.id;
    const collector = reply.createMessageComponentCollector({
      filter, time: 60000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId === 'prev_loc' && currentPage > 0) {
        currentPage--;
      } else if (interaction.customId === 'next_loc' && currentPage < totalPages - 1) {
        currentPage++;
      }

      // Update buttons disabled state
      prevButton.setDisabled(currentPage === 0);
      nextButton.setDisabled(currentPage === totalPages - 1);

      // Edit the embed and components
      await interaction.editReply({
        embeds: [generateEmbed()],
        components: [row],
      });
    });

    collector.on('end',
      (_, reason) => {
        reply.edit({
          components: []
        }).catch(() => {});
      });

  } catch (e) {
    console.error(e); return message.reply('⚠️ Something went wrong while fetching locations.').catch(() => {});
  }
}

async function viewUserWeaponCollection(playerInfo, message) {
  try {
    const itemsPerPage = 2; // Number of weapons per page
    const totalPages = Math.ceil(playerInfo.weapons.length / itemsPerPage);
    let currentPage = 0;

    const viewWeaponsButton = new ButtonBuilder()
    .setCustomId('view_weapons')
    .setLabel('View Weapon Collection')
    .setStyle(ButtonStyle.Primary);

    const prevButton = new ButtonBuilder()
    .setCustomId('prev_page')
    .setLabel('◀ 𝗣𝗿𝗲𝘃𝗶𝗼𝘂𝘀')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage === 0);

    const nextButton = new ButtonBuilder()
    .setCustomId('next_page')
    .setLabel('𝗡𝗲𝘅𝘁 ▶')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage === totalPages - 1);

    const row = new ActionRowBuilder().addComponents(prevButton,
      nextButton);

    if (!playerInfo.weapons || playerInfo.weapons.length === 0) {
      return message.reply("<:warning:1366050875243757699> You don't have any weapons in your collection.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Function to generate the embed for the current page
    const generateEmbed = () => {
      const embed = new EmbedBuilder()
      .setTitle(`**${message.author.username.toUpperCase()}**'S **WEAPON COLLECTION**`)
      .setDescription('-# <:lily:1318792945343791214> 𝘏𝘦𝘳𝘦 𝘢𝘳𝘦 𝘺𝘰𝘶𝘳 𝘸𝘦𝘢𝘱𝘰𝘯𝘴 𝘢𝘯𝘥 𝘵𝘩𝘦𝘪𝘳 𝘴𝘵𝘢𝘵𝘴:');

      const start = currentPage * itemsPerPage;
      const end = Math.min(start + itemsPerPage, playerInfo.weapons.length);


      playerInfo.weapons.slice(start, end).forEach((weapon, index) => {
        let weaponData = weaponsStats.find(weaponDetails => weaponDetails.name.toLowerCase() === weapon.name.toLowerCase());
        embed.addFields({
          name: `<:reply_bottom:1368225277452226643> **${start + index + 1}** <:spark:1355139233559351326> ${weapon.weapon} ${weapon.name}`,
          value: `\`\`\`𝘔𝘐𝘕. 𝘏𝘜𝘕𝘛: ${weapon.minHunt}\n𝘔𝘈𝘟. 𝘏𝘜𝘕𝘛: ${weapon.maxHunt}\n𝘓𝘌𝘝𝘌𝘓: ${weapon.level}\n𝘊𝘖𝘚𝘛: ${weaponData.cost} metals\`\`\`\n`,
          inline: true,
        });
      });

      return embed;
    };

    const reply = await message.channel.send({
      embeds: [generateEmbed()],
      components: [row],
    });

    const filter = (interaction) => interaction.isButton() && interaction.user.id === message.author.id;
    const collector = reply.createMessageComponentCollector({
      filter, time: 30000,
    });

    collector.on('collect', async (interaction) => {
      try {
        await interaction.deferUpdate();

        if (interaction.customId === 'prev_page' && currentPage > 0) {
          currentPage--;
        } else if (interaction.customId === 'next_page' && currentPage < totalPages - 1) {
          currentPage++;
        }

        // Update the buttons' disabled state based on the current page
        prevButton.setDisabled(currentPage === 0);
        nextButton.setDisabled(currentPage === totalPages - 1);

        // Edit the message with the updated embed and button row
        await interaction.editReply({
          embeds: [generateEmbed()],
          components: [row],
        });
      } catch (err) {}
    });

    collector.on('end',
      (collected, reason) => {
        if (reason === 'time') {
          try {
            reply.edit({
              components: [],
            });
          } catch (err) {}
        }
      });

  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return message.reply("<:warning:1366050875243757699> Something went wrong while checking your weapons!").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "zombie",
  description: "Survive the zombie apocalypse with strategic decisions!",
  aliases: ["survive",
    "zombies",
    "z"],
  cooldown: 90000,
  emoji: "🧟",
  example: ["zombie",
    "z",
    "zombie help"],
  category: "🍬 Explore",

  execute: async (args,
    message) => {
    try {
      let subCommand = args.length ? args[1]: null;

      let playerInfo = await Zombie.findOne({
        id: message.author.id
      });

      if (!playerInfo) {
        playerInfo = new Zombie( {
          id: message.author.id
        })
      }

      if (subCommand === "hunt" || subCommand === "h") {

        const cachedBattle = await redisClient.get(`user:${message.author.id}:zombieBattle`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

        if (cachedBattle) {
          return message.channel.send(`${emojiList.zombie} Please wait. **2 minutes** haven't passed yet.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        if (playerInfo.health <= 100) {
          return message.channel.send(
            `${emojiList.eva} **${message.author.username}**, 𝘺𝘰𝘶𝘳 𝘩𝘦𝘢𝘭𝘵𝘩 𝘪𝘴 𝘤𝘳𝘪𝘵𝘪𝘤𝘢𝘭𝘭𝘺 𝘭𝘰𝘸, 𝘴𝘶𝘳𝘷𝘪𝘷𝘰𝘳! ${emojiList.scratch} \n` +
            "-# ```Y𝘰𝘶 𝘯𝘦𝘦𝘥 𝘮𝘰𝘳𝘦 𝘵𝘩𝘢𝘯 100 𝘏𝘗 𝘵𝘰 𝘣𝘦 𝘣𝘢𝘵𝘵𝘭𝘦-𝘳𝘦𝘢𝘥𝘺.```\n" +
            `${emojiList.syringe} 𝖨𝗇𝗌𝗍𝖺𝗇𝗍𝗅𝗒 𝗁𝖾𝖺𝗅 **+100 HP** using a _*med syringe*_ for <:kasiko_coin:1300141236841086977> **3000 cash** by using ***\`kas z heal\`***.`
          ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        return zombieSurvival(message.author.id, playerInfo,
          message.channel);
      }

      if (subCommand === "weapons" || subCommand === "weapon") {
        return viewUserWeaponCollection(playerInfo, message);
      }

      if (subCommand === "location" || subCommand === "l") {
        return viewUserLocationCollection(playerInfo, message);
      }

      if (subCommand === "active") {
        let weaponName = args[2] ? args[2].toLowerCase(): null;

        if (!weaponName) {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, please provide the weapon name from your collection that you want to use currently!\nExample: \`zombie active glove\``).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        if (!playerInfo.weapons.some(weapon => weapon.name.toLowerCase() === weaponName)) {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, no such weapon found in your apocalypse inventory!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        let weaponData = playerInfo.weapons.find(weapon => weapon.name.toLowerCase() === weaponName);

        if (weaponData) {
          playerInfo.activeWeapon = weaponData;
        }

        await playerInfo.save();

        return message.channel.send(`${emojiList.shovel} **${message.author.username}**, from now on you are using **${playerInfo.activeWeapon.weapon} ${playerInfo.activeWeapon.name}** during your zombie hunt!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (subCommand === "modify") {
        let weaponName = args[2] ? args[2].toLowerCase(): null;

        if (!weaponName) {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, please provide the weapon name from your collection that you want to use currently!\nExample: \`zombie modify glove\``).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        // Find the weapon in the player's collection
        let WeaponIndex = playerInfo.weapons.findIndex(weapon => weapon.name.toLowerCase() === weaponName);

        if (WeaponIndex === -1) {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, no such weapon found in your apocalypse inventory!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        let WeaponInCollection = playerInfo.weapons[WeaponIndex];

        // Check if the player has enough resources
        let WeaponDetails = weaponsStats.find(weapon => weapon.name.toLowerCase() === weaponName);
        if (WeaponDetails.cost && playerInfo.resources.metal < WeaponDetails.cost) {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you don't have enough ${emojiList.metal} Metal to level up **${weaponName}**!\nRequired: ${emojiList.metal} ${WeaponDetails.cost}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        // Update the weapon in the collection
        WeaponInCollection.level += 1;
        WeaponInCollection.maxHunt += 1;

        // Reassign the updated weapon back into the array
        playerInfo.weapons[WeaponIndex] = WeaponInCollection;

        // Update the active weapon if it matches the upgraded weapon
        if (playerInfo.activeWeapon.name.toLowerCase() === weaponName) {
          playerInfo.activeWeapon.level += 1;
          playerInfo.activeWeapon.maxHunt += 1;
        }

        // Deduct the resource cost
        playerInfo.resources.metal -= WeaponDetails.cost;

        // Save the changes to the database
        try {
          await playerInfo.save();
          return message.channel.send(`${emojiList.zombie} ✶ ${emojiList.shovel} **${message.author.username}**, you have upgraded your **${WeaponInCollection.weapon} ${WeaponInCollection.name}** to level ${WeaponInCollection.level}!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } catch (error) {
          console.error("Error saving playerInfo:", error);
          return message.channel.send(`❌ An error occurred while saving your data. Please try again.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (subCommand === "upgrade") {
        let numberOfTimesLevelUp = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
        let woodReq = playerInfo.level * 150 * numberOfTimesLevelUp;

        if (numberOfTimesLevelUp > 0 && playerInfo.resources.wood >= woodReq) {
          playerInfo.resources.wood -= 150 * numberOfTimesLevelUp;
          playerInfo.level += numberOfTimesLevelUp;

          let newWeapons = weaponsStats.filter(weapon => weapon.unlockAt > (playerInfo.level - numberOfTimesLevelUp) && weapon.unlockAt <= playerInfo.level);
          let newWeaponMessage = "";

          if (newWeapons.length) {
            newWeaponMessage = `New weapon${newWeapons.length > 1 ? "s": ""} unlocked: ${newWeapons.map(weaponInfo => `${weaponInfo.weapon} **${weaponInfo.name}**`).join(", ")}`

            newWeapons.forEach(newWeapon => {
              if (newWeapon) {
                playerInfo.weapons.push({
                  name: newWeapon.name,
                  weapon: newWeapon.weapon,
                  maxHunt: newWeapon.maxHunt,
                  minHunt: newWeapon.minHunt,
                  level: 1,
                });
              }
            });
          }

          await playerInfo.save();
          return message.channel.send(`${emojiList.shelter} **${message.author.username}**, you have successfully upgraded your shelter to Level **${playerInfo.level}** using ${emojiList.wood} **${woodReq}** wood!\n${newWeaponMessage}`).catch(err => ![50001,
            50013,
            10008].includes(err.code) && console.error(err));
        } else if (numberOfTimesLevelUp === 0 || numberOfTimesLevelUp < 0) {
          return message.channel.send(`<:warning:1366050875243757699> What’s that? Please provide a valid number for upgrade!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you don’t have enough ${emojiList.wood} **${woodReq} **wood in your apocalypse resources to upgrade your shelter.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (subCommand === "cure") {
        let numberOfMed = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
        if (numberOfMed > 0 && playerInfo.resources.medkit >= numberOfMed) {
          playerInfo.resources.medkit -= numberOfMed;
          playerInfo.health += 50 * numberOfMed;
          await playerInfo.save();
          return message.channel.send(`${emojiList.medkit} **${message.author.username}**, you have successfully used **${numberOfMed}** and gained ${numberOfMed * 50} HP for your apocalypse hunt!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else if (numberOfMed === 0 || numberOfMed < 0) {
          return message.channel.send(`<:warning:1366050875243757699> What’s that? Please provide a valid number for medkit/cure!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you don't have enough medkit in your apocalypse resources to cure!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (subCommand === "eat") {
        let numberOfFood = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
        if (numberOfFood > 0 && playerInfo.resources.food >= numberOfFood) {
          playerInfo.resources.food -= numberOfFood;
          playerInfo.health += 10 * numberOfFood;
          await playerInfo.save();
          return message.channel.send(`${emojiList.medkit}${emojiList.carrot}**${message.author.username}**, you have successfully eaten your food and gained ${numberOfFood * 10} HP for your apocalypse hunt!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else if (numberOfFood === 0 || numberOfFood < 0) {
          return message.channel.send(`<:warning:1366050875243757699> What’s that? Please provide a valid number for food!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you don't have enough food in your apocalypse resources to eat!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (subCommand === "story") {
        let chapter = args[2] ? parseInt(Number(args[2])): 1;
        if (chapter < 1) chapter = 1;
        if (chapter > 15) return message.channel.send(`❗Only 15 chapters are available.`);
        return readStory(chapter, message);
      }

      if (subCommand === "heal") {
        try {
          let userData = await getUserData(message.author.id);

          if (userData.cash <= 3000) {
            return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you don't have <:kasiko_coin:1300141236841086977> 3000 cash!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          userData.cash -= 3000;
          playerInfo.health += 100;

          await playerInfo.save();
          await updateUser(message.author.id, userData);

          return message.channel.send(
            `${emojiList.medkit} **${message.author.username}**, survivor, you have been healed and gained **+100 HP**! Stay strong and keep moving forward!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } catch (err) {
          return message.channel.send(`⚠ **${message.author.username}**, something went wrong during healing!\n-# **Error**: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (subCommand === "help") {

        const helpEmbed = new EmbedBuilder()
        .setColor("#261b1b")
        .setTitle('Zombie Apocalypse Command Help')
        .setDescription('Use these commands to manage your survival in the apocalypse!')
        .addFields(
          {
            name: 'Basic Usage',
            value: '`zombie [subcommand] [arguments]`',
          },
          {
            name: 'hunt',
            value: 'Go on a zombie hunt to gather resources and weapons.\n**Usage:** `zombie hunt`',
          },
          {
            name: 'weapons | weapon',
            value: 'View the weapons you currently own.\n**Usage:** `zombie weapons`',
          },
          {
            name: 'active',
            value: 'Set one of your owned weapons as your active weapon.\n**Usage:** `zombie active <weaponName>`',
          },
          {
            name: 'modify',
            value: 'Upgrade a specific weapon if you have the required metal resources.\n**Usage:** `zombie modify <weaponName>`',
          },
          {
            name: 'upgrade',
            value: 'Upgrade your shelter level using wood.\n**Usage:** `zombie upgrade <timesToUpgrade>` (e.g., `zombie upgrade 2`)',
          },
          {
            name: 'location',
            value: 'Hunt at random unlocked locations.\n**Usage:** `zombie location`',
          },
          {
            name: 'cure',
            value: 'Use medkits to restore your health (+50).\n**Usage:** `zombie cure <numberOfMedkits>`',
          },
          {
            name: 'heal',
            value: 'Instantly restore your health (+100) for <:kasiko_coin:1300141236841086977> 3000 cash.\n**Usage:** `zombie heal`',
          },
          {
            name: 'eat',
            value: 'Consume food to restore health (+10).\n**Usage:** `zombie eat <numberOfFoodItems>`',
          }
        )
        .setFooter({
          text: 'Stay alive out there!'
        });

        return message.channel.send({
          embeds: [helpEmbed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      return message.channel.send({
        embeds: createZombieEmbed(playerInfo)
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
      return message.channel.send(`⚠ Something went wrong while your Zombie adventure! 🧟\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};