import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  ALLITEMS
} from "./shopIDs.js";

import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ITEM_DEFINITIONS
} from "../../inventory.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionType,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder
} from 'discord.js';

export default {
  name: 'inventory',
  description: 'View your inventory: scratch cards, roses, etc., with sellable/shareable info.',
  aliases: ['inv',
    'bag'],
  args: '',
  emoji: '🎒',
  category: '🛍️ Shop',
  cooldown: 10000,

  async execute(args, context) {
    try {
      const {
        id: userId,
        username,
        name,
        avatar
      } = discordUser(context);

      let userData;
      try {
        userData = await getUserData(userId);
      } catch (err) {
        return handleMessage(context, '❌ Unable to fetch your inventory right now. Please try again later.');
      }

      const userInv = userData?.inventory && typeof userData?.inventory === "object" ? userData.inventory: {};

      const inventoryItems = Object.keys(userInv).map(key => {
        const {
          id,
          name,
          emoji,
          useable,
          activatable,
          sellable,
          shareable
        } = ITEM_DEFINITIONS[key];

        userInv[key] = parseInt(userInv[key]) < 0 ? 0: parseInt(userInv[key]);

        return {
          id,
          name,
          emoji,
          useable,
          activatable,
          sellable,
          shareable,
          count: userInv[key]
        }
      });

      const ItemsPerPage = 4;
      let currentPage = 1;
      let start = (currentPage - 1) * ItemsPerPage;
      const TotalPages = Math.ceil(inventoryItems.length / ItemsPerPage);

      const GenContainer = (currentPage) => {

        const start = (currentPage - 1) * ItemsPerPage;
        const ITEMS = inventoryItems.slice(start, start + ItemsPerPage);

        const Container = new ContainerBuilder()
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`### 🎒 𝗜𝗡𝗩𝗘𝗡𝗧𝗢𝗥𝗬`),
          textDisplay => textDisplay.setContent(`-# ${name} ◎ \`info \`**\`<item>\`**`)
        );

        // For each item, add a field
        for (const item of ITEMS) {
          // Format value with count and flags
          const lines = [];
          lines.push(`-# <:reply:1368224908307468408> ${item.sellable ? '**Sellable** ': ''}${item.shareable ? '**Shareable** ': ''}${item.useable ? '**Useable** ': ''}`);
          Container.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`${item.emoji}  **${item.name}** — ${item.count}`)
          );

          Container.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(lines.join('\n'))
          );
        }

        Container.addSeparatorComponents(separate => separate);

        Container.addActionRowComponents(
          ActionRow => ActionRow
          .addComponents([
            new ButtonBuilder()
            .setCustomId("leftinv")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 1 ? true: false),
            new ButtonBuilder()
            .setCustomId("rightinv")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === TotalPages ? true: false)
          ])
        )

        return Container;
      }

      // Send embed
      const msgReply = await handleMessage(context, {
        components: [GenContainer(currentPage)],
        flags: MessageFlags.IsComponentsV2
      });

      const collector = msgReply.createMessageComponentCollector({
        time: 150000
      });

      collector.on('collect', async interaction => {
        try {
          if (interaction.replied || interaction.deferred) return;

          if (interaction.user.id !== userId) {
            interaction.reply({
              context: `You are not allowed to interact with someone else's button!`
            })
          }

          await interaction.deferUpdate();
          if (interaction.customId === "leftinv") {
            currentPage -= 1;
            await interaction.editReply({
              components: [GenContainer(currentPage)],
              flags: MessageFlags.IsComponentsV2
            })
          }

          if (interaction.customId === "rightinv") {
            currentPage += 1;
            await interaction.editReply({
              components: [GenContainer(currentPage)],
              flags: MessageFlags.IsComponentsV2
            })
          }
        } catch (err) {}
      });

      collector.on('end',
        async () => {
          try {
            const comp = (msgReply.components || []).map(e => new ContainerBuilder(e));
            comp[0] = comp[0] ?? new ContainerBuilder();
            comp[0].components = (comp[0].components || []).slice(0, 6).map(e => new TextDisplayBuilder(e).setContent(e?.data?.data?.content || "-# TimeOut"))

            await msgReply.edit({
              components: comp
            }).catch((err) => {});
          } catch (e) {}
        })
    } catch (ercr) {
      return await handleMessage(context,
        {
          content: `**Inventory Error**: ${ercr.message}`
        })
    }
  }
};