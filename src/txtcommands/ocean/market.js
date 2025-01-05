/**
* "Fish Market" system that displays 2 random fishes from aquaData as "demand".
* Users can open the market, see the two in-demand fishes (x4 Sell Value!), and
* sell from their aquarium collection with the push of a button.
*
* Demand fishes are updated every 6 hours. This example also includes:
*  - A button for viewing the user's ocean collection (viewCollection).
*  - A button for a simple help message.
*/

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import {
  getUserData,
  updateUser,
  readAquaticData
} from '../../../database.js';

import {
  getUserFishData,
  updateFishUser
} from './data.js';

import {
  Helper
} from '../../../helper.js';
// Import the aquarium function that shows a user's collection
import {
  viewCollection
} from './aquarium.js'; // <-- Adjust path as needed

const aquaData = readAquaticData();

/**
* In-memory store for current demand fishes (two at a time).
* Each element in the array is an object: { name, rarity, ... }
*/
let demandFishes = [];

/**
* Initialize or update the 2 demand fishes every 6 hours.
* This function randomly picks 2 fishes from `aquaData`.
*/
export function updateDemandFishes() {
  // Example filter for 'aquatic' type, then shuffle
  const shuffled = aquaData
  .filter((fish) => fish.type === 'aquatic')
  .sort(() => 0.5 - Math.random()); // basic shuffle

  // Pick the first 2 as the new demand fishes
  demandFishes = shuffled.slice(0, 2);

  console.log('[FishMarket] Demand fishes updated:', demandFishes.map(f => f.name));
}

