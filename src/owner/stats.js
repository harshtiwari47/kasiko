import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import redisClient from '../../redis.js';
import { getAnalyticsData } from '../../utils/stats.js';
import mongoose from 'mongoose';

/**
 * Format bytes to MB
 */
function formatMb(num) {
  return `${Number(num).toLocaleString()} MB`;
}

/**
 * Format number with commas
 */
function formatNum(num) {
  return Number(num || 0).toLocaleString();
}

/**
 * Format uptime seconds into human readable string
 */
function formatUptime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Build the ActionRow navigation buttons for Stats
 */
function buildStatsButtons(currentTab = 'overview') {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('stats_tab_overview')
      .setLabel('Overview')
      .setEmoji('📊')
      .setStyle(currentTab === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('stats_tab_commands')
      .setLabel('Commands')
      .setEmoji('⌨️')
      .setStyle(currentTab === 'commands' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('stats_tab_servers')
      .setLabel('Servers')
      .setEmoji('🌐')
      .setStyle(currentTab === 'servers' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('stats_tab_users')
      .setLabel('Users')
      .setEmoji('👥')
      .setStyle(currentTab === 'users' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('stats_tab_system')
      .setLabel('System')
      .setEmoji('⚙️')
      .setStyle(currentTab === 'system' ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('stats_refresh')
      .setLabel('Refresh Live Data')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Success)
  );

  return [row1, row2];
}

/**
 * Build Embed for specific Stats tab
 */
function buildStatsEmbed(tab, data, client) {
  const ov = data.overview;
  const now = new Date();

  switch (tab) {
    case 'commands': {
      const topToday = data.topCommandsToday && data.topCommandsToday.length > 0
        ? data.topCommandsToday.map((c, i) => `\`#${i + 1}\` **${c.name}** — \`${formatNum(c.count)}\` uses`).join('\n')
        : '_No commands recorded today yet._';

      const topAlltime = data.topCommandsAlltime && data.topCommandsAlltime.length > 0
        ? data.topCommandsAlltime.map((c, i) => `\`#${i + 1}\` **${c.name}** — \`${formatNum(c.count)}\` uses`).join('\n')
        : '_No all-time command data available._';

      return new EmbedBuilder()
        .setTitle('⌨️ Command Execution Analytics')
        .setColor(0x5865F2)
        .setDescription(
          `**Total Commands Today:** \`${formatNum(ov.todayCommands)}\`\n` +
          `**Total Commands (Month):** \`${formatNum(ov.monthCommandsTotal)}\`\n` +
          `**Total Commands (All-Time):** \`${formatNum(ov.alltimeCommandsTotal)}\``
        )
        .addFields(
          { name: '🔥 Top 10 Commands (Today)', value: topToday, inline: false },
          { name: '🌟 Top 10 Commands (All-Time)', value: topAlltime, inline: false }
        )
        .setFooter({ text: `Kasiko Analytics • Updated at ${now.toLocaleTimeString()}` })
        .setTimestamp();
    }

    case 'servers': {
      // Top 10 largest servers by cached member count
      const largestServers = client.guilds.cache
        .sort((a, b) => b.memberCount - a.memberCount)
        .first(10)
        .map((g, i) => `\`#${i + 1}\` **${g.name}** (\`${g.id}\`)\n└ 👥 **${formatNum(g.memberCount)}** members`)
        .join('\n') || '_No guilds loaded._';

      // Top 10 most active servers by command usage
      const activeServers = data.topGuildsActivity && data.topGuildsActivity.length > 0
        ? data.topGuildsActivity.map((g, i) => `\`#${i + 1}\` **${g.name}** (\`${g.id}\`)\n└ ⚡ **${formatNum(g.count)}** commands executed`).join('\n')
        : '_No server activity recorded._';

      return new EmbedBuilder()
        .setTitle('🌐 Server & Community Analytics')
        .setColor(0x57F287)
        .setDescription(
          `**Total Connected Servers:** \`${formatNum(ov.serverCount)}\`\n` +
          `**Total Population:** \`${formatNum(ov.totalMembers)}\` members\n` +
          `**Average Server Size:** \`${ov.serverCount > 0 ? Math.round(ov.totalMembers / ov.serverCount) : 0}\` members/server`
        )
        .addFields(
          { name: '🏆 Top 10 Largest Servers (by Members)', value: largestServers, inline: false },
          { name: '🔥 Top 10 Most Active Servers (by Usage)', value: activeServers, inline: false }
        )
        .setFooter({ text: `Kasiko Analytics • Updated at ${now.toLocaleTimeString()}` })
        .setTimestamp();
    }

    case 'users': {
      const topUsers = data.topUsersActivity && data.topUsersActivity.length > 0
        ? data.topUsersActivity.map((u, i) => `\`#${i + 1}\` <@${u.userId}> (\`${u.userId}\`)\n└ ⚡ **${formatNum(u.count)}** commands executed`).join('\n')
        : '_No user activity data available._';

      return new EmbedBuilder()
        .setTitle('👥 User Activity & Engagement Analytics')
        .setColor(0xFEE75C)
        .setDescription(
          `**Active Users Today:** \`${formatNum(ov.todayActiveUsers)}\`\n` +
          `**Commands Executed Today:** \`${formatNum(ov.todayCommands)}\`\n` +
          `**Avg Activity per Active User:** \`${ov.todayActiveUsers > 0 ? (ov.todayCommands / ov.todayActiveUsers).toFixed(1) : 0}\` cmds`
        )
        .addFields(
          { name: '👑 Top 10 Most Active Users (All-Time)', value: topUsers, inline: false }
        )
        .setFooter({ text: `Kasiko Analytics • Updated at ${now.toLocaleTimeString()}` })
        .setTimestamp();
    }

    case 'system': {
      const mem = ov.memory;
      const mongoStatus = mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';
      const redisStatus = redisClient.isOpen ? '🟢 Connected & Ready' : '🔴 Disconnected';

      return new EmbedBuilder()
        .setTitle('⚙️ System & Infrastructure Status')
        .setColor(0xEB459E)
        .setDescription(
          `**Bot Uptime:** \`${formatUptime(ov.uptimeSeconds)}\`\n` +
          `**Gateway Ping:** \`${ov.ping} ms\`\n` +
          `**Node.js Version:** \`${process.version}\`\n` +
          `**Platform:** \`${process.platform} (${process.arch})\`\n` +
          `**Process ID:** \`${process.pid}\``
        )
        .addFields(
          {
            name: '🧠 Memory Consumption',
            value:
              `• **RSS Memory:** \`${formatMb(mem.rssMb)}\`\n` +
              `• **Heap Used:** \`${formatMb(mem.heapUsedMb)}\` / \`${formatMb(mem.heapTotalMb)}\`\n` +
              `• **External:** \`${(process.memoryUsage().external / (1024 * 1024)).toFixed(1)} MB\``,
            inline: true
          },
          {
            name: '🔌 Database Connections',
            value:
              `• **MongoDB:** ${mongoStatus}\n` +
              `• **Redis Cache:** ${redisStatus}\n` +
              `• **Shard ID:** \`${client?.shard?.ids?.join(',') || '0'}\``,
            inline: true
          }
        )
        .setFooter({ text: `Kasiko Analytics • Updated at ${now.toLocaleTimeString()}` })
        .setTimestamp();
    }

    case 'overview':
    default: {
      return new EmbedBuilder()
        .setTitle('📊 Kasiko Bot Overview & Performance')
        .setColor(0x5865F2)
        .setDescription(`Comprehensive real-time analytics across servers, users, commands, and infrastructure.`)
        .addFields(
          {
            name: '🌐 Community Scale',
            value:
              `• **Servers:** \`${formatNum(ov.serverCount)}\`\n` +
              `• **Total Members:** \`${formatNum(ov.totalMembers)}\`\n` +
              `• **Active Users Today:** \`${formatNum(ov.todayActiveUsers)}\``,
            inline: true
          },
          {
            name: '⚡ Command Traffic',
            value:
              `• **Today:** \`${formatNum(ov.todayCommands)}\`\n` +
              `• **This Month:** \`${formatNum(ov.monthCommandsTotal)}\`\n` +
              `• **All-Time:** \`${formatNum(ov.alltimeCommandsTotal)}\``,
            inline: true
          },
          {
            name: '⚙️ Performance & Health',
            value:
              `• **Uptime:** \`${formatUptime(ov.uptimeSeconds)}\`\n` +
              `• **Latency:** \`${ov.ping} ms\`\n` +
              `• **RAM Usage:** \`${formatMb(ov.memory.heapUsedMb)}\``,
            inline: true
          }
        )
        .setFooter({ text: `Kasiko Analytics • Use buttons below to inspect details` })
        .setTimestamp();
    }
  }
}

export default {
  name: "stats",
  description: "View comprehensive real-time and historical bot analytics (Overview, Commands, Servers, Users, System).",
  aliases: ["botstats", "analytics", "bstats"],
  args: "[overview|commands|servers|users|system]",
  example: ["stats", "stats commands", "stats servers", "stats system"],
  category: "🧑🏻‍💻 Owner",

  execute: async (args, message) => {
    try {
      const subArg = args[1]?.toLowerCase();
      let activeTab = 'overview';
      if (['cmd', 'commands', 'command'].includes(subArg)) activeTab = 'commands';
      else if (['guild', 'guilds', 'server', 'servers', 'topservers'].includes(subArg)) activeTab = 'servers';
      else if (['user', 'users', 'topusers'].includes(subArg)) activeTab = 'users';
      else if (['sys', 'system', 'memory', 'ram', 'ping'].includes(subArg)) activeTab = 'system';

      const data = await getAnalyticsData(message.client, redisClient, false);
      if (!data) {
        return message.reply('❌ Failed to fetch analytics data. Please try again in a moment.');
      }

      const embed = buildStatsEmbed(activeTab, data, message.client);
      const components = buildStatsButtons(activeTab);

      const responseMessage = await message.reply({
        embeds: [embed],
        components
      });

      // Interactive component collector for tabs & refresh
      const collector = responseMessage.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async interaction => {
        try {
          if (interaction.customId === 'stats_refresh') {
            await interaction.deferUpdate();
            const freshData = await getAnalyticsData(message.client, redisClient, true);
            const freshEmbed = buildStatsEmbed(activeTab, freshData, message.client);
            const freshComponents = buildStatsButtons(activeTab);
            await responseMessage.edit({
              embeds: [freshEmbed],
              components: freshComponents
            });
            return;
          }

          if (interaction.customId.startsWith('stats_tab_')) {
            const newTab = interaction.customId.replace('stats_tab_', '');
            activeTab = newTab;
            await interaction.deferUpdate();
            const currentData = await getAnalyticsData(message.client, redisClient, false);
            const newEmbed = buildStatsEmbed(activeTab, currentData, message.client);
            const newComponents = buildStatsButtons(activeTab);
            await responseMessage.edit({
              embeds: [newEmbed],
              components: newComponents
            });
          }
        } catch (intErr) {
          console.error('[StatsButton] Interaction update error:', intErr);
        }
      });

      collector.on('end', async () => {
        try {
          // Disable buttons when collector expires
          const disabledRows = buildStatsButtons(activeTab).map(row => {
            row.components.forEach(btn => btn.setDisabled(true));
            return row;
          });
          await responseMessage.edit({ components: disabledRows }).catch(() => {});
        } catch (e) {}
      });

    } catch (err) {
      console.error('[OwnerStats] Execution error:', err);
      return message.reply('❌ An error occurred while generating the stats dashboard.');
    }
  }
};
