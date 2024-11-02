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
} from '../../database.js';

const aquaData = readAquaticData();

export async function viewCollection(userId, channel) {
  try {
    let userData = getUserData(userId);
    const userCollection = userData.aquaCollection;

    let collection = "";

    if (Object.values(userCollection).length === 0) {
      collection = "⚠️ User doesn't have any 🦦fish!";
    } else {
      Object.values(userCollection).forEach((fish, i) => {
        let fishDetails = aquaData.filter(item => item.name === fish.name);
        collection += `\nᯓ★ **${fish.name}** <:${fish.name}_aqua:${fishDetails[0].emoji}> (${fish.animals}) **${fishDetails[0].rarity.substring(0, 1).toUpperCase()}**\n**Lvl**: ${fish.level} **Dmg**: ${fishDetails[0].damage} **CPF**: ${fishDetails[0].feedCost} **CPS**: ${fishDetails[0].sellAmount}\n`;
      })
    }

    const embed = new EmbedBuilder()
    .setColor('#6835fe')
    .setTitle(`░ <@${userId}> 's Aquatic Collection░ ✩`)
    .setDescription(collection)
    .setFooter({
      text: `Kasiko`,
      iconURL: 'https://cdn.discordapp.com/avatars/1300081477358452756/cbafd10eba2293768dd9c4c0c7d0623f.png'
    })
    .setTimestamp();

    return channel.send({
      embeds: [embed]
    });
  } catch (e) {
    console.error(e)
    return channel.send("⚠️ something went wrong while visiting **User's Collection**");
  }
}


export async function viewAquarium(userId, channel) {
  try {
    let userData = getUserData(userId);
    const aquarium = userData.aquarium || [];

    const decorations = "🌿🐠🐡🦀🐚🌊";
    const filledAquarium = aquarium.length
    ? aquarium.map(fish => {
      const fishDetails = aquaData.filter(
        fishCollection => fishCollection.name === fish);
      return fishDetails.length
      ? `**${fish}** <:${fish}_aqua:${fishDetails[0].emoji}>`: `**${fish}** (no emoji)`;
    }).join(" | "): "Nothing here yet 🐟";

    // Create a border around the aquarium content
    const aquariumDisplay = `┌────────────────────────┐\n` +
    `│  <:aquarium:1301825002013851668> 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 𝒚𝒐𝒖𝒓 𝑨𝒒𝒖𝒂𝒓𝒊𝒖𝒎 │\n` +
    `│                             │\n` + // Extra padding line
    `│ ${filledAquarium} │\n` + // Fill the aquarium content
    `│                             │\n` + // Extra padding line
    `└────────────────────────┘`;

    return channel.send(`${aquariumDisplay}\n\n${decorations}`);
  } catch (e) {
    console.error(e);
    return channel.send("⚠️ Something went wrong while viewing your aquarium.");
  }
}

export async function addToAquarium(userId, animal, channel) {
  try {
    let userData = getUserData(userId);

    if (!aquaData.some(fish => fish.name.toLowerCase() === animal)) {
      return channel.send("⚠️ Fish not found.")
    }

    if (!userData.aquarium && !Array.isArray(userData.aquarium)) userData.aquarium = [];

    if (userData.aquarium.length > 2) {
      return channel.send(`\n⚠️ <:aquarium:1301825002013851668> **Your Aquarium is Full!**\nMaximum limit: **3 fish**\nPlease **remove some fish** to make space.`);
    }

    if (userData.aquarium.some(fish => fish.toLowerCase() === animal.toLowerCase())) {
      return channel.send(`\n⚠️ <:aquarium:1301825002013851668> **This fish is already in your Aquarium!**\nYou can only add unique fish. Please try adding a different one.`);
    }

    if (!Object.values(userData.aquaCollection).some(fish => fish.name.toLowerCase() === animal.toLowerCase())) {
      return channel.send("⚠️ This fish isn't in your collection. Try catching it first!");
    }

    const capitalizedName = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();

    userData.aquarium.push(capitalizedName);

    updateUser(userId, userData);
    return channel.send(`➕ ✅ Added **${capitalizedName}** to your <:aquarium:1301825002013851668> aquarium!`);
  } catch (e) {
    console.error(e);
    return channel.send("⚠️ Something went wrong while adding fish to your collection.");
  }
}

export async function removeFromAquarium(userId, animal, channel) {
  try {
    let userData = getUserData(userId);

    if (!Array.isArray(userData.aquarium) || userData.aquarium.length === 0) {
      return channel.send("⚠️ No animals to remove.");
    }

    if (!userData.aquarium.some(fish => fish.toLowerCase() === animal.toLowerCase())) {
      return channel.send(`⚠️ Fish **${animal}** is not in your aquarium.`);
    }

    userData.aquarium = userData.aquarium.filter(fish => fish.toLowerCase() !== animal.toLowerCase());

    updateUser(userId, userData);
    return channel.send(`➖ Removed **${animal}** from your aquarium!`);
  } catch (e) {
    console.error(e);
    return channel.send("⚠️ Something went wrong while removing fish from your collection.");
  }
}

