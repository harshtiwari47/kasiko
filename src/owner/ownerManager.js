import fs from 'fs/promises';
import path from 'path';
import OwnerModel from '../../models/Owner.js';
import redisClient from '../../redis.js';
import {
  CHANNELS,
  PRIMARY_FOUNDER_ID,
  POWERS,
  ROLES,
  ROLE_ALIASES
} from '../../constants.js';

export {
  CHANNELS,
  PRIMARY_FOUNDER_ID,
  POWERS,
  ROLES,
  ROLE_ALIASES
};

// In-memory fast cache
const memoryOwners = new Map();
const ownersFilePath = path.join(process.cwd(), 'src', 'owner', 'owners.json');

/**
 * Resolve a role string, tier number, or level to a canonical role key.
 */
export function normalizeRole(roleInput) {
  if (typeof roleInput === 'number') {
    if (roleInput === 1 || roleInput >= 100) return 'founder';
    if (roleInput === 2 || roleInput >= 80) return 'co_owner';
    if (roleInput === 3 || roleInput >= 60) return 'admin';
    if (roleInput === 4 || roleInput >= 40) return 'staff';
    if (roleInput === 5 || roleInput >= 30) return 'specialist';
    return null;
  }
  const clean = String(roleInput || '').toLowerCase().trim();
  return ROLE_ALIASES[clean] || null;
}

/**
 * Initialize and load the owner manager.
 * MongoDB is the Single Source of Truth.
 */
export async function initOwnerManager(client = null) {
  try {
    memoryOwners.clear();

    // 1. Seed Root Founder
    memoryOwners.set(PRIMARY_FOUNDER_ID, {
      ownerId: PRIMARY_FOUNDER_ID,
      role: 'founder',
      tier: ROLES.founder.tier,
      level: ROLES.founder.level,
      roleName: ROLES.founder.name,
      tierLabel: ROLES.founder.tierLabel,
      badge: ROLES.founder.badge,
      dateJoined: new Date('2024-01-01')
    });

    // 2. Load from MongoDB
    const docs = await OwnerModel.find({ retired: { $ne: true } }).lean().catch(() => []);

    for (const doc of docs) {
      if (!doc.ownerId) continue;
      
      // Ensure primary founder is always Tier 1 founder
      if (doc.ownerId === PRIMARY_FOUNDER_ID) {
        memoryOwners.set(PRIMARY_FOUNDER_ID, {
          ownerId: PRIMARY_FOUNDER_ID,
          role: 'founder',
          tier: ROLES.founder.tier,
          level: ROLES.founder.level,
          roleName: ROLES.founder.name,
          tierLabel: ROLES.founder.tierLabel,
          badge: ROLES.founder.badge,
          dateJoined: doc.dateJoined || new Date()
        });
        continue;
      }

      const canonicalRole = normalizeRole(doc.role || doc.ownerType) || 'staff';
      // Prevent any other user from taking founder role
      const effectiveRole = canonicalRole === 'founder' ? 'co_owner' : canonicalRole;
      const roleDef = ROLES[effectiveRole] || ROLES.staff;

      memoryOwners.set(doc.ownerId, {
        ownerId: doc.ownerId,
        role: effectiveRole,
        tier: roleDef.tier,
        level: roleDef.level,
        roleName: roleDef.name,
        tierLabel: roleDef.tierLabel,
        badge: roleDef.badge,
        dateJoined: doc.dateJoined || new Date()
      });
    }

    // 3. Mirror to owners.json and Redis for secondary cache
    await syncToLocalJson();
    await syncToRedis();

    console.log(`[OwnerManager] ✅ Loaded ${memoryOwners.size} active management accounts from MongoDB.`);
  } catch (err) {
    console.error('[OwnerManager] Error during initialization:', err);
    // Fallback: ensure primary founder is always loaded
    memoryOwners.set(PRIMARY_FOUNDER_ID, {
      ownerId: PRIMARY_FOUNDER_ID,
      role: 'founder',
      tier: ROLES.founder.tier,
      level: ROLES.founder.level,
      roleName: ROLES.founder.name,
      tierLabel: ROLES.founder.tierLabel,
      badge: ROLES.founder.badge,
      dateJoined: new Date()
    });
  }
}

/**
 * Get owner details for a specific user ID.
 * Returns synchronous O(1) object.
 */
export function getOwner(userId) {
  if (!userId) return { isOwner: false, role: null, tier: 0, tierLabel: 'None', roleName: 'Regular User', badge: '' };
  
  const idStr = String(userId);
  const cached = memoryOwners.get(idStr);
  if (cached) {
    return {
      isOwner: true,
      ...cached
    };
  }

  // Fallback for root founder
  if (idStr === PRIMARY_FOUNDER_ID) {
    return {
      isOwner: true,
      ownerId: PRIMARY_FOUNDER_ID,
      role: 'founder',
      tier: ROLES.founder.tier,
      level: ROLES.founder.level,
      roleName: ROLES.founder.name,
      tierLabel: ROLES.founder.tierLabel,
      badge: ROLES.founder.badge
    };
  }

  return {
    isOwner: false,
    ownerId: idStr,
    role: null,
    tier: 0,
    tierLabel: 'None',
    roleName: 'Regular User',
    badge: ''
  };
}

/**
 * Check if a user has at least the required role or minimum tier.
 * (Lower tier number = higher rank, e.g. Tier 1 > Tier 2).
 */
