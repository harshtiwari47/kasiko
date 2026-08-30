import {
  ContainerBuilder,
  MessageFlags,
  EmbedBuilder
} from 'discord.js';
import logger from '../anticrash.js';
import { addDashboardLog } from '../src/dashboard/dashboardLogs.js';

let discordClient = null;

const DEFAULT_ERROR_CHANNEL_ID = '1539747023358533743';

// Anti-spam / duplicate error throttling map
const recentErrors = new Map();
const ERROR_THROTTLE_MS = 10000; // 10 seconds throttle for identical errors

/**
 * Initialize or set the active Discord client instance.
 * @param {import('discord.js').Client} client
 */
export function initErrorLogger(client) {
  discordClient = client;
}

/**
 * Get the target channel ID for error logging.
 * @returns {string}
 */
export function getErrorChannelId() {
  return process.env.ERROR_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID || DEFAULT_ERROR_CHANNEL_ID;
}

/**
 * Truncate a string safely to a maximum length.
 * @param {string} str 
 * @param {number} maxLength 
 * @returns {string}
 */
function truncate(str, maxLength = 1800) {
  if (!str) return 'N/A';
  if (typeof str !== 'string') str = String(str);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 15) + '\n... [truncated]';
}

/**
 * Clean and format stack trace.
 * @param {Error|any} error 
 * @param {number} maxLen 
 * @returns {string}
 */
function formatStack(error, maxLen = 1500) {
  if (!error) return 'No stack trace available.';
  const stack = error.stack || (typeof error === 'string' ? error : JSON.stringify(error, null, 2));
  return truncate(stack, maxLen);
}

/**
 * Extract contextual metadata from message, interaction, or generic context object.
 * @param {any} context 
 * @returns {Object}
 */
function extractContextInfo(context = {}) {
  const info = {
    source: context.source || 'General Error',
    commandName: context.commandName || null,
    args: context.args || null,
    userId: null,
    userTag: null,
    guildId: null,
    guildName: null,
    channelId: null,
    channelName: null,
    extra: context.extra || null
  };

  // If context is a Discord Message
  if (context.author) {
    info.userId = context.author.id;
    info.userTag = context.author.tag || context.author.username;
    info.guildId = context.guild?.id || null;
    info.guildName = context.guild?.name || null;
    info.channelId = context.channel?.id || null;
    info.channelName = context.channel?.name || null;
  }
  // If context is a Discord Interaction
  else if (context.user) {
    info.userId = context.user.id;
    info.userTag = context.user.tag || context.user.username;
    info.guildId = context.guild?.id || null;
    info.guildName = context.guild?.name || null;
    info.channelId = context.channel?.id || null;
    info.channelName = context.channel?.name || null;
    if (context.commandName && !info.commandName) {
      info.commandName = context.commandName;
    }
  }
  // If context is a Guild object
  else if (context.memberCount !== undefined && context.id) {
    info.guildId = context.id;
    info.guildName = context.name;
  }
  // If explicit properties passed
  if (context.userId) info.userId = context.userId;
  if (context.userTag) info.userTag = context.userTag;
  if (context.guildId) info.guildId = context.guildId;
  if (context.guildName) info.guildName = context.guildName;
  if (context.channelId) info.channelId = context.channelId;

  return info;
}

/**
 * Send a detailed error log to the configured Discord channel and local Winston logger.
 * @param {Error|any} error - The error object or reason
 * @param {Object} context - Optional context object (message, interaction, guild, or metadata)
 */
