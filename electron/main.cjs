const { app, BrowserWindow, screen, ipcMain, dialog, shell, globalShortcut } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');

let operatorWindow = null;
let projectorWindow = null;
let stageWindow = null;
let streamWindow = null;

// Persisted runtime routing config in memory + disk for Electron main process
let routingConfig = {
  projectorDisplayId: null, // null = auto 2nd screen
  stageDisplayId: null,     // null = auto 3rd screen
  enableStageMonitor: true, // Persists OFF across restarts if user turns off 3rd display
  borderlessFullscreen: true,
  alwaysOnTop: true,
  keepOperatorFocus: true,
  hideCursorOnProjector: true,
};

function getRoutingConfigFilePath() {
  try {
    return path.join(app.getPath('userData'), 'freeworship-routing-config.json');
  } catch {
    return null;
  }
}

function loadRoutingConfigFromDisk() {
  const filePath = getRoutingConfigFilePath();
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      routingConfig = { ...routingConfig, ...parsed };
    }
  } catch {}
}

function saveRoutingConfigToDisk() {
  const filePath = getRoutingConfigFilePath();
  if (!filePath) return;
  try {
    fs.writeFileSync(filePath, JSON.stringify(routingConfig, null, 2), 'utf-8');
  } catch {}
}

let latestBroadcastPayload = null;
let pendingRemoteCommands = [];
const connectedRemoteDevices = new Map(); // key -> { key, ip, device, connectedAt, lastSeen }
const LAN_SERVER_PORT = 5174;
const LAN_DISCOVERY_UDP_PORT = 41234;

const isDev = !app.isPackaged;
const APP_URL = isDev
  ? 'http://localhost:5173'
  : `file://${path.join(__dirname, '../dist/index.html')}`;

function normalizeClientIp(rawAddr) {
  if (!rawAddr) return 'unknown';
  return String(rawAddr).replace(/^::ffff:/i, '');
}

function isLocalhostIp(ip) {
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
}

function emitAndroidConnectionEvent(eventPayload) {
  if (operatorWindow && !operatorWindow.isDestroyed()) {
    operatorWindow.webContents.send('freeworship:android-connection-event', eventPayload);
  }
}

function pruneStaleRemoteDevices() {
  const now = Date.now();
  let removedAny = false;
  for (const [key, entry] of connectedRemoteDevices.entries()) {
    if (now - entry.lastSeen > 12000) {
      connectedRemoteDevices.delete(key);
      removedAny = true;
      emitAndroidConnectionEvent({
        type: 'disconnected',
        ip: entry.ip,
        device: entry.device,
        connectedCount: connectedRemoteDevices.size,
        timestamp: now,
      });
    }
  }
  if (removedAny) {
    notifyWindowStatus();
  }
}

function getLocalLanIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

function trackRemoteClientRequest(req) {
  pruneStaleRemoteDevices();
  const url = req.url || '';
  if (url.includes('role=operator')) return;

  const cleanIp = normalizeClientIp(req.socket?.remoteAddress);
  const isClientQuery = url.includes('role=client') || url.includes('device=');
  const isRemoteCommand = req.method === 'POST' && !isLocalhostIp(cleanIp);

  // Ignore internal localhost broadcast posts from PC operator console itself
  if (!isClientQuery && !isRemoteCommand) {
    return;
  }

  let deviceName = 'Android 3rd Monitor';
  try {
    const parsedUrl = new URL(url, 'http://localhost');
    const d = parsedUrl.searchParams.get('device');
    if (d) deviceName = d;
  } catch {}

  const key = `${cleanIp}|${deviceName}`;
  const isNew = !connectedRemoteDevices.has(key);
  const now = Date.now();
  connectedRemoteDevices.set(key, {
    key,
    ip: cleanIp,
    device: deviceName,
    connectedAt: isNew ? now : connectedRemoteDevices.get(key).connectedAt,
    lastSeen: now,
  });

  if (isNew) {
    emitAndroidConnectionEvent({
      type: 'connected',
      ip: cleanIp,
      device: deviceName,
      connectedCount: connectedRemoteDevices.size,
      timestamp: now,
    });
    notifyWindowStatus();
  }
}

function resolveBundledApkPath() {
  const candidates = [
    path.join(process.resourcesPath || '', 'FreeWorship-StageController.apk'),
    path.join(__dirname, '../dist/FreeWorship-StageController.apk'),
    path.join(__dirname, '../public/FreeWorship-StageController.apk'),
    path.join(app.getAppPath(), 'dist/FreeWorship-StageController.apk'),
    path.join(app.getAppPath(), 'public/FreeWorship-StageController.apk'),
    path.join(process.resourcesPath || '', 'app/dist/FreeWorship-StageController.apk'),
    path.join(process.resourcesPath || '', 'dist/FreeWorship-StageController.apk'),
  ];
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

const WEB_MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};