/**
* A helper to display the Fish Market (the two demand fishes).
*/
export async function openFishMarket(context) {
  const isInteraction = !!context.isCommand;
  try {
    // If the demandFishes array is empty or not yet initialized, populate it:
    if (demandFishes.length < 2) {
      updateDemandFishes();
    }

    const shopEmbed = new EmbedBuilder()
    .setImage(`https://harshtiwari47.github.io/kasiko-public/images/fish/fish-shop${1 + Math.floor(Math.random() * 4)}.jpg`)
    .setColor('#F1C40F')
    .setDescription(`## 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 𝒕𝒉𝒆 𝑭𝒊𝒔𝒉 𝑴𝒂𝒓𝒌𝒆𝒕`)


    // Prepare an embed
    const marketEmbed = new EmbedBuilder()
    .setDescription(
      `Here are today's **Demand Fishes** (x4 Sell Value)! ` +
      `\n> *(Demand is updated every 6 hours)*`
    )
    .setFooter({
      text: `Use the buttons below to sell.`
    })

    // Prepare descriptions for each demand fish
    let descriptionFields = demandFishes.map((fish, idx) => {
      const baseSell = fish.sellAmount;
      const exampleReward = baseSell * 4; // 4x per fish (level 1 example)
      return {
        name: `${idx + 1}. ${fish.name} <:${fish.name}:${fish.emoji}>  \`${fish.rarity.toUpperCase()} Fish\``,
        value: `**Base Sell**: <:kasiko_coin:1300141236841086977> ${baseSell} ` +
        `**Demand Sell** (lvl 1 example): <:kasiko_coin:1300141236841086977> ${exampleReward}`,
        inline: false
      };
    });

    marketEmbed.addFields(descriptionFields);

    // Create an ActionRow with up to 4 buttons:
    // - 2 for each demanded fish
    // - 1 to open collection
    // - 1 for help
    const row = new ActionRowBuilder();

    // Demand fish sell buttons
    demandFishes.forEach((fish) => {
      row.addComponents(
        new ButtonBuilder()
        .setCustomId(`sell_demand_fish_${fish.name}`)
        .setLabel(`Sell: ${fish.name}`)
        .setStyle(ButtonStyle.Success)
      );
    });

    // Button to view collection
    row.addComponents(
      new ButtonBuilder()
      .setCustomId('fishmarket_view_collection')
      .setLabel('📒')
      .setStyle(ButtonStyle.Primary)
    );

    // Button for help
    row.addComponents(
      new ButtonBuilder()
      .setCustomId('fishmarket_help')
      .setLabel('❔')
      .setStyle(ButtonStyle.Secondary)
    );

    let responseMessage;
    if (isInteraction) {
      if (!context.deferred) await context.deferReply();
      responseMessage = await context.editReply({
        embeds: [shopEmbed, marketEmbed],
        components: [row]
      });
    } else {
      responseMessage = await context.channel.send({
        embeds: [shopEmbed, marketEmbed],
        components: [row]
      });
    }

    // Create a collector for these buttons
    const collector = responseMessage.createMessageComponentCollector({
      time: 60_000 // 1 minute
    });

    collector.on('collect', async (btnInteraction) => {
      try {
        // Only the user that opened the market can interact (optional check).
        // If you want it open to anyone, remove the check below.
        if (isInteraction) {
          if (btnInteraction.user.id !== context.user.id) {
            return btnInteraction.reply({
              content: 'You are not allowed to interact!',
              ephemeral: true
            });
          }
        } else {
          if (btnInteraction.user.id !== context.author.id) {
            return btnInteraction.reply({
              content: 'You are not allowed to interact!',
              ephemeral: true
            });
          }
        }

        const customId = btnInteraction.customId;

        // SELL button pressed
        if (customId.startsWith('sell_demand_fish_')) {
          await btnInteraction.deferReply();
          const fishName = customId.replace('sell_demand_fish_', '');
          await sellDemandFish(btnInteraction, fishName);
        }
        // VIEW COLLECTION pressed
        else if (customId === 'fishmarket_view_collection') {
          // Let’s call the aquarium's viewCollection function
          await btnInteraction.deferReply();
          await viewCollection(btnInteraction.user.id, btnInteraction);
        }
        // HELP pressed
        else if (customId === 'fishmarket_help') {
          if (!btnInteraction.deferred) await btnInteraction.deferUpdate();
          // Show ephemeral help text
          await btnInteraction.followUp({
            content:
            'Fish Market Help:\n'+
            '- **Demand fishes** update every 6 hours.\n'+
            '- You can sell a demanded fish for **4×** its normal value × fish level.\n' +
            '- Use the 📒 button to view your Ocean Collection.\n'+
            '- Then sell demanded fish from your collection with the **Sell** button.\n\n'+
            'Happy trading!',
            ephemeral: true
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    collector.on('end',
      async () => {
        // Disable the buttons after time
        const disabledRow = ActionRowBuilder.from(responseMessage.components[0]);
        disabledRow.components.forEach(btn => btn.setDisabled(true));

        await responseMessage.edit({
          components: [disabledRow]
        }).catch(() => {});
      });
  } catch (error) {
    console.error('[FishMarket] Error in openFishMarket:',
      error);
    const errorMsg = '⚠️ An error occurred opening the fish market.';
    if (isInteraction) {
      if (!context.deferred) await context.deferReply();
      return context.editReply({
        content: errorMsg
      });
    } else {
      return context.channel.send(errorMsg);
    }
  }
}

/**
* Sells one unit of the demanded fish from the user's aquarium collection.
* The reward is 4x the normal sell amount * fish level.
* Then remove 1 fish from the user's aquarium collection.
*/
export async function sellDemandFish(interaction, fishName) {
  try {
    const userId = interaction.user.id;
    let userData = await getUserData(userId);
    let userFishData = await getUserFishData(userId);

    // Check if user has the fish in their aquaCollection
    const capitalizedName = fishName.charAt(0).toUpperCase() + fishName.slice(1).toLowerCase();
    const userFish = userFishData.fishes.find(f => f.name.toLowerCase() === capitalizedName.toLowerCase());

    if (!userFish || !userFish.name) {
      return interaction.followUp({
        content: `⚠️ You do **not** have any **${capitalizedName}** in your ocean collection!`,
        ephemeral: true
      });
    }

    // If user has multiple fish of the same name, we only sell 1
    if (userFish.animals <= 0) {
      return interaction.followUp({
        content: `⚠️ You do **not** have any **${capitalizedName}** left to sell!`,
        ephemeral: true
      });
    }

    // Retrieve fish details from aquaData to get the base sell amount
    const fishDetails = aquaData.find(f => f.name.toLowerCase() === fishName.toLowerCase());
    if (!fishDetails) {
      return interaction.followUp({
        content: `⚠️ Unknown fish: **${capitalizedName}**.`,
        ephemeral: true
      });
    }

    // 4x * (fishDetails.sellAmount * fishLevel)
    const fishLevel = userFish.level || 1;
    const baseSell = fishDetails.sellAmount || 1;
    const totalSellValue = baseSell * fishLevel * 4;

    userData.cash += totalSellValue;

    // If user had only 1, remove the fish entirely
    if (userFishData.fishes.find(f => f.name.toLowerCase() === capitalizedName.toLowerCase()).animals === 1) {
      userFishData.fishes = userFishData.fishes.filter(f => f.name.toLowerCase() !== capitalizedName.toLowerCase());
      userFishData.aquarium = userFishData.aquarium.filter(fish => fish !== capitalizedName);
    } else {
      let index = userFishData.fishes.findIndex(f => f.name.toLowerCase() === capitalizedName.toLowerCase());
      userFishData.fishes[index].animals -= 1;
    }

    userFishData.markModified('fishes');
    userFishData.markModified('aquarium');

    // Save
    await updateUser(userId, userData);
    await updateFishUser(userId, userFishData);

    return interaction.followUp({
      content: `✅ You sold  <:${fishDetails.name}:${fishDetails.emoji}> **1** \`${capitalizedName}\` for <:kasiko_coin:1300141236841086977> **${totalSellValue}**! (Demand Bonus Applied)`,
      ephemeral: false
    });
  } catch (error) {
    console.error('[FishMarket] Error in sellDemandFish:', error);
    return interaction.followUp({
      content: '⚠️ Something went wrong while selling your fish. Please try again.',
      ephemeral: true
    });
  }
}

export default {
  name: "fishmarket",
  description: "Open the fish market to see which fishes are in demand!",
  aliases: ["fm",
    "fmarket"],
  cooldown: 10000,
  category: "🌊 Ocean Life",

  execute: async (args, message) => {
    // For a prefix-based approach
    return openFishMarket(message);
  }
};

  /**
  * SCHEDULING
  *
  *   import { updateDemandFishes } from './fishmarket.js';
  *
  *   // Immediately update at startup:
  *   updateDemandFishes();
  *
  *   // Then update every 6 hours:
  *   setInterval(() => {
  *     updateDemandFishes();
  *   }, 6 * 60 * 60 * 1000);
  */