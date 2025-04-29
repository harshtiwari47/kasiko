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

import redisClient from "../../../redis.js";

const emojiList = {
  "wood": "<:wood:1366433544817086554>",
  "metal": "<:metal:1366433796639162378>",
  "carrot": "<:carrot:1366433463120695417>",
  "supplies": "<:supplies:1366433993427259462>",
  "scratch": "<:scratch:1366434067163254915>",
  "fist": "<:fist:1366433331650232330>",
  "shield": "<:zombie_shield:1366433228138872893>",
  "shelter": "<:shelter:1366433165899727011>",
  "shovel": "<:shovel:1366433062140903525>",
  "medkit": "<:medkit:1366433010798428271>",
  "reward": "<:reward_box:1366435558011965500>",
  "syringe": "<:syringe:1366621473267122197>",
  "tools": "<:tools:1366621543177912442>",
  "eva": "<:eva:1366632251856781352>",
  "zombie": "<:zombie:1366632304054632528>",
  "bottle": "<:kerosene_bottle:1366632375689281666>",
  "bomb": "<:bomb:1366632465015504946>"
}

const weaponsStats = [{
  weapon: '🥊',
  name: 'Glove',
  minHunt: 1,
  maxHunt: 2,
  level: 1,
  cost: 100,
  rarity: 'common',
  unlockAt: 1
},
  {
    weapon: '💣',
    name: 'Bomb',
    minHunt: 20,
    maxHunt: 40,
    level: 1,
    cost: 500,
    rarity: 'epic',
    unlockAt: 15
  },
  {
    weapon: '🔪',
    name: 'Knife',
    minHunt: 1,
    maxHunt: 3,
    level: 1,
    cost: 150,
    rarity: 'uncommon',
    unlockAt: 3
  },
  {
    weapon: '🛡️',
    name: 'Shield',
    minHunt: 8,
    maxHunt: 15,
    level: 1,
    cost: 200,
    rarity: 'rare',
    unlockAt: 7
  },
  {
    weapon: '🗡️',
    name: 'Sword',
    minHunt: 15,
    maxHunt: 30,
    level: 1,
    cost: 300,
    rarity: 'uncommon',
    unlockAt: 6
  },
  {
    weapon: '🏒',
    name: 'Stick',
    minHunt: 18,
    maxHunt: 35,
    level: 1,
    cost: 400,
    rarity: 'epic',
    unlockAt: 16
  },
  {
    weapon: '🪃',
    name: 'Crate',
    minHunt: 25,
    maxHunt: 50,
    level: 1,
    cost: 800,
    rarity: 'legendary',
    unlockAt: 18
  },
  {
    weapon: '🏹',
    name: 'Bow',
    minHunt: 2,
    maxHunt: 4,
    level: 1,
    cost: 200,
    rarity: 'common',
    unlockAt: 2
  },
  {
    weapon: '🔫',
    name: 'Gun',
    minHunt: 30,
    maxHunt: 60,
    level: 1,
    cost: 1000,
    rarity: 'legendary',
    unlockAt: 20
  },
  {
    weapon: '🧨',
    name: 'Dynamite',
    minHunt: 35,
    maxHunt: 70,
    level: 1,
    cost: 1200,
    rarity: 'epic',
    unlockAt: 17
  },
  {
    weapon: '🪓',
    name: 'Axe',
    minHunt: 22,
    maxHunt: 45,
    level: 1,
    cost: 350,
    rarity: 'rare',
    unlockAt: 10
  },
  {
    weapon: '⛏️',
    name: 'Pickaxe',
    minHunt: 3,
    maxHunt: 7,
    level: 1,
    cost: 250,
    rarity: 'uncommon',
    unlockAt: 5
  },
  {
    weapon: '🔨',
    name: 'Hammer',
    minHunt: 20,
    maxHunt: 50,
    level: 1,
    cost: 400,
    rarity: 'epic',
    unlockAt: 14
  }];

