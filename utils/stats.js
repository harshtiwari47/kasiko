import { EmbedBuilder } from 'discord.js';
import BotStats from '../models/BotStats.js';

const SUMMARY_CACHE_KEY = 'stats:summary:cache';
const SUMMARY_CACHE_TTL = 300; // 5 minutes

/**
 * High-performance command execution tracker using Redis atomic pipelines.
 * Tracks daily & all-time metrics without blocking hash scans.
 * 
 * @param {import('discord.js').Message|import('discord.js').Interaction} context
 * @param {any} redisClient
 * @param {string} commandName
 */
export default async function trackStats(context, redisClient, commandName) {
  if (!redisClient || !redisClient.isOpen) return;

  try {
    const userId = context?.author?.id || context?.user?.id;
    const guildId = context?.guild?.id || context?.guildId || 'DM';
    const guildName = context?.guild?.name || context?.guildName || null;
    const cmdName = (commandName || context?.commandName || 'unknown').toLowerCase();
    
    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const currentHour = String(now.getHours()); // 0-23

    const dailyTotalKey = `stats:daily:${today}:total`;
    const dailyCmdKey = `stats:daily:${today}:commands`;
    const alltimeCmdKey = `stats:alltime:commands`;
    const dailyUsersKey = `stats:daily:${today}:users`;
    const dailyUserUsageKey = `stats:daily:${today}:userUsage`;
    const alltimeUserUsageKey = `stats:alltime:userUsage`;
    const dailyGuildUsageKey = `stats:daily:${today}:guildUsage`;
    const alltimeGuildUsageKey = `stats:alltime:guildUsage`;
    const dailyHourlyKey = `stats:daily:${today}:hourly`;

    const multi = redisClient.multi();

    // 1. Daily & All-time Command Counts
    multi.incr(dailyTotalKey);
    multi.expire(dailyTotalKey, 172800); // 48h TTL

    multi.zIncrBy(dailyCmdKey, 1, cmdName);
    multi.expire(dailyCmdKey, 172800);

    multi.zIncrBy(alltimeCmdKey, 1, cmdName);

    // 2. Active Users (HyperLogLog for fast cardinality + Sorted Set for top users)
    if (userId) {
      multi.pfAdd(dailyUsersKey, userId);
      multi.expire(dailyUsersKey, 172800);

      multi.zIncrBy(dailyUserUsageKey, 1, userId);
      multi.expire(dailyUserUsageKey, 172800);

      multi.zIncrBy(alltimeUserUsageKey, 1, userId);
    }

    // 3. Guild Usage
    if (guildId && guildId !== 'DM') {
      multi.zIncrBy(dailyGuildUsageKey, 1, guildId);
      multi.expire(dailyGuildUsageKey, 172800);

      multi.zIncrBy(alltimeGuildUsageKey, 1, guildId);

      if (guildName) {
        multi.setEx(`guild:name:${guildId}`, 86400, guildName); // 24h name cache
      }
    }

    // 4. Hourly Activity
    multi.hIncrBy(dailyHourlyKey, currentHour, 1);
    multi.expire(dailyHourlyKey, 172800);

    await multi.exec();
  } catch (err) {
    // Non-blocking catch to ensure stats tracking failure never disrupts command flow
    console.error('[StatsTracker] Error tracking stats:', err.message);
  }
}

/**
 * Synchronize Redis realtime counters into MongoDB for persistent historical storage.
 * Also precomputes and refreshes the fast summary cache.
 * 
 * @param {import('discord.js').Client} client
 * @param {any} redisClient
 */
