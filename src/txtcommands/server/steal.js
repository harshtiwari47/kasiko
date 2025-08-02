import {
  GuildEmoji,
  Attachment,
  Sticker
} from "discord.js";
import { handleMessage } from "../../../helper.js";

export default {
  name: "steal",
  description: "Steal custom emojis or stickers into this guild.",
  aliases: ["emoji-steal", "stealemoji", "stealsticker"],
  args: false,
  example: [
    "steal",
    "steal <:thonk:123456789012345678>",
    "steal 123456789012345678",
    "steal sticker 987654321098765432"
  ],
  category: "server",
  emoji: "🗃️",
  cooldown: 10000,
  async execute(args, message) {
    const { member, guild, channel, client, author } = message;

    if (!member.permissions.has("ManageEmojisAndStickers")) {
      return handleMessage(message, {
        content: "<:checkbox_cross:1388858904095625226> You need the **Manage Emojis and Stickers** permission to use this.",
        ephemeral: true
      });
    }

    // Notify user that stealing is in progress
    const statusMsg = await channel.send("<a:lg_flower:1356865948501540914> Stealing emojis and stickers…");

    // Collect targets
    const emojisToAdd   = new Map(); // id → { name, animated }
    const stickersToAdd = new Map(); // id → name

    // 1) If replying, extract from that message
    if (message.reference?.messageId) {
      const ref = await channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (ref) {
        const regex = /<(a?):([a-zA-Z0-9_]+):(\d+)>/g;
        let m;
        while ((m = regex.exec(ref.content || ""))) {
          emojisToAdd.set(m[3], { name: m[2], animated: Boolean(m[1]) });
        }
        for (const st of ref.stickers.values()) {
          stickersToAdd.set(st.id, st.name);
        }
      }
    }

    // 2) Parse arguments
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      const em = /<(a?):([a-zA-Z0-9_]+):(\d+)>/.exec(a);
      if (em) {
        emojisToAdd.set(em[3], { name: em[2], animated: Boolean(em[1]) });
        continue;
      }
      if (a.toLowerCase() === "sticker" && /^\d{17,19}$/.test(args[i + 1])) {
        const id = args[++i];
        stickersToAdd.set(id, `sticker_${id}`);
        continue;
      }
      if (/^\d{17,19}$/.test(a)) {
        stickersToAdd.set(a, `sticker_${a}`);
        emojisToAdd.set(a, { name: `emoji_${a}`, animated: false });
      }
    }

    // 3) Check capacity
    const freeEmojiSlots   = guild.maximumEmojis   - guild.emojis.cache.size;
    const freeStickerSlots = guild.maximumStickers - guild.stickers.cache.size;

    if (emojisToAdd.size > freeEmojiSlots) {
      await statusMsg.edit(`<:warning:1366050875243757699> You want to add ${emojisToAdd.size} emojis but only ${freeEmojiSlots} slots are free.`);
      return;
    }
    if (stickersToAdd.size > freeStickerSlots) {
      await statusMsg.edit(`<:warning:1366050875243757699> You want to add ${stickersToAdd.size} stickers but only ${freeStickerSlots} slots are free.`);
      return;
    }

    // 4) Perform steals
    const added       = [];
    const permFailed  = [];
    const otherFailed = [];

    for (const [id, { name, animated }] of emojisToAdd.entries()) {
      const ext = animated ? "gif" : "png";
      const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?quality=lossless`;
      try {
        const c = await guild.emojis.create({ attachment: url, name });
        added.push(`:${c.name}:`);
      } catch (err) {
        if (err.code === 50013) permFailed.push(`<${animated ? "a" : ""}:${name}:${id}>`);
        else otherFailed.push(`<${animated ? "a" : ""}:${name}:${id}>`);
      }
    }

    for (const [id, name] of stickersToAdd.entries()) {
      let st = await client.fetchSticker(id).catch(() => null);
      if (!st) st = await guild.stickers.fetch(id).catch(() => null);
      if (!st) {
        otherFailed.push(`sticker:${id} (not found)`);
        continue;
      }
      try {
        const s = await guild.stickers.create({
          file: st.url,
          name,
          description: `Stolen by ${author.tag}`
        });
        added.push(`<:glow_tick:1356865976737464441> ${s.name}`);
      } catch (err) {
        if (err.code === 50013) permFailed.push(`sticker:${id}`);
        else otherFailed.push(`sticker:${id}`);
      }
    }

    // 5) Build report
    let report = "";
    if (added.length) {
      report += `<:checkbox_checked:1388858843324350474> Added **${added.length}** item(s): ${added.join(" ")}\n`;
    }
    if (permFailed.length) {
      report +=
        "<:checkbox_cross:1388858904095625226> I lack **Manage Emojis and Stickers** permission or my role is too low to add:\n" +
        `${permFailed.join(" ")}\n`;
    }
    if (otherFailed.length) {
      report +=
        "<:warning:1366050875243757699> Failed due to invalid ID/format or other error:\n" +
        `${otherFailed.join(" ")}`;
    }

    await statusMsg.edit(report.trim() || "<:warning:1366050875243757699> Nothing could be stolen.");
  }
};