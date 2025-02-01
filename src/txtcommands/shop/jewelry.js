import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import {
  getAllJewelry
} from './shopDataHelper.js';
import {
  getOrCreateShopDoc
} from './shopDocHelper.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  viewUserJewelryCollection
} from './viewUserJewelry.js';

import {
  Helper
} from '../../../helper.js';

export async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    return context.channel.send(data);
  }
}

/**
* Creates an embed array for a single jewelry item.
* We return an array of Embeds in case you want multiple pages, but here it's just 1.
*/
function createJewelryEmbed(item) {
  let iconRarity = ``;

  if (item.rarity.substring(0, 1).toUpperCase() === "L") iconRarity = `<:legendary:1323917783745953812>`
  if (item.rarity.substring(0, 1).toUpperCase() === "U") iconRarity = `<:uncommon:1323917867644882985>`
  if (item.rarity.substring(0, 1).toUpperCase() === "C") iconRarity = `<:common:1323917805191434240>`
  if (item.rarity.substring(0, 1).toUpperCase() === "R") iconRarity = `<:rare:1323917826448166923>`
  if (item.rarity.substring(0, 1).toUpperCase() === "E") iconRarity = `<:epic:1324666103028387851>`

  const embed = new EmbedBuilder()
  .setTitle(item.name)
  .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoji}.png`)
  .setDescription(`${item.description}`)
  .addFields(
    {
      name: 'ID', value: item.id, inline: true
    },
    {
      name: 'Price', value: `<:kasiko_coin:1300141236841086977> ${item.price.toLocaleString()}`, inline: true
    },
    {
      name: 'Rarity', value: `${iconRarity} ${item.rarity}` || 'common', inline: true
    }
  )
  .setColor('#64a0e7');

  // For "strips", also show the URL
  if (item.type === 'strip' && item.url) {
    embed.addFields({
      name: 'URL', value: item.url
    });
  }

  return [embed];
}

/**
* Paginate all jewelry items in memory
*/
export async function sendPaginatedJewelry(context) {
  try {
    const userId = context.user?.id || context.author?.id;
    const allItems = getAllJewelry();

    if (!allItems.length) {
      return handleMessage(context, {
        content: "No jewelry items are available in the shop!"
      });
    }

    let currentIndex = 0;
    let currentEmbed = createJewelryEmbed(allItems[currentIndex]);

    // Prev, Next, Buy
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('prevJewelry')
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId('nextJewelry')
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(allItems.length <= 1),
      new ButtonBuilder()
      .setCustomId('buyJewelry')
      .setLabel('🛍️ BUY')
      .setStyle(ButtonStyle.Success)
    );

    // Send initial
    const messageSent = await handleMessage(context, {
      embeds: currentEmbed,
      components: [row]
    });

    const collector = messageSent.createMessageComponentCollector({
      time: 180000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: "You can't use these buttons.", ephemeral: true
        });
      }

      await interaction.deferUpdate();

      if (interaction.customId === 'prevJewelry') {
        currentIndex = Math.max(currentIndex - 1, 0);
      } else if (interaction.customId === 'nextJewelry') {
        currentIndex = Math.min(currentIndex + 1, allItems.length - 1);
      } else if (interaction.customId === 'buyJewelry') {
        const item = allItems[currentIndex];
        return buyJewelryItem(context, item.id);
      }

      currentEmbed = createJewelryEmbed(allItems[currentIndex]);
      row.components[0].setDisabled(currentIndex === 0);
      row.components[1].setDisabled(currentIndex === allItems.length - 1);

      await messageSent.edit({
        embeds: currentEmbed,
        components: [row]
      });
    });

    collector.on('end',
      async () => {
        row.components.forEach(b => b.setDisabled(true));
        await messageSent.edit({
          components: [row]
        }).catch(() => {});
      });
  } catch (err) {
    console.error('Error in sendPaginatedJewelry:',
      err);
    return handleMessage(context,
      {
        content: "⚠️ Something went wrong while viewing the jewelry shop."
      });
  }
}

/**
* Buy item, storing it in the user’s ShopItem doc.
* We assume we get `cash` from your existing user data (like cars/structures).
*/
export async function buyJewelryItem(context, itemId) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    // 1) Find the item in memory
    const allItems = getAllJewelry();
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
      return handleMessage(context, {
        content: `No item found with ID "${itemId}".`
      });
    }

    // 2) Get the user’s doc from your existing user database (for cash),
    //    plus get or create Shop doc for networth + sub-collections
    const userData = await getUserData(userId); // has .cash
    const shopDoc = await getOrCreateShopDoc(userId); // has .networth, .rings, .necklaces, .watches, .strips

    // 3) Check if user has enough cash
    if (userData.cash < item.price) {
      return handleMessage(context, {
        content: `⚠️ **${username}**, you don't have enough cash for **${item.name}**.`
      });
    }

    // 4) Check networth if item is legendary
    if (item.rarity === 'legendary' && shopDoc.networth < 500000) {
      return handleMessage(context, {
        content: `⚠️ **${username}**, your networth is too low to buy this legendary item. (Need &ge; 500,000)`
      });
    }

    // 5) Deduct the user’s cash
    userData.cash -= item.price;
    await updateUser(userId, userData);

    // 6) Insert (or increment) the item in the correct sub-array
    //    Because item.type can be "ring", "necklace", "watch", or "strip"
    switch (item.type) {
      case 'ring':
        addOrIncrementItem(shopDoc.rings, item);
        break;
      case 'necklace':
        addOrIncrementItem(shopDoc.necklaces, item);
        break;
      case 'watch':
        addOrIncrementItem(shopDoc.watches, item);
        break;
      case 'strip':
        addOrIncrementItem(shopDoc.strips, item);
        break;
      default:
        break;
    }

    // 7) Optionally increase networth or do other logic
    //    (You can do something like shopDoc.networth += item.price * 0.2 if you want)
    // For now, do nothing or do a small increment:
    shopDoc.networth += Math.floor(item.price * 1); // Example: 100% goes to networth

    // 8) Save the shop doc
    await shopDoc.save();

    const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('𝗣𝘂𝗿𝗰𝗵𝗮𝘀𝗲 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹')
    .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoji}.png`)
    .setDescription(`**${username}** purchased **${item.name}** for <:kasiko_coin:1300141236841086977> **${item.price.toLocaleString()}** cash!`)
    .setTimestamp();

    return handleMessage(context, {
      embeds: [embed]
    });
  } catch (err) {
    console.error('Error in buyJewelryItem:', err);
    return handleMessage(context, {
      content: `⚠️ **${context.user?.username || context.author?.username}**, something went wrong buying the item.`
    });
  }
}

/**
* Helper to add or increment an item in a sub-array (rings, necklaces, etc.)
*/
function addOrIncrementItem(subArray, item) {
  const existing = subArray.find(x => x.id === item.id);
  if (existing) {
    existing.amount += 1;
  } else {
    // Insert a new record
    const newObj = {
      id: item.id,
      name: item.name,
      amount: 1
    };
    if (item.url) {
      // for strips
      newObj.url = item.url;
    }
    subArray.push(newObj);
  }
}

/**
* Sell an item from the user’s sub-array, refunds partial or full price in user’s `cash`.
*/
export async function sellJewelryItem(context, itemId) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;

    // 1) Find the item in memory for price info
    const allItems = getAllJewelry();
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
      return handleMessage(context, {
        content: `Item with ID "${itemId}" not found in the shop data.`
      });
    }

    // 2) user’s doc for cash + shop doc for sub-arrays
    const userData = await getUserData(userId);
    const shopDoc = await getOrCreateShopDoc(userId);

    // 3) Sell from correct sub-array
    let subArrayRef;
    switch (item.type) {
      case 'ring': subArrayRef = shopDoc.rings; break;
      case 'necklace': subArrayRef = shopDoc.necklaces; break;
      case 'watch': subArrayRef = shopDoc.watches; break;
      case 'strip': subArrayRef = shopDoc.strips; break;
      default: break;
    }

    if (!subArrayRef) {
      return handleMessage(context, {
        content: `⚠️ Invalid item type for selling.`
      });
    }

    const owned = subArrayRef.find(x => x.id === itemId);
    if (!owned) {
      return handleMessage(context, {
        content: `⚠️ You don't own any **${item.name}** to sell!`
      });
    }

    // 4) Decrement the amount, remove if 0
    owned.amount -= 1;
    if (owned.amount <= 0) {
      subArrayRef.splice(subArrayRef.indexOf(owned), 1);
    }

    // 5) Decide on resale logic (e.g., 50% of item.price)
    const resaleValue = Math.floor(item.price * 0.5);

    // 6) Give user cash back, save
    userData.cash += resaleValue;
    await updateUser(userId, userData);

    // Could also reduce networth if you want
    shopDoc.networth -= Math.floor(item.price);
    if (shopDoc.networth < 0) shopDoc.networth = 0; // avoid negative
    await shopDoc.save();

    const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('𝗦𝗮𝗹𝗲 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹')
    .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoji}.png`)
    .setDescription(
      `**${username}** sold **${item.name}** for <:kasiko_coin:1300141236841086977> **${resaleValue.toLocaleString()}** cash.\n` +
      `Original price: <:kasiko_coin:1300141236841086977> **${item.price.toLocaleString()}**`
    )
    .setTimestamp();

    return handleMessage(context, {
      embeds: [embed]
    });
  } catch (err) {
    console.error('Error in sellJewelryItem:', err);
    return handleMessage(context, {
      content: `⚠️ **${context.user?.username || context.author?.username}**, something went wrong selling the item.`
    });
  }
}

// E.g., "!myjewelry" => show all
//       "!myjewelry ring" => only rings
//       "!myjewelry strip" => only strips
async function handleMyJewelryCommand(context, userId, type) {
  return viewUserJewelryCollection(context, userId, type);
}

/**
* Command dispatcher for the "jewelry" command
* e.g.:
*    !jewelry                   => show paginated shop
*    !jewelry buy <itemId>      => buy an item
*    !jewelry sell <itemId>     => sell an item
*/
export function handleJewelryCommands(context, args) {
  const userId = context.user?.id || context.author?.id;

  let type = "all";

  if (args[0] === "rings" || args[0] === "ring") type = "ring";
  if (args[0] === "strip" || args[0] === "strips") type = "strip";
  if (args[0] === "watch" || args[0] === "watches") type = "watch";
  if (args[0] === "necklaces" || args[0] === "necklace") type = "necklace";
  if (args[0] === "jewel" || args[0] === "jewelry" || args[0] === "jewellery") type = "all";

  if (!args[1]) {
    return handleMyJewelryCommand(context, userId, type);
  }

  // If the second arg is a user mention => show that user's cars
  if (Helper.isUserMention(args[1], context)) {
    const mentionedUserId = Helper.extractUserId(args[1]);
    return handleMyJewelryCommand(context, mentionedUserId, type);
  }

  return handleMessage(context, {
    content: "Usage: rings | necklaces | watches | strips"
  });
}

export const JEWELRY = {
  sellJewelryItem,
  buyJewelryItem,
  sendPaginatedJewelry
}

export default {
  name: "jewelry",
  description: "View, buy, or sell rings, necklaces, watches, strips from the shop.",
  aliases: ["jewel",
    "jewellery",
    "rings",
    "ring",
    "necklace",
    "watch",
    "strip",
    "necklaces",
    "watches",
    "strips"],
  args: "[buy|sell] <item_id>",
  cooldown: 4000,
  category: "🛍️ Shop",
  execute: (args, context) => handleJewelryCommands(context, args)
};