export async function syncStatsToMongoDB(client, redisClient) {
  if (!redisClient || !redisClient.isOpen) return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const dailyTotalKey = `stats:daily:${today}:total`;
    const dailyCmdKey = `stats:daily:${today}:commands`;
    const dailyUsersKey = `stats:daily:${today}:users`;
    const dailyUserUsageKey = `stats:daily:${today}:userUsage`;
    const dailyGuildUsageKey = `stats:daily:${today}:guildUsage`;
    const dailyHourlyKey = `stats:daily:${today}:hourly`;

    const [
      totalCommandsRaw,
      dailyCmdsRaw,
      uniqueUsersCount,
      dailyUsersRaw,
      dailyGuildsRaw,
      hourlyRaw
    ] = await Promise.all([
      redisClient.get(dailyTotalKey).catch(() => '0'),
      redisClient.zRangeWithScores(dailyCmdKey, 0, -1).catch(() => []),
      redisClient.pfCount(dailyUsersKey).catch(() => 0),
      redisClient.zRangeWithScores(dailyUserUsageKey, 0, -1, { REV: true }).catch(() => []),
      redisClient.zRangeWithScores(dailyGuildUsageKey, 0, -1, { REV: true }).catch(() => []),
      redisClient.hGetAll(dailyHourlyKey).catch(() => ({}))
    ]);

    const totalCommands = parseInt(totalCommandsRaw || '0', 10);
    
    // Format command map
    const commandsMap = new Map();
    for (const item of dailyCmdsRaw) {
      commandsMap.set(item.value, item.score);
    }

    // Format top user usage map (store top 100)
    const userUsageMap = new Map();
    for (const item of dailyUsersRaw.slice(0, 100)) {
      userUsageMap.set(item.value, item.score);
    }

    // Format top guild usage map (store top 100)
    const guildUsageMap = new Map();
    for (const item of dailyGuildsRaw.slice(0, 100)) {
      guildUsageMap.set(item.value, item.score);
    }

    // Format 24-hour activity array
    const hourlyActivity = new Array(24).fill(0);
    for (let h = 0; h < 24; h++) {
      hourlyActivity[h] = parseInt(hourlyRaw[String(h)] || '0', 10);
    }

    const serverCount = client?.guilds?.cache?.size || 0;
    const memberCount = client?.guilds?.cache?.reduce((sum, g) => sum + (g.memberCount || 0), 0) || 0;

    // Upsert into MongoDB
    await BotStats.findOneAndUpdate(
      { date: today },
      {
        $set: {
          totalCommands,
          commands: commandsMap,
          activeUsersCount: uniqueUsersCount,
          activeGuildsCount: dailyGuildsRaw.length,
          guildUsage: guildUsageMap,
          userUsage: userUsageMap,
          hourlyActivity,
          serverCountSnapshot: serverCount,
          memberCountSnapshot: memberCount,
          lastSyncedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Warm / refresh the 5-minute summary cache in Redis
    await refreshSummaryCache(client, redisClient);
    console.log(`[StatsSync] ✅ Stats synced to MongoDB for ${today} (Commands: ${totalCommands}, Active Users: ${uniqueUsersCount})`);
  } catch (err) {
    console.error('[StatsSync] Failed to sync stats to MongoDB:', err);
  }
}

/**
 * Refresh precomputed summary analytics in Redis for sub-millisecond retrieval.
 */
async function refreshSummaryCache(client, redisClient) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7); // YYYY-MM

    const [
      todayCommandsRaw,
      todayUsersCount,
      alltimeCommandsRaw,
      topCommandsToday,
      topCommandsAlltime,
      topGuildsAlltime,
      topUsersAlltime,
      monthlyDocs
    ] = await Promise.all([
      redisClient.get(`stats:daily:${today}:total`).catch(() => '0'),
      redisClient.pfCount(`stats:daily:${today}:users`).catch(() => 0),
      redisClient.zRangeWithScores('stats:alltime:commands', 0, -1).catch(() => []),
      redisClient.zRangeWithScores(`stats:daily:${today}:commands`, 0, 9, { REV: true }).catch(() => []),
      redisClient.zRangeWithScores('stats:alltime:commands', 0, 9, { REV: true }).catch(() => []),
      redisClient.zRangeWithScores('stats:alltime:guildUsage', 0, 9, { REV: true }).catch(() => []),
      redisClient.zRangeWithScores('stats:alltime:userUsage', 0, 9, { REV: true }).catch(() => []),
      BotStats.find({ date: new RegExp(`^${monthPrefix}`) }).select('totalCommands activeUsersCount').lean().catch(() => [])
    ]);

    const todayCommands = parseInt(todayCommandsRaw || '0', 10);
    const alltimeCommandsTotal = alltimeCommandsRaw.reduce((sum, item) => sum + item.score, 0);
    const monthCommandsTotal = monthlyDocs.reduce((sum, doc) => sum + (doc.totalCommands || 0), 0) + todayCommands;

    const serverCount = client?.guilds?.cache?.size || 0;
    const totalMembers = client?.guilds?.cache?.reduce((sum, g) => sum + (g.memberCount || 0), 0) || 0;

    // Resolve top server names
    const resolvedTopGuilds = await Promise.all(
      topGuildsAlltime.map(async item => {
        let name = client?.guilds?.cache?.get(item.value)?.name;
        if (!name) {
          name = await redisClient.get(`guild:name:${item.value}`).catch(() => null);
        }
        return {
          id: item.value,
          name: name || `Server (${item.value})`,
          count: item.score
        };
      })
    );

    const summaryPayload = {
      overview: {
        serverCount,
        totalMembers,
        todayCommands,
        monthCommandsTotal,
        alltimeCommandsTotal,
        todayActiveUsers: todayUsersCount,
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          rssMb: (process.memoryUsage().rss / (1024 * 1024)).toFixed(1),
          heapUsedMb: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(1),
          heapTotalMb: (process.memoryUsage().heapTotal / (1024 * 1024)).toFixed(1)
        },
        ping: client?.ws?.ping || 0
      },
      topCommandsToday: topCommandsToday.map(i => ({ name: i.value, count: i.score })),
      topCommandsAlltime: topCommandsAlltime.map(i => ({ name: i.value, count: i.score })),
      topGuildsActivity: resolvedTopGuilds,
      topUsersActivity: topUsersAlltime.map(i => ({ userId: i.value, count: i.score })),
      cachedAt: Date.now()
    };

    await redisClient.setEx(SUMMARY_CACHE_KEY, SUMMARY_CACHE_TTL, JSON.stringify(summaryPayload));
    return summaryPayload;
  } catch (err) {
    console.error('[StatsCache] Error refreshing summary cache:', err);
    return null;
  }
}

/**
 * Fetch assembled analytics data (O(1) from cache or dynamically computed).
 * 
 * @param {import('discord.js').Client} client
 * @param {any} redisClient
 * @param {boolean} forceRefresh
 */
export async function getAnalyticsData(client, redisClient, forceRefresh = false) {
  if (!forceRefresh && redisClient && redisClient.isOpen) {
    try {
      const cached = await redisClient.get(SUMMARY_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
  }
  return await refreshSummaryCache(client, redisClient);
}