import Alien from "../../../models/Alien.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags
} from "discord.js";

import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  abilities
} from "./alien/abilities.js";

import {
  Spaceship
} from "./alien/ships.js";

import handleAlienHelp from "./alien/help.js";

import {
  inventory
} from "./alien/inventory.js";

import {
  discordUser
} from "../../../helper.js";

const alienResEmo = `<:aliens_resource:1335537435341226024>`;
const alienEnEmo = `<:aliens_energy:1335542963450679397>`;
const alienTechEmo = `<:aliens_tech:1336344914413359135>`;
const alienManEmo = `<:aliens_manipulation:1335543139376566322>`;
const alienCrownEmo = `<:aliens_crown:1336345903048560640>`;

const disguises = [
  "Politician",
  "Business Tycoon",
  "Renegade Scientist",
  "Famous Celebrity",
  "Elite Hacker",
  "Magician",
  "Boxer",
  "Undercover Detective",
  "Master Thief",
  "Secret Agent",
  "Fortune Teller",
  "Street Performer",
  "Mob Boss",
  "Disguised Royalty",
  "Escaped Convict",
  "Cybernetic Mercenary",
  "Masked Vigilante",
  "Underground Journalist",
  "Elite Spy",
  "Professional Gambler",
  "Espionage Expert"
];
/**
* Helper: Returns the username from a message or interaction.
*/
function getUsername(ctx) {
  return ctx.author ? ctx.author.username: ctx.user.username;
}

/**
* Helper: Sends a reply using either message.channel.send or interaction reply/editReply.
*/
async function replyOrSend(ctx, options) {
  if (ctx.author) {
    return ctx.channel.send(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
  if (ctx.deferred || ctx.replied) {
    return ctx.editReply(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
  return ctx.reply(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
}

/**
* Helper: Returns a random element from an array.
*/
function randomResponse(responses = []) {
  if (!responses.length) return "";
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
* Handles the profile command.
*/
async function handleProfile(ctx) {
  try {
    // For button interactions, defer the update so the user sees a loading state.
    if (ctx.customId && typeof ctx.deferUpdate === "function") {
      await ctx.deferUpdate();
    }
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const alien = await Alien.findOne({
      userId
    });
    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 Hey **${getUsername(ctx)}**, you are not registered in the cosmic order! Use \`alien join\` to begin your extraterrestrial journey.`
      });
    }

    const upgradeCost = Number(Math.floor((alien.tech/10) * (alien.tech/10) * 25)) + 500;

    // Enforce a 3-hour cooldown between harvests
    let footerMsg = ".𖥔 ݁ ˖ִ ࣪𖤐 𝘠𝘰𝘶 𝘤𝘢𝘯 𝘩𝘢𝘳𝘷𝘦𝘴𝘵 𝘯𝘰𝘸!";
    let disableHarvest = false;
    const now = new Date();
    const cooldownDuration = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
    if (alien.lastHarvest) {
      const nextAvailableTime = new Date(alien.lastHarvest.getTime() + cooldownDuration);
      if (now < nextAvailableTime) {
        const remainingMs = nextAvailableTime - now;
        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
        footerMsg = `<:sand_timer:1386589414846631947> 𝘞𝘢𝘪𝘵   ${hours}h ${minutes}m ${seconds}s   𝘵𝘰 𝘩𝘢𝘳𝘷𝘦𝘴𝘵 𝘢𝘨𝘢𝘪𝘯.`;
        disableHarvest = true;
      }
    }

    const currentShipIndex = Spaceship.findIndex(s => parseInt(alien.tech) > s.tech);
    const currentShip = Spaceship[currentShipIndex];
    const upcomingShip = Spaceship[currentShipIndex - 1] ?? null;

    const Container = new ContainerBuilder()
    .addTextDisplayComponents(td =>
      td.setContent(`### 🛸 𝔸𝕝𝕚𝕖𝕟 ℙ𝕣𝕠𝕗𝕚𝕝𝕖: ${alien.name}`)
    )
    .addTextDisplayComponents(td =>
      td.setContent(`🗯️ 𝙂𝙀𝙉𝙀𝙍𝘼𝙇`),
      td => td.setContent(`<:conqueror:1336360322516123669> **Disguise:** ${alien.disguise || "None"} ${alienCrownEmo} **Influence:** ${alien.influence}\n${alienResEmo} **Resources:** ${alien.resources}/${upgradeCost}\n${alienEnEmo} **Energy:** ${alien.energy} ${alienTechEmo} **Tech:** ${alien.tech}${upcomingShip ? "/ " + upcomingShip.tech: ""}`)
    )
    .addTextDisplayComponents(td =>
      td.setContent(`🗯️ 𝘾𝙊𝙈𝘽𝘼𝙏`),
      td => td.setContent(`- **ꨄ︎ HP:** ${alien.battleStats.health} **✸ ATK:** ${alien.battleStats.attack}\n- **⛨ DEF:** ${alien.battleStats.defense} **𖥂 AGI:** ${alien.battleStats.agility}`)
    )
    .addTextDisplayComponents(td =>
      td.setContent(`🗯️ 𝙎𝙋𝙀𝘾𝙄𝘼𝙇`)
    )
    .addSectionComponents(
      section => section
      .addTextDisplayComponents(
        td => td.setContent(`<:aliens_ability:1336346125791137855> **Abilities:** ${alien.abilities.length > 0 ? alien.abilities.length: "None"}\n${alienManEmo} **Manipulations:** ${alien.manipulations}\n${currentShip ? "-# **Spaceship**: " + currentShip.name: ""}`)
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
        .setDescription('Spaceship')
        .setURL(currentShip ? currentShip.url: "https://cdn.discordapp.com/emojis/1386562130752438402.png")
      )
    )
    .addTextDisplayComponents(td =>
      td.setContent(`-# ${footerMsg}`)
    )

    /*  .addTextDisplayComponents(td =>
      td.setContent(``)
    ) */

    // Build quick-action buttons.
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId("alien_upgrade")
      .setLabel("UPGRADE")
      .setDisabled(alien.resources >= upgradeCost ? false: true)
      .setEmoji('1336344266242527294')
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId("alien_harvest")
      .setLabel("HARVEST")
      .setDisabled(disableHarvest)
      .setEmoji('1365911635465601104')
      .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
      .setCustomId("alien_disguise")
      .setLabel("DISGUISE")
      .setEmoji('1391676098026274826')
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId("aliens_ability")
      .setLabel("ABILITIES")
      .setEmoji('1336346125791137855')
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId("alien_help")
      .setLabel("❔ HELP")
      .setStyle(ButtonStyle.Secondary)
    );

    // Send the profile embed with buttons.
    const sentMessage = await replyOrSend(ctx, {
      components: [Container, buttons],
      flags: MessageFlags.IsComponentsV2
    });

    // Only attach a collector if the sent message supports it.
    if (sentMessage && sentMessage.createMessageComponentCollector) {
      const collector = sentMessage.createMessageComponentCollector({
        time: 60000
      });

      // Listen for interactions on the buttons.
      collector.on("collect", async (interaction) => {
        // Ensure only the profile owner can use these buttons.
        try {
          if (interaction.user.id !== userId) {
            return interaction.reply({
              content: "These buttons aren't for you!", ephemeral: true
            });
          }

          // Defer the update to acknowledge the button press.
          await interaction.deferUpdate();

          // Route interaction based on the customId.
          switch (interaction.customId) {
            case "alien_upgrade":
              return await handleUpgrade(ctx);
              break;
            case "alien_harvest":
              await handleHarvest(ctx);

              // Grab the current components (ActionRows) from the message
              const current = interaction.message.components;

              // Map each row → new ActionRowBuilder, disabling harvest
              const newRows = current.map(row => {
                const rowBuilder = new ActionRowBuilder();
                for (const comp of row.components) {
                  // If this is the harvest button, disable it
                  if (comp.customId === "alien_harvest") {
                    rowBuilder.addComponents(
                      ButtonBuilder.from(comp).setDisabled(true)
                    );
                  } else {
                    rowBuilder.addComponents(comp);
                  }
                }
                return rowBuilder;
              });

              await interaction.editReply({
                components: [Container,
                  newRows]
              });
              break;
            case "alien_help":
              return await handleAlienHelp(ctx);
              break;
            case "alien_disguise":
              return await handleDisguise(ctx);
              break;
            case "aliens_ability":
              await handleAbilitiesList(ctx);

              // Grab the current components (ActionRows) from the message
              const currentAbButton = interaction.message.components;

              // Map each row → new ActionRowBuilder, disabling harvest
              const newRowsAb = currentAbButton.map(row => {
                const rowBuilder = new ActionRowBuilder();
                for (const comp of row.components) {
                  // If this is the harvest button, disable it
                  if (comp.customId === "aliens_ability") {
                    rowBuilder.addComponents(
                      ButtonBuilder.from(comp).setDisabled(true)
                    );
                  } else {
                    rowBuilder.addComponents(comp);
                  }
                }
                return rowBuilder;
              });

              await interaction.editReply({
                components: [Container,
                  newRowsAb],
                flags: MessageFlags.IsComponentsV2
              });

              break;
            case "alien_battle":
              return await handleBattle(ctx,
                []);
              break;
            default:
              return await interaction.followUp({
                content: "❗ Unknown command"
              });
              break;
          }
        } catch (e) {
          if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
            console.error(e.message);
          }
        }
      });

      // Once the collector ends, remove the buttons from the message.
      collector.on("end",
        async () => {
          try {
            if (sentMessage && sentMessage.edit) {
              await sentMessage.edit({
                components: [Container]
              });
            }
          } catch (err) {}
        });
    }
    return sentMessage;
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx,
      {
        content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, something went wrong while fetching your profile.`
      });
  }
}

/**
* Handles the join command.
*/
async function handleJoin(ctx) {
  try {
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    let alien = await Alien.findOne({
      userId
    });
    if (alien) {
      return replyOrSend(ctx, {
        content: randomResponse([
          `👽 Hey **${getUsername(ctx)}**, you are already part of the cosmic conspiracy!`,
          `👽 **${getUsername(ctx)}**, you've already embraced your alien destiny.`,
          `👽 **${getUsername(ctx)}**, you're already in the interstellar fold!`
        ]) + "\n✶ .˚　˚   ✦  .  .   ✦　˚ ˳·˖ ✦"
      });
    }
    alien = new Alien( {
      userId,
      name: `Alien_${getUsername(ctx)}`,
      disguise: "",
      influence: 1,
      resources: 100,
      energy: 100,
      tech: 50,
      manipulations: 0,
      battleStats: {
        health: 100,
        attack: 10,
        defense: 8,
        agility: 8,
        critChance: 0.1
      }
    });
    await alien.save();
    return replyOrSend(ctx, {
      content: randomResponse([
        `🛸 Welcome aboard, cosmic wanderer **${getUsername(ctx)}**! You have joined the intergalactic infiltration. Start by crafting your human facade with \`alien disguise\`.`,
        `🛸 **${getUsername(ctx)}**, your extraterrestrial journey begins now. Welcome to the cosmic collective!`,
        `🛸 Congratulations **${getUsername(ctx)}**! You've taken your first step into the interstellar conspiracy.`
      ]) + "\nUSE: \`alien help\` for your adventure information!\n✶ .˚　˚   ✦  .  .   ✦　˚ ˳·˖ ✦"
    });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx, {
      content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred during registration. Please try again later.`
    });
  }
}

/**
* Energy to Kasiko cash
*/

async function handleEnergyExchange(ctx, argsOrAmount) {
  try {
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const username = ctx.author ? ctx.author.username: ctx.user.username;

    const alien = await Alien.findOne({
      userId
    });
    const userData = await getUserData(userId);

    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 **${getUsername(ctx)}**, you must join the cosmic conspiracy first! Use \`alien join\`.`
      });
    }

    // Determine energy amount
    let energyAmount;
    if (Array.isArray(argsOrAmount)) {
      const arg = argsOrAmount[0]?.toLowerCase();
      if (!arg) {
        energyAmount = 1; // Default to 1 if no amount is mentioned
      } else if (arg === "all") {
        energyAmount = alien.energy; // Exchange all energy
      } else {
        energyAmount = parseInt(arg, 10);
      }
    } else {
      if (argsOrAmount?.toLowerCase() === "all") {
        energyAmount = alien.energy || 1;
      } else {
        energyAmount = Number(argsOrAmount) || 1; // Default to 1 if not provided
      }
    }

    // Validate energy amount
    if (isNaN(energyAmount) || energyAmount <= 0) {
      return replyOrSend(ctx, {
        content: '❗Please provide a valid energy amount greater than 0.'
      });
    }

    if (alien.energy < energyAmount) {
      return replyOrSend(ctx, {
        content: `❗Insufficient energy! **${username}**, you only have ${alien.energy} energy.`
      });
    }

    // Calculate cash gain
    const cashGained = alien.tech * energyAmount * 5;

    // Update values
    alien.energy -= energyAmount;
    userData.cash = (userData.cash || 0) + cashGained;

    // Save the changes
    await alien.save();
    await updateUser(userId, userData);

    return replyOrSend(ctx, {
      content: `🛸 **${userData.name || 'Alien'}**, your advanced ${alienTechEmo} technology has _successfully_ transmuted
      ${alienEnEmo} **\`${energyAmount} energy\`** → **<:kasiko_coin:1300141236841086977> \`${cashGained} cash\`**!
      ˗ˏˋ ★ ˎˊ˗ ᴛʜᴇ ᴄᴏꜱᴍɪᴄ ᴇᴄᴏɴᴏᴍʏ ᴘʀᴏꜱᴘᴇʀꜱ ᴜɴᴅᴇʀ ʏᴏᴜʀ ᴇxᴛʀᴀᴛᴇʀʀᴇꜱᴛʀɪᴀʟ ᴡɪꜱᴅᴏᴍ! 🚀`
    });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx, {
      content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred during energy exchange.\n-# **Error**: ${error.message}`
    });
  }
}

