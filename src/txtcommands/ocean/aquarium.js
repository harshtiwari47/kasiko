import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import {
  getUserData,
  updateUser,
  readAquaticData,
} from '../../../database.js';

import {
  getUserFishData,
  updateFishUser
} from './data.js';

import {
  checkPassValidity
} from "../explore/pass.js";

import {
  Helper
} from '../../../helper.js';

import {
  createAquariumImage
} from './aquariumImage.js';

const aquaData = readAquaticData();

export async function viewCollection(interactionUserId, context, userDiscordData) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and message
  const userId = userDiscordData?.id;
  try {
    let userFishData = await getUserFishData(userId);
    const userCollection = userFishData.fishes;
    const avatarUrl = userDiscordData?.displayAvatarURL({
      dynamic: true
    });

    if (!isInteraction && context.channel) context = context.channel;

    let collection = [];

    if (userCollection.length === 0) {
      const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setDescription(`<:warning:1366050875243757699> You don't have any 🦦fish!\nTo catch some, you can fish from the ocean or use the following command to start fishing:\n\`kas catch\`\nEnjoy!`);

      if (isInteraction) {
        if (!context.deferred) await context.deferReply();
        return await context.editReply({
          embeds: [embed]
        });
      } else {
        return context.send({
          embeds: [embed]
        });
      }
    } else {
      userCollection.forEach((fish, i) => {
        if (fish.name) {
          let fishDetails = aquaData.filter(item => item.name === fish.name);
          collection.push({
            name: fish.name,
            animals: fish.animals,
            emoji: fishDetails[0].emoji,
            rarity: fishDetails[0].rarity,
            level: fish.level,
            damage: fishDetails[0].damage,
            feedCost: fishDetails[0].feedCost,
            sellAmount: fishDetails[0].sellAmount
          });
        }
      });
    }

    // Split the collection into chunks of 3 fishes per embed
    const chunkedCollection = [];
    for (let i = 0; i < collection.length; i += 3) {
      chunkedCollection.push(collection.slice(i, i + 3));
    }

    // Embeds for each chunk of 3 fishes
    const embeds = chunkedCollection.map((chunk, index) => {
      let embeds = chunk.map((fish, fishIndex) => {
        const embed = new EmbedBuilder()
        .setColor('#6835fe')
        .setThumbnail(`https://cdn.discordapp.com/emojis/${fish.emoji}.png`)

        // Add fish details to embed description
        let description = '';
        let iconRarity = ``;

        if (fish.rarity.substring(0, 1).toUpperCase() === "L") iconRarity = `<:legendary:1323917783745953812>`
        if (fish.rarity.substring(0, 1).toUpperCase() === "U") iconRarity = `<:uncommon:1323917867644882985>`
        if (fish.rarity.substring(0, 1).toUpperCase() === "C") iconRarity = `<:common:1323917805191434240>`
        if (fish.rarity.substring(0, 1).toUpperCase() === "R") iconRarity = `<:rare:1323917826448166923>`

        description += `<:fishing_rod_virtual:1359384731329888368> **${fish.name}** (**${fish.animals}**) \n`;
        description += `**Lvl**: ${fish.level} ${iconRarity}\n-# <:follow_reply:1368224897003946004> **CPF**: <:kasiko_coin:1300141236841086977>${fish.feedCost * fish.animals}\n-# <:reply:1368224908307468408> **CPS** <:kasiko_coin:1300141236841086977>${(fish.sellAmount * fish.level).toLocaleString()}\n\n`;
        embed.setDescription(description.trim());

        if (fishIndex === 0) {
          embed.setAuthor({
            name: `𝐴𝑞𝑢𝑎𝑡𝑖𝑐 𝐶𝑜𝑙𝑙𝑒𝑐𝑡𝑖𝑜𝑛`,
            iconURL: avatarUrl
          })
        }
        // Add the page number to the footer
        if (fishIndex === chunk.length - 1) {
          embed.setFooter({
            text: `${index + 1} / ${chunkedCollection.length} | ᴄᴘꜰ: ᴄᴏꜱᴛ ᴘᴇʀ ꜰᴇᴇᴅ | ᴄᴘꜱ: ᴄᴏꜱᴛ ᴘᴇʀ ꜱᴀʟᴇ`
          });
        }

        return embed
      });

      return embeds;
    });

    let currentPage = 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(chunkedCollection.length === 1),
      new ButtonBuilder()
      .setCustomId('aquarium_view')
      .setLabel('Aquarium 🐠')
      .setStyle(ButtonStyle.Success)
      .setDisabled(false)
    );

    let sentMessage;
    if (isInteraction) {
      if (!context.deferred) await context.deferReply();
      sentMessage = await context.editReply({
        embeds: embeds[currentPage], // Send first embed
        components: [row]
      });
    } else {
      sentMessage = await context.send({
        embeds: embeds[currentPage], // Send first embed
        components: [row]
      });
    }

    const collector = sentMessage.createMessageComponentCollector({
      time: 60000 // 1 minute timeout
    });

    collector.on('collect', async (response) => {

      if (response.user.id !== interactionUserId) {
        await response.reply({
          content: `You are not allowed to perform someone else's command!`,
          ephemeral: true
        });
      }

      if (response.customId === 'next') {
        if (!response.deferred) await response.deferUpdate();
        currentPage++;
      } else if (response.customId === 'prev') {
        if (!response.deferred) await response.deferUpdate();
        currentPage--;
      }

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
        new ButtonBuilder()
        .setCustomId('next')
        .setLabel('▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === embeds.length - 1),
        new ButtonBuilder()
        .setCustomId('aquarium_view')
        .setLabel('Aquarium 🐠')
        .setStyle(ButtonStyle.Success)
        .setDisabled(currentPage === 0 ? false: true)
      );

      if (response.customId === 'aquarium_view') {
        if (!response.deferred) await response.deferReply();
        collector.stop();
        await viewAquarium(response.user.id, response);
      } else {
        response.editReply({
          embeds: embeds[currentPage], // Send updated embed with the current page
          components: [updatedRow]
        });
      }
    });

    collector.on('end',
      () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('aquarium_view')
          .setLabel('Aquarium 🐠')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
        );

        sentMessage.edit({
          components: [disabledRow]
        }).catch(() => {});
      });

  } catch (e) {
    console.error(e);
    if (isInteraction) {
      if (!context.deferred) await context.deferReply();
      return await context.editReply({
        content: "<:warning:1366050875243757699> Something went wrong while visiting **User's Collection**"
      });
    } else {
      return context.send("<:warning:1366050875243757699> Something went wrong while visiting **User's Collection**");
    }
  }
}

