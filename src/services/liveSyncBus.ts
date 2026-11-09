import {
  HardwareDisplayInfo,
  LiveBroadcastPayload,
  MultiScreenRoutingSettings,
  RemoteControlAction,
} from '../types/worship';

const CHANNEL_NAME = 'freeworship_live_sync_v1';
const STORAGE_KEY = 'freeworship_last_live_payload_v1';
const ROUTING_STORAGE_KEY = 'freeworship_multiscreen_routing_v1';

export const DEFAULT_ROUTING_SETTINGS: MultiScreenRoutingSettings = {
  projectorDisplayId: 'auto',
  stageDisplayId: 'auto',
  enableStageMonitor: true,
  projectorCustomBounds: { x: 1920, y: 0, width: 1920, height: 1080 },
  stageCustomBounds: { x: 3840, y: 0, width: 1920, height: 1080 },
  borderlessFullscreen: true,
  alwaysOnTop: true,
  keepOperatorFocus: true,
  hideCursorOnProjector: true,
  autoLaunchOnStartup: false,
  stageDisplayMode: 'confidence',
  stageFontSizeScale: 1.0,
  transition: {
    type: 'fade',
    durationMs: 380,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
};

export function loadPersistedRouting(): MultiScreenRoutingSettings {
  try {
    const raw = localStorage.getItem(ROUTING_STORAGE_KEY);
    if (!raw) return DEFAULT_ROUTING_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<MultiScreenRoutingSettings>;
    return {
      ...DEFAULT_ROUTING_SETTINGS,
      ...parsed,
      enableStageMonitor:
        parsed.enableStageMonitor !== undefined
          ? Boolean(parsed.enableStageMonitor)
          : DEFAULT_ROUTING_SETTINGS.enableStageMonitor,
    };
  } catch {
    return DEFAULT_ROUTING_SETTINGS;
  }
}

export function savePersistedRouting(settings: MultiScreenRoutingSettings): void {
  try {
    localStorage.setItem(ROUTING_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
  if (typeof window !== 'undefined' && window.freeworshipDesktop?.updateRouting) {
    window.freeworshipDesktop.updateRouting(settings);
  }
}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<{
      screens: Array<{
        label?: string;
        left: number;
        top: number;
        width: number;
        height: number;
        devicePixelRatio?: number;
        isPrimary?: boolean;
      }>;
    }>;
    freeworshipDesktop?: {
      isElectron: boolean;
      openWindow: (
        mode: 'projector' | 'stage' | 'stream',
        options?: Record<string, unknown>
      ) => Promise<{ open: boolean; displayId?: string | number }>;
      closeWindow: (mode: 'projector' | 'stage' | 'stream' | 'all') => Promise<unknown>;
      getStatus: () => Promise<{
        projectorOpen: boolean;
        stageOpen: boolean;
        streamOpen: boolean;
        displayCount: number;
        displays?: HardwareDisplayInfo[];
        lanIps?: string[];
        lanPort?: number;
      }>;
      getLanInfo?: () => Promise<{ ips: string[]; port: number }>;
      updateRouting?: (config: Partial<MultiScreenRoutingSettings>) => Promise<unknown>;
      broadcastState: (payload: LiveBroadcastPayload) => void;
      onStateSync: (callback: (payload: LiveBroadcastPayload) => void) => () => void;
      onRemoteCommand?: (callback: (command: RemoteControlAction) => void) => () => void;
      onWindowStatus: (callback: (status: any) => void) => () => void;
      saveUserSongs?: (songsJson: string) => Promise<{ ok: boolean; error?: string }>;
      loadUserSongs?: () => Promise<{ ok: boolean; data?: string | null; error?: string }>;
      loadBuiltInBibleFile?: (fileName: string) => Promise<string | null>;
      downloadAndInstallUpdate?: (url: string) => Promise<{ ok: boolean; error?: string }>;
      setupFirewallRule?: () => Promise<{ ok: boolean; code?: number; error?: string }>;
      onUpdateDownloadProgress?: (callback: (progress: { percent: number; bytesReceived: number; totalBytes: number; stage?: string }) => void) => () => void;
    };
  }
}

class LiveSyncBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(payload: LiveBroadcastPayload) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data) {
          this.notify(event.data as LiveBroadcastPayload);
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as LiveBroadcastPayload;
            this.notify(parsed);
          } catch {}
        }
      });

      if (window.freeworshipDesktop) {
        window.freeworshipDesktop.onStateSync((payload) => {
          this.notify(payload);
        });
      }
    }
  }

  private notify(payload: LiveBroadcastPayload) {
    this.listeners.forEach((cb) => cb(payload));
  }

  public publish(payload: LiveBroadcastPayload) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}

    if (this.channel) {
      this.channel.postMessage(payload);
    }

    if (typeof window !== 'undefined' && window.freeworshipDesktop) {
      window.freeworshipDesktop.broadcastState(payload);
    }

    // Also push state to local LAN Sync HTTP bridge so connected Android 3rd-Monitor + Controller apps stay synced
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      const origin = window.location.origin;
      if (origin.startsWith('http')) {
        fetch(`${origin}/api/lan-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'STATE_UPDATE', payload }),
        }).catch(() => {});
      } else {
        fetch('http://127.0.0.1:5174/api/lan-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'STATE_UPDATE', payload }),
        }).catch(() => {});
      }
    }
  }

  public getLastPayload(): LiveBroadcastPayload | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LiveBroadcastPayload) : null;
    } catch {
      return null;
    }
  }

  public subscribe(callback: (payload: LiveBroadcastPayload) => void): () => void {
    this.listeners.add(callback);
    const existing = this.getLastPayload();
    if (existing) {
      callback(existing);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const liveSyncBus = new LiveSyncBus();

export interface LanServerInfo {
  ips: string[];
  port: number;
  connectedClients: number;
}

export async function fetchLocalLanServerInfo(): Promise<LanServerInfo> {
  if (typeof window !== 'undefined' && window.freeworshipDesktop?.getStatus) {
    try {
      const status = await window.freeworshipDesktop.getStatus();
      if (status.lanIps && status.lanIps.length > 0) {
        return {
          ips: status.lanIps,
          port: status.lanPort || 5174,
          connectedClients: 0,
        };
      }
    } catch {}
  }

  if (typeof window !== 'undefined' && window.location.origin.startsWith('http')) {
    try {
      const res = await fetch(`${window.location.origin}/api/lan-info`);
      if (res.ok) {
        const data = await res.json();
        return {
          ips: Array.isArray(data.ips) && data.ips.length > 0 ? data.ips : ['127.0.0.1'],
          port: Number(data.port) || Number(window.location.port) || 5173,
          connectedClients: Number(data.connectedClients) || 0,
        };
      }
    } catch {}
  }

  return { ips: ['192.168.1.x'], port: 5173, connectedClients: 0 };
}

/**
 * Subscribes the Windows Operator Console to remote control actions coming from the Android APK
 * over either Electron IPC or the HTTP `/api/lan-sync?role=operator` endpoint.
 */
export function subscribeRemoteCommands(
  onCommand: (command: RemoteControlAction) => void
): () => void {
  let cleanups: Array<() => void> = [];

  if (typeof window !== 'undefined' && window.freeworshipDesktop?.onRemoteCommand) {
    const off = window.freeworshipDesktop.onRemoteCommand((cmd) => {
      onCommand(cmd);
    });
    cleanups.push(off);
  }

  if (typeof window !== 'undefined' && window.location.origin.startsWith('http')) {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/lan-sync?role=operator`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.commands) && data.commands.length > 0) {
          for (const item of data.commands) {
            if (item && item.command) {
              onCommand(item.command as RemoteControlAction);
            }
          }
        }
      } catch {}
    }, 240);
    cleanups.push(() => window.clearInterval(interval));
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