/**
* Handles the harvest command.
*/
async function handleHarvest(ctx) {
  try {
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const alien = await Alien.findOne({
      userId
    });
    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 **${getUsername(ctx)}**, you must join the cosmic conspiracy first! Use \`alien join\`.`
      });
    }

    // Enforce a 9-hour cooldown between harvests
    const now = new Date();
    const cooldownDuration = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
    if (alien.lastHarvest) {
      const nextAvailableTime = new Date(alien.lastHarvest.getTime() + cooldownDuration);
      if (now < nextAvailableTime) {
        const remainingMs = nextAvailableTime - now;
        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
        return replyOrSend(ctx, {
          content: `⌛ **${alien.name}**, your cosmic energies are still recharging. Please wait **${hours}h ${minutes}m ${seconds}s** before harvesting again.`
        });
      }
    }

    // Choose a random ability from the alien’s abilities array
    const randomAbility = alien.abilities[Math.floor(Math.random() * alien.abilities.length)];

    // Calculate gains:
    // - Base resource gain is 25 plus the ability's bonus.
    // - Base energy gain is 5 plus the ability's bonus, with the alien's influence added.
    const baseResourceGain = 25;
    const baseEnergyGain = 5;
    const abilityResourceBonus = randomAbility.resourcesCollection || 0;
    const abilityEnergyBonus = randomAbility.energyCollection || 0;
    const influenceBonus = Math.min(Math.ceil(Math.random() * (alien.influence/4)), 30); // Influence adds directly to energy gain

    const resourceGain = baseResourceGain + abilityResourceBonus;
    const energyGain = baseEnergyGain + abilityEnergyBonus + influenceBonus;

    // Update alien stats and reset the harvest timer
    alien.resources += resourceGain;
    alien.energy += energyGain;
    alien.lastHarvest = now;
    await alien.save();

    // Construct and send a detailed response message
    const responseMessage =
    randomResponse([
      `🛸 **${alien.name}**, your daring cosmic harvest yielded <:aliens_resource:1335537435341226024> **${resourceGain} resources** and <:aliens_energy:1335542963450679397> **${energyGain} energy** (influence bonus: ${influenceBonus}).`,
      `🛸 **${alien.name}**, tapping into the cosmic grid, you secured <:aliens_resource:1335537435341226024> **${resourceGain} resources** and <:aliens_energy:1335542963450679397> **${energyGain} energy** — your influence played its part with an extra ${influenceBonus} energy!`,
      `🛸 **${alien.name}**, your interstellar extraction was a triumph! You amassed <:aliens_resource:1335537435341226024> **${resourceGain} resources** and <:aliens_energy:1335542963450679397> **${energyGain} energy** (including an influence bonus of ${influenceBonus}).`
    ])

    const Container = new ContainerBuilder()
    .setAccentColor(0xeae687)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`𝗘𝗫𝗧𝗥𝗔𝗖𝗧𝗜𝗢𝗡 𝗟𝗢𝗚`)
    )
    .addSeparatorComponents(separate => separate)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(responseMessage)
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`-# <:aliens_ability:1336346125791137855> **ABILITY USED:** ${randomAbility.name}`)
    )
    .addMediaGalleryComponents(
      media =>
      media.addItems(
        item => item.setURL("https://harshtiwari47.github.io/kasiko-public/images/harvest.png")
      )
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`-# To exchange energy for cash, use **\`alien exchange <amount>\`**.`)
    )

    return replyOrSend(ctx, {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx, {
      content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred while harvesting resources.`
    });
  }
}

/**
* Handles the user's ability details
*/
async function handleAbilitiesList(ctx) {
  try {
    // Determine the user id from the context.
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    // Use lean() for the initial query (for faster reads)…
    const alien = await Alien.findOne({
      userId
    }).lean();
    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 **${getUsername(ctx)}**, you must join the cosmic collective first! Use \`alien join\`.`,
      });
    }

    const abilities = alien.abilities;
    if (!abilities || abilities.length === 0) {
      return replyOrSend(ctx, {
        content: `🚀 **${alien.name}**, you have no abilities unlocked yet!`,
      });
    }

    // Pagination settings: one ability per page.
    const itemsPerPage = 1;
    let currentPage = 0;
    const totalPages = Math.ceil(abilities.length / itemsPerPage);

    // Helper function to build an embed for the current ability.
    function generateEmbed(pageIndex) {
      const ability = abilities[pageIndex];
      const embed = new EmbedBuilder()
      .setDescription(
        `## <:aliens_ability:1336346125791137855> ${alien.name}'𝙨 𝘼𝙗𝙞𝙡𝙞𝙩𝙞𝙚𝙨` +
        `\n𝘔𝘢𝘴𝘵𝘦𝘳 𝘢𝘯𝘥 𝘶𝘱𝘨𝘳𝘢𝘥𝘦 𝘤𝘰𝘴𝘮𝘪𝘤 𝘢𝘣𝘪𝘭𝘪𝘵𝘪𝘦𝘴 𝘧𝘰𝘳 𝘶𝘭𝘵𝘪𝘮𝘢𝘵𝘦 𝘱𝘰𝘸𝘦𝘳!` +
        `\n## **╰➤ ${ability.name}**` +
        `\n<:follow_reply:1368224897003946004> **𝖫𝖾𝗏𝖾𝗅:** ${ability.level}` +
        `\n<:follow_reply:1368224897003946004> **𝖱𝖾𝗌𝗈𝗎𝗋𝖼𝖾𝗌:** +${ability.resourcesCollection}` +
        `\n<:follow_reply:1368224897003946004> **𝖬𝖺𝗇𝗂𝗉𝗎𝗅𝖺𝗍𝗂𝗈𝗇 %:** +${ability.manipulationRate ? ability.manipulationRate: 0}` +
        `\n<:follow_reply:1368224897003946004> **𝖤𝗇𝖾𝗋𝗀𝗒:** +${ability.energyCollection}` +
        `\n<:reply:1368224908307468408> **𝖳𝖾𝖼𝗁 𝖨𝗇𝖼𝗋𝖾𝗆𝖾𝗇𝗍:** +${ability.techIncrement}`
      )
      .setFooter({
        text: `⤿ 𝘗𝘢𝘨𝘦 ${pageIndex + 1} 𝘖𝘧 ${totalPages} | 𝘙𝘌𝘘𝘜𝘐𝘙𝘌𝘔𝘌𝘕𝘛𝘚: alien inventory`
      });

      if (ability.upgradeRequirements && ability.upgradeRequirements.length > 0) {
        const reqText = ability.upgradeRequirements
        .map(req => `• ${req.itemName}: ${req.quantity}`)
        .join('\n');
        embed.addFields({
          name: 'Upgrade Requirements', value: reqText, inline: false
        });
      }

      return embed;
    }

    // Build initial buttons.
    const prevButton = new ButtonBuilder()
    .setCustomId('prev')
    .setLabel('◀')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(currentPage === 0);

    const upgradeButton = new ButtonBuilder()
    .setCustomId('upgrade')
    .setLabel('⚙️ UPGRADE')
    .setStyle(ButtonStyle.Secondary);

    const nextButton = new ButtonBuilder()
    .setCustomId('next')
    .setLabel('▶')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(totalPages <= 1);

    const actionRow = new ActionRowBuilder().addComponents(prevButton, upgradeButton, nextButton);

    // Send the initial embed message.
    const message = await replyOrSend(ctx, {
      embeds: [generateEmbed(currentPage)],
      components: [actionRow],
    });

    // Create a collector for button interactions.
    const collector = message.createMessageComponentCollector({
      time: 60000, // 1 minute timeout
    });

    collector.on('collect', async (interaction) => {
      try {
        // Only allow the original user to interact.
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, these buttons aren't for you!`,
            ephemeral: true,
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        if (interaction.customId === 'prev') {
          currentPage = currentPage > 0 ? currentPage - 1: totalPages - 1;
        } else if (interaction.customId === 'next') {
          currentPage = currentPage < totalPages - 1 ? currentPage + 1: 0;
        } else if (interaction.customId === 'upgrade') {
          // Since the original alien was fetched using lean(), we need a full document to update.
          const alienDoc = await Alien.findOne({
            userId
          });
          if (!alienDoc) {
            return interaction.reply({
              content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, something went wrong: alien not found.`,
              ephemeral: true,
            }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
          // Get the ability document from the mongoose array.
          const abilityDoc = alienDoc.abilities[currentPage];
          if (!abilityDoc) {
            return interaction.reply({
              content: `<:checkbox_cross:1388858904095625226> **${alien.name}**, ability not found.`,
              ephemeral: true,
            }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          // Check if the alien has enough inventory items for each requirement.
          let missingItems = [];
          for (const req of abilityDoc.upgradeRequirements) {
            const invItem = alienDoc.inventory.find(item =>
              item.itemName.toLowerCase() === req.itemName.toLowerCase()
            );
            if (!invItem || invItem.quantity < req.quantity) {
              const currentQty = invItem ? invItem.quantity: 0;
              missingItems.push(`${req.itemName} (need ${req.quantity - currentQty} more)`);
            }
          }

          if (missingItems.length > 0) {
            return interaction.reply({
              content: `<:checkbox_cross:1388858904095625226> **${alien.name}**, you lack the following items to upgrade **${abilityDoc.name}**:\n${missingItems.join('\n')}`,
              ephemeral: true,
            }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          // Deduct the required items from the inventory.
          for (const req of abilityDoc.upgradeRequirements) {
            const invItem = alienDoc.inventory.find(item =>
              item.itemName.toLowerCase() === req.itemName.toLowerCase()
            );
            invItem.quantity -= req.quantity;
          }

          // Perform the upgrade: increase level and boost stats.
          abilityDoc.level += 1;
          abilityDoc.resourcesCollection += 1; // increase resource collection bonus.
          abilityDoc.manipulationRate = (abilityDoc.manipulationRate || 0) + 0.05; // bump manipulation rate.
          abilityDoc.energyCollection += 1; // increase energy collection.
          abilityDoc.techIncrement += 2; // increase tech increment.

          // Update the upgrade requirements for the next level.
          abilityDoc.upgradeRequirements = abilityDoc.upgradeRequirements.map(req => ({
            itemName: req.itemName,
            quantity: req.quantity * 2
          }));

          // Save the updated alien document.
          await alienDoc.save();

          // Update our local copy used for the embed.
          abilities[currentPage] = abilityDoc;

          // Update the message embed and button states.
          await interaction.update({
            embeds: [generateEmbed(currentPage)],
            components: [new ActionRowBuilder().addComponents(prevButton, upgradeButton, nextButton)]
          });
          // Send an ephemeral confirmation message.
          await interaction.followUp({
            content: `🚀 **${alien.name}** successfully upgraded **${abilityDoc.name}** to level ${abilityDoc.level}!`,
            ephemeral: true,
          });
          return;
        }

        // Update the button disabled states based on current page.
        prevButton.setDisabled(currentPage === 0);
        nextButton.setDisabled(currentPage === totalPages - 1);

        // Update the message with the new embed and buttons.
        await interaction.update({
          embeds: [generateEmbed(currentPage)],
          components: [new ActionRowBuilder().addComponents(prevButton, upgradeButton, nextButton)],
        });
      } catch (e) {
        if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
          console.error(e);
        }
      }
    });

    collector.on('end',
      async () => {
        try {
          // After timeout, disable the buttons if the message is still editable.
          prevButton.setDisabled(true);
          upgradeButton.setDisabled(true);
          nextButton.setDisabled(true);
          const disabledRow = new ActionRowBuilder().addComponents(prevButton, upgradeButton, nextButton);
          await message.edit({
            components: [disabledRow]
          });

        } catch (err) {}
      });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx,
      {
        content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred while listing your abilities.`,
      });
  }
}

/**
* inventory
*/
async function handleInventoryList(ctx) {
  try {
    // Determine the user id from the context.
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const alien = await Alien.findOne({
      userId
    }).lean();
    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 **${getUsername(ctx)}**, you must join the cosmic collective first! Use \`alien join\`.`,
      });
    }

    const predefinedItems = inventory;

    // Combine user inventory with predefined items.
    // The alien.inventory is expected to be an array of objects with { itemName, quantity }.
    const userInventory = alien.inventory || [];
    const combinedInventory = Object.keys(predefinedItems).map(key => {
      // Find the item from the user's inventory (if any)
      const userItem = userInventory.find(item => item.itemName === predefinedItems[key].name);
      return {
        itemName: predefinedItems[key].name,
        quantity: userItem ? userItem.quantity: predefinedItems[key].quantity,
        emoji: predefinedItems[key].emoji,
        description: predefinedItems[key].description,
      };
    });

    // If there are no items in the combined inventory, send a message.
    if (combinedInventory.length === 0) {
      return replyOrSend(ctx, {
        content: `🚀 **${alien.name}**, you have no items in your cosmic inventory!`,
      });
    }

    // Pagination settings: two items per page.
    const itemsPerPage = 4;
    let currentPage = 0;
    const totalPages = Math.ceil(combinedInventory.length / itemsPerPage);

    // Helper function to generate an embed for the current page.
    function generateEmbed(pageIndex) {
      const startIndex = pageIndex * itemsPerPage;
      const pageItems = combinedInventory.slice(startIndex, startIndex + itemsPerPage);

      const embed = new EmbedBuilder()
      .setTitle(`<a:saturn_outside_emoji:1355059017105276999> ${alien.name}'s 𝖢𝗈𝗌𝗆𝗂𝖼 𝖨𝗇𝗏𝖾𝗇𝗍𝗈𝗋𝗒`)
      .setDescription("-# 𝖢𝗁𝖾𝖼𝗄 𝗈𝗎𝗍 𝗍𝗁𝖾 𝗂𝗍𝖾𝗆𝗌 𝗂𝗇 𝗒𝗈𝗎𝗋 𝗌𝗍𝖺𝗌𝗁. 𝖴𝗌𝖾 𝗍𝗁𝖾𝗆 𝗐𝗂𝗌𝖾𝗅𝗒!")
      .setFooter({
        text: `⤿ 𝘗𝘢𝘨𝘦 ${pageIndex + 1} 𝘖𝘧 ${totalPages}`
      });

      pageItems.forEach(item => {
        embed.addFields({
          name: `<:left:1350355384111468576> ${item.emoji} ${item.itemName?.toUpperCase()}`,
          value: `-# **𝘘𝘜𝘈𝘕𝘛𝘐𝘛𝘠 ~ ** ${item.quantity}`,
          inline: false,
        });
      });

      return embed;
    }

    // Build initial buttons.
    const prevButton = new ButtonBuilder()
    .setCustomId('prev')
    .setLabel('◀')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(currentPage === 0);

    const nextButton = new ButtonBuilder()
    .setCustomId('next')
    .setLabel('▶')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(totalPages <= 1);

    const actionRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

    // Send the initial embed message.
    const message = await replyOrSend(ctx, {
      embeds: [generateEmbed(currentPage)],
      components: [actionRow],
    });

    // Create a collector for button interactions.
    const collector = message.createMessageComponentCollector({
      time: 60000, // Collector active for 1 minute.
    });

    collector.on('collect', async (interaction) => {
      try {
        // Only allow the original user to interact.
        if (interaction.user.id !== userId) {
          await interaction.reply({
            content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, these buttons aren't for you!`,
            ephemeral: true,
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          return;
        }

        if (interaction.customId === 'prev') {
          currentPage = currentPage > 0 ? currentPage - 1: totalPages - 1;
        } else if (interaction.customId === 'next') {
          currentPage = currentPage < totalPages - 1 ? currentPage + 1: 0;
        } else {
          await interaction.reply({
            content: `<:checkbox_cross:1388858904095625226> **${alien.name}**, no item available to use.`,
            ephemeral: true,
          });
        }

        // Update button disabled state if needed.
        prevButton.setDisabled(currentPage === 0);
        nextButton.setDisabled(currentPage === totalPages - 1);

        // Update the message with the new embed and buttons.
        await interaction.update({
          embeds: [generateEmbed(currentPage)],
          components: [new ActionRowBuilder().addComponents(prevButton, nextButton)],
        });
      } catch (e) {
        if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
          console.error(e);
        }
      }
    });

    collector.on('end',
      async () => {
        // Disable buttons after the collector expires.
        if (message?.edit) {
          prevButton.setDisabled(true);
          nextButton.setDisabled(true);
          const disabledRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
          await message.edit({
            components: [disabledRow]
          });
        }
      });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx,
      {
        content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred while listing your inventory.`,
      });
  }
}

/**
* Handles the upgrade command.
*/
async function handleUpgrade(ctx) {
  try {
    // Determine the user id from the context.
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const alien = await Alien.findOne({
      userId
    });
    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 **${getUsername(ctx)}**, you must join the cosmic collective first! Use \`alien join\`.`,
      });
    }

    const upgradeCost = Number(Math.floor((alien.tech/10) * (alien.tech/10) * 25)) + 500;

    if (alien.resources < upgradeCost) {
      return replyOrSend(ctx, {
        content: `<:aliens_resource:1335537435341226024> **${alien.name}**, insufficient resources! You need **${upgradeCost} resources** to upgrade your alien tech.`,
      });
    }

    // Deduct the upgrade cost.
    alien.resources -= upgradeCost;

    // Determine which abilities the alien hasn't unlocked yet.
    const availableAbilities = abilities.filter(
      (ability) => !alien.abilities.some((a) => a.name === ability.name)
    );

    let chosenAbility;
    // Pick a random ability from those not yet unlocked.
    if (availableAbilities.length !== 0) {
      const randomIndex = Math.floor(Math.random() * availableAbilities.length);
      chosenAbility = availableAbilities[randomIndex];
      // Add the new ability to the alien.
      alien.abilities.push(chosenAbility);
    }

    // Update additional stats.
    alien.battleStats.attack += 2;
    alien.battleStats.defense += 2;
    // Use the techIncrement from the chosen ability.
    alien.tech += 10 + (chosenAbility?.techIncrement || 0);

    // Save the updated alien document.
    await alien.save();

    // Prepare a set of improved random responses.
    const responses = [
      chosenAbility
      ? `## <:aliens_hammer:1336344266242527294>  **${alien.name}, evolution complete!**\n<:orange_fire:1336344438464839731> 𝘠𝘰𝘶'𝘷𝘦 𝘶𝘯𝘭𝘰𝘤𝘬𝘦𝘥 <:aliens_ability:1336346125791137855>  **__${chosenAbility.name}__**, 𝘣𝘰𝘰𝘴𝘵𝘪𝘯𝘨 𝘺𝘰𝘶𝘳 𝚌𝚘𝚜𝚖𝚒𝚌 𝚙𝚛𝚘𝚠𝚎𝚜𝚜  𝘢𝘯𝘥 𝚝𝚎𝚌𝚑 𝘣𝘺 <:aliens_tech:1336344914413359135>: ***${chosenAbility.techIncrement} points***. <:aliens_crown:1336345903048560640>`: `## <:aliens_hammer:1336344266242527294>  **${alien.name}, evolution complete!**\n<:orange_fire:1336344438464839731> 𝘠𝘰𝘶'𝘷𝘦 𝘨𝘢𝘪𝘯𝘦𝘥 𝘯𝘰 𝘯𝘦𝘸 𝘢𝘣𝘪𝘭𝘪𝘵𝘺 𝘵𝘩𝘪𝘴 𝘵𝘪𝘮𝘦, 𝘣𝘶𝘵 𝘺𝘰𝘶𝘳 𝚝𝚎𝚌𝚑 𝘴𝘵𝘪𝘭𝘭 𝘧𝘦𝘦𝘭𝘴 𝘮𝘰𝘳𝘦 𝘧𝘰𝘤𝘶𝘴𝘦𝘥. <:aliens_tech:1336344914413359135>`,

      chosenAbility
      ? `## <:aliens_hammer:1336344266242527294>  **${alien.name}, upgrade successful!**\n<:orange_fire:1336344438464839731> 𝘠𝘰𝘶 𝘯𝘰𝘸 𝘤𝘰𝘮𝘮𝘢𝘯𝘥 <:aliens_ability:1336346125791137855>  **__${chosenAbility.name}__**, 𝘦𝘯𝘩𝘢𝘯𝘤𝘪𝘯𝘨 𝘺𝘰𝘶𝘳 𝚋𝚊𝚝𝚝𝚕𝚎 𝚛𝚎𝚊𝚍𝚒𝚗𝚎𝚜𝚜  𝘢𝘯𝘥 𝚝𝚎𝚌𝚑 𝘣𝘺 <:aliens_tech:1336344914413359135>: ***${chosenAbility.techIncrement} points***. <:aliens_crown:1336345903048560640>`: `## <:aliens_hammer:1336344266242527294>  **${alien.name}, upgrade successful!**\n<:orange_fire:1336344438464839731> 𝘕𝘰 𝘯𝘦𝘸 𝘢𝘣𝘪𝘭𝘪𝘵𝘺 𝘥𝘪𝘴𝘤𝘰𝘷𝘦𝘳𝘦𝘥, 𝘣𝘶𝘵 𝘺𝘰𝘶 𝘧𝘦𝘦𝘭 𝘺𝘰𝘶𝘳 𝚋𝚘𝚗𝚍 𝘸𝘪𝘵𝘩 𝘁𝘦𝘤𝘩 𝘨𝘳𝘰𝘸𝘪𝘯𝘨. <:aliens_tech:1336344914413359135>`,

      chosenAbility
      ? `## <:aliens_hammer:1336344266242527294>  **${alien.name}, the stars have aligned!**\n<:orange_fire:1336344438464839731> 𝘠𝘰𝘶'𝘷𝘦 𝘨𝘢𝘪𝘯𝘦𝘥 <:aliens_ability:1336346125791137855>  **__${chosenAbility.name}__**, 𝘢𝘮𝘱𝘭𝘪𝘧𝘺𝘪𝘯𝘨 𝘺𝘰𝘶𝘳 𝚝𝚎𝚌𝚑 𝘣𝘺 <:aliens_tech:1336344914413359135>: ***${chosenAbility.techIncrement} points***. <:aliens_crown:1336345903048560640>`: `## <:aliens_hammer:1336344266242527294>  **${alien.name}, the stars have aligned!**\n<:orange_fire:1336344438464839731> 𝘈 𝘯𝘦𝘸 𝘢𝘣𝘪𝘭𝘪𝘵𝘺 𝘥𝘪𝘥 𝘯𝘰𝘵 𝘦𝘮𝘦𝘳𝘨𝘦, 𝘺𝘦𝘵 𝘢 𝘮𝘺𝘴𝘵𝘪𝘤 𝘨𝘭𝘰𝘸 𝘦𝘯𝘷𝘦𝘭𝘰𝘱𝘴 𝘺𝘰𝘶𝘳 𝘵𝘦𝘤𝘩. <:aliens_tech:1336344914413359135>`
    ];

    return replyOrSend(ctx, {
      content: responses[Math.floor(Math.random() * responses.length)],
    });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx, {
      content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred while upgrading your tech.`,
    });
  }
}

/**
* Handles the disguise command.
*/
async function handleDisguise(ctx) {
  try {
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const alien = await Alien.findOne({
      userId
    });
    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 **${getUsername(ctx)}**, you need to join the cosmic agenda first! Use \`alien join\`.`
      });
    }

    const newDisguise = disguises[Math.floor(Math.random() * disguises.length)];
    alien.disguise = newDisguise;
    await alien.save();
    return replyOrSend(ctx, {
      content: randomResponse([
        `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your disguise is now updated to <:conqueror:1336360322516123669> **${newDisguise}**. Blend in and hide your cosmic origins! 🍷`,
        `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, you've morphed into a <:conqueror:1336360322516123669> **${newDisguise}**. Now go forth and infiltrate! 🍷`,
        `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your new identity as a <:conqueror:1336360322516123669> **${newDisguise}** is set. The humans won't suspect a thing! 🍷`
      ])
    });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx, {
      content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred while updating your disguise.`
    });
  }
}

/**
* Handles the manipulate command.
*/
async function handleManipulate(ctx) {
  try {
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const alien = await Alien.findOne({
      userId
    });
    if (!alien) {
      return replyOrSend(ctx, {
        content: `👽 **${getUsername(ctx)}**, you must join the cosmic collective first! Use \`alien join\`.`
      });
    }

    const FailureResponse = randomResponse([
      `<:checkbox_cross:1388858904095625226> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your _attempt to manipulate the human economy_ has fizzled out.\n☄️ 🌌 The cosmic balance remains intact. 👾`,
      `<:checkbox_cross:1388858904095625226> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your _manipulation_ failed!\n☄️ 🌌 The universe chuckles at your misfortune. 👾`,
      `<:checkbox_cross:1388858904095625226> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your _economic meddling_ was thwarted!\n☄️ 🌌 Better luck next time. 👾`,
      `<:checkbox_cross:1388858904095625226> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your _interference_ in the cosmic order has failed.\n☄️ 🌌 The universe sighs in amusement. 👾`,
      `<:checkbox_cross:1388858904095625226> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your _plan_ has crumbled like stardust.\n☄️ 🌌 The cosmos watches in quiet amusement. 👾`,
      `<:checkbox_cross:1388858904095625226> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your _devious plot_ has been undone.\n☄️ 🌌 The universe remains unshaken. 👾`
    ]);

    const randomAbility = alien.abilities[Math.floor(Math.random() * alien.abilities.length)]
    let randomNumber = Math.random() + (randomAbility.manipulationRate ? Math.min(0.18, randomAbility.manipulationRate / 10): 0);
    const success = randomNumber > 0.25;
    if (!success) {

      const failedContainer = new ContainerBuilder()
      .setAccentColor(0xef7f7f)
      .addSectionComponents(
        section => section
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(FailureResponse)
        )
        .setThumbnailAccessory(
          thumbnail => thumbnail
          .setDescription('Manipulate')
          .setURL("https://harshtiwari47.github.io/kasiko-public/images/manipulate.png")
        )
      );

      return replyOrSend(ctx, {
        components: [failedContainer],
        flags: MessageFlags.IsComponentsV2
      });
    }
    const resourceGain = 25 + (randomAbility.resourcesCollection ? randomAbility.resourcesCollection: 0);
    alien.resources += resourceGain;
    alien.influence += 1;
    alien.manipulations += 1;
    let extraMessage = "";

    if (Math.random() > 0.75) {
      let randomItem = inventory[`${Object.keys(inventory)[Math.floor(Math.random() * Object.keys(inventory).length)]}`];
      let findIndex = alien.inventory.findIndex(item => randomItem.name.toLowerCase() === item.itemName.toLowerCase());

      if (findIndex === -1) {
        alien.inventory.push({
          itemName: randomItem.name,
          quantity: 1
        });
      } else {
        alien.inventory[findIndex].quantity += 1;
      }

      extraMessage = `💥 You hunted down a special resource: **${randomItem.emoji} ${randomItem.name}**! Now, you can sway human minds with a mere glance.`;
    }

    await alien.save();

    const successMessage = randomResponse([
      `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, with masterful subtlety, you gained : <:aliens_resource:1335537435341226024> ***\`${resourceGain} resources\`***\n<:aliens_crown:1336345903048560640>`,
      `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your cunning maneuver has earned you : <:aliens_resource:1335537435341226024> ***\`${resourceGain} resources\`***\n<:aliens_crown:1336345903048560640>`,
      `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your precision and wit have rewarded you with : <:aliens_resource:1335537435341226024> ***\`${resourceGain} resources\`***\n<:aliens_crown:1336345903048560640>`,
      `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, your skillful planning has netted you : <:aliens_resource:1335537435341226024> ***\`${resourceGain} resources\`***\n<:aliens_crown:1336345903048560640>`,
      `<:performing_arts:1391676098026274826> 🗯️ <:aliens_nano:1336345303212752979> **${alien.name}**, with perfect timing, you acquired : <:aliens_resource:1335537435341226024> ***\`${resourceGain} resources\`***\n<:aliens_crown:1336345903048560640>`
    ]);

    const successContainer = new ContainerBuilder()
    .setAccentColor(0x469473)
    .addSectionComponents(
      section => section
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(successMessage)
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
        .setDescription('Manipulate')
        .setURL("https://harshtiwari47.github.io/kasiko-public/images/manipulate.png")
      )
    )
    .addTextDisplayComponents(
      txt => txt.setContent(`-# <:aliens_ability:1336346125791137855> ***ABILITY*** : **${randomAbility.name}**\n-# ✧.⋆˚‧₊˚ ⋅ ‧₊˚⁺₊❅. 🌌\n${extraMessage}`)
    )

    return replyOrSend(ctx, {
      components: [successContainer],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx, {
      content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, something went wrong while manipulating the economy.`
    });
  }
}

/**
* Simulates a battle between two aliens.
*
* @param {object} ctx - The command context.
* @param {object} alien - The challenger (an Alien document).
* @param {object} opponent - The opponent (an Alien document or an AI object).
*/
async function simulateBattle(ctx, alien, opponent) {
  // Rare events that can happen with some probability each round
  const rareEvents = [{
    description:
    "A rogue airship appears out of nowhere and blasts the battlefield, striking both sides for 5 damage!",
    effect: (userHP, oppHP) => ({
      userHP: userHP - 5,
      oppHP: oppHP - 5,
    }),
  },
    {
      description:
      "A cosmic storm rages briefly, causing both fighters to lose 3 health!",
      effect: (userHP, oppHP) => ({
        userHP: userHP - 3,
        oppHP: oppHP - 3,
      }),
    },
    {
      description:
      "A traveling space merchant drops health kits by mistake—both fighters regain 5 health!",
      effect: (userHP, oppHP) => ({
        userHP: userHP + 5,
        oppHP: oppHP + 5,
      }),
    },
  ];

  // Attack descriptions
  const attackMoves = [
    "fires a plasma beam",
    "launches an energy pulse",
    "unleashes a cosmic ray",
    "strikes with a neutron burst",
    "fires a gravity cannon",
    "charges up a dark matter blast",
  ];

  // Helper to generate a health bar with a percentage indicator
  function generateHealthBar(hp, maxHP) {
    const totalBars = 5;
    const effectiveHP = Math.max(0, hp);
    const filledBars = Math.round((effectiveHP / maxHP) * totalBars);
    const percentage = Math.round((effectiveHP / maxHP) * 100);
    return (
      "🟩".repeat(filledBars) +
      "⬜".repeat(totalBars - filledBars) +
      ` ${percentage}%`
    );
  }

  // Defer reply if needed
  try {
    if (
      !ctx.author &&
      !ctx.deferred &&
      !ctx.replied &&
      typeof ctx.deferReply === "function"
    ) {
      await ctx.deferReply();
    }
  } catch (err) {
    console.error("Unable to defer reply:", err);
  }

  try {
    // Create the initial embed
    const battleEmbed = new EmbedBuilder()
    .setTitle(`🛸 𝑪𝒐𝒎𝒊𝒄 𝑪𝒍𝒂𝒔𝒉: ${alien.name} vs ${opponent.name}`)
    .setDescription(
      "Prepare for battle, cosmic wanderer!\n\n🌟 **May the stars align in your favor.**"
    );

    // Send the initial embed and save the returned message for later edits
    const battleMessage = await replyOrSend(ctx, {
      embeds: [battleEmbed]
    });
    // Create a variable to accumulate the battle log text
    let battleLog = battleEmbed.data.description || "";

    // Save original maximum health for percentage calculations
    const userMaxHP = alien.battleStats.health;
    const oppMaxHP = opponent.battleStats.health;
    let userHP = userMaxHP;
    let oppHP = oppMaxHP;

    // Simulate 3 rounds
    for (let round = 1; round <= 3; round++) {
      battleLog = `\n**♨️ 𝙍𝙊𝙐𝙉𝘿 ${round} - Let the battle begin!**\n\n`;

      // 1) Possibly trigger a rare event
      if (Math.random() < 0.2) {
        // 20% chance for a rare event
        const event =
        rareEvents[Math.floor(Math.random() * rareEvents.length)];
        battleLog += `**[RARE EVENT]** ${event.description}\n\n`;
        const adjusted = event.effect(userHP, oppHP);
        userHP = adjusted.userHP;
        oppHP = adjusted.oppHP;
      }

      // 2) Challenger's attack
      if (Math.random() < opponent.battleStats.agility / 100) {
        battleLog += `❗ **${opponent.name} dodges** ${alien.name}'s attack at the last second! No damage taken.\n`;
      } else {
        let userAttackRoll =
        alien.battleStats.attack + Math.floor(Math.random() * 10);
        let oppDefenseRoll =
        opponent.battleStats.defense + Math.floor(Math.random() * 5);
        let damageToOpp = Math.max(1, userAttackRoll - oppDefenseRoll);
        let attackMove =
        attackMoves[Math.floor(Math.random() * attackMoves.length)];

        if (Math.random() < alien.battleStats.critChance) {
          damageToOpp *= 2;
          battleLog += `💥 **Critical Strike!** ${alien.name} **${attackMove}** with stellar force!\n`;
        } else {
          battleLog += `<:lighting_icon_kasiko:1354393463931670568> **${alien.name} ${attackMove}!**\n`;
        }

        oppHP -= damageToOpp;
        battleLog += ` <:aliens_nano:1336345303212752979> **${alien.name} deals ${damageToOpp} damage** to ${opponent.name}.\n`;
        battleLog +=
        oppHP > 0
        ? `(${opponent.name}: ${generateHealthBar(oppHP, oppMaxHP)})\n`: `💀 **${opponent.name} is obliterated!**\n`;
      }

      // Check if the opponent has been defeated
      if (oppHP <= 0) {
        battleEmbed.setDescription(battleLog);
        await battleMessage.edit({
          embeds: [battleEmbed]
        });
        break;
      }

      battleLog += `\n`;

      // 3) Opponent's counterattack
      if (Math.random() < alien.battleStats.agility / 100) {
        battleLog += `❗ **${alien.name} dodges** ${opponent.name}'s counterattack! No damage taken.\n`;
      } else {
        let oppAttackRoll =
        opponent.battleStats.attack + Math.floor(Math.random() * 10);
        let userDefenseRoll =
        alien.battleStats.defense + Math.floor(Math.random() * 5);
        let damageToUser = Math.max(1, oppAttackRoll - userDefenseRoll);
        let attackMove =
        attackMoves[Math.floor(Math.random() * attackMoves.length)];

        if (Math.random() < opponent.battleStats.critChance) {
          damageToUser *= 2;
          battleLog += `💥 **Counter Critical!** ${opponent.name} **${attackMove}** with devastating force!\n`;
        } else {
          battleLog += `<:lighting_icon_kasiko:1354393463931670568> **${opponent.name} ${attackMove}!**\n`;
        }

        userHP -= damageToUser;
        battleLog += `<:lighting_icon_kasiko:1354393463931670568> **${opponent.name} deals ${damageToUser} damage** to ${alien.name}.\n`;
        battleLog +=
        userHP > 0
        ? `(${alien.name}: ${generateHealthBar(userHP, userMaxHP)})\n`: `💀 **${alien.name} has fallen!**\n`;
      }

      // Update the embed for the current round
      battleEmbed.setDescription(battleLog);
      await battleMessage.edit({
        embeds: [battleEmbed]
      });

      // If the user has been defeated, exit the loop
      if (userHP <= 0) break;

      // Optional delay before the next round for dramatic effect
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // 4th round – Final Outcome
    battleLog = `\n**<:conqueror:1336360322516123669> 𝘽𝘼𝙏𝙏𝙇𝙀 𝙊𝙐𝙏𝘾𝙊𝙈𝙀**\n\n`;
    let resultMessage = "";
    if (userHP <= 0) {
      // The user lost
      const penalty = Math.floor(Math.random() * 30) + 30;
      alien.resources = Math.max(0, alien.resources - penalty);
      resultMessage = `💀 **Defeat...** ${opponent.name} proved too powerful.\n<:warning:1366050875243757699> **${alien.name} lost ${alienResEmo} ***${penalty}*** resources.**`;

      // If opponent is not AI, give them some reward
      if (opponent.userId !== "AI" && typeof opponent.save === "function") {
        opponent.resources += Math.floor(penalty / 2);
        opponent.influence += 1;
        await opponent.save();
      }
    } else if (oppHP <= 0) {
      // The user won
      const reward = Math.floor(Math.random() * 50) + 50;
      alien.resources += reward;
      alien.influence += 1;
      resultMessage = `<:trophy:1352897371595477084> **Victory!** ${alien.name} has conquered the battlefield!\n<:gift:1350355327018729517> **Reward:** ${alienResEmo} ***${reward}*** resources gained!`;

      // If opponent is not AI, penalize them
      if (opponent.userId !== "AI" && typeof opponent.save === "function") {
        opponent.resources = Math.max(
          0,
          opponent.resources - Math.floor(reward / 2)
        );
        opponent.influence = Math.max(1, opponent.influence - 1);
        await opponent.save();
      }
    } else {
      // Both are still alive; compare remaining HP
      if (userHP === oppHP) {
        resultMessage =
        "🤝 **It's a Draw!** Both sides held strong amid the cosmic chaos.";
      } else if (userHP > oppHP) {
        const reward = Math.floor(Math.random() * 50) + 50;
        alien.resources += reward;
        alien.influence += 1;
        resultMessage = `<:trophy:1352897371595477084> **Victory by Endurance!**\n ***${alien.name}*** survives with more HP!\n<:gift:1350355327018729517> **Reward:** ${alienResEmo} ***${reward}*** resources gained!`;

        if (opponent.userId !== "AI" && typeof opponent.save === "function") {
          opponent.resources = Math.max(
            0,
            opponent.resources - Math.floor(reward / 2)
          );
          opponent.influence = Math.max(1, opponent.influence - 1);
          await opponent.save();
        }
      } else {
        const penalty = Math.floor(Math.random() * 30) + 30;
        alien.resources = Math.max(0, alien.resources - penalty);
        resultMessage = `💀 **Defeat...** __${opponent.name}__ overpowers __${alien.name}__ with higher endurance.\n<:warning:1366050875243757699> **${alien.name} lost ${alienResEmo} ${penalty} resources.**`;

        if (opponent.userId !== "AI" && typeof opponent.save === "function") {
          opponent.resources += Math.floor(penalty / 2);
          opponent.influence += 1;
          await opponent.save();
        }
      }
    }

    resultMessage += `\n\nꨄ︎ **Final Health Status:**\n`;
    resultMessage += `**${alien.name}**\n${generateHealthBar(userHP, userMaxHP)}\n`;
    resultMessage += `**${opponent.name}**\n${generateHealthBar(oppHP, oppMaxHP)}`;
    battleLog += resultMessage;
    battleEmbed.setDescription(battleLog);
    await battleMessage.edit({
      embeds: [battleEmbed]
    });

    // Save changes to the user
    await alien.save();
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx, {
      content: `<:checkbox_cross:1388858904095625226> **${alien.name}**, an error occurred during battle simulation.`,
    });
  }
}

