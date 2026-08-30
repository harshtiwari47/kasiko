/**
 * Static HTML & Client-side script renderer for Kasiko Operations Dashboard.
 * Strictly adheres to high-density, cohesive dark technical aesthetic without generic fluff.
 */

export function renderDashboardHtml(initialData) {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KASIKO // Mission Control & Operations Telemetry</title>
  <link rel="icon" type="image/png" href="https://harshtiwari47.github.io/kasiko-public/images/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-root: #080a0f;
      --bg-surface: #0e121a;
      --bg-elevated: #131824;
      --bg-highlight: #182030;
      --border-subtle: #1c2436;
      --border-strong: #28354d;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-green: #10b981;
      --accent-green-dim: rgba(16, 185, 129, 0.12);
      --accent-amber: #f59e0b;
      --accent-amber-dim: rgba(245, 158, 11, 0.12);
      --accent-red: #ef4444;
      --accent-red-dim: rgba(239, 68, 68, 0.12);
      --accent-cyan: #06b6d4;
      --accent-cyan-dim: rgba(6, 182, 212, 0.12);
      --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-root);
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.5;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* Top Global Telemetry Header */
    .top-header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand-cluster {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-beacon {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      color: var(--accent-green);
      background: var(--accent-green-dim);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 3px 8px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 8px var(--accent-green);
      animation: pulse-dot 2s infinite ease-in-out;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .brand-title {
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-version {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
      padding: 1px 6px;
      border-radius: 2px;
    }

    .quick-vitals {
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: var(--font-mono);
      font-size: 11px;
    }

    .vital-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      padding: 4px 10px;
      border-radius: 3px;
    }

    .vital-val {
      color: var(--text-primary);
      font-weight: 600;
    }

    .refresh-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: var(--text-secondary);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      padding: 4px 10px;
      border-radius: 3px;
      transition: all 0.15s ease;
      user-select: none;
    }

    .refresh-pill:hover {
      border-color: var(--text-muted);
      color: var(--text-primary);
    }

    .refresh-pill.active {
      border-color: rgba(16, 185, 129, 0.35);
      color: var(--accent-green);
    }

    /* Sub-Navigation Bar */
    .nav-bar {
      background: var(--bg-root);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 2px;
      overflow-x: auto;
    }

    .nav-tab {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 12px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .nav-tab:hover {
      color: var(--text-secondary);
      background: var(--bg-surface);
    }

    .nav-tab.active {
      color: var(--accent-green);
      border-bottom-color: var(--accent-green);
      background: var(--bg-surface);
    }

    .nav-count {
      font-size: 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 1px 5px;
      border-radius: 2px;
    }

    .nav-tab.active .nav-count {
      color: var(--accent-green);
      border-color: rgba(16, 185, 129, 0.3);
    }

    /* Main Container & Layout */
    .main-content {
      padding: 20px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .tab-view {
      display: none;
    }

    .tab-view.active {
      display: block;
    }

    /* High-Density KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      padding: 14px 16px;
      position: relative;
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .kpi-label {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .kpi-tag {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 2px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }

    .kpi-value {
      font-family: var(--font-mono);
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .kpi-footer {
      font-size: 11px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .kpi-subval {
      font-family: var(--font-mono);
      color: var(--text-muted);
    }

    /* Structured Section Grid */
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 1100px) {
      .section-grid {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      overflow: hidden;
    }

    .panel-header {
      padding: 10px 16px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .panel-title {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-body {
      padding: 14px 16px;
    }

    /* Compact Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table th {
      background: var(--bg-elevated);
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-subtle);
      border-top: 1px solid var(--border-subtle);
    }

    .data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }

    .data-table tr:hover td {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }

    .rank-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 2px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      display: inline-block;
      min-width: 26px;
      text-align: center;
    }

    .rank-badge.top-1 {
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.1);
    }

    .rank-badge.top-2 {
      color: #cbd5e1;
      border-color: rgba(203, 213, 225, 0.3);
    }

    .rank-badge.top-3 {
      color: #b45309;
      border-color: rgba(180, 83, 9, 0.3);
    }

    .bar-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .bar-bg {
      flex: 1;
      height: 6px;
      background: var(--bg-elevated);
      border-radius: 1px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .bar-fill {
      height: 100%;
      background: var(--accent-green);
      border-radius: 1px;
    }

    .bar-fill.cyan {
      background: var(--accent-cyan);
    }

    .bar-fill.amber {
      background: var(--accent-amber);
    }

    /* Terminal Log Console */
    .terminal-container {
      background: #06070a;
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      height: 650px;
    }

    .terminal-toolbar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-btn {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      padding: 3px 8px;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.1s ease;
    }

    .filter-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .filter-btn.active {
      color: var(--text-primary);
      background: var(--bg-highlight);
      border-color: var(--text-secondary);
    }

    .filter-btn.err.active {
      color: var(--accent-red);
      border-color: rgba(239, 68, 68, 0.4);
      background: var(--accent-red-dim);
    }

    .filter-btn.warn.active {
      color: var(--accent-amber);
      border-color: rgba(245, 158, 11, 0.4);
      background: var(--accent-amber-dim);
    }

    .filter-btn.cmd.active {
      color: var(--accent-cyan);
      border-color: rgba(6, 182, 212, 0.4);
      background: var(--accent-cyan-dim);
    }

    .search-input {
      background: var(--bg-root);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 2px;
      outline: none;
      width: 200px;
      transition: border-color 0.15s ease;
    }

    .search-input:focus {
      border-color: var(--accent-green);
    }

    .action-btn {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 4px 8px;
      border-radius: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .terminal-body {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      font-family: var(--font-mono);
      font-size: 11.5px;
      line-height: 1.6;
    }

    .log-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 2px 4px;
      border-radius: 2px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);
    }

    .log-row:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .log-time {
      color: var(--text-muted);
      font-size: 10.5px;
      white-space: nowrap;
      min-width: 65px;
    }

    .log-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 2px;
      min-width: 45px;
      text-align: center;
      text-transform: uppercase;
    }

    .log-badge.INFO {
      color: var(--accent-green);
      background: var(--accent-green-dim);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .log-badge.WARN {
      color: var(--accent-amber);
      background: var(--accent-amber-dim);
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    .log-badge.ERROR {
      color: var(--accent-red);
      background: var(--accent-red-dim);
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .log-badge.CMD {
      color: var(--accent-cyan);
      background: var(--accent-cyan-dim);
      border: 1px solid rgba(6, 182, 212, 0.25);
    }

    .log-category {
      color: var(--text-muted);
      font-size: 10.5px;
      min-width: 80px;
    }

    .log-msg {
      color: var(--text-secondary);
      flex: 1;
      word-break: break-all;
    }

    .log-row.ERROR .log-msg {
      color: #fca5a5;
    }

    .log-row.WARN .log-msg {
      color: #fde68a;
    }

    .log-row.CMD .log-msg {
      color: #a5f3fc;
    }

    /* Stack list item */
    .stack-item {
      padding: 10px 0;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stack-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .stack-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stack-title {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 12px;
    }

    .stack-sub {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
    }

    .state-pill {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 2px;
      display: flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
    }

    .state-pill.online {
      color: var(--accent-green);
      background: var(--accent-green-dim);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .state-pill.offline {
      color: var(--accent-red);
      background: var(--accent-red-dim);
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .server-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: var(--bg-elevated);
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
      object-fit: cover;
      border: 1px solid var(--border-subtle);
    }

    .code-tag {
      font-family: var(--font-mono);
      font-size: 11px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      padding: 2px 6px;
      border-radius: 2px;
      color: var(--text-primary);
      cursor: pointer;
      user-select: all;
    }

    .code-tag:hover {
      border-color: var(--text-muted);
    }

    /* Tier Badges */
    .tier-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 2px;
      letter-spacing: 0.05em;
      display: inline-block;
      text-transform: uppercase;
    }

    .tier-founder {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }

    .tier-co_owner {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }

    .tier-admin {
      background: rgba(6, 182, 212, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(6, 182, 212, 0.35);
    }

    .tier-staff {
      background: rgba(148, 163, 184, 0.12);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .tier-specialist {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.35);
    }

    .table-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .select-control {
      background: var(--bg-root);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 2px;
      outline: none;
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg-root);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--border-strong);
      border-radius: 2px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }
  </style>
</head>
<body>

  <!-- Top Global Telemetry Header -->
  <header class="top-header">
    <div class="brand-cluster">
      <div class="status-beacon">
        <div class="status-dot"></div>
        <span id="header-status">OPERATIONAL</span>
      </div>
      <div class="brand-title">
        <span>KASIKO OS</span>
        <span class="brand-version" id="header-version">v2.4.0</span>
      </div>
    </div>

    <div class="quick-vitals">
      <div class="vital-item">
        <span class="vital-label">PING:</span>
        <span class="vital-val" id="header-ping">-- ms</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">UPTIME:</span>
        <span class="vital-val" id="header-uptime">--</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">RAM (RSS):</span>
        <span class="vital-val" id="header-ram">-- MB</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">SHARDS:</span>
        <span class="vital-val" id="header-shard">0 / 1</span>
      </div>
      <div class="refresh-pill active" id="btn-refresh-toggle" onclick="toggleAutoRefresh()">
        <span id="refresh-indicator">● AUTO (5s)</span>
      </div>
    </div>
  </header>

  <!-- Segmented Sub-Navigation Bar -->
  <nav class="nav-bar">
    <button class="nav-tab active" onclick="switchTab('overview')">
      01 // TELEMETRY & VITALS
    </button>
    <button class="nav-tab" onclick="switchTab('logs')">
      02 // SYSTEM LOG STREAM <span class="nav-count" id="nav-logs-count">0</span>
    </button>
    <button class="nav-tab" onclick="switchTab('servers')">
      03 // CONNECTED GUILDS <span class="nav-count" id="nav-servers-count">0</span>
    </button>
    <button class="nav-tab" onclick="switchTab('owners')">
      04 // MANAGEMENT TEAM <span class="nav-count" id="nav-owners-count">0</span>
    </button>
    <button class="nav-tab" onclick="switchTab('commands')">
      05 // COMMAND DIRECTORY <span class="nav-count" id="nav-commands-count">0</span>
    </button>
  </nav>

  <!-- Main Container -->
  <main class="main-content">

    <!-- TAB 1: OVERVIEW & TELEMETRY -->
    <div id="tab-overview" class="tab-view active">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">01 // GUILD NETWORK</span>
            <span class="kpi-tag" id="kpi-active-guilds">Active</span>
          </div>
          <div class="kpi-value" id="kpi-total-servers">0</div>
          <div class="kpi-footer">
            <span>AUDIENCE REACH:</span>
            <span class="kpi-subval" id="kpi-total-members">0 users</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">02 // 24H EXECUTIONS</span>
            <span class="kpi-tag" id="kpi-active-users">Today</span>
          </div>
          <div class="kpi-value" id="kpi-today-commands">0</div>
          <div class="kpi-footer">
            <span>ACTIVE TRADERS:</span>
            <span class="kpi-subval" id="kpi-today-users-count">0 accounts</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">03 // MONTH VOLUME</span>
            <span class="kpi-tag">MTD</span>
          </div>
          <div class="kpi-value" id="kpi-month-commands">0</div>
          <div class="kpi-footer">
            <span>ALL-TIME RUNS:</span>
            <span class="kpi-subval" id="kpi-alltime-commands">0</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">04 // HEAP ALLOCATION</span>
            <span class="kpi-tag" id="kpi-heap-percent">--%</span>
          </div>
          <div class="kpi-value" id="kpi-heap-used">0 MB</div>
          <div class="kpi-footer">
            <span>NODE RUNTIME:</span>
            <span class="kpi-subval" id="kpi-node-ver">Node.js</span>
          </div>
        </div>
      </div>

      <div class="section-grid">
        <!-- Top Commands Leaderboard -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">⚡ COMMAND LEADERBOARD</span>
            <div class="panel-actions">
              <button class="filter-btn active" id="btn-cmd-today" onclick="switchCmdPeriod('today')">TODAY</button>
              <button class="filter-btn" id="btn-cmd-alltime" onclick="switchCmdPeriod('alltime')">ALL-TIME</button>
            </div>
          </div>
          <div class="panel-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 50px;">RANK</th>
                  <th style="width: 140px;">COMMAND</th>
                  <th>EXECUTION VOLUME</th>
                  <th style="width: 90px; text-align: right;">COUNT</th>
                </tr>
              </thead>
              <tbody id="top-commands-tbody">
                <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading telemetry metrics...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Infrastructure & Health Stack -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">🛡️ INFRASTRUCTURE STACK</span>
          </div>
          <div class="panel-body">
            <div class="stack-item">
              <div class="stack-meta">
                <span class="stack-title">MongoDB Atlas Cluster</span>
                <span class="stack-sub">Single Source of Truth DB</span>
              </div>
              <span class="state-pill online" id="db-mongo-status">● CONNECTED</span>
            </div>

            <div class="stack-item">
              <div class="stack-meta">
                <span class="stack-title">Redis In-Memory Engine</span>
                <span class="stack-sub">Sub-millisecond Session & Rate Limiter</span>
              </div>
              <span class="state-pill online" id="db-redis-status">● CONNECTED</span>
            </div>

            <div class="stack-item">
              <div class="stack-meta">
                <span class="stack-title">Cron Schedulers</span>
                <span class="stack-sub">Reminders, StatsSync, Giveaways</span>
              </div>
              <span class="state-pill online">● 3/3 ACTIVE</span>
            </div>

            <div class="stack-item">
              <div class="stack-meta">
                <span class="stack-title">Anti-Crash Sentinel</span>
                <span class="stack-sub">Process uncaught exception protection</span>
              </div>
              <span class="state-pill online">● ARMED</span>
            </div>

            <div class="stack-item">
              <div class="stack-meta">
                <span class="stack-title">WebSocket Gateway</span>
                <span class="stack-sub">Discord Gateway v10 Connection</span>
              </div>
              <span class="state-pill online" id="gw-latency-status">● 0ms LATENCY</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: SYSTEM LOG STREAM -->
    <div id="tab-logs" class="tab-view">
      <div class="terminal-container">
        <div class="terminal-toolbar">
          <div class="filter-group">
            <button class="filter-btn active" onclick="setLogFilter('ALL')">ALL</button>
            <button class="filter-btn err" onclick="setLogFilter('ERROR')">ERROR</button>
            <button class="filter-btn warn" onclick="setLogFilter('WARN')">WARN</button>
            <button class="filter-btn cmd" onclick="setLogFilter('CMD')">CMD</button>
            <button class="filter-btn" onclick="setLogFilter('INFO')">INFO</button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="text" id="log-search-input" class="search-input" placeholder="Filter logs (regex/term)..." oninput="renderFilteredLogs()">
            <button class="action-btn" id="btn-autoscroll" onclick="toggleAutoScroll()">AUTO-SCROLL: ON</button>
            <button class="action-btn" onclick="clearLogView()">CLEAR VIEW</button>
            <button class="action-btn" onclick="exportLogsJson()">EXPORT JSON</button>
          </div>
        </div>

        <div class="terminal-body" id="terminal-log-body">
          <div style="color: var(--text-muted); padding: 10px;">Awaiting incoming telemetry streams...</div>
        </div>
      </div>
    </div>

    <!-- TAB 3: CONNECTED SERVERS -->
    <div id="tab-servers" class="tab-view">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">🌐 CONNECTED DISCORD GUILDS</span>
          <span class="nav-count" id="servers-counter-label">0 Guilds Total</span>
        </div>
        <div class="panel-body">
          <div class="table-controls">
            <input type="text" id="server-search-input" class="search-input" style="width: 280px;" placeholder="Search guild name or ID..." oninput="renderServerList()">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--text-muted); font-size: 11px; font-family: var(--font-mono);">SORT BY:</span>
              <select id="server-sort-select" class="select-control" onchange="renderServerList()">
                <option value="members-desc">Members (Highest First)</option>
                <option value="members-asc">Members (Lowest First)</option>
                <option value="name-asc">Server Name (A-Z)</option>
                <option value="joined-desc">Recently Joined</option>
              </select>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>SERVER NAME</th>
                <th style="width: 180px;">GUILD ID</th>
                <th style="width: 120px; text-align: right;">MEMBERS</th>
                <th style="width: 140px;">JOINED DATE</th>
              </tr>
            </thead>
            <tbody id="servers-tbody">
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Fetching connected guild records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: MANAGEMENT TEAM -->
    <div id="tab-owners" class="tab-view">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">👑 SYSTEM OPERATORS & MANAGEMENT HIERARCHY</span>
          <span class="nav-count" id="owners-counter-label">0 Active</span>
        </div>
        <div class="panel-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 160px;">TIER / ROLE</th>
                <th>OPERATOR IDENTIFIER</th>
                <th style="width: 200px;">USER ID</th>
                <th style="width: 130px;">AUTHORITY</th>
                <th style="width: 140px;">APPOINTED</th>
              </tr>
            </thead>
            <tbody id="owners-tbody">
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading authority hierarchy...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: COMMAND DIRECTORY -->
    <div id="tab-commands" class="tab-view">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">📚 REGISTERED COMMAND DIRECTORY</span>
          <span class="nav-count" id="commands-counter-label">0 Commands</span>
        </div>
        <div class="panel-body">
          <div class="table-controls">
            <input type="text" id="cmd-search-input" class="search-input" style="width: 280px;" placeholder="Search commands, aliases, or category..." oninput="renderCommandList()">
            <select id="cmd-category-select" class="select-control" onchange="renderCommandList()">
              <option value="ALL">All Categories</option>
            </select>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 140px;">CATEGORY</th>
                <th style="width: 130px;">NAME</th>
                <th style="width: 140px;">ALIASES</th>
                <th style="width: 90px;">COOLDOWN</th>
                <th>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody id="commands-tbody">
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading command directory...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>

  <!-- Client-side Telemetry Engine -->
  <script>
    let globalData = ${JSON.stringify(initialData || {})};
    let currentTab = 'overview';
    let currentCmdPeriod = 'today';
    let currentLogFilter = 'ALL';
    let autoRefreshEnabled = true;
    let autoRefreshTimer = null;
    let autoScrollLogs = true;

    function switchTab(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

      const targetTab = document.getElementById('tab-' + tabId);
      if (targetTab) targetTab.classList.add('active');

      const tabs = document.querySelectorAll('.nav-tab');
      const indexMap = { overview: 0, logs: 1, servers: 2, owners: 3, commands: 4 };
      if (tabs[indexMap[tabId]]) tabs[indexMap[tabId]].classList.add('active');

      if (tabId === 'logs' && autoScrollLogs) {
        scrollLogsToBottom();
      }
    }

    function switchCmdPeriod(period) {
      currentCmdPeriod = period;
      document.getElementById('btn-cmd-today').classList.toggle('active', period === 'today');
      document.getElementById('btn-cmd-alltime').classList.toggle('active', period === 'alltime');
      renderTopCommands();
    }

    function setLogFilter(level) {
      currentLogFilter = level;
      document.querySelectorAll('.filter-group .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === level);
      });
      renderFilteredLogs();
    }

    function toggleAutoRefresh() {
      autoRefreshEnabled = !autoRefreshEnabled;
      const pill = document.getElementById('btn-refresh-toggle');
      const ind = document.getElementById('refresh-indicator');
      if (autoRefreshEnabled) {
        pill.classList.add('active');
        ind.textContent = '● AUTO (5s)';
        startAutoRefresh();
      } else {
        pill.classList.remove('active');
        ind.textContent = '○ PAUSED';
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      }
    }

    function toggleAutoScroll() {
      autoScrollLogs = !autoScrollLogs;
      document.getElementById('btn-autoscroll').textContent = 'AUTO-SCROLL: ' + (autoScrollLogs ? 'ON' : 'OFF');
      if (autoScrollLogs) scrollLogsToBottom();
    }

    function scrollLogsToBottom() {
      const el = document.getElementById('terminal-log-body');
      if (el) el.scrollTop = el.scrollHeight;
    }

    function clearLogView() {
      document.getElementById('terminal-log-body').innerHTML = '<div style="color: var(--text-muted); padding: 10px;">Console buffer cleared. Waiting for new events...</div>';
    }

    function exportLogsJson() {
      const logs = globalData.logs || [];
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kasiko-logs-' + new Date().toISOString().slice(0, 19) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    function formatNumber(n) {
      if (n === null || n === undefined || isNaN(n)) return '0';
      return Number(n).toLocaleString();
    }

    function formatUptime(seconds) {
      if (!seconds || seconds <= 0) return '0s';
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
      if (h > 0) return h + 'h ' + m + 'm ' + s + 's';
      return m + 'm ' + s + 's';
    }

    // Apply Realtime Data to UI
    function updateUI(data) {
      if (!data) return;
      globalData = data;

      const bot = data.bot || {};
      const ov = data.overview || {};
      const sys = data.system || {};
      const mem = sys.memory || {};

      // Headers
      document.getElementById('header-ping').textContent = (bot.ping || 0) + ' ms';
      document.getElementById('header-uptime').textContent = formatUptime(ov.uptimeSeconds);
      document.getElementById('header-ram').textContent = (mem.rssMb || '0') + ' MB';
      document.getElementById('header-shard').textContent = (bot.shardId || 0) + ' / ' + (bot.totalShards || 1);
      if (bot.tag) document.getElementById('header-version').textContent = bot.tag;

      // KPIs
      document.getElementById('kpi-total-servers').textContent = formatNumber(ov.serverCount);
      document.getElementById('kpi-total-members').textContent = formatNumber(ov.totalMembers) + ' users';
      document.getElementById('kpi-today-commands').textContent = formatNumber(ov.todayCommands);
      document.getElementById('kpi-today-users-count').textContent = formatNumber(ov.todayActiveUsers) + ' unique';
      document.getElementById('kpi-month-commands').textContent = formatNumber(ov.monthCommandsTotal);
      document.getElementById('kpi-alltime-commands').textContent = formatNumber(ov.alltimeCommandsTotal);
      document.getElementById('kpi-heap-used').textContent = (mem.heapUsedMb || '0') + ' MB';

      const heapPct = mem.heapTotalMb ? Math.round((Number(mem.heapUsedMb) / Number(mem.heapTotalMb)) * 100) : 0;
      document.getElementById('kpi-heap-percent').textContent = heapPct + '% heap';
      document.getElementById('kpi-node-ver').textContent = 'Node ' + (sys.nodeVersion || 'v20+');

      // Database Status
      const mongoEl = document.getElementById('db-mongo-status');
      if (data.database?.mongo?.connected) {
        mongoEl.className = 'state-pill online';
        mongoEl.textContent = '● CONNECTED';
      } else {
        mongoEl.className = 'state-pill offline';
        mongoEl.textContent = '○ DISCONNECTED';
      }

      const redisEl = document.getElementById('db-redis-status');
      if (data.database?.redis?.connected) {
        redisEl.className = 'state-pill online';
        redisEl.textContent = '● CONNECTED';
      } else {
        redisEl.className = 'state-pill offline';
        redisEl.textContent = '○ DISCONNECTED';
      }

      const gwEl = document.getElementById('gw-latency-status');
      gwEl.textContent = '● ' + (bot.ping || 0) + 'ms LATENCY';

      // Counters
      document.getElementById('nav-logs-count').textContent = (data.logs || []).length;
      document.getElementById('nav-servers-count').textContent = (data.servers || []).length;
      document.getElementById('nav-owners-count').textContent = (data.owners || []).length;
      document.getElementById('nav-commands-count').textContent = (data.commands || []).length;

      document.getElementById('servers-counter-label').textContent = (data.servers || []).length + ' Guilds Total';
      document.getElementById('owners-counter-label').textContent = (data.owners || []).length + ' Active';
      document.getElementById('commands-counter-label').textContent = (data.commands || []).length + ' Registered';

      // Render Sub-Views
      renderTopCommands();
      renderFilteredLogs();
      renderServerList();
      renderOwnersList();
      renderCommandList();
    }

    function renderTopCommands() {
      const tbody = document.getElementById('top-commands-tbody');
      const list = currentCmdPeriod === 'today' ? (globalData.topCommandsToday || []) : (globalData.topCommandsAlltime || []);

      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">No command activity recorded yet for this period.</td></tr>';
        return;
      }

      const maxCount = Math.max(...list.map(i => i.count), 1);
      let html = '';
      list.slice(0, 10).forEach((item, idx) => {
        const pct = Math.round((item.count / maxCount) * 100);
        const rankClass = idx === 0 ? 'top-1' : (idx === 1 ? 'top-2' : (idx === 2 ? 'top-3' : ''));
        const barClass = idx === 0 ? '' : (idx % 2 === 0 ? 'cyan' : 'amber');

        html += '<tr>' +
          '<td><span class="rank-badge ' + rankClass + '">#' + (idx + 1) + '</span></td>' +
          '<td><span class="code-tag">kas ' + item.name + '</span></td>' +
          '<td>' +
            '<div class="bar-wrapper">' +
              '<div class="bar-bg"><div class="bar-fill ' + barClass + '" style="width: ' + pct + '%;"></div></div>' +
              '<span style="font-family: var(--font-mono); font-size: 10.5px; color: var(--text-muted); width: 35px;">' + pct + '%</span>' +
            '</div>' +
          '</td>' +
          '<td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">' + formatNumber(item.count) + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function renderFilteredLogs() {
      const container = document.getElementById('terminal-log-body');
      const search = (document.getElementById('log-search-input')?.value || '').toLowerCase().trim();
      let logs = globalData.logs || [];

      if (currentLogFilter !== 'ALL') {
        logs = logs.filter(l => l.level === currentLogFilter);
      }

      if (search) {
        logs = logs.filter(l =>
          l.message.toLowerCase().includes(search) ||
          l.category.toLowerCase().includes(search) ||
          (l.meta && JSON.stringify(l.meta).toLowerCase().includes(search))
        );
      }

      if (logs.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 10px;">No log entries match the current filter.</div>';
        return;
      }

      let html = '';
      logs.forEach(l => {
        html += '<div class="log-row ' + l.level + '">' +
          '<span class="log-time">' + (l.timeFormatted || l.timestamp.slice(11, 19)) + '</span>' +
          '<span class="log-badge ' + l.level + '">' + l.level + '</span>' +
          '<span class="log-category">[' + l.category + ']</span>' +
          '<span class="log-msg">' + escapeHtml(l.message) + '</span>' +
        '</div>';
      });

      container.innerHTML = html;
      if (autoScrollLogs) scrollLogsToBottom();
    }

    function renderServerList() {
      const tbody = document.getElementById('servers-tbody');
      const search = (document.getElementById('server-search-input')?.value || '').toLowerCase().trim();
      const sortBy = document.getElementById('server-sort-select')?.value || 'members-desc';
      let servers = [...(globalData.servers || [])];

      if (search) {
        servers = servers.filter(s =>
          s.name.toLowerCase().includes(search) ||
          s.id.toLowerCase().includes(search)
        );
      }

      servers.sort((a, b) => {
        if (sortBy === 'members-desc') return (b.memberCount || 0) - (a.memberCount || 0);
        if (sortBy === 'members-asc') return (a.memberCount || 0) - (b.memberCount || 0);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'joined-desc') return new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0);
        return 0;
      });

      if (servers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No guilds match your search query.</td></tr>';
        return;
      }

      let html = '';
      servers.forEach((srv, idx) => {
        const iconHtml = srv.icon
          ? '<img src="' + srv.icon + '" class="server-icon" alt="">'
          : '<div class="server-icon" style="display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">' + (srv.name.slice(0, 1)) + '</div>';

        html += '<tr>' +
          '<td><span class="rank-badge">#' + (idx + 1) + '</span></td>' +
          '<td style="font-weight: 600; color: var(--text-primary);">' + iconHtml + escapeHtml(srv.name) + '</td>' +
          '<td><span class="code-tag">' + srv.id + '</span></td>' +
          '<td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: var(--accent-green);">' + formatNumber(srv.memberCount) + '</td>' +
          '<td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">' + (srv.joinedAt ? srv.joinedAt.slice(0, 10) : 'N/A') + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function renderOwnersList() {
      const tbody = document.getElementById('owners-tbody');
      const owners = globalData.owners || [];

      if (owners.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No operators found in OwnerManager.</td></tr>';
        return;
      }

      let html = '';
      owners.forEach(o => {
        const tierClass = 'tier-' + (o.role || 'staff');
        const roleLabel = (o.badge ? o.badge + ' ' : '') + (o.tierLabel || o.roleName || 'Operator');

        html += '<tr>' +
          '<td><span class="tier-badge ' + tierClass + '">' + roleLabel + '</span></td>' +
          '<td style="font-weight: 600; color: var(--text-primary);">' + escapeHtml(o.username || o.name || 'Kasiko Operator') + '</td>' +
          '<td><span class="code-tag">' + o.ownerId + '</span></td>' +
          '<td style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-green);">LEVEL ' + (o.level || 0) + ' (T' + (o.tier || 5) + ')</td>' +
          '<td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">' + (o.dateJoined ? String(o.dateJoined).slice(0, 10) : '2024-01-01') + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function renderCommandList() {
      const tbody = document.getElementById('commands-tbody');
      const search = (document.getElementById('cmd-search-input')?.value || '').toLowerCase().trim();
      const catFilter = document.getElementById('cmd-category-select')?.value || 'ALL';
      const cmds = globalData.commands || [];

      // Populate categories dropdown once
      const catSelect = document.getElementById('cmd-category-select');
      if (catSelect && catSelect.children.length <= 1) {
        const categories = [...new Set(cmds.map(c => c.category || 'General'))].sort();
        categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          catSelect.appendChild(opt);
        });
      }

      let filtered = cmds;
      if (catFilter !== 'ALL') {
        filtered = filtered.filter(c => (c.category || 'General') === catFilter);
      }

      if (search) {
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(search) ||
          (c.description && c.description.toLowerCase().includes(search)) ||
          (c.aliases && c.aliases.some(a => a.toLowerCase().includes(search))) ||
          (c.category && c.category.toLowerCase().includes(search))
        );
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No commands match criteria.</td></tr>';
        return;
      }

      let html = '';
      filtered.forEach(c => {
        const aliasStr = (c.aliases && c.aliases.length > 0) ? c.aliases.map(a => '<span class="code-tag">' + a + '</span>').join(' ') : '<span style="color:var(--text-muted);">-</span>';
        const cooldownStr = c.cooldown ? (c.cooldown >= 1000 ? (c.cooldown / 1000) + 's' : c.cooldown + 'ms') : '0s';

        html += '<tr>' +
          '<td style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">' + escapeHtml(c.category || 'General') + '</td>' +
          '<td><span class="code-tag" style="color: var(--accent-green); font-weight: 700;">kas ' + escapeHtml(c.name) + '</span></td>' +
          '<td>' + aliasStr + '</td>' +
          '<td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">' + cooldownStr + '</td>' +
          '<td style="color: var(--text-secondary); font-size: 11.5px;">' + escapeHtml(c.description || 'No description provided.') + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Polling Fetcher
    async function fetchTelemetry() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          updateUI(data);
        }
      } catch (err) {
        console.warn('[Telemetry] Telemetry poll failed:', err);
      }
    }

    function startAutoRefresh() {
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      autoRefreshTimer = setInterval(fetchTelemetry, 5000);
    }

    // Initial render
    updateUI(globalData);
    startAutoRefresh();
  </script>
</body>
</html>`;
}
