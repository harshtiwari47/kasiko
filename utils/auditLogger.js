import {
  EmbedBuilder,
  ContainerBuilder,
  SeparatorSpacingSize
} from 'discord.js';
import { CHANNELS, COLORS } from '../constants.js';

/**
 * Send a structured management audit log to the designated audit channel.
 * 
 * @param {import('discord.js').Client} client
 * @param {object} options
 * @param {string} options.type - Type/category of audit event (e.g. 'ROLE_CHANGE', 'FINANCE', 'BANK', 'ASSET', 'PASS', 'SHIP')
 * @param {string} options.title - Short descriptive title
 * @param {string|object} options.executor - User who performed the action
 * @param {string|object} [options.target] - Target user/account affected
 * @param {string} [options.description] - Main description
 * @param {Array<{ name: string, value: string, inline?: boolean }>} [options.fields] - Additional details
 * @param {number} [options.color] - Embed accent color
 */
export async function sendAuditLog(client, options = {}) {
  try {
    if (!client || !client.isReady()) return;

    const channelId = CHANNELS.AUDIT_LOGS;
    if (!channelId) return;

    const channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const {
      type = 'MANAGEMENT_ACTION',
      title = '🛡️ Management Audit Log',
      executor,
      target,
      description = '',
      fields = [],
      color = COLORS.PRIMARY
    } = options;

    const executorText = executor
      ? (typeof executor === 'object' ? `<@${executor.id}> (\`${executor.tag || executor.username || executor.id}\`)` : `<@${executor}> (\`${executor}\`)`)
      : 'System';

    const targetText = target
      ? (typeof target === 'object' ? `<@${target.id}> (\`${target.tag || target.username || target.id}\`)` : `<@${target}> (\`${target}\`)`)
      : null;

    const now = new Date();

    // Try Components v2 ContainerBuilder first
    try {
      const container = new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(t =>
          t.setContent(`### ${title}\n-# **Event:** \`${type}\` • **Timestamp:** <t:${Math.floor(now.getTime() / 1000)}:R>`)
        )
        .addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      let detailsBlock = `**👤 Executor:** ${executorText}\n`;
      if (targetText) {
        detailsBlock += `**🎯 Target:** ${targetText}\n`;
      }
      if (description) {
        detailsBlock += `\n${description}\n`;
      }

      container.addTextDisplayComponents(t => t.setContent(detailsBlock));

      if (fields.length > 0) {
        container.addSeparatorComponents(s => s.setDivider(false));
        const fieldsContent = fields.map(f => `• **${f.name}:** ${f.value}`).join('\n');
        container.addTextDisplayComponents(t => t.setContent(fieldsContent));
      }

      await channel.send({
        components: [container],
        flags: [4096] // IS_COMPONENTS_V2
      });
      return;
    } catch (v2Err) {
      // Fallback to standard Discord Embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(
          `**Event:** \`${type}\`\n` +
          `**👤 Executor:** ${executorText}\n` +
          (targetText ? `**🎯 Target:** ${targetText}\n` : '') +
          (description ? `\n${description}` : '')
        )
        .setTimestamp(now);

      if (fields.length > 0) {
        for (const f of fields) {
          embed.addFields({ name: f.name, value: f.value, inline: f.inline ?? true });
        }
      }

      await channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('[AuditLogger] Failed to dispatch audit log:', err.message);
  }
}

/**
 * Convenience helper for role changes
 */
export async function logRoleChange({ client, executor, target, action, oldRole, newRole, reason }) {
  await sendAuditLog(client, {
    type: '👑 ROLE_CHANGE',
    title: `👑 Management Role ${action.toUpperCase()}`,
    executor,
    target,
    color: action === 'removed' ? COLORS.DANGER : COLORS.SUCCESS,
    fields: [
      { name: 'Action', value: `\`${action}\``, inline: true },
      { name: 'Previous Role', value: oldRole ? `\`${oldRole}\`` : 'None', inline: true },
      { name: 'New Role', value: newRole ? `\`${newRole}\`` : 'None', inline: true },
      ...(reason ? [{ name: 'Reason', value: reason, inline: false }] : [])
    ]
  });
}

