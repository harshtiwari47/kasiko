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
  name: "banner",
  description: "Displays a user's global banner image or their accent color if no banner is set.",
  aliases: ["bannerinfo",
    "bnr"],
  cooldown: 10000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first() || message.author;

      const fullUser = await message.client.users.fetch(target.id, {
        force: true
      });

      const bannerURL = fullUser.bannerURL({
        format: 'png', dynamic: true, size: 1024
      });

      const accentColor = fullUser.accentColor
      ? `#${fullUser.accentColor.toString(16).padStart(6, '0')}`: null;

      const container = new ContainerBuilder()
      .setAccentColor(0x00aaff)
      .addTextDisplayComponents(
        text => text.setContent(`## @${target.tag} BANNER`)
      );

      if (bannerURL) {
        container
        .addTextDisplayComponents(
          text => text.setContent(`*Global Banner* **[DOWNLOAD](${bannerURL})**`)
        )
        .addMediaGalleryComponents(
          media => media.addItems(item => item.setURL(bannerURL))
        );
      } else {
        container
        .addTextDisplayComponents(
          text => text.setContent(`*No banner set.*\nAccent Color: **${accentColor || 'None'}**`)
        );
      }

      await handleMessage(message, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (e) {
      if (e.message !== 'Unknown Message' && e.message !== 'Missing Permissions') {
        console.error(e);
      }
    }
  }
};