/**
* Handles the battle command.
* If an additional argument is provided (a user mention), this initiates a challenge battle.
* For a random battle, the user is prompted to confirm before proceeding.
*/
async function handleBattle(ctx, args) {
  try {
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    const challenger = await Alien.findOne({
      userId
    });
    if (!challenger) {
      return replyOrSend(ctx, {
        content: `👾 **${getUsername(ctx)}**, you must join the cosmic collective first! Use \`alien join\`.`
      });
    }

    // Enforce a minimum resource requirement for battle.
    if (challenger.resources < 30) {
      return replyOrSend(ctx, {
        content: `💀 **${challenger.name}**, you need at least **30 resources** to engage in battle.`
      });
    }

    // If a challenge target is provided, follow the existing challenge flow.
    if (args && args.length > 1) {
      const mention = args[1];
      const match = mention.match(/^<@!?(\d+)>$/);
      if (!match) {
        return replyOrSend(ctx, {
          content: `<:checkbox_cross:1388858904095625226> **${challenger.name}**, please mention a valid user to challenge.`
        });
      }
      const targetId = match[1];
      if (targetId === userId) {
        return replyOrSend(ctx, {
          content: `<:checkbox_cross:1388858904095625226> **${challenger.name}**, you cannot challenge yourself!`
        });
      }
      const target = await Alien.findOne({
        userId: targetId
      });
      if (!target) {
        return replyOrSend(ctx, {
          content: `<:checkbox_cross:1388858904095625226> **${challenger.name}**, the challenged user is not part of the cosmic collective.`
        });
      }

      // Send a challenge confirmation to the target.
      const challengeEmbed = new EmbedBuilder()
      .setTitle("⚔️ Battle Challenge")
      .setDescription(
        `**${challenger.name}** has challenged **${target.name}** to an intergalactic duel!\n${target.name}, do you accept the challenge?`
      )
      .setColor(0xe74c3c)
      .setFooter({
        text: "Challenge will expire in 30 seconds."
      });

      const challengeButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId(`challenge_accept_${challenger.userId}_${target.userId}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
        .setCustomId(`challenge_decline_${challenger.userId}_${target.userId}`)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger)
      );

      const challengeMessage = await replyOrSend(ctx, {
        embeds: [challengeEmbed],
        components: [challengeButtons]
      });

      // Create a collector to wait for the challenged user’s response.
      const filter = (i) =>
      i.customId.startsWith("challenge_") && i.user.id === target.userId;
      const collector = challengeMessage.createMessageComponentCollector({
        filter,
        time: 30000,
        max: 1
      });

      collector.on("collect", async (i) => {
        if (i.customId.startsWith("challenge_accept")) {
          await i.update({
            content: `⚔️ **${target.name}** accepted the challenge! The cosmic battle begins...`,
            components: []
          });
          await simulateBattle(ctx, challenger, target);
        } else {
          await i.update({
            content: `<:checkbox_cross:1388858904095625226> **${target.name}** declined the challenge. The duel has been canceled.`,
            components: []
          });
        }
      });

      collector.on("end",
        (collected) => {
          if (collected.size === 0) {
            challengeMessage.edit({
              content: `⌛ Challenge expired. **${target.name}** did not respond in time.`,
              components: []
            });
          }
        });
      return;
    } else {
      // For a random battle (no target provided)
      let opponents = await Alien.find({
        userId: {
          $ne: userId
        }
      });
      let opponent;
      if (opponents.length === 0) {
        opponent = {
          userId: "AI",
          name: "The Void",
          disguise: "Enigmatic Presence",
          influence: 5,
          resources: 200,
          tech: 75,
          energy: 75,
          abilities: ["Zero Gravity"],
          manipulations: 3,
          battleStats: {
            health: 120,
            attack: 18,
            defense: 12,
            agility: 12,
            critChance: 0.15
          }
        };
      } else {
        opponent = opponents[Math.floor(Math.random() * opponents.length)];
      }
      await simulateBattle(ctx, challenger, opponent);
      return;
    }
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx,
      {
        content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred while initiating the battle.`
      });
  }
}

