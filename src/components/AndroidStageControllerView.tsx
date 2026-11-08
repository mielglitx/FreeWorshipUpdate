import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  ListMusic,
  Music,
  BookOpen,
  Plus,
  Play,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { LiveBroadcastPayload, RemoteControlAction, Slide } from '../types/worship';
import {
  fetchRemoteStateFromHost,
  liveSyncBus,
  normalizeHostUrl,
  sendRemoteCommandToHost,
} from '../services/liveSyncBus';
import {
  DEFAULT_MEDIA_POOL,
  DEFAULT_SERVICE_SCHEDULE,
  DEFAULT_SONGS,
  DEFAULT_THEMES,
} from '../data/defaultData';
import { BIBLE_BOOKS_66 } from '../services/bibleImporter';
import { WelcomeAboutModal } from './SystemModals';

const SAVED_HOST_KEY = 'freeworship_android_host_url_v1';

type AndroidLayoutMode = 'split' | 'stage-only' | 'controller-only';

// Discover the Android device's own local IPv4 prefix via WebRTC ICE host candidates
async function detectLocalSubnetPrefix(): Promise<string[]> {
  const foundPrefixes = new Set<string>();
  try {
    const RTCPeer =
      window.RTCPeerConnection ||
      (window as unknown as { webkitRTCPeerConnection?: typeof RTCPeerConnection })
        .webkitRTCPeerConnection;
    if (!RTCPeer) return [];
    const pc = new RTCPeer({ iceServers: [] });
    pc.createDataChannel('lan-probe');
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 600);
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        const cand = e.candidate.candidate || '';
        const ipMatch = cand.match(/\b((?:192\.168|10\.\d+|172\.(?:1[6-9]|2\d|3[0-1]))\.\d+)\.\d+\b/);
        if (ipMatch && ipMatch[1]) {
          foundPrefixes.add(ipMatch[1]);
        }
      };
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => resolve());
    });
    pc.close();
  } catch {}
  return Array.from(foundPrefixes);
}

