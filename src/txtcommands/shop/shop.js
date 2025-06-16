import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  discordUser,
  handleMessage
} from '../../../helper.js';
import {
  Car
} from './cars.js';
import {
  Structure
} from './structures.js';
import {
  JEWELRY
} from './jewelry.js';

import {
  client
} from '../../../bot.js';

import {
  ALLITEMS
} from "./shopIDs.js";

import {
  sellCommand as SellAnimal
} from "../wildlife/sellCommand.js";

async function viewShop(context) {
  const {
    id: discordId,
    username,
    name
  } = discordUser(context);

  // Send initial embed with buttons
  const embed = new EmbedBuilder()
  .setTitle('<:cart:1355034533061460060> 𝗦𝗛𝗢𝗣 𝗠𝗘𝗡𝗨')
  .setDescription('Select a category below to view or purchase items.')
  .setImage('https://harshtiwari47.github.io/kasiko-public/images/shop-items.jpg')

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId(`shop_cars_${discordId}`)
    .setLabel('Cars')
    .setEmoji('1300487311758196837')
    .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
    .setCustomId(`shop_structures_${discordId}`)
    .setLabel('Structures')
    .setEmoji('1383712823443591308')
    .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
    .setCustomId(`shop_jewelry_${discordId}`)
    .setLabel('Jewelry')
    .setEmoji('1324632393121796106')
    .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
    .setCustomId(`shop_roses_${discordId}`)
    .setLabel('Roses')
    .setEmoji('1343097565738172488')
    .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
    .setCustomId(`shop_scratch_${discordId}`)
    .setLabel('Scratch')
    .setEmoji('1382990344186105911')
    .setStyle(ButtonStyle.Primary)
  );

  let messageSent;

  if (!!context.isCommand) {
    if (context.replied) return;
    messageSent = await context.editReply({
      embeds: [embed],
      components: [row]
    })
    .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    messageSent = await handleMessage(context, {
      embeds: [embed],
      components: [row]
    })
    .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }

  const collector = messageSent.createMessageComponentCollector({
    time: 180000
  });

  collector.on('collect', async (interaction) => {
    if (interaction.isButton()) {
      const [action,
        category,
        userId] = interaction.customId.split('_');
      if (userId !== interaction.user.id) {
        return interaction.reply({
          content: "⚠️ You cannot interact with someone else's shop menu.", ephemeral: true
        });
      }
      switch (category) {
        case 'cars':
          await interaction.deferReply({
            ephemeral: false
          });
          // Show paginated cars; adapt sendPaginatedCars to accept interaction
          return Car.sendPaginatedCars(interaction);
        case 'structures':
          await interaction.deferReply({
            ephemeral: false
          });
          return Structure.sendPaginatedStructures(interaction);

        case 'jewelry':
          await interaction.deferReply({
            ephemeral: false
          });
          return JEWELRY.sendPaginatedJewelry(interaction);

        case 'roses':
          // Show modal to input amount of roses
          const modalRoses = new ModalBuilder()
          .setCustomId(`shop_modal_roses_${interaction.user.id}`)
          .setTitle('Buy Roses');
          const inputRoses = new TextInputBuilder()
          .setCustomId('roses_amount')
          .setLabel('Quantity of Roses')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter number of roses')
          .setRequired(true);
          modalRoses.addComponents(
            new ActionRowBuilder().addComponents(inputRoses)
          );
          return interaction.showModal(modalRoses);
        case 'scratch':
          // Show modal to input amount of scratch cards
          const modalScratch = new ModalBuilder()
          .setCustomId(`shop_modal_scratch_${interaction.user.id}`)
          .setTitle('Buy Scratch Cards');
          const inputScratch = new TextInputBuilder()
          .setCustomId('scratch_amount')
          .setLabel('Quantity of Scratch Cards')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter number of scratch cards')
          .setRequired(true);
          modalScratch.addComponents(
            new ActionRowBuilder().addComponents(inputScratch)
          );
          return interaction.showModal(modalScratch);
        default:
          return;
      }
    }
  });
}


