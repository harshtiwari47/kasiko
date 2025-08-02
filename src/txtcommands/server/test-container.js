import {
  ContainerBuilder,
  MessageFlags
} from "discord.js";

import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

export function buildContainerFromData(data) {
  const container = new ContainerBuilder();

  // Accent Color
  if (data.accentColor) {
    container.setAccentColor(data.accentColor);
  }

  // Add Top-Level Text
  if (Array.isArray(data.text)) {
    data.text.forEach(content => {
      container.addTextDisplayComponents(text => text.setContent(content));
    });
  }

  // Add Components in Order (text, section, separator, etc.)
  if (Array.isArray(data.components)) {
    for (const comp of data.components) {
      if (comp.type === "text") {
        container.addTextDisplayComponents(text =>
          text.setContent(comp.content)
        );
      }

      if (comp.type === "separator") {
        container.addSeparatorComponents(sep => sep);
      }

      if (comp.type === "section") {
        container.addSectionComponents(section => {
          // Only one text allowed
          if (comp.text) {
            section.addTextDisplayComponents(text =>
              text.setContent(comp.text)
            );
          }

          // Only one media allowed
          if (comp.media) {
            section.setThumbnailAccessory(thumbnail =>
              thumbnail
              .setDescription(comp.media.description || "")
              .setURL(comp.media.url)
            );
          }

          return section;
        });
      }

      if (comp.type === "media") {
        container.addMediaGalleryComponents(
          media => {
            if (comp.urls.length) {
              for (const url of comp.urls) {
                media.addItems(
                  item => item.setURL(url)
                )
              }
            }

            return media
          }
        )
      }
    }
  }

  return container;
}

export default {
  name: "test-container",
  description: "Send a demo ContainerBuilder message",
  aliases: ["testcon"],
  args: false,
  example: ["container"],
  category: "server",
  emoji: "📦",
  visible: false,
  cooldown: 10000,
  async execute(args,
    context) {
    const {
      username,
      avatar,
      name,
      id
    } = discordUser(context);

    const data = {
      accentColor: 0xcbd7e7,
      text: [`### ᥫ᭡ **WELCOME **𐙚 <@${id}>`],

      components: [{
        type: "text",
        content: `〰˖ ִֶָ 🍨 𝑊𝑒 𝑎𝑟𝑒 𝑡ℎ𝑟𝑖𝑙𝑙𝑒𝑑 𝑡𝑜 ℎ𝑎𝑣𝑒 𝑦𝑜𝑢 ℎ𝑒𝑟𝑒, **${name}** !  💮`
      },
        {
          type: "section",
          text: `-# 𝘌𝘹𝘱𝘭𝘰𝘳𝘦, 𝘭𝘦𝘢𝘳𝘯, 𝘢𝘯𝘥 𝘦𝘯𝘫𝘰𝘺 𝘺𝘰𝘶𝘳 𝘵𝘪𝘮𝘦 𝘸𝘪𝘵𝘩 𝘶𝘴! 𓂃 ࣪˖ ִֶָ🐇་༘࿐
          °.🐚`,
          media: {
            url: avatar,
            description: "Fox Emoji"
          }
        },
        {
          type: "separator"
        },
        {
          type: "media",
          urls: ["https://cdn.discordapp.com/attachments/1303172423415365743/1313774197591379980/file-y0NhucIxrVC5vVEZAx2nQpZt.webp?ex=68853151&is=6883dfd1&hm=13f586b24547e5c1f2546754dd2a5c29f33aef67caa4bd9cf26194ec2a5817ba&"]
        }]
    };

    const container = buildContainerFromData(data);

    return handleMessage(context,
      {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
  }
};