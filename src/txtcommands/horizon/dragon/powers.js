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

import Dragon from '../../../../models/Dragon.js';
import redisClient from '../../../../redis.js';
import Helper from '../../../../helper.js';

import {
  getUserDataDragon,
  saveUserData
} from "../dragon.js"

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Load all dragon types from JSON
const dragonTypesPath = path.join(__dirname, '../../../../data/dragons.json');
const dragonTypes = JSON.parse(fs.readFileSync(dragonTypesPath, 'utf-8'));

// powers
const powerspath = path.join(__dirname, './powers.json');
const powerTypes = JSON.parse(fs.readFileSync(powerspath, 'utf-8'));

let goldIcon = `<:gold:1320978185084473365>`
let silverIcon = `<:silver:1320978175563661352>`
let bronzeIcon = `<:bronze:1320978165702725714>`

async function myMetals(message) {
  const {
    id,
    username
  } = message.author;

  const userData = await getUserDataDragon(id);

  if (!userData.metals) {
    userData.metals.gold = 0;
    userData.metals.silver = 0;
    userData.metals.bronze = 0;

    await saveUserData(id, userData)
  }

  const embed = new EmbedBuilder()
  .setColor("#fbe789")
  .setDescription(
    `## ${goldIcon} **GOLD**: ${userData.metals.gold}\n` +
    `## ${silverIcon} **SILVER**: ${userData.metals.silver}\n` +
    `## ${bronzeIcon} **BRONZE**: ${userData.metals.bronze}`
  )
  .setAuthor({
    name: username + "'s metals", iconURL: message.author.displayAvatarURL({
      dynamic: true
    })
  })
  .setFooter({
    text: `Metals can be found through Dragon Adventures or mining.`
  });

  return message.channel.send({
    embeds: [embed]
  })
}

