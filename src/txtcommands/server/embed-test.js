import {
  ContainerBuilder,
  MessageFlags
} from "discord.js";

import {
  client
} from "../../../bot.js";

import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

import ContainerMessage from '../../../models/Containers.js';

/**
* Replace template variables in a string with actual values from context.
*/
function replaceVariables(str, ctx) {
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    if (ctx[key] != null) {
      return ctx[key];
    }
    return `{${key}}`;
  });
}

export function isValidURL(input) {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

function getNextTierRequirement(currentTier) {
  switch (currentTier) {
    case 0: return 2; // Tier 1 requires 2 boosts
    case 1: return 14; // Tier 2 requires 15 boosts
    case 2: return 24; // Tier 3 requires 30 boosts
    default: return 24; // Max tier, or unknown — assume 30
  }
}

export async function buildContainerFromData(data, context) {
  const isInteraction = !!context?.isCommand || !!context?.isChatInputCommand || !!context?.isMessageComponent;
  const defaultImgUrl = "https://cdn.discordapp.com/attachments/1369240175317876756/1403294449114808351/20250808_140054.png?ex=6897074c&is=6895b5cc&hm=a69ee77820830e742665be2510fe7982b724d0ff8716311b853435fd01bbbc61&"

  const member = context.member ?? context.user ?? context.author ?? null;
  const user = context.user ?? context.author ?? member?.user ?? null;
  const guild = context.guild ?? null;
  const channel = context.channel ?? null;
  const message = isInteraction ? context.message ?? null: context;

  await guild.members.fetch();

  const allMembers = guild?.members?.cache ?? new Map();
  const humanMembers = [...allMembers.values()].filter(m => !m.user.bot);
  const botMembers = [...allMembers.values()].filter(m => m.user.bot);

  const randomMember = allMembers.size > 0
  ? [...allMembers.values()][Math.floor(Math.random() * allMembers.size)]: null;

  const randomHuman = humanMembers.length > 0
  ? humanMembers[Math.floor(Math.random() * humanMembers.length)]: null;

  const fetchedUser = await client.users.fetch(member?.user?.id, { force: true });

  const ctx = {
    user: member ? member.user.username: '',
    user_tag: member ? member.user.tag: '',
    user_name: member ? member.displayName: '',
    user_avatar: member ? member.user.displayAvatarURL(): '',
    user_banner: fetchedUser ? fetchedUser.bannerURL({format: 'png', dynamic: true, size: 1024}) || '': '',
    user_discrim: member ? member.user.discriminator: '',
    user_id: member ? member.user.id: '',
    user_nick: member ? member.nickname || member.displayName || '': '',
    user_joindate: member && member.joinedAt ? member.joinedAt.toLocaleString(): '',
    user_createdate: member && member.user.createdAt ? member.user.createdAt.toLocaleString(): '',
    user_displaycolor: member ? member.displayHexColor: '',
    user_boostsince: member && member.premiumSince ? member.premiumSince.toLocaleString(): 'Not Found',

    server_boostlevel: guild ? guild.premiumTier: '',
    server_boostcount: guild ? guild.premiumSubscriptionCount: '',
    server_nextboostlevel: guild ? guild.premiumTier + 1: '',
    server_nextboostlevel_required: guild ? getNextTierRequirement(guild.premiumTier): '',
    server_nextboostlevel_until_required: guild && guild.premiumSubscriptionCount != null
    ? getNextTierRequirement(guild.premiumTier) - guild.premiumSubscriptionCount: '',
    server_name: guild?.name ?? '',
    server_id: guild?.id ?? '',
    server_owner_id: guild?.ownerId ?? '',
    server_membercount: guild?.memberCount ?? '',
    server_icon: guild?.iconURL() ?? '',
    server_banner: guild?.bannerURL() ?? '',
    server_splash: guild?.splashURL() ?? '',
    server_verification_level: guild?.verificationLevel ?? '',
    server_description: guild?.description ?? '',
    server_createdate: guild?.createdAt?.toLocaleString() ?? '',
    server_locale: guild?.preferredLocale ?? '',
    server_afk_timeout: guild?.afkTimeout ?? '',
    server_afk_channel: guild?.afkChannel?.name ?? '',
    server_nsfw_level: guild?.nsfwLevel ?? '',
    server_premium_progress_bar: guild?.premiumProgressBarEnabled ? 'Enabled': 'Disabled',
    server_membercount_nobots: humanMembers.length ?? '',
    server_botcount: botMembers.length ?? '',
    server_rolecount: guild?.roles?.cache?.size ?? '',
    server_channelcount: guild?.channels?.cache?.size ?? '',
    server_randommember: randomMember?.displayName ?? '',
    server_randommember_tag: randomMember?.user?.tag ?? '',
    server_randommember_nobots: randomHuman?.displayName ?? '',
    server_owner_tag: (await guild?.fetchOwner())?.user?.tag ?? '',

    channel: channel ? channel.id: '',
    channel_name: channel ? channel.name: '',
    channel_createdate: channel && channel.createdAt ? channel.createdAt.toLocaleString(): '',

    message_link: message ? message.url: '',
    message_id: message ? message.id: '',
    message_content: message ? message.content: '',

    date: new Date().toLocaleString(),
  };


  const container = new ContainerBuilder();

  // Accent Color
  if (data.accentColor) {
    container.setAccentColor(data.accentColor <= 16777215 ? data?.accentColor: null);
  }

  if (!data?.components?.length && !data.text) {
    container.addTextDisplayComponents(text => text.setContent(`Nothing to show here!!!`));
    return container;
  }

  // Add Top-Level Text
  if (Array.isArray(data?.text)) {
    const modifiedVal = replaceVariables(data?.text, ctx);
    data.text.forEach(content => {
      container.addTextDisplayComponents(text => text.setContent(modifiedVal));
    });
  }

  // Add Components in Order (text, section, separator, etc.)
  if (Array.isArray(data.components)) {
    for (const comp of data.components) {
      if (comp.type === "text") {
        const textVal = replaceVariables(comp.text?.content, ctx);

        container.addTextDisplayComponents(text =>
          text.setContent(textVal)
        );
      }

      if (comp.type === "separator") {
        container.addSeparatorComponents(sep => sep);
      }

      if (comp.type === "section") {
        container.addSectionComponents(section => {
          if (Array.isArray(comp.section?.textDisplays)) {
            for (const t of comp.section.textDisplays) {
              const modifiedVal = replaceVariables(t?.content, ctx);

              section.addTextDisplayComponents(text =>
                text.setContent(modifiedVal)
              );
            }
          }

          if (comp.section?.media) {
            const modifiedVal = replaceVariables(comp?.section?.media?.url, ctx);
            const MediaUrl = isValidURL(modifiedVal) ? modifiedVal : defaultImgUrl;

            section.setThumbnailAccessory(thumbnail =>
              thumbnail
              .setDescription(comp.section.media.description || "")
              .setURL(MediaUrl)
            );
          }

          return section;
        });
      }

      if (comp.type === "media" && Array.isArray(comp.media?.urls)) {
        container.addMediaGalleryComponents(media => {
          for (const url of comp.media.urls) {
            const modifiedVal = replaceVariables(url, ctx);
            if (isValidURL(modifiedVal)) {
              media.addItems(item => item.setURL(modifiedVal));
            } else {
              media.addItems(item => item.setURL(defaultImgUrl));
            }
          }
          return media;
        });
      }
    }
  }

  return container;
}

export default {
  name: "embed-test",
  description: "Send a demo ContainerBuilder message",
  aliases: ["testcon", "testembed", "embedtest"],
  args: false,
  example: ["container"],
  category: "server",
  emoji: "📦",
  visible: false,
  cooldown: 10000,
  async execute(args,
    context) {
    args.shift();

    const isInteraction = !!context?.isCommand || !!context?.isChatInputCommand || !!context?.isMessageComponent;

    if (isInteraction && (!context?.deferred && !context?.replied)) {
      await
      context.deferReply({
        ephemeral: true
      }).catch(e => {})
    }

    const {
      username,
      avatar,
      name,
      id
    } = discordUser(context);

    const embedName = args[0];

    let container = await ContainerMessage.findOne({
      server: context?.guild?.id,
      name: embedName
    });

    if (!container) {
      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt =>
        txt.setContent(`⚠️ No embed container named **${embedName}** found in this server.`)
      );

      return handleMessage(context, {
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    const containerPrev = await buildContainerFromData(container,
      context);

    if (!container?.channelId) {
      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt =>
        txt.setContent(`⚠️ No channel has been set for **${embedName}** in this server.`)
      );

      return handleMessage(context, {
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    const channel = client.channels?.cache?.get(container?.channelId);

    if (!channel) {
      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt =>
        txt.setContent(`⚠️ The designated channel for **${embedName}** could not be found in this server.`)
      );

      return handleMessage(context, {
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    try {
      await channel.send({
        components: [containerPrev],
        flags: MessageFlags.IsComponentsV2
      });

      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt =>
        txt.setContent(
          `✅ The test embed has been sent successfully!`
        )
      );

      await handleMessage(context, {
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
      return
    } catch (err) {
      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt =>
        txt.setContent(
          `⚠️ The bot is missing some permissions. An error occurred — please ensure it has the following: **Send Messages**, **Embed Links**, **Attach Files**, **Use External Emojis**, and **Use External Stickers**.`
        )
      );

      return handleMessage(context, {
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
  }
};