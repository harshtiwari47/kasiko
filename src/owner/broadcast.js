import {
  EmbedBuilder
} from 'discord.js';
import {
  sendTestBroadcast,
  startBroadcastQueue,
  pauseBroadcastQueue,
  getBroadcastStatus,
  DEFAULT_REVIVAL_CAMPAIGN
} from '../../utils/broadcastEngine.js';
import { COLORS } from '../../constants.js';

export default {
  name: 'broadcast',
  description: 'Manage and trigger automated event broadcast DMs to community members.',
  syntax: 'broadcast <test|start|status|pause> [campaignId]',

  execute: async (args, message) => {
    const sub = (args[1] || 'status').toLowerCase();
    const campaignId = args[2] || DEFAULT_REVIVAL_CAMPAIGN.campaignId;
    const client = message.client;

    // ── 1. Test DM to Developer ─────────────────────────────────────────────
    if (sub === 'test') {
      try {
        await message.reply('⏳ Sending test event broadcast to your Direct Messages...');
        const res = await sendTestBroadcast(client, message.author.id);
        return message.reply(`✅ **Test Broadcast Sent!** Check your DMs with **${res.username}**.`);
      } catch (err) {
        return message.reply(`❌ **Failed to send test broadcast:** ${err.message}`);
      }
    }

    // ── 2. Start / Resume Background Broadcast Queue ────────────────────────
    if (sub === 'start' || sub === 'run') {
      try {
        await message.reply(`🚀 **Initiating Broadcast Queue for Campaign:** \`${campaignId}\`...`);
        const campaignDoc = await startBroadcastQueue(client, campaignId, message.channel.id);

        const embed = new EmbedBuilder()
          .setTitle('📢 Broadcast Queue Started')
          .setColor(COLORS.SUCCESS)
          .setDescription(
            `**Campaign:** \`${campaignDoc.campaignId}\`\n` +
            `**Total Target Users:** \`${campaignDoc.totalTargetUsers}\`\n` +
            `**Live Reports Channel:** <#${message.channel.id}>\n\n` +
            `• *Rate Limit: 1 DM every 2.5 seconds (~24 DMs/min)*\n` +
            `• *Users with \`eventAlerts: false\` or closed DMs are automatically handled.*\n` +
            `• *Use \`kasow broadcast status\` to monitor progress or \`kasow broadcast pause\` to halt.*`
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (err) {
        return message.reply(`❌ **Broadcast Queue Error:** ${err.message}`);
      }
    }

    // ── 3. Pause Active Queue ───────────────────────────────────────────────
    if (sub === 'pause' || sub === 'stop') {
      try {
        const doc = await pauseBroadcastQueue(campaignId);
        return message.reply(`⏸️ **Broadcast Queue Paused** for campaign \`${campaignId}\`. Processed: \`${doc?.processedUserIds?.length || 0}\` users.`);
      } catch (err) {
        return message.reply(`❌ **Failed to pause queue:** ${err.message}`);
      }
    }

    // ── 4. Inspect Live Status ──────────────────────────────────────────────
    if (sub === 'status' || sub === 'info') {
      const status = await getBroadcastStatus(campaignId);
      if (!status) {
        return message.reply(`ℹ️ No broadcast record found for campaign \`${campaignId}\`. Use \`kasow broadcast test\` or \`kasow broadcast start\` to begin.`);
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 Event Broadcast Campaign Status')
        .setColor(status.isRunning ? COLORS.SUCCESS : COLORS.PRIMARY)
        .setDescription(
          `**Campaign:** \`${status.campaignId}\`\n` +
          `**State:** ${status.isRunning ? '🟢 **Running**' : '⏸️ **' + status.status.toUpperCase() + '**'}\n\n` +
          `• ✅ **Sent:** \`${status.sentCount.toLocaleString()}\`\n` +
          `• 🔒 **Closed DMs:** \`${status.closedDmCount.toLocaleString()}\`\n` +
          `• 🔕 **Opted-Out:** \`${status.optedOutCount.toLocaleString()}\`\n` +
          `• ❌ **Failed:** \`${status.failedCount.toLocaleString()}\`\n` +
          `• 👥 **Total Processed:** \`${status.processedCount.toLocaleString()}\` / \`${status.totalTargetUsers.toLocaleString()}\`\n` +
          `• ⏳ **Remaining:** \`${status.remaining.toLocaleString()}\``
        )
        .setFooter({ text: 'Kasiko Broadcast Engine' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply('❌ **Usage:** `kasow broadcast <test|start|status|pause> [campaignId]`');
  }
};
