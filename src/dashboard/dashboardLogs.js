/**
 * In-memory circular log buffer for the real-time operational dashboard.
 * Keeps the most recent 250 log events with timestamp, severity, and context.
 */

const MAX_LOGS = 120;
const logBuffer = [];

export function addDashboardLog(level, category, message, meta = null) {
  const timestamp = new Date().toISOString();
  const entry = {
    id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    timestamp,
    timeFormatted: timestamp.slice(11, 19),
    dateFormatted: timestamp.slice(0, 10),
    level: (level || 'INFO').toUpperCase(),
    category: (category || 'SYSTEM').toUpperCase(),
    message: typeof message === 'string' ? message : JSON.stringify(message),
    meta: meta || null
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }

  return entry;
}

export function getDashboardLogs(options = {}) {
  const { level, category, search, limit = 100 } = options;
  let results = [...logBuffer];

  if (level && level !== 'ALL') {
    results = results.filter(l => l.level === level.toUpperCase());
  }

  if (category && category !== 'ALL') {
    results = results.filter(l => l.category === category.toUpperCase());
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(l =>
      l.message.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      (l.meta && JSON.stringify(l.meta).toLowerCase().includes(q))
    );
  }

  return results.slice(-limit).reverse();
}

export function clearDashboardLogs() {
  logBuffer.length = 0;
}

// Seed initial startup logs
addDashboardLog('INFO', 'SYSTEM', 'Kasiko Core Engine initialized.');
addDashboardLog('INFO', 'DASHBOARD', 'Telemetry & Operations Dashboard service booted.');