async function myPowers(message) {
  try {
    const {
      id,
      username
    } = message.author;
    const userData = await getUserDataDragon(id);

    // Make sure the user has at least one dragon.
    if (!userData.dragons || userData.dragons.length === 0) {
      return message.channel.send(
        `❗ **${username}**, you have no dragons. Use \`dragon summon\` to get started!`
      );
    }

    // If the user has no powers, grant them based on their dragons.
    if (!userData.powers || userData.powers.length === 0) {
      userData.dragons.forEach((dragon) => {
        const chosenType = dragonTypes.find(t => t.id === dragon.typeId);
        if (!userData.powers.some(power => power.typeId === chosenType.strengths[0])) {
          userData.powers.push({
            typeId: chosenType.strengths[0],
            level: 1
          });
        }
        if (!userData.powers.some(power => power.typeId === chosenType.strengths[1])) {
          userData.powers.push({
            typeId: chosenType.strengths[1],
            level: 1
          });
        }
      });
      await saveUserData(id,
        userData);
    }

    if (userData.powers.length === 0) {
      return message.channel.send(
        `❗ **${username}**, you don't have any powers available.`
      );
    }

    let currentPage = 1;
    let totalPages = userData.powers.length;
    const userName = username;
    const userAvatar = message.author.displayAvatarURL({
      dynamic: true
    });

    // A helper function that builds an embed for the currently viewed power.
    const generateEmbed = (page) => {
      const power = userData.powers[page - 1];
      const chosenType = powerTypes.find(t => t.name === power.typeId);
      if (!chosenType) {
        return new EmbedBuilder()
        .setDescription('❗ Unknown power data.')
        .setColor("#ff0000");
      }
      const description =
      `# ${chosenType.emoji} ${chosenType.name}\n` +
      `- **${chosenType.description}**\n` +
      `**ID**: ${chosenType.id}\n` +
      `**LEVEL**: ${power.level}\n` +
      `**DAMAGE**: ${chosenType.dmg * power.level}\n` +
      `**HEAL**: ${chosenType.heal * power.level}\n` +
      `**DEFENCE**: ${chosenType.defence * power.level}\n` +
      `**NEXT LVL COST**: ${chosenType.costType === "gold" ? goldIcon:
      chosenType.costType === "silver" ? silverIcon: bronzeIcon} **${chosenType.cost * power.level}**\n`;
      return new EmbedBuilder()
      .setDescription(description)
      .setColor("#0c0d16")
      .setAuthor({
        name: `${userName}'s powers`, iconURL: userAvatar
      })
    };

    // A helper function to build the four buttons.
    const generateComponents = (page, total) => {
      return [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('prevPage')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
          new ButtonBuilder()
          .setCustomId('nextPage')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === total),
          new ButtonBuilder()
          .setCustomId('upgradePower')
          .setLabel('Upgrade')
          .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
          .setCustomId('viewMetals')
          .setLabel('View Metals')
          .setStyle(ButtonStyle.Secondary)
        )
      ];
    };

    // Send the initial embed message with buttons.
    const embedMessage = await message.channel.send({
      embeds: [generateEmbed(currentPage)],
      components: generateComponents(currentPage, totalPages)
    });

    // Create a collector that listens for button clicks for 78 seconds.
    const filter = (interaction) => {
      return interaction.user.id === message.author.id &&
      ['prevPage',
        'nextPage',
        'upgradePower',
        'viewMetals'].includes(interaction.customId);
    };

    const collector = embedMessage.createMessageComponentCollector({
      filter,
      time: 78000,
      componentType: ComponentType.Button
    });

    collector.on('collect', async (interaction) => {
      try {
        // Handle page navigation.
        if (interaction.customId === 'prevPage') {
          currentPage--;
          await interaction.update({
            embeds: [generateEmbed(currentPage)],
            components: generateComponents(currentPage, totalPages)
          });
        } else if (interaction.customId === 'nextPage') {
          currentPage++;
          await interaction.update({
            embeds: [generateEmbed(currentPage)],
            components: generateComponents(currentPage, totalPages)
          });
        }
        // Handle the "Upgrade" button.
        else if (interaction.customId === 'upgradePower') {
          // Defer the update immediately.
          await interaction.deferUpdate();

          // (Re)validate that the user has dragons and powers.
          if (!userData.dragons || userData.dragons.length === 0) {
            await interaction.followUp({
              content: '❗ You have no dragons. Use `dragon summon` to get started!',
              ephemeral: true
            });
            return;
          }
          if (!userData.powers || userData.powers.length === 0) {
            await interaction.followUp({
              content: '❗ You don’t have any powers. Use `dragon summon` to get started!',
              ephemeral: true
            });
            return;
          }

          // Grab the power currently being viewed.
          const currentPower = userData.powers[currentPage - 1];
          const chosenType = powerTypes.find(t => t.name === currentPower.typeId);
          if (!chosenType) {
            await interaction.followUp({
              content: '❗ Unknown power. No power was found with this ID!',
              ephemeral: true
            });
            return;
          }

          const metalCost = chosenType.cost * currentPower.level;
          if (userData.metals[chosenType.costType] < metalCost) {
            await interaction.followUp({
              content: `❗ **${username}**, you don't have ${chosenType.costType === "gold" ? goldIcon:
              chosenType.costType === "silver" ? silverIcon: bronzeIcon} **${metalCost}**!`,
              ephemeral: true
            });
            return;
          }

          // Deduct the metal cost and upgrade the power.
          userData.metals[chosenType.costType] -= metalCost;
          currentPower.level += 1;
          await saveUserData(message.author.id, userData);

          // Let the user know the upgrade succeeded.
          await interaction.followUp({
            content: `🎉 Congratulations, **${username}**! Your **${chosenType.emoji} ${chosenType.name}** has been upgraded to level ${currentPower.level}!`,
            ephemeral: true
          });

          // Update the embed message to reflect the new power level.
          await embedMessage.edit({
            embeds: [generateEmbed(currentPage)],
            components: generateComponents(currentPage, totalPages)
          });
        }
        // Handle the "View Metals" button.
        else if (interaction.customId === 'viewMetals') {
          // Defer the reply (ephemeral).
          await interaction.deferReply({
            ephemeral: true
          });
          // Make sure the metals property exists.
          if (!userData.metals) {
            userData.metals = {
              gold: 0,
              silver: 0,
              bronze: 0
            };
            await saveUserData(message.author.id, userData);
          }
          const metalsEmbed = new EmbedBuilder()
          .setColor("#fbe789")
          .setDescription(
            `## ${goldIcon} **GOLD**: ${userData.metals.gold}\n` +
            `## ${silverIcon} **SILVER**: ${userData.metals.silver}\n` +
            `## ${bronzeIcon} **BRONZE**: ${userData.metals.bronze}`
          )
          .setAuthor({
            name: `${username}'s metals`,
            iconURL: userAvatar
          })
          .setFooter({
            text: `Metals can be found through Dragon Adventures or mining.`
          });
          await interaction.editReply({
            embeds: [metalsEmbed]
          });
        }
      } catch (err) {
        console.error(err);
        try {
          if (!interaction.replied) {
            await interaction.followUp({
              content: 'An error occurred. Please try again later.',
              ephemeral: true
            });
          }
        } catch (error) {
          console.error('Failed to send error message:', error);
        }
      }
    });

    collector.on('end',
      async () => {
        try {
          // Disable all buttons after the timeout.
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('prevPage')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId('nextPage')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId('upgradePower')
            .setLabel('Upgrade')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId('viewMetals')
            .setLabel('View Metals')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
          );
          await embedMessage.edit({
            components: [disabledRow]
          });
        } catch (err) {
          console.error('Error disabling buttons:', err);
        }
      });
  } catch (err) {
    console.error(err);
    message.channel.send('An error occurred while displaying your powers. Please try again later.');
  }
}