export function normalizeHostUrl(input: string): string {
  if (!input) return '';
  let trimmed = input.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  // Strip http:// or https:// prefix first
  trimmed = trimmed.replace(/^https?:\/\//i, '');

  // Strip any trailing path (e.g. /api/lan-sync or /)
  const slashIdx = trimmed.indexOf('/');
  if (slashIdx !== -1) {
    trimmed = trimmed.substring(0, slashIdx);
  }

  trimmed = trimmed.trim();
  if (!trimmed) return '';

  // If already contains a port, e.g. "192.168.68.130:5174"
  if (trimmed.includes(':')) {
    return `http://${trimmed}`;
  }

  // Default to port 5174 (Production LAN server)
  return `http://${trimmed}:5174`;
}

export async function sendRemoteCommandToHost(
  hostBaseUrl: string,
  command: RemoteControlAction,
  timeoutMs = 1500
): Promise<boolean> {
  const base = normalizeHostUrl(hostBaseUrl);
  if (!base) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/api/lan-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'REMOTE_COMMAND', command }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export async function fetchRemoteStateFromHost(
  hostBaseUrl: string,
  deviceName = 'Android-3rd-Monitor',
  timeoutMs = 1500
): Promise<LiveBroadcastPayload | null> {
  const base = normalizeHostUrl(hostBaseUrl);
  if (!base) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${base}/api/lan-sync?role=client&device=${encodeURIComponent(deviceName)}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return ((data.payload || data.state) as LiveBroadcastPayload) || null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Enumerates all connected physical displays via Electron `screen.getAllDisplays()`
 * or the Chromium Multi-Screen Window Placement API (`window.getScreenDetails()`),
 * falling back to 3 standard virtual display slots if running in a single-screen browser.
 */
export async function detectConnectedDisplays(): Promise<HardwareDisplayInfo[]> {
  if (typeof window !== 'undefined' && window.freeworshipDesktop) {
    try {
      const status = await window.freeworshipDesktop.getStatus();
      if (status.displays && status.displays.length > 0) {
        return status.displays;
      }
    } catch {}
  }

  if (typeof window !== 'undefined' && typeof window.getScreenDetails === 'function') {
    try {
      const details = await window.getScreenDetails();
      if (details.screens && details.screens.length > 0) {
        return details.screens.map((s, idx) => ({
          id: `screen-${idx + 1}`,
          index: idx + 1,
          label: s.label || `Display ${idx + 1} (${s.width}x${s.height})`,
          x: s.left,
          y: s.top,
          width: s.width,
          height: s.height,
          scaleFactor: s.devicePixelRatio || 1,
          isPrimary: Boolean(s.isPrimary ?? idx === 0),
        }));
      }
    } catch {}
  }

  const w = typeof window !== 'undefined' ? window.screen.width || 1920 : 1920;
  const h = typeof window !== 'undefined' ? window.screen.height || 1080 : 1080;

  return [
    {
      id: 'display-1',
      index: 1,
      label: `Display 1 — Primary Operator Screen (${w}x${h})`,
      x: 0,
      y: 0,
      width: w,
      height: h,
      isPrimary: true,
    },
    {
      id: 'display-2',
      index: 2,
      label: `Display 2 — Extended HDMI / Projector (${w}x${h} @ X:${w})`,
      x: w,
      y: 0,
      width: w,
      height: h,
      isPrimary: false,
    },
    {
      id: 'display-3',
      index: 3,
      label: `Display 3 — Extended Stage Monitor (${w}x${h} @ X:${w * 2})`,
      x: w * 2,
      y: 0,
      width: w,
      height: h,
      isPrimary: false,
    },
  ];
}

export async function openExternalDisplayWindow(
  mode: 'projector' | 'stage' | 'stream',
  routingOverride?: MultiScreenRoutingSettings,
  displaysList?: HardwareDisplayInfo[]
) {
  const routing = routingOverride || loadPersistedRouting();

  if (mode === 'stage' && routing.enableStageMonitor === false) {
    return { open: false, disabled: true };
  }

  // 1. Native Electron Multi-Monitor Borderless Fullscreen Launch
  if (typeof window !== 'undefined' && window.freeworshipDesktop) {
    const targetDisplayId =
      mode === 'projector'
        ? routing.projectorDisplayId
        : mode === 'stage'
        ? routing.stageDisplayId
        : 'auto';

    return window.freeworshipDesktop.openWindow(mode, {
      displayId: targetDisplayId,
      projectorDisplayId: routing.projectorDisplayId,
      stageDisplayId: routing.stageDisplayId,
      enableStageMonitor: routing.enableStageMonitor,
      borderlessFullscreen: routing.borderlessFullscreen,
      alwaysOnTop: routing.alwaysOnTop,
      keepOperatorFocus: routing.keepOperatorFocus,
    });
  }

  // 2. Browser Multi-Screen Popup + Fullscreen Launch
  const displays = displaysList || (await detectConnectedDisplays());
  const nonPrimary = displays.filter((d) => !d.isPrimary);

  let targetBounds = {
    x: mode === 'projector' ? routing.projectorCustomBounds.x : routing.stageCustomBounds.x,
    y: mode === 'projector' ? routing.projectorCustomBounds.y : routing.stageCustomBounds.y,
    width:
      mode === 'projector'
        ? routing.projectorCustomBounds.width
        : routing.stageCustomBounds.width,
    height:
      mode === 'projector'
        ? routing.projectorCustomBounds.height
        : routing.stageCustomBounds.height,
  };

  const selectedId =
    mode === 'projector' ? routing.projectorDisplayId : routing.stageDisplayId;

  if (selectedId === 'auto') {
    const autoDisp =
      mode === 'projector'
        ? nonPrimary[0] || displays[0]
        : nonPrimary[1] || nonPrimary[0] || displays[0];
    if (autoDisp) {
      targetBounds = {
        x: autoDisp.x,
        y: autoDisp.y,
        width: autoDisp.width,
        height: autoDisp.height,
      };
    }
  } else if (selectedId !== 'custom') {
    const matched = displays.find((d) => String(d.id) === String(selectedId));
    if (matched) {
      targetBounds = {
        x: matched.x,
        y: matched.y,
        width: matched.width,
        height: matched.height,
      };
    }
  }

  const fsParam = routing.borderlessFullscreen ? '&fullscreen=1' : '';
  const url = `${window.location.origin}${window.location.pathname}?view=${mode}${fsParam}`;
  const features = `popup=yes,left=${targetBounds.x},top=${targetBounds.y},width=${targetBounds.width},height=${targetBounds.height},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`;

  const win = window.open(url, `freeworship_${mode}`, features);
  if (win) {
    try {
      win.moveTo(targetBounds.x, targetBounds.y);
      win.resizeTo(targetBounds.width, targetBounds.height);
    } catch {}
  }
  return { open: true };
}

export async function closeExternalDisplayWindow(
  mode: 'projector' | 'stage' | 'stream' | 'all'
) {
  if (typeof window !== 'undefined' && window.freeworshipDesktop) {
    return window.freeworshipDesktop.closeWindow(mode);
  }
}
