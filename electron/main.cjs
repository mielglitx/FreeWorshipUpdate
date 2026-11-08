const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const os = require('os');
const fs = require('fs');

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
const connectedLanDevices = new Map();
const LAN_SERVER_PORT = 5174;

const isDev = !app.isPackaged;
const APP_URL = isDev
  ? 'http://localhost:5173'
  : `file://${path.join(__dirname, '../dist/index.html')}`;

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

function startBuiltInLanServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const clientIp = req.socket.remoteAddress || 'unknown';
    connectedLanDevices.set(clientIp, Date.now());
    const now = Date.now();
    for (const [ip, seen] of connectedLanDevices.entries()) {
      if (now - seen > 15000) connectedLanDevices.delete(ip);
    }

    if (req.url && req.url.startsWith('/api/lan-info') && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          app: 'FreeWorship',
          service: 'FreeWorship Desktop LAN Server',
          ips: getLocalLanIps(),
          port: LAN_SERVER_PORT,
          connectedDevices: connectedLanDevices.size,
        })
      );
      return;
    }

    if (req.url && req.url.startsWith('/api/lan-sync') && req.method === 'GET') {
      const isOperator = req.url.includes('role=operator');
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
          connectedDevices: connectedLanDevices.size,
        })
      );
      return;
    }

    if (req.url && req.url.startsWith('/api/lan-sync') && req.method === 'POST') {
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

    res.writeHead(404);
    res.end();
  });

  server.on('error', () => {
    // Ignore if port 5174 is already bound
  });

  server.listen(LAN_SERVER_PORT, '0.0.0.0');
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
  operatorWindow = new BrowserWindow({
    width: 1560,
    height: 950,
    minWidth: 1180,
    minHeight: 720,
    title: 'FreeWorship Studio — Operator Control (Windows)',
    backgroundColor: '#07090e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

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

function closeOutputWindow(mode) {
  if ((mode === 'projector' || mode === 'all') && projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;
  }
  if ((mode === 'stage' || mode === 'all') && stageWindow && !stageWindow.isDestroyed()) {
    stageWindow.close();
    stageWindow = null;
  }
  if ((mode === 'stream' || mode === 'all') && streamWindow && !streamWindow.isDestroyed()) {
    streamWindow.close();
    streamWindow = null;
  }
  notifyWindowStatus();
}

function getWindowStatus() {
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
    connectedAndroidDevices: connectedLanDevices.size,
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

  screen.on('display-added', notifyWindowStatus);
  screen.on('display-removed', notifyWindowStatus);
  screen.on('display-metrics-changed', notifyWindowStatus);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
