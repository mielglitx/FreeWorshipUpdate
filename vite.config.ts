import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

function getLocalLanIps(): string[] {
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

function freeworshipLanBridgePlugin(): Plugin {
  let latestPayload: unknown = null;
  let commandQueue: Array<{ id: string; command: unknown; timestamp: number }> = [];
  let connectionEvents: Array<{ type: 'connected' | 'disconnected'; ip: string; device: string; connectedCount: number; timestamp: number }> = [];
  const connectedClients = new Map<string, { key: string; ip: string; device: string; lastSeen: number }>();

  const pruneClients = () => {
    const now = Date.now();
    for (const [key, entry] of connectedClients.entries()) {
      if (now - entry.lastSeen > 12000) {
        connectedClients.delete(key);
        connectionEvents.push({
          type: 'disconnected',
          ip: entry.ip,
          device: entry.device,
          connectedCount: connectedClients.size,
          timestamp: now,
        });
      }
    }
  };

  return {
    name: 'freeworship-lan-bridge',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/lan-') && req.url !== '/ping' && req.url !== '/health') {
          return next();
        }

        // CORS headers so the standalone Android APK can connect from any local Wi-Fi IP
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Max-Age', '86400');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        pruneClients();
        const url = req.url || '';
        const rawIp = req.socket.remoteAddress || 'unknown';
        const cleanIp = rawIp.replace(/^::ffff:/i, '');
        const isClientQuery = url.includes('role=client') || url.includes('device=');
        const isOperator = url.includes('role=operator');

        if (!isOperator && (isClientQuery || (req.method === 'POST' && cleanIp !== '127.0.0.1' && cleanIp !== '::1'))) {
          let deviceName = 'Android 3rd Monitor';
          try {
            const parsed = new URL(url, 'http://localhost');
            const d = parsed.searchParams.get('device');
            if (d) deviceName = d;
          } catch {}
          const key = `${cleanIp}|${deviceName}`;
          const isNew = !connectedClients.has(key);
          const now = Date.now();
          connectedClients.set(key, { key, ip: cleanIp, device: deviceName, lastSeen: now });
          if (isNew) {
            connectionEvents.push({
              type: 'connected',
              ip: cleanIp,
              device: deviceName,
              connectedCount: connectedClients.size,
              timestamp: now,
            });
          }
        }

        if (req.url === '/ping' || req.url === '/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              app: 'FreeWorship',
              status: 'online',
              port: 5173,
              connectedClients: connectedClients.size,
              connectedDevices: connectedClients.size,
            })
          );
          return;
        }

        if (req.url.startsWith('/api/lan-info') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              app: 'FreeWorship',
              service: 'FreeWorship Studio LAN Server',
              ips: getLocalLanIps(),
              port: 5173,
              connectedClients: connectedClients.size,
              connectedDevices: connectedClients.size,
              devices: Array.from(connectedClients.values()),
            })
          );
          return;
        }

        if (req.url.startsWith('/api/lan-sync') && req.method === 'GET') {
          const pendingCommands = isOperator ? [...commandQueue] : [];
          if (isOperator && commandQueue.length > 0) {
            commandQueue = [];
          }
          const events = isOperator ? [...connectionEvents] : [];
          if (isOperator && connectionEvents.length > 0) {
            connectionEvents = [];
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              app: 'FreeWorship',
              state: latestPayload,
              payload: latestPayload,
              commands: pendingCommands,
              connectionEvents: events,
              ips: getLocalLanIps(),
              port: 5173,
              connectedClients: connectedClients.size,
              connectedDevices: connectedClients.size,
            })
          );
          return;
        }

        if (req.url.startsWith('/api/lan-sync') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              if (data.type === 'STATE_UPDATE' && data.payload) {
                latestPayload = data.payload;
              } else if (data.type === 'REMOTE_COMMAND' && data.command) {
                commandQueue.push({
                  id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  command: data.command,
                  timestamp: Date.now(),
                });
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), freeworshipLanBridgePlugin()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