export async function viewAquarium(userId,
  context) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and message

  try {
    let userData = await getUserData(userId);
    let userFishData = await getUserFishData(userId);

    const aquarium = userFishData.aquarium || [];

    let totalReward = 0;
    aquarium.forEach(fish => {
      let fishDetails = aquaData.find(fishData => fishData.name.toLowerCase() === fish.toLowerCase());
      let userfishDetails = userFishData.fishes.find(fishData => fishData.name && fishData.name.toLowerCase() === fish.toLowerCase());
      let rarityAmount = 10;

      if (fishDetails.rarity === "lengendary") {
        rarityAmount = 40;
      } else if (fishDetails.rarity === "rare") {
        rarityAmount = 20;
      } else if (fishDetails.rarity === "uncommon") {
        rarityAmount = 14;
      }
      totalReward += (userfishDetails.level * 10 * rarityAmount);
    });

    const passInfo = await checkPassValidity(userId);

    let additionalReward;
    if (passInfo.isValid) {
      additionalReward = 0.26 * totalReward;
      if (passInfo.passType === "titan") additionalReward = 0.16 * totalReward;
      totalReward += additionalReward;
    }

    const aquFishUrls = [];
    const filledAquarium = aquarium.length ?
    aquarium.map(fish => {
      const fishDetails = aquaData.filter(
        fishCollection => fishCollection.name === fish);

      aquFishUrls.push(`https://cdn.discordapp.com/emojis/${fishDetails[0].emoji}.png`);

      return fishDetails.length
      ? `**${fish}** <:${fish}_aqua:${fishDetails[0].emoji}>`: `**${fish}** (no emoji)`;
    }).join("°゜\n## │  "): "Nothing here yet 🐟";

    // Create a border around the aquarium content
    const aquariumDisplay = `┌─────────────────────┐\n` +
    `## │ ${filledAquarium} °゜\n\n` + // Fill the aquarium content
    `│🌊🌊🌊\n` + // Extra padding line
    `└─────────────────────┘`;

    const aquariumEmbedTitle = new EmbedBuilder()
    .setDescription(`### <:aquarium:1301825002013851668> 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 <@${userId}> 𝑨𝒒𝒖𝒂𝒓𝒊𝒖𝒎\n-# Min. Collection: <:kasiko_coin:1300141236841086977> **${totalReward}**\n${passInfo.isValid ? "-# ◎ **+" + additionalReward.toFixed(1) + "** pass bonus": ""}\n${!aquarium.length ? `Add some fish 🦈 to start earning.\n❔ **USE**: \`help aquarium\``: ""}`)
    .setColor("#0a4c63")

    const aquariumEmbed = new EmbedBuilder()
    .setDescription(`${aquariumDisplay}`)
    .setColor('#00BFFF'); // Choose a color for the embed

    let canCollect = true;
    const currentTime = Date.now();

    const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    if (userFishData.aquariumCollectionTime && (currentTime - userFishData.aquariumCollectionTime) < twelveHours) {
      const timeLeft = twelveHours - (currentTime - userFishData.aquariumCollectionTime);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      canCollect = false;
      aquariumEmbedTitle.setFooter({
        text: `⏱️ Time Left: ${hours} hours and ${minutes} minutes`
      });
    }

    const rowComp = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('collect_aquarium_reward')
      .setLabel('Collect 💰')
      .setStyle(ButtonStyle.Success)
      .setDisabled(canCollect && aquarium.length ? false: true),
      new ButtonBuilder()
      .setCustomId('ocean_collection')
      .setLabel(`📒`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false),
      new ButtonBuilder()
      .setCustomId('aquarium_help')
      .setLabel(`❔`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false)
    );

    if (aquFishUrls.length < 3) {
      let aqLength = aquFishUrls.length;
      for (let i = aqLength; i < 3; i++) {
        aquFishUrls.push(`https://cdn.discordapp.com/emojis/1355139233559351326.png`);
      }
    }

    const attachment = await createAquariumImage(aquFishUrls[0], aquFishUrls[1], aquFishUrls[2], "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiTc46GVbhuMrAXK2MUYpJbbUywHUwPfUtjI2j1miy1h1dBnhQNJBoEcoWB4DTWNgkQsej3PSq8JWin0wcD_oCivDzD38iFZTkWdNxR7QF-yQl60Yowsyd8UYBEbF6NJudEKYPJpAi3orFjg2xZgcxncb8_VmPDpJCrWTJDET4QzYNxSnLmPquWFzXvG4m-/s480-rw/20250408_160739.jpg");

    // Send the embed
    let responseMessage;
    if (isInteraction) {
      if (!context.deferred) await context.deferReply();
      responseMessage = await context.editReply({
        embeds: [aquariumEmbedTitle],
        components: [rowComp],
        files: [attachment]
      });
    } else {
      responseMessage = await context.send({
        embeds: [aquariumEmbedTitle],
        components: [rowComp],
        files: [attachment]
      });
    }

    const collector = responseMessage.createMessageComponentCollector({
      time: 120 * 1000,
    });

    let collectorEnded = false;

    collector.on('collect', async (interaction) => {
      if (interaction.replied || interaction.deferred) return; // Do not reply again
      try {
        // Only the original user
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: 'You are not allowed to interact!',
            ephemeral: true,
          });
        }

        if (collectorEnded) {
          return; // Do nothing if it's ended
        }

        if (interaction.customId === 'collect_aquarium_reward') {
          await interaction.deferReply();
          collectorEnded = true;
          return await collectAquariumReward(interaction, interaction.user);
        }

        if (interaction.customId === 'aquarium_help') {
          await interaction.deferReply({
            ephemeral: true
          })
          const infoAqEmbed = new EmbedBuilder()
          .setDescription(`In your aquarium, you can add up to three fishes from your \`ocean collection\`. The higher the level or rarity (legendary), the greater the aquarium's value. You can collect value cash from random virtual visitors every 12 hours.\n` +
            `### Commands:\n` +
            `**Add a fish: ** \`aquarium add <fish_name>\`\n` +
            `**Remove a fish: ** \`aquarium remove <fish_name>\`\n` +
            `**Feed a fish: ** \`aquarium feed <fish_name> <food_amount>\`\n` +
            `**Sell a fish: ** \`aquarium sell <fish_name> <fish_amount>\`\n\n` +

            `\`\`\`You can use 'aq' in place of 'aquarium'\`\`\`\n` +
            `Happy aquariums!
            `)
          return interaction.editReply({
            embeds: [infoAqEmbed],
            ephemeral: true
          })
        }

        if (interaction.customId === 'ocean_collection') {
          await interaction.deferReply();
          await viewCollection(interaction.user.id, interaction, interaction.user);
        }
      } catch (e) {
        console.error(e);
        if (!interaction.deferred) await interaction.deferReply();
        await interaction.editReply({
          content: '<:warning:1366050875243757699> Something went wrong while performing aquarium command button!'
        });
        return;
      }
    });

    collector.on("end",
      async (collected, reason) => {
        try {
          collectorEnded = true;
          const channel = context?.channel || context;
          if (!responseMessage || !responseMessage.id) return;
          const fetchedMsg = await channel.messages.fetch(responseMessage.id);
          if (!fetchedMsg) return;
          const oldRow = fetchedMsg.components[0];
          const row = ActionRowBuilder.from(oldRow);
          row.components.forEach((btn) => btn.setDisabled(true));

          await fetchedMsg.edit({
            components: [row],
          });
        } catch (e) {}
      });

  } catch (e) {
    console.error(e);
    if (isInteraction) {
      if (!context.deferred) await context.deferReply();
      return await context.editReply({
        content: "<:warning:1366050875243757699> Something went wrong while viewing your aquarium."
      });
    } else {
      return context.send("<:warning:1366050875243757699> Something went wrong while viewing your aquarium.");
    }
  }
}

