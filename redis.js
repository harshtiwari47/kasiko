import {
  createClient
} from 'redis';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({
      timestamp, level, message
    }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Environment Variable Validation
const redisUri = process.env.REDIS_URI;

// ── In-Memory Fallback TTL Store (Resilience Engine) ──────────────────────────
const _memKV = new Map(); // key -> { val: string, exp: number | null }
const _memHash = new Map(); // key -> Map<field, string>

// Periodic cleanup of expired fallback entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [k, item] of _memKV.entries()) {
    if (item.exp && item.exp <= now) {
      _memKV.delete(k);
    }
  }
}, 60000).unref();

function memGet(key) {
  const item = _memKV.get(key);
  if (!item) return null;
  if (item.exp && item.exp <= Date.now()) {
    _memKV.delete(key);
    return null;
  }
  return item.val;
}

function memSet(key, val, options = {}) {
  const now = Date.now();
  const existing = memGet(key);

  if (options.NX && existing !== null) return null;
  if (options.XX && existing === null) return null;

  let exp = null;
  if (options.EX) exp = now + (options.EX * 1000);
  else if (options.PX) exp = now + options.PX;

  _memKV.set(key, { val: String(val), exp });
  return 'OK';
}

function memDel(keys) {
  const arr = Array.isArray(keys) ? keys : [keys];
  let count = 0;
  for (const k of arr) {
    if (_memKV.delete(k)) count++;
    if (_memHash.delete(k)) count++;
  }
  return count;
}

function memIncr(key) {
  const cur = memGet(key);
  const next = (cur ? parseInt(cur, 10) || 0 : 0) + 1;
  const item = _memKV.get(key);
  _memKV.set(key, { val: String(next), exp: item ? item.exp : null });
  return next;
}

function memExpire(key, seconds) {
  const item = _memKV.get(key);
  if (!item) return 0;
  item.exp = Date.now() + (seconds * 1000);
  return 1;
}

function memTtl(key) {
  const item = _memKV.get(key);
  if (!item) return -2;
  if (!item.exp) return -1;
  const rem = Math.ceil((item.exp - Date.now()) / 1000);
  return rem > 0 ? rem : -2;
}

function memHSet(key, fieldOrObj, val) {
  let hMap = _memHash.get(key);
  if (!hMap) {
    hMap = new Map();
    _memHash.set(key, hMap);
  }
  if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
    for (const [f, v] of Object.entries(fieldOrObj)) {
      hMap.set(String(f), String(v));
    }
  } else {
    hMap.set(String(fieldOrObj), String(val));
  }
  return 1;
}

function memHGet(key, field) {
  const hMap = _memHash.get(key);
  if (!hMap) return null;
  return hMap.get(String(field)) ?? null;
}

function memHGetAll(key) {
  const hMap = _memHash.get(key);
  if (!hMap) return {};
  const obj = {};
  for (const [f, v] of hMap.entries()) {
    obj[f] = v;
  }
  return obj;
}

// ── Circuit Breaker & Connection Management ──────────────────────────────────
let _realClient = null;
let _circuitOpenUntil = 0;
let _lastErrorLogTime = 0;

function logThrottledWarning(msg, err) {
  const now = Date.now();
  if (now - _lastErrorLogTime > 60000) { // Log once per minute max
    logger.warn(`⚠️ [RedisFallback] ${msg}: ${err?.message || err}`);
    _lastErrorLogTime = now;
  }
}

function tripCircuit(err) {
  _circuitOpenUntil = Date.now() + 10000; // Trip for 10s on failure
  logThrottledWarning('Redis error encountered; using in-memory fallback', err);
}

