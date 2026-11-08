import React, { useEffect, useRef, useState } from 'react';
import {
  Monitor,
  Tv,
  Type,
  Maximize2,
  RefreshCw,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Move,
  Sparkles,
  Italic,
  Underline,
  Layers,
  Play,
  Copy,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  HardwareDisplayInfo,
  MediaAsset,
  MultiScreenRoutingSettings,
  Slide,
  SlideTransitionEasing,
  SlideTransitionSettings,
  SlideTransitionType,
  TextBoundaryRect,
  ThemeTemplate,
} from '../types/worship';
import {
  closeExternalDisplayWindow,
  DEFAULT_ROUTING_SETTINGS,
  detectConnectedDisplays,
  fetchLocalLanServerInfo,
  LanServerInfo,
  openExternalDisplayWindow,
} from '../services/liveSyncBus';
import { DEFAULT_THEMES } from '../data/defaultData';
import { resolveEffectiveBoundary, SlideStageRenderer } from './SlideStageRenderer';
import {
  exportSettingsJson,
  parseBackupOrModuleJson,
} from '../services/backupService';

interface DisplaySettingsModalProps {
  initialTab?: 'screens' | 'text-boundary';
  routing: MultiScreenRoutingSettings;
  onUpdateRouting: (next: MultiScreenRoutingSettings) => void;
  activeTheme: ThemeTemplate;
  previewSlide: Slide | null;
  previewBackground: MediaAsset;
  onSaveTheme: (theme: ThemeTemplate, applyImmediately: boolean) => void;
  onResetAllDefaults?: () => void;
  onClose: () => void;
}

const SYSTEM_FONT_OPTIONS = [
  { label: 'Montserrat (Modern Worship Display)', value: 'Montserrat' },
  { label: 'Inter (Clean Broadcast Sans)', value: 'Inter' },
  { label: 'Segoe UI (Windows Native Clean)', value: '"Segoe UI"' },
  { label: 'Arial Black (Heavy Projector Impact)', value: '"Arial Black"' },
  { label: 'Arial (Universal Sans)', value: 'Arial' },
  { label: 'Verdana (Wide High-Legibility)', value: 'Verdana' },
  { label: 'Tahoma (Compact Broadcast)', value: 'Tahoma' },
  { label: 'Trebuchet MS (Humanist Sans)', value: '"Trebuchet MS"' },
  { label: 'Impact (Condensed Headline)', value: 'Impact' },
  { label: 'Merriweather (Classic Scripture Serif)', value: 'Merriweather' },
  { label: 'Georgia (Editorial Bible Serif)', value: 'Georgia' },
  { label: 'Times New Roman (Traditional Liturgical)', value: '"Times New Roman"' },
  { label: 'Garamond (Elegant Classical Serif)', value: 'Garamond' },
  { label: 'Palatino Linotype (Warm Book Serif)', value: '"Palatino Linotype"' },
  { label: 'JetBrains Mono (Monospace Technical)', value: '"JetBrains Mono"' },
  { label: 'Courier New (Typewriter Mono)', value: '"Courier New"' },
];

const FALLBACK_SAMPLE_SLIDE: Slide = {
  id: 'sample-boundary-slide-1',
  tag: 'Chorus',
  lines: [
    'Maker of heaven, Healer of hearts',
    'Promise Keeper, Light in the dark',
    'My God, that is who You are',
  ],
  subtext: 'Isaiah 40:31 • Key of Bb',
};

const FALLBACK_SAMPLE_SLIDE_B: Slide = {
  id: 'sample-boundary-slide-2',
  tag: 'Bridge',
  lines: [
    'Even when I don’t see it, You’re working',
    'Even when I don’t feel it, You’re working',
    'You never stop, You never stop working',
  ],
  subtext: 'God of Revival & Light • Bridge',
};

