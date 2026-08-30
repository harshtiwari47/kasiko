import mongoose from 'mongoose';
import { getAnalyticsData } from '../../utils/stats.js';
import { getAllOwners } from '../owner/ownerManager.js';
import { getDashboardLogs, addDashboardLog, clearDashboardLogs } from './dashboardLogs.js';
import txtcommands from '../textCommandHandler.js';
import { renderDashboardHtml } from './dashboardHtml.js';

// In-memory cache for high-efficiency, sub-millisecond dashboard responses
let _cachedTelemetry = null;
let _cachedTelemetryTime = 0;
const TELEMETRY_CACHE_TTL_MS = 10000; // 10 seconds

/**
 * Assembles live telemetry and system metrics into a unified payload.
 */
export async function getTelemetryData(clientInput, redisClient, commandsInput = null) {
  const now = Date.now();
  if (_cachedTelemetry && (now - _cachedTelemetryTime) < TELEMETRY_CACHE_TTL_MS) {
    // Keep logs and memory live
    return {
      ..._cachedTelemetry,
      logs: getDashboardLogs({ limit: 100 }),
      system: {
        ..._cachedTelemetry.system,
        memory: {
          rssMb: (process.memoryUsage().rss / (1024 * 1024)).toFixed(1),
          heapUsedMb: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(1),
          heapTotalMb: (process.memoryUsage().heapTotal / (1024 * 1024)).toFixed(1)
        }
      }
    };
  }

  try {
    const client = typeof clientInput === 'function' ? clientInput() : clientInput;
    const analytics = (await getAnalyticsData(client, redisClient).catch(() => null)) || {};
    const overview = analytics.overview || {};

    const guildArray = client?.guilds?.cache ? Array.from(client.guilds.cache.values()) : [];
    const serverCount = guildArray.length || overview.serverCount || 0;
    const totalMembers = guildArray.reduce((sum, g) => sum + (Number(g.memberCount) || 0), 0) || overview.totalMembers || 0;

    // Database statuses
    const mongoState = mongoose.connection.readyState;
    const isMongoConnected = mongoState === 1;
    const isRedisConnected = !!(redisClient && redisClient.isOpen);

    // Bot Identity & Runtime
    const botData = {
      tag: client?.user?.tag || 'Kasiko Bot',
      id: client?.user?.id || '1284795325852155986',
      avatar: client?.user?.displayAvatarURL?.({ dynamic: true }) || 'https://harshtiwari47.github.io/kasiko-public/images/logo.png',
      uptime: process.uptime(),
      ping: client?.ws?.ping || overview.ping || 0,
      readyAt: client?.readyAt || null,
      status: client?.isReady?.() ? 'ONLINE' : 'STARTING',
      shardId: client?.shard?.ids?.[0] ?? 0,
      totalShards: client?.shard?.count ?? 1,
      totalGuilds: serverCount,
      totalMembers: totalMembers
    };

    // Node & System Info
    const memUsage = process.memoryUsage();
    const systemData = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        rssMb: (memUsage.rss / (1024 * 1024)).toFixed(1),
        heapUsedMb: (memUsage.heapUsed / (1024 * 1024)).toFixed(1),
        heapTotalMb: (memUsage.heapTotal / (1024 * 1024)).toFixed(1),
        externalMb: (memUsage.external / (1024 * 1024)).toFixed(1)
      }
    };

    // Connected Servers array (capped to top 200 for fast network transfer)
    const serversList = guildArray
      .map(g => ({
        id: g.id,
        name: g.name,
        memberCount: Number(g.memberCount) || 0,
        icon: typeof g.iconURL === 'function' ? g.iconURL({ dynamic: true, size: 64 }) : null,
        joinedAt: g.joinedAt ? g.joinedAt.toISOString() : null,
        ownerId: g.ownerId
      }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 200);

    // Owners & Management Team
    const rawOwners = getAllOwners() || [];
    const resolvedOwners = rawOwners.map(o => {
      const userObj = client?.users?.cache?.get(o.ownerId);
      return {
        ...o,
        username: userObj?.username || userObj?.globalName || (o.ownerId === '716262446700593152' ? 'Harsh (Founder)' : 'Team Member'),
        avatar: userObj?.displayAvatarURL?.({ dynamic: true }) || null
      };
    });

    // Registered Commands Array
    const commandsList = [];
    const cmdsSource = (typeof commandsInput === 'function' ? commandsInput() : commandsInput) || txtcommands;
    if (cmdsSource && typeof cmdsSource.values === 'function') {
      const uniqueNames = new Set();
      for (const cmd of cmdsSource.values()) {
        if (!cmd?.name || uniqueNames.has(cmd.name.toLowerCase())) continue;
        uniqueNames.add(cmd.name.toLowerCase());
        commandsList.push({
          name: cmd.name,
          category: cmd.category || 'General',
          aliases: cmd.aliases || [],
          cooldown: cmd.cooldown || 0,
          description: cmd.description || 'No description.'
        });
      }
    }
    commandsList.sort((a, b) => a.name.localeCompare(b.name));

    const result = {
      bot: botData,
      system: systemData,
      database: {
        mongo: {
          connected: isMongoConnected,
          state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoState] || 'unknown'
        },
        redis: {
          connected: isRedisConnected,
          status: isRedisConnected ? 'ready' : 'offline'
        }
      },
      overview: {
        serverCount,
        totalMembers,
        todayCommands: overview.todayCommands || 0,
        monthCommandsTotal: overview.monthCommandsTotal || 0,
        alltimeCommandsTotal: overview.alltimeCommandsTotal || 0,
        todayActiveUsers: overview.todayActiveUsers || 0,
        uptimeSeconds: Math.floor(process.uptime())
      },
      topCommandsToday: analytics.topCommandsToday || [],
      topCommandsAlltime: analytics.topCommandsAlltime || [],
      topUsersToday: analytics.topUsersToday || [],
      topUsersAlltime: analytics.topUsersAlltime || [],
      topGuildsToday: analytics.topGuildsToday || [],
      topGuildsAlltime: analytics.topGuildsAlltime || [],
      servers: serversList,
      owners: resolvedOwners,
      commands: commandsList,
      logs: getDashboardLogs({ limit: 100 }),
      generatedAt: now
    };

    _cachedTelemetry = result;
    _cachedTelemetryTime = now;
    return result;
  } catch (err) {
    console.error('[Dashboard] Error compiling telemetry data:', err);
    return {
      error: err.message,
      bot: { status: 'DEGRADED', ping: 0 },
      overview: { serverCount: 0, totalMembers: 0, todayCommands: 0 },
      logs: getDashboardLogs({ limit: 50 })
    };
  }
}