function resolveWebDistDir() {
  const candidates = [
    path.join(app.getAppPath(), 'dist'),
    path.join(__dirname, '../dist'),
    path.join(process.resourcesPath || '', 'app.asar', 'dist'),
    path.join(process.resourcesPath || '', 'app', 'dist'),
    path.join(process.resourcesPath || '', 'dist'),
  ];
  for (const dir of candidates) {
    try {
      if (dir && fs.existsSync(path.join(dir, 'index.html'))) {
        return path.resolve(dir);
      }
    } catch {}
  }
  return null;
}

function serveStaticWebFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = WEB_MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const cacheControl =
      ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': cacheControl,
    });
    res.end(data);
  });
}

function proxyRequestToViteDev(req, res, fallbackFn) {
  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: 5173,
      path: req.url || '/',
      method: req.method || 'GET',
      headers: {
        ...req.headers,
        host: '127.0.0.1:5173',
      },
      timeout: 2500,
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers };
      delete headers['access-control-allow-origin'];
      res.writeHead(proxyRes.statusCode || 200, {
        ...headers,
        'Access-Control-Allow-Origin': '*',
      });
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', () => fallbackFn());
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    fallbackFn();
  });
  proxyReq.end();
}

function handleLanWebRoute(req, res, rawUrl, urlPath) {
  const cleanLower = urlPath.toLowerCase().replace(/\/+$/, '') || '/';

  // Friendly browser entry routes for Apple Safari, Stage-Only & OBS Browser Source
  if (
    cleanLower === '/remote' ||
    cleanLower === '/apple' ||
    cleanLower === '/ios' ||
    cleanLower === '/controller' ||
    cleanLower === '/stage'
  ) {
    res.writeHead(302, { Location: '/?view=android', 'Cache-Control': 'no-cache' });
    res.end();
    return true;
  }

  if (cleanLower === '/stage-only' || cleanLower === '/band') {
    res.writeHead(302, { Location: '/?view=android&stageOnly=1', 'Cache-Control': 'no-cache' });
    res.end();
    return true;
  }

  if (cleanLower === '/obs' || cleanLower === '/lower-third' || cleanLower === '/stream') {
    res.writeHead(302, { Location: '/?view=stream', 'Cache-Control': 'no-cache' });
    res.end();
    return true;
  }

  // Browser navigation to root (without JSON/probe intent) opens the mobile remote UI
  const acceptHeader = String(req.headers?.accept || '').toLowerCase();
  if (
    cleanLower === '/' &&
    !rawUrl.includes('view=') &&
    acceptHeader.includes('text/html') &&
    !acceptHeader.includes('application/json')
  ) {
    res.writeHead(302, { Location: '/?view=android', 'Cache-Control': 'no-cache' });
    res.end();
    return true;
  }

  const isHtmlRequest = cleanLower === '/' && rawUrl.includes('view=');
  const serveFromDist = () => {
    const distDir = resolveWebDistDir();
    if (!distDir) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('FreeWorship Web Remote bundle not found.');
      return;
    }
    const relPath =
      cleanLower === '/' || cleanLower === '/index.html'
        ? 'index.html'
        : urlPath.replace(/^\/+/, '');
    const resolvedTarget = path.resolve(distDir, relPath);
    if (
      resolvedTarget !== distDir &&
      !resolvedTarget.startsWith(distDir + path.sep)
    ) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    try {
      if (fs.existsSync(resolvedTarget) && fs.statSync(resolvedTarget).isFile()) {
        serveStaticWebFile(res, resolvedTarget);
        return;
      }
      // SPA fallback for HTML view requests
      if (isHtmlRequest || !path.extname(relPath)) {
        serveStaticWebFile(res, path.join(distDir, 'index.html'));
        return;
      }
    } catch {}
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  };

  if (isDev && req.method === 'GET') {
    proxyRequestToViteDev(req, res, serveFromDist);
    return true;
  }

  serveFromDist();
  return true;
}

function handleLanHttpRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  trackRemoteClientRequest(req);

  const rawUrl = req.url || '/';
  let urlPath = '/';
  try {
    urlPath = decodeURIComponent(rawUrl.split('?')[0] || '/');
  } catch {
    urlPath = rawUrl.split('?')[0] || '/';
  }

  // Serve Android APK directly over local Wi-Fi so Android devices can download via browser
  if (urlPath === '/FreeWorship-StageController.apk' && req.method === 'GET') {
    const apkPath = resolveBundledApkPath();
    if (!apkPath) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Android APK file not found on PC host' }));
      return;
    }
    try {
      const stat = fs.statSync(apkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="FreeWorship-StageController.apk"',
      });
      fs.createReadStream(apkPath).pipe(res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Quick health / ping probe (keep JSON for Android Scan PC unless browser navigation or ?view= query)
  const acceptHeader = String(req.headers?.accept || '').toLowerCase();
  const isBrowserRootNavigation =
    urlPath === '/' &&
    (rawUrl.includes('view=') ||
      (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')));

  if (!isBrowserRootNavigation && (urlPath === '/' || urlPath === '/ping' || urlPath === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        app: 'FreeWorship',
        status: 'online',
        ips: getLocalLanIps(),
        port: LAN_SERVER_PORT,
        connectedClients: connectedRemoteDevices.size,
        connectedDevices: connectedRemoteDevices.size,
      })
    );
    return;
  }

  if (urlPath.startsWith('/api/lan-info') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        app: 'FreeWorship',
        service: 'FreeWorship Desktop LAN Server',
        ips: getLocalLanIps(),
        port: LAN_SERVER_PORT,
        connectedClients: connectedRemoteDevices.size,
        connectedDevices: connectedRemoteDevices.size,
        devices: Array.from(connectedRemoteDevices.values()),
      })
    );
    return;
  }

  if (urlPath.startsWith('/api/lan-sync') && req.method === 'GET') {
    const isOperator = rawUrl.includes('role=operator');
    const commands = isOperator ? [...pendingRemoteCommands] : [];
    if (isOperator && pendingRemoteCommands.length > 0) {
      pendingRemoteCommands = [];
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        app: 'FreeWorship',
        state: latestBroadcastPayload,
        payload: latestBroadcastPayload,
        commands,
        ips: getLocalLanIps(),
        port: LAN_SERVER_PORT,
        connectedClients: connectedRemoteDevices.size,
        connectedDevices: connectedRemoteDevices.size,
      })
    );
    return;
  }

  if (urlPath.startsWith('/api/lan-sync') && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (data.type === 'STATE_UPDATE' && data.payload) {
          latestBroadcastPayload = data.payload;
        } else if (data.type === 'REMOTE_COMMAND' && data.command) {
          pendingRemoteCommands.push({
            id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            command: data.command,
            timestamp: Date.now(),
          });
          // Also push directly to operatorWindow via IPC for 0ms execution!
          if (operatorWindow && !operatorWindow.isDestroyed()) {
            operatorWindow.webContents.send('freeworship:remote-command', data.command);
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  // HTTP Stream Deck / Bitfocus Companion Trigger API (GET or POST /api/trigger/<action>)
  if (urlPath.startsWith('/api/trigger/') && (req.method === 'GET' || req.method === 'POST')) {
    const segs = urlPath.replace(/^\/api\/trigger\//, '').split('/').filter(Boolean);
    const act = (segs[0] || '').toLowerCase();
    let command = null;
    if (act === 'next') command = { action: 'NEXT_SLIDE' };
    else if (act === 'prev' || act === 'previous') command = { action: 'PREV_SLIDE' };
    else if (act === 'blackout') command = { action: 'TOGGLE_PANIC', key: 'blackout' };
    else if (act === 'logo') command = { action: 'TOGGLE_PANIC', key: 'logoMode' };
    else if (act === 'clear') command = { action: 'TOGGLE_PANIC', key: 'clearText' };
    else if (act === 'restore') command = { action: 'RESTORE_PANIC' };
    else if (act === 'slide' && segs[1] !== undefined) {
      const idx = Math.max(0, parseInt(segs[1], 10) - 1);
      if (!Number.isNaN(idx)) command = { action: 'SELECT_SLIDE', index: idx };
    } else if (act === 'pad' && segs[1]) {
      command = { action: 'TRIGGER_PAD', musicalKey: segs[1] };
    } else if (act === 'stop-pad') {
      command = { action: 'STOP_PAD' };
    }

    if (!command) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Unknown trigger. Supported: next, prev, blackout, logo, clear, restore, slide/<1..N>, pad/<key>, stop-pad',
        })
      );
      return;
    }

    pendingRemoteCommands.push({
      id: `trig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      command,
      timestamp: Date.now(),
    });
    if (operatorWindow && !operatorWindow.isDestroyed()) {
      operatorWindow.webContents.send('freeworship:remote-command', command);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, triggered: act, command }));
    return;
  }

  // Serve Web Browser Remote UI (iPhone/iPad/Mac Safari & desktop browsers) and static dist assets
  if (req.method === 'GET') {
    handleLanWebRoute(req, res, rawUrl, urlPath);
    return;
  }

  res.writeHead(404);
  res.end();
}

function startBuiltInLanServer() {
  // Primary LAN Server on Port 5174
  const server5174 = http.createServer(handleLanHttpRequest);
  server5174.on('error', (err) => {
    console.warn('[FreeWorship LAN Server] Port 5174 warning:', err.message);
  });
  server5174.listen(LAN_SERVER_PORT, '0.0.0.0');

  // Secondary Alias LAN Server on Port 5173 (ensures older / default saved ports connect seamlessly)
  const server5173 = http.createServer(handleLanHttpRequest);
  server5173.on('error', () => {
    // Port 5173 may already be used by Vite dev server, which is completely expected
  });
  server5173.listen(5173, '0.0.0.0');

  // Periodic pruning of disconnected remote clients
  setInterval(pruneStaleRemoteDevices, 4000);

  // Instant UDP Broadcast Discovery Responder (allows Android "Scan PC" to find host in <50ms)
  try {
    const udpSocket = dgram.createSocket('udp4');
    udpSocket.on('error', (err) => {
      console.warn('[FreeWorship UDP Discovery] Warning:', err.message);
    });
    udpSocket.on('message', (msg, rinfo) => {
      const text = msg.toString('utf8').trim();
      if (text.includes('FREEWORSHIP_DISCOVER')) {
        const replyPayload = Buffer.from(
          JSON.stringify({
            ok: true,
            app: 'FreeWorship',
            hostname: os.hostname(),
            ips: getLocalLanIps(),
            port: LAN_SERVER_PORT,
          }),
          'utf8'
        );
        udpSocket.send(replyPayload, 0, replyPayload.length, rinfo.port, rinfo.address, () => {});
      }
    });
    udpSocket.bind(LAN_DISCOVERY_UDP_PORT, '0.0.0.0', () => {
      try {
        udpSocket.setBroadcast(true);
      } catch {}
    });
  } catch (err) {
    console.warn('[FreeWorship UDP Discovery] Init warning:', err.message);
  }
}

function getDisplayList() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  return displays.map((d, idx) => ({
    id: d.id,
    index: idx + 1,
    label: d.label || `Display ${idx + 1} (${d.bounds.width}x${d.bounds.height})`,
    x: d.bounds.x,
    y: d.bounds.y,
    width: d.bounds.width,
    height: d.bounds.height,
    scaleFactor: d.scaleFactor || 1,
    isPrimary: d.id === primary.id,
  }));
}

function resolveTargetDisplay(mode, explicitDisplayId) {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const nonPrimary = displays.filter((d) => d.id !== primary.id);

  const requestedId =
    explicitDisplayId !== undefined && explicitDisplayId !== null
      ? explicitDisplayId
      : mode === 'projector'
      ? routingConfig.projectorDisplayId
      : mode === 'stage'
      ? routingConfig.stageDisplayId
      : null;

  if (requestedId !== null && requestedId !== undefined && requestedId !== 'auto') {
    const found = displays.find((d) => String(d.id) === String(requestedId));
    if (found) return found;
  }

  if (mode === 'projector') {
    return nonPrimary[0] || primary;
  }
  if (mode === 'stage') {
    return nonPrimary[1] || nonPrimary[0] || primary;
  }
  return primary;
}

function applyBorderlessFullscreenToWindow(win, targetDisplay, options = {}) {
  if (!win || win.isDestroyed()) return;
  const useBorderless =
    options.borderlessFullscreen !== undefined
      ? Boolean(options.borderlessFullscreen)
      : Boolean(routingConfig.borderlessFullscreen);
  const useAlwaysOnTop =
    options.alwaysOnTop !== undefined
      ? Boolean(options.alwaysOnTop)
      : Boolean(routingConfig.alwaysOnTop);

  const bounds = targetDisplay.bounds;

  if (win.isFullScreen()) {
    win.setFullScreen(false);
  }

  win.setBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  });

  if (useBorderless) {
    win.setMenuBarVisibility(false);
    win.setFullScreen(true);
  }

  win.setAlwaysOnTop(useAlwaysOnTop, useAlwaysOnTop ? 'screen-saver' : 'normal');
}

function createOperatorWindow() {
  const primaryWorkArea = screen.getPrimaryDisplay().workAreaSize;
  const initWidth = Math.min(1680, primaryWorkArea.width);
  const initHeight = Math.min(980, primaryWorkArea.height);
  const shouldStartMaximized =
    primaryWorkArea.width <= 1560 || primaryWorkArea.height <= 900;

  operatorWindow = new BrowserWindow({
    width: initWidth,
    height: initHeight,
    minWidth: 760,
    minHeight: 540,
    title: 'FreeWorship Studio — Operator Control (Windows)',
    backgroundColor: '#07090e',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (shouldStartMaximized) {
    operatorWindow.maximize();
  }

  operatorWindow.loadURL(APP_URL);

  operatorWindow.on('closed', () => {
    operatorWindow = null;
    if (projectorWindow && !projectorWindow.isDestroyed()) projectorWindow.close();
    if (stageWindow && !stageWindow.isDestroyed()) stageWindow.close();
    if (streamWindow && !streamWindow.isDestroyed()) streamWindow.close();
    app.quit();
  });
}

function openOrFocusOutputWindow(mode, options = {}) {
  if (options && typeof options === 'object') {
    if (options.projectorDisplayId !== undefined) {
      routingConfig.projectorDisplayId = options.projectorDisplayId;
    }
    if (options.stageDisplayId !== undefined) {
      routingConfig.stageDisplayId = options.stageDisplayId;
    }
    if (options.enableStageMonitor !== undefined) {
      routingConfig.enableStageMonitor = Boolean(options.enableStageMonitor);
    }
    if (options.borderlessFullscreen !== undefined) {
      routingConfig.borderlessFullscreen = Boolean(options.borderlessFullscreen);
    }
    if (options.alwaysOnTop !== undefined) {
      routingConfig.alwaysOnTop = Boolean(options.alwaysOnTop);
    }
    if (options.keepOperatorFocus !== undefined) {
      routingConfig.keepOperatorFocus = Boolean(options.keepOperatorFocus);
    }
  }

  // If 3rd Monitor (Stage) is disabled on Desktop, do not open a desktop stage window
  if (mode === 'stage' && routingConfig.enableStageMonitor === false) {
    if (stageWindow && !stageWindow.isDestroyed()) {
      stageWindow.close();
      stageWindow = null;
    }
    notifyWindowStatus();
    return { open: false, reason: 'stage_monitor_disabled' };
  }

  const targetDisplay = resolveTargetDisplay(mode, options.displayId);
  const bounds = targetDisplay.bounds;
  const useBorderless = routingConfig.borderlessFullscreen;

  if (mode === 'projector') {
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      applyBorderlessFullscreenToWindow(projectorWindow, targetDisplay, options);
      projectorWindow.show();
      if (routingConfig.keepOperatorFocus && operatorWindow && !operatorWindow.isDestroyed()) {
        operatorWindow.focus();
      }
      notifyWindowStatus();
      return { open: true, displayId: targetDisplay.id };
    }

    projectorWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: !useBorderless,
      fullscreen: useBorderless,
      simpleFullscreen: false,
      thickFrame: false,
      roundedCorners: false,
      enableLargerThanScreen: true,
      title: 'FreeWorship — Live Projector Output (Screen 2)',
      backgroundColor: '#000000',
      autoHideMenuBar: true,
      alwaysOnTop: routingConfig.alwaysOnTop,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
      },
    });

    projectorWindow.loadURL(`${APP_URL}?view=projector`);
    projectorWindow.once('ready-to-show', () => {
      applyBorderlessFullscreenToWindow(projectorWindow, targetDisplay, options);
      if (routingConfig.keepOperatorFocus && operatorWindow && !operatorWindow.isDestroyed()) {
        projectorWindow.showInactive();
        operatorWindow.focus();
      } else {
        projectorWindow.show();
      }
    });

    projectorWindow.webContents.on('before-input-event', (event, input) => {
      const isCtrlShift2 =
        (input.control || input.meta) &&
        input.shift &&
        (input.code === 'Digit2' || input.key === '@' || input.key === '2');
      if (input.type === 'keyDown' && (input.key === 'Escape' || isCtrlShift2)) {
        event.preventDefault();
        closeOutputWindow('projector');
      }
    });

    projectorWindow.on('closed', () => {
      projectorWindow = null;
      notifyWindowStatus();
    });
    notifyWindowStatus();
    return { open: true, displayId: targetDisplay.id };
  }

  if (mode === 'stage') {
    if (stageWindow && !stageWindow.isDestroyed()) {
      applyBorderlessFullscreenToWindow(stageWindow, targetDisplay, options);
      stageWindow.show();
      if (routingConfig.keepOperatorFocus && operatorWindow && !operatorWindow.isDestroyed()) {
        operatorWindow.focus();
      }
      notifyWindowStatus();
      return { open: true, displayId: targetDisplay.id };
    }

    stageWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: !useBorderless,
      fullscreen: useBorderless,
      thickFrame: false,
      roundedCorners: false,
      enableLargerThanScreen: true,
      title: 'FreeWorship — Stage Confidence Monitor (Screen 3)',
      backgroundColor: '#05070b',
      autoHideMenuBar: true,
      alwaysOnTop: routingConfig.alwaysOnTop,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
      },
    });

    stageWindow.loadURL(`${APP_URL}?view=stage`);
    stageWindow.once('ready-to-show', () => {
      applyBorderlessFullscreenToWindow(stageWindow, targetDisplay, options);
      if (routingConfig.keepOperatorFocus && operatorWindow && !operatorWindow.isDestroyed()) {
        stageWindow.showInactive();
        operatorWindow.focus();
      } else {
        stageWindow.show();
      }
    });

    stageWindow.webContents.on('before-input-event', (event, input) => {
      const isCtrlShift2 =
        (input.control || input.meta) &&
        input.shift &&
        (input.code === 'Digit2' || input.key === '@' || input.key === '2');
      const isCtrlShift3 =
        (input.control || input.meta) &&
        input.shift &&
        (input.code === 'Digit3' || input.key === '#' || input.key === '3');
      if (input.type === 'keyDown' && isCtrlShift2) {
        event.preventDefault();
        closeOutputWindow('projector');
        return;
      }
      if (input.type === 'keyDown' && (input.key === 'Escape' || isCtrlShift3)) {
        event.preventDefault();
        closeOutputWindow('stage');
      }
    });

    stageWindow.on('closed', () => {
      stageWindow = null;
      notifyWindowStatus();
    });
    notifyWindowStatus();
    return { open: true, displayId: targetDisplay.id };
  }

  if (mode === 'stream') {
    if (streamWindow && !streamWindow.isDestroyed()) {
      streamWindow.focus();
      return { open: true };
    }
    streamWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      transparent: true,
      frame: false,
      title: 'FreeWorship — NDI / OBS Lower-Thirds Overlay',
      backgroundColor: '#00000000',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
      },
    });
    streamWindow.loadURL(`${APP_URL}?view=stream`);
    streamWindow.on('closed', () => {
      streamWindow = null;
      notifyWindowStatus();
    });
    notifyWindowStatus();
    return { open: true };
  }
}

function focusOperatorWindow() {
  if (operatorWindow && !operatorWindow.isDestroyed()) {
    if (operatorWindow.isMinimized()) {
      operatorWindow.restore();
    }
    operatorWindow.show();
    operatorWindow.focus();
  }
}

function closeOutputWindow(mode) {
  let closedProjector = false;
  if ((mode === 'projector' || mode === 'all') && projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;
    closedProjector = true;
  }
  if ((mode === 'stage' || mode === 'all') && stageWindow && !stageWindow.isDestroyed()) {
    stageWindow.close();
    stageWindow = null;
  }
  if ((mode === 'stream' || mode === 'all') && streamWindow && !streamWindow.isDestroyed()) {
    streamWindow.close();
    streamWindow = null;
  }
  if (closedProjector) {
    focusOperatorWindow();
  }
  notifyWindowStatus();
}

function getWindowStatus() {
  pruneStaleRemoteDevices();
  const displays = getDisplayList();
  return {
    projectorOpen: Boolean(projectorWindow && !projectorWindow.isDestroyed()),
    stageOpen: Boolean(stageWindow && !stageWindow.isDestroyed()),
    streamOpen: Boolean(streamWindow && !streamWindow.isDestroyed()),
    displayCount: displays.length,
    displays,
    routingConfig,
    lanIps: getLocalLanIps(),
    lanPort: LAN_SERVER_PORT,
    connectedAndroidDevices: connectedRemoteDevices.size,
    connectedDevicesList: Array.from(connectedRemoteDevices.values()),
  };
}

function notifyWindowStatus() {
  const status = getWindowStatus();
  if (operatorWindow && !operatorWindow.isDestroyed()) {
    operatorWindow.webContents.send('freeworship:window-status', status);
  }
}

app.whenReady().then(() => {
  loadRoutingConfigFromDisk();
  startBuiltInLanServer();
  createOperatorWindow();

  ipcMain.handle('freeworship:open-window', (_event, mode, options) => {
    const res = openOrFocusOutputWindow(mode, options || {});
    saveRoutingConfigToDisk();
    return res;
  });

  ipcMain.handle('freeworship:close-window', (_event, mode) => {
    closeOutputWindow(mode);
    return getWindowStatus();
  });

  ipcMain.handle('freeworship:get-status', () => {
    return getWindowStatus();
  });

  ipcMain.handle('freeworship:update-routing', (_event, newConfig) => {
    routingConfig = { ...routingConfig, ...newConfig };
    saveRoutingConfigToDisk();
    if (routingConfig.enableStageMonitor === false && stageWindow && !stageWindow.isDestroyed()) {
      stageWindow.close();
      stageWindow = null;
    }
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      const target = resolveTargetDisplay('projector');
      applyBorderlessFullscreenToWindow(projectorWindow, target, routingConfig);
    }
    if (stageWindow && !stageWindow.isDestroyed()) {
      const target = resolveTargetDisplay('stage');
      applyBorderlessFullscreenToWindow(stageWindow, target, routingConfig);
    }
    notifyWindowStatus();
    return getWindowStatus();
  });

  ipcMain.on('freeworship:broadcast-state', (_event, payload) => {
    latestBroadcastPayload = payload;
    [projectorWindow, stageWindow, streamWindow, operatorWindow].forEach((win) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('freeworship:state-sync', payload);
      }
    });
  });

  ipcMain.handle('freeworship:download-and-install-update', async (_event, updateUrl) => {
    if (!updateUrl) {
      return { ok: false, error: 'No update URL provided' };
    }

    const tempDir = app.getPath('temp');
    const installerPath = path.join(tempDir, 'FreeWorship Studio-Setup-Update.exe');

    const downloadFile = (targetUrl) => {
      return new Promise((resolve, reject) => {
        const fetchUrl = (currentUrl, redirects = 0) => {
          if (redirects > 10) {
            reject(new Error('Too many redirects while downloading update'));
            return;
          }

          const client = currentUrl.startsWith('https:') ? https : http;
          const req = client.get(currentUrl, {
            headers: {
              'User-Agent': 'FreeWorship-Windows-Updater',
            },
          }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              let nextUrl = res.headers.location;
              if (!nextUrl.startsWith('http')) {
                const parsed = new URL(currentUrl);
                nextUrl = new URL(nextUrl, parsed.origin).toString();
              }
              fetchUrl(nextUrl, redirects + 1);
              return;
            }

            if (res.statusCode !== 200) {
              reject(new Error(`Server returned HTTP ${res.statusCode}: ${res.statusMessage}`));
              return;
            }

            const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
            let bytesReceived = 0;
            let lastPercent = -1;

            const fileStream = fs.createWriteStream(installerPath);

            res.on('data', (chunk) => {
              bytesReceived += chunk.length;
              fileStream.write(chunk);

              if (totalBytes > 0) {
                const percent = Math.floor((bytesReceived / totalBytes) * 100);
                if (percent !== lastPercent) {
                  lastPercent = percent;
                  if (operatorWindow && !operatorWindow.isDestroyed()) {
                    operatorWindow.webContents.send('freeworship:update-download-progress', {
                      percent,
                      bytesReceived,
                      totalBytes,
                      stage: 'downloading',
                    });
                  }
                }
              }
            });

            res.on('end', () => {
              fileStream.end(() => {
                if (operatorWindow && !operatorWindow.isDestroyed()) {
                  operatorWindow.webContents.send('freeworship:update-download-progress', {
                    percent: 100,
                    bytesReceived,
                    totalBytes: bytesReceived,
                    stage: 'installing',
                  });
                }
                resolve(installerPath);
              });
            });

            res.on('error', (err) => {
              fileStream.close();
              try { fs.unlinkSync(installerPath); } catch {}
              reject(err);
            });
          });

          req.on('error', (err) => {
            reject(err);
          });
        };

        fetchUrl(targetUrl);
      });
    };

    try {
      const downloadedExe = await downloadFile(updateUrl);

      // Launch the NSIS installer detached so it runs independently
      const child = spawn(downloadedExe, [], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      // Exit current Electron app cleanly after 1 second so NSIS can overwrite files
      setTimeout(() => {
        app.quit();
      }, 1000);

      return { ok: true, path: downloadedExe };
    } catch (err) {
      console.error('Update download/install error:', err);
      return { ok: false, error: err.message };
    }
  });

  // Persistent User Song Library Storage (Guaranteed survival across app updates and uninstalls)
  ipcMain.handle('freeworship:save-user-songs', async (_event, songsJson) => {
    try {
      const p = path.join(app.getPath('userData'), 'user_library_songs.json');
      await fs.promises.writeFile(p, songsJson, 'utf8');
      return { ok: true };
    } catch (err) {
      console.error('Failed to save user songs to disk:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('freeworship:load-user-songs', async () => {
    try {
      const p = path.join(app.getPath('userData'), 'user_library_songs.json');
      if (fs.existsSync(p)) {
        const data = await fs.promises.readFile(p, 'utf8');
        return { ok: true, data };
      }
      return { ok: true, data: null };
    } catch (err) {
      console.error('Failed to load user songs from disk:', err);
      return { ok: false, error: err.message };
    }
  });

  // Offline Built-in 66-Book Bible Loader (Fast direct disk read)
  ipcMain.handle('freeworship:load-bible-file', async (_event, fileName) => {
    try {
      const safeName = path.basename(fileName);
      const candidatePaths = [
        path.join(__dirname, '../dist/bibles', safeName),
        path.join(__dirname, '../public/bibles', safeName),
        path.join(app.getAppPath(), 'dist/bibles', safeName),
        path.join(app.getAppPath(), 'public/bibles', safeName),
        path.join(process.resourcesPath, 'app/dist/bibles', safeName),
        path.join(process.resourcesPath, 'dist/bibles', safeName),
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          return await fs.promises.readFile(p, 'utf8');
        }
      }
      console.warn('Bible file not found in candidate paths:', safeName);
    } catch (err) {
      console.error('Failed to load local bible file via IPC:', err);
    }
    return null;
  });

  // Check if Windows Firewall already allows FreeWorship LAN TCP (5174/5173) & UDP (41234)
  ipcMain.handle('freeworship:check-firewall-rule', async () => {
    const checkRule = (ruleName) =>
      new Promise((resolve) => {
        let out = '';
        const child = spawn(
          'netsh',
          ['advfirewall', 'firewall', 'show', 'rule', `name=${ruleName}`],
          { windowsHide: true }
        );
        child.stdout.on('data', (d) => {
          out += d.toString();
        });
        child.on('close', (code) => {
          const isEnabled = /Enabled:\s*Yes/i.test(out);
          const isAllow = /Action:\s*Allow/i.test(out);
          resolve(code === 0 && isEnabled && isAllow);
        });
        child.on('error', () => resolve(false));
      });

    try {
      const [tcpAllowed, udpAllowed, appAllowed] = await Promise.all([
        checkRule('FreeWorship LAN Remote (5174)'),
        checkRule('FreeWorship LAN Discovery (UDP 41234)'),
        checkRule('FreeWorship Studio LAN App'),
      ]);
      return {
        ok: true,
        allowed: tcpAllowed && udpAllowed && appAllowed,
        tcpAllowed,
        udpAllowed,
        appAllowed,
      };
    } catch (err) {
      return { ok: false, allowed: false, error: err.message };
    }
  });

  // Windows Firewall Inbound Rule Helper (Allows TCP 5174/5173, UDP 41234 & Host App with UAC elevation fallback)
  ipcMain.handle('freeworship:setup-firewall-rule', async () => {
    const tmpBat = path.join(os.tmpdir(), `freeworship-fw-${Date.now()}.cmd`);
    const safeExecPath = String(process.execPath || '').replace(/"/g, '');
    const batLines = [
      '@echo off',
      'netsh advfirewall firewall delete rule name="FreeWorship LAN Remote (5174)" >nul 2>&1',
      'netsh advfirewall firewall delete rule name="FreeWorship LAN Discovery (UDP 41234)" >nul 2>&1',
      'netsh advfirewall firewall delete rule name="FreeWorship Studio LAN App" >nul 2>&1',
      'netsh advfirewall firewall add rule name="FreeWorship LAN Remote (5174)" dir=in action=allow protocol=TCP localport=5174,5173 profile=any >nul 2>&1',
      'if errorlevel 1 exit /b 1',
      'netsh advfirewall firewall add rule name="FreeWorship LAN Discovery (UDP 41234)" dir=in action=allow protocol=UDP localport=41234 profile=any >nul 2>&1',
      'if errorlevel 1 exit /b 1',
      ...(safeExecPath
        ? [
            `netsh advfirewall firewall add rule name="FreeWorship Studio LAN App" dir=in action=allow program="${safeExecPath}" enable=yes profile=any >nul 2>&1`,
            'if errorlevel 1 exit /b 1',
          ]
        : []),
      'exit /b 0',
    ];

    try {
      await fs.promises.writeFile(tmpBat, batLines.join('\r\n'), 'utf8');

      const directResult = await new Promise((resolve) => {
        const child = spawn('cmd.exe', ['/c', `"${tmpBat}"`], { windowsHide: true });
        child.on('close', (code) => resolve({ ok: code === 0, code }));
        child.on('error', (err) => resolve({ ok: false, error: err.message }));
      });

      if (directResult.ok) {
        return {
          ok: true,
          message: 'Windows Firewall rules added for TCP 5174/5173 and UDP discovery 41234!',
        };
      }

      // Standard desktop user session requires Windows UAC elevation prompt
      const escapedBat = tmpBat.replace(/'/g, "''");
      const psScript = `try { $p = Start-Process -FilePath '${escapedBat}' -Verb RunAs -WindowStyle Hidden -Wait -PassThru; exit $p.ExitCode } catch { Write-Error $_.Exception.Message; exit 99 }`;

      const elevatedResult = await new Promise((resolve) => {
        let stderr = '';
        const child = spawn(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript],
          { windowsHide: true }
        );
        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });
        child.on('close', (code) => {
          if (code === 0) {
            resolve({
              ok: true,
              message:
                'Windows Firewall rules added successfully for TCP 5174/5173 and UDP discovery 41234!',
            });
          } else if (code === 99 || /cancel/i.test(stderr)) {
            resolve({
              ok: false,
              code,
              error:
                'Administrator permission (UAC) was declined. Click "Allow Port in Windows Firewall" again and click Yes to allow ports 5174/5173 and UDP 41234.',
            });
          } else {
            resolve({
              ok: false,
              code,
              error:
                stderr.trim() ||
                'Could not modify Windows Firewall automatically. Please allow TCP 5174, 5173 and UDP 41234 in Windows Defender Firewall.',
            });
          }
        });
        child.on('error', (err) => {
          resolve({ ok: false, error: err.message });
        });
      });

      return elevatedResult;
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      try {
        await fs.promises.unlink(tmpBat);
      } catch {}
    }
  });

  // Save / Export bundled Android APK to user's Downloads or chosen folder
  ipcMain.handle('freeworship:save-android-apk', async () => {
    try {
      const apkPath = resolveBundledApkPath();
      if (!apkPath) {
        return { ok: false, error: 'Bundled Android APK file not found.' };
      }
      const defaultPath = path.join(app.getPath('downloads'), 'FreeWorship-StageController.apk');
      const { canceled, filePath } = await dialog.showSaveDialog(operatorWindow || undefined, {
        title: 'Save FreeWorship Android 3rd Monitor APK',
        defaultPath,
        filters: [{ name: 'Android Package (*.apk)', extensions: ['apk'] }],
      });
      if (canceled || !filePath) {
        return { ok: false, canceled: true };
      }
      await fs.promises.copyFile(apkPath, filePath);
      try {
        shell.showItemInFolder(filePath);
      } catch {}
      return { ok: true, path: filePath };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  screen.on('display-added', notifyWindowStatus);
  screen.on('display-removed', notifyWindowStatus);
  screen.on('display-metrics-changed', notifyWindowStatus);

  // OS-level emergency shortcut so single-screen operators can always disable Screen 2 even if fullscreen alwaysOnTop covers the desktop
  try {
    globalShortcut.register('CommandOrControl+Shift+2', () => {
      if (projectorWindow && !projectorWindow.isDestroyed()) {
        closeOutputWindow('projector');
      } else {
        focusOperatorWindow();
      }
    });
  } catch (err) {
    console.warn('Could not register CommandOrControl+Shift+2 shortcut:', err);
  }
});

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch {}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