type DragMode =
  | null
  | 'move'
  | 'resize-nw'
  | 'resize-n'
  | 'resize-ne'
  | 'resize-e'
  | 'resize-se'
  | 'resize-s'
  | 'resize-sw'
  | 'resize-w';

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({
  initialTab = 'screens',
  routing,
  onUpdateRouting,
  activeTheme,
  previewSlide,
  previewBackground,
  onSaveTheme,
  onResetAllDefaults,
  onClose,
}) => {
  const [tab, setTab] = useState<'screens' | 'text-boundary'>(initialTab);
  const [displays, setDisplays] = useState<HardwareDisplayInfo[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [testSlideToggle, setTestSlideToggle] = useState<boolean>(false);
  const [lanInfo, setLanInfo] = useState<LanServerInfo>({
    ips: ['192.168.1.x'],
    port: 5173,
    connectedClients: 0,
  });

  // Local draft of MultiScreenRoutingSettings
  const [draftRouting, setDraftRouting] = useState<MultiScreenRoutingSettings>(() => ({
    ...routing,
    enableStageMonitor: routing.enableStageMonitor ?? true,
    transition: routing.transition ||
      activeTheme.transition || {
        type: 'fade',
        durationMs: 380,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
  }));

  // Local draft of ThemeTemplate (including Text Formatting + Boundary Box)
  const initialBoundary = resolveEffectiveBoundary(activeTheme);
  const [draftTheme, setDraftTheme] = useState<ThemeTemplate>(() => ({
    ...activeTheme,
    customFontName: activeTheme.customFontName || 'Montserrat',
    subtextFontName: activeTheme.subtextFontName || '',
    baseFontSizePx: activeTheme.baseFontSizePx ?? 64,
    subtextFontSizePx: activeTheme.subtextFontSizePx ?? 28,
    fontWeight: activeTheme.fontWeight || 'bold',
    fontStyle: activeTheme.fontStyle || 'normal',
    underline: activeTheme.underline ?? false,
    textTransform:
      activeTheme.textTransform || (activeTheme.uppercase ? 'uppercase' : 'none'),
    wordWrapMode: activeTheme.wordWrapMode || 'balance',
    overflowBehavior: activeTheme.overflowBehavior || 'auto-fit',
    lineHeight: activeTheme.lineHeight ?? 1.25,
    letterSpacingEm: activeTheme.letterSpacingEm ?? 0.02,
    wordSpacingPx: activeTheme.wordSpacingPx ?? 0,
    lineGapPx: activeTheme.lineGapPx ?? 8,
    strokeWidthPx: activeTheme.strokeWidthPx ?? 0,
    strokeColor: activeTheme.strokeColor || '#000000',
    boundary: {
      ...initialBoundary,
      showGuideOnPreview: activeTheme.boundary?.showGuideOnPreview ?? true,
    },
  }));

  // Interactive Boundary Drag & Resize State
  const stagePreviewRef = useRef<HTMLDivElement | null>(null);
  const settingsImportRef = useRef<HTMLInputElement | null>(null);
  const [dragState, setDragState] = useState<{
    mode: DragMode;
    startX: number;
    startY: number;
    startRect: TextBoundaryRect;
  } | null>(null);

  const refreshDisplays = async () => {
    setIsDetecting(true);
    const [detected, info] = await Promise.all([
      detectConnectedDisplays(),
      fetchLocalLanServerInfo(),
    ]);
    setDisplays(detected);
    setLanInfo(info);
    setIsDetecting(false);
  };

  useEffect(() => {
    refreshDisplays();
  }, []);

  // Handle interactive mouse dragging and resizing of the Text Boundary Box on the 16:9 canvas
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const stageEl = stagePreviewRef.current;
      if (!stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaXPct = ((e.clientX - dragState.startX) / rect.width) * 100;
      const deltaYPct = ((e.clientY - dragState.startY) / rect.height) * 100;

      const s = dragState.startRect;
      let nextX = s.x;
      let nextY = s.y;
      let nextW = s.width;
      let nextH = s.height;

      if (dragState.mode === 'move') {
        nextX = Math.max(0, Math.min(100 - s.width, s.x + deltaXPct));
        nextY = Math.max(0, Math.min(100 - s.height, s.y + deltaYPct));
      } else {
        if (dragState.mode?.includes('e')) {
          nextW = Math.max(12, Math.min(100 - s.x, s.width + deltaXPct));
        }
        if (dragState.mode?.includes('s')) {
          nextH = Math.max(10, Math.min(100 - s.y, s.height + deltaYPct));
        }
        if (dragState.mode?.includes('w')) {
          const maxShift = s.width - 12;
          const shift = Math.max(-s.x, Math.min(maxShift, deltaXPct));
          nextX = s.x + shift;
          nextW = s.width - shift;
        }
        if (dragState.mode?.includes('n')) {
          const maxShift = s.height - 10;
          const shift = Math.max(-s.y, Math.min(maxShift, deltaYPct));
          nextY = s.y + shift;
          nextH = s.height - shift;
        }
      }

      setDraftTheme((prev) => ({
        ...prev,
        boundary: {
          ...(prev.boundary || initialBoundary),
          x: Math.round(nextX * 10) / 10,
          y: Math.round(nextY * 10) / 10,
          width: Math.round(nextW * 10) / 10,
          height: Math.round(nextH * 10) / 10,
        },
      }));
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, initialBoundary]);

  const startBoundaryDrag = (e: React.MouseEvent, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();
    const b = draftTheme.boundary || initialBoundary;
    setDragState({
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...b },
    });
  };

  const applyBoundaryPreset = (preset: {
    x: number;
    y: number;
    width: number;
    height: number;
    vAlign?: 'top' | 'center' | 'bottom';
    hAlign?: 'left' | 'center' | 'right';
    lowerThird?: boolean;
  }) => {
    setDraftTheme((prev) => ({
      ...prev,
      verticalAlign: preset.vAlign || prev.verticalAlign,
      textAlign: preset.hAlign || prev.textAlign,
      lowerThirdBand: preset.lowerThird !== undefined ? preset.lowerThird : prev.lowerThirdBand,
      boundary: {
        ...(prev.boundary || initialBoundary),
        x: preset.x,
        y: preset.y,
        width: preset.width,
        height: preset.height,
      },
    }));
  };

  const handleSaveAll = (saveAsNewTheme = false) => {
    onUpdateRouting(draftRouting);
    const finalTheme: ThemeTemplate = {
      ...draftTheme,
      id: saveAsNewTheme ? `theme-custom-${Date.now()}` : draftTheme.id,
      name: saveAsNewTheme ? `${draftTheme.name} (Custom)` : draftTheme.name,
      uppercase: draftTheme.textTransform === 'uppercase',
      transition: draftRouting.transition,
    };
    onSaveTheme(finalTheme, true);
  };

  const boundary = draftTheme.boundary || initialBoundary;
  const currentTransition: SlideTransitionSettings = draftRouting.transition || {
    type: 'fade',
    durationMs: 380,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-booth-900 border border-booth-700 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Header + Mode Switcher Tabs */}
        <div className="px-6 py-3.5 bg-booth-950 border-b border-booth-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Multi-Monitor Output & Text Display Studio
              </h3>
              <p className="text-xs text-slate-400">
                Configure 2nd & 3rd screen borderless fullscreen routing, font styles, word wrapping, and text boundaries
              </p>
            </div>
          </div>

          {/* 2 Studio Tabs */}
          <div className="flex items-center gap-1.5 bg-booth-900 p-1 rounded-xl border border-booth-800">
            <button
              type="button"
              onClick={() => setTab('screens')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                tab === 'screens'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>2nd & 3rd Screen Routing</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('text-boundary')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                tab === 'text-boundary'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text Display, Fonts & Boundary Box</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-booth-850 hover:bg-booth-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===================================================================
            TAB 1: 2ND SCREEN (PROJECTOR) & 3RD SCREEN (STAGE MONITOR) ROUTING
           =================================================================== */}
        {tab === 'screens' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Visual Multi-Monitor Topology Map */}
            <div className="bg-booth-950 border border-booth-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Connected Display Topology (Screen 1 Operator • Screen 2 Projector • Screen 3 Stage)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Assign which physical monitor receives the borderless fullscreen Projector Output and Stage Confidence Monitor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshDisplays}
                  className="px-3 py-1.5 rounded-lg bg-booth-850 hover:bg-booth-800 border border-booth-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                  <span>Detect Displays</span>
                </button>
              </div>

              {/* 3-Screen Visual Cards */}
              <div className="grid grid-cols-3 gap-4">
                {displays.map((d) => {
                  const isAssignedProjector =
                    String(draftRouting.projectorDisplayId) === String(d.id) ||
                    (draftRouting.projectorDisplayId === 'auto' && d.index === 2);
                  const isAssignedStage =
                    String(draftRouting.stageDisplayId) === String(d.id) ||
                    (draftRouting.stageDisplayId === 'auto' && d.index === 3);

                  return (
                    <div
                      key={d.id}
                      className={`rounded-xl p-4 border-2 flex flex-col justify-between aspect-[16/9] relative ${
                        d.isPrimary
                          ? 'bg-booth-900 border-sky-500/60'
                          : isAssignedProjector
                          ? 'bg-emerald-950/25 border-emerald-400'
                          : isAssignedStage
                          ? 'bg-amber-950/25 border-amber-400'
                          : 'bg-booth-900 border-booth-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-black/50 text-[10px] font-mono font-bold text-slate-300">
                          DISPLAY #{d.index} ({d.width}×{d.height})
                        </span>
                        {d.isPrimary && (
                          <span className="px-2 py-0.5 rounded bg-sky-500 text-black text-[9px] font-black uppercase">
                            PRIMARY (OPERATOR)
                          </span>
                        )}
                      </div>

                      <div className="my-auto text-center">
                        <div className="font-bold text-sm text-white">{d.label}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Origin: X={d.x}, Y={d.y}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftRouting((prev) => ({
                              ...prev,
                              projectorDisplayId: String(d.id),
                            }))
                          }
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition ${
                            isAssignedProjector
                              ? 'bg-emerald-500 text-black'
                              : 'bg-booth-800 hover:bg-booth-700 text-slate-300'
                          }`}
                        >
                          {isAssignedProjector ? '✓ Screen 2 (Projector)' : 'Set as Projector'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftRouting((prev) => ({
                              ...prev,
                              stageDisplayId: String(d.id),
                            }))
                          }
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition ${
                            isAssignedStage
                              ? 'bg-amber-500 text-black'
                              : 'bg-booth-800 hover:bg-booth-700 text-slate-300'
                          }`}
                        >
                          {isAssignedStage ? '✓ Screen 3 (Stage)' : 'Set as Stage'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2nd Screen (Projector) & 3rd Screen (Stage Monitor) Detailed Configuration */}
            <div className="grid grid-cols-2 gap-6">
              {/* 2ND SCREEN: PROJECTOR / LED WALL */}
              <div className="bg-booth-950 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-white">
                        2nd Screen — Main Projector / LED Wall
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Congregation house display (borderless fullscreen)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateRouting(draftRouting);
                      openExternalDisplayWindow('projector', draftRouting, displays);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch 2nd Screen Now</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                    Target Monitor for Projector Output
                  </label>
                  <select
                    value={draftRouting.projectorDisplayId}
                    onChange={(e) =>
                      setDraftRouting((prev) => ({
                        ...prev,
                        projectorDisplayId: e.target.value,
                      }))
                    }
                    className="w-full bg-booth-900 border border-booth-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="auto">
                      Auto-Detect 2nd Display (Secondary HDMI / SDI Projector)
                    </option>
                    {displays.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        Display #{d.index}: {d.label} (X:{d.x}, Y:{d.y})
                      </option>
                    ))}
                    <option value="custom">Custom Monitor Coordinates (X, Y, Width, Height)</option>
                  </select>
                </div>

                {draftRouting.projectorDisplayId === 'custom' && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {(['x', 'y', 'width', 'height'] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          {field} (px)
                        </label>
                        <input
                          type="number"
                          value={draftRouting.projectorCustomBounds[field]}
                          onChange={(e) =>
                            setDraftRouting((prev) => ({
                              ...prev,
                              projectorCustomBounds: {
                                ...prev.projectorCustomBounds,
                                [field]: parseInt(e.target.value, 10) || 0,
                              },
                            }))
                          }
                          className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-booth-800 text-xs">
                  <label className="flex items-center justify-between cursor-pointer text-slate-200">
                    <span>Launch directly in Borderless Fullscreen (No window borders/titlebar)</span>
                    <input
                      type="checkbox"
                      checked={draftRouting.borderlessFullscreen}
                      onChange={(e) =>
                        setDraftRouting((prev) => ({
                          ...prev,
                          borderlessFullscreen: e.target.checked,
                        }))
                      }
                      className="rounded accent-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer text-slate-200">
                    <span>Hide mouse cursor over Projector Screen</span>
                    <input
                      type="checkbox"
                      checked={draftRouting.hideCursorOnProjector}
                      onChange={(e) =>
                        setDraftRouting((prev) => ({
                          ...prev,
                          hideCursorOnProjector: e.target.checked,
                        }))
                      }
                      className="rounded accent-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* 3RD SCREEN: STAGE MONITOR / CONFIDENCE DISPLAY */}
              <div
                className={`bg-booth-950 border-2 rounded-2xl p-5 space-y-4 transition ${
                  draftRouting.enableStageMonitor
                    ? 'border-amber-500/40'
                    : 'border-booth-800 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                      <Tv className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm text-white">
                          3rd Screen — Stage Confidence Monitor
                        </h5>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            draftRouting.enableStageMonitor
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {draftRouting.enableStageMonitor ? 'ENABLED' : 'DISABLED (2-SCREEN MODE)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Rear wall / band monitor (or disable when using Android APK or 2nd monitor only)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!draftRouting.enableStageMonitor}
                    onClick={() => {
                      onUpdateRouting(draftRouting);
                      openExternalDisplayWindow('stage', draftRouting, displays);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch 3rd Screen Now</span>
                  </button>
                </div>

                {/* Master Toggle to Enable / Disable 3rd Monitor */}
                <div className="p-3 rounded-xl bg-booth-900 border border-booth-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Enable Desktop 3rd Monitor Output
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Turn OFF when only a 2nd Monitor (Projector) is connected or when using the Android APK as your 3rd Monitor & Controller
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextEnabled = !draftRouting.enableStageMonitor;
                      const updated = { ...draftRouting, enableStageMonitor: nextEnabled };
                      setDraftRouting(updated);
                      onUpdateRouting(updated);
                      if (!nextEnabled) {
                        closeExternalDisplayWindow('stage');
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl font-black text-xs shrink-0 transition ${
                      draftRouting.enableStageMonitor
                        ? 'bg-emerald-500 text-black'
                        : 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    {draftRouting.enableStageMonitor
                      ? '✓ 3rd Monitor Enabled'
                      : '✕ 3rd Monitor Disabled'}
                  </button>
                </div>

                <div className={!draftRouting.enableStageMonitor ? 'opacity-40 pointer-events-none space-y-4' : 'space-y-4'}>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                    Target Monitor for Stage Display
                  </label>
                  <select
                    value={draftRouting.stageDisplayId}
                    onChange={(e) =>
                      setDraftRouting((prev) => ({
                        ...prev,
                        stageDisplayId: e.target.value,
                      }))
                    }
                    className="w-full bg-booth-900 border border-booth-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="auto">
                      Auto-Detect 3rd Display (Stage TV / Rear Confidence Monitor)
                    </option>
                    {displays.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        Display #{d.index}: {d.label} (X:{d.x}, Y:{d.y})
                      </option>
                    ))}
                    <option value="custom">Custom Monitor Coordinates (X, Y, Width, Height)</option>
                  </select>
                </div>

                {draftRouting.stageDisplayId === 'custom' && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {(['x', 'y', 'width', 'height'] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          {field} (px)
                        </label>
                        <input
                          type="number"
                          value={draftRouting.stageCustomBounds[field]}
                          onChange={(e) =>
                            setDraftRouting((prev) => ({
                              ...prev,
                              stageCustomBounds: {
                                ...prev.stageCustomBounds,
                                [field]: parseInt(e.target.value, 10) || 0,
                              },
                            }))
                          }
                          className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-booth-800">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Stage Layout Mode
                    </label>
                    <select
                      value={draftRouting.stageDisplayMode}
                      onChange={(e) =>
                        setDraftRouting((prev) => ({
                          ...prev,
                          stageDisplayMode: e.target.value as MultiScreenRoutingSettings['stageDisplayMode'],
                        }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="confidence">Confidence (Current + Next + Timer + Chords)</option>
                      <option value="lyrics-chords-large">Band Stand (Extra-Large Lyrics & Chords)</option>
                      <option value="mirror-projector">Mirror Main Projector Output</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Stage Text Size Scale</span>
                      <span className="font-mono text-amber-300">
                        {Math.round(draftRouting.stageFontSizeScale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.7}
                      max={1.5}
                      step={0.05}
                      value={draftRouting.stageFontSizeScale}
                      onChange={(e) =>
                        setDraftRouting((prev) => ({
                          ...prev,
                          stageFontSizeScale: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Android APK 3rd Monitor & Remote Controller Connection Hub */}
            <div className="bg-gradient-to-r from-amber-500/10 via-booth-950 to-emerald-500/10 border border-amber-500/40 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] uppercase tracking-wider">
                    ANDROID APK COMPANION
                  </span>
                  <h5 className="font-bold text-sm text-white">
                    Android 3rd Monitor (Stage Display) & Remote Projector Controller
                  </h5>
                </div>
                <p className="text-xs text-slate-300">
                  Open the <span className="text-amber-300 font-semibold">FreeWorship Android APK</span> on any phone or tablet connected to the same Wi-Fi network and enter this PC&apos;s IP address:
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {lanInfo.ips.map((ip) => (
                  <div
                    key={ip}
                    className="px-3.5 py-2 rounded-xl bg-black/80 border border-amber-500/50 font-mono text-sm font-black text-amber-300 flex items-center gap-2"
                  >
                    <span>
                      {ip}:{lanInfo.port}
                    </span>
                  </div>
                ))}
                <a
                  href="/FreeWorship-StageController.apk"
                  download="FreeWorship-StageController.apk"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  Download Android .APK
                </a>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `${window.location.origin}${window.location.pathname}?view=android`,
                      'freeworship_android_preview',
                      'width=1024,height=720'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-700 text-xs font-bold text-emerald-300"
                >
                  Preview Android 3rd Monitor UI
                </button>
              </div>
            </div>

            {/* Global Multi-Monitor Window Behavior */}
            <div className="bg-booth-950 border border-booth-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs text-slate-200 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftRouting.alwaysOnTop}
                    onChange={(e) =>
                      setDraftRouting((prev) => ({ ...prev, alwaysOnTop: e.target.checked }))
                    }
                    className="rounded accent-amber-500"
                  />
                  <span>Lock Output Screens Always-On-Top (Hide OS Taskbar)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftRouting.keepOperatorFocus}
                    onChange={(e) =>
                      setDraftRouting((prev) => ({
                        ...prev,
                        keepOperatorFocus: e.target.checked,
                      }))
                    }
                    className="rounded accent-amber-500"
                  />
                  <span>Keep Keyboard Focus on Operator Console When Launching</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftRouting.autoLaunchOnStartup}
                    onChange={(e) =>
                      setDraftRouting((prev) => ({
                        ...prev,
                        autoLaunchOnStartup: e.target.checked,
                      }))
                    }
                    className="rounded accent-amber-500"
                  />
                  <span>Auto-Launch 2nd & 3rd Screens on App Startup</span>
                </label>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => closeExternalDisplayWindow('all')}
                  className="px-3 py-2 rounded-xl bg-booth-850 hover:bg-red-950/60 text-xs font-bold text-slate-300 hover:text-red-300 border border-booth-700"
                >
                  Close Output Screens
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateRouting(draftRouting);
                    openExternalDisplayWindow('projector', draftRouting, displays);
                    openExternalDisplayWindow('stage', draftRouting, displays);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 text-black font-black text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Launch Both 2nd & 3rd Screens Fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: TEXT DISPLAY SETTINGS, FONT STYLE, WORD WRAPPING & BOUNDARY
           =================================================================== */}
        {tab === 'text-boundary' && (
          <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
            {/* LEFT 7 COLS: Granular Text, Font, Wrapping & Boundary Controls */}
            <div className="col-span-7 p-5 overflow-y-auto space-y-5 border-r border-booth-800">
              {/* 1. TEXT BOUNDARY BOX POSITION & SIZE (WHERE TO PUT THE TEXT) */}
              <div className="bg-booth-950 border-2 border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <Move className="w-4 h-4" />
                    <span>1. Text Display Boundary Region (Drag Preview or Set %)</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={boundary.showGuideOnPreview ?? true}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          boundary: {
                            ...boundary,
                            showGuideOnPreview: e.target.checked,
                          },
                        }))
                      }
                      className="rounded accent-amber-500"
                    />
                    <span>Show Boundary Guide on Preview</span>
                  </label>
                </div>

                {/* Quick Boundary Region Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      applyBoundaryPreset({
                        x: 5,
                        y: 8,
                        width: 90,
                        height: 84,
                        vAlign: 'center',
                        hAlign: 'center',
                        lowerThird: false,
                      })
                    }
                    className="py-1.5 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[11px] font-bold text-slate-200"
                  >
                    Full Sanctuary Safe Area
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBoundaryPreset({
                        x: 4,
                        y: 70,
                        width: 92,
                        height: 24,
                        vAlign: 'center',
                        hAlign: 'center',
                        lowerThird: true,
                      })
                    }
                    className="py-1.5 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[11px] font-bold text-amber-300"
                  >
                    Lower-Thirds Strip (Bottom)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBoundaryPreset({
                        x: 4,
                        y: 5,
                        width: 92,
                        height: 26,
                        vAlign: 'center',
                        hAlign: 'center',
                        lowerThird: false,
                      })
                    }
                    className="py-1.5 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[11px] font-bold text-sky-300"
                  >
                    Top Banner Region
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBoundaryPreset({
                        x: 6,
                        y: 12,
                        width: 44,
                        height: 76,
                        vAlign: 'center',
                        hAlign: 'left',
                        lowerThird: false,
                      })
                    }
                    className="py-1.5 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[11px] font-bold text-slate-200"
                  >
                    Left Half Split-Screen
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBoundaryPreset({
                        x: 50,
                        y: 12,
                        width: 44,
                        height: 76,
                        vAlign: 'center',
                        hAlign: 'left',
                        lowerThird: false,
                      })
                    }
                    className="py-1.5 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[11px] font-bold text-slate-200"
                  >
                    Right Half Split-Screen
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBoundaryPreset({
                        x: 10,
                        y: 18,
                        width: 80,
                        height: 64,
                        vAlign: 'center',
                        hAlign: 'center',
                        lowerThird: false,
                      })
                    }
                    className="py-1.5 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[11px] font-bold text-emerald-300"
                  >
                    Centered Stage (80%×64%)
                  </button>
                </div>

                {/* Numeric Sliders for X%, Y%, Width%, Height%, Padding */}
                <div className="grid grid-cols-5 gap-2.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Left X</span>
                      <span className="font-mono text-amber-300">{Math.round(boundary.x)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={85}
                      step={1}
                      value={boundary.x}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          boundary: { ...boundary, x: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Top Y</span>
                      <span className="font-mono text-amber-300">{Math.round(boundary.y)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={85}
                      step={1}
                      value={boundary.y}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          boundary: { ...boundary, y: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Width</span>
                      <span className="font-mono text-amber-300">{Math.round(boundary.width)}%</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={100}
                      step={1}
                      value={boundary.width}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          boundary: { ...boundary, width: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Height</span>
                      <span className="font-mono text-amber-300">{Math.round(boundary.height)}%</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={100}
                      step={1}
                      value={boundary.height}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          boundary: { ...boundary, height: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Padding</span>
                      <span className="font-mono text-amber-300">{boundary.paddingPx ?? 16}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={2}
                      value={boundary.paddingPx ?? 16}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          boundary: {
                            ...boundary,
                            paddingPx: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {/* Alignment Inside the Boundary Box */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-booth-800">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Horizontal Alignment Inside Boundary
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(
                        [
                          { id: 'left', label: 'Left', icon: AlignLeft },
                          { id: 'center', label: 'Center', icon: AlignCenter },
                          { id: 'right', label: 'Right', icon: AlignRight },
                          { id: 'justify', label: 'Justify', icon: AlignJustify },
                        ] as const
                      ).map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDraftTheme((prev) => ({ ...prev, textAlign: id }))}
                          className={`py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border ${
                            draftTheme.textAlign === id
                              ? 'bg-amber-500 text-black border-amber-300'
                              : 'bg-booth-900 text-slate-300 border-booth-700'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Vertical Anchor Inside Boundary
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { id: 'top', label: 'Top' },
                          { id: 'center', label: 'Middle' },
                          { id: 'bottom', label: 'Bottom' },
                        ] as const
                      ).map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setDraftTheme((prev) => ({ ...prev, verticalAlign: id }))
                          }
                          className={`py-1.5 rounded-lg text-[11px] font-bold border ${
                            draftTheme.verticalAlign === id
                              ? 'bg-amber-500 text-black border-amber-300'
                              : 'bg-booth-900 text-slate-300 border-booth-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. FONT USE, FONT STYLE & FONT SIZE */}
              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400">
                  <Type className="w-4 h-4" />
                  <span>2. Font Family, Font Style & Exact Sizing</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Main Lyric / Body Font
                    </label>
                    <select
                      value={draftTheme.customFontName || 'Montserrat'}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({ ...prev, customFontName: e.target.value }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      {SYSTEM_FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Or Type Any Installed OS Font Name
                    </label>
                    <input
                      type="text"
                      value={draftTheme.customFontName || ''}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({ ...prev, customFontName: e.target.value }))
                      }
                      placeholder="e.g. Bebas Neue, Calibri, Futura..."
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Font Weight, Style (Italic, Underline) & Case Transform */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={draftTheme.fontWeight || 'bold'}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          fontWeight: e.target.value as ThemeTemplate['fontWeight'],
                        }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      <option value="light">Light (300)</option>
                      <option value="normal">Regular (400)</option>
                      <option value="medium">Medium (500)</option>
                      <option value="semibold">Semi-Bold (600)</option>
                      <option value="bold">Bold (700)</option>
                      <option value="extrabold">Extra-Bold (800)</option>
                      <option value="black">Heavy Black (900)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Text Case / Transform
                    </label>
                    <select
                      value={draftTheme.textTransform || 'none'}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          textTransform: e.target.value as ThemeTemplate['textTransform'],
                          uppercase: e.target.value === 'uppercase',
                        }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      <option value="none">As Typed (Standard)</option>
                      <option value="uppercase">ALL UPPERCASE</option>
                      <option value="capitalize">Capitalize Each Word</option>
                      <option value="lowercase">all lowercase</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Font Style Toggles
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftTheme((prev) => ({
                            ...prev,
                            fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic',
                          }))
                        }
                        className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border ${
                          draftTheme.fontStyle === 'italic'
                            ? 'bg-sky-500 text-black border-sky-300'
                            : 'bg-booth-900 text-slate-300 border-booth-700'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                        <span>Italic</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftTheme((prev) => ({
                            ...prev,
                            underline: !prev.underline,
                          }))
                        }
                        className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border ${
                          draftTheme.underline
                            ? 'bg-sky-500 text-black border-sky-300'
                            : 'bg-booth-900 text-slate-300 border-booth-700'
                        }`}
                      >
                        <Underline className="w-3.5 h-3.5" />
                        <span>Underline</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Font Size (px), Subtext Font Size (px), and Scale */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                      <span>Main Lyric Size (1080p)</span>
                      <span className="font-mono text-sky-300">
                        {draftTheme.baseFontSizePx ?? 64}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={130}
                      step={2}
                      value={draftTheme.baseFontSizePx ?? 64}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          baseFontSizePx: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                      <span>Subtext / Reference Size</span>
                      <span className="font-mono text-sky-300">
                        {draftTheme.subtextFontSizePx ?? 28}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={64}
                      step={1}
                      value={draftTheme.subtextFontSizePx ?? 28}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          subtextFontSizePx: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                      <span>Global Scale Multiplier</span>
                      <span className="font-mono text-sky-300">
                        {Math.round((draftTheme.fontSizeScale ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.5}
                      step={0.02}
                      value={draftTheme.fontSizeScale ?? 1}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          fontSizeScale: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-sky-400"
                    />
                  </div>
                </div>
              </div>

              {/* 3. WORD WRAPPING, LINE SPACING & BOUNDARY OVERFLOW */}
              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                  <Layers className="w-4 h-4" />
                  <span>3. Word Wrapping, Overflow Fit & Line Spacing</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Word Wrapping Mode
                    </label>
                    <select
                      value={draftTheme.wordWrapMode || 'balance'}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          wordWrapMode: e.target.value as ThemeTemplate['wordWrapMode'],
                        }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      <option value="balance">Smart Balanced Wrapping (Even Lyric Lines)</option>
                      <option value="normal">Standard Word Wrap at Boundary Edge</option>
                      <option value="break-words">Aggressive Wrap (Break Long Words)</option>
                      <option value="nowrap">No Wrap (Force Single Line per Row)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      When Text Exceeds Boundary Box
                    </label>
                    <select
                      value={draftTheme.overflowBehavior || 'auto-fit'}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          overflowBehavior: e.target.value as ThemeTemplate['overflowBehavior'],
                        }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      <option value="auto-fit">Auto-Shrink Font Size to Fit Inside Boundary</option>
                      <option value="clip">Clip Text Strictly at Boundary Edges</option>
                      <option value="visible">Allow Text to Overflow Boundary</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Line Height</span>
                      <span className="font-mono text-emerald-300">
                        {(draftTheme.lineHeight ?? 1.25).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.9}
                      max={2.1}
                      step={0.05}
                      value={draftTheme.lineHeight ?? 1.25}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          lineHeight: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Letter Space</span>
                      <span className="font-mono text-emerald-300">
                        {(draftTheme.letterSpacingEm ?? 0.02).toFixed(2)}em
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-0.04}
                      max={0.25}
                      step={0.01}
                      value={draftTheme.letterSpacingEm ?? 0.02}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          letterSpacingEm: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Word Space</span>
                      <span className="font-mono text-emerald-300">
                        {draftTheme.wordSpacingPx ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={1}
                      value={draftTheme.wordSpacingPx ?? 0}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          wordSpacingPx: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-emerald-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Line Gap</span>
                      <span className="font-mono text-emerald-300">
                        {draftTheme.lineGapPx ?? 8}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={36}
                      step={2}
                      value={draftTheme.lineGapPx ?? 8}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          lineGapPx: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. COLORS, STROKE OUTLINE, SHADOW & BOUNDARY BOX FILL */}
              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span>4. Colors, Text Stroke Outline & Boundary Box Background</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Lyric Color
                    </label>
                    <div className="flex items-center gap-1.5 bg-booth-900 border border-booth-700 rounded-lg px-2 py-1">
                      <input
                        type="color"
                        value={draftTheme.textColor}
                        onChange={(e) =>
                          setDraftTheme((prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[11px] font-mono text-white">
                        {draftTheme.textColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Accent / Ref Color
                    </label>
                    <div className="flex items-center gap-1.5 bg-booth-900 border border-booth-700 rounded-lg px-2 py-1">
                      <input
                        type="color"
                        value={draftTheme.accentColor}
                        onChange={(e) =>
                          setDraftTheme((prev) => ({ ...prev, accentColor: e.target.value }))
                        }
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[11px] font-mono text-white">
                        {draftTheme.accentColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Stroke Color
                    </label>
                    <div className="flex items-center gap-1.5 bg-booth-900 border border-booth-700 rounded-lg px-2 py-1">
                      <input
                        type="color"
                        value={draftTheme.strokeColor || '#000000'}
                        onChange={(e) =>
                          setDraftTheme((prev) => ({ ...prev, strokeColor: e.target.value }))
                        }
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[11px] font-mono text-white">
                        {draftTheme.strokeColor || '#000000'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Stroke Width</span>
                      <span className="font-mono text-purple-300">
                        {draftTheme.strokeWidthPx ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={0.5}
                      value={draftTheme.strokeWidthPx ?? 0}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          strokeWidthPx: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Drop Shadow Preset
                    </label>
                    <select
                      value={draftTheme.textShadow}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          textShadow: e.target.value as ThemeTemplate['textShadow'],
                        }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="strong">Strong Drop Shadow</option>
                      <option value="outline">Crisp 2px Black Outline</option>
                      <option value="soft">Soft Subtle Shadow</option>
                      <option value="glow">Accent Halo Glow</option>
                      <option value="none">No Shadow (Flat)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Video Dimming</span>
                      <span className="font-mono text-purple-300">
                        {Math.round((draftTheme.backgroundDimOpacity ?? 0.25) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.85}
                      step={0.05}
                      value={draftTheme.backgroundDimOpacity ?? 0.25}
                      onChange={(e) =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          backgroundDimOpacity: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-purple-400"
                    />
                  </div>

                  <div className="flex items-center pt-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                      <input
                        type="checkbox"
                        checked={draftTheme.lowerThirdBand}
                        onChange={(e) =>
                          setDraftTheme((prev) => ({
                            ...prev,
                            lowerThirdBand: e.target.checked,
                          }))
                        }
                        className="rounded accent-purple-500"
                      />
                      <span className="font-bold">Fill Boundary Box Panel</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 5. SLIDE TRANSITION ANIMATION SETTINGS */}
              <div className="bg-booth-950 border-2 border-sky-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400">
                    <Play className="w-4 h-4" />
                    <span>5. Slide Transition Animation Settings</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestSlideToggle((prev) => !prev)}
                    className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-black text-[11px] flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Preview Transition Now</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Transition Animation Style
                    </label>
                    <select
                      value={currentTransition.type}
                      onChange={(e) => {
                        const nextType = e.target.value as SlideTransitionType;
                        setDraftRouting((prev) => ({
                          ...prev,
                          transition: {
                            ...currentTransition,
                            type: nextType,
                          },
                        }));
                        setTestSlideToggle((p) => !p);
                      }}
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs font-bold text-white"
                    >
                      <option value="fade">Smooth Crossfade (Dissolve)</option>
                      <option value="slide-up">Slide Up Vertical</option>
                      <option value="slide-down">Slide Down Vertical</option>
                      <option value="slide-left">Broadcast Push Left</option>
                      <option value="zoom-in">Cinematic Scale Zoom</option>
                      <option value="blur-fade">Soft Focus Blur Dissolve</option>
                      <option value="flip-3d">3D Perspective Flip</option>
                      <option value="cut">Instant Cut (0ms No Animation)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Transition Duration</span>
                      <span className="font-mono text-sky-300">
                        {currentTransition.durationMs}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={1400}
                      step={20}
                      value={currentTransition.durationMs}
                      onChange={(e) =>
                        setDraftRouting((prev) => ({
                          ...prev,
                          transition: {
                            ...currentTransition,
                            durationMs: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      className="w-full accent-sky-400 mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Motion Easing Curve
                    </label>
                    <select
                      value={currentTransition.easing}
                      onChange={(e) =>
                        setDraftRouting((prev) => ({
                          ...prev,
                          transition: {
                            ...currentTransition,
                            easing: e.target.value as SlideTransitionEasing,
                          },
                        }))
                      }
                      className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      <option value="cubic-bezier(0.22, 1, 0.36, 1)">Smooth Broadcast Out</option>
                      <option value="ease-in-out">Balanced Ease-In-Out</option>
                      <option value="ease-out">Standard Ease-Out</option>
                      <option value="linear">Linear Constant</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: Interactive Drag & Resize 16:9 Boundary Stage Canvas */}
            <div className="col-span-5 bg-booth-950 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Interactive Text Boundary Canvas (Drag Box or Handles)
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      X:{Math.round(boundary.x)}% Y:{Math.round(boundary.y)}% • W:{Math.round(boundary.width)}% H:{Math.round(boundary.height)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click and drag inside the yellow box to move where text appears, or drag the 8 handles to resize the boundary.
                  </p>
                </div>

                {/* 16:9 Interactive Stage Preview with Draggable / Resizable Overlay */}
                <div
                  ref={stagePreviewRef}
                  className="aspect-video w-full rounded-xl overflow-hidden border-2 border-booth-700 shadow-2xl relative bg-black select-none"
                >
                  <SlideStageRenderer
                    slide={
                      testSlideToggle
                        ? FALLBACK_SAMPLE_SLIDE_B
                        : previewSlide || FALLBACK_SAMPLE_SLIDE
                    }
                    background={previewBackground}
                    theme={draftTheme}
                    transition={currentTransition}
                    scaleMode="preview"
                    forceShowBoundaryGuide={true}
                  />

                  {/* Interactive Drag & Resize Hit Overlay Matching `boundary` */}
                  <div
                    onMouseDown={(e) => startBoundaryDrag(e, 'move')}
                    style={{
                      left: `${boundary.x}%`,
                      top: `${boundary.y}%`,
                      width: `${boundary.width}%`,
                      height: `${boundary.height}%`,
                    }}
                    className="absolute z-30 border-2 border-amber-400 bg-amber-400/5 hover:bg-amber-400/10 cursor-move transition-colors"
                    title="Drag to move text boundary region"
                  >
                    {/* 8 Resize Handles (NW, N, NE, E, SE, S, SW, W) */}
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-nw')}
                      className="w-3 h-3 bg-amber-400 border border-black rounded-sm absolute -top-1.5 -left-1.5 cursor-nwse-resize"
                    />
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-n')}
                      className="w-4 h-2.5 bg-amber-400 border border-black rounded-sm absolute -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize"
                    />
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-ne')}
                      className="w-3 h-3 bg-amber-400 border border-black rounded-sm absolute -top-1.5 -right-1.5 cursor-nesw-resize"
                    />
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-e')}
                      className="w-2.5 h-4 bg-amber-400 border border-black rounded-sm absolute top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize"
                    />
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-se')}
                      className="w-3 h-3 bg-amber-400 border border-black rounded-sm absolute -bottom-1.5 -right-1.5 cursor-nwse-resize"
                    />
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-s')}
                      className="w-4 h-2.5 bg-amber-400 border border-black rounded-sm absolute -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize"
                    />
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-sw')}
                      className="w-3 h-3 bg-amber-400 border border-black rounded-sm absolute -bottom-1.5 -left-1.5 cursor-nesw-resize"
                    />
                    <div
                      onMouseDown={(e) => startBoundaryDrag(e, 'resize-w')}
                      className="w-2.5 h-4 bg-amber-400 border border-black rounded-sm absolute top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize"
                    />
                  </div>
                </div>

                {/* Summary Readout Card */}
                <div className="bg-booth-900 border border-booth-800 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Active Typography & Boundary Summary</span>
                    <span className="text-amber-300 font-mono text-[11px]">{draftTheme.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                    <div>
                      Font: <strong className="text-slate-200">{draftTheme.customFontName}</strong> ({draftTheme.baseFontSizePx}px)
                    </div>
                    <div>
                      Wrap: <strong className="text-slate-200">{draftTheme.wordWrapMode}</strong> ({draftTheme.overflowBehavior})
                    </div>
                    <div>
                      Position: <strong className="text-slate-200">X:{Math.round(boundary.x)}%, Y:{Math.round(boundary.y)}%</strong>
                    </div>
                    <div>
                      Size: <strong className="text-slate-200">W:{Math.round(boundary.width)}%, H:{Math.round(boundary.height)}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-booth-900/70 border border-booth-800 rounded-xl p-3">
                Tip: Enable <strong>Auto-Shrink Font Size to Fit Inside Boundary</strong> so even 6-line scripture passages stay strictly inside your custom boundary rectangle.
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-booth-950 border-t border-booth-800 flex items-center justify-between shrink-0">
          <input
            ref={settingsImportRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const raw = await file.text();
                const bundle = parseBackupOrModuleJson(raw);
                if (bundle.settings?.routingSettings) {
                  setDraftRouting(bundle.settings.routingSettings);
                  onUpdateRouting(bundle.settings.routingSettings);
                }
                if (bundle.settings?.themes && bundle.settings.themes.length > 0) {
                  const importedTheme = bundle.settings.themes[0];
                  setDraftTheme(importedTheme);
                }
              } catch (err) {
                console.error('Failed to import settings file:', err);
              }
              e.target.value = '';
            }}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const defaultTheme =
                  DEFAULT_THEMES.find((t) => t.id === draftTheme.id) || DEFAULT_THEMES[0];
                const defaultBound = resolveEffectiveBoundary(defaultTheme);
                setDraftRouting({ ...DEFAULT_ROUTING_SETTINGS });
                setDraftTheme({
                  ...defaultTheme,
                  customFontName: defaultTheme.customFontName || 'Montserrat',
                  subtextFontName: defaultTheme.subtextFontName || '',
                  baseFontSizePx: defaultTheme.baseFontSizePx ?? 64,
                  subtextFontSizePx: defaultTheme.subtextFontSizePx ?? 28,
                  fontWeight: defaultTheme.fontWeight || 'bold',
                  fontStyle: defaultTheme.fontStyle || 'normal',
                  underline: defaultTheme.underline ?? false,
                  textTransform:
                    defaultTheme.textTransform ||
                    (defaultTheme.uppercase ? 'uppercase' : 'none'),
                  wordWrapMode: defaultTheme.wordWrapMode || 'balance',
                  overflowBehavior: defaultTheme.overflowBehavior || 'auto-fit',
                  lineHeight: defaultTheme.lineHeight ?? 1.25,
                  letterSpacingEm: defaultTheme.letterSpacingEm ?? 0.02,
                  wordSpacingPx: defaultTheme.wordSpacingPx ?? 0,
                  lineGapPx: defaultTheme.lineGapPx ?? 8,
                  strokeWidthPx: defaultTheme.strokeWidthPx ?? 0,
                  strokeColor: defaultTheme.strokeColor || '#000000',
                  boundary: { ...defaultBound, showGuideOnPreview: true },
                });
                onUpdateRouting({ ...DEFAULT_ROUTING_SETTINGS });
                if (onResetAllDefaults) {
                  onResetAllDefaults();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-xs font-black text-red-300 border-2 border-red-500/60 flex items-center gap-1.5"
              title="Reset all Display, Screen Routing, Font, Transition, and Boundary settings back to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Settings</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAll(true)}
              className="px-3.5 py-2 rounded-xl bg-booth-800 hover:bg-booth-700 text-xs font-bold text-slate-200 border border-booth-600 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Save as New Theme Preset</span>
            </button>

            <button
              type="button"
              onClick={() => settingsImportRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 text-xs font-bold text-sky-300 border border-booth-700 flex items-center gap-1.5"
              title="Import Display Routing, Transition & Boundary Settings from JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Settings</span>
            </button>

            <button
              type="button"
              onClick={() =>
                exportSettingsJson({
                  themes: [draftTheme],
                  routingSettings: draftRouting,
                  logoTitle: 'FREEWORSHIP SANCTUARY',
                  logoSubtitle: 'WORSHIP • WORD • COMMUNITY',
                })
              }
              className="px-3 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 text-xs font-bold text-amber-300 border border-booth-700 flex items-center gap-1.5"
              title="Export Display Routing, Transition & Boundary Settings to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Settings</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 text-xs font-bold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveAll(false)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
            >
              <Check className="w-4 h-4" />
              <span>Apply Display & Boundary Settings Live</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