/**
 * Configure Express application with telemetry endpoints and static UI dashboard.
 */
export function setupDashboard(app, client, redisClient, commandsInput = null) {
  // 1. Static HTML Operational Dashboard
  app.get('/', async (req, res) => {
    try {
      const data = await getTelemetryData(client, redisClient, commandsInput);
      const html = renderDashboardHtml(data);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      console.error('[Dashboard] Render Error:', err);
      return res.status(500).send('<h3>Error loading Kasiko Mission Control Dashboard</h3><pre>' + err.stack + '</pre>');
    }
  });

  // 2. Real-time Telemetry JSON API
  app.get('/api/stats', async (req, res) => {
    try {
      const data = await getTelemetryData(client, redisClient, commandsInput);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. Log Stream API (with filtering and pagination)
  app.get('/api/logs', (req, res) => {
    const { level, category, search, limit } = req.query;
    const logs = getDashboardLogs({
      level,
      category,
      search,
      limit: limit ? parseInt(limit, 10) : 100
    });
    return res.json({ count: logs.length, logs });
  });

  // 4. Clear Log Buffer API
  app.post('/api/logs/clear', (req, res) => {
    clearDashboardLogs();
    addDashboardLog('INFO', 'DASHBOARD', 'Log console cleared by operator.');
    return res.json({ success: true, message: 'Logs cleared.' });
  });

  // 5. Health Check API
  app.get('/api/health', (req, res) => {
    const mongoConnected = mongoose.connection.readyState === 1;
    const isReady = !!client?.isReady?.();
    return res.json({
      status: isReady && mongoConnected ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      ping: client?.ws?.ping || 0,
      timestamp: new Date().toISOString()
    });
  });

  console.log('[Dashboard] ✅ Kasiko Mission Control Dashboard router mounted successfully.');
}

export default setupDashboard;
