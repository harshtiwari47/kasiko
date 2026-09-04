import redisClient from '../../../../redis.js';
import User from '../../../../models/User.js';

const FRIENDS_CACHE_TTL = 3600; // 1 hour
const MAX_FRIENDS = 30;

/**
 * Get a user's friends list, checking Redis cache first, then MongoDB.
 * @param {string} userId
 * @returns {Promise<string[]>} Array of friend user IDs
 */
export async function getCachedFriends(userId) {
  try {
    const cached = await redisClient.get(`friends:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Cache miss or parse error — fall through to DB
  }

  // Fetch from MongoDB
  try {
    const user = await User.findOne({ id: userId }, { friends: 1 }).lean();
    const friends = user?.friends || [];
    // Populate cache
    await setCachedFriends(userId, friends);
    return friends;
  } catch (err) {
    console.error('[FriendsCache] DB fetch error:', err);
    return [];
  }
}

/**
 * Write a user's friends list to Redis cache.
 * @param {string} userId
 * @param {string[]} friendsArray
 */
export async function setCachedFriends(userId, friendsArray) {
  try {
    await redisClient.setEx(`friends:${userId}`, FRIENDS_CACHE_TTL, JSON.stringify(friendsArray));
  } catch (err) {
    // Non-critical — cache write failure is OK
  }
}

/**
 * Invalidate (delete) a user's friends cache so the next lookup hits MongoDB.
 * @param {string} userId
 */
export async function invalidateFriendsCache(userId) {
  try {
    await redisClient.del(`friends:${userId}`);
  } catch {
    // Non-critical
  }
}

/**
 * Fast check: are two users friends?
 * Uses Redis cache for O(1) lookup, falls back to MongoDB.
 * @param {string} userId1
 * @param {string} userId2
 * @returns {Promise<boolean>}
 */
export async function areFriends(userId1, userId2) {
  const friends = await getCachedFriends(userId1);
  return friends.includes(userId2);
}

/**
 * Add a friend to both users (mutual). Updates MongoDB and invalidates both caches.
 * @param {string} userId1
 * @param {string} userId2
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function addFriend(userId1, userId2) {
  try {
    // Check current counts
    const [user1, user2] = await Promise.all([
      User.findOne({ id: userId1 }, { friends: 1 }).lean(),
      User.findOne({ id: userId2 }, { friends: 1 }).lean(),
    ]);

    const friends1 = user1?.friends || [];
    const friends2 = user2?.friends || [];

    if (friends1.includes(userId2)) {
      return { success: false, error: 'already_friends' };
    }
    if (friends1.length >= MAX_FRIENDS) {
      return { success: false, error: 'user1_full' };
    }
    if (friends2.length >= MAX_FRIENDS) {
      return { success: false, error: 'user2_full' };
    }

    // Add to both sides atomically
    await Promise.all([
      User.updateOne({ id: userId1 }, { $addToSet: { friends: userId2 } }),
      User.updateOne({ id: userId2 }, { $addToSet: { friends: userId1 } }),
    ]);

    // Invalidate both caches
    await Promise.all([
      invalidateFriendsCache(userId1),
      invalidateFriendsCache(userId2),
    ]);

    return { success: true };
  } catch (err) {
    console.error('[FriendsCache] addFriend error:', err);
    return { success: false, error: 'db_error' };
  }
}

/**
 * Remove a friend from both users (mutual). Updates MongoDB and invalidates both caches.
 * @param {string} userId1
 * @param {string} userId2
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeFriend(userId1, userId2) {
  try {
    await Promise.all([
      User.updateOne({ id: userId1 }, { $pull: { friends: userId2 } }),
      User.updateOne({ id: userId2 }, { $pull: { friends: userId1 } }),
    ]);

    await Promise.all([
      invalidateFriendsCache(userId1),
      invalidateFriendsCache(userId2),
    ]);

    return { success: true };
  } catch (err) {
    console.error('[FriendsCache] removeFriend error:', err);
    return { success: false, error: 'db_error' };
  }
}

export { MAX_FRIENDS };
