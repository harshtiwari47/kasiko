import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
} from 'discord.js';

import IceCreamShop from "../../../../models/IceCream.js";
import layout from "./layout.js";
import helpEmbed from "./help.js";

import {
  makeIceCream
} from './make.js';
import {
  serveIceCream
} from './serve.js';

function capitalizeFirstLetter(word) {
  if (!word) return ""; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function getLayout(lvl) {
  if (lvl > 3) lvl = 3;
  return layout[lvl - 1].image;
}

function getDecoration(lvl) {
  if (lvl > 3) lvl = 3;
  return layout[lvl - 1].decoration;
}

import { handleMessage, discordUser } from '../../../../helper.js';

export async function playerShopInfo(playerShop, flavors, userId, username, context) {
  try {
    playerShop = await IceCreamShop.findOne({
      userId
    });

    let decoration = getDecoration(playerShop?.shopLayout) || `𐙚⋆🍂⁺₊ 〰˖ ִֶָ 🍨 ˚˖𓍢ִ໋🦢💮`;
    const embed = new EmbedBuilder()
    .setColor((layout[playerShop.shopLayout - 1]?.color || "#eedd97"))
    .setTitle(`🍦 ${playerShop.shopName}'s 𝑆𝐻𝑂𝑃`)
    .setDescription(
      `**Customers Served:** ${playerShop.customersServed}\n**Money:** <:creamcash:1309495440030302282> ${playerShop.money} cash\n**Loyalty Points:** ✪ ${playerShop.loyaltyPoints}\n**Reputation:** ${playerShop.reputation}\n**Shop Level:** ${playerShop.shopLevel}\n**Shop Layout:** ${playerShop.shopLayout}\n${decoration}`
    )
    .setImage(getLayout(playerShop.shopLayout)) // Replace with a relevant image URL
    .setFooter({
      text: "Keep serving and upgrading to reach new heights!"
    });

    const embed2 = new EmbedBuilder()
    .setColor('#f5bbaf')
    .setDescription(`**𝑆𝐻𝑂𝑃 𝐹𝐿𝐴𝑉𝑂𝑈𝑅𝑆**\n${playerShop.flavors.map(flavour => `**${flavour.icecream}** (${flavour.items})`).join(", ")}`);

    const rowComp = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('serve_ice')
      .setLabel('SERVE 🍧')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false),
      new ButtonBuilder()
      .setCustomId('make_ice')
      .setLabel(`MAKE 🍨`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false),
      new ButtonBuilder()
      .setCustomId('ice_help')
      .setLabel(`❔`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false)
    );

    let responseMessage = await handleMessage(context, {
      embeds: [embed, embed2],
      components: [rowComp]
    });

    const collector = responseMessage?.createMessageComponentCollector ? responseMessage.createMessageComponentCollector({
      time: 120 * 1000,
    }) : null;

    if (!collector) return;

    collector.on('collect', async (interaction) => {
      try {
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: 'You are not allowed to interact!',
            ephemeral: true,
          }).catch(() => {});
        }

        if (interaction.customId === 'serve_ice') {
          return await serveIceCream(playerShop, flavors, interaction.user.id, interaction.user.username, interaction);
        }

        if (interaction.customId === 'make_ice') {
          return await makeIceCream(playerShop, flavors, interaction.user.id, interaction.user.username, interaction);
        }

        if (interaction.customId === 'ice_help') {
          return await handleMessage(interaction, {
            embeds: [helpEmbed],
            ephemeral: true
          });
        }

      } catch (err) {
        console.error(err);
        await handleMessage(interaction, {
          content: '⚠️ Something went wrong while performing ice cream command button!'
        });
      }
    });

    collector.on('end',
      async () => {
        await responseMessage.edit({
          components: []
        }).catch(() => {});
      })
  } catch (err) {}
}