import {
  ContainerBuilder,
  MessageFlags,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from "discord.js";

import {
  handleMessage,
  discordUser
} from '../../../helper.js';

export default {
  name: "avatar",
  description: "Displays a user's global and server-specific avatar images.",
  aliases: ["avatarinfo",
    "avinfo",
    "av"],
  cooldown: 10000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first() || message.author;
      const member = message.guild
      ? await message.guild.members.fetch(target.id): null;

      const globalAvatarURL = target.displayAvatarURL({
        format: 'png', dynamic: true, size: 1024
      });
      const serverAvatarURL = member
      ? member.displayAvatarURL({
        format: 'png', dynamic: true, size: 1024
      }): null;

      const container = new ContainerBuilder()
      .setAccentColor(0x00aaff)
      .addTextDisplayComponents(
        text => text.setContent(`## @${target.tag} AVATAR`),
        text => text.setContent(`*Global Avatar* **[DOWNLOAD](${globalAvatarURL})**`)
      )
      .addMediaGalleryComponents(
        media =>
        media.addItems(
          item => item.setURL(globalAvatarURL)
        )
      )
      .addActionRowComponents([
        new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
          .setCustomId('switch-avatar')
          .setLabel('Server Avatar')
          .setStyle(ButtonStyle.Secondary)
        )
      ])

      const sent = await handleMessage(message, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      if (!serverAvatarURL) return;

      const collector = sent?.createMessageComponentCollector({
        time: 60000
      });

      let showingGlobal = true;

      collector.on('collect', async (interaction) => {
        if (interaction.customId === 'switch-avatar') {
          showingGlobal = !showingGlobal;

          const newContainer = new ContainerBuilder()
          .setAccentColor(0x00aaff)
          .addTextDisplayComponents(
            text => text.setContent(`## @${target.tag} AVATAR`),
            text => text.setContent(`${showingGlobal ? `*Global Avatar* **[DOWNLOAD](${globalAvatarURL})**`: `*Server Avatar* **[DOWNLOAD](${serverAvatarURL})**`}`)
          )
          .addMediaGalleryComponents(
            media =>
            media.addItems(
              item => item.setURL(!showingGlobal ? serverAvatarURL: globalAvatarURL)
            )
          )
          .addActionRowComponents([
            new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
              .setCustomId('switch-avatar')
              .setLabel(showingGlobal ? 'Server Avatar': 'Global Avatar')
              .setStyle(ButtonStyle.Secondary)
            )
          ])

          await interaction.update({
            components: [newContainer],
            flags: MessageFlags.IsComponentsV2
          });
        }
      });
    } catch (e) {
      if (e.message !== 'Unknown Message' && e.message !== 'Missing Permissions') {
        console.error(e);
      }
    }
  }
};