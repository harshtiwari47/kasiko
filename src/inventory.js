import {
  getUserData,
  updateUser
} from '../database.js';

import {
  discordUser,
  handleMessage
} from '../helper.js';

import {
  getScratchResult,
  generateScratchImage
} from "./txtcommands/shop/scratch.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionType,
  ContainerBuilder,
  MessageFlags,
  AttachmentBuilder
} from 'discord.js';

export function findItemByIdOrAlias(input) {
  const lower = input.toLowerCase();

  const item = Object.values(ITEM_DEFINITIONS).find(item =>
    item.id.toLowerCase() === lower ||
    item.id.replace(/_/g, '').toLowerCase() === lower ||
    item.name.toLowerCase() === lower ||
    item.aliases?.some(alias => alias.toLowerCase() === lower)
  );

  return item || null;
}

// Example: getItemListByProperty('rarity', 'rare');
export function getItemListByProperty(key, value) {
  return Object.values(ITEM_DEFINITIONS).filter(item => item[key] === value);
}

export function getSellableItems() {
  return Object.values(ITEM_DEFINITIONS).filter(item => item.sellable);
}

export function getShopItems() {
  return Object.values(ITEM_DEFINITIONS).filter(item => item.purchaseable);
}

// Example: getRandomItem(item => item.rarity === 'rare')
export function getRandomItem(filterFn = () => true) {
  const filtered = Object.values(ITEM_DEFINITIONS).filter(filterFn);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getItemsBySource(sourceKey) {
  return Object.values(ITEM_DEFINITIONS).filter(
    item => item.source?.includes(sourceKey)
  );
}

export function getAllItemSources() {
  const sources = new Set();
  Object.values(ITEM_DEFINITIONS).forEach(item => {
    item.source?.forEach(src => sources.add(src));
  });
  return Array.from(sources);
}

async function generalShare(args, context, item, customHandler = null) {
  try {
    const itemName = args[0].toLowerCase() || null;
    const targetUser = args[1] || null;
    const amount = Math.abs(parseInt(args[2]) || 1) || 1;

    const {
      name,
      id,
      username
    } = discordUser(context);

    if (id === targetUser.id) {
      return await handleMessage(context, {
        content: `<:warning:1366050875243757699> **${name}**, you can't send ${item.emoji} **${item.name}** to yourself! 🤷🏻`
      })
    }

    if (isNaN(amount) || amount < 1) {
      return handleMessage(context, `<:warning:1366050875243757699> Invalid amount.`);
    }

    const senderData = await getUserData(id);
    const recipientData = await getUserData(targetUser.id);

    if (!senderData || !recipientData) return;

    const receiverItems = recipientData.inventory[item.id] || 0;
    const senderItems = senderData.inventory[item.id] || 0;

    if (senderItems < amount) {
      return await handleMessage(context, `🚫 | **${name}**, trying to send more ${item.emoji} **${item.name}** than you own? That’s not how math works.`);
    }

    if (typeof customHandler === 'function') {
      return customHandler(senderData, recipientData, amount, context);
    }

    await updateUser(id, {
      [`inventory.${item.id}`]: Math.max(senderItems - amount, 0)
    });
    await updateUser(targetUser.id, {
      [`inventory.${item.id}`]: Math.max(receiverItems + amount, 0)
    });

    const Container = new ContainerBuilder()
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`<a:ext_heart_pump:1359578512893149246> **${name}** has sent **${amount}** ${item.emoji} **${item.name}** to <@${targetUser.id}>!`),
      textDisplay => textDisplay.setContent(`-#  ✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
    );

    return await handleMessage(context, {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });

  } catch (error) {
    return await handleMessage(context, `**Error**: ${error.message}`);
  }
}

async function generalUse(args, context, item, customHandler = null) {
  try {
    const {
      id,
      name
    } = discordUser(context);
    const userData = await getUserData(id);
    if (!userData) {
      return await handleMessage(context, {
        content: `<:warning:1366050875243757699> ${name}, could not retrieve your data.`
      });
    }

    let itemAmount;

    // Initialize scratch count if missing
    if (typeof userData?.inventory?.[item.id] !== 'number') {
      userData.inventory[item.id] = 0;
    }

    itemAmount = userData.inventory?.[item.id] || 0;

    if (itemAmount < 1) {
      return await handleMessage(context, {
        content: `<:alert:1366050815089053808> **${name}**, you don't have any ${item.emoji} **${item.name}**. You can't use what you don't have!`
      })
    }

    if (typeof customHandler === 'function') {
      return customHandler(userData, args, context);
    }

  } catch (error) {
    return await handleMessage(context, `**Error**: ${error.message}`);
  }
}