export const AndroidStageControllerView: React.FC = () => {
  const [hostInput, setHostInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SAVED_HOST_KEY);
      if (saved) return saved;
    } catch {}
    if (
      typeof window !== 'undefined' &&
      window.location.origin.startsWith('http') &&
      !window.location.hostname.includes('localhost')
    ) {
      return window.location.host;
    }
    return '192.168.1.131:5173';
  });

  const [activeHost, setActiveHost] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SAVED_HOST_KEY);
      if (saved) return saved;
    } catch {}
    if (
      typeof window !== 'undefined' &&
      window.location.origin.startsWith('http') &&
      !window.location.hostname.includes('localhost')
    ) {
      return window.location.origin;
    }
    return '192.168.1.131:5173';
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [layoutMode, setLayoutMode] = useState<AndroidLayoutMode>('split');
  const [controllerTab, setControllerTab] = useState<
    'slides' | 'schedule' | 'add-item' | 'stage-tools'
  >('slides');
  const [clock, setClock] = useState<string>('');
  const [customAlertInput, setCustomAlertInput] = useState('');
  const [stageFontScale, setStageFontScale] = useState<number>(1.0);

  // Android Remote Add Song / Bible Verse State
  const [songSearchQuery, setSongSearchQuery] = useState<string>('');
  const [remoteBibleTranslation, setRemoteBibleTranslation] = useState<string>('KJV');
  const [remoteBibleBook, setRemoteBibleBook] = useState<string>('John');
  const [remoteBibleChapter, setRemoteBibleChapter] = useState<number>(3);
  const [remoteBibleVerseRange, setRemoteBibleVerseRange] = useState<string>('16');
  const [remoteBibleQuickRef, setRemoteBibleQuickRef] = useState<string>('');
  const [remoteActionNotice, setRemoteActionNotice] = useState<string>('');
  const [uiColorTheme, setUiColorTheme] = useState<'dark' | 'dark-gray' | 'gray' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('freeworship_ui_color_theme_v1') as
        | 'dark'
        | 'dark-gray'
        | 'gray'
        | 'light'
        | null;
      if (saved === 'light' || saved === 'gray' || saved === 'dark-gray' || saved === 'dark') {
        return saved;
      }
    } catch {}
    return 'dark';
  });

  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-ui-theme', uiColorTheme);
      localStorage.setItem('freeworship_ui_color_theme_v1', uiColorTheme);
    } catch {}
  }, [uiColorTheme]);

  const defaultItem = DEFAULT_SERVICE_SCHEDULE[1] || DEFAULT_SERVICE_SCHEDULE[0];
  const [payload, setPayload] = useState<LiveBroadcastPayload>(() => {
    const existing = liveSyncBus.getLastPayload();
    if (existing) return existing;
    return {
      activeItemId: defaultItem.id,
      activeItemTitle: defaultItem.title,
      activeItemSubtitle: defaultItem.subtitle,
      activeSlideIndex: 0,
      currentSlide: defaultItem.slides[0] || null,
      nextSlide: defaultItem.slides[1] || null,
      activeItemSlides: defaultItem.slides,
      scheduleSummary: DEFAULT_SERVICE_SCHEDULE.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        slideCount: s.slides.length,
      })),
      background: DEFAULT_MEDIA_POOL[0],
      theme: DEFAULT_THEMES[0],
      panic: {
        blackout: false,
        logoMode: false,
        clearText: false,
      },
      stageAlert: {
        message: '',
        active: false,
        urgent: false,
      },
      countdown: {
        secondsRemaining: 300,
        running: false,
        label: 'Stage Timer',
      },
      logoTitle: 'FREEWORSHIP SANCTUARY',
      logoSubtitle: 'WORSHIP • WORD • COMMUNITY',
      timestamp: Date.now(),
    };
  });

  // Wall clock update
  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Local BroadcastChannel fallback (if opened on same machine)
  useEffect(() => {
    return liveSyncBus.subscribe((incoming) => {
      setPayload(incoming);
      setIsConnected(true);
      setLastSyncTime(Date.now());
    });
  }, []);

  // Poll Windows Host over LAN Wi-Fi every 200ms (automatically tries port 5174 & 5173)
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!activeHost) return;
      let remoteState = await fetchRemoteStateFromHost(activeHost, 'Android-3rdMonitor-APK');
      if (!remoteState) {
        const normalized = normalizeHostUrl(activeHost);
        if (normalized.endsWith(':5173')) {
          remoteState = await fetchRemoteStateFromHost(
            normalized.replace(':5173', ':5174'),
            'Android-3rdMonitor-APK'
          );
        } else if (normalized.endsWith(':5174')) {
          remoteState = await fetchRemoteStateFromHost(
            normalized.replace(':5174', ':5173'),
            'Android-3rdMonitor-APK'
          );
        }
      }
      if (!active) return;
      if (remoteState) {
        setPayload(remoteState);
        setIsConnected(true);
        setLastSyncTime(Date.now());
      } else {
        if (Date.now() - lastSyncTime > 2500) {
          setIsConnected(false);
        }
      }
    };

    poll();
    const interval = window.setInterval(poll, 200);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [activeHost, lastSyncTime]);

  const connectToHost = (target: string) => {
    const cleaned = target.trim();
    setHostInput(cleaned);
    setActiveHost(cleaned);
    try {
      localStorage.setItem(SAVED_HOST_KEY, cleaned);
    } catch {}
  };

  // Auto-scan subnet for Windows PC running FreeWorship
  const handleAutoScanWifi = async () => {
    setIsScanning(true);
    setScanProgressText('Detecting Wi-Fi...');
    try {
      const prefixSet = new Set<string>();

      // 1. Check WebRTC ICE host candidates for the Android device's exact local subnet
      const rtcPrefixes = await detectLocalSubnetPrefix();
      rtcPrefixes.forEach((p) => prefixSet.add(p));

      // 2. Check current hostInput prefix if user typed or saved an IP previously
      const ipMatch = hostInput.match(/(\d+\.\d+\.\d+)\.\d+/);
      if (ipMatch && ipMatch[1]) {
        prefixSet.add(ipMatch[1]);
      }

      // 3. Add common home/church router subnets (PLDT, Globe, Converge, TP-Link, Huawei, Mobile Hotspots)
      [
        '192.168.1',
        '192.168.0',
        '192.168.254',
        '192.168.100',
        '192.168.8',
        '192.168.18',
        '192.168.50',
        '10.0.0',
        '172.20.10',
        '192.168.43',
      ].forEach((p) => prefixSet.add(p));

      const prefixes = Array.from(prefixSet);

      const probeHost = async (ipPort: string, timeoutMs = 850): Promise<string | null> => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
          const res = await fetch(`http://${ipPort}/api/lan-info`, {
            signal: ctrl.signal,
            cache: 'no-store',
          });
          clearTimeout(timer);
          if (res.ok) {
            const info = await res.json();
            if (info && (info.app === 'FreeWorship' || info.ok === true)) {
              return ipPort;
            }
          }
        } catch {}
        clearTimeout(timer);
        return null;
      };

      // Quick probe of currently entered host on both port 5174 (Windows .exe) and 5173 (Dev)
      const cleanCurrentIp = hostInput.replace(/^https?:\/\//, '').split(':')[0];
      if (cleanCurrentIp && /^\d+\.\d+\.\d+\.\d+$/.test(cleanCurrentIp)) {
        const quickHit =
          (await probeHost(`${cleanCurrentIp}:5174`, 600)) ||
          (await probeHost(`${cleanCurrentIp}:5173`, 600));
        if (quickHit) {
          connectToHost(quickHit);
          setIsConnected(true);
          return;
        }
      }

      // Scan each subnet prefix across all 2..254 addresses on both port 5174 and 5173
      for (const prefix of prefixes) {
        setScanProgressText(`Scanning ${prefix}.x...`);
        const hostCandidates: string[] = [];
        // Prioritize common DHCP ranges first, then full 2..254 sweep
        const priorityOctets: number[] = [];
        for (let i = 100; i <= 150; i++) priorityOctets.push(i);
        for (let i = 2; i < 100; i++) priorityOctets.push(i);
        for (let i = 151; i <= 254; i++) priorityOctets.push(i);

        for (const octet of priorityOctets) {
          hostCandidates.push(`${prefix}.${octet}:5174`);
          hostCandidates.push(`${prefix}.${octet}:5173`);
        }

        const batchSize = 40;
        for (let i = 0; i < hostCandidates.length; i += batchSize) {
          const batch = hostCandidates.slice(i, i + batchSize);
          const results = await Promise.all(batch.map((hp) => probeHost(hp, 850)));
          const found = results.find((r) => r !== null);
          if (found) {
            connectToHost(found);
            setIsConnected(true);
            setScanProgressText(`Connected ${found}`);
            return;
          }
        }
      }
      setScanProgressText('No PC found');
    } finally {
      setIsScanning(false);
    }
  };

  const dispatchRemoteAction = async (command: RemoteControlAction) => {
    // Optimistic UI update on Android screen for instant zero-latency feel
    if (command.action === 'SELECT_SLIDE' && payload.activeItemSlides) {
      const targetSlide = payload.activeItemSlides[command.index];
      if (targetSlide) {
        setPayload((prev) => ({
          ...prev,
          activeSlideIndex: command.index,
          currentSlide: targetSlide,
          nextSlide: prev.activeItemSlides?.[command.index + 1] || null,
        }));
      }
    } else if (command.action === 'NEXT_SLIDE' && payload.activeItemSlides) {
      const nextIdx = Math.min(
        payload.activeItemSlides.length - 1,
        payload.activeSlideIndex + 1
      );
      const targetSlide = payload.activeItemSlides[nextIdx];
      if (targetSlide) {
        setPayload((prev) => ({
          ...prev,
          activeSlideIndex: nextIdx,
          currentSlide: targetSlide,
          nextSlide: prev.activeItemSlides?.[nextIdx + 1] || null,
        }));
      }
    } else if (command.action === 'PREV_SLIDE' && payload.activeItemSlides) {
      const prevIdx = Math.max(0, payload.activeSlideIndex - 1);
      const targetSlide = payload.activeItemSlides[prevIdx];
      if (targetSlide) {
        setPayload((prev) => ({
          ...prev,
          activeSlideIndex: prevIdx,
          currentSlide: targetSlide,
          nextSlide: prev.activeItemSlides?.[prevIdx + 1] || null,
        }));
      }
    } else if (command.action === 'TOGGLE_PANIC') {
      setPayload((prev) => ({
        ...prev,
        panic: {
          ...prev.panic,
          [command.key]: !prev.panic[command.key],
        },
      }));
    } else if (command.action === 'RESTORE_PANIC') {
      setPayload((prev) => ({
        ...prev,
        panic: { blackout: false, logoMode: false, clearText: false },
      }));
    }

    const ok = await sendRemoteCommandToHost(activeHost, command);
    if (!ok) {
      const normalized = normalizeHostUrl(activeHost);
      if (normalized.endsWith(':5173')) {
        await sendRemoteCommandToHost(normalized.replace(':5173', ':5174'), command);
      } else if (normalized.endsWith(':5174')) {
        await sendRemoteCommandToHost(normalized.replace(':5174', ':5173'), command);
      }
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const slides: Slide[] =
    payload.activeItemSlides && payload.activeItemSlides.length > 0
      ? payload.activeItemSlides
      : payload.currentSlide
      ? [payload.currentSlide]
      : [];

  const scheduleList = payload.scheduleSummary || [];
  const songsCatalog =
    payload.songsCatalog && payload.songsCatalog.length > 0
      ? payload.songsCatalog
      : DEFAULT_SONGS.map((s) => ({
          id: s.id,
          title: s.title,
          author: s.author,
          musicalKey: s.musicalKey,
          slideCount: s.slides.length,
        }));

  const triggerRemoteNotice = (msg: string) => {
    setRemoteActionNotice(msg);
    setTimeout(() => setRemoteActionNotice(''), 2800);
  };

  return (
    <div
      data-ui-theme={uiColorTheme}
      className="ui-console-shell h-screen w-screen bg-booth-950 text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Android Status & Wi-Fi Sync Bar */}
      <header className="bg-booth-900 border-b border-booth-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Smartphone className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs tracking-wider uppercase text-white">
                FreeWorship Android
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isConnected
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    LIVE 3RD SCREEN
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                    CONNECT WINDOWS PC
                  </>
                )}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Dedicated 3rd Monitor (Stage Confidence) & Projector Controller
            </p>
          </div>
        </div>

        {/* Windows PC IP Connection Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[10px] font-bold text-slate-500 mr-1.5">PC IP:</span>
            <input
              type="text"
              value={hostInput}
              onChange={(e) => setHostInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') connectToHost(hostInput);
              }}
              placeholder="192.168.1.131:5173"
              className="bg-transparent text-xs font-mono text-amber-300 focus:outline-none w-36"
            />
            <button
              onClick={() => connectToHost(hostInput)}
              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition ml-1"
            >
              Connect
            </button>
          </div>

          <button
            onClick={handleAutoScanWifi}
            disabled={isScanning}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-200 text-[11px] font-bold transition disabled:opacity-50"
            title="Auto-discover Windows PC on Wi-Fi"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? scanProgressText || 'Scanning Wi-Fi...' : 'Scan PC'}
          </button>

          {/* App UI Color Theme Selector */}
          <select
            value={uiColorTheme}
            onChange={(e) =>
              setUiColorTheme(e.target.value as 'dark' | 'dark-gray' | 'gray' | 'light')
            }
            className="px-2 py-1.5 bg-booth-950 border border-booth-700 text-slate-200 text-[10px] font-bold focus:outline-none"
          >
            <option value="dark">Dark</option>
            <option value="dark-gray">Dark Gray</option>
            <option value="gray">Gray</option>
            <option value="light">Light</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                layoutMode === 'split'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3rd Monitor + Remote
            </button>
            <button
              onClick={() => setLayoutMode('stage-only')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                layoutMode === 'stage-only'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full 3rd Monitor
            </button>
            <button
              onClick={() => setLayoutMode('controller-only')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                layoutMode === 'controller-only'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Controller
            </button>
          </div>

          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-200 text-[10px] font-bold transition ml-auto"
            title="About FreeWorship, GCash Donation & Changelog"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            About / Updates
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================= SECTION 1: 3RD MONITOR (STAGE CONFIDENCE DISPLAY) ================= */}
        {(layoutMode === 'split' || layoutMode === 'stage-only') && (
          <div
            className={`${
              layoutMode === 'stage-only'
                ? 'flex-1 h-full'
                : 'h-[46%] lg:h-full lg:w-[48%] border-b lg:border-b-0 lg:border-r border-slate-800'
            } bg-black flex flex-col justify-between p-3 sm:p-5 relative overflow-hidden`}
          >
            {/* Stage Monitor Top Info Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] uppercase tracking-widest shrink-0">
                  3RD MONITOR • STAGE
                </span>
                <div className="truncate">
                  <h2 className="text-sm sm:text-base font-bold text-white truncate">
                    {payload.activeItemTitle}
                  </h2>
                  {payload.activeItemSubtitle && (
                    <p className="text-[11px] text-amber-400 font-medium truncate">
                      {payload.activeItemSubtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Clock & Countdown Timer */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`px-2.5 py-1 rounded-lg border text-right ${
                    payload.countdown.secondsRemaining <= 30 && payload.countdown.running
                      ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-amber-400'
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Timer</div>
                  <div className="text-sm sm:text-base font-mono font-black leading-none">
                    {formatTimer(payload.countdown.secondsRemaining)}
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-right">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Clock</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-white leading-none">
                    {clock}
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Alert Banner (if active) */}
            {payload.stageAlert?.active && payload.stageAlert.message && (
              <div className="my-2 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-between shadow-lg animate-pulse shrink-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>STAGE ALERT: {payload.stageAlert.message}</span>
                </div>
                <button
                  onClick={() => dispatchRemoteAction({ action: 'CLEAR_ALERT' })}
                  className="px-2 py-0.5 rounded bg-slate-950/20 hover:bg-slate-950/30 text-[10px] uppercase font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Current & Next Slide Confidence View */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 my-2 min-h-0 overflow-hidden">
              {/* LIVE NOW SLIDE */}
              <div className="sm:col-span-7 bg-slate-900/80 border-2 border-emerald-500/50 rounded-2xl p-3 sm:p-5 flex flex-col justify-between relative overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-widest">
                    ON AIR PROJECTOR • {payload.currentSlide?.tag || 'Slide'} (
                    {payload.activeSlideIndex + 1}/{Math.max(1, slides.length)})
                  </span>
                  <div className="flex items-center gap-1">
                    {(payload.panic.blackout ||
                      payload.panic.logoMode ||
                      payload.panic.clearText) && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold uppercase">
                        {payload.panic.blackout
                          ? 'BLACKOUT'
                          : payload.panic.logoMode
                          ? 'LOGO'
                          : 'TEXT CLEARED'}
                      </span>
                    )}
                    <button
                      onClick={() =>
                        setStageFontScale((s) => Math.max(0.75, +(s - 0.15).toFixed(2)))
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold"
                    >
                      A-
                    </button>
                    <button
                      onClick={() =>
                        setStageFontScale((s) => Math.min(1.6, +(s + 0.15).toFixed(2)))
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Chords Banner for Band */}
                {payload.currentSlide?.chords && (
                  <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs sm:text-base font-bold tracking-wider">
                    ♪ {payload.currentSlide.chords}
                  </div>
                )}

                <div
                  className="my-auto font-bold text-white leading-snug whitespace-pre-line"
                  style={{
                    fontSize: `calc(${
                      layoutMode === 'stage-only' ? '2.1rem' : '1.35rem'
                    } * ${stageFontScale})`,
                  }}
                >
                  {payload.currentSlide ? (
                    payload.currentSlide.lines.join('\n')
                  ) : (
                    <span className="text-slate-600 italic">No active slide</span>
                  )}
                </div>

                {payload.currentSlide?.subtext && (
                  <div className="mt-2 text-xs sm:text-sm font-semibold text-emerald-400">
                    {payload.currentSlide.subtext}
                  </div>
                )}
              </div>

              {/* UP NEXT SLIDE */}
              <div className="sm:col-span-5 bg-slate-900/45 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-widest">
                    UP NEXT • {payload.nextSlide?.tag || 'End of Item'}
                  </span>
                </div>

                {payload.nextSlide?.chords && (
                  <div className="mt-1 px-2.5 py-1 rounded-lg bg-slate-800/90 text-amber-300/90 font-mono text-xs font-bold">
                    ♪ {payload.nextSlide.chords}
                  </div>
                )}

                <div
                  className="my-auto text-slate-300 font-semibold leading-snug whitespace-pre-line"
                  style={{
                    fontSize: `calc(${
                      layoutMode === 'stage-only' ? '1.35rem' : '0.95rem'
                    } * ${stageFontScale})`,
                  }}
                >
                  {payload.nextSlide ? (
                    payload.nextSlide.lines.join('\n')
                  ) : (
                    <span className="text-slate-600 italic">End of current item</span>
                  )}
                </div>

                {/* Quick Next Tap Zone right inside the Stage Monitor */}
                <button
                  onClick={() => dispatchRemoteAction({ action: 'NEXT_SLIDE' })}
                  className="mt-2 w-full py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95"
                >
                  Tap to Project Next Slide <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stage Monitor Footer Quick Prev / Next Overlay (in Full 3rd Monitor mode) */}
            {layoutMode === 'stage-only' && (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => dispatchRemoteAction({ action: 'PREV_SLIDE' })}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" /> PREVIOUS SLIDE
                </button>
                <button
                  onClick={() => dispatchRemoteAction({ action: 'NEXT_SLIDE' })}
                  className="flex-[1.5] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  NEXT SLIDE (PROJECT LIVE) <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 2: REMOTE PROJECTOR CONTROLLER DECK ================= */}
        {(layoutMode === 'split' || layoutMode === 'controller-only') && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Big Touch Transport & Projector Panic Controls */}
            <div className="p-2.5 sm:p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-2 shrink-0">
              {/* Row 1: Giant PREV / NEXT Buttons */}
              <div className="grid grid-cols-12 gap-2">
                <button
                  onClick={() => dispatchRemoteAction({ action: 'PREV_SLIDE' })}
                  className="col-span-5 py-3 sm:py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" /> PREV SLIDE
                </button>

                <button
                  onClick={() => dispatchRemoteAction({ action: 'NEXT_SLIDE' })}
                  className="col-span-7 py-3 sm:py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95"
                >
                  NEXT SLIDE (LIVE) <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Row 2: Projector Panic Override Controls (Blackout / Logo / Clear Lyrics / Restore) */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() =>
                    dispatchRemoteAction({ action: 'TOGGLE_PANIC', key: 'blackout' })
                  }
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition ${
                    payload.panic.blackout
                      ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" /> Blackout
                </button>

                <button
                  onClick={() =>
                    dispatchRemoteAction({ action: 'TOGGLE_PANIC', key: 'logoMode' })
                  }
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition ${
                    payload.panic.logoMode
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Logo
                </button>

                <button
                  onClick={() =>
                    dispatchRemoteAction({ action: 'TOGGLE_PANIC', key: 'clearText' })
                  }
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition ${
                    payload.panic.clearText
                      ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-lg shadow-sky-500/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Clear Text
                </button>

                <button
                  onClick={() => dispatchRemoteAction({ action: 'RESTORE_PANIC' })}
                  className="py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Restore
                </button>
              </div>
            </div>

            {/* Controller Navigation Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-900/50 px-3 pt-1.5 gap-1.5 shrink-0 overflow-x-auto">
              <button
                onClick={() => setControllerTab('slides')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                  controllerTab === 'slides'
                    ? 'border-amber-500 text-amber-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Live Slides ({slides.length})
              </button>

              <button
                onClick={() => setControllerTab('schedule')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                  controllerTab === 'schedule'
                    ? 'border-amber-500 text-amber-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" /> Schedule ({scheduleList.length})
              </button>

              <button
                onClick={() => setControllerTab('add-item')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                  controllerTab === 'add-item'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                    : 'border-transparent text-emerald-300/80 hover:text-emerald-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> + Add Song / Verse
              </button>

              <button
                onClick={() => setControllerTab('stage-tools')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                  controllerTab === 'stage-tools'
                    ? 'border-amber-500 text-amber-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Timer & Alerts
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {/* TAB 1: SLIDES REMOTE GRID */}
              {controllerTab === 'slides' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {slides.map((slide, idx) => {
                    const isLive = idx === payload.activeSlideIndex;
                    const isNext = idx === payload.activeSlideIndex + 1;
                    return (
                      <button
                        key={slide.id || idx}
                        onClick={() =>
                          dispatchRemoteAction({ action: 'SELECT_SLIDE', index: idx })
                        }
                        className={`text-left p-3 rounded-xl border-2 transition flex flex-col justify-between min-h-[104px] active:scale-[0.99] ${
                          isLive
                            ? 'bg-emerald-950/35 border-emerald-500 shadow-lg shadow-emerald-500/10'
                            : isNext
                            ? 'bg-amber-950/20 border-amber-500/60'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                              {slide.tag}
                            </span>
                          </div>
                          {isLive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-widest">
                              LIVE ON PROJECTOR
                            </span>
                          )}
                          {isNext && !isLive && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase">
                              NEXT
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-medium text-slate-100 whitespace-pre-line line-clamp-3 leading-snug">
                          {slide.lines.join('\n')}
                        </p>

                        {slide.chords && (
                          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[11px] font-mono text-amber-400 truncate">
                            ♪ {slide.chords}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: SERVICE SCHEDULE SWITCHER */}
              {controllerTab === 'schedule' && (
                <div className="space-y-2">
                  {scheduleList.map((item, idx) => {
                    const isSelected = item.id === payload.activeItemId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          dispatchRemoteAction({ action: 'SELECT_ITEM', itemId: item.id });
                          setControllerTab('slides');
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500 text-white'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                                {item.type}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {item.slideCount} slides
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white truncate mt-0.5">
                              {item.title}
                            </h4>
                            {item.subtitle && (
                              <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                              LIVE NOW
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1">
                              <Play className="w-3 h-3 fill-current" /> Project
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 2.5: ADD SONG OR BIBLE VERSE TO SCHEDULE REMOTELY */}
              {controllerTab === 'add-item' && (
                <div className="space-y-4">
                  {remoteActionNotice && (
                    <div className="px-3 py-2 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <span>✓ {remoteActionNotice}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* REMOTE ADD BIBLE SCRIPTURE TO SCHEDULE */}
                    <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" /> Add Bible Verse / Passage to Schedule
                        </span>
                        <select
                          value={remoteBibleTranslation}
                          onChange={(e) => setRemoteBibleTranslation(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-[10px] font-bold text-amber-300"
                        >
                          <option value="KJV">KJV</option>
                          <option value="NIV">NIV</option>
                          <option value="NASB">NASB</option>
                          <option value="ESV">ESV</option>
                          <option value="MBB 1901">MBB 1901</option>
                        </select>
                      </div>

                      {/* Option A: Quick Book / Chapter / Verse Picker */}
                      <div className="grid grid-cols-12 gap-1.5">
                        <select
                          value={remoteBibleBook}
                          onChange={(e) => {
                            setRemoteBibleBook(e.target.value);
                            setRemoteBibleChapter(1);
                          }}
                          className="col-span-6 bg-slate-950 border-2 border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white"
                        >
                          {BIBLE_BOOKS_66.map((b) => (
                            <option key={b.name} value={b.name}>
                              {b.number}. {b.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={remoteBibleChapter}
                          onChange={(e) => setRemoteBibleChapter(Number(e.target.value))}
                          className="col-span-3 bg-slate-950 border-2 border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-amber-300"
                        >
                          {Array.from(
                            {
                              length:
                                BIBLE_BOOKS_66.find((b) => b.name === remoteBibleBook)?.chapters ||
                                150,
                            },
                            (_, i) => i + 1
                          ).map((ch) => (
                            <option key={ch} value={ch}>
                              Ch. {ch}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={remoteBibleVerseRange}
                          onChange={(e) => setRemoteBibleVerseRange(e.target.value)}
                          placeholder="16 or 1-6"
                          className="col-span-3 bg-slate-950 border-2 border-slate-700 rounded-xl px-2 py-2 text-xs font-mono text-white text-center"
                          title="Verse number or range (e.g. 16 or 1-6)"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const vPart = remoteBibleVerseRange.trim() || '1';
                            const refStr = `${remoteBibleBook} ${remoteBibleChapter}:${vPart}`;
                            dispatchRemoteAction({
                              action: 'ADD_SCRIPTURE_TO_SCHEDULE',
                              reference: refStr,
                              translation: remoteBibleTranslation,
                              goLive: false,
                            });
                            triggerRemoteNotice(`Added ${refStr} (${remoteBibleTranslation}) to Schedule`);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-amber-300 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Add {remoteBibleBook} {remoteBibleChapter}:{remoteBibleVerseRange || '1'}
                        </button>

                        <button
                          onClick={() => {
                            const vPart = remoteBibleVerseRange.trim() || '1';
                            const refStr = `${remoteBibleBook} ${remoteBibleChapter}:${vPart}`;
                            dispatchRemoteAction({
                              action: 'ADD_SCRIPTURE_TO_SCHEDULE',
                              reference: refStr,
                              translation: remoteBibleTranslation,
                              goLive: true,
                            });
                            triggerRemoteNotice(`Projected ${refStr} (${remoteBibleTranslation}) Live!`);
                            setControllerTab('slides');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Project Live Now
                        </button>
                      </div>

                      {/* Option B: Direct Reference Text Input */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Or Type Any Reference (e.g. John 3:16-17, Psalms 23:1-6, Romans 8:28):
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={remoteBibleQuickRef}
                            onChange={(e) => setRemoteBibleQuickRef(e.target.value)}
                            placeholder="e.g. Psalms 23:1-6"
                            className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <button
                            onClick={() => {
                              if (!remoteBibleQuickRef.trim()) return;
                              dispatchRemoteAction({
                                action: 'ADD_SCRIPTURE_TO_SCHEDULE',
                                reference: remoteBibleQuickRef.trim(),
                                translation: remoteBibleTranslation,
                                goLive: false,
                              });
                              triggerRemoteNotice(
                                `Added ${remoteBibleQuickRef.trim()} (${remoteBibleTranslation}) to Schedule`
                              );
                              setRemoteBibleQuickRef('');
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shrink-0"
                          >
                            + Schedule
                          </button>
                          <button
                            onClick={() => {
                              if (!remoteBibleQuickRef.trim()) return;
                              dispatchRemoteAction({
                                action: 'ADD_SCRIPTURE_TO_SCHEDULE',
                                reference: remoteBibleQuickRef.trim(),
                                translation: remoteBibleTranslation,
                                goLive: true,
                              });
                              triggerRemoteNotice(
                                `Projected ${remoteBibleQuickRef.trim()} (${remoteBibleTranslation}) Live!`
                              );
                              setRemoteBibleQuickRef('');
                              setControllerTab('slides');
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shrink-0"
                          >
                            Go Live
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* REMOTE ADD SONG TO SCHEDULE */}
                    <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 flex flex-col space-y-3 max-h-[380px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Music className="w-4 h-4" /> Add Song to Service Schedule ({songsCatalog.length})
                        </span>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={songSearchQuery}
                          onChange={(e) => setSongSearchQuery(e.target.value)}
                          placeholder="Search song title, author, key..."
                          className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {songsCatalog
                          .filter((s) => {
                            if (!songSearchQuery.trim()) return true;
                            const q = songSearchQuery.toLowerCase();
                            return (
                              s.title.toLowerCase().includes(q) ||
                              s.author.toLowerCase().includes(q) ||
                              s.musicalKey.toLowerCase().includes(q)
                            );
                          })
                          .map((song) => (
                            <div
                              key={song.id}
                              className="p-2.5 rounded-xl bg-slate-950 border-2 border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {song.title}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {song.author} • Key: {song.musicalKey} • {song.slideCount} slides
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    dispatchRemoteAction({
                                      action: 'ADD_SONG_TO_SCHEDULE',
                                      songId: song.id,
                                      goLive: false,
                                    });
                                    triggerRemoteNotice(`Added "${song.title}" to Schedule`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 font-bold text-[11px]"
                                >
                                  + Schedule
                                </button>
                                <button
                                  onClick={() => {
                                    dispatchRemoteAction({
                                      action: 'ADD_SONG_TO_SCHEDULE',
                                      songId: song.id,
                                      goLive: true,
                                    });
                                    triggerRemoteNotice(`Projected "${song.title}" Live!`);
                                    setControllerTab('slides');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px]"
                                >
                                  Go Live
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STAGE TIMER & NURSERY/STAGE ALERTS */}
              {controllerTab === 'stage-tools' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Timer Remote Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" /> Stage Countdown Timer
                      </span>
                      <span className="text-xl font-mono font-black text-amber-400">
                        {formatTimer(payload.countdown.secondsRemaining)}
                      </span>
                    </div>

                    <button
                      onClick={() => dispatchRemoteAction({ action: 'TOGGLE_TIMER' })}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                        payload.countdown.running
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {payload.countdown.running
                        ? 'Pause Countdown Timer'
                        : 'Start Countdown Timer'}
                    </button>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[3, 5, 10, 30].map((mins) => (
                        <button
                          key={mins}
                          onClick={() =>
                            dispatchRemoteAction({ action: 'SET_TIMER', minutes: mins })
                          }
                          className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stage & Projector Alert Remote Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-400" /> Send Stage / Nursery Alert
                    </span>

                    <input
                      type="text"
                      value={customAlertInput}
                      onChange={(e) => setCustomAlertInput(e.target.value)}
                      placeholder="e.g. Wrap up in 2 mins / Parent #104..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          dispatchRemoteAction({
                            action: 'SEND_ALERT',
                            message: customAlertInput,
                            urgent: false,
                          })
                        }
                        className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs"
                      >
                        Stage Monitor Only
                      </button>
                      <button
                        onClick={() =>
                          dispatchRemoteAction({
                            action: 'SEND_ALERT',
                            message: customAlertInput,
                            urgent: true,
                          })
                        }
                        className="py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs"
                      >
                        Urgent / Projector
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAboutModal && (
        <WelcomeAboutModal
          platform="android"
          onClose={() => setShowAboutModal(false)}
        />
      )}
    </div>
  );
};
