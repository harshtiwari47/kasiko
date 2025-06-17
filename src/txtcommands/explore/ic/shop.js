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

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data);
  } else {
    return context.channel.send(data);
  }
}

export async function playerShopInfo(playerShop, flavors, userId, username, context) {
  try {
    playerShop = await IceCreamShop.findOne({
      userId
    });

    let decoration = `𐙚⋆🍂⁺₊ 〰˖ ִֶָ 🍨 ˚˖𓍢ִ໋🦢💮`;
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

    const collector = responseMessage.createMessageComponentCollector({
      time: 120 * 1000,
    });

    let collectorEnded = false;

    collector.on('collect', async (interaction) => {
      if (interaction.replied || interaction.deferred) return; // Do not reply again
      try {
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: 'You are not allowed to interact!',
            ephemeral: true,
          });
        }

        if (interaction.customId === 'serve_ice') {
          await interaction.deferReply();
          return await serveIceCream(playerShop, flavors, interaction.user.id, interaction.user.username, interaction);
        }

        if (interaction.customId === 'make_ice') {
          await interaction.deferReply();
          return await makeIceCream(playerShop, flavors, interaction.user.id, interaction.user.username, interaction);
        }

        if (interaction.customId === 'ice_help') {
          await interaction.deferReply({
            ephemeral: true
          });
          return await interaction.editReply({
            embeds: [helpEmbed]
          })
        }

      } catch (err) {
        console.error(err)
        if (!interaction.deferred) await interaction.deferReply();
        await interaction.followUp({
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