export async function sendErrorLog(error, context = {}) {
  try {
    // 1. Log locally to Winston, console, and dashboard ring buffer
    const errorMsg = error?.stack || error?.message || String(error);
    addDashboardLog('ERROR', context.source || 'EXCEPTION', errorMsg, context);
    if (logger && typeof logger.error === 'function') {
      logger.error(`[ErrorLogger] ${context.source || 'Bot Error'}: ${errorMsg}`);
    } else {
      console.error(`[ErrorLogger]`, error);
    }

    const client = discordClient || context.client || context.message?.client || context.interaction?.client;
    if (!client || !client.isReady?.()) {
      return; // Cannot send to Discord if client is not ready
    }

    const channelId = getErrorChannelId();
    if (!channelId) return;

    // 2. Prevent infinite error loops / spam throttle
    const errSig = `${error?.name || ''}:${error?.message || error}:${context.source || ''}:${context.commandName || ''}`;
    const now = Date.now();
    const lastSeen = recentErrors.get(errSig);
    if (lastSeen && (now - lastSeen) < ERROR_THROTTLE_MS) {
      return; // Throttled identical error
    }
    recentErrors.set(errSig, now);

    // Clean up old throttles periodically
    if (recentErrors.size > 200) {
      for (const [key, timestamp] of recentErrors.entries()) {
        if (now - timestamp > 60000) recentErrors.delete(key);
      }
    }

    // 3. Fetch log channel
    let channel = client.channels?.cache?.get(channelId);
    if (!channel) {
      try {
        channel = await client.channels?.fetch(channelId);
      } catch (fetchErr) {
        console.error(`[ErrorLogger] Could not fetch error log channel (${channelId}): ${fetchErr.message}. Ensure the bot is in that server and has View Channel & Send Messages permissions.`);
        return;
      }
    }
    if (!channel || !channel.isTextBased()) {
      console.warn(`[ErrorLogger] Channel (${channelId}) was not found or is not a text channel.`);
      return;
    }

    const meta = extractContextInfo(context);
    const timestampUnix = Math.floor(now / 1000);
    const errorName = error?.name || 'Error';
    const errorCode = error?.code ? ` [Code: ${error.code}]` : (error?.errno ? ` [Errno: ${error.errno}]` : '');
    const errorMessage = error?.message || String(error);
    const stackFormatted = formatStack(error, 1400);

    // 4. Build Components v2 Container
    try {
      const container = new ContainerBuilder()
        .setAccentColor(0xff3344)
        .addTextDisplayComponents(td =>
          td.setContent(
            `### 🚨 \`[ERROR]\` ${meta.source}${errorCode}\n` +
            `**Time:** <t:${timestampUnix}:F> (<t:${timestampUnix}:R>)`
          )
        )
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(td => {
          let contextDetails = `**Context Metadata:**\n`;
          if (meta.commandName) contextDetails += `• **Command:** \`${meta.commandName}\`\n`;
          if (meta.args && Array.isArray(meta.args) && meta.args.length > 0) {
            contextDetails += `• **Args:** \`${truncate(meta.args.join(' '), 200)}\`\n`;
          }
          if (meta.userTag || meta.userId) {
            contextDetails += `• **User:** ${meta.userTag ? `**${meta.userTag}**` : ''} ${meta.userId ? `(\`${meta.userId}\`)` : ''}\n`;
          }
          if (meta.guildName || meta.guildId) {
            contextDetails += `• **Server:** ${meta.guildName ? `**${meta.guildName}**` : ''} ${meta.guildId ? `(\`${meta.guildId}\`)` : ''}\n`;
          }
          if (meta.channelName || meta.channelId) {
            contextDetails += `• **Channel:** ${meta.channelName ? `#${meta.channelName}` : ''} ${meta.channelId ? `(\`${meta.channelId}\`)` : ''}\n`;
          }
          if (meta.extra) {
            contextDetails += `• **Info:** \`${truncate(JSON.stringify(meta.extra), 200)}\`\n`;
          }
          return td.setContent(contextDetails.trim());
        })
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(td =>
          td.setContent(
            `**Error Type:** \`${errorName}\`${errorCode}\n` +
            `**Message:** ${truncate(errorMessage, 500)}`
          )
        )
        .addTextDisplayComponents(td =>
          td.setContent(
            `**Stack Trace:**\n\`\`\`js\n${stackFormatted}\n\`\`\`\n` +
            `-# Kasiko Error Logger • Cluster: ${client?.shard?.ids?.join(',') || '0'}`
          )
        );

      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    } catch (v2Error) {
      // If Components v2 fails, fallback to EmbedBuilder
      console.warn('[ErrorLogger] Components v2 send failed, falling back to standard Embed:', v2Error.message);
      
      const fallbackEmbed = new EmbedBuilder()
        .setColor(0xff3344)
        .setTitle(`🚨 [ERROR] ${meta.source}${errorCode}`)
        .setDescription(`**Message:** ${truncate(errorMessage, 500)}`)
        .addFields(
          {
            name: '📍 Context',
            value: [
              meta.commandName ? `**Command:** \`${meta.commandName}\`` : null,
              meta.userTag ? `**User:** ${meta.userTag} (${meta.userId})` : null,
              meta.guildName ? `**Server:** ${meta.guildName} (${meta.guildId})` : null,
              meta.channelId ? `**Channel:** <#${meta.channelId}> (${meta.channelId})` : null,
            ].filter(Boolean).join('\n') || 'N/A',
            inline: false
          },
          {
            name: '📜 Stack Trace',
            value: `\`\`\`js\n${stackFormatted}\n\`\`\``,
            inline: false
          }
        )
        .setTimestamp(now)
        .setFooter({ text: `Kasiko Error Logger • Cluster: ${client?.shard?.ids?.join(',') || '0'}` });

      await channel.send({ embeds: [fallbackEmbed] }).catch(err => {
        console.error('[ErrorLogger] Critical: Failed to send fallback error embed to Discord channel:', err);
      });
    }
  } catch (criticalErr) {
    console.error('[ErrorLogger] Critical exception inside error logger:', criticalErr);
  }
}

export default sendErrorLog;
