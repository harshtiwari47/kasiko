import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType
} from 'discord.js';
import Cash from './cash.js';
import Deduct from './deduct.js';
import Reward from './reward.js';
import Badge from './badge.js';
import Bank from './bank.js';
import Ship from './ship.js';
import Bio from './bio.js';
import Profile from './profile.js';
import Stats from './stats.js';
import BroadcastCmd from './broadcast.js';
import ownerManager, {
  ROLES,
  POWERS,
  getOwner,
  hasOwnerPermission,
  hasPower,
  getUserPowers,
  addOwner,
  removeOwner,
  getAllOwners,
  initOwnerManager,
  PRIMARY_FOUNDER_ID
} from './ownerManager.js';
import { logRoleChange, sendAuditLog } from '../../utils/auditLogger.js';
import { COLORS } from '../../constants.js';

/**
 * Scalable Category Definitions for Owner Help
 */
const CATEGORIES = {
  all: {
    label: 'All Commands',
    emoji: '👑',
    description: 'View full summary of all available owner commands'
  },
  analytics: {
    label: 'Analytics & Stats',
    emoji: '📊',
    description: 'Bot traffic, top commands, server metrics & system health'
  },
  finance: {
    label: 'Finance & Economy',
    emoji: '💰',
    description: 'Reserve withdrawals, cash deductions & bank management'
  },
  profile: {
    label: 'Profiles & Assets',
    emoji: '🎨',
    description: 'User banners, badges, emojis, daily rewards & bio updates'
  },
  ship: {
    label: 'Ship System',
    emoji: '💖',
    description: 'Custom ship love score configuration & overrides'
  },
  team: {
    label: 'Team & Powers',
    emoji: '👥',
    description: 'Manage roles, inspect member powers, and view roster'
  }
};

/**
 * Declarative Command Registry for Owner Commands
 */
