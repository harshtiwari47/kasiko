import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import {
  sendTestBroadcast,
  startBroadcastQueue,
  pauseBroadcastQueue,
  getBroadcastStatus,
  DEFAULT_REVIVAL_CAMPAIGN
} from '../../../utils/broadcastEngine.js';
import { getOwner, hasOwnerPermission } from '../../owner/ownerManager.js';
import { COLORS } from '../../../constants.js';

export default {
  name: 'broadcast',
  description: 'Manage community revival campaigns and event broadcast queues (Owner only).',
  aliases: ['bc', 'eventbroadcast', 'revive'],
  args: '<test|start|status|pause|resume> [campaignId]',
  example: [
    'broadcast test',
    'broadcast start',
    'broadcast status',
    'broadcast pause',
    'broadcast resume'
  ],
  cooldown: 5000,
  category: '🔧 Utility',

  execute: async (args, message) => {
    try {
      const userId = message.author.id;
      const ownerInfo = getOwner(userId);
      const isAuthorized = ownerInfo.isOwner && hasOwnerPermission(userId, 2);

      if (!isAuthorized) {
        return message.reply('<:alert:1366050815089053808> You do not have owner permissions to execute broadcast commands.');
      }

      const sub = (args[1] || '').toLowerCase();
      const campaignId = args[2] || DEFAULT_REVIVAL_CAMPAIGN.campaignId;

      // ── Subcommand: TEST ──────────────────────────────────────────────────
      if (sub === 'test') {
        try {
          const res = await sendTestBroadcast(message.client, userId);
          return message.reply(`✅ **Test broadcast sent!** Check your DMs, **${res.username}**, to preview the interactive welcome card and test all 4 buttons.`);
        } catch (err) {
          return message.reply(`<:alert:1366050815089053808> Failed to send test DM: ${err.message}. Please ensure your DMs are open.`);
        }
      }

      // ── Subcommand: START / RESUME ────────────────────────────────────────
      if (sub === 'start' || sub === 'resume') {
        try {
          const doc = await startBroadcastQueue(message.client, campaignId, message.channel.id);
          const embed = new EmbedBuilder()
            .setTitle('🚀 Broadcast Queue Launched!')
            .setColor(COLORS.SUCCESS)
            .setDescription(
              `**Campaign:** \`${doc.campaignId}\`\n\n` +
              `• 👥 **Target Users:** \`${doc.totalTargetUsers}\`\n` +
              `• ⏱️ **Rate-Limit Pacing:** 1 DM per 2.5 seconds (~24 DMs/min)\n` +
              `• 📊 **Channel Reports:** Active progress updates will be posted in <#${message.channel.id}> every 20 users.\n\n` +
              `*Use \`kas broadcast pause\` to halt or \`kas broadcast status\` to inspect metrics anytime.*`
            )
            .setFooter({ text: 'Kasiko Automated Event Engine' })
            .setTimestamp();

          return message.reply({ embeds: [embed] });
        } catch (err) {
          return message.reply(`<:alert:1366050815089053808> ${err.message}`);
        }
      }

      // ── Subcommand: PAUSE ─────────────────────────────────────────────────
      if (sub === 'pause') {
        await pauseBroadcastQueue(campaignId);
        return message.reply(`⏸️ **Broadcast queue paused.** Run \`kas broadcast resume\` to continue from where it left off.`);
      }

      // ── Subcommand: STATUS ────────────────────────────────────────────────
      if (sub === 'status') {
        const stats = await getBroadcastStatus(campaignId);
        if (!stats) {
          return message.reply(`<:warning:1366050875243757699> No broadcast campaign found with ID \`${campaignId}\`.`);
        }

        const embed = new EmbedBuilder()
          .setTitle('📊 Broadcast Campaign Status')
          .setColor(stats.isRunning ? COLORS.PRIMARY : COLORS.WARNING)
          .setDescription(
            `**Campaign:** \`${stats.campaignId}\`\n` +
            `**State:** \`${stats.status.toUpperCase()}\` ${stats.isRunning ? '🟢 Active' : '⏸️ Idle/Paused'}\n\n` +
            `• ✅ **Sent:** \`${stats.sentCount}\`\n` +
            `• 🔒 **Closed DMs:** \`${stats.closedDmCount}\`\n` +
            `• 🔕 **Opted-Out:** \`${stats.optedOutCount}\`\n` +
            `• ❌ **Failed:** \`${stats.failedCount}\`\n` +
            `• 👥 **Processed:** \`${stats.processedCount}\` / \`${stats.totalTargetUsers}\`\n` +
            `• ⏳ **Remaining:** \`${stats.remaining}\``
          )
          .setFooter({ text: 'Kasiko Broadcast Engine' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // ── Help Guide ────────────────────────────────────────────────────────
      const helpEmbed = new EmbedBuilder()
        .setTitle('📢 Broadcast Engine Commands')
        .setColor(COLORS.GOLD)
        .setDescription(
          `**Available Commands:**\n` +
          `• \`kas broadcast test\` — Send a test DM preview to yourself.\n` +
          `• \`kas broadcast start [campaignId]\` — Launch the safe rate-limited queue.\n` +
          `• \`kas broadcast status [campaignId]\` — View real-time campaign progress.\n` +
          `• \`kas broadcast pause [campaignId]\` — Pause the active queue.\n` +
          `• \`kas broadcast resume [campaignId]\` — Resume the paused queue.`
        )
        .setFooter({ text: 'Owner Access Only' });

      return message.reply({ embeds: [helpEmbed] });

    } catch (err) {
      console.error('[BroadcastCommand] Error:', err);
      return message.reply('<:alert:1366050815089053808> An error occurred while executing the broadcast command.');
    }
  }
};