export async function feedAnimals(animal, amount, message) {
  try {
    const capitalizedName = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();
    const userData = getUserData(message.author.id);
    let userAnimal = Object.values(userData.aquaCollection).find(fish => fish.name.toLowerCase() === animal.toLowerCase());
    const aquaAnimal = aquaData.find(fish => fish.name.toLowerCase() === animal.toLowerCase());

    if (!aquaAnimal) {
      return message.channel.send("⚠️ This animal is not recognized.");
    }

    if (!userAnimal) {
      return message.channel.send("⚠️ This animal is not found in your collection.");
    }

    // Each animal has a feed cost associated with it
    const feedCost = aquaAnimal.feedCost * amount * userData.aquaCollection[capitalizedName].animals;

    if (userData.cash < feedCost) {
      return message.channel.send(`⚠️ You do not have enough cash (<:kasiko_coin:1300141236841086977>${feedCost}) to feed your animals.`);
    }

    let foodReqToLvlUp = Number(aquaAnimal.foodReq);
    let currentFoodAmount = Number(userData.aquaCollection[capitalizedName].food) + amount;
    let remainder = currentFoodAmount % foodReqToLvlUp;
    let level = (currentFoodAmount - remainder) / foodReqToLvlUp;

    userData.aquaCollection[capitalizedName].food += remainder;
    userData.aquaCollection[capitalizedName].level += level;
    userData.cash -= feedCost;
    updateUser(message.author.id, userData);

    return message.channel.send(`🍤 **${message.author.username}**, you fed your <:${capitalizedName}_aqua:${aquaAnimal.emoji}> ${animal}(s) ${amount} food for <:kasiko_coin:1300141236841086977> ${feedCost} 𝑪𝒂𝒔𝒉! They are happy and healthy. Your ${animal}(s) are ${level ? "**now**" : "**stil**"} at level ${userData.aquaCollection[capitalizedName].level}.`);
  } catch (error) {
    console.error(error);
    return message.channel.send("⚠️ Something went wrong while feeding the animals.");
  }
}

export async function sellAnimals(animal, amount, message) {
  try {
    const userData = getUserData(message.author.id);
    const aquaAnimal = aquaData.find(fish => fish.name.toLowerCase() === animal.toLowerCase());
    const capitalizedName = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();


    if (!aquaAnimal) {
      return message.channel.send("⚠️ This animal is not recognized.");
    }

    // Assuming each animal has a sell amount associated with it
    const sellAmount = aquaAnimal.sellAmount * amount * userData.aquaCollection[capitalizedName].level;

    if (!userData.aquaCollection || !Object.values(userData.aquaCollection).some(fish => fish.name === capitalizedName)) {
      return message.channel.send("⚠️ You do not have this animal in your collection to sell.");
    }

    // Remove the animal from the aquarium
    if (userData.aquaCollection[capitalizedName].animals === 1) {
      delete userData.aquaCollection[capitalizedName];
    } else {
      userData.aquaCollection[capitalizedName].animals -= 1;
    }

    userData.aquarium = userData.aquarium.filter(fish => fish !== capitalizedName);
    userData.cash += sellAmount;

    updateUser(message.author.id, userData);

    return message.channel.send(`💰 **${message.author.username}**, you sold ${amount} <:${capitalizedName}_aqua:${aquaAnimal.emoji}> ${animal}(s) for <:kasiko_coin:1300141236841086977> ${sellAmount} 𝑪𝒂𝒔𝒉!`);
  } catch (error) {
    console.error(error);
    return message.channel.send("⚠️ Something went wrong while selling the animals.");
  }
}

export async function collectAquariumReward(message) {
  try {
    const currentTime = Date.now();

    const userData = getUserData(message.author.id);

    // Check if 12 hours have passed since the last collection
    const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    if (userData.aquariumCollectionTime && (currentTime - userData.aquariumCollectionTime) < twelveHours) {
      const timeLeft = twelveHours - (currentTime - userData.aquariumCollectionTime);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return message.channel.send(`⚠️ You can collect again in ${hours} hours and ${minutes} minutes.`);
    }

    const aquarium = userData.aquarium;

    if (!aquarium || aquarium.length === 0) {
      return message.channel.send('⚠️ Your <:aquarium:1301825002013851668> **aquarium is empty**! Add some fish 🦈 to start earning.');
    }

    // Randomly determine the number of visitors (10-30)
    const numVisitors = Math.floor(Math.random() * 21) + 10;

    // Calculate total reward
    let totalReward = 0;
    aquarium.forEach(fish => {
      let fishDetails = aquaData.find(fishData => fishData.name.toLowerCase() === fish.toLowerCase());
      let userfishDetails = Object.values(userData.aquaCollection).find(fishData => fishData.name.toLowerCase() === fish.toLowerCase());
      let rarityAmount = 15;

      if (fishDetails.rarity === "lengendary") {
        rarityAmount = 50;
      } else if (fishDetails.rarity === "rare") {
        rarityAmount = 35;
      } else if (fishDetails.rarity === "uncommon") {
        rarityAmount = 25;
      }
      totalReward += (userfishDetails.level * 15 * rarityAmount) + numVisitors;
    });

    // Update user's cash and last collection time
    userData.cash += totalReward;
    userData.aquariumCollectionTime = currentTime;
    updateUser(message.author.id,
      userData);

    const embed = new EmbedBuilder()
    .setColor('#87dcee')
    .setTitle('Aquarium Collection')
    .setDescription(`You received <:kasiko_coin:1300141236841086977> ${totalReward} from your aquarium collection!`)
    .addFields(
      {
        name: 'Visitors',
        value: `${numVisitors} virtual visitors today!`,
        inline: true
      },
      {
        name: 'Total Reward',
        value: `<:kasiko_coin:1300141236841086977> ${totalReward}`,
        inline: true
      }
    )
    .setFooter({
      text: 'Keep collecting to earn more!'
    })
    .setTimestamp();


    return message.channel.send({
      embeds: [embed]
    });

  } catch (error) {
    console.error('Error in aquarium collection:',
      error);
    return message.channel.send('⚠️ There was an error collecting your aquarium rewards. Please try again later.');
  }
}