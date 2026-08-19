import dotenv from 'dotenv';
dotenv.config();

/**
 * Kasiko Bot Global Constants & Configurations
 */

export const CHANNELS = {
  ERROR_LOGS: process.env.ERROR_LOG_CHANNEL_ID || '1539747023358533743',
  AUDIT_LOGS: process.env.AUDIT_LOG_CHANNEL_ID || process.env.ERROR_LOG_CHANNEL_ID || '1539747023358533743',
  TRANSACTIONS: process.env.TRANSACTION_LOG_CHANNEL_ID || process.env.ERROR_LOG_CHANNEL_ID || '1539747023358533743',
  FEEDBACK: process.env.FEEDBACK_CHANNEL_ID || process.env.AUDIT_LOG_CHANNEL_ID || process.env.ERROR_LOG_CHANNEL_ID || '1539747023358533743',
  GIVEAWAY: process.env.GIVEAWAY_CHANNEL_ID || '1309081669424123964'
};

export const GIVEAWAY_CONFIG = {
  ALERT_ROLE_ID: process.env.GIVEAWAY_ROLE_ID || null,
  MIN_PRIZE: 500000,
  MAX_PRIZE: 2000000,
  DEFAULT_DURATION_HOURS: 24
};

export const PRIMARY_FOUNDER_ID = process.env.PRIMARY_FOUNDER_ID || '1318158188822138972';

/**
 * Standard Embed & Container Colors
 */
export const COLORS = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C,
  DANGER: 0xED4245,
  INFO: 0x5865F2,
  PURPLE: 0x9B59B6,
  GOLD: 0xF1C40F
};

/**
 * Management Capabilities / Powers
 */
export const POWERS = {
  MANAGE_TEAM: {
    key: 'MANAGE_TEAM',
    name: 'Manage Team & Roles',
    description: 'Add, remove, or modify management accounts and roles.',
    minTier: 1
  },
  MANAGE_FINANCES: {
    key: 'MANAGE_FINANCES',
    name: 'Reserve Cash & Deductions',
    description: 'Withdraw from bot reserves or deduct cash from user accounts.',
    minTier: 1
  },
  MANAGE_BANK: {
    key: 'MANAGE_BANK',
    name: 'Bank Account Management',
    description: 'Inspect and adjust user bank balances.',
    minTier: 3
  },
  MANAGE_ASSETS: {
    key: 'MANAGE_ASSETS',
    name: 'Profile Assets & Badges',
    description: 'Assign or revoke custom profile badges, emojis, and banners.',
    minTier: 3
  },
  MANAGE_PASSES: {
    key: 'MANAGE_PASSES',
    name: 'Passes & Promo Codes',
    description: 'Manually activate subscription passes and generate promo codes.',
    minTier: 3
  },
  VIEW_ANALYTICS: {
    key: 'VIEW_ANALYTICS',
    name: 'Bot & Server Analytics',
    description: 'Access live traffic, top commands, server ranks, and system health.',
    minTier: 4
  },
  CLAIM_REWARDS: {
    key: 'CLAIM_REWARDS',
    name: 'Daily Staff Reward',
    description: 'Claim daily management salary/reward.',
    minTier: 4
  },
  MANAGE_BIO: {
    key: 'MANAGE_BIO',
    name: 'Profile Bio Management',
    description: 'Update account profile bio directly.',
    minTier: 4
  },
  MANAGE_SHIPS: {
    key: 'MANAGE_SHIPS',
    name: 'Custom Ship Scores',
    description: 'Set permanent custom love scores between users.',
    minTier: 5
  }
};

/**
 * Scalable Management Role Hierarchy
 */
export const ROLES = {
  founder: {
    key: 'founder',
    tier: 1,
    level: 100, // internal comparison only
    name: '👑 Supreme Founder',
    shortTitle: 'Founder',
    tierLabel: 'Tier 1',
    badge: '<:kasiko_supreme:1389508842529755217>',
    description: 'Single root system creator with unrestricted root authority across all systems.'
  },
  co_owner: {
    key: 'co_owner',
    tier: 2,
    level: 80,
    name: '🛡️ Executive Co-Owner',
    shortTitle: 'Co-Owner',
    tierLabel: 'Tier 2',
    badge: '<:kasiko_director:1389508823055601725>',
    description: 'Executive management with full operational, financial, and administrative authority.'
  },
  admin: {
    key: 'admin',
    tier: 3,
    level: 60,
    name: '⚡ General Administrator',
    shortTitle: 'Administrator',
    tierLabel: 'Tier 3',
    badge: '<:kasiko_director:1389508823055601725>',
    description: 'Administrative tier capable of managing accounts, bank balances, badges, and server analytics.'
  },
  staff: {
    key: 'staff',
    tier: 4,
    level: 40,
    name: '⭐ Community Staff',
    shortTitle: 'Staff Member',
    tierLabel: 'Tier 4',
    badge: '<:kasiko_director:1389508823055601725>',
    description: 'Community & bot staff with access to analytics, daily staff rewards, and bio management.'
  },
  specialist: {
    key: 'specialist',
    tier: 5,
    level: 30,
    name: '💖 Technical Specialist',
    shortTitle: 'Specialist',
    tierLabel: 'Tier 5',
    badge: '',
    description: 'Specialized testing tier with access to ship customizations and beta features.'
  }
};

export const ROLE_ALIASES = {
  superowner: 'founder',
  owner: 'founder',
  founder: 'founder',
  creator: 'founder',

  adminowner: 'co_owner',
  co_owner: 'co_owner',
  coowner: 'co_owner',
  director: 'co_owner',

  admin: 'admin',
  manager: 'admin',
  administrator: 'admin',

  basicowner: 'staff',
  staff: 'staff',
  mod: 'staff',
  moderator: 'staff',

  shipowner: 'specialist',
  specialist: 'specialist',
  tester: 'specialist'
};

export default {
  CHANNELS,
  PRIMARY_FOUNDER_ID,
  COLORS,
  POWERS,
  ROLES,
  ROLE_ALIASES
};
