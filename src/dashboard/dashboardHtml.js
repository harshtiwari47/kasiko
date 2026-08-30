/**
 * Clean, lightweight, professional HTML dashboard for Kasiko.
 * Built for high performance, readable terminology, and rich multi-dimensional leaderboards.
 */

export function renderDashboardHtml(initialData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kasiko Bot - Dashboard</title>
  <link rel="icon" type="image/png" href="https://harshtiwari47.github.io/kasiko-public/images/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-body: #0a0d14;
      --bg-card: #10141e;
      --bg-subtle: #161c2a;
      --border: #1e2638;
      --border-focus: #2d3a54;
      --text-main: #f1f5f9;
      --text-muted: #8b9bb4;
      --text-dim: #5c6b84;
      --green: #10b981;
      --green-bg: rgba(16, 185, 129, 0.12);
      --amber: #f59e0b;
      --amber-bg: rgba(245, 158, 11, 0.12);
      --red: #ef4444;
      --red-bg: rgba(239, 68, 68, 0.12);
      --blue: #38bdf8;
      --blue-bg: rgba(56, 189, 248, 0.12);
      --font-mono: 'JetBrains Mono', ui-monospace, monospace;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-body);
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.5;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* Top Navigation Header */
    .header {
      background-color: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-logo {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      background: var(--bg-subtle);
    }

    .brand-name {
      font-weight: 700;
      font-size: 14px;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      color: var(--green);
      background: var(--green-bg);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 2px 7px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green);
    }

    .vitals-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-mono);
      font-size: 11px;
    }

    .vital-pill {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: 4px;
    }

    .vital-pill b {
      color: var(--text-main);
    }

    .btn-refresh {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      color: var(--green);
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;
    }

    .btn-refresh:hover {
      border-color: var(--border-focus);
    }

    /* Tabs */
    .tabs-nav {
      background: var(--bg-body);
      border-bottom: 1px solid var(--border);
      padding: 0 20px;
      display: flex;
      gap: 2px;
      overflow-x: auto;
    }

    .tab-btn {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 11px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--text-main);
      background: var(--bg-card);
    }

    .tab-btn.active {
      color: var(--green);
      border-bottom-color: var(--green);
      background: var(--bg-card);
    }

    .tab-badge {
      font-size: 10px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 1px 5px;
      border-radius: 3px;
    }

    .tab-btn.active .tab-badge {
      color: var(--green);
      border-color: rgba(16, 185, 129, 0.3);
    }

    /* Layout */
    .main-wrap {
      padding: 16px 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .kpi-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 14px 16px;
    }

    .kpi-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }

    .kpi-num {
      font-family: var(--font-mono);
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .kpi-sub {
      font-size: 11px;
      color: var(--text-dim);
    }

    .kpi-sub b {
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    /* Content Split */
    .grid-split {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 14px;
      margin-bottom: 16px;
    }

    @media (max-width: 1000px) {
      .grid-split {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }

    .card-header {
      padding: 10px 14px;
      background: var(--bg-subtle);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-weight: 600;
      font-size: 12px;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-body {
      padding: 12px 14px;
    }

    /* Multi-Dimensional Leaderboard */
    .leaderboard-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-toggle {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-toggle:hover {
      color: var(--text-main);
      border-color: var(--border-focus);
    }

    .btn-toggle.active {
      color: var(--text-main);
      background: var(--bg-subtle);
      border-color: var(--text-muted);
      font-weight: 600;
    }

    /* Data Table */
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .table th {
      background: var(--bg-subtle);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 7px 10px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .table td {
      padding: 7px 10px;
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
    }

    .table tr:hover td {
      background: var(--bg-subtle);
      color: var(--text-main);
    }

    .rank {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      color: var(--text-dim);
      display: inline-block;
      min-width: 22px;
      text-align: center;
    }

    .rank-1 { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
    .rank-2 { color: #cbd5e1; border-color: rgba(203, 213, 225, 0.3); }
    .rank-3 { color: #b45309; border-color: rgba(180, 83, 9, 0.3); }

    .meter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meter-track {
      flex: 1;
      height: 6px;
      background: var(--bg-subtle);
      border-radius: 2px;
      overflow: hidden;
    }

    .meter-fill {
      height: 100%;
      background: var(--green);
      border-radius: 2px;
    }

    /* Terminal Logs */
    .log-box {
      background: #07090e;
      border: 1px solid var(--border);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      height: 600px;
    }

    .log-bar {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    .log-filters {
      display: flex;
      gap: 4px;
    }

    .filter-tag {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      padding: 2px 7px;
      border-radius: 3px;
      cursor: pointer;
    }

    .filter-tag.active {
      color: var(--text-main);
      background: var(--bg-body);
      border-color: var(--border-focus);
    }

    .filter-tag.err.active { color: var(--red); border-color: rgba(239, 68, 68, 0.4); }
    .filter-tag.warn.active { color: var(--amber); border-color: rgba(245, 158, 11, 0.4); }
    .filter-tag.cmd.active { color: var(--blue); border-color: rgba(56, 189, 248, 0.4); }

    .input-search {
      background: var(--bg-body);
      border: 1px solid var(--border);
      color: var(--text-main);
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      outline: none;
      width: 200px;
    }

    .input-search:focus {
      border-color: var(--green);
    }

    .log-stream {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1.55;
    }

    .log-item {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 2px 4px;
      border-radius: 2px;
    }

    .log-item:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .log-time { color: var(--text-dim); min-width: 60px; font-size: 10px; }
    .log-tag {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 2px;
      min-width: 40px;
      text-align: center;
    }

    .log-tag.INFO { color: var(--green); background: var(--green-bg); }
    .log-tag.WARN { color: var(--amber); background: var(--amber-bg); }
    .log-tag.ERROR { color: var(--red); background: var(--red-bg); }
    .log-tag.CMD { color: var(--blue); background: var(--blue-bg); }

    .log-text { color: var(--text-muted); flex: 1; word-break: break-all; }
    .log-item.ERROR .log-text { color: #fca5a5; }
    .log-item.WARN .log-text { color: #fde68a; }
    .log-item.CMD .log-text { color: #bae6fd; }

    /* Service row */
    .service-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }

    .service-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .code-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      padding: 1px 6px;
      border-radius: 3px;
      color: var(--text-main);
      display: inline-block;
    }

    .pill-green {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: var(--green);
      background: var(--green-bg);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 1px 6px;
      border-radius: 3px;
    }

    .pill-red {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: var(--red);
      background: var(--red-bg);
      border: 1px solid rgba(239, 68, 68, 0.25);
      padding: 1px 6px;
      border-radius: 3px;
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg-body); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header class="header">
    <div class="brand">
      <img src="https://harshtiwari47.github.io/kasiko-public/images/logo.png" class="brand-logo" alt="Logo">
      <div class="brand-name">
        <span>Kasiko</span>
        <div class="status-badge">
          <div class="status-dot"></div>
          <span id="bot-status">Online</span>
        </div>
      </div>
    </div>

    <div class="vitals-bar">
      <div class="vital-pill">Ping: <b id="vital-ping">-- ms</b></div>
      <div class="vital-pill">Uptime: <b id="vital-uptime">--</b></div>
      <div class="vital-pill">RAM: <b id="vital-ram">-- MB</b></div>
      <div class="vital-pill">Shards: <b id="vital-shard">0/1</b></div>
      <div class="btn-refresh" id="btn-refresh" onclick="toggleAutoRefresh()">Auto (5s)</div>
    </div>
  </header>

  <!-- Navigation Tabs -->
  <nav class="tabs-nav">
    <button class="tab-btn active" onclick="switchTab('overview')">
      Overview
    </button>
    <button class="tab-btn" onclick="switchTab('logs')">
      Live Logs <span class="tab-badge" id="badge-logs">0</span>
    </button>
    <button class="tab-btn" onclick="switchTab('servers')">
      Servers <span class="tab-badge" id="badge-servers">0</span>
    </button>
    <button class="tab-btn" onclick="switchTab('owners')">
      Team & Owners <span class="tab-badge" id="badge-owners">0</span>
    </button>
    <button class="tab-btn" onclick="switchTab('commands')">
      Commands <span class="tab-badge" id="badge-commands">0</span>
    </button>
  </nav>

  <!-- Main Content Wrap -->
  <main class="main-wrap">

    <!-- TAB 1: OVERVIEW -->
    <div id="pane-overview" class="tab-pane active">
      <div class="kpi-grid">
        <div class="kpi-box">
          <div class="kpi-title">Active Servers</div>
          <div class="kpi-num" id="num-servers">0</div>
          <div class="kpi-sub">Total Members: <b id="num-members">0</b></div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Commands (24h)</div>
          <div class="kpi-num" id="num-today-cmds">0</div>
          <div class="kpi-sub">Active Users: <b id="num-today-users">0</b></div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Monthly Total</div>
          <div class="kpi-num" id="num-month-cmds">0</div>
          <div class="kpi-sub">All-Time Runs: <b id="num-alltime-cmds">0</b></div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Memory Allocation</div>
          <div class="kpi-num" id="num-heap-used">0 MB</div>
          <div class="kpi-sub">Runtime: <b id="num-node-ver">Node.js</b></div>
        </div>
      </div>

      <div class="grid-split">
        <!-- Interactive Leaderboard -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🏆 Leaderboard</div>
            <div class="leaderboard-controls">
              <!-- Dimension Selector -->
              <select id="lb-type" class="input-search" style="width: 140px; padding: 2px 6px;" onchange="renderLeaderboard()">
                <option value="commands">Top Commands</option>
                <option value="users">Top Users</option>
                <option value="servers">Top Servers</option>
              </select>

              <!-- Period Selector -->
              <button class="btn-toggle active" id="btn-period-24h" onclick="setLeaderboardPeriod('24h')">24h</button>
              <button class="btn-toggle" id="btn-period-all" onclick="setLeaderboardPeriod('all')">All Time</button>
            </div>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 45px;">#</th>
                  <th style="width: 170px;" id="lb-col-name">COMMAND</th>
                  <th>USAGE SHARE</th>
                  <th style="width: 80px; text-align: right;">COUNT</th>
                </tr>
              </thead>
              <tbody id="leaderboard-tbody">
                <tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">Loading metrics...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- System & Database Status -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">⚙️ System Status</div>
          </div>
          <div class="card-body">
            <div class="service-row">
              <div>
                <div style="font-weight: 600; color: var(--text-main);">MongoDB Database</div>
                <div style="font-size: 11px; color: var(--text-dim);">Primary Storage</div>
              </div>
              <span id="status-mongo" class="pill-green">Connected</span>
            </div>

            <div class="service-row">
              <div>
                <div style="font-weight: 600; color: var(--text-main);">Redis Cache</div>
                <div style="font-size: 11px; color: var(--text-dim);">Fast Session & Rates</div>
              </div>
              <span id="status-redis" class="pill-green">Connected</span>
            </div>

            <div class="service-row">
              <div>
                <div style="font-weight: 600; color: var(--text-main);">Cron Schedulers</div>
                <div style="font-size: 11px; color: var(--text-dim);">Reminders, Giveaways</div>
              </div>
              <span class="pill-green">Active (3/3)</span>
            </div>

            <div class="service-row">
              <div>
                <div style="font-weight: 600; color: var(--text-main);">Discord Gateway</div>
                <div style="font-size: 11px; color: var(--text-dim);" id="sub-gateway">WebSocket</div>
              </div>
              <span id="status-gateway" class="pill-green">0ms Ping</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: LIVE LOGS -->
    <div id="pane-logs" class="tab-pane">
      <div class="log-box">
        <div class="log-bar">
          <div class="log-filters">
            <span class="filter-tag active" onclick="setLogFilter('ALL')">ALL</span>
            <span class="filter-tag err" onclick="setLogFilter('ERROR')">ERROR</span>
            <span class="filter-tag warn" onclick="setLogFilter('WARN')">WARN</span>
            <span class="filter-tag cmd" onclick="setLogFilter('CMD')">CMD</span>
            <span class="filter-tag" onclick="setLogFilter('INFO')">INFO</span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <input type="text" id="input-log-search" class="input-search" placeholder="Search logs..." oninput="renderLogs()">
            <button class="btn-toggle" id="btn-scroll" onclick="toggleLogScroll()">Auto-Scroll: ON</button>
            <button class="btn-toggle" onclick="clearLogs()">Clear</button>
          </div>
        </div>

        <div class="log-stream" id="log-stream-body">
          <div style="color: var(--text-dim); padding: 10px;">Waiting for logs...</div>
        </div>
      </div>
    </div>

    <!-- TAB 3: SERVERS -->
    <div id="pane-servers" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🌐 Connected Servers</div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="input-server-search" class="input-search" placeholder="Filter by name or ID..." oninput="renderServers()">
            <select id="select-server-sort" class="input-search" style="width: 140px;" onchange="renderServers()">
              <option value="members-desc">Most Members</option>
              <option value="members-asc">Least Members</option>
              <option value="name-asc">Server Name (A-Z)</option>
            </select>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>SERVER NAME</th>
                <th style="width: 180px;">SERVER ID</th>
                <th style="width: 100px; text-align: right;">MEMBERS</th>
                <th style="width: 120px;">JOINED</th>
              </tr>
            </thead>
            <tbody id="servers-tbody">
              <tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 20px;">Loading servers...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: OWNERS -->
    <div id="pane-owners" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <div class="card-title">👥 Team & Management</div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 140px;">ROLE / TIER</th>
                <th>USERNAME</th>
                <th style="width: 200px;">USER ID</th>
                <th style="width: 110px;">AUTHORITY</th>
              </tr>
            </thead>
            <tbody id="owners-tbody">
              <tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">Loading team...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: COMMANDS -->
    <div id="pane-commands" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📖 Commands Directory</div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="input-cmd-search" class="input-search" placeholder="Search commands or aliases..." oninput="renderCommands()">
            <select id="select-cmd-cat" class="input-search" style="width: 140px;" onchange="renderCommands()">
              <option value="ALL">All Categories</option>
            </select>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 120px;">CATEGORY</th>
                <th style="width: 120px;">NAME</th>
                <th style="width: 130px;">ALIASES</th>
                <th style="width: 80px;">COOLDOWN</th>
                <th>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody id="commands-tbody">
              <tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 20px;">Loading commands...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>

  <script>
    let appData = ${JSON.stringify(initialData || {})};
    let currentTab = 'overview';
    let currentPeriod = '24h';
    let currentLogFilter = 'ALL';
    let autoRefresh = true;
    let autoRefreshTimer = null;
    let autoScrollLogs = true;

    function switchTab(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

      const targetPane = document.getElementById('pane-' + tabId);
      if (targetPane) targetPane.classList.add('active');

      const tabs = document.querySelectorAll('.tab-btn');
      const map = { overview: 0, logs: 1, servers: 2, owners: 3, commands: 4 };
      if (tabs[map[tabId]]) tabs[map[tabId]].classList.add('active');

      if (tabId === 'logs' && autoScrollLogs) scrollLogs();
    }

    function setLeaderboardPeriod(period) {
      currentPeriod = period;
      document.getElementById('btn-period-24h').classList.toggle('active', period === '24h');
      document.getElementById('btn-period-all').classList.toggle('active', period === 'all');
      renderLeaderboard();
    }

    function setLogFilter(level) {
      currentLogFilter = level;
      document.querySelectorAll('.filter-tag').forEach(t => {
        t.classList.toggle('active', t.textContent.trim() === level);
      });
      renderLogs();
    }

    function toggleAutoRefresh() {
      autoRefresh = !autoRefresh;
      const btn = document.getElementById('btn-refresh');
      if (autoRefresh) {
        btn.textContent = 'Auto (5s)';
        btn.style.color = 'var(--green)';
        startPolling();
      } else {
        btn.textContent = 'Paused';
        btn.style.color = 'var(--text-dim)';
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      }
    }

    function toggleLogScroll() {
      autoScrollLogs = !autoScrollLogs;
      document.getElementById('btn-scroll').textContent = 'Auto-Scroll: ' + (autoScrollLogs ? 'ON' : 'OFF');
      if (autoScrollLogs) scrollLogs();
    }

    function scrollLogs() {
      const el = document.getElementById('log-stream-body');
      if (el) el.scrollTop = el.scrollHeight;
    }

    function clearLogs() {
      document.getElementById('log-stream-body').innerHTML = '<div style="color: var(--text-dim); padding: 10px;">Logs cleared.</div>';
    }

    function formatNum(n) {
      if (n === null || n === undefined || isNaN(n)) return '0';
      return Number(n).toLocaleString();
    }

    function formatTime(s) {
      if (!s) return '0s';
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      if (d > 0) return d + 'd ' + h + 'h';
      if (h > 0) return h + 'h ' + m + 'm';
      return m + 'm';
    }

    function renderUI(data) {
      if (!data) return;
      appData = data;

      const bot = data.bot || {};
      const ov = data.overview || {};
      const sys = data.system || {};
      const mem = sys.memory || {};

      // Headers
      document.getElementById('vital-ping').textContent = (bot.ping || 0) + ' ms';
      document.getElementById('vital-uptime').textContent = formatTime(ov.uptimeSeconds);
      document.getElementById('vital-ram').textContent = (mem.rssMb || '0') + ' MB';
      document.getElementById('vital-shard').textContent = (bot.shardId || 0) + '/' + (bot.totalShards || 1);

      // KPIs
      document.getElementById('num-servers').textContent = formatNum(ov.serverCount);
      document.getElementById('num-members').textContent = formatNum(ov.totalMembers);
      document.getElementById('num-today-cmds').textContent = formatNum(ov.todayCommands);
      document.getElementById('num-today-users').textContent = formatNum(ov.todayActiveUsers);
      document.getElementById('num-month-cmds').textContent = formatNum(ov.monthCommandsTotal);
      document.getElementById('num-alltime-cmds').textContent = formatNum(ov.alltimeCommandsTotal);
      document.getElementById('num-heap-used').textContent = (mem.heapUsedMb || '0') + ' MB';
      document.getElementById('num-node-ver').textContent = sys.nodeVersion || 'v20+';

      // Status
      const mongo = document.getElementById('status-mongo');
      mongo.className = data.database?.mongo?.connected ? 'pill-green' : 'pill-red';
      mongo.textContent = data.database?.mongo?.connected ? 'Connected' : 'Offline';

      const redis = document.getElementById('status-redis');
      redis.className = data.database?.redis?.connected ? 'pill-green' : 'pill-red';
      redis.textContent = data.database?.redis?.connected ? 'Connected' : 'Offline';

      const gw = document.getElementById('status-gateway');
      gw.textContent = (bot.ping || 0) + 'ms Ping';

      // Badges
      document.getElementById('badge-logs').textContent = (data.logs || []).length;
      document.getElementById('badge-servers').textContent = (data.servers || []).length;
      document.getElementById('badge-owners').textContent = (data.owners || []).length;
      document.getElementById('badge-commands').textContent = (data.commands || []).length;

      // Render Sub-Views
      renderLeaderboard();
      renderLogs();
      renderServers();
      renderOwners();
      renderCommands();
    }

    function renderLeaderboard() {
      const tbody = document.getElementById('leaderboard-tbody');
      const type = document.getElementById('lb-type')?.value || 'commands';
      const is24h = currentPeriod === '24h';
      const colHeader = document.getElementById('lb-col-name');

      let list = [];
      if (type === 'commands') {
        colHeader.textContent = 'COMMAND';
        list = is24h ? (appData.topCommandsToday || []) : (appData.topCommandsAlltime || []);
      } else if (type === 'users') {
        colHeader.textContent = 'ACTIVE USER';
        list = is24h ? (appData.topUsersToday || []) : (appData.topUsersAlltime || []);
      } else if (type === 'servers') {
        colHeader.textContent = 'ACTIVE SERVER';
        list = is24h ? (appData.topGuildsToday || []) : (appData.topGuildsAlltime || []);
      }

      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">No activity data available yet for this period.</td></tr>';
        return;
      }

      const max = Math.max(...list.map(i => i.count), 1);
      let html = '';
      list.slice(0, 10).forEach((item, idx) => {
        const pct = Math.round((item.count / max) * 100);
        const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : ''));
        const label = item.name ? ('kas ' + item.name) : (item.username || item.userId || ('ID: ' + item.id));

        html += '<tr>' +
          '<td><span class="rank ' + rankClass + '">#' + (idx + 1) + '</span></td>' +
          '<td><span class="code-badge">' + escapeHtml(label) + '</span></td>' +
          '<td><div class="meter-bar"><div class="meter-track"><div class="meter-fill" style="width:' + pct + '%;"></div></div><span style="font-family:var(--font-mono); font-size:10px; color:var(--text-dim); width:32px;">' + pct + '%</span></div></td>' +
          '<td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: var(--text-main);">' + formatNum(item.count) + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function renderLogs() {
      const container = document.getElementById('log-stream-body');
      const search = (document.getElementById('input-log-search')?.value || '').toLowerCase().trim();
      let logs = appData.logs || [];

      if (currentLogFilter !== 'ALL') {
        logs = logs.filter(l => l.level === currentLogFilter);
      }

      if (search) {
        logs = logs.filter(l =>
          l.message.toLowerCase().includes(search) ||
          l.category.toLowerCase().includes(search)
        );
      }

      if (logs.length === 0) {
        container.innerHTML = '<div style="color: var(--text-dim); padding: 10px;">No logs match filter.</div>';
        return;
      }

      let html = '';
      logs.forEach(l => {
        html += '<div class="log-item ' + l.level + '">' +
          '<span class="log-time">' + (l.timeFormatted || l.timestamp?.slice(11, 19) || '') + '</span>' +
          '<span class="log-tag ' + l.level + '">' + l.level + '</span>' +
          '<span class="log-text">' + escapeHtml(l.message) + '</span>' +
        '</div>';
      });

      container.innerHTML = html;
      if (autoScrollLogs) scrollLogs();
    }

    function renderServers() {
      const tbody = document.getElementById('servers-tbody');
      const search = (document.getElementById('input-server-search')?.value || '').toLowerCase().trim();
      const sort = document.getElementById('select-server-sort')?.value || 'members-desc';
      let servers = [...(appData.servers || [])];

      if (search) {
        servers = servers.filter(s =>
          s.name.toLowerCase().includes(search) ||
          s.id.toLowerCase().includes(search)
        );
      }

      servers.sort((a, b) => {
        if (sort === 'members-desc') return (b.memberCount || 0) - (a.memberCount || 0);
        if (sort === 'members-asc') return (a.memberCount || 0) - (b.memberCount || 0);
        if (sort === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });

      if (servers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 20px;">No servers found.</td></tr>';
        return;
      }

      let html = '';
      servers.slice(0, 100).forEach((s, idx) => {
        html += '<tr>' +
          '<td><span class="rank">#' + (idx + 1) + '</span></td>' +
          '<td style="font-weight: 600; color: var(--text-main);">' + escapeHtml(s.name) + '</td>' +
          '<td><span class="code-badge">' + s.id + '</span></td>' +
          '<td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: var(--green);">' + formatNum(s.memberCount) + '</td>' +
          '<td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim);">' + (s.joinedAt ? s.joinedAt.slice(0, 10) : 'N/A') + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function renderOwners() {
      const tbody = document.getElementById('owners-tbody');
      const owners = appData.owners || [];

      if (owners.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">No team members found.</td></tr>';
        return;
      }

      let html = '';
      owners.forEach(o => {
        const role = (o.roleName || o.tierLabel || 'Operator').toUpperCase();
        html += '<tr>' +
          '<td><span class="pill-green">' + escapeHtml(role) + '</span></td>' +
          '<td style="font-weight: 600; color: var(--text-main);">' + escapeHtml(o.username || o.name || 'Team Member') + '</td>' +
          '<td><span class="code-badge">' + o.ownerId + '</span></td>' +
          '<td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">Tier ' + (o.tier || 1) + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;
    }

    function renderCommands() {
      const tbody = document.getElementById('commands-tbody');
      const search = (document.getElementById('input-cmd-search')?.value || '').toLowerCase().trim();
      const cat = document.getElementById('select-cmd-cat')?.value || 'ALL';
      const cmds = appData.commands || [];

      const catSelect = document.getElementById('select-cmd-cat');
      if (catSelect && catSelect.children.length <= 1) {
        const categories = [...new Set(cmds.map(c => c.category || 'General'))].sort();
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          catSelect.appendChild(opt);
        });
      }

      let filtered = cmds;
      if (cat !== 'ALL') {
        filtered = filtered.filter(c => (c.category || 'General') === cat);
      }

      if (search) {
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(search) ||
          (c.description && c.description.toLowerCase().includes(search)) ||
          (c.aliases && c.aliases.some(a => a.toLowerCase().includes(search)))
        );
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 20px;">No commands match.</td></tr>';
        return;
      }

      let html = '';
      filtered.forEach(c => {
        const aliases = (c.aliases && c.aliases.length > 0) ? c.aliases.map(a => '<span class="code-badge">' + a + '</span>').join(' ') : '-';
        const cd = c.cooldown ? (c.cooldown >= 1000 ? (c.cooldown / 1000) + 's' : c.cooldown + 'ms') : '0s';

        html += '<tr>' +
          '<td style="font-size: 11px; color: var(--text-dim);">' + escapeHtml(c.category || 'General') + '</td>' +
          '<td><span class="code-badge" style="color: var(--green); font-weight: 700;">kas ' + escapeHtml(c.name) + '</span></td>' +
          '<td>' + aliases + '</td>' +
          '<td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim);">' + cd + '</td>' +
          '<td style="color: var(--text-muted);">' + escapeHtml(c.description || 'No description.') + '</td>' +
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

    async function poll() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          renderUI(data);
        }
      } catch (e) {}
    }

    function startPolling() {
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      autoRefreshTimer = setInterval(poll, 5000);
    }

    renderUI(appData);
    startPolling();
  </script>
</body>
</html>`;
}
