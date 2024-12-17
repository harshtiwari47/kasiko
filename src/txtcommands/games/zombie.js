import {
  getUserData,
  updateUser
} from "../../../database.js";

import Zombie from "../../../models/Zombie.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

import redisClient from "../../../redis.js";

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

function createZombieEmbed(gameData) {
  const TitleEmbed = new EmbedBuilder()
  .setDescription(`### <@${gameData.id}>'s Apocalypse Stats`)
  .setColor("#301414")
  .setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/zmb2.png");

  const zombieStatsEmbed = new EmbedBuilder()
  .setColor('#141c30') // Background color
  .setDescription(
    `**❤️ Health:** ${gameData.health} HP\n` +
    `**🏚️ Level:** Level ${gameData.level}\n` +
    `**🧟 Kills:** ${gameData.kill} kills\n` +
    `**🪓 Active Weapon:**\n` +
    `-# ${gameData.activeWeapon.weapon} ${gameData.activeWeapon.name} (Lvl: **${gameData.activeWeapon.level}**)\n` +
    `**⚔️ Last Battle:** ${
    gameData.lastBattle.time
    ? `${new Date(gameData.lastBattle.time).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })}`: 'No active battle'
    }`
  )
  .setFooter({
    text: 'Zombie Battle Stats'
  });

  const zombieResourcesEmbed = new EmbedBuilder()
  .setColor('#1a371b')
  .setTitle(`Resources`)
  .setDescription(
    `**🪵 Wood:** ${gameData.resources.wood} units\n` +
    `**⚙️ Metal:** ${gameData.resources.metal} units\n` +
    `**💊 Medkits:** ${gameData.resources.medkit} units\n` +
    `**🥕 Food:** ${gameData.resources.food} units\n` +
    `-# \`kas help zombie\``
  )
  .setFooter({
    text: 'Zombie Resources Information'
  });

  return [TitleEmbed,
    zombieStatsEmbed,
    zombieResourcesEmbed];
}