/**
* Handles text-based commands.
*/
async function handleTextCommand(ctx, args) {
  try {

    const specialCommands = [
      "manipulate",
      "mp",
      "harvest",
      "har",
      "produce",
      "exchange",
      "ex",
      "inventory",
      "inv",
      "abilities",
      "ability"
    ];

    let subcommand;
    // If the first argument is one of the special commands, use it directly.
    if (args[0] && specialCommands.includes(args[0].toLowerCase())) {
      subcommand = args[0].toLowerCase();
      if (subcommand === "manipulate") return await handleManipulate(ctx);
      if (subcommand === "harvest") return await handleHarvest(ctx);
      if (subcommand === "produce") return await handleEnergyExchange(ctx, args[1]);
      if (subcommand === "ex") return await handleEnergyExchange(ctx, args[1]);
      if (subcommand === "exchange") return await handleEnergyExchange(ctx, args[1]);
      if (subcommand === "inventory") return await handleInventoryList(ctx);
      if (subcommand === "inv") return await handleInventoryList(ctx);
      if (subcommand === "abilities") return await handleAbilitiesList(ctx);
      if (subcommand === "ability") return await handleAbilitiesList(ctx);
    } else {
      // Otherwise, remove the command name.
      args.shift();
      subcommand = args.length > 0 ? args[0].toLowerCase(): "profile";
    }

    switch (subcommand) {
      case "profile":
      case "p":
        return await handleProfile(ctx);
      case "join":
        return await handleJoin(ctx);
      case "disguise":
        return await handleDisguise(ctx);
      case "manipulate":
      case "mp":
        return await handleManipulate(ctx);
      case "harvest":
      case "har":
        return await handleHarvest(ctx);
      case "ability":
      case "abilities":
      case "a":
        return await handleAbilitiesList(ctx);
      case "inventory":
      case "i":
      case "inv":
        return await handleInventoryList(ctx);
      case "produce":
      case "prod":
      case "exchange":
      case "ex":
      case "e":
        return await handleEnergyExchange(ctx,
          args[1]);
      case "upgrade":
      case "up":
        return await handleUpgrade(ctx);
      case "battle":
      case "b":
        return await handleBattle(ctx,
          args);
      case "help":
        return await handleAlienHelp(ctx);
      default:
        return await handleProfile(ctx);
    }
  } catch (error) {
    console.error(error);
    return replyOrSend(ctx,
      {
        content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred processing your command.`
    });
}
}

/**
* Handles button interactions.
*/
async function handleButtonInteraction(ctx) {
try {
if (!ctx.customId) {
return replyOrSend(ctx, {
content: `<:checkbox_cross:1388858904095625226> Invalid button interaction!`
});
}

// Ensure customId follows the expected format
if (!ctx.customId.startsWith("alien_")) {
return replyOrSend(ctx, {
content: `<:checkbox_cross:1388858904095625226> Invalid button ID format!`
});
}

// Extract subcommand from customId
const subcommand = ctx.customId.slice(6).toLowerCase(); // 'alien_' has 6 characters
console.log(subcommand);

switch (subcommand) {
case "profile":
return await handleProfile(ctx);
case "join":
return await handleJoin(ctx);
case "disguise":
return await handleDisguise(ctx);
case "manipulate":
return await handleManipulate(ctx);
case "harvest":
return await handleHarvest(ctx);
case "upgrade":
return await handleUpgrade(ctx);
case "battle":
return await handleBattle(ctx, []); // No extra args from a button press.
default:
return replyOrSend(ctx, {
content: `<:checkbox_cross:1388858904095625226> Unknown button command!`
});
}
} catch (error) {
console.error("Button Interaction Error:", error);
return replyOrSend(ctx, {
content: `<:checkbox_cross:1388858904095625226> **${getUsername(ctx)}**, an error occurred while processing your button interaction.`
});
}
}

/**
* Main handler – distinguishes between text commands and interactions.
*/
async function handleAlienCommands(ctx, args) {
if (ctx.customId) {
// Button interaction.
return handleButtonInteraction(ctx);
} else {
// Assume text or slash command.
return handleTextCommand(ctx, args);
}
}

export default {
name: "alien",
description:
"Embrace your alien destiny, infiltrate humanity, and wage interstellar warfare.",
aliases: ["infiltrate",
"a",
"manipulate",
"mp",
"harvest",
"har",
"produce",
"exchange",
"ex",
"inv",
"abilities",
"ability"],
args: "<join | profile | disguise | manipulate | harvest | upgrade | battle | help>",
example: [
"alien join",
"alien profile",
"alien disguise",
"alien manipulate",
"alien inventory",
"alien abilities",
"alien produce 10",
"alien harvest",
"alien upgrade",
"alien battle @target",
"alien help"
],
emoji: "<:aliens_nano:1336345303212752979>",
related: ["profile",
"battle",
"zombie"],
cooldown: 10000,
category: "🍬 Explore",
// Execute receives either a message (text command) or an interaction.
execute: (args, ctx) => handleAlienCommands(ctx, args)
};