const OWNER_COMMANDS = [
  // --- Analytics ---
  {
    name: 'stats',
    aliases: ['botstats', 'analytics', 'bstats', 'serverstats'],
    category: 'analytics',
    minRole: 'staff',
    minTier: 4,
    powerKey: 'VIEW_ANALYTICS',
    syntax: 'stats [overview|commands|servers|users|system]',
    description: 'Interactive analytics dashboard (traffic, commands, servers, users, system).',
    execute: (args, message) => Stats.execute(args, message)
  },
  {
    name: 'broadcast',
    aliases: ['bc', 'eventdm', 'autodm'],
    category: 'analytics',
    minRole: 'co_owner',
    minTier: 2,
    powerKey: 'BROADCAST_EVENTS',
    syntax: 'broadcast <test|start|status|pause> [campaignId]',
    description: 'Trigger, test, monitor, or pause automated community event broadcast DMs.',
    execute: (args, message) => BroadcastCmd.execute(args, message)
  },

  // --- Finance ---
  {
    name: 'withdraw',
    aliases: ['with', 'w'],
    category: 'finance',
    minRole: 'founder',
    minTier: 1,
    powerKey: 'MANAGE_FINANCES',
    syntax: 'withdraw <amount> [user]',
    description: 'Withdraw or transfer cash from reserve to a user account.',
    execute: (args, message) => Cash.execute(args, message)
  },
  {
    name: 'deduct',
    aliases: ['ded', 'd'],
    category: 'finance',
    minRole: 'founder',
    minTier: 1,
    powerKey: 'MANAGE_FINANCES',
    syntax: 'deduct <amount> [user]',
    description: 'Deduct cash from a user account.',
    execute: (args, message) => Deduct.execute(args, message)
  },
  {
    name: 'bank',
    aliases: [],
    category: 'finance',
    minRole: 'admin',
    minTier: 3,
    powerKey: 'MANAGE_BANK',
    syntax: 'bank <status|deduct> <@user|userId> [amount]',
    description: 'Inspect or adjust user bank balance.',
    execute: (args, message) => Bank.execute(args, message)
  },

  // --- Profile & Customization ---
  {
    name: 'banner',
    aliases: ['color'],
    category: 'profile',
    minRole: 'founder',
    minTier: 1,
    powerKey: 'MANAGE_FINANCES',
    syntax: 'banner <url> | color <hex>',
    description: 'Modify profile visual assets and colors.',
    execute: (args, message) => Profile.execute(args, message)
  },
  {
    name: 'badge',
    aliases: ['emoji'],
    category: 'profile',
    minRole: 'admin',
    minTier: 3,
    powerKey: 'MANAGE_ASSETS',
    syntax: 'badge <add|remove> [@user] <badgeID>',
    description: 'Add or remove custom badges/emojis on user profiles.',
    execute: (args, message) => Badge.execute(args, message)
  },
  {
    name: 'reward',
    aliases: [],
    category: 'profile',
    minRole: 'staff',
    minTier: 4,
    powerKey: 'CLAIM_REWARDS',
    syntax: 'reward',
    description: 'Claim daily staff/owner reward.',
    execute: (args, message) => Reward.execute(args, message)
  },
  {
    name: 'bio',
    aliases: [],
    category: 'profile',
    minRole: 'staff',
    minTier: 4,
    powerKey: 'MANAGE_BIO',
    syntax: 'bio <text>',
    description: 'Update profile bio.',
    execute: (args, message) => Bio.execute(args, message)
  },

  // --- Ship ---
  {
    name: 'ship',
    aliases: ['shipcustom'],
    category: 'ship',
    minRole: 'specialist',
    minTier: 5,
    powerKey: 'MANAGE_SHIPS',
    syntax: 'ship <score> <user1> <user2>',
    description: 'Set a permanent custom love score between two users.',
    execute: (args, message) => Ship.execute(args, message)
  },

  // --- Team & Powers ---
  {
    name: 'powers',
    aliases: ['perms', 'info', 'permissions'],
    category: 'team',
    minRole: 'specialist',
    minTier: 5,
    syntax: 'powers [@user|userId]',
    description: 'Inspect the active role, rank tier, and permissions checklist of any team member.',
    execute: async (args, message) => {
      const targetUser = message.mentions.users.first();
      const targetId = targetUser?.id || args[1] || message.author.id;
      
      const userPowers = getUserPowers(targetId);
      const isTargetOwner = userPowers.isOwner;

      const checklist = userPowers.powers.map(p => {
        const icon = p.granted ? '✅' : '❌';
        return `${icon} **${p.name}**\n└ _${p.description}_`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Management Powers & Permissions`)
        .setColor(isTargetOwner ? COLORS.PRIMARY : COLORS.DANGER)
        .setDescription(
          `**User:** <@${targetId}> (\`${targetId}\`)\n` +
          `**Rank / Title:** ${userPowers.roleName} (${userPowers.tierLabel})\n` +
          (userPowers.dateJoined ? `**Appointed Since:** <t:${Math.floor(new Date(userPowers.dateJoined).getTime() / 1000)}:D>\n` : '') +
          `\n### 📋 Permissions & Capabilities Checklist\n${checklist}`
        )
        .setFooter({ text: 'Kasiko Management Suite' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
  {
    name: 'addowner',
    aliases: ['setrole'],
    category: 'team',
    minRole: 'founder',
    minTier: 1,
    powerKey: 'MANAGE_TEAM',
    syntax: 'addowner <userId> <role>',
    description: 'Assign or upgrade an owner role (co_owner, admin, staff, specialist).',
    execute: async (args, message) => {
      const targetMention = message.mentions.users.first();
      const targetId = targetMention?.id || args[1];
      const roleStr = args[2] || (targetMention ? args[1] : null);

      if (!targetId || !roleStr) {
        return message.reply('❌ Usage: `kasow addowner <@user|userId> <role>`\nRoles: `co_owner` (Tier 2), `admin` (Tier 3), `staff` (Tier 4), `specialist` (Tier 5)');
      }
      try {
        const oldOwner = getOwner(targetId);
        const res = await addOwner(targetId, roleStr, message.author.id);
        
        // Log to Audit Channel
        await logRoleChange({
          client: message.client,
          executor: message.author,
          target: targetId,
          action: oldOwner.isOwner ? 'updated' : 'assigned',
          oldRole: oldOwner.isOwner ? `${oldOwner.roleName} (${oldOwner.tierLabel})` : null,
          newRole: `${res.roleName} (${res.tierLabel})`,
          reason: `Assigned via owner command by ${message.author.tag}`
        });

        return message.reply(`✅ Successfully appointed <@${res.ownerId}> as **${res.roleName}** (${res.tierLabel}).`);
      } catch (err) {
        return message.reply(`❌ ${err.message}`);
      }
    }
  },
  {
    name: 'removeowner',
    aliases: ['delowner', 'retireowner'],
    category: 'team',
    minRole: 'founder',
    minTier: 1,
    powerKey: 'MANAGE_TEAM',
    syntax: 'removeowner <userId>',
    description: 'Retire or remove an owner from the management team.',
    execute: async (args, message) => {
      const targetMention = message.mentions.users.first();
      const targetId = targetMention?.id || args[1];

      if (!targetId) {
        return message.reply('❌ Usage: `kasow removeowner <@user|userId>`');
      }
      try {
        const oldOwner = getOwner(targetId);
        await removeOwner(targetId, message.author.id);

        // Log to Audit Channel
        await logRoleChange({
          client: message.client,
          executor: message.author,
          target: targetId,
          action: 'removed',
          oldRole: oldOwner.isOwner ? `${oldOwner.roleName} (${oldOwner.tierLabel})` : null,
          newRole: null,
          reason: `Retired by ${message.author.tag}`
        });

        return message.reply(`✅ Retired <@${targetId}> (\`${targetId}\`) from the management team.`);
      } catch (err) {
        return message.reply(`❌ ${err.message}`);
      }
    }
  },
  {
    name: 'listowners',
    aliases: ['owners', 'team'],
    category: 'team',
    minRole: 'specialist',
    minTier: 5,
    syntax: 'listowners',
    description: 'View the active roster of all bot owners and management accounts.',
    execute: async (args, message) => {
      const owners = getAllOwners();
      if (!owners || owners.length === 0) {
        return message.reply('No active owners found.');
      }

      const lines = owners.map((o, i) => {
        const dateStr = o.dateJoined ? new Date(o.dateJoined).toLocaleDateString() : 'N/A';
        return `\`#${i + 1}\` <@${o.ownerId}> (\`${o.ownerId}\`)\n└ **Rank:** ${o.roleName} • **Tier:** \`${o.tierLabel}\` • **Since:** \`${dateStr}\``;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setTitle('👥 Kasiko Management Team Roster')
        .setColor(COLORS.PRIMARY)
        .setDescription(lines)
        .setFooter({ text: `Total Active Staff: ${owners.length} members` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
  {
    name: 'reloadowners',
    aliases: ['refreshowners'],
    category: 'team',
    minRole: 'founder',
    minTier: 1,
    powerKey: 'MANAGE_TEAM',
    syntax: 'reloadowners',
    description: 'Re-sync active owners from MongoDB into memory cache.',
    execute: async (args, message) => {
      await initOwnerManager(message.client);
      const count = getAllOwners().length;
      
      await sendAuditLog(message.client, {
        type: '👑 ROSTER_RELOAD',
        title: '👑 Management Roster Reloaded',
        executor: message.author,
        description: `Reloaded ${count} active management accounts from MongoDB Atlas.`
      });

      return message.reply(`✅ Successfully reloaded **${count}** management accounts from MongoDB Atlas.`);
    }
  }
];

/**
 * Build Category Select Menu for Owner Help UI
 */
function buildCategorySelectMenu(userTier, currentCategory = 'all') {
  const options = [];

  for (const [catKey, catMeta] of Object.entries(CATEGORIES)) {
    // Check if user has access to at least 1 command in this category (userTier <= cmd.minTier)
    const hasAccess = catKey === 'all' || OWNER_COMMANDS.some(
      cmd => cmd.category === catKey && userTier <= cmd.minTier
    );

    if (hasAccess) {
      options.push({
        label: catMeta.label,
        value: catKey,
        emoji: catMeta.emoji,
        description: catMeta.description.slice(0, 100),
        default: catKey === currentCategory
      });
    }
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('owner_help_category')
    .setPlaceholder('📂 Select a command category to inspect...')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(selectMenu);
}

/**
 * Build Owner Help Embed for specific category
 */
function buildOwnerHelpEmbed(userOwner, categoryKey = 'all') {
  const userTier = userOwner.tier;
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTimestamp();

  if (categoryKey === 'all') {
    embed.setTitle(`👑 Kasiko Management Command Center`);
    embed.setDescription(
      `**Welcome, ${userOwner.roleName}!**\n` +
      `**Your Rank:** \`${userOwner.tierLabel}\` • **Prefix:** \`kasow <cmd>\` (or \`kiow <cmd>\` in dev)\n` +
      `Use \`kasow powers\` to inspect your active permissions checklist.\n`
    );

    for (const [catKey, catMeta] of Object.entries(CATEGORIES)) {
      if (catKey === 'all') continue;
      const allowedCmds = OWNER_COMMANDS.filter(c => c.category === catKey && userTier <= c.minTier);
      if (allowedCmds.length > 0) {
        const cmdList = allowedCmds.map(c => `\`kasow ${c.name}\``).join(', ');
        embed.addFields({
          name: `${catMeta.emoji} ${catMeta.label}`,
          value: `${cmdList}\n*${catMeta.description}*`,
          inline: false
        });
      }
    }
  } else {
    const catMeta = CATEGORIES[categoryKey] || CATEGORIES.all;
    embed.setTitle(`${catMeta.emoji} ${catMeta.label} — Commands`);
    embed.setDescription(`*${catMeta.description}*\n`);

    const allowedCmds = OWNER_COMMANDS.filter(c => c.category === categoryKey && userTier <= c.minTier);
    if (allowedCmds.length === 0) {
      embed.setDescription(`_You do not have permission to view commands in this category._`);
    } else {
      for (const cmd of allowedCmds) {
        const roleDef = Object.values(ROLES).find(r => r.tier === cmd.minTier) || { name: `Tier ${cmd.minTier}` };
        embed.addFields({
          name: `\`kasow ${cmd.syntax}\``,
          value: `• **Description:** ${cmd.description}\n• **Required Rank:** ${roleDef.name} (${roleDef.tierLabel})`,
          inline: false
        });
      }
    }
  }

  embed.setFooter({ text: `Kasiko Owner Suite • ${userOwner.tierLabel}` });
  return embed;
}

/**
 * Main Owner Commands Dispatcher
 */
export async function OwnerCommands(args, message) {
  const authorId = message.author.id;
  const userOwner = getOwner(authorId);

  // If user is not an owner, deny silently or with message
  if (!userOwner.isOwner) {
    return;
  }

  const rawCommand = args[0]?.toLowerCase();

  // If no command provided or help requested, render interactive help UI
  if (!rawCommand || ['help', 'h', '?'].includes(rawCommand)) {
    let currentCategory = 'all';
    const embed = buildOwnerHelpEmbed(userOwner, currentCategory);
    const row = buildCategorySelectMenu(userOwner.tier, currentCategory);

    const helpMsg = await message.reply({
      embeds: [embed],
      components: [row]
    });

    const collector = helpMsg.createMessageComponentCollector({
      filter: i => i.user.id === authorId,
      componentType: ComponentType.StringSelect,
      time: 180000 // 3 minutes
    });

    collector.on('collect', async interaction => {
      try {
        currentCategory = interaction.values[0];
        const newEmbed = buildOwnerHelpEmbed(userOwner, currentCategory);
        const newRow = buildCategorySelectMenu(userOwner.tier, currentCategory);
        await interaction.update({
          embeds: [newEmbed],
          components: [newRow]
        });
      } catch (err) {
        console.error('[OwnerHelpSelect] Error updating help UI:', err);
      }
    });

    collector.on('end', async () => {
      try {
        const disabledRow = buildCategorySelectMenu(userOwner.tier, currentCategory);
        disabledRow.components.forEach(c => c.setDisabled(true));
        await helpMsg.edit({ components: [disabledRow] }).catch(() => {});
      } catch (e) {}
    });

    return;
  }

  // Find matching command in registry
  const cmd = OWNER_COMMANDS.find(c => c.name === rawCommand || c.aliases.includes(rawCommand));
  if (!cmd) {
    return message.reply(`❌ Unknown owner command \`${rawCommand}\`. Use \`kasow help\` to view available commands.`);
  }

  // Permission Check (Tier 1 <= Tier 2 <= Tier 3...)
  if (userOwner.tier > cmd.minTier) {
    const roleDef = Object.values(ROLES).find(r => r.tier === cmd.minTier);
    return message.reply(`❌ Permission Denied. You need at least **${roleDef?.name || `Tier ${cmd.minTier}`}** to use \`${cmd.name}\`.`);
  }

  // Execute command
  try {
    return await cmd.execute(args, message);
  } catch (err) {
    console.error(`[OwnerCommand:${cmd.name}] Error:`, err);
    return message.reply(`❌ An error occurred while executing \`${cmd.name}\`: ${err.message}`);
  }
}

// Backward compatibility export for legacy imports
export async function getBotTeam() {
  const team = {};
  for (const o of getAllOwners()) {
    team[o.ownerId] = o.tier;
  }
  return team;
}

export default OwnerCommands;