export const ITEM_DEFINITIONS = {
  rose: {
    id: 'rose',
    name: 'Rose',
    emoji: '<:rose:1343097565738172488>',
    description: 'A romantic flower. Can be gifted to others. Share it with your spouse to increase your marriage BondXP. They can be found in ` shop ` and ` marriage daily `.',
    source: ["shop",
      "marriage"],
    useable: false,
    activatable: false,
    sellable: false,
    shareable: true,
    purchaseable: true,
    type: "gift",
    rarity: "common",
    price: 2500,
    eventsOnly: false,
    usableIn: ["marriage",
      "ship"],
    async buyHandler(args, context) {
      try {
        const {
          id: userId,
          name
        } = discordUser(context);

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1) {
          return handleMessage(context, `<:warning:1366050875243757699> Invalid amount.`);
        }

        let userData = await getUserData(userId);
        const rosesAmount = amount * 2500;

        if (userData.cash >= rosesAmount) {

          userData.cash -= rosesAmount;

          await updateUser(userId, {
            cash: userData.cash,
            'inventory.rose': (userData.inventory['rose'] || 0) + amount
          });

          const Container = new ContainerBuilder()
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`**${name}** bought **${amount}** <:rose:1343097565738172488> for <:kasiko_coin:1300141236841086977>**${rosesAmount}** 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
          );

          return await handleMessage(context, {
            components: [Container],
            flags: MessageFlags.IsComponentsV2
          })
        } else {
          return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, you don't have sufficient <:kasiko_coin:1300141236841086977> 𝑪𝒂𝒔𝒉 to purchase a <:rose:1343097565738172488>. You need <:kasiko_coin:1300141236841086977> ${rosesAmount} 𝑪𝒂𝒔𝒉`)
        }
      } catch(e) {
        console.error(e);
        return await handleMessage(context, "<:warning:1366050875243757699> Something went wrong while buying rose(s).")
      }
    },
    async shareHandler(args, context) {
      return generalShare(args, context, this, async (senderData, recipientData, amount, context) => {
        const {
          name, id
        } = discordUser(context);
        const toUser = args[1];

        if (!toUser?.id) {
          return handleMessage(context, `<:warning:1366050875243757699> Mentioned user not found.`);
        }

        const isSpouse = senderData.family?.spouse === toUser.id;
        const bondGain = amount * 10;

        if (amount > 1000) return handleMessage(context, "🚫 You can't send that many items at once.");

        const senderInv = senderData.inventory?.[this.id] ?? 0;
        const recipientInv = recipientData.inventory?.[this.id] ?? 0;

        if (isSpouse) {
          senderData.family.bondXP += bondGain;
          recipientData.family.bondXP += bondGain;

          await updateUser(id, {
            [`inventory.${this.id}`]: senderInv - amount,
            'family.bondXP': senderData.family.bondXP
          });

          await updateUser(toUser.id, {
            [`inventory.${this.id}`]: recipientInv + amount,
            'family.bondXP': recipientData.family.bondXP
          });

          return handleMessage(context, {
            components: [new ContainerBuilder().addTextDisplayComponents(textDisplay => textDisplay.setContent(`💖 | **${name}** sent **${amount}** roses to their spouse <@${toUser.id}>! 💞 BondXP increased by ${bondGain}!`))],
            flags: MessageFlags.IsComponentsV2
          })
        } else {
          await updateUser(id, {
            [`inventory.${this.id}`]: senderInv - amount
          });

          await updateUser(toUser.id, {
            [`inventory.${this.id}`]: recipientInv + amount
          });

          return handleMessage(context, {
            components: [new ContainerBuilder().addTextDisplayComponents(textDisplay => textDisplay.setContent(`<a:ext_heart_pump:1359578512893149246> **${name}** has sent ${this.emoji} **${amount}** roses to <@${toUser.id}>!`),
              textDisplay => textDisplay.setContent(`-#  ✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`))],
            flags: MessageFlags.IsComponentsV2
          });
        }
      });
    }
  },
  scratch_card: {
    id: 'scratch_card',
    name: 'Scratch Card',
    emoji: '<:scratch_card:1382990344186105911>',
    description: 'Scratch and win random cash. They can be found in ` shop `, ` scavenger `, and during Kasiko server events.',
    source: ["shop", "scavenger"],
    aliases: ["scratch"],
    useable: true,
    activatable: false,
    sellable: false,
    shareable: false,
    type: "consumable",
    rarity: "uncommon",
    price: 15000,
    eventsOnly: false,
    usableIn: ["use"],
    async useHandler(args,
      context) {
      return generalUse(args,
        context,
        this,
        async (senderData, args, context) => {
          const {
            name,
            id,
            username
          } = discordUser(context);

          senderData.inventory['scratch_card'] -= 1;

          const result = getScratchResult();
          if (result > 0) {
            senderData.cash += result;
          }
          await updateUser(id, {
            cash: senderData.cash,
            'inventory.scratch_card': senderData.inventory['scratch_card']
          });

          // Generate image
          let buffer;
          try {
            buffer = await generateScratchImage(result);
          } catch (e) {
            console.error('Canvas error:', e);
          }

          // Build embed
          const Container = new ContainerBuilder()
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`### 𝗦𝗖𝗥𝗔𝗧𝗖𝗛 𝗖𝗔𝗥𝗗 𝗥𝗘𝗦𝗨𝗟𝗧`)
          )
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(result > 0
              ? `Congratulations, ${name}! You won <:kasiko_coin:1300141236841086977> **${result.toLocaleString()}**.`: `Sorry, ${name}, no win this time.`)
          )
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`<:scratch_card:1382990344186105911> Remaining Cards — ${senderData.inventory.scratch_card}`)
          )
          .addMediaGalleryComponents(
            media =>
            media.addItems(
              item => item.setURL("attachment://scratch.png")
            )
          )

          const files = [];
          if (buffer) {
            const attachment = new AttachmentBuilder(buffer, {
              name: 'scratch.png'
            });
            files.push(attachment);
          }

          return await handleMessage(context, {
            components: [Container],
            files,
            flags: MessageFlags.IsComponentsV2
          });
        }
      )
    },
    async buyHandler(args,
      context) {
      try {
        const {
          id: userId,
          name
        } = discordUser(context);

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1) {
          return handleMessage(context, `<:warning:1366050875243757699> Invalid amount.`);
        }

        let userData = await getUserData(userId);

        const CARD_COST = 10000;
        const totalCost = amount * CARD_COST;
        if (userData.cash < totalCost) {
          return await handleMessage(context, {
            content: `<:warning:1366050875243757699> You need ${totalCost.toLocaleString()} Cash to buy ${amount} scratch card(s).`, ephemeral: true
          });
        }

        userData.cash -= totalCost;
        userData.inventory["scratch_card"] = (userData.inventory["scratch_card"] || 0) + amount;
        await updateUser(userId, {
          cash: userData.cash,
          'inventory.scratch_card': userData.inventory["scratch_card"]
        });

        const Container = new ContainerBuilder()
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`### <:scratch_card:1382990344186105911> 𝗦𝗖𝗥𝗔𝗧𝗖𝗛 𝗖𝗔𝗥𝗗𝗦 𝗣𝗨𝗥𝗖𝗛𝗔𝗦𝗘𝗗`),
          textDisplay => textDisplay.setContent(`🍾 **${name.toUpperCase()}**, you bought **${amount} scratch card${amount > 1 ? "s": ""}** for <:kasiko_coin:1300141236841086977> **${totalCost.toLocaleString()}**. You now have **${userData.inventory['scratch_card']}** scratch card${userData?.inventory?.scratch_card > 1 ? "s": ""}.`),
          textDisplay => textDisplay.setContent(`-# ❔ **HOW TO SCRATCH**\n-#  \` use scratch \`\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)
        )

        return await handleMessage(context, {
          components: [Container],
          flags: MessageFlags.IsComponentsV2
        });
      } catch(e) {
        console.error(e);
        return await handleMessage(context, "<:warning:1366050875243757699> Something went wrong while buying scratches.")
      }
    }
  },
  drink: {
    id: 'drink',
    name: 'Drink',
    description: 'An alcoholic drink. Can increase your crime rewards by 100%, but the chances of losing remain the same. They can be found in ` beg `, ` loot `, and during Kasiko server events.',
    source: ["loot",
      "beg"],
    emoji: '<:drink:1385131543948820520>',
    useable: false,
    activatable: true,
    sellable: false,
    shareable: true,
    type: "buff",
    rarity: "rare",
    price: null,
    eventsOnly: false,
    usableIn: ["crime"],
    onAcquire: null,
    async useHandler (args,
      context) {},
    async shareHandler (args,
      context) {
      await generalShare(args,
        context,
        this);
    }
  },
  lollipop: {
    id: 'lollipop',
    name: 'Lollipop',
    emoji: '<:lollipop:1385131583333203968>',
    description: 'A sweet gift. Kids love it! They can be found in ` daily `, ` beg `, and during Kasiko server events.',
    source: ["daily",
      "beg"],
    useable: false,
    activatable: false,
    sellable: true,
    shareable: true,
    sellPrice: 5000,
    type: "gift",
    rarity: "common",
    eventsOnly: false,
    usableIn: [],
    async shareHandler (args,
      context) {
      await generalShare(args,
        context,
        this);
    }
  },
  torch: {
    id: 'torch',
    name: 'Torch',
    description: 'Brightens up your path. Move more confidently during your dungeon and hunt. May reduce the chances of falling into traps. They can be found in ` beg `, ` loot `, ` scavenger `, and during Kasiko server events.',
    source: ["loot",
      "beg",
      "scavenger"],
    emoji: '<:torch:1385131605235863672>',
    useable: true,
    activatable: false,
    sellable: false,
    shareable: false,
    type: "tool",
    rarity: "rare",
    eventsOnly: false,
    usableIn: ['dungeon',
      "hunt"]
  },
  teddy: {
    id: 'teddy',
    name: 'Teddy Bear',
    emoji: '<:teddybear:1385131451321946113>',
    description: 'A soft and cuddly toy. Can be gifted or sold. They can be found in ` beg `, ` dungeon `, and during Kasiko server events.',
    source: ["dungeon",
      "beg"],
    useable: false,
    activatable: false,
    sellable: true,
    shareable: true,
    sellPrice: 6500,
    type: "gift",
    rarity: "uncommon",
    eventsOnly: false,
    usableIn: [],
    async shareHandler (args,
      context) {
      await generalShare(args,
        context,
        this);
    }
  },
  ticket: {
    id: 'ticket',
    name: 'Ticket',
    emoji: '<:ticket:1385194090982801480>',
    description: "Tickets are used in the ` loot ` command because you need them for transportation. They can be found in ` beg `, ` loot `, ` scavenger `, and during Kasiko server events.",
    source: ["loot",
      "beg",
      "scavenger"],
    useable: true,
    activatable: false,
    sellable: false,
    shareable: false,
    type: "consumable",
    rarity: "rare",
    eventsOnly: false,
    usableIn: ["loot"]
  }
};