const zombieSurvivalBadges = [{
  badge: '🧟‍♂️',
  name: 'Zombie Slayer',
  rarity: 'common'
},
  {
    badge: '🔥',
    name: 'Firestarter',
    rarity: 'uncommon'
  },
  {
    badge: '⚔️',
    name: 'Blade Master',
    rarity: 'rare'
  },
  {
    badge: '💀',
    name: 'Grim Reaper',
    rarity: 'epic'
  },
  {
    badge: '🛡️',
    name: 'Shield Bearer',
    rarity: 'common'
  },
  {
    badge: '🎯',
    name: 'Perfect Aim',
    rarity: 'legendary'
  },
  {
    badge: '🧰',
    name: 'Survivalist',
    rarity: 'uncommon'
  },
  {
    badge: '🔫',
    name: 'Gun Slinger',
    rarity: 'rare'
  },
  {
    badge: '💥',
    name: 'Explosion Expert',
    rarity: 'epic'
  },
  {
    badge: '🏆',
    name: 'Top Survivor',
    rarity: 'legendary'
  }];

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
    const gameData = {}

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

    // Starting game embed
    const introEmbed = new EmbedBuilder()
    .setDescription(
      `## ${emojiList.zombie} ᤁᴏ꧑ხıɛ ᥉ᤙɾ᥎ı᥎ɑꝇ\n**${guild.user.username}**, you find yourself surrounded in a zombie-infested world. Your goal: **SURVIVE**!\n\n` +
      "You can take actions like **Search**, **Fight**, **Hide**, **Craft Weapon**, or **Special Weapon**. Choose wisely to manage your **Health**, **Stamina**, and **Supplies**.\n" +
      "Good luck! You have 1 minute and 30 seconds."
    )
    .setImage("https://harshtiwari47.github.io/kasiko-public/images/zmb2.png")
    .setColor("DarkRed")
    .setFooter({
      text: "Make your choice by clicking the buttons below."
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

    // Collect Button Clicks
    const filter = (interaction) => interaction.user.id === id;
    const collector = gameMessage.createMessageComponentCollector({
      filter,
      time: 90000 // 1.3 - minute timeout
    });

    collector.on("collect", async (interaction) => {
      try {
        const choice = interaction.customId;
        let outcome = "";
        let embedColor = "DarkRed";
        let image = null;
        let statusTitle = `Zombie Survival Update ${emojiList.zombie}`;
        let lilyHelp = `Best of luck, Survivor!`;

        let zombies = {
          1: "1318799726283460630",
          2: "1318799737176064000",
          3: "1318799748139974689",
          4: "1318799778410139719",
          5: "1318799826086793297",
          6: "1318799841979138048"
        }

        let zombieThumb = null;

        // Handle Player Actions
        if (choice === "search") {
          const supplies = Math.floor(Math.random() * 100) + 20;
          gameData.supplies += supplies;
          gameData.stamina -= 10;
          outcome = `🔍 **${guild.user.username}** scavenged the area and found **${supplies} supplies**!\n- Stamina reduced by 10.`;
          embedColor = "Blue";
          image = "https://harshtiwari47.github.io/kasiko-public/images/zmb6.jpg";
          lilyHelp = "Use ***search*** to gather supplies to craft your weapon 🛠, but lose stamina! ⚡";
        } else if (choice === "fight") {
          const damage = Math.floor(Math.random() * 30) + 20;
          const zombieDamage = Math.floor(Math.random() * 15) + 10;
          image = "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg";
          gameData.zombiesKilled += 1;
          gameData.weaponDurability -= Math.floor(Math.random() * 20) + 10;
          gameData.health -= zombieDamage;

          zombieThumb = `https://cdn.discordapp.com/emojis/${zombies[Math.floor(1 + Math.random() * 5)]}.png`

          outcome = `${emojiList.fist} **${guild.user.username}** 𝘣𝘳𝘢𝘷𝘦𝘭𝘺 𝘧𝘰𝘶𝘨𝘩𝘵 𝘢 𝘻𝘰𝘮𝘣𝘪𝘦!\n` +
          `- :boom: 𝘿𝙖𝙢𝙖𝙜𝙚 𝙙𝙚𝙖𝙡𝙩 ~ **${damage}**\n- :broken_heart: 𝙃𝙚𝙖𝙡𝙩𝙝 𝙡𝙤𝙨𝙩 ~ **${zombieDamage}**\n- 𝑾𝒆𝒂𝒑𝒐𝒏 𝒅𝒖𝒓𝒂𝒃𝒊𝒍𝒊𝒕𝒚 𝒓𝒆𝒅𝒖𝒄𝒆𝒅 𝒃𝒚 10.`;
          embedColor = "Red";
          lilyHelp = "Use ***fight*** to battle zombies, but it risks your HP and weapon durability! 🪤";
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
          gameData.zombiesKilled += killedZombies;

          outcome = `${emojiList.shovel} **${guild.user.username}** used their weapon ${playerInfo.activeWeapon.weapon} and killed ${killedZombies} zombie${killedZombies === 1 ? '': 's'}!\n`;

          disableOptions.push("weapon");
          embedColor = "#822fea";
          zombieThumb = `https://cdn.discordapp.com/emojis/${zombies[Math.floor(1 + Math.random() * 5)]}.png`

          lilyHelp = "Your special weapon can be used once for maximum impact! 💥";
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

        const statusEmbed = new EmbedBuilder()
        .setDescription(
          `❤️ **Health:** ${gameData.health} ` +
          `⚡ **Stamina:** ${gameData.stamina}\n` +
          `${emojiList.tools} **Weapon Durability:** ${gameData.weaponDurability}\n` +
          `${emojiList.supplies} **Supplies:** ${gameData.supplies} ` +
          `${emojiList.zombie} **Zombies Killed:** ${gameData.zombiesKilled}`)
        .setColor(embedColor);
        if (image) {
          statusTitleEmbed.setThumbnail(image)
        } else {
          statusTitleEmbed.setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/zmb2.png")
        }

        if (zombieThumb) {
          statusDesEmbed.setThumbnail(zombieThumb)
        }

        await interaction.update({
          embeds: [statusTitleEmbed, statusDesEmbed, statusEmbed],
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

          let rewardMessage = "";

          let reward = Math.random();

          let userData = await getUserData(id);

          if (reward > 0.9 && gameData.zombiesKilled > 7) {
            let cash = 15000 + Math.floor(Math.random() * 15000);
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
          } else if (reward > 0.75 && gameData.zombiesKilled > 4) {
            let cash = 10000 + Math.floor(Math.random() * 10000);
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
          } else if (reward > 0.5 && gameData.zombiesKilled > 3) {
            let cash = 5000 + Math.floor(Math.random() * 5000);
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

            rewardMessage =
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
          await updateUser(id, userData);

          await channel.send({
            content: "## ```𝑨 𝒗𝒊𝒄𝒊𝒐𝒖𝒔 𝒉𝒐𝒓𝒅𝒆 𝒐𝒇 𝒛𝒐𝒎𝒃𝒊𝒆𝒔 𝒉𝒂𝒔 𝒂𝒕𝒕𝒂𝒄𝒌𝒆𝒅!```\n" + `<:zombie3:1318799748139974689> \`𝚄𝚗𝚏𝚘𝚛𝚝𝚞𝚗𝚊𝚝𝚎𝚕𝚢, \`**\`${guild.user.username}\`** \`𝚌𝚘𝚞𝚕𝚍𝚗'𝚝 𝚎𝚜𝚌𝚊𝚙𝚎 𝚒𝚗 𝚝𝚒𝚖𝚎.\` ${emojiList.scratch}\n## ${emojiList.reward} **Rewards Earned:**\n${rewardMessage}`,
            embeds: [
              new EmbedBuilder()
              .setDescription(
                `## <:lily:1318792945343791214> 𝒁𝒐𝒎𝒃𝒊𝒆 𝑨𝒑𝒐𝒄𝒂𝒍𝒚𝒑𝒔𝒆 𝑺𝒕𝒓𝒊𝒌𝒆𝒔!\n` +
                `- ${emojiList.zombie} 𝗧𝗼𝘁𝗮𝗹 𝗭𝗼𝗺𝗯𝗶𝗲𝘀 𝗞𝗶𝗹𝗹𝗲𝗱: **${gameData.zombiesKilled}**\n` +
                `- ${emojiList.supplies} 𝗦𝘂𝗽𝗽𝗹𝗶𝗲𝘀 𝗚𝗮𝘁𝗵𝗲𝗿𝗲𝗱: **${gameData.supplies}**\n` +
                `𝘚𝘶𝘱𝘱𝘭𝘪𝘦𝘴 𝘣𝘰𝘯𝘶𝘴 ~ <:kasiko_coin:1300141236841086977> **${gameData.supplies * 10}**`
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
      .setTitle(`<:lily:1318792945343791214> **${message.author.username}**'s Weapon Collection`)
      .setDescription('-# 𝘏𝘦𝘳𝘦 𝘢𝘳𝘦 𝘺𝘰𝘶𝘳 𝘸𝘦𝘢𝘱𝘰𝘯𝘴 𝘢𝘯𝘥 𝘵𝘩𝘦𝘪𝘳 𝘴𝘵𝘢𝘵𝘴:');

      const start = currentPage * itemsPerPage;
      const end = Math.min(start + itemsPerPage, playerInfo.weapons.length);


      playerInfo.weapons.slice(start, end).forEach((weapon, index) => {
        let weaponData = weaponsStats.find(weaponDetails => weaponDetails.name.toLowerCase() === weapon.name.toLowerCase());
        embed.addFields({
          name: `<:spark:1355139233559351326> 𝗪𝗘𝗔𝗣𝗢𝗡 ${start + index + 1}: ${weapon.name} ${weapon.weapon}`,
          value: `- **Min Hunt**: ${weapon.minHunt}\n- **Max Hunt**: ${weapon.maxHunt}\n- **Level**: ${weapon.level}\n- **Cost**: ${emojiList.metal} ${weaponData.cost}`,
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
          return message.channel.send(`${emojiList.zombie} Please wait. 2 minutes haven't passed yet.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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

        return message.channel.send(`${emojiList.zombie}${emojiList.shovel} **${message.author.username}**, from now on you are using **${playerInfo.activeWeapon.weapon} ${playerInfo.activeWeapon.name}** during your zombie hunt!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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
          return message.channel.send(`${emojiList.zombie}${emojiList.shovel} **${message.author.username}**, you have upgraded your **${WeaponInCollection.weapon} ${WeaponInCollection.name}** to level ${WeaponInCollection.level}!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } catch (error) {
          console.error("Error saving playerInfo:", error);
          return message.channel.send(`❌ An error occurred while saving your data. Please try again.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (subCommand === "upgrade") {
        let numberOfTimesLevelUp = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
        let woodReq = playerInfo.level * 100 * numberOfTimesLevelUp;

        if (numberOfTimesLevelUp > 0 && playerInfo.resources.wood >= woodReq) {
          playerInfo.resources.wood -= 100 * numberOfTimesLevelUp;
          playerInfo.level += numberOfTimesLevelUp;

          let newWeapon = weaponsStats.find(weapon => weapon.unlockAt === playerInfo.level);
          let newWeaponMessage = "";

          if (!playerInfo.weapons.some(weapon => weapon.name === newWeapon.name)) {
            newWeaponMessage = `New weapon unlocked: ${newWeapon.weapon} **${newWeapon.name}**`
          }

          playerInfo.weapons.push({
            name: newWeapon.name,
            weapon: newWeapon.weapon,
            maxHunt: newWeapon.maxHunt,
            minHunt: newWeapon.minHunt,
            level: 1,
          })

          await playerInfo.save();
          return message.channel.send(`🏠 **${message.author.username}**, you have successfully upgraded your shelter to Level **${playerInfo.level}** using ${emojiList.wood} **${woodReq}** wood!\n${newWeaponMessage}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else if (numberOfTimesLevelUp === 0 || numberOfTimesLevelUp < 0) {
          return message.channel.send(`<:warning:1366050875243757699> What’s that? Please provide a valid number for upgrade!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else {
          return message.channel.send(`<:warning:1366050875243757699> **${message.author.username}**, you don’t have enough ${emojiList.wood} **${numberOfTimesLevelUp * 100} **wood in your apocalypse resources to upgrade your shelter.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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