export async function zombieSurvival(id, playerInfo, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let disableOptions = [];
    const gameData = {}

    playerInfo.lastBattle.time = new Date();
    playerInfo.lastBattle.active = true;

    await redisClient.set(`user:${id}:zombieBattle`, JSON.stringify(true), {
      EX: 120, // Cache for 2 min
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
      `## 🧟 ᤁᴏ꧑ხıɛ ᥉ᤙɾ᥎ı᥎ɑꝇ\n**${guild.user.username}**, you find yourself surrounded in a zombie-infested world. Your goal: **SURVIVE**!\n\n` +
      "You can take actions like **Search**, **Fight**, **Hide**, **Craft Weapon**, or **Run**. Choose wisely to manage your **Health**, **Stamina**, and **Supplies**.\n" +
      "Good luck!"
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
        .setLabel("⚔️ Fight")
        .setDisabled(disable.some(id => id === "fight"))
        .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
        .setCustomId("hide")
        .setDisabled(disable.some(id => id === "hide"))
        .setLabel("🛡️ Hide")
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
      const choice = interaction.customId;
      let outcome = "";
      let embedColor = "DarkRed";
      let image = null;
      let statusTitle = "🧟 Zombie Survival Update";

      // Handle Player Actions
      if (choice === "search") {
        const supplies = Math.floor(Math.random() * 100) + 20;
        gameData.supplies += supplies;
        gameData.stamina -= 10;
        outcome = `🔍 **${guild.user.username}** scavenged the area and found **${supplies} supplies**!\n- Stamina reduced by 10.`;
        embedColor = "Green";
      } else if (choice === "fight") {
        const damage = Math.floor(Math.random() * 30) + 20;
        const zombieDamage = Math.floor(Math.random() * 15) + 10;
        image = "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg";
        gameData.zombiesKilled += 1;
        gameData.weaponDurability -= Math.floor(Math.random() * 20) + 10;
        gameData.health -= zombieDamage;

        outcome = `⚔️ **${guild.user.username}** bravely fought a zombie!\n` +
        `- Damage dealt: **${damage}**\n- Health lost: **${zombieDamage}**\n- Weapon durability reduced by 10.`;
        embedColor = "Orange";
      } else if (choice === "hide") {
        const success = Math.random() < 0.7;
        if (success) {
          outcome = `🛡️ You successfully hid from the zombies and regained **10 stamina**.`;
          gameData.stamina += 10;
        } else {
          gameData.health -= 15;
          outcome = `🧟 A zombie spotted you while hiding! You lost **15 health**.`;
        }
        embedColor = "Yellow";
      } else if (choice === "craft") {
        if (gameData.supplies >= 50) {
          gameData.supplies -= 50;
          gameData.weaponDurability += 30;
          outcome = `🔧 You crafted and repaired your weapon! **Durability +30** (Cost: 50 supplies).`;
          embedColor = "Blue";
        } else {
          outcome = `❌ Not enough supplies to craft! You need at least **50 supplies**.`;
          embedColor = "Red";
        }
      } else if (choice === "weapon") {
        image = "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg";
        let killedZombies = Math.min((playerInfo.activeWeapon.minHunt + Math.floor(Math.random() * playerInfo.activeWeapon.maxHunt)), playerInfo.activeWeapon.maxHunt);
        gameData.zombiesKilled += killedZombies;

        outcome = `⚔️ **${guild.user.username}** used their weapon ${playerInfo.activeWeapon.weapon} and killed ${killedZombies} zombie${killedZombies === 1 ? '': 's'}!\n`;

        disableOptions.push("weapon");
        embedColor = "#2f3fea";
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
        return interaction.update({
          embeds: [
            new EmbedBuilder()
            .setTitle("☠️ You Died")
            .setDescription(
              `**${guild.user.username}** succumbed to the zombie horde...\n` +
              `- Total Zombies Killed: **${gameData.zombiesKilled}**\n` +
              `- Supplies Gathered: **${gameData.supplies}**`
            )
            .setColor("DarkGrey")
          ],
          components: []
        });
      }

      const statusTitleEmbed = new EmbedBuilder()
      .setDescription(`## ${statusTitle}`)

      // Update Game Status
      const statusEmbed = new EmbedBuilder()
      .setDescription(`${outcome}\n\n` +
        `❤️ **Health:** ${gameData.health}\n` +
        `⚡ **Stamina:** ${gameData.stamina}\n` +
        `🛠️ **Weapon Durability:** ${gameData.weaponDurability}\n` +
        `📦 **Supplies:** ${gameData.supplies}\n` +
        `🧟 **Zombies Killed:** ${gameData.zombiesKilled}`)
      .setColor(embedColor);
      if (image) {
        statusTitleEmbed.setThumbnail(image)
      } else {
        statusTitleEmbed.setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/zmb2.png")
      }

      await interaction.update({
        embeds: [statusTitleEmbed, statusEmbed],
        components: [actionRow(disableOptions, playerInfo.activeWeapon)]
      });
    });

    collector.on("end",
      async () => {
        await gameMessage.edit({
          components: []
        });

        let rewardMessage = "";

        let reward = Math.random();

        if (reward > 0.9 && gameData.zombiesKilled > 7) {
          let cash = 1000 + Math.floor(Math.random() * 5000);
          let wood = 20 + Math.floor(Math.random() * 30);
          let medkit = 1 + Math.floor(Math.random() * 2);
          let metal = 10 + Math.floor(Math.random() * 30);

          rewardMessage = `**${guild.user.username}**, here are your rewards:\n` +
          `- <:kasiko_coin:1300141236841086977> Cash: ${cash}\n` +
          `- 🪵 Wood: **${wood}**\n` +
          `- 💊 Medkit: **${medkit}**\n` +
          `- ⚙️ Metal: **${metal}**`;

          playerInfo.resources.wood += wood;
          playerInfo.resources.medkit += medkit;
          playerInfo.resources.metal += metal;

          let userData = await getUserData(id);
          userData.cash += cash;
          await updateUser(id, userData);

        } else if (reward > 0.75 && gameData.zombiesKilled > 4) {
          let wood = 20 + Math.floor(Math.random() * 25);
          let medkit = 1 + Math.floor(Math.random() * 1);
          let metal = 10 + Math.floor(Math.random() * 25);

          rewardMessage = `**${guild.user.username}**, here are your rewards:\n` +
          `- 🪵 Wood: **${wood}**\n` +
          `- 💊 Medkit: **${medkit}**\n` +
          `- ⚙️ Metal: **${metal}**`;

          playerInfo.resources.wood += wood;
          playerInfo.resources.medkit += medkit;
          playerInfo.resources.metal += metal;
        } else if (reward > 0.5 && gameData.zombiesKilled > 3) {
          let wood = 20 + Math.floor(Math.random() * 10);
          let food = 1 + Math.floor(Math.random() * 20);
          let metal = 10 + Math.floor(Math.random() * 10);

          rewardMessage = `**${guild.user.username}**, here are your rewards:\n` +
          `- 🪵 Wood: **${wood}**\n` +
          `- 🥕 Food: **${food}**\n` +
          `- ⚙️ Metal: **${metal}**`;

          playerInfo.resources.wood += wood;
          playerInfo.resources.food += food;
          playerInfo.resources.metal += metal;
        } else if (gameData.zombiesKilled > 2) {
          let wood = 10 + Math.floor(Math.random() * 10);
          let food = 1 + Math.floor(Math.random() * 20);

          rewardMessage = `**${guild.user.username}**, here are your rewards:\n` +
          `- 🪵 Wood: **${wood}**\n` +
          `- 🥕 Food: **${food}**`;

          playerInfo.resources.wood += wood;
          playerInfo.resources.food += food;
        }

        playerInfo.health -= 100 - gameData.health;
        playerInfo.kill += gameData.zombiesKilled;
        playerInfo.lastBattle.active = false;

        await playerInfo.save();

        await channel.send(`🧟 A horde of zombies swarms you! ${guild.user.username} couldn't escape in time ⏱️\n${rewardMessage}`);
      });
  } catch (e) {
    console.error(e);
    return channel.send("🚨 Something went wrong during the zombie survival! Please try again.");
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
    .setLabel('Previous')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage === 0);

    const nextButton = new ButtonBuilder()
    .setCustomId('next_page')
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage === totalPages - 1);

    const row = new ActionRowBuilder().addComponents(prevButton,
      nextButton);

    if (!playerInfo.weapons || playerInfo.weapons.length === 0) {
      return message.reply("⚠️ You don't have any weapons in your collection.");
    }

    // Function to generate the embed for the current page
    const generateEmbed = () => {
      const embed = new EmbedBuilder()
      .setColor('#35151b')
      .setTitle(`**${message.author.username}**'s Weapon Collection`)
      .setDescription('Here are your weapons and their stats:');

      const start = currentPage * itemsPerPage;
      const end = Math.min(start + itemsPerPage, playerInfo.weapons.length);

      playerInfo.weapons.slice(start, end).forEach((weapon, index) => {
        embed.addFields({
          name: `Weapon ${start + index + 1}: ${weapon.name}`,
          value: `
          **Type**: ${weapon.weapon}
          **Min Hunt**: ${weapon.minHunt}
          **Max Hunt**: ${weapon.maxHunt}
          **Level**: ${weapon.level}
          `,
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
    });

    collector.on('end',
      (collected, reason) => {
        if (reason === 'time') {
          reply.edit({
            components: [],
          });
        }
      });

  } catch (e) {
    console.error(e);
    return message.reply("⚠️ Something went wrong while checking your weapons!");
  }
}

export default {
  name: "zombie",
  description: "Survive the zombie apocalypse with strategic decisions!",
  aliases: ["survive", "zombies", "z"],
  cooldown: 90000,
  example: ["zombie", "z", "zombie help"],
  category: "🎲 Games",

  execute: async (args,
    message) => {

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

      const cachedBattle = await redisClient.get(`user:${message.author.id}:zombieBattle`);

      if (cachedBattle) {
        return message.channel.send("🧟 Please wait. 2 minutes haven't passed yet.");
      }

      if (playerInfo.health <= 100) {
        return message.reply("🧟 Your health is critically low, survivor! You need more than 100 HP to be battle-ready. Heal +100 HP for <:kasiko_coin:1300141236841086977> 3000 cash by using `kas z heal`.");
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
        return message.channel.send(`⚠️ **${message.author.username}**, please provide the weapon name from your collection that you want to use currently!\nExample: \`zombie active glove\``);
      }

      if (!playerInfo.weapons.some(weapon => weapon.name.toLowerCase() === weaponName)) {
        return message.channel.send(`⚠️ **${message.author.username}**, no such weapon found in your apocalypse inventory!`);
      }

      let weaponData = playerInfo.weapons.find(weapon => weapon.name.toLowerCase() === weaponName);

      if (weaponData) {
        playerInfo.activeWeapon = weaponData;
      }

      await playerInfo.save();

      return message.channel.send(`🧟🪓 **${message.author.username}**, from now on you are using **${playerInfo.activeWeapon.weapon} ${playerInfo.activeWeapon.name}** during your zombie hunt!`);
    }

    if (subCommand === "modify") {
      let weaponName = args[2] ? args[2].toLowerCase(): null;

      if (!weaponName) {
        return message.channel.send(`⚠️ **${message.author.username}**, please provide the weapon name from your collection that you want to use currently!\nExample: \`zombie modify glove\``);
      }

      let WeaponInCollection = playerInfo.weapons.find(weapon => weapon.name.toLowerCase() === weaponName);

      if (!WeaponInCollection) {
        return message.channel.send(`⚠️ **${message.author.username}**, no such weapon found in your apocalypse inventory!`);
      }

      let WeaponDetails = weaponsStats.find(weapon => weapon.name.toLowerCase() === weaponName);

      if (WeaponDetails.cost && playerInfo.resources.metal <= WeaponDetails.cost) {
        return message.channel.send(`⚠️ **${message.author.username}**, you don't have enough ⚙️ Metal to level up **${weaponName}**!\nRequired: ⚙️ ${WeaponDetails.cost}`);
      }

      WeaponInCollection.level += 1;
      WeaponInCollection.maxHunt += 1;

      if (playerInfo.activeWeapon.name.toLowerCase() === weaponName) {
        playerInfo.activeWeapon.level += 1;
        playerInfo.activeWeapon.maxHunt += 1;
      }

      await playerInfo.save();

      return message.channel.send(`🧟🪓 **${message.author.username}**, you have upgraded your **${playerInfo.activeWeapon.weapon} ${playerInfo.activeWeapon.name}** to level ${WeaponInCollection.level}!`);
    }

    if (subCommand === "upgrade") {
      let numberOfTimesLevelUp = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
      let woodReq = playerInfo.level * 100 * numberOfTimesLevelUp;

      if (numberOfTimesLevelUp > 0 && playerInfo.resources.wood >= woodReq) {
        playerInfo.resources.wood -= 100 * numberOfTimesLevelUp;
        playerInfo.level += numberOfTimesLevelUp;

        let newWeapon = weaponsStats.find(weapon => weapon.unlockAt === playerInfo.level);
        let newWeaponMessage = "";

        playerInfo.weapons.push({
          name: newWeapon.name,
          weapon: newWeapon.weapon,
          maxHunt: newWeapon.name,
          minHunt: newWeapon.name,
          level: 1,
        })

        if (!playerInfo.weapons.some(weapon => weapon.name === newWeapon.name)) {
          newWeaponMessage = `New weapon unlocked: ${newWeapon.weapon} **${newWeapon.name}**`
        }

        await playerInfo.save();
        return message.channel.send(`🏠 **${message.author.username}**, you have successfully upgraded your shelter to Level **${playerInfo.level}** using 🪵 **${woodReq}** wood!\n${newWeaponMessage}`);
      } else if (numberOfTimesLevelUp === 0 || numberOfTimesLevelUp < 0) {
        return message.channel.send(`⚠️ What’s that? Please provide a valid number for upgrade!`);
      } else {
        return message.channel.send(`⚠️ **${message.author.username}**, you don’t have enough 🪵 **${numberOfTimesLevelUp * 100} **wood in your apocalypse resources to upgrade your shelter.`);
      }
    }

    if (subCommand === "cure") {
      let numberOfMed = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
      if (numberOfMed > 0 && playerInfo.resources.medkit >= numberOfMed) {
        playerInfo.resources.medkit -= numberOfMed;
        playerInfo.health += 50 * numberOfMed;
        await playerInfo.save();
        return message.channel.send(`⛑️💊 **${message.author.username}**, you have successfully used **${numberOfMed}** and gained ${numberOfMed * 50} HP for your apocalypse hunt!`);
      } else if (numberOfMed === 0 || numberOfMed < 0) {
        return message.channel.send(`⚠️ What’s that? Please provide a valid number for medkit/cure!`);
      } else {
        return message.channel.send(`⚠️ **${message.author.username}**, you don't have enough medkit in your apocalypse resources to cure!`);
      }
    }

    if (subCommand === "eat") {
      let numberOfFood = args[2] && Number.isInteger(Number(args[2])) ? parseInt(args[2]): 1;
      if (numberOfFood > 0 && playerInfo.resources.food >= numberOfFood) {
        playerInfo.resources.food -= numberOfFood;
        playerInfo.health += 10 * numberOfFood;
        await playerInfo.save();
        return message.channel.send(`⛑️🥕 **${message.author.username}**, you have successfully eaten your food and gained ${numberOfFood * 10} HP for your apocalypse hunt!`);
      } else if (numberOfFood === 0 || numberOfFood < 0) {
        return message.channel.send(`⚠️ What’s that? Please provide a valid number for food!`);
      } else {
        return message.channel.send(`⚠️ **${message.author.username}**, you don't have enough food in your apocalypse resources to eat!`);
      }
    }

    if (subCommand === "heal") {
      let userData = await getUserData(message.author.id);

      if (userData.cash <= 3000) {
        return message.channel.send(`⚠️ **${message.author.username}**, you don't have <:kasiko_coin:1300141236841086977> 3000 cash!`);
      }

      userData.cash -= 3000;
      playerInfo.health += 100;

      await playerInfo.save();
      await updateUser(message.author.id, userData);

      return message.channel.send(
        `⛑️ **${message.author.username}**, survivor, you have been healed and gained **+100 HP**! Stay strong and keep moving forward!`);
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
      });
    }

    return message.channel.send({
      embeds: createZombieEmbed(playerInfo)
    })
  }
};