/**
 * Convenience helper for financial operations
 */
export async function logFinancialAction({ client, executor, target, action, amount, details }) {
  await sendAuditLog(client, {
    type: '💰 FINANCE_OPERATION',
    title: `💰 Reserve Cash ${action.toUpperCase()}`,
    executor,
    target,
    color: action === 'deduct' ? COLORS.WARNING : COLORS.GOLD,
    fields: [
      { name: 'Operation', value: `\`${action}\``, inline: true },
      { name: 'Amount', value: `<:kasiko_coin:1300141236841086977> **${Number(amount || 0).toLocaleString()}**`, inline: true },
      ...(details ? [{ name: 'Details', value: details, inline: false }] : [])
    ]
  });
}

/**
 * Convenience helper for bank adjustments
 */
export async function logBankAction({ client, executor, target, action, amount, newBalance }) {
  await sendAuditLog(client, {
    type: '🏦 BANK_OPERATION',
    title: `🏦 User Bank ${action.toUpperCase()}`,
    executor,
    target,
    color: COLORS.PRIMARY,
    fields: [
      { name: 'Action', value: `\`${action}\``, inline: true },
      ...(amount ? [{ name: 'Amount', value: `<:kasiko_coin:1300141236841086977> **${Number(amount).toLocaleString()}**`, inline: true }] : []),
      ...(newBalance !== undefined ? [{ name: 'New Bank Balance', value: `**${Number(newBalance).toLocaleString()}**`, inline: true }] : [])
    ]
  });
}

/**
 * Convenience helper for profile asset modifications
 */
export async function logAssetChange({ client, executor, target, assetType, action, value }) {
  await sendAuditLog(client, {
    type: '🎨 ASSET_MODIFICATION',
    title: `🎨 Profile ${assetType.toUpperCase()} ${action.toUpperCase()}`,
    executor,
    target,
    color: COLORS.PURPLE,
    fields: [
      { name: 'Asset Type', value: `\`${assetType}\``, inline: true },
      { name: 'Action', value: `\`${action}\``, inline: true },
      { name: 'Value', value: `\`${value}\``, inline: false }
    ]
  });
}

/**
 * Convenience helper for subscription pass activations
 */
export async function logPassAction({ client, executor, target, plan, expiryDate, promoCode }) {
  await sendAuditLog(client, {
    type: '🎟️ PASS_MANAGEMENT',
    title: promoCode ? '🎟️ Promo Code Created' : '🎟️ Subscription Pass Activated',
    executor,
    target,
    color: COLORS.SUCCESS,
    fields: [
      { name: 'Plan', value: `**${plan?.toUpperCase()}**`, inline: true },
      ...(promoCode ? [{ name: 'Promo Code', value: `\`${promoCode}\``, inline: true }] : []),
      ...(expiryDate ? [{ name: 'Expires On', value: `<t:${Math.floor(new Date(expiryDate).getTime() / 1000)}:D>`, inline: true }] : [])
    ]
  });
}

/**
 * Convenience helper for custom ship overrides
 */
export async function logShipOverride({ client, executor, user1, user2, score }) {
  await sendAuditLog(client, {
    type: '💖 SHIP_OVERRIDE',
    title: '💖 Custom Ship Love Score Set',
    executor,
    color: 0xFF69B4,
    fields: [
      { name: 'User 1', value: `<@${user1}> (\`${user1}\`)`, inline: true },
      { name: 'User 2', value: `<@${user2}> (\`${user2}\`)`, inline: true },
      { name: 'Custom Love Score', value: `**${score}%** ❤️`, inline: true }
    ]
  });
}

export default sendAuditLog;