export async function addToAquarium(userId,
  animal,
  channel) {
  try {
    const userFishData = await getUserFishData(userId);

    if (!aquaData.some(fish => fish.name.toLowerCase() === animal.toLowerCase())) {
      return channel.send("<:warning:1366050875243757699> Fish not found.")
    }

    if (!userFishData.aquarium && !Array.isArray(userFishData.aquarium)) userFishData.aquarium = [];

    if (userFishData.aquarium.length > 2) {
      return channel.send(`\n<:warning:1366050875243757699> 🐚 <:aquarium:1301825002013851668> **Your Aquarium is Full!**\nMaximum limit: **3 fish**\nPlease **remove some fish** to make space.`);
    }

    if (userFishData.aquarium.some(fish => fish.toLowerCase() === animal.toLowerCase())) {
      return channel.send(`\n<:warning:1366050875243757699> 🎣 <:aquarium:1301825002013851668> **This fish is already in your Aquarium!**\nYou can only add unique fish. Please try adding a different one.`);
    }

    if (!userFishData.fishes.some(fish => fish.name && fish.name.toLowerCase() === animal.toLowerCase())) {
      return channel.send("<:warning:1366050875243757699> 🐠 This fish isn't in your collection. Try catching it first!");
    }

    const capitalizedName = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();

    userFishData.aquarium.push(capitalizedName);
    userFishData.markModified('aquarium');

    await updateFishUser(userId, userFishData);
    return channel.send(`➕ ✅ Added **${capitalizedName}** to your <:aquarium:1301825002013851668> aquarium!`);
  } catch (e) {
    console.error(e);
    return channel.send("<:warning:1366050875243757699> Something went wrong while adding fish to your collection.");
  }
}

