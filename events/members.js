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

async function resolveChannel(client, channelId) {
  if (!channelId) return null;
  let channel = client.channels?.cache?.get(channelId);
  if (!channel && client.channels?.fetch) {
    channel = await client.channels.fetch(channelId).catch(() => null);
  }
  return channel;
}

export default function MemberEvents(client) {
  client.on("guildMemberRemove", async (member) => {
    try {
      if (!member?.guild?.id) return;
      const userId = member.id;
      const guildId = member.guild.id;

      await UserGuild.deleteOne({
        userId, guildId
      }).catch(() => {});

      const existingEmbed = await ContainerMessage.findOne({
        server: guildId,
        on: "leave"
      });

      if (existingEmbed) {
        const channel = await resolveChannel(client, existingEmbed?.channelId);
        if (!channel?.isTextBased()) return;

        const context = buildContextFromMember(member, channel);
        const containerPrev = await buildContainerFromData(existingEmbed, context);

        await channel.send({
          components: [containerPrev],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});
      }
    } catch (err) {
      console.error('[guildMemberRemove] Error:', err);
    }
  });

  client.on("guildMemberAdd", async (member) => {
    try {
      if (!member?.guild?.id) return;
      const existingEmbed = await ContainerMessage.findOne({
        server: member.guild.id,
        on: "join"
      });

      if (existingEmbed) {
        const channel = await resolveChannel(client, existingEmbed.channelId);
        if (!channel?.isTextBased()) return;

        const context = buildContextFromMember(member, channel);
        const containerPrev = await buildContainerFromData(existingEmbed, context);

        await channel.send({
          components: [containerPrev],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});
      }
    } catch (err) {
      console.error('[guildMemberAdd] Error:', err);
    }
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      if (!newMember?.guild?.id) return;
      // Boost detected
      if (!oldMember.premiumSince && newMember.premiumSince) {
        const existingEmbed = await ContainerMessage.findOne({
          server: newMember.guild.id,
          on: "boost"
        });
        
        if (existingEmbed) {
          const channel = await resolveChannel(client, existingEmbed.channelId);
          if (!channel?.isTextBased()) return;

          const context = buildContextFromMember(newMember, channel);
          const containerPrev = await buildContainerFromData(existingEmbed, context);

          await channel.send({
            components: [containerPrev],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[guildMemberUpdate] Error:', err);
    }
  });
}