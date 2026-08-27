import {
  getUserData,
  updateUser
} from "../../../database.js";
import fs from 'fs';
import path from 'path';

import Zombie from "../../../models/Zombie.js";

import { increaseTask } from "../economy/task.js";

// Load all dragon types from JSON
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
import { discordUser, handleMessage } from "../../../helper.js";
import { sendErrorLog } from "../../../utils/errorLogger.js";

import locations from "./zombie/locations.js";
import emojiList from "./zombie/emojiList.js";
import {
  handleLocItems
} from "./zombie/handleItems.js";
import { handleZombieHelp } from "./zombie/help.js";

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
    let Pages = Chapters[`chapter${chapter}`]?.pages;
    if (!Pages) {
      return handleMessage(message, `❗Chapter ${chapter} not found.`);
    }
    let title = Chapters[`chapter${chapter}`]?.title;
    const user = discordUser(message);

    let currentPage = 0;
    let totalPages = 4;

    const generateEmbed = (page) => {
      return new EmbedBuilder()
      .setTitle(title)
      .setDescription(Pages[page].replace("$_username_", user.username))
      .setAuthor({
        name: user.name || user.username,
        iconURL: user.avatar
      })
      .setColor("#173221")
      .setImage(getShelterImg(chapter))
      .setFooter({
        text: `PAGE: ${page + 1}`
      });
    }

    const embedMessage = await handleMessage(message, {
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

    const collector = embedMessage?.createMessageComponentCollector ? embedMessage.createMessageComponentCollector({
      filter,
      time: 60000,
      componentType: ComponentType.Button
    }) : null;

    if (!collector) return;

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

export async function zombieSurvival(id, playerInfo, context) {
  try {
    const { username } = discordUser(context);
    const channel = context.channel || context;
    const guildMember = context.guild?.members?.fetch ? await context.guild.members.fetch(id).catch(() => null) : null;
    let disableOptions = [];
    let gameData = {};

    playerInfo.lastBattle.time = new Date();
    playerInfo.lastBattle.active = true;

    await redisClient.set(`user:${id}:zombieBattle`, JSON.stringify(true), {
      EX: 120 // Cache for 2 min
    });

    // Initialize player data if missing
    if (!gameData.health) gameData.health = 100; // Default health: 100
    if (!gameData.stamina) gameData.stamina = 50; // Default stamina: 50
    if (!gameData.supplies) gameData.supplies = 0; // Default supplies: 0
    if (!gameData.zombiesKilled) gameData.zombiesKilled = 0; // Default zombies killed: 0
    if (!gameData.weaponDurability) gameData.weaponDurability = 100; // Default weapon durability: 100

    let targetLocation = null;
    if (playerInfo.currentLocation) {
      const chosenLoc = locations.find(loc => loc.id === playerInfo.currentLocation);
      if (chosenLoc && playerInfo.kill >= chosenLoc.killRequired) {
        targetLocation = chosenLoc;
      }
    }
    if (!targetLocation) {
      const unlockedLocs = locations.filter(loc => playerInfo.kill >= loc.killRequired);
      targetLocation = unlockedLocs[unlockedLocs.length - 1] || locations[0];
    }

    const locationBoss = targetLocation?.boss || null;
    let bossSpawned = false;
    let bossDefeatedInHunt = false;
    let bossHp = locationBoss ? locationBoss.hp : 0;
    const bossMaxHp = locationBoss ? locationBoss.hp : 0;

    let currentZombies = 2; // how many are actively attacking
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
        `## ${emojiList.zombie} ᤁᴏ꧑ხıɛ ᥉ᤙɾ᥎ı᥎ɑꝇ\n-# **${username.toUpperCase()}**, you find yourself surrounded in a zombie-infested world. Your goal: **SURVIVE**!\n\n` +
        `**𝗟𝗢𝗖𝗔𝗧𝗜𝗢𝗡**  ${targetLocation?.name}\n` +
        `**𝗧𝗘𝗥𝗥𝗜𝗧𝗢𝗥𝗬 𝗕𝗢𝗦𝗦**  ${locationBoss ? `${locationBoss.emoji} **${locationBoss.name}** (*${locationBoss.title}*)` : 'None'}\n` +
        `**𝗧𝗜𝗠𝗘**  2 minutes\n` +
        "> ◎ `𝘠𝘰𝘶 𝘤𝘢𝘯 𝘵𝘢𝘬𝘦 𝘢𝘤𝘵𝘪𝘰𝘯𝘴 𝘭𝘪𝘬𝘦 `**`ꜱᴇᴀʀᴄʜ`**`, `**`ꜰɪɢʜᴛ`**`, `**`ʜɪᴅᴇ`**`, `**`ᴄʀᴀꜰᴛ ᴡᴇᴀᴘᴏɴ`**`, 𝘰𝘳 `**`ꜱᴘᴇᴄɪᴀʟ ᴡᴇᴀᴘᴏɴ`**`. 𝘊𝘩𝘰𝘰𝘴𝘦 𝘸𝘪𝘴𝘦𝘭𝘺 𝘵𝘰 𝘮𝘢𝘯𝘢𝘨𝘦 𝘺𝘰𝘶𝘳 `**`ʜᴇᴀʟᴛʜ`**`, `**`ꜱᴛᴀᴍɪɴᴀ`**`, 𝘢𝘯𝘥 `**`ꜱᴜᴘᴘʟɪᴇꜱ`**.\n" +
        `${dealLocationItems?.message && dealLocationItems?.message !== "" ? dealLocationItems?.message : ""} ${targetLocation.bonousSupplies ? `\n-# **𝖡𝗈𝗇𝗎𝗌 𝖲𝗎𝗉𝗉𝗅𝗂𝖾𝗌** ${emojiList.supplies} ${targetLocation.bonousSupplies}` : ""}`
      )
      .setImage(targetLocation?.url)
      .setColor(targetLocation?.color || "#f77a24")
      .setFooter({
        text: "𝘔𝘢𝘬𝘦 𝘺𝘰𝘶𝘳 𝘤𝘩𝘰𝘪𝘤𝘦 𝘣𝘺 𝘤𝘭𝘪𝘤𝘬𝘪𝘯𝘨 𝘵𝘩𝘦 𝘣𝘶𝘵𝘵𝘰𝘯𝘴 𝘣𝘦𝘭𝘰𝘸."
      });

    // Action Buttons
    const actionRow = (disable = [], activeWeapon, isBossActive = false, bHp = 0, bMax = 0) => {
      const rows = [];
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("search")
          .setLabel("🔍 Search")
          .setDisabled(disable.some(id => id === "search"))
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("fight")
          .setLabel("Fight Horde")
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
          .setLabel("🔧 Craft")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("weapon")
          .setDisabled(disable.some(id => id === "weapon"))
          .setLabel(`${activeWeapon.weapon} ${activeWeapon.name}`)
          .setStyle(ButtonStyle.Secondary)
      );
      rows.push(row1);

      if (isBossActive && locationBoss && bHp > 0) {
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("strike_boss")
            .setLabel(`⚔️ Strike Boss (${locationBoss.emoji} ${bHp}/${bMax} HP)`)
            .setDisabled(disable.some(id => id === "strike_boss"))
            .setStyle(ButtonStyle.Danger)
        );
        rows.push(row2);
      }

      return rows;
    };

    const gameMessage = await handleMessage(context, {
      embeds: [introEmbed],
      components: actionRow(disableOptions, playerInfo.activeWeapon, bossSpawned && bossHp > 0, bossHp, bossMaxHp)
    });

    const zombiesEmbed = (logDetails, isFooter = false) => {
      const bossHeader = bossSpawned && bossHp > 0
        ? `👑 **LOCATION BOSS:** ${locationBoss?.emoji} **${locationBoss?.name}** (${bossHp}/${bossMaxHp} HP)\n`
        : (bossDefeatedInHunt ? `👑 **LOCATION BOSS:** 💥 **DEFEATED**\n` : '');

      const EmbedGen = new EmbedBuilder()
        .setTitle('𝙕𝙤𝙢𝙗𝙞𝙚𝙨 𝙒𝙖𝙫𝙚')
        .setDescription(
          `${bossHeader}` +
          `𝗭𝗢𝗠𝗕𝗜𝗘𝗦: **${gameData.ZombiesToKill}**\n` +
          `𝗔𝗧𝗧𝗔𝗖𝗞𝗜𝗡𝗚: ${currentZombies}\n` +
          `${logDetails && !isFooter ? logDetails : ""}`
        )
        .setThumbnail(targetLocation?.url);

      if (isFooter) {
        EmbedGen.setFooter({
          text: logDetails
        });
      }

      return EmbedGen;
    };

    const generateStatusEmbed = (embedColor) => {
      return new EmbedBuilder()
        .setDescription(
          `❤️ **Health:** ${gameData.health} ` +
          `⚡ **Stamina:** ${gameData.stamina}\n` +
          `${emojiList.tools} **Weapon Durability:** ${gameData.weaponDurability}\n` +
          `${emojiList.supplies} **Supplies:** ${gameData.supplies} ` +
          `${emojiList.zombie} **Zombies Killed:** ${gameData.zombiesKilled}`
        )
        .setColor(embedColor ? embedColor : "#d32b2b");
    };

    let zombiesEmbedShow = zombiesEmbed();

    // Spawn wave every 20s
    const spawnTimer = setInterval(async () => {
      const remaining = gameData.ZombiesToKill - totalZombiesSpawned;
      if (remaining <= 0 && (!locationBoss || bossSpawned || bossDefeatedInHunt)) {
        clearInterval(spawnTimer);
        return;
      }

      // Boss trigger condition
      if (locationBoss && !bossSpawned && !bossDefeatedInHunt && (totalZombiesSpawned >= Math.floor(gameData.ZombiesToKill * 0.4) || gameData.zombiesKilled >= 2)) {
        bossSpawned = true;
      }

      const newZombies = Math.min(
        remaining > 0 ? remaining : 0,
        Math.floor(Math.random() * Math.min((playerInfo.activeWeapon.minHunt + Math.floor(Math.random() * playerInfo.activeWeapon.maxHunt)), playerInfo.activeWeapon.maxHunt)) + 1
      );
      currentZombies += newZombies;
      totalZombiesSpawned += newZombies;

      const bossAlert = bossSpawned && bossHp > 0
        ? `\n🚨 **TERRITORY FINAL BOSS HAS ARRIVED: ${locationBoss.emoji} ${locationBoss.name.toUpperCase()}** (*${bossHp}/${bossMaxHp} HP*)!`
        : ``;

      zombiesEmbedShow = zombiesEmbed(
        `${newZombies > 0 ? `💀 **${newZombies}** more zombies have appeared!` : ``}${bossAlert}`
      );

      const currentEmbeds = gameMessage?.embeds?.map(e => EmbedBuilder.from(e));
      const updatedEmbeds = currentEmbeds?.map(embed =>
        embed.data.title === "𝙕𝙤𝙢𝙗𝙞𝙚𝙨 𝙒𝙖𝙫𝙚" ? zombiesEmbedShow : embed
      );

      if (gameData.weaponDurability > 0) {
        if (disableOptions.some(id => id === "fight")) {
          disableOptions = disableOptions.filter(id => id !== "fight");
        }
      }

      await gameMessage?.edit({
        embeds: updatedEmbeds,
        components: actionRow(disableOptions, playerInfo.activeWeapon, bossSpawned && bossHp > 0, bossHp, bossMaxHp)
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }, 20_000);

    // Collect Button Clicks
    const filter = (interaction) => interaction.user.id === id;
    const collector = gameMessage?.createMessageComponentCollector ? gameMessage.createMessageComponentCollector({
      filter,
      time: 120000 // 2 - minute timeout
    }) : null;

    if (!collector) return;

    const damageTimer = setInterval(async () => {
      if (currentZombies > 0 || (bossSpawned && bossHp > 0)) {
        let dmg = currentZombies * 4;
        let bossDmgNote = "";
        if (bossSpawned && bossHp > 0 && locationBoss) {
          const bossPassiveDmg = Math.floor(locationBoss.attack * 0.35);
          dmg += bossPassiveDmg;
          bossDmgNote = ` + ${locationBoss.emoji} **${locationBoss.name}** dealt ${bossPassiveDmg}`;
        }
        gameData.health -= dmg;

        zombiesEmbedShow = zombiesEmbed(
          `⚠️ ${currentZombies} zombie${currentZombies > 1 ? "s" : ""}${bossDmgNote} attacked you for ${dmg} total damage!`, true
        );

        const currentEmbeds = gameMessage?.embeds?.map(e => EmbedBuilder.from(e));
        const updatedEmbeds = currentEmbeds?.map(embed =>
          embed.data.title === "𝙕𝙤𝙢𝙗𝙞𝙚s 𝙒𝙖𝙫𝙚" || embed.data.title === "𝙕𝙤𝙢𝙗𝙞𝙚𝙨 𝙒𝙖𝙫𝙚" ? zombiesEmbedShow : embed
        );

        updatedEmbeds.pop();
        updatedEmbeds.push(generateStatusEmbed());

        if (gameData.health <= 0) {
          collector.stop();
        }

        await gameMessage?.edit({
          embeds: updatedEmbeds
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    }, 10_000);

    collector.on("collect", async (interaction) => {
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
        };

        let zombieThumb = null;

        // Check if boss should spawn on action
        if (locationBoss && !bossSpawned && !bossDefeatedInHunt && (gameData.zombiesKilled >= 2 || totalZombiesSpawned >= Math.floor(gameData.ZombiesToKill * 0.4))) {
          bossSpawned = true;
        }

        // Handle Player Actions
        if (choice === "search") {
          const supplies = Math.floor(Math.random() * 100) + 20;
          gameData.supplies += supplies;
          gameData.stamina -= 10;

          let dealLocationItemsSearch = handleLocItems(gameData, targetLocation, currentZombies);
          gameData = (dealLocationItemsSearch?.gameData || gameData);
          currentZombies = (dealLocationItemsSearch?.currentZombies || currentZombies);

          outcome = `🔍 **${username}** scavenged the area and found **${supplies} supplies**!\n- Stamina reduced by 10.${dealLocationItemsSearch?.message ? dealLocationItemsSearch.message : ""}`;
          embedColor = "Blue";
          image = "https://harshtiwari47.github.io/kasiko-public/images/zmb6.jpg";
          lilyHelp = "Use ***search*** to gather supplies to craft your weapon 🛠, but lose stamina! ⚡";
        } else if (choice === "fight") {
          image = "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg";
          gameData.zombiesKilled += 1;
          gameData.weaponDurability -= Math.floor(Math.random() * 20) + 10;
          currentZombies = Math.max(0, currentZombies - 1);

          zombieThumb = `https://cdn.discordapp.com/emojis/${zombies[Math.floor(1 + Math.random() * 5)]}.png`;

          outcome = `${emojiList.fist} **${username}** 𝘣𝘳𝘢𝘷𝘦𝘭𝘺 𝘧𝘰𝘶𝘨𝘩𝘵 𝘢 𝘻𝘰𝘮𝘣𝘪𝘦!\n- :boom: 𝗞𝗜𝗟𝗟𝗘𝗗 **1**`;
          embedColor = "Red";
          lilyHelp = "Use ***fight*** to battle zombies, but it risks your HP and weapon durability! 🪤";
          await increaseTask(interaction.user.id, "kill").catch(() => {});
          zombiesEmbedShow = zombiesEmbed();
        } else if (choice === "strike_boss") {
          if (bossSpawned && bossHp > 0 && locationBoss) {
            const baseDmg = Math.floor(Math.random() * (playerInfo.activeWeapon.maxHunt * 4)) + (playerInfo.activeWeapon.minHunt * 2) + 22;
            bossHp = Math.max(0, bossHp - baseDmg);
            gameData.weaponDurability -= Math.floor(Math.random() * 15) + 10;
            image = locationBoss.image || "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg";

            let bossRetaliation = "";
            if (bossHp > 0) {
              const skill = locationBoss.skills[Math.floor(Math.random() * locationBoss.skills.length)];
              const bossDmg = Math.floor(locationBoss.attack * (0.75 + Math.random() * 0.4));
              gameData.health -= bossDmg;
              bossRetaliation = `\n💀 **${locationBoss.name}** counter-attacked with **${skill}** for **${bossDmg} damage**!`;
              outcome = `⚔️ **${username}** unleashed ${playerInfo.activeWeapon.weapon} on **${locationBoss.emoji} ${locationBoss.name}** for **${baseDmg} damage**! (Remaining: **${bossHp}/${bossMaxHp} HP**)${bossRetaliation}`;
              embedColor = "DarkRed";
            } else {
              bossDefeatedInHunt = true;
              bossSpawned = false;
              outcome = `🎉 **TERRITORY BOSS DEFEATED!**\nYou crushed **${locationBoss.emoji} ${locationBoss.name}** (*${locationBoss.title}*)!\n` +
                `🏆 **Spoils:** **+${locationBoss.reward.kills} Kills**, <:kasiko_coin:1300141236841086977> **${locationBoss.reward.cash.toLocaleString()}**, ${emojiList.metal || '🔩'} **${locationBoss.reward.metal} Metal**, ${emojiList.wood || '🪵'} **${locationBoss.reward.wood} Wood**!`;
              embedColor = "Gold";
            }
            lilyHelp = "Target the Boss weakpoints to secure massive territory victory rewards! 💥";
            zombiesEmbedShow = zombiesEmbed();
          }
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

          outcome = `${emojiList.shovel} **${username}** used their weapon ${playerInfo.activeWeapon.weapon} and killed ${killedZombies} zombie${killedZombies === 1 ? '' : 's'}!\n`;
          disableOptions.push("weapon");
          embedColor = "#822fea";
          zombieThumb = `https://cdn.discordapp.com/emojis/${zombies[Math.floor(1 + Math.random() * 5)]}.png`;
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
          disableOptions.push("strike_boss");
        } else {
          if (disableOptions.some(id => id === "fight")) {
            disableOptions = disableOptions.filter(id => id !== "fight");
          }
          if (disableOptions.some(id => id === "strike_boss")) {
            disableOptions = disableOptions.filter(id => id !== "strike_boss");
          }
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
          .setDescription(`### ${statusTitle}\n-# <:lily:1318792945343791214> ${lilyHelp}`);

        const statusDesEmbed = new EmbedBuilder()
          .setDescription(`${outcome}`);

        const statusEmbed = generateStatusEmbed(embedColor);

        if (image) {
          statusTitleEmbed.setThumbnail(image);
        } else {
          statusTitleEmbed.setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/zmb2.png");
        }

        if (zombieThumb) {
          statusDesEmbed.setThumbnail(zombieThumb);
        }

        await interaction.update({
          embeds: [statusTitleEmbed, statusDesEmbed, zombiesEmbedShow, statusEmbed],
          components: actionRow(disableOptions, playerInfo.activeWeapon, bossSpawned && bossHp > 0, bossHp, bossMaxHp)
        });
      } catch (err) {
        console.log(err);
      }
    });

    collector.on("end", async () => {
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
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash.toLocaleString()}**\n` +
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
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash.toLocaleString()}**\n` +
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
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash.toLocaleString()}**\n` +
            `- - ${emojiList.wood} Wood: **${wood}**\n` +
            `- - ${emojiList.carrot} Food: **${food}**\n` +
            `- - ${emojiList.metal} Metal: **${metal}**`;

          playerInfo.resources.wood += wood;
          playerInfo.resources.food += food;
          playerInfo.resources.metal += metal;
          userData.cash += cash;
        } else if (gameData.zombiesKilled > 2) {
          let wood = 10 + Math.floor(Math.random() * 10);
          let food = 1 + Math.floor(Math.random() * 20);
          let cash = zombiesKilledReward;

          rewardMessage =
            `- - <:kasiko_coin:1300141236841086977> Cash: **${cash.toLocaleString()}**\n` +
            `- - ${emojiList.wood} Wood: **${wood}**\n` +
            `- - ${emojiList.carrot} Food: **${food}**`;

          playerInfo.resources.wood += wood;
          playerInfo.resources.food += food;
          userData.cash += cash;
        }

        // Boss rewards payout if slayed
        if (bossDefeatedInHunt && locationBoss) {
          gameData.zombiesKilled += locationBoss.reward.kills;
          playerInfo.resources.metal += locationBoss.reward.metal;
          playerInfo.resources.wood += locationBoss.reward.wood;
          playerInfo.resources.medkit += locationBoss.reward.medkit || 0;
          userData.cash += locationBoss.reward.cash;

          if (!playerInfo.bossesDefeated) playerInfo.bossesDefeated = [];
          if (!playerInfo.bossesDefeated.includes(locationBoss.name)) {
            playerInfo.bossesDefeated.push(locationBoss.name);
          }

          rewardMessage += `\n- - 👑 **Boss Slayed:** ${locationBoss.emoji} **${locationBoss.name}** (+${locationBoss.reward.kills} Kills, <:kasiko_coin:1300141236841086977> ${locationBoss.reward.cash.toLocaleString()})`;
        }

        playerInfo.health -= 100 - gameData.health;
        playerInfo.kill += gameData.zombiesKilled;
        playerInfo.lastBattle.active = false;

        await playerInfo.save();

        userData.cash += (gameData?.supplies || 0) * 10;
        if (gameData.zombiesKilled >= gameData.ZombiesToKill) userData.cash += 10000;

        await updateUser(id, userData);

        await handleMessage(context, {
          content: "## ```𝑨 𝒗𝒊𝒄𝒊𝒐𝒖𝒔 𝒉𝒐𝒓𝒅𝒆 𝒐𝒇 𝒛𝒐𝒎𝒃𝒊𝒆𝒔 𝒉𝒂𝒔 𝒂𝒕𝒕𝒂𝒄𝒌𝒆𝒅!```\n" + `<:zombie3:1318799748139974689> \`𝚄𝚗𝚏𝚘𝚛𝚝𝚞𝚗𝚊𝚝𝚎𝚕𝚢, \`**\`${username}\`** \`𝚌𝚘𝚞𝚕𝚍𝚗'𝚝 𝚎𝚜𝚌𝚊𝚙𝚎 𝚒𝚗 𝚝𝚒𝚖𝚎.\` ${emojiList.scratch}\n## ${emojiList.reward} **Rewards Earned:**\n${rewardMessage}`,
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `## <:lily:1318792945343791214> 𝒁𝒐𝒎𝒃𝒊𝒆 𝑨𝒑𝒐𝒄𝒂𝒍𝒚𝒑𝒔𝒆 𝑺𝒕𝒓𝒊𝒌𝒆𝒔!\n` +
                `- 🗺️ **Territory:** **${targetLocation?.name}**\n` +
                `- ${emojiList.zombie} 𝗧𝗼𝘁𝗮𝗹 𝗭𝗼𝗺𝒃𝒊𝒆𝘀 𝗞𝗶𝗹𝗹𝗲𝗱: **${gameData.zombiesKilled}**\n` +
                `- ${emojiList.supplies} 𝗦𝘂𝗽𝗽𝗹𝗶𝗲𝘀 𝗚𝗮𝘁𝗵𝗲𝗿𝗲𝗱: **${gameData.supplies}**\n` +
                `𝘚𝘶𝘱𝘱𝘭𝘪𝘦𝘴 𝘣𝘰𝘯𝘶𝘴 ~ <:kasiko_coin:1300141236841086977> **${(gameData.supplies * 10).toLocaleString()}**\n` +
                `${gameData.zombiesKilled >= gameData.ZombiesToKill ? `𝘊𝘰𝘮𝘱𝘭𝘦𝘵𝘪𝘰𝘯 𝘉𝘰𝘯𝘶𝘴 ~ <:kasiko_coin:1300141236841086977> **10,000**\n` : ``}` +
                `${bossDefeatedInHunt ? `👑 **Territory Final Boss:** 💥 **${locationBoss?.name} SLAYED!**` : ``}`
              )
              .setColor(bossDefeatedInHunt ? "#e67e22" : "DarkGrey")
          ]
        });
      } catch (err) {}
    });
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return handleMessage(context, `⚠ Something went wrong during the zombie survival! Please try again.\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function viewUserLocationCollection(playerInfo, message) {
  try {
    const totalPages = locations.length;
    let currentPage = 0;
    const currentLocIdx = locations.findIndex(loc => loc.id === (playerInfo.currentLocation || "l1"));
    if (currentLocIdx !== -1) currentPage = currentLocIdx;

    const user = discordUser(message);
    const targetUserId = message.author ? message.author.id : message.user?.id;

    const generateEmbed = (page) => {
      const loc = locations[page];
      const unlocked = playerInfo.kill >= loc.killRequired;
      const isActive = (playerInfo.currentLocation || "l1") === loc.id;

      const embed = new EmbedBuilder()
        .setTitle(`🗺️ ${loc.name.toUpperCase()} ${isActive ? '⭐ [ACTIVE CAMP]' : (unlocked ? '🟢 [UNLOCKED]' : '🔒 [LOCKED]')}`)
        .setDescription(
          `*${loc.description}*\n\n` +
          `### 📊 **TERRITORY INTEL**\n` +
          `• **Status:** ${unlocked ? '🟢 **Unlocked**' : `🔒 **Locked** (Requires **${loc.killRequired.toLocaleString()} Kills** · Progress: **${playerInfo.kill.toLocaleString()}/${loc.killRequired.toLocaleString()}**)`}\n` +
          `• **Bonus Supplies:** ${emojiList.supplies || '🎒'} **+${loc.bonousSupplies}**\n` +
          `• **Wasteland Drops:** ${loc.items?.length ? loc.items.map(item => `${item.icon} **${item.name}**`).join(", ") : "Standard scrap"}\n\n` +
          `### 👑 **TERRITORY FINAL BOSS**\n` +
          `• **Boss:** ${loc.boss?.emoji} **${loc.boss?.name}** (*${loc.boss?.title}*)\n` +
          `• **Vitals:** ❤️ **${loc.boss?.hp} HP** · ⚔️ **${loc.boss?.attack} ATK**\n` +
          `• **Signature Skills:** *${loc.boss?.skills?.join(', ')}*\n` +
          `• **Victory Spoils:** **+${loc.boss?.reward?.kills} Kills**, <:kasiko_coin:1300141236841086977> **${loc.boss?.reward?.cash?.toLocaleString()}**, ${emojiList.metal || '🔩'} **${loc.boss?.reward?.metal} Metal**, ${emojiList.wood || '🪵'} **${loc.boss?.reward?.wood} Wood**`
        )
        .setColor(loc.color || "#2b1d1d")
        .setImage(loc.url)
        .setFooter({
          text: `Page ${page + 1}/${totalPages} · Use buttons or dropdown to travel · kas zombie travel <name>`
        });

      return embed;
    };

    const getComponents = (page) => {
      const loc = locations[page];
      const unlocked = playerInfo.kill >= loc.killRequired;
      const isActive = (playerInfo.currentLocation || "l1") === loc.id;

      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("zombie_loc_select")
          .setPlaceholder("🗺️ Select a Wasteland Territory...")
          .addOptions(
            locations.map((l, idx) => {
              const isLocUnlocked = playerInfo.kill >= l.killRequired;
              const isLocActive = (playerInfo.currentLocation || "l1") === l.id;
              return new StringSelectMenuOptionBuilder()
                .setLabel(`${l.name}${isLocActive ? ' (Active)' : ''}`)
                .setDescription(`${isLocUnlocked ? 'Unlocked' : `Requires ${l.killRequired.toLocaleString()} Kills`} · Boss: ${l.boss?.name}`)
                .setValue(String(idx))
                .setEmoji(isLocActive ? "⭐" : (isLocUnlocked ? "🟢" : "🔒"))
                .setDefault(idx === page);
            })
          )
      );

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_loc")
          .setLabel("◀ Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("travel_loc")
          .setLabel(isActive ? "⭐ Current Camp" : "🚀 Travel Here")
          .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(!unlocked || isActive),
        new ButtonBuilder()
          .setCustomId("next_loc")
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      );

      return [selectMenu, buttons];
    };

    const reply = await handleMessage(message, {
      embeds: [generateEmbed(currentPage)],
      components: getComponents(currentPage)
    });

    const collector = reply?.createMessageComponentCollector
      ? reply.createMessageComponentCollector({
          time: 120000
        })
      : null;

    if (!collector) return;

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== targetUserId) {
        return interaction.reply({
          content: "❌ These territory controls are only for the command author.",
          ephemeral: true
        });
      }

      if (interaction.isStringSelectMenu() && interaction.customId === "zombie_loc_select") {
        currentPage = parseInt(interaction.values[0], 10) || 0;
      } else if (interaction.isButton()) {
        if (interaction.customId === "prev_loc") {
          currentPage = Math.max(0, currentPage - 1);
        } else if (interaction.customId === "next_loc") {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        } else if (interaction.customId === "travel_loc") {
          const locToTravel = locations[currentPage];
          if (playerInfo.kill >= locToTravel.killRequired) {
            playerInfo.currentLocation = locToTravel.id;
            await playerInfo.save();
            await interaction.reply({
              content: `🚀 **${user.username}**, you have established your active hunting camp at **${locToTravel.name}**! Future hunts will take place here.`,
              ephemeral: true
            }).catch(() => {});
          }
        }
      }

      await interaction.update({
        embeds: [generateEmbed(currentPage)],
        components: getComponents(currentPage)
      }).catch(() => {});
    });

    collector.on("end", async () => {
      try {
        if (reply && typeof reply.edit === 'function') {
          await reply.edit({ components: [] }).catch(() => {});
        }
      } catch (_) {}
    });

  } catch (e) {
    console.error(e);
    return handleMessage(message, '<:warning:1366050875243757699> Something went wrong while fetching locations.');
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

    const reply = await handleMessage(message, {
      embeds: [generateEmbed()],
      components: [row],
    });

    const filter = (interaction) => interaction.isButton() && interaction.user.id === message.author.id;
    const collector = reply?.createMessageComponentCollector ? reply.createMessageComponentCollector({
      filter, time: 30000,
    }) : null;

    if (!collector) return;

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
  cooldown: 10000,
  emoji: "<:zombie:1366632304054632528>",
  example: ["zombie",
    "z",
    "zombie help"],
  category: "🍬 Explore",

  execute: async (args, message) => {
    try {
      const { id: userId, username, name, avatar } = discordUser(message);
      if (!message.author) {
        message.author = message.user || { id: userId, username, displayAvatarURL: () => avatar || '' };
      }
      if (!message.author.displayAvatarURL && message.user?.displayAvatarURL) {
        message.author.displayAvatarURL = (opt) => message.user.displayAvatarURL(opt);
      }

      let subCommand = args.length ? args[1] : null;

      let playerInfo = await Zombie.findOne({
        id: userId
      });

      if (!playerInfo) {
        playerInfo = new Zombie({
          id: userId
        });
      }

      if (subCommand === "hunt" || subCommand === "h") {

        const cachedBattle = await redisClient.get(`user:${userId}:zombieBattle`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

        if (cachedBattle) {
          return handleMessage(message, `${emojiList.zombie} Please wait. **2 minutes** haven't passed yet.`);
        }

        if (playerInfo.health <= 100) {
          return handleMessage(message, 
            `${emojiList.eva} **${username}**, 𝘺𝘰𝘶𝘳 𝘩𝘦𝘢𝘭𝘵𝘩 𝘪𝘴 𝘤𝘳𝘪𝘵𝘪𝘤𝘢𝘭𝘭𝘺 𝘭𝘰𝘸, 𝘴𝘶𝘳𝘷𝘪𝘷𝘰𝘳! ${emojiList.scratch} \n` +
            "-# ```Y𝘰𝘶 𝘯𝘦𝘦𝘥 𝘮𝘰𝘳𝘦 𝘵𝘩𝘢𝘯 100 𝘏𝘗 𝘵𝘰 𝘣𝘦 𝘣𝘢𝘵𝘵𝘭𝘦-𝘳𝘦𝘢𝘥𝘺.```\n" +
            `${emojiList.syringe} 𝖨𝗇𝗌𝗍𝖺𝗇𝗍𝗅𝗒 𝗁𝖾𝖺𝗅 **+100 HP** using a _*med syringe*_ for <:kasiko_coin:1300141236841086977> **3000 cash** by using ***\`kas z heal\`***.`
          );
        }

        return zombieSurvival(userId, playerInfo, message);
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
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, please provide the weapon name from your collection that you want to use currently!\nExample: \`zombie active glove\``);
        }

        if (!playerInfo.weapons.some(weapon => weapon.name.toLowerCase() === weaponName)) {
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, no such weapon found in your apocalypse inventory!`);
        }

        let weaponData = playerInfo.weapons.find(weapon => weapon.name.toLowerCase() === weaponName);

        if (weaponData) {
          playerInfo.activeWeapon = weaponData;
        }

        await playerInfo.save();

        return handleMessage(message, `${emojiList.shovel} **${username}**, from now on you are using **${playerInfo.activeWeapon.weapon} ${playerInfo.activeWeapon.name}** during your zombie hunt!`);
      }

      if (subCommand === "modify") {
        let weaponName = args[2] ? args[2].toLowerCase(): null;

        if (!weaponName) {
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, please provide the weapon name from your collection that you want to use currently!\nExample: \`zombie modify glove\``);
        }

        // Find the weapon in the player's collection
        let WeaponIndex = playerInfo.weapons.findIndex(weapon => weapon.name.toLowerCase() === weaponName);

        if (WeaponIndex === -1) {
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, no such weapon found in your apocalypse inventory!`);
        }

        let WeaponInCollection = playerInfo.weapons[WeaponIndex];

        // Check if the player has enough resources
        let WeaponDetails = weaponsStats.find(weapon => weapon.name.toLowerCase() === weaponName);
        if (WeaponDetails.cost && playerInfo.resources.metal < WeaponDetails.cost) {
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, you don't have enough ${emojiList.metal} Metal to level up **${weaponName}**!\nRequired: ${emojiList.metal} ${WeaponDetails.cost}`);
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
          return handleMessage(message, `${emojiList.zombie} ✶ ${emojiList.shovel} **${username}**, you have upgraded your **${WeaponInCollection.weapon} ${WeaponInCollection.name}** to level ${WeaponInCollection.level}!`);
        } catch (error) {
          console.error("Error saving playerInfo:", error);
          return handleMessage(message, `❌ An error occurred while saving your data. Please try again.`);
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
          return handleMessage(message, `${emojiList.shelter} **${username}**, you have successfully upgraded your shelter to Level **${playerInfo.level}** using ${emojiList.wood} **${woodReq}** wood!\n${newWeaponMessage}`);
        } else if (numberOfTimesLevelUp === 0 || numberOfTimesLevelUp < 0) {
          return handleMessage(message, `<:warning:1366050875243757699> What’s that? Please provide a valid number for upgrade!`);
        } else {
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, you don’t have enough ${emojiList.wood} **${woodReq} **wood in your apocalypse resources to upgrade your shelter.`);
        }
      }

      if (subCommand === "cure") {
        let numberOfMed = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
        if (numberOfMed > 0 && playerInfo.resources.medkit >= numberOfMed) {
          playerInfo.resources.medkit -= numberOfMed;
          playerInfo.health += 50 * numberOfMed;
          await playerInfo.save();
          return handleMessage(message, `${emojiList.medkit} **${username}**, you have successfully used **${numberOfMed}** and gained ${numberOfMed * 50} HP for your apocalypse hunt!`);
        } else if (numberOfMed === 0 || numberOfMed < 0) {
          return handleMessage(message, `<:warning:1366050875243757699> What’s that? Please provide a valid number for medkit/cure!`);
        } else {
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, you don't have enough medkit in your apocalypse resources to cure!`);
        }
      }

      if (subCommand === "eat") {
        let numberOfFood = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
        if (numberOfFood > 0 && playerInfo.resources.food >= numberOfFood) {
          playerInfo.resources.food -= numberOfFood;
          playerInfo.health += 10 * numberOfFood;
          await playerInfo.save();
          return handleMessage(message, `${emojiList.medkit}${emojiList.carrot}**${username}**, you have successfully eaten your food and gained ${numberOfFood * 10} HP for your apocalypse hunt!`);
        } else if (numberOfFood === 0 || numberOfFood < 0) {
          return handleMessage(message, `<:warning:1366050875243757699> What’s that? Please provide a valid number for food!`);
        } else {
          return handleMessage(message, `<:warning:1366050875243757699> **${username}**, you don't have enough food in your apocalypse resources to eat!`);
        }
      }

      if (subCommand === "story") {
        let chapter = args[2] ? parseInt(Number(args[2])): 1;
        if (chapter < 1) chapter = 1;
        if (chapter > 15) return handleMessage(message, `❗Only 15 chapters are available.`);
        return readStory(chapter, message);
      }

      if (subCommand === "heal") {
        try {
          let userData = await getUserData(userId);

          if (userData.cash <= 3000) {
            return handleMessage(message, `<:warning:1366050875243757699> **${username}**, you don't have <:kasiko_coin:1300141236841086977> 3000 cash!`);
          }

          userData.cash -= 3000;
          playerInfo.health += 100;

          await playerInfo.save();
          await updateUser(userId, userData);

          return handleMessage(message, 
            `${emojiList.medkit} **${username}**, survivor, you have been healed and gained **+100 HP**! Stay strong and keep moving forward!`
          );
        } catch (err) {
          sendErrorLog(err, { source: 'Zombie Heal Subcommand', user: message.author || message.user, guild: message.guild, channel: message.channel }).catch(() => {});
          return handleMessage(message, `⚠ **${username}**, something went wrong during healing!\n-# **Error**: ${err.message}`);
        }
      }

      if (subCommand === "help") {
        return await handleZombieHelp(message);
      }

      return handleMessage(message, {
        embeds: createZombieEmbed(playerInfo)
      });

    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
      sendErrorLog(e, {
        source: 'Zombie Exploration Command',
        commandName: 'zombie',
        user: message.author || message.user,
        guild: message.guild,
        channel: message.channel,
        interaction: message.isCommand ? message : null
      }).catch(() => {});
      return handleMessage(message, `⚠ Something went wrong while your Zombie adventure! 🧟\n-# **Error**: ${e.message}`);
    }
  }
};