export async function removeFromAquarium(userId, animal, channel) {
  try {
    let userData = await getUserData(userId);
    let userFishData = await getUserFishData(userId);

    if (!Array.isArray(userFishData.aquarium) || userFishData.aquarium.length === 0) {
      return channel.send("<:warning:1366050875243757699> 🎣 No animals to remove.");
    }

    if (!userFishData.aquarium.some(fish => fish.toLowerCase() === animal.toLowerCase())) {
      return channel.send(`<:warning:1366050875243757699> 🐠 Fish **${animal}** is not in your aquarium.`);
    }

    userFishData.aquarium = userFishData.aquarium.filter(fish => fish.toLowerCase() !== animal.toLowerCase());
    userFishData.markModified('aquarium');

    await updateFishUser(userId, userFishData);
    return channel.send(`➖ Removed **${animal}** from your aquarium!`);
  } catch (e) {
    console.error(e);
    return channel.send("<:warning:1366050875243757699> Something went wrong while removing fish from your collection.");
  }
}

export async function feedAnimals(animal, amount, message) {
  try {
    const capitalizedName = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();
    const userData = await getUserData(message.author.id);
    const userFishData = await getUserFishData(message.author.id);

    let userAnimal = userFishData.fishes.find(f => f.name.toLowerCase() === animal.toLowerCase());
    const aquaAnimal = aquaData.find(fish => fish.name.toLowerCase() === animal.toLowerCase());

    if (!aquaAnimal) {
      return message.channel.send("<:warning:1366050875243757699> This animal is not recognized.");
    }

    if (!userAnimal) {
      return message.channel.send("<:warning:1366050875243757699> 🐠 This animal is not found in your collection.");
    }

    let index = userFishData.fishes.findIndex(f => f.name.toLowerCase() === capitalizedName.toLowerCase());
    // Each animal has a feed cost associated with it
    const feedCost = aquaAnimal.feedCost * amount * userFishData.fishes[index].animals;

    if (userData.cash < feedCost) {
      return message.channel.send(`<:warning:1366050875243757699> You do not have enough cash (<:kasiko_coin:1300141236841086977> **${feedCost}**) to feed your animals.`);
    }

    let foodReqToLvlUp = Number(aquaAnimal.foodReq);
    let currentFoodAmount = Number(userFishData.fishes.find(f => f.name.toLowerCase() === capitalizedName.toLowerCase()).food) + amount;
    let level = Math.floor(currentFoodAmount / foodReqToLvlUp);
    if (level < 2) level = 2

    if (level > 100) {
      return message.channel.send(
        `<:warning:1366050875243757699> **${message.author.username}**, fishes can reach a maximum level of **100**. You can't feed them beyond this level.\nPlease reduce the feed amount if your fish is not yet at level 100.`
      );
    }


    userFishData.fishes[index].food += amount;
    userFishData.fishes[index].level += level - userFishData.fishes[index].level;
    userData.cash -= feedCost;
    await updateUser(message.author.id, userData);
    await updateFishUser(message.author.id, userFishData);

    return message.channel.send(
      `🍤 **${message.author.username}**, you fed your <:${capitalizedName}_aqua:${aquaAnimal.emoji}> ${animal}(s) **${amount}** food for <:kasiko_coin:1300141236841086977> **${feedCost} 𝑪𝒂𝒔𝒉**!\n\n` +
      `𖥔 *Your **${animal}(s)** are __**${level ? "now": "still"}**__ at level **${userFishData.fishes[index].level}**.*`
    ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

  } catch (error) {
    console.error(error);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while feeding the animals.");
  }
}

export async function sellAnimals(animal, amount, message) {
  try {
    const userData = await getUserData(message.author.id);
    const userFishData = await getUserFishData(message.author.id);

    const aquaAnimal = aquaData.find(fish => fish.name.toLowerCase() === animal.toLowerCase());
    const capitalizedName = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();


    if (!aquaAnimal) {
      return message.channel.send("<:warning:1366050875243757699> This animal is not recognized.");
    }

    // Assuming each animal has a sell amount associated with it
    const sellAmount = aquaAnimal.sellAmount * amount * userFishData.fishes.find(f => f.name.toLowerCase() === capitalizedName.toLowerCase()).level;

    if (!userFishData.fishes || !userFishData.fishes.some(fish => fish.name && fish.name === capitalizedName)) {
      return message.channel.send("<:warning:1366050875243757699> You do not have this animal in your collection to sell.");
    }

    if (userFishData?.fishes[index]?.animals < amount) {
      return message.channel.send(`<:warning:1366050875243757699> You do not have **${amount}** **${capitalizedName}** in your collection to sell.`);
    }

    // Remove the animal from the aquarium
    if (userFishData.fishes.find(f => f.name.toLowerCase() === capitalizedName.toLowerCase()).animals === 1) {
      userFishData.fishes = userFishData.fishes.filter(f => f.name.toLowerCase() !== capitalizedName.toLowerCase());
      userFishData.aquarium = userFishData.aquarium.filter(fish => fish !== capitalizedName);
    } else {
      let index = userFishData.fishes.findIndex(f => f.name.toLowerCase() === capitalizedName.toLowerCase());
      userFishData.fishes[index].animals -= 1;
    }

    userData.cash += sellAmount;

    await updateUser(message.author.id, userData);
    await updateFishUser(message.author.id, userFishData);

    return message.channel.send(`💰 **${message.author.username}**, you sold ${amount} <:${capitalizedName}_aqua:${aquaAnimal.emoji}> ${animal}(s) for <:kasiko_coin:1300141236841086977> ${sellAmount} 𝑪𝒂𝒔𝒉!`);
  } catch (error) {
    console.error(error);
    return message.channel.send("<:warning:1366050875243757699> Something went wrong while selling the animals.");
  }
}

export async function collectAquariumReward(context, author) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and message
  try {
    const currentTime = Date.now();

    const userData = await getUserData(author.id);
    const userFishData = await getUserFishData(author.id);

    // Check if 12 hours have passed since the last collection
    const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    if (userFishData.fishes.length && (currentTime - userFishData.aquariumCollectionTime) < twelveHours) {
      const timeLeft = twelveHours - (currentTime - userFishData.aquariumCollectionTime);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      if (context.isCommand) {
        if (!context.deferred) await context.deferReply();
        return await context.editReply({
          content: `<:aquarium:1301825002013851668> **${author.username}**, your aquarium will be open to visitors in ***${hours} hours and ${minutes} minutes***. You’ll be able to collect money once it opens.`
        });
      } else {
        return context.send(`<:aquarium:1301825002013851668> **${author.username}**, your aquarium will be open to visitors in ***${hours} hours and ${minutes} minutes***. You’ll be able to collect money once it opens.`);
      }
    }

    const aquarium = userFishData.aquarium;

    if (!aquarium || aquarium.length === 0) {
      if (isInteraction) {
        if (!context.deferred) await context.deferReply();
        return await context.editReply({
          content: `<:warning:1366050875243757699> Your <:aquarium:1301825002013851668> **aquarium is empty**! Add some fish 🦈 to start earning.\n❔ Use: \`kas help aquarium\``
        });
      } else {
        return context.send('<:warning:1366050875243757699> Your <:aquarium:1301825002013851668> **aquarium is empty**! Add some fish 🦈 to start earning.\n❔ Use: \`kas help aquarium\`');
      }
    }

    // Randomly determine the number of visitors (10-30)
    const numVisitors = Math.floor(Math.random() * 21) + 10;

    // Calculate total reward
    let totalReward = 0;
    aquarium.forEach(fish => {
      let fishDetails = aquaData.find(fishData => fishData.name.toLowerCase() === fish.toLowerCase());
      let userfishDetails = userFishData.fishes.find(fishData => fishData.name && fishData.name.toLowerCase() === fish.toLowerCase());
      let rarityAmount = 10;

      if (fishDetails.rarity === "lengendary") {
        rarityAmount = 40;
      } else if (fishDetails.rarity === "rare") {
        rarityAmount = 20;
      } else if (fishDetails.rarity === "uncommon") {
        rarityAmount = 14;
      }
      totalReward += (userfishDetails.level * 10 * rarityAmount) + (numVisitors * 10);
    });

    const passInfo = await checkPassValidity(author.id);

    let additionalReward;
    if (passInfo.isValid) {
      additionalReward = 0.26 * totalReward;
      if (passInfo.passType === "titan") additionalReward = 0.16 * totalReward;
      totalReward += additionalReward;
    }

    // Update user's cash and last collection time
    userData.cash += totalReward;
    userFishData.aquariumCollectionTime = currentTime;
    await updateUser(author.id,
      userData);
    await updateFishUser(author.id,
      userFishData);

    const embed = new EmbedBuilder()
    .setColor('#87dcee')
    .setTitle('<:aquarium:1301825002013851668> 𝑨𝒒𝒖𝒂𝒓𝒊𝒖𝒎 𝑪𝒐𝒍𝒍𝒆𝒄𝒕𝒊𝒐𝒏')
    .setDescription(`**${author.username}**, you received <:kasiko_coin:1300141236841086977> **${totalReward}** from your aquarium collection!`)
    .addFields(
      {
        name: 'Visitors',
        value: `👥 **${numVisitors}** virtual visitors today!`,
        inline: true
      }
    )
    .setImage(`https://harshtiwari47.github.io/kasiko-public/images/aq-visitors.jpg`)
    .setFooter({
      text: 'Keep collecting to earn more!'
    })

    if (context.isCommand) {
      if (!context.deferred) await context.deferReply();
      return await context.editReply({
        embeds: [embed]
      });
    } else {
      return context.send({
        embeds: [embed]
      });
    }
  } catch (error) {
    console.error('Error in aquarium collection:',
      error);
    if (context.isCommand) {
      if (!context.deferred) await context.deferReply();
      return await context.editReply({
        content: '<:warning:1366050875243757699> There was an error collecting your aquarium rewards. Please try again later.'
      });
    } else {
      return context.send('<:warning:1366050875243757699> There was an error collecting your aquarium rewards. Please try again later.');
    }
  }
}