if (redisUri) {
  try {
    _realClient = createClient({
      username: 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        port: parseInt(process.env.REDIS_PORT || '19353', 10),
        host: redisUri,
        keepAlive: true,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logThrottledWarning('Redis reconnect retries exhausted, switching to fallback', 'Exceeded retries');
            return 10000; // Retry every 10s in background
          }
          return Math.min(retries * 200, 3000);
        },
      },
    });

    _realClient.on('error', (err) => {
      tripCircuit(err);
    });
    _realClient.on('connect', () => logger.info('🔗 Redis client is connecting...'));
    _realClient.on('ready', () => {
      _circuitOpenUntil = 0;
      logger.info('✅ Redis client connected and ready.');
    });
    _realClient.on('reconnecting', (delay) => logger.warn(`🔄 Redis client reconnecting in ${delay}ms...`));
    _realClient.on('end', () => logger.info('🔌 Redis client disconnected (fallback active).'));

    // Safe non-blocking connection
    _realClient.connect().catch((err) => {
      logger.warn(`⚠️ Could not connect to Redis at startup: ${err.message}. Operating with in-memory fallback.`);
      tripCircuit(err);
    });
  } catch (err) {
    logger.warn(`⚠️ Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
    _realClient = null;
  }
} else {
  logger.warn('ℹ️ REDIS_URI not configured. Operating with high-speed in-memory store.');
}

// ── Resilient Proxy Client Export ────────────────────────────────────────────
const resilientRedisClient = {
  get isOpen() {
    return _realClient ? _realClient.isOpen : true;
  },

  get isReady() {
    return _realClient && _realClient.isReady && Date.now() > _circuitOpenUntil;
  },

  async get(key) {
    if (this.isReady) {
      try {
        return await _realClient.get(key);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return memGet(key);
  },

  async set(key, val, options = {}) {
    // Write to memory fallback first for instant consistency
    memSet(key, val, options);

    if (this.isReady) {
      try {
        return await _realClient.set(key, val, options);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return 'OK';
  },

  async setEx(key, seconds, val) {
    memSet(key, val, { EX: seconds });

    if (this.isReady) {
      try {
        return await _realClient.setEx(key, seconds, val);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return 'OK';
  },

  async del(keys) {
    memDel(keys);

    if (this.isReady) {
      try {
        return await _realClient.del(keys);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return 1;
  },

  async incr(key) {
    const memVal = memIncr(key);

    if (this.isReady) {
      try {
        return await _realClient.incr(key);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return memVal;
  },

  async expire(key, seconds) {
    memExpire(key, seconds);

    if (this.isReady) {
      try {
        return await _realClient.expire(key, seconds);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return 1;
  },

  async ttl(key) {
    if (this.isReady) {
      try {
        return await _realClient.ttl(key);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return memTtl(key);
  },

  async hSet(key, fieldOrObj, val) {
    memHSet(key, fieldOrObj, val);

    if (this.isReady) {
      try {
        return await _realClient.hSet(key, fieldOrObj, val);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return 1;
  },

  async hGet(key, field) {
    if (this.isReady) {
      try {
        return await _realClient.hGet(key, field);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return memHGet(key, field);
  },

  async hGetAll(key) {
    if (this.isReady) {
      try {
        return await _realClient.hGetAll(key);
      } catch (err) {
        tripCircuit(err);
      }
    }
    return memHGetAll(key);
  },

  on(event, handler) {
    if (_realClient) {
      _realClient.on(event, handler);
    }
  },

  async connect() {
    if (_realClient && !_realClient.isOpen) {
      try {
        await _realClient.connect();
      } catch (err) {
        tripCircuit(err);
      }
    }
  },

  async quit() {
    if (_realClient && _realClient.isOpen) {
      try {
        await _realClient.quit();
      } catch (err) {
        // ignore
      }
    }
  }
};

// Graceful Shutdown Handling
const shutdown = async () => {
  try {
    await resilientRedisClient.quit();
    logger.info('🛑 Redis client disconnected gracefully.');
  } catch (err) {
    logger.error(`❌ Error during Redis shutdown: ${err}`);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default resilientRedisClient;