export default {
  name: 'shop',
  description: 'View and purchase items in the shop via buttons or text commands.',
  aliases: ['store',
    'market'],
  args: '[category]',
  emoji: '🏬',
  category: '🛍️ Shop',
  cooldown: 10000,

  async execute(args,
    context) {

    const category = args[1] ? args[1].toLowerCase(): null;
    const itemId = args[2] ? args[2].toLowerCase(): null;

    // Handle "shop" categories (viewing items)
    switch (category) {
    case "cr":
    case "car":
    case "cars":
      return Car.sendPaginatedCars(context);
      break;

    case "jewelry":
    case "jewellery":
    case "rings":
    case "ring":
    case "necklace":
    case "watches":
    case "watch":
    case "strips":
      return JEWELRY.sendPaginatedJewelry(context);
      break;

    case "structure":
    case "building":
    case "house":
      return Structure.sendPaginatedStructures(context);
      break;
    }

    const shopGuideembed = new EmbedBuilder()
    .setTitle("<:cart:1355034533061460060> SHOP COMMANDS")
    .setDescription("-# Browse and trade various items.")
    .addFields(
      {
        name: "❔ View Items",
        value: `**\`\`\`xml` +
        `\n<\n⪩ shop car` +
        `\n⪩ shop structure` +
        `\n⪩ shop jewelry` +
        `\n>\`\`\`**`,
        inline: false
      },
      {
        name: "❔ How to Buy",
        value: `**\`\`\`xml` +
        `\n⪩ buy car <car_id>` +
        `\n⪩ buy structure <structure_id>` +
        `\n⪩ buy jewelry <jewelry_id>` +
        `\n⪩ buy roses <amount>` +
        `\n⪩ buy scratch <amount>\`\`\`**`,
        inline: false
      },
      {
        name: "❔ How to Sell",
        value: `**\`\`\`xml` +
        `\n⪩ sell car <car_id>\n` +
        `⪩ sell structure <structure_id>\n` +
        `⪩ sell jewelry <jewelry_id>\`\`\`**`,
        inline: false
      }
    )
    .setFooter({
      text: "𝖧𝖺𝗉𝗉𝗒 𝗌𝗁𝗈𝗉𝗉𝗂𝗇𝗀!"
    });

    const rowGuide = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId(`shop_view`)
      .setLabel('VIEW SHOP')
      .setEmoji('1355034533061460060')
      .setStyle(ButtonStyle.Primary)
    )

    const shopGuideSent = await handleMessage(context,
      {
        embeds: [shopGuideembed],
        components: [rowGuide]
      }).catch(err => ![50001,
        50013,
        10008].includes(err.code) && console.error(err));

    const collectorGuide = shopGuideSent.createMessageComponentCollector({
      time: 180000
    });

    collectorGuide.on('collect',
      async (interaction) => {
        if (interaction.customId.includes('shop_view')) {
          await interaction.deferUpdate();
          return viewShop(interaction)
        }
      });
  }
};

client.on('interactionCreate', async (interaction) => {
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.includes("shop_modal")) {
    try {
      const [_,
        __,
        type,
        userId] = interaction.customId.split('_');
      if (userId !== interaction.user.id) {
        return await handleMessage(interaction, {
          content: "⚠️ Invalid interaction.", ephemeral: true
        });
      }
      const {
        id: discordId,
        username,
        name
      } = discordUser(interaction);

      if (!interaction.deferred) {
        await interaction.deferReply();
      }

      const userData = await getUserData(discordId);
      if (type === 'roses') {
        const amountStr = interaction.fields.getTextInputValue('roses_amount');
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount <= 0) {
          return await handleMessage(interaction, {
            content: '⚠️ Please enter a valid positive number.', ephemeral: true
          });
        }
        const cost = amount * 2500;
        if (userData.cash < cost) {
          return await handleMessage(interaction, {
            content: `⚠️ You need ${cost} Cash to buy ${amount} rose(s).`, ephemeral: true
          });
        }
        userData.cash -= cost;
        userData.roses = (userData.roses || 0) + amount;
        await updateUser(discordId, {
          cash: userData.cash, roses: userData.roses
        });
        return await handleMessage(interaction, {
          content: `**${name}** bought **${amount}** <:rose:1343097565738172488> for <:kasiko_coin:1300141236841086977>**${cost}** 𝑪𝒂𝒔𝒉.\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`, ephemeral: true
        });
      } else if (type === 'scratch') {
        const amountStr = interaction.fields.getTextInputValue('scratch_amount');
        const amount = parseInt(amountStr, 10);

        if (isNaN(amount) || amount <= 0) {
          return await handleMessage(interaction, {
            content: '⚠️ Please enter a valid positive number.', ephemeral: true
          });
        }
        const CARD_COST = 10000;
        const totalCost = amount * CARD_COST;
        if (userData.cash < totalCost) {
          return await handleMessage(interaction, {
            content: `⚠️ You need ${totalCost.toLocaleString()} Cash to buy ${amount} scratch card(s).`, ephemeral: true
          });
        }

        userData.cash -= totalCost;
        userData.scratchs = (userData.scratchs || 0) + amount;
        await updateUser(discordId, {
          cash: userData.cash, scratchs: userData.scratchs
        });

        return await handleMessage(interaction, {
          embeds: [new EmbedBuilder().setDescription(`## <:scratch_card:1382990344186105911> 𝗦𝗖𝗥𝗔𝗧𝗖𝗛 𝗖𝗔𝗥𝗗𝗦 𝗣𝗨𝗥𝗖𝗛𝗔𝗦𝗘𝗗\n\n` + `> 🍾 **${name.toUpperCase()}**, you bought **${amount} scratch card${amount > 1 ? "s": ""}** for <:kasiko_coin:1300141236841086977> **${totalCost.toLocaleString()}**. You now have **${userData.scratchs}** scratch card${userData.scratchs > 1 ? "s": ""}.\n\n-# ❔ **HOW TO SCRATCH**\n-#  \` scratch card \`\n✦⋆  𓂃⋆.˚ ⊹ ࣪ ﹏𓊝﹏𓂁﹏`)]
        });
      }
    } catch (err) {}
  }
});