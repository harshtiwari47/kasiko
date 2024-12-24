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
  const {
    id,
    username
  } = message.author;

  const userData = await getUserDataDragon(id);
  
  if (!userData.dragons) userData.dragons = []

  if (userData.dragons.length === 0) {
    return message.channel.send(`❗ You have no dragons. Use \`dragon summon\` to get started!`);
  }

  if (userData.powers.length === 0) {
    userData.dragons.forEach((dragon, index) => {
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
    })

    await saveUserData(id,
      userData);
  }

  let powersDescriptions = [];

  userData.powers.forEach((power, index) => {
    const chosenType = powerTypes.find(t => t.name === power.typeId);

    let description = `# ${chosenType.emoji} ${chosenType.name}\n` +
    `-# **${chosenType.description}**\n` +
    `**ID**: ${chosenType.id}\n` +
    `**LEVEL**: ${power.level}\n` +
    `**DAMAGE**: ${chosenType.dmg * power.level}\n` +
    `**HEAL**: ${chosenType.heal * power.level}\n` +
    `**DEFENCE**: ${chosenType.defence * power.level}\n` +
    `**NEXT LVL COST**: ${chosenType.costType === "gold" ? goldIcon: chosenType.costType === "silver" ? silverIcon: bronzeIcon} **${chosenType.cost * power.level}**\n`;

    powersDescriptions.push(description);
  });

  let currentPage = 1;
  let totalPages = userData.powers.length;

  const generateEmbed = (currentPage) => {
    return new EmbedBuilder()
    .setDescription(powersDescriptions[currentPage - 1])
    .setColor("#0c0d16")
    .setAuthor({
      name: username + "'s metals",
      iconURL: message.author.displayAvatarURL({
        dynamic: true
      })
    })
    .setFooter({
      text: `Use \`dragon power upgrade <id>\` for an upgrade!`
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
        .setDisabled(currentPage === 1),
        new ButtonBuilder()
        .setCustomId('nextPage')
        .setLabel('Next')
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
        embeds: [generateEmbed(currentPage)],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('prevPage')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 1),
            new ButtonBuilder()
            .setCustomId('nextPage')
            .setLabel('Next')
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

async function upgradePower(pid, message) {
  const {
    id,
    username
  } = message.author;

  const userData = await getUserDataDragon(id);
  
  if (!userData.dragons) userData.dragons = []

  if (userData.dragons.length === 0) {
    return message.channel.send(`❗ You have no dragons. Use \`dragon summon\` to get started!`);
  }

  if (userData.powers.length === 0) {
    return message.channel.send(`❗ You don't have any power or dragons. Use \`dragon summon\` to get started!`);
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
    return message.channel.send(`❗ **${username}, you don't have ${chosenType.costType === "gold" ? goldIcon: chosenType.costType === "silver" ? silverIcon: bronzeIcon} **${metalCost}**!`);
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