async function upgradePower(pid, message) {
  const {
    id,
    username
  } = message.author;

  const userData = await getUserDataDragon(id);

  if (!userData.dragons) userData.dragons = []

  if (userData.dragons.length === 0) {
    return message.channel.send(`❗ **${username}**, you have no dragons. Use \`dragon summon\` to get started!`);
  }

  if (userData.powers.length === 0) {
    return message.channel.send(`❗ **${username}**,  you don't have any power or dragons. Use \`dragon summon\` to get started!`);
  }

  const chosenType = powerTypes.find(t => t.id === pid);

  if (!chosenType) {
    return message.channel.send(`❗Unknown power ID. No power was found with this ID!`);
  }

  const powerSelected = userData.powers.find(power => power.typeId === chosenType.name);

  if (!powerSelected) {
    return message.channel.send(`❗ None of your dragons have this power!`);
  }

  let metalCost = chosenType.cost * powerSelected.level;

  if (userData.metals[chosenType.costType] < metalCost) {
    return message.channel.send(`❗ **${username}**, you don't have ${chosenType.costType === "gold" ? goldIcon: chosenType.costType === "silver" ? silverIcon: bronzeIcon} **${metalCost}**!`);
  }

  userData.metals[chosenType.costType] -= metalCost;
  powerSelected.level += 1;

  await saveUserData(id, userData);

  return message.channel.send(`🎉 Congratulations, **${username}**! Your **${chosenType.emoji} ${chosenType.name}** has been upgraded to level ${powerSelected.level}!`);
}

export async function randomMetalsReward(userId) {
  let winningMetals = Helper.randomInt(2, 10);
  let metalWinMessage = ``;
  let metalWinProb = Math.random();
  const userData = await getUserDataDragon(userId);

  if (metalWinProb > 0.75) {
    userData.metals.gold += winningMetals;
    metalWinMessage = ` ${goldIcon} : **+${winningMetals}**`;
  } else if (metalWinProb > 0.40) {
    userData.metals.silver += winningMetals;
    metalWinMessage = ` ${silverIcon} : **+${winningMetals}**`;
  } else {
    userData.metals.bronze += winningMetals;
    metalWinMessage = ` ${bronzeIcon} : **+${winningMetals}**`;
  }

  await saveUserData(userId, userData);

  return metalWinMessage;
}

const Powers = {
  myMetals,
  myPowers,
  upgradePower
}

export default Powers;