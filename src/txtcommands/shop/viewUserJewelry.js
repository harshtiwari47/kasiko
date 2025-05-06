import {
  EmbedBuilder
} from 'discord.js';
import ShopItem from '../../../models/Shop.js';

export async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.replied && !context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    return context.channel.send(data);
  }
}

import {
  getAllJewelry
} from './shopDataHelper.js';

/**
* Utility function:
* Gets or creates a ShopItem doc for the given userId.
*/
export async function getOrCreateShopDoc(userId) {
  let doc = await ShopItem.findOne({
    userId
  });
  if (!doc) {
    doc = new ShopItem( {
      userId,
      networth: 0,
      rings: [],
      necklaces: [],
      watches: [],
      strips: [],
    });
    await doc.save();
  }
  return doc;
}

/**
* Summarizes an array of items (with name, id, amount) into a string.
*/
function formatItemList(items) {
  if (!items || items.length === 0) return 'None';
  const allItems = getAllJewelry();
  // Example line format: "• Gold Ring (ID: ring1) x2"
  return items.map((item) => {
    let itemsDetails = allItems.find(i => i.name === item.name);
    return `• ${itemsDetails ? `<:${item.id}:${itemsDetails.emoji}>`: ""} **${item.name}** (ID: \`${item.id}\`) x**${item.amount}**`
  }).join('\n');
}

/**
* Main function to view a user's jewelry collection.
* @param {object} context - The command context (slash or message).
* @param {string} userId  - The Discord user's ID whose collection to display.
* @param {string} type    - "ring" | "necklace" | "watch" | "strip" | "all"
*/
export async function viewUserJewelryCollection(context, userId, type) {
  try {
    // 1) Fetch or create the user's shop doc
    const shopDoc = await getOrCreateShopDoc(userId);

    // 2) Based on 'type', decide which arrays to display
    // If type === 'all', we show everything in separate fields
    // Otherwise, we only show that category
    const embed = new EmbedBuilder()
    .setTitle(`<@${userId}>'𝙨 𝙅𝙚𝙬𝙚𝙡𝙧𝙮 𝘾𝙤𝙡𝙡𝙚𝙘𝙩𝙞𝙤𝙣`)
    .setColor('#F39C12')

    if (type === 'all' || !type) {
      // Show all categories
      embed.addFields(
        {
          name: '𝖱𝗂𝗇𝗀𝗌',
          value: formatItemList(shopDoc.rings),
          inline: false
        },
        {
          name: '𝘕𝘦𝘤𝘬𝘭𝘢𝘤𝘦𝘴',
          value: formatItemList(shopDoc.necklaces),
          inline: false
        },
        {
          name: '𝘞𝘢𝘵𝘤𝘩𝘦𝘴',
          value: formatItemList(shopDoc.watches),
          inline: false
        },
        {
          name: '𝘚𝘵𝘳𝘪𝘱𝘴',
          value: formatItemList(shopDoc.strips),
          inline: false
        }
      );
    } else {
      // Show only one category
      let itemsToShow;
      let label;

      switch (type.toLowerCase()) {
        case 'ring':
          itemsToShow = shopDoc.rings;
          label = '𝘙𝘪𝘯𝘨𝘴';
          break;
        case 'necklace':
          itemsToShow = shopDoc.necklaces;
          label = '𝘕𝘦𝘤𝘬𝘭𝘢𝘤𝘦𝘴';
          break;
        case 'watch':
          itemsToShow = shopDoc.watches;
          label = '𝘞𝘢𝘵𝘤𝘩𝘦𝘴';
          break;
        case 'strip':
          itemsToShow = shopDoc.strips;
          label = '𝘚𝘵𝘳𝘪𝘱𝘴';
          break;
        default:
          itemsToShow = [];
          label = `Unknown type: ${type}`;
        }

        embed.addFields({
          name: label,
          value: formatItemList(itemsToShow),
          inline: false
        });
      }

      return handleMessage(context, {
        embeds: [embed]
      });
    } catch (err) {
      console.error('Error in viewUserJewelryCollection:', err);
      return handleMessage(context, {
        content: `⚠️ Something went wrong while viewing <@${userId}>'s jewelry collection.`
      });
    }
  }