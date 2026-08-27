import {
  getUserData,
  updateUser
} from '../../../database.js';

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
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder
} from 'discord.js';

export default {
  name: 'inventory',
  description: 'View your inventory: scratch cards, roses, tools, animal food, etc.',
  aliases: ['inv', 'bag'],
  args: '',
  emoji: '🎒',
  category: '🛍️ Shop',
  cooldown: 5000,

  async execute(args, context) {
    try {
      const {
        id: userId,
        username,
        name
      } = discordUser(context);

      let userData;
      try {
        userData = await getUserData(userId);
      } catch (err) {
        return handleMessage(context, '❌ Unable to fetch your inventory right now. Please try again later.');
      }

      const userInv = userData?.inventory && typeof userData?.inventory === "object" ? userData.inventory : {};

      const inventoryItems = Object.keys(userInv)
        .map(key => {
          const itemDef = ITEM_DEFINITIONS[key];
          if (!itemDef) return null;

          const rawCount = parseInt(userInv[key], 10);
          const count = isNaN(rawCount) || rawCount < 0 ? 0 : rawCount;
          if (count === 0) return null; // Only show owned items

          return {
            id: itemDef.id,
            name: itemDef.name,
            emoji: itemDef.emoji,
            useable: itemDef.useable,
            activatable: itemDef.activatable,
            sellable: itemDef.sellable,
            shareable: itemDef.shareable,
            count
          };
        })
        .filter(Boolean);

      const ItemsPerPage = 4;
      let currentPage = 1;
      const TotalPages = Math.max(1, Math.ceil(inventoryItems.length / ItemsPerPage));

      const GenContainer = (page) => {
        const start = (page - 1) * ItemsPerPage;
        const ITEMS = inventoryItems.slice(start, start + ItemsPerPage);

        const Container = new ContainerBuilder()
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`### 🎒 **${name.toUpperCase()}'S INVENTORY**`),
            textDisplay => textDisplay.setContent(`-# Page ${page}/${TotalPages} · Use \`kas info <item>\` or \`kas use <item>\` for details`)
          );

        if (ITEMS.length === 0) {
          Container.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`*Your bag is currently empty! Use \`kas shop\`, \`kas hunt\`, \`kas loot\`, or \`kas tasks\` to collect items.*`)
          );
        } else {
          for (const item of ITEMS) {
            const tags = [];
            if (item.sellable) tags.push('**Sellable**');
            if (item.shareable) tags.push('**Shareable**');
            if (item.useable || item.activatable) tags.push('**Useable**');

            Container.addTextDisplayComponents(
              textDisplay => textDisplay.setContent(`${item.emoji} **${item.name}** — \`${item.count}\``),
              textDisplay => textDisplay.setContent(`-# <:reply:1368224908307468408> ${tags.join(' · ') || 'Collectible'}`)
            );
          }
        }

        Container.addSeparatorComponents(separate => separate);

        if (TotalPages > 1) {
          Container.addActionRowComponents(
            ActionRow => ActionRow.addComponents([
              new ButtonBuilder()
                .setCustomId("leftinv")
                .setLabel("◀")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page <= 1),
              new ButtonBuilder()
                .setCustomId("rightinv")
                .setLabel("▶")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page >= TotalPages)
            ])
          );
        }

        return Container;
      };

      const msgReply = await handleMessage(context, {
        components: [GenContainer(currentPage)],
        flags: MessageFlags.IsComponentsV2
      });

      if (TotalPages <= 1 || !msgReply?.createMessageComponentCollector) return;

      const collector = msgReply.createMessageComponentCollector({
        time: 120000
      });

      collector.on('collect', async interaction => {
        try {
          if (interaction.user.id !== userId) {
            return interaction.reply({
              content: `<:warning:1366050875243757699> You cannot interact with someone else's inventory!`,
              ephemeral: true
            });
          }

          if (interaction.customId === "leftinv") {
            currentPage = Math.max(1, currentPage - 1);
          } else if (interaction.customId === "rightinv") {
            currentPage = Math.min(TotalPages, currentPage + 1);
          }

          await interaction.update({
            components: [GenContainer(currentPage)],
            flags: MessageFlags.IsComponentsV2
          });
        } catch (err) {}
      });

    } catch (err) {
      console.error('[InventoryCommand] Error:', err);
      return handleMessage(context, {
        content: `**Inventory Error**: ${err.message}`
      });
    }
  }
};