import {
  buildContainerFromData
} from "../src/txtcommands/server/embed-test.js";
import UserGuild from '../models/UserGuild.js';
import ContainerMessage from '../models/Containers.js';

import {
  ChannelType,
  MessageFlags
} from "discord.js";

function buildContextFromMember(member, channel, message = null) {
  return {
    member: member ?? null,
    user: member?.user ?? null,
    author: member?.user ?? null,
    guild: member?.guild ?? null,
    channel: channel ?? null,
    message: message
  };
}

export default function MemberEvents(client) {
  client.on("guildMemberRemove", async (member) => {
    const userId = member.id;
    const guildId = member.guild.id;

    await UserGuild.deleteOne({
      userId, guildId
    });

    const existingEmbed = await ContainerMessage.findOne({
      server: guildId,
      on: "leave"
    });

    if (existingEmbed) {
      const channel = client.channels?.cache?.get(existingEmbed?.channelId || null);

      if (!channel?.isTextBased()) return;

      const context = buildContextFromMember(member, channel);

      const containerPrev = await buildContainerFromData(existingEmbed, context);

      await channel.send({
        components: [containerPrev],
        flags: MessageFlags.IsComponentsV2
      }).catch(e => {})
    }
  });

  client.on("guildMemberAdd",
    async (member) => {
      const existingEmbed = await ContainerMessage.findOne({
        server: member.guild.id,
        on: "join"
      });

      if (existingEmbed) {
        const channel = client.channels.cache.get(existingEmbed.channelId || "");
        if (!channel?.isTextBased()) return;

        const context = buildContextFromMember(member, channel);
        const containerPrev = await buildContainerFromData(existingEmbed, context);

        await channel.send({
          components: [containerPrev],
          flags: MessageFlags.IsComponentsV2
        }).catch((er) => {});
      }
    });

  client.on("guildMemberUpdate",
    async (oldMember, newMember) => {
      // Boost detected
      if (!oldMember.premiumSince && newMember.premiumSince) {
        const existingEmbed = await ContainerMessage.findOne({
          server: newMember.guild.id,
          on: "boost"
        });
        
        if (existingEmbed) {
          const channel = client.channels.cache.get(existingEmbed.channelId || "");
          if (!channel?.isTextBased()) return;

          const context = buildContextFromMember(newMember, channel);
          const containerPrev = await buildContainerFromData(existingEmbed, context);

          await channel.send({
            components: [containerPrev],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      }
    });
}