export default {
  name: "aquarium",
  description: "Manage your aquarium by collecting, adding, removing, selling, feeding animals, or viewing your collection.",
  aliases: ["aqua",
    "aq"],
  args: "<action> <animal> <amount>",
  emoji: "🐚",
  example: [
    "aquarium collect",
    "aquarium add <animal>",
    "aquarium remove <animal>",
    "aquarium sell <animal> <amount>",
    "aquarium feed <animal> <amount>"
  ],
  related: ["ocean",
    "catch"],
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🌊 Ocean Life",

  // Main function to execute aquarium commands
  execute: (args,
    message) => {
    const action = args[1] ? args[1].toLowerCase(): null;
    const animal = args[2] ? args[2].toLowerCase(): null;
    const amount = args[3] && Helper.isNumber(args[3]) ? parseInt(args[3]): null;

    switch (action) {
    case "collect":
    case "c":
      return collectAquariumReward(message.channel, message.author);

    case "add":
    case "a":
      if (animal) {
        return addToAquarium(message.author.id, animal, message.channel);
      } else {
        return message.channel.send(
          "-# ❔**Example:**\n" +
          "* **aquarium add** **` <fish> `**"
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

    case "remove":
    case "r":
      if (animal) {
        return removeFromAquarium(message.author.id, animal, message.channel);
      } else {
        return message.channel.send(
          "-# ❔**Example:**\n" +
          "* **aquarium remove** **` <fish> `**"
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

    case "sell":
    case "s":
      if (animal && amount) {
        return sellAnimals(animal, amount, message);
      } else {
        return message.channel.send(
          "-# ❔**Example:**\n" +
          "* **aquarium sell** **`<fish>`** **`<amount>`**"
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

    case "feed":
    case "f":
      if (animal && amount) {
        return feedAnimals(animal, amount, message);
      } else {
        return message.channel.send(
          "-# ❔**Example:**\n" +
          "* **aquarium feed** **`<fish>`** **`<amount>`**"
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

    default:
      return viewAquarium(message.author.id, message.channel);
    }
  }
};