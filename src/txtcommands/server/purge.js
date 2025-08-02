import {
  ContainerBuilder,
  MessageFlags
} from "discord.js";

import {
  Helper,
  discordUser,
  handleMessage,
  wait
} from '../../../helper.js';

export default {
  name: "purge",
  description: "Delete recent messages. Target bots or specific users.",
  aliases: ["clear",
    "clean",
    "pb",
    "purgebot"],
  args: false,
  example: ["purge 20",
    "purge 50 @user",
    "pb",
    "purge bot",
    "purge 30 bot"],
  category: "server",
  emoji: "🧹",
  cooldown: 10000,
  async execute(args, message) {
    const {
      channel,
      member,
      client
    } = message;

    if (!member.permissions.has("ManageMessages")) {
      return handleMessage(message, {
        content: "<:alert:1366050815089053808> You need the `Manage Messages` permission to use this command.",
        ephemeral: true
      });
    }

    const hasBotKeyword = args.includes("bot");
    const requestedAmount = parseInt(args.find(a => !isNaN(parseInt(a))));
    const mentions = message.mentions.users;
    const target = mentions.first();
    const isPBCommand = args[0]?.toLowerCase() === "pb";

    if (args.length && isNaN(requestedAmount) && !hasBotKeyword && !target && !isPBCommand) {
      return handleMessage(message, {
        content: "<:warning:1366050875243757699> Please provide a number, a user mention, or `bot`.",
        ephemeral: true
      });
    }

    const limit = Math.min(requestedAmount || 20, 100); // default 20, max 100

    try {
      const messages = await channel.messages.fetch({
        limit: 100
      });
      const filtered = messages.filter(msg => {
        if (target) return msg.author.id === target.id;
        if (hasBotKeyword || isPBCommand) return msg.author.bot;
        return true;
      });
      const toDelete = filtered.first(limit);

      if (!toDelete.length) {
        return handleMessage(message, {
          content: "<:checkbox_cross:1388858904095625226> No matching messages found to delete.",
          ephemeral: true
        });
      }

      await channel.bulkDelete(toDelete, true);

      const counts = new Map();
      for (const msg of toDelete) {
        const key = msg.author.id;
        counts.set(key, (counts.get(key) || 0) + 1);
      }

      const breakdown = Array.from(counts.entries())
      .map(([userId, cnt]) => {
        const user = client.users.cache.get(userId);
        const name = user ? `@${user.username}`: `<@${userId}>`;
        return `${name} (${cnt})`;
      })
      .join(", ");

      const executor = `**${message.author.username}**`;
      const total = toDelete.length;
      const response = `<:checkbox_checked:1388858843324350474> ${executor} deleted **${total}** message(s):\n\n${breakdown}.`;

      const msgtoDel = await handleMessage(message, {
        content: response,
        flags: MessageFlags.SuppressNotifications
      });
      
      await wait(3000);
      await msgtoDel.delete().catch(() => {});
      return;

    } catch (err) {
      console.error("Purge command error:", err);
      return handleMessage(message, {
        content: "<:warning:1366050875243757699> An error occurred while deleting messages. Check my permissions and try again.",
        ephemeral: true
      });
    }
  }
};