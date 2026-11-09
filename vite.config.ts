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
  const connectedClients = new Map<string, number>();

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

        const clientIp = req.socket.remoteAddress || 'unknown';
        connectedClients.set(clientIp, Date.now());
        // Prune clients inactive for > 15s
        const now = Date.now();
        for (const [ip, lastSeen] of connectedClients.entries()) {
          if (now - lastSeen > 15000) connectedClients.delete(ip);
        }

        if (req.url === '/ping' || req.url === '/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, app: 'FreeWorship', status: 'online', port: 5173 }));
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
              connectedDevices: connectedClients.size,
            })
          );
          return;
        }

        if (req.url.startsWith('/api/lan-sync') && req.method === 'GET') {
          const isOperator = req.url.includes('role=operator');
          const pendingCommands = isOperator ? [...commandQueue] : [];
          if (isOperator && commandQueue.length > 0) {
            commandQueue = [];
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              app: 'FreeWorship',
              state: latestPayload,
              payload: latestPayload,
              commands: pendingCommands,
              ips: getLocalLanIps(),
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
