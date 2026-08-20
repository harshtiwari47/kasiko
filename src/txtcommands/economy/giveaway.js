import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import Giveaway from '../../../models/Giveaway.js';
import {
  startDailyGiveaway,
  resolveGiveaway,
  rerollGiveaway
} from '../../../utils/giveawayEngine.js';
import { getOwner, hasOwnerPermission } from '../../owner/ownerManager.js';
import { CHANNELS, COLORS } from '../../../constants.js';

function parseAmount(input) {
  if (!input) return null;
  const str = input.toLowerCase().trim();
  if (str.endsWith('k')) return Math.floor(parseFloat(str) * 1000);
  if (str.endsWith('m')) return Math.floor(parseFloat(str) * 1000000);
  if (str.endsWith('b')) return Math.floor(parseFloat(str) * 1000000000);
  const num = parseInt(str.replace(/,/g, ''), 10);
  return isNaN(num) || num <= 0 ? null : num;
}

export default {
  name: 'giveaway',
  description: 'View active daily giveaways or manage community cash drops (Staff).',
  aliases: ['giveaways', 'gstart', 'greroll', 'gend'],
  args: '[list|start|end|reroll] [options]',
  example: [
    'giveaway',
    'giveaway start 1000000 24',
    'giveaway end 123456789012345678',
    'giveaway reroll 123456789012345678'
  ],
  cooldown: 5000,
  category: '🏦 Economy',

  execute: async (args, message) => {
    try {
      const sub = (args[1] || 'list').toLowerCase();
      const userId = message.author.id;
      const ownerInfo = getOwner(userId);
      const isStaff = ownerInfo.isOwner && hasOwnerPermission(userId, 4);

      // ── Subcommand: START ─────────────────────────────────────────────────
      if (sub === 'start') {
        if (!isStaff) {
          return message.reply('<:alert:1366050815089053808> You do not have staff permissions to start giveaways.');
        }

        const prizeInput = args[2];
        const durationInput = args[3];
        const prize = parseAmount(prizeInput) || undefined;
        const durationHours = durationInput ? parseFloat(durationInput) : 24;

        if (durationHours <= 0 || isNaN(durationHours)) {
          return message.reply('<:warning:1366050875243757699> Invalid duration in hours. Example: `kas giveaway start 1m 24`');
        }

        const targetChannel = message.mentions.channels.first() || message.channel;

        const doc = await startDailyGiveaway(message.client, {
          prize,
          durationHours,
          channelId: targetChannel.id,
          guildId: message.guild?.id || null,
          isDaily: false
        });

        if (doc) {
          return message.reply(`✅ **Giveaway launched!** Posted in <#${targetChannel.id}> for <:kasiko_coin:1300141236841086977> **${doc.prize.toLocaleString()} Cash** (Duration: ${durationHours}h).`);
        } else {
          return message.reply('<:alert:1366050815089053808> Failed to launch giveaway. Please check channel permissions.');
        }
      }

      // ── Subcommand: END ───────────────────────────────────────────────────
      if (sub === 'end') {
        if (!isStaff) {
          return message.reply('<:alert:1366050815089053808> You do not have staff permissions to end giveaways.');
        }

        const messageId = args[2];
        if (!messageId) {
          return message.reply('<:warning:1366050875243757699> Please provide the Giveaway Message ID. Usage: `kas giveaway end <messageId>`');
        }

        const giveaway = await Giveaway.findOne({ messageId });
        if (!giveaway) {
          return message.reply('<:warning:1366050875243757699> Giveaway not found.');
        }

        if (giveaway.ended) {
          return message.reply('<:warning:1366050875243757699> This giveaway has already ended.');
        }

        await resolveGiveaway(giveaway, message.client);
        return message.reply(`✅ **Giveaway ended!** Winner has been selected and announced in <#${giveaway.channelId}>.`);
      }

      // ── Subcommand: REROLL ────────────────────────────────────────────────
      if (sub === 'reroll') {
        if (!isStaff) {
          return message.reply('<:alert:1366050815089053808> You do not have staff permissions to reroll giveaways.');
        }

        const messageId = args[2];
        if (!messageId) {
          return message.reply('<:warning:1366050875243757699> Please provide the Giveaway Message ID. Usage: `kas giveaway reroll <messageId>`');
        }

        try {
          const res = await rerollGiveaway(messageId, message.client);
          return message.reply(`✅ **Giveaway rerolled!** New winner: <@${res.newWinnerId}> for <:kasiko_coin:1300141236841086977> **${res.prize.toLocaleString()} Cash**!`);
        } catch (err) {
          return message.reply(`<:alert:1366050815089053808> ${err.message}`);
        }
      }

      // ── Subcommand: LIST (Default) ────────────────────────────────────────
      const activeGiveaways = await Giveaway.find({ ended: false }).sort({ endsAt: 1 }).limit(5);
      const recentGiveaways = await Giveaway.find({ ended: true }).sort({ updatedAt: -1 }).limit(5);

      const embed = new EmbedBuilder()
        .setTitle('🎉 Kasiko Community Cash Giveaways')
        .setColor(COLORS.GOLD)
        .setDescription(
          `Participate in our automated daily cash drops for a chance to win between **500,000** and **2,000,000** Cash!\n\n` +
          `### 🟢 **Active Giveaways**\n` +
          (activeGiveaways.length > 0
            ? activeGiveaways.map(g =>
                `• **<:kasiko_coin:1300141236841086977> ${g.prize.toLocaleString()} Cash** in <#${g.channelId}>\n` +
                `  └ Ends: <t:${Math.floor(g.endsAt.getTime() / 1000)}:R> · **${g.entryCount} entered**`
              ).join('\n\n')
            : '*No active giveaways right now. Check back soon for the daily drop!*') +
          `\n\n### 🏆 **Recent Winners**\n` +
          (recentGiveaways.length > 0
            ? recentGiveaways.map(g =>
                `• **<:kasiko_coin:1300141236841086977> ${g.prize.toLocaleString()} Cash** · Winner: ${g.winnerId ? `<@${g.winnerId}>` : '*None*'}`
              ).join('\n')
            : '*No past giveaways recorded yet.*')
        )
        .setFooter({ text: isStaff ? 'Staff Commands: kas giveaway start/end/reroll' : 'Click "Enter Giveaway" on active messages to participate!' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[GiveawayCommand] Error:', err);
      return message.reply('<:alert:1366050815089053808> An error occurred while processing the giveaway command.');
    }
  }
};