export function hasOwnerPermission(userId, minRoleOrTier) {
  const owner = getOwner(userId);
  if (!owner.isOwner) return false;

  let maxAllowedTier = 5; // default lowest tier
  if (typeof minRoleOrTier === 'number') {
    maxAllowedTier = minRoleOrTier <= 5 ? minRoleOrTier : 5;
  } else {
    const roleKey = normalizeRole(minRoleOrTier);
    if (roleKey && ROLES[roleKey]) {
      maxAllowedTier = ROLES[roleKey].tier;
    }
  }

  // In Tier system: Tier 1 (Founder) <= Tier 2 <= Tier 3...
  return owner.tier > 0 && owner.tier <= maxAllowedTier;
}

/**
 * Check if a user possesses a specific power capability.
 */
export function hasPower(userId, powerKey) {
  const owner = getOwner(userId);
  if (!owner.isOwner) return false;

  const powerDef = POWERS[powerKey];
  if (!powerDef) return false;

  return owner.tier > 0 && owner.tier <= powerDef.minTier;
}

/**
 * Inspect all power capabilities of a user.
 */
export function getUserPowers(userId) {
  const owner = getOwner(userId);
  const powerList = [];

  for (const [key, p] of Object.entries(POWERS)) {
    const granted = owner.isOwner && owner.tier > 0 && owner.tier <= p.minTier;
    powerList.push({
      key,
      name: p.name,
      description: p.description,
      minTier: p.minTier,
      granted
    });
  }

  return {
    isOwner: owner.isOwner,
    ownerId: owner.ownerId || userId,
    role: owner.role,
    tier: owner.tier,
    tierLabel: owner.tierLabel,
    roleName: owner.roleName,
    badge: owner.badge,
    dateJoined: owner.dateJoined,
    powers: powerList
  };
}

/**
 * Add or update an owner role in MongoDB, memory, and Redis.
 */
export async function addOwner(targetUserId, roleInput, addedByUserId) {
  const targetId = String(targetUserId).trim();
  const canonicalRole = normalizeRole(roleInput);

  if (!canonicalRole || !ROLES[canonicalRole]) {
    throw new Error(`Invalid role '${roleInput}'. Available roles: ${Object.keys(ROLES).join(', ')}`);
  }

  // Enforce single founder rule
  if (canonicalRole === 'founder' && targetId !== PRIMARY_FOUNDER_ID) {
    throw new Error(`The 'founder' (Tier 1) role is strictly reserved for the single root creator. You can assign 'co_owner' (Tier 2) instead.`);
  }

  const roleDef = ROLES[canonicalRole];

  // 1. Upsert in MongoDB
  await OwnerModel.findOneAndUpdate(
    { ownerId: targetId },
    {
      $set: {
        ownerId: targetId,
        ownerType: canonicalRole,
        role: canonicalRole,
        level: roleDef.level,
        assignedBy: String(addedByUserId),
        retired: false
      },
      $setOnInsert: {
        dateJoined: new Date()
      }
    },
    { upsert: true, new: true }
  );

  // 2. Update memory map
  memoryOwners.set(targetId, {
    ownerId: targetId,
    role: canonicalRole,
    tier: roleDef.tier,
    level: roleDef.level,
    roleName: roleDef.name,
    tierLabel: roleDef.tierLabel,
    badge: roleDef.badge,
    dateJoined: new Date()
  });

  // 3. Mirror
  await syncToLocalJson();
  await syncToRedis();

  return {
    ownerId: targetId,
    role: canonicalRole,
    roleName: roleDef.name,
    tier: roleDef.tier,
    tierLabel: roleDef.tierLabel
  };
}

/**
 * Remove / retire an owner.
 */
export async function removeOwner(targetUserId, removedByUserId) {
  const targetId = String(targetUserId).trim();

  if (targetId === PRIMARY_FOUNDER_ID) {
    throw new Error('The primary founder cannot be removed or retired.');
  }

  // 1. Update in MongoDB
  await OwnerModel.findOneAndUpdate(
    { ownerId: targetId },
    {
      $set: {
        retired: true,
        assignedBy: `removed_by_${removedByUserId}`
      }
    },
    { new: true }
  );

  // 2. Remove from memory
  memoryOwners.delete(targetId);

  // 3. Mirror
  await syncToLocalJson();
  await syncToRedis();

  return true;
}

/**
 * Get a list of all active owners sorted by rank (Tier 1 to 5).
 */
export function getAllOwners() {
  return Array.from(memoryOwners.values()).sort((a, b) => a.tier - b.tier);
}

/**
 * Write active owners to local JSON file as a secondary mirror.
 */
async function syncToLocalJson() {
  try {
    const rawObj = {};
    for (const [id, data] of memoryOwners.entries()) {
      rawObj[id] = data.tier;
    }
    await fs.writeFile(ownersFilePath, JSON.stringify(rawObj, null, 2), 'utf8');
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Sync active owners to Redis hash.
 */
async function syncToRedis() {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    const redisMap = {};
    for (const [id, data] of memoryOwners.entries()) {
      redisMap[id] = JSON.stringify(data);
    }
    if (Object.keys(redisMap).length > 0) {
      await redisClient.hSet('owner:team', redisMap);
    }
  } catch (err) {
    // Non-blocking
  }
}

export default {
  ROLES,
  ROLE_ALIASES,
  POWERS,
  initOwnerManager,
  getOwner,
  hasOwnerPermission,
  hasPower,
  getUserPowers,
  addOwner,
  removeOwner,
  getAllOwners,
  normalizeRole
};
