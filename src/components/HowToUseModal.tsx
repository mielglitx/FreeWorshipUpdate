import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  ListMusic,
  Monitor,
  MousePointerClick,
  Music,
  Pause,
  Play,
  QrCode,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  Type,
  Wifi,
  X,
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAndroidSetup?: () => void;
  onStartLiveTour?: () => void;
  platform?: 'pc' | 'android';
}

type GuideTab = 'tour' | 'elements' | 'workflows' | 'android-connect';

interface SceneStepInfo {
  title: string;
  subtitle: string;
}

const SCENE_TITLES: Array<{ id: number; label: string; badge: string }> = [
  { id: 0, label: '1. App Layout Map', badge: 'PC' },
  { id: 1, label: '2. Go Live & Panic Keys', badge: 'PC' },
  { id: 2, label: '3. QR & Scan PC Connect', badge: 'PC + Android' },
  { id: 3, label: '4. Android Control & Add', badge: 'Android' },
];

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onOpenAndroidSetup,
  onStartLiveTour,
  platform = 'pc',
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('tour');
  const [sceneIndex, setSceneIndex] = useState<number>(platform === 'android' ? 2 : 0);
  const [stepTick, setStepTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setSceneIndex(platform === 'android' ? 2 : 0);
    setStepTick(0);
    setIsPlaying(true);
  }, [isOpen, platform]);

  // Auto-advance animated step inside current scene (and cycle cleanly when playing)
  useEffect(() => {
    if (!isOpen || activeTab !== 'tour' || !isPlaying) return;
    const timer = window.setInterval(() => {
      setStepTick((prev) => {
        if (prev >= 3) {
          setSceneIndex((s) => (s + 1) % SCENE_TITLES.length);
          return 0;
        }
        return prev + 1;
      });
    }, 2800);
    return () => window.clearInterval(timer);
  }, [isOpen, activeTab, isPlaying]);

  if (!isOpen) return null;

  const scene0Steps: SceneStepInfo[] = [
    {
      title: 'Top Control Bar',
      subtitle:
        'Dropdown Menus (File, Output, View, Tools, Help), Panic Buttons [B/L/C], 2nd & 3rd Screen launchers, and the Android APK + QR button.',
    },
    {
      title: 'Left Resource Library (Songs • Bible • Media • Themes)',
      subtitle:
        'Search worship songs or offline 66-book Bible verses, pick motion backgrounds, play worship pads, or edit projection themes.',
    },
    {
      title: 'Center Preview, Live & Program Monitors',
      subtitle:
        'Inspect songs safely in Preview, double-click to project Live, and monitor the exact 2nd Screen output (with Song Title & Book Chapter:Verse).',
    },
    {
      title: 'Right Service Schedule & Countdown Alerts',
      subtitle:
        'Build your ordered Run-of-Show playlist, reorder items, save/load schedule files, start service countdown timers, and send Stage Alerts.',
    },
  ];

  const scene1Steps: SceneStepInfo[] = [
    {
      title: 'Step 1 — Click a Song or Verse to Preview Safely',
      subtitle:
        'Single-clicking any song lets you inspect lyrics and verses in Preview without changing what the congregation currently sees.',
    },
    {
      title: 'Step 2 — Double-Click or Press "Go Live" to Project',
      subtitle:
        'Only the active slide highlights green (ON AIR). Your 2nd Monitor displays lyrics cleanly along with the Song Title or Book Chapter:Verse.',
    },
    {
      title: 'Step 3 — Emergency Panic [B] Blackout & [L] Logo',
      subtitle:
        'Press [B] to black out the screen instantly, or [L] to display your Sanctuary Logo during transitions and altar calls.',
    },
    {
      title: 'Step 4 — [C] Clear Text & [Esc] Restore',
      subtitle:
        'Press [C] to hide lyrics while keeping motion backgrounds playing, or [Esc] to restore normal live projection immediately.',
    },
  ];

  const scene2Steps: SceneStepInfo[] = [
    {
      title: 'Step 1 — Open "Android APK" on Windows & Scan QR',
      subtitle:
        'Click Android APK in the top-right bar. Scan the QR code with your phone camera (on the same Wi-Fi) or download the .apk directly.',
    },
    {
      title: 'Step 2 — Allow Firewall & Same Wi-Fi Check',
      subtitle:
        'Keep both devices on the same Wi-Fi network. Click "Allow Port in Windows Firewall" and accept the Windows admin prompt once.',
    },
    {
      title: 'Step 3 — Tap "Scan PC" on Android 3rd Monitor',
      subtitle:
        'Native UDP broadcast and multi-threaded Wi-Fi scanning automatically locate your laptop in seconds (or enter PC IP manually).',
    },
    {
      title: 'Step 4 — Connected Notification on Both PC & Android!',
      subtitle:
        'As soon as the link locks in, both Windows Studio and Android show a green "Connected" notification banner and sync live.',
    },
  ];

  const scene3Steps: SceneStepInfo[] = [
    {
      title: 'Step 1 — Stage Confidence 3rd Monitor View',
      subtitle:
        'Worship leaders & band see large ON AIR lyrics, chord charts, UP NEXT slide, service countdown timer, and clock.',
    },
    {
      title: 'Step 2 — Tap "NEXT SLIDE" or Any Slide Card',
      subtitle:
        'Control the Windows PC and 2nd Monitor projector wirelessly from anywhere in the sanctuary with zero-latency Wi-Fi commands.',
    },
    {
      title: 'Step 3 — Open "Song / Bible" Tab to Add to Schedule',
      subtitle:
        'Pick any Book, Chapter & Verse (or search/create a Song) on Android and tap + Schedule or Go Live.',
    },
    {
      title: 'Step 4 — Instant Sync Straight to PC Schedule & Projector',
      subtitle:
        'Your newly added Bible passage or worship song appears in the PC Service Schedule immediately and projects live to the 2nd Monitor!',
    },
  ];

  const allStepLists = [scene0Steps, scene1Steps, scene2Steps, scene3Steps];
  const currentStepInfo = allStepLists[sceneIndex][stepTick % 4];

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-booth-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-booth-950 via-booth-900 to-sky-950/40 border-b border-booth-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-black text-white text-sm sm:text-base truncate">
                How to Use FreeWorship — Animated Guide (PC &amp; Android)
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Interactive visual walkthrough, UI map, and step-by-step Wi-Fi connection tutorial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onStartLiveTour && (
              <button
                type="button"
                onClick={onStartLiveTour}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Live UI Tour (Voice)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-booth-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              title="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-2 bg-booth-950 border-b border-booth-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('tour')}
            className={`px-3 py-2 rounded-t-lg text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'tour'
                ? 'border-amber-400 text-amber-300 bg-booth-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Animated Tour</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('elements')}
            className={`px-3 py-2 rounded-t-lg text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'elements'
                ? 'border-amber-400 text-amber-300 bg-booth-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>UI Map &amp; Elements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-2 rounded-t-lg text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'workflows'
                ? 'border-emerald-400 text-emerald-300 bg-booth-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>PC &amp; Android Workflows</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('android-connect')}
            className={`px-3 py-2 rounded-t-lg text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'android-connect'
                ? 'border-sky-400 text-sky-300 bg-booth-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Connect Android to PC</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-slate-200 leading-relaxed">
          {/* ================= TAB 1: ANIMATED INTERACTIVE VISUAL TOUR ================= */}
          {activeTab === 'tour' && (
            <div className="space-y-3.5">
              {/* Scene Selector Pills + Playback Controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SCENE_TITLES.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setSceneIndex(sc.id);
                        setStepTick(0);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition ${
                        sceneIndex === sc.id
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                          : 'bg-booth-950 text-slate-300 border-booth-700 hover:border-slate-500'
                      }`}
                    >
                      <span>{sc.label}</span>
                      <span
                        className={`px-1 py-0.2 text-[9px] font-black uppercase ${
                          sceneIndex === sc.id
                            ? 'bg-black/20 text-slate-950'
                            : 'bg-booth-800 text-amber-300'
                        }`}
                      >
                        {sc.badge}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-booth-950 border border-booth-800 p-1">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="px-2 py-1 bg-booth-850 hover:bg-booth-800 text-amber-300 font-bold text-[11px] flex items-center gap-1"
                    title={isPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepTick((t) => (t + 3) % 4)}
                    className="p-1 bg-booth-850 hover:bg-booth-800 text-slate-300"
                    title="Previous Step"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepTick((t) => (t + 1) % 4)}
                    className="p-1 bg-booth-850 hover:bg-booth-800 text-slate-300"
                    title="Next Step"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Animated Visual Stage Canvas */}
              <div className="bg-black border-2 border-booth-700 p-3 sm:p-4 space-y-3 shadow-inner">
                {/* SCENE 0: UI LAYOUT MAP SPOTLIGHT */}
                {sceneIndex === 0 && (
                  <div className="space-y-2.5">
                    {/* Top Control Bar */}
                    <div
                      onClick={() => {
                        setStepTick(0);
                        setIsPlaying(false);
                      }}
                      className={`p-2 border-2 transition-all duration-300 cursor-pointer flex items-center justify-between gap-2 text-[10px] ${
                        stepTick === 0
                          ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20 scale-[1.01]'
                          : 'border-booth-800 bg-booth-900/90 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <span className="text-cyan-400 font-black">FREEWORSHIP</span>
                        <span className="px-1.5 py-0.5 bg-booth-800">File</span>
                        <span className="px-1.5 py-0.5 bg-booth-800">Output</span>
                        <span className="px-1.5 py-0.5 bg-booth-800">View</span>
                        <span className="px-1.5 py-0.5 bg-booth-800">Tools</span>
                        <span className="px-1.5 py-0.5 bg-emerald-500/25 text-emerald-300 border border-emerald-500/50">
                          Help
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 bg-red-600/30 border border-red-500/50 text-red-200 font-bold">
                          Blackout [B]
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-500/30 border border-amber-500/50 text-amber-200 font-bold">
                          Logo [L]
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          2nd Screen
                        </span>
                        <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                          Android APK
                        </span>
                      </div>
                    </div>

                    {/* 3-Column Booth Body */}
                    <div className="grid grid-cols-12 gap-2.5 min-h-[210px]">
                      {/* Left Library */}
                      <div
                        onClick={() => {
                          setStepTick(1);
                          setIsPlaying(false);
                        }}
                        className={`col-span-3 border-2 p-2.5 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                          stepTick === 1
                            ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                            : 'border-booth-800 bg-booth-900/80 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-black uppercase text-emerald-300">
                            Left Library
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[9px] font-bold">
                            <span className="p-1 bg-amber-500 text-black text-center">Songs</span>
                            <span className="p-1 bg-booth-800 text-slate-300 text-center">Bible</span>
                            <span className="p-1 bg-booth-800 text-slate-300 text-center">Media</span>
                            <span className="p-1 bg-booth-800 text-slate-300 text-center">Themes</span>
                          </div>
                          <div className="p-1.5 bg-booth-950 border border-booth-800 text-[9px] text-slate-300 space-y-1">
                            <div className="truncate font-bold text-white">♪ Amazing Grace</div>
                            <div className="truncate text-slate-400">♪ Great Is Thy...</div>
                            <div className="truncate text-emerald-300">John 3:16 (KJV)</div>
                          </div>
                        </div>
                        <div className="text-[9px] text-emerald-300 font-bold flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          <span>Click = Preview • 2x = Live</span>
                        </div>
                      </div>

                      {/* Center Workspace */}
                      <div
                        onClick={() => {
                          setStepTick(2);
                          setIsPlaying(false);
                        }}
                        className={`col-span-6 border-2 p-2.5 flex flex-col justify-between gap-2 transition-all duration-300 cursor-pointer ${
                          stepTick === 2
                            ? 'border-sky-400 bg-sky-500/10 shadow-lg shadow-sky-500/20 scale-[1.01]'
                            : 'border-booth-800 bg-booth-900/80 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <div className="border border-amber-500/50 bg-booth-950 p-2 space-y-1">
                            <div className="text-[9px] font-black text-amber-400 uppercase">
                              Preview Deck
                            </div>
                            <div className="p-1.5 bg-amber-500/15 border border-amber-400 text-[9px] text-white">
                              Verse 1 • Safe Check
                            </div>
                            <div className="p-1.5 bg-booth-900 border border-booth-800 text-[9px] text-slate-400">
                              Chorus
                            </div>
                          </div>
                          <div className="border border-emerald-500/60 bg-booth-950 p-2 space-y-1">
                            <div className="text-[9px] font-black text-emerald-400 uppercase">
                              Live Deck
                            </div>
                            <div className="p-1.5 bg-emerald-500/25 border-2 border-emerald-400 text-[9px] text-white font-bold">
                              ON AIR • Verse 1
                            </div>
                            <div className="p-1.5 bg-booth-900 border border-booth-800 text-[9px] text-slate-400">
                              Verse 2 (No Highlight)
                            </div>
                          </div>
                        </div>

                        <div className="border border-emerald-500/40 bg-gradient-to-r from-slate-900 to-sky-950/60 p-2 flex items-center justify-between">
                          <div>
                            <div className="text-[9px] font-black text-emerald-300 uppercase">
                              Program Live Output (2nd Screen)
                            </div>
                            <div className="text-[10px] text-white font-bold">
                              ♪ Amazing Grace • Verse 1
                            </div>
                          </div>
                          <Monitor className="w-5 h-5 text-emerald-400" />
                        </div>
                      </div>

                      {/* Right Schedule */}
                      <div
                        onClick={() => {
                          setStepTick(3);
                          setIsPlaying(false);
                        }}
                        className={`col-span-3 border-2 p-2.5 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                          stepTick === 3
                            ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20 scale-[1.02]'
                            : 'border-booth-800 bg-booth-900/80 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-black uppercase text-amber-300">
                            Right Schedule
                          </div>
                          <div className="space-y-1 text-[9px]">
                            <div className="p-1 bg-booth-950 border border-emerald-500 text-white font-bold truncate">
                              1. Amazing Grace
                            </div>
                            <div className="p-1 bg-booth-950 border border-booth-800 text-slate-300 truncate">
                              2. Psalms 23:1–6
                            </div>
                            <div className="p-1 bg-booth-950 border border-booth-800 text-slate-400 truncate">
                              3. Sermon Notes
                            </div>
                          </div>
                        </div>
                        <div className="p-1.5 bg-booth-950 border border-booth-800 text-[9px] text-amber-300 font-mono text-center">
                          Timer 05:00 • Alerts
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCENE 1: PC LIVE PROJECTION & PANIC CONTROLS */}
                {sceneIndex === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center min-h-[245px]">
                    {/* Simulated Operator Click Panel */}
                    <div className="md:col-span-5 bg-booth-900 border border-booth-700 p-3 space-y-2.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Operator Control Demo
                      </div>

                      <div
                        className={`p-2 border transition-all duration-300 ${
                          stepTick === 0
                            ? 'border-amber-400 bg-amber-500/15 animate-fw-tap'
                            : 'border-booth-800 bg-booth-950'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-300">1. Preview Song Slide</span>
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          Amazing grace how sweet the sound...
                        </p>
                      </div>

                      <div
                        className={`p-2 border flex items-center justify-between transition-all duration-300 ${
                          stepTick === 1
                            ? 'border-emerald-400 bg-emerald-500/20 animate-fw-tap'
                            : 'border-booth-800 bg-booth-950'
                        }`}
                      >
                        <span className="text-[10px] font-black text-emerald-300">
                          2. Double-Click / Go Live
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500 text-black font-black text-[9px]">
                          ON AIR
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[9px] font-black text-center">
                        <div
                          className={`p-1.5 border transition-all ${
                            stepTick === 2
                              ? 'bg-red-600 text-white border-red-300 animate-pulse'
                              : 'bg-booth-950 text-slate-400 border-booth-800'
                          }`}
                        >
                          <EyeOff className="w-3 h-3 mx-auto mb-0.5" />
                          [B]
                        </div>
                        <div
                          className={`p-1.5 border transition-all ${
                            stepTick === 2
                              ? 'bg-amber-500 text-black border-amber-200 animate-pulse'
                              : 'bg-booth-950 text-slate-400 border-booth-800'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 mx-auto mb-0.5" />
                          [L]
                        </div>
                        <div
                          className={`p-1.5 border transition-all ${
                            stepTick === 3
                              ? 'bg-sky-500 text-black border-sky-200 animate-pulse'
                              : 'bg-booth-950 text-slate-400 border-booth-800'
                          }`}
                        >
                          <Type className="w-3 h-3 mx-auto mb-0.5" />
                          [C]
                        </div>
                        <div
                          className={`p-1.5 border transition-all ${
                            stepTick === 3
                              ? 'bg-emerald-500 text-black border-emerald-200'
                              : 'bg-booth-950 text-slate-400 border-booth-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 mx-auto mb-0.5" />
                          [Esc]
                        </div>
                      </div>
                    </div>

                    {/* Arrow Link */}
                    <div className="md:col-span-1 flex justify-center">
                      <ArrowRight
                        className={`w-6 h-6 transition-transform duration-300 ${
                          stepTick >= 1 ? 'text-emerald-400 translate-x-1' : 'text-slate-600'
                        }`}
                      />
                    </div>

                    {/* Simulated 2nd Monitor Projector Screen */}
                    <div className="md:col-span-6 relative h-[210px] border-2 border-emerald-500/70 bg-gradient-to-br from-slate-900 via-sky-950 to-amber-950/60 p-4 flex flex-col justify-center items-center text-center overflow-hidden shadow-2xl">
                      {/* Song Title / Reference Badge */}
                      {stepTick !== 2 && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/55 border border-white/20 text-[10px] font-bold text-white flex items-center gap-1">
                          <Music className="w-3 h-3 text-amber-400" />
                          <span>Amazing Grace (Chains Are Gone)</span>
                        </div>
                      )}

                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-black text-emerald-300 uppercase">
                        2nd Monitor Output
                      </div>

                      {stepTick === 0 && (
                        <div className="text-slate-400 text-xs italic animate-fade-in">
                          Previous Slide Still Showing Safely...
                        </div>
                      )}

                      {stepTick === 1 && (
                        <div className="space-y-1 animate-fade-in">
                          <p className="text-sm sm:text-base font-black text-white drop-shadow">
                            Amazing grace how sweet the sound
                          </p>
                          <p className="text-sm sm:text-base font-black text-white drop-shadow">
                            That saved a wretch like me
                          </p>
                        </div>
                      )}

                      {stepTick === 2 && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="w-12 h-12 mx-auto bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                          </div>
                          <div className="text-xs font-black tracking-widest text-amber-300 uppercase">
                            LOGO MODE ACTIVE [L] / BLACKOUT [B]
                          </div>
                        </div>
                      )}

                      {stepTick === 3 && (
                        <div className="space-y-1.5 animate-fade-in">
                          <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                            Background Motion Playing • Lyrics Cleared [C] → Restored [Esc]
                          </div>
                          <p className="text-sm font-black text-emerald-200">
                            I once was lost, but now am found
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SCENE 2: QR CODE & ANDROID WI-FI CONNECTION */}
                {sceneIndex === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center min-h-[245px]">
                    {/* Windows Laptop Card */}
                    <div className="md:col-span-4 bg-booth-900 border-2 border-sky-500/60 p-3 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-sky-300 flex items-center gap-1">
                          <Monitor className="w-3.5 h-3.5" /> Windows PC Host
                        </span>
                        <span className="text-[9px] font-mono text-amber-300">192.168.1.50:5174</span>
                      </div>

                      <div className="p-2 bg-booth-950 border border-booth-800 flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-emerald-300">
                            1. Click Android APK
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Scan QR or Allow Firewall
                          </div>
                        </div>
                        <div
                          className={`p-1.5 bg-white transition-transform duration-300 ${
                            stepTick === 0 ? 'scale-110 ring-2 ring-emerald-400' : ''
                          }`}
                        >
                          <QrCode className="w-8 h-8 text-black" />
                        </div>
                      </div>

                      <div
                        className={`p-1.5 border text-[9px] font-bold flex items-center gap-1.5 ${
                          stepTick === 1
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-booth-950 border-booth-800 text-slate-400'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>TCP 5174/5173 + UDP 41234 Allowed</span>
                      </div>

                      {stepTick === 3 && (
                        <div className="p-1.5 bg-emerald-950 border border-emerald-400 text-emerald-200 text-[10px] font-black flex items-center gap-1.5 animate-fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>3rd Monitor (Android) Connected!</span>
                        </div>
                      )}
                    </div>

                    {/* Animated Wi-Fi & UDP Discovery Bridge */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center gap-2 py-2">
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`absolute w-10 h-10 rounded-full border-2 border-emerald-400 ${
                            stepTick >= 1 ? 'animate-fw-radar' : 'opacity-0'
                          }`}
                        />
                        <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                          <Wifi className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Packet Bar */}
                      <div className="w-full h-2 bg-booth-900 border border-booth-700 overflow-hidden relative">
                        <div
                          className={`h-full w-1/3 bg-gradient-to-r from-amber-400 to-emerald-400 ${
                            stepTick >= 2 ? 'animate-fw-packet' : 'opacity-30'
                          }`}
                        />
                      </div>

                      <div className="text-[9px] font-mono uppercase tracking-wider text-center text-emerald-300 font-bold">
                        {stepTick === 0 && 'QR -> Download APK'}
                        {stepTick === 1 && 'Same Wi-Fi + Firewall'}
                        {stepTick === 2 && 'UDP Discover + Scan...'}
                        {stepTick === 3 && '0ms Live Sync Active!'}
                      </div>
                    </div>

                    {/* Android Phone Card */}
                    <div className="md:col-span-4 bg-booth-900 border-2 border-amber-500/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" /> Android 3rd Monitor
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold ${
                            stepTick === 3
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {stepTick === 3 ? 'LIVE SYNCED' : 'CONNECTING'}
                        </span>
                      </div>

                      <div className="p-2 bg-booth-950 border border-booth-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-amber-300">
                          {stepTick >= 2 ? '192.168.1.50:5174' : 'PC IP...'}
                        </span>
                        <span
                          className={`px-2 py-1 text-[9px] font-black transition-all ${
                            stepTick === 2
                              ? 'bg-emerald-500 text-black animate-fw-tap'
                              : 'bg-booth-800 text-emerald-300'
                          }`}
                        >
                          Scan PC
                        </span>
                      </div>

                      {stepTick === 3 ? (
                        <div className="p-2 bg-emerald-950 border border-emerald-400 text-emerald-200 text-[10px] font-black flex items-center gap-1.5 animate-fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Successfully Connected to Windows PC!</span>
                        </div>
                      ) : (
                        <div className="p-2 bg-booth-950 border border-booth-800 text-[10px] text-slate-400">
                          Ready for Stage Confidence &amp; Remote Control
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SCENE 3: ANDROID STAGE CONTROL + ADD SONGS/BIBLE */}
                {sceneIndex === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center min-h-[245px]">
                    {/* Android Controller Mockup */}
                    <div className="md:col-span-5 bg-booth-900 border-2 border-emerald-500/60 p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-booth-800 pb-1.5">
                        <span className="text-[10px] font-black uppercase text-emerald-300">
                          Android 3rd Monitor + Remote
                        </span>
                        <span className="text-[9px] font-mono text-amber-300">Chords: G | C/G</span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center">
                        <span
                          className={`p-1 border ${
                            stepTick <= 1
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                              : 'border-booth-800 bg-booth-950 text-slate-400'
                          }`}
                        >
                          Slides
                        </span>
                        <span className="p-1 border border-booth-800 bg-booth-950 text-slate-400">
                          Schedule
                        </span>
                        <span
                          className={`p-1 border ${
                            stepTick >= 2
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                              : 'border-booth-800 bg-booth-950 text-slate-400'
                          }`}
                        >
                          Song / Bible
                        </span>
                        <span className="p-1 border border-booth-800 bg-booth-950 text-slate-400">
                          Tools
                        </span>
                      </div>

                      {stepTick <= 1 ? (
                        <div className="space-y-1.5">
                          <div className="p-2 bg-emerald-950/50 border border-emerald-500 text-[10px] text-white font-bold">
                            ON AIR: Amazing grace how sweet the sound
                          </div>
                          <div
                            className={`py-2 text-center font-black text-[10px] bg-emerald-500 text-black ${
                              stepTick === 1 ? 'animate-fw-tap' : ''
                            }`}
                          >
                            TAP: NEXT SLIDE (LIVE) →
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 animate-fade-in">
                          <div className="p-2 bg-booth-950 border border-emerald-400 text-[10px] text-emerald-200 flex items-center justify-between">
                            <span>John 3:16 (KJV) / New Song</span>
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-black font-black text-[9px] animate-fw-tap">
                              + Schedule / Go Live
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bidirectional Sync Indicator */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center gap-1.5">
                      <div className="w-full h-2 bg-booth-900 border border-booth-700 overflow-hidden relative">
                        <div className="h-full w-1/2 bg-emerald-400 animate-fw-packet" />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-300 font-bold text-center">
                        REMOTE ACTION SYNC
                      </span>
                      <div className="w-full h-2 bg-booth-900 border border-booth-700 overflow-hidden relative">
                        <div className="h-full w-1/2 bg-amber-400 animate-fw-packet-reverse" />
                      </div>
                    </div>

                    {/* PC Schedule & 2nd Monitor Result */}
                    <div className="md:col-span-4 bg-booth-900 border-2 border-amber-500/60 p-3 space-y-2">
                      <div className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                        <Tv className="w-3.5 h-3.5" /> PC Schedule &amp; 2nd Screen
                      </div>
                      <div className="space-y-1 text-[9px]">
                        <div className="p-1.5 bg-booth-950 border border-booth-800 text-slate-300">
                          1. Amazing Grace
                        </div>
                        {stepTick >= 3 && (
                          <div className="p-1.5 bg-emerald-950/60 border border-emerald-400 text-emerald-200 font-bold animate-fade-in">
                            2. John 3:16 (KJV) — Added Live!
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-black border border-emerald-500/50 text-center">
                        <div className="text-[9px] text-amber-300 font-bold">
                          {stepTick >= 3 ? 'John 3:16 (KJV)' : 'Amazing Grace'}
                        </div>
                        <div className="text-[10px] text-white font-semibold mt-0.5">
                          {stepTick === 0 && 'Verse 1 Showing Live'}
                          {stepTick === 1 && 'Verse 2 Projected Instantly!'}
                          {stepTick === 2 && 'Adding Passage from Phone...'}
                          {stepTick === 3 && 'For God so loved the world...'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Animated Step Caption & Progress Dots */}
                <div className="pt-2.5 border-t border-booth-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-amber-300">
                      {currentStepInfo.title}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {currentStepInfo.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {[0, 1, 2, 3].map((dot) => (
                      <button
                        key={dot}
                        type="button"
                        onClick={() => {
                          setStepTick(dot);
                          setIsPlaying(false);
                        }}
                        className={`h-2 transition-all ${
                          stepTick === dot
                            ? 'w-6 bg-amber-400'
                            : 'w-2 bg-booth-700 hover:bg-booth-500'
                        }`}
                        title={`Step ${dot + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: UI MAP & ELEMENTS ================= */}
          {activeTab === 'elements' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-100">
                FreeWorship Studio uses a 4-zone booth console layout designed for fast worship projection: <strong>Top Control Bar</strong>, <strong>Left Library</strong>, <strong>Center Preview &amp; Live Workspace</strong>, and <strong>Right Service Schedule</strong>.
              </div>

              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-2.5">
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-booth-800 pb-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>Top Control Bar (Header)</span>
                </h3>
                <ul className="space-y-2">
                  <li>
                    <strong className="text-amber-300">Dropdown Menus (File • Output • View • Tools • Help) [Top-Left]:</strong>{' '}
                    Save/Load service schedules (<code>.fws</code>/<code>.json</code>), import/export backups, configure Display &amp; Text Boundaries, switch layout/theme, open Android Setup, or open this <strong>How to Use</strong> manual.
                  </li>
                  <li>
                    <strong className="text-red-400">Live Panic Deck (Blackout [B] • Logo [L] • Clear [C] • Restore [Esc]) [Top-Center]:</strong>{' '}
                    Emergency overrides for the 2nd monitor projector. <strong>Blackout</strong> cuts screen to pure black; <strong>Logo</strong> displays your church logo &amp; motion background; <strong>Clear</strong> hides lyrics/scripture while keeping the background moving; <strong>Restore</strong> resumes normal output.
                  </li>
                  <li>
                    <strong className="text-emerald-300">2nd Screen &amp; 3rd Screen Buttons [Top-Right]:</strong>{' '}
                    Launches fullscreen borderless output windows onto your church projector (Screen 2) and hardware stage monitor (Screen 3).
                  </li>
                  <li>
                    <strong className="text-sky-300">Android APK Button [Top-Right]:</strong>{' '}
                    Quick access to download/save the <code>.apk</code> installer file, scan the QR code from your Android phone over Wi-Fi, view your PC&apos;s Wi-Fi IP address, and configure Windows Firewall.
                  </li>
                  <li>
                    <strong className="text-slate-100">OBS Overlay (<Radio className="w-3 h-3 inline text-sky-400" />) &amp; Layout Switchers (Split / Live / Prev) [Top-Right]:</strong>{' '}
                    Opens a transparent lower-thirds window for OBS/vMix livestreaming, and switches the center workspace between Side-by-Side (Preview &amp; Live), Live Only, or Preview Only.
                  </li>
                </ul>
              </div>

              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-2.5">
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-booth-800 pb-2">
                  <Music className="w-4 h-4 text-amber-400" />
                  <span>Left Panel — Resource Library</span>
                </h3>
                <ul className="space-y-2">
                  <li>
                    <strong className="text-amber-300">Songs Tab:</strong>{' '}
                    Search your worship song bank, click <strong>+ New</strong> to author songs with chords and section tags, single-click to inspect in <strong>Preview</strong>, double-click to project live immediately, or click <strong>+ Schedule</strong> / drag into the right-hand Run-of-Show.
                  </li>
                  <li>
                    <strong className="text-emerald-300">Bible Tab:</strong>{' '}
                    Offline 66-book multi-translation Scripture engine (<code>KJV</code>, <code>NIV</code>, <code>NASB</code>, <code>ESV</code>, <code>MBB 1901</code>, plus custom XML/JSON imports). Filter by Book/Chapter or type shorthand like <code>John 3:16-18</code>, select verses, and send to Schedule or Project Live.
                  </li>
                  <li>
                    <strong className="text-sky-300">Media Tab:</strong>{' '}
                    Built-in motion loops, dark gradients, custom image/MP4/WebM video uploads, and Default Sanctuary Logo selection. Drag media directly onto schedule items or assign defaults for songs and scripture.
                  </li>
                  <li>
                    <strong className="text-purple-300">Audio Tab:</strong>{' '}
                    Built-in worship pads and backing track player for pre-service music or altar call underscore.
                  </li>
                  <li>
                    <strong className="text-pink-300">Themes Tab:</strong>{' '}
                    Customize fonts, sizes, outlines/shadows, text boundary rectangles, lower-thirds bands, slide transitions, and upload your custom church logo for the <code>[L]</code> Logo screen.
                  </li>
                </ul>
              </div>

              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-2.5">
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-booth-800 pb-2">
                  <Tv className="w-4 h-4 text-sky-400" />
                  <span>Center Panel — Preview, Live &amp; Output Monitors</span>
                </h3>
                <ul className="space-y-2">
                  <li>
                    <strong className="text-amber-300">Preview Deck:</strong>{' '}
                    Browse slides of any song from your library safely before going live. Single-click previews locally; <strong>double-click</strong> or click <strong>Go Live</strong> to push to the 2nd monitor projector.
                  </li>
                  <li>
                    <strong className="text-emerald-300">Live Deck:</strong>{' '}
                    Displays all slides of the currently active item. Only the currently projected slide is highlighted in green (<strong>ON AIR</strong>). Use <strong>Jump</strong> buttons, <strong>Prev/Next</strong>, live quick-edit, or <strong>+ Quick Slide</strong>.
                  </li>
                  <li>
                    <strong className="text-white">Bottom Program Live &amp; Preview Monitors:</strong>{' '}
                    The left monitor shows the exact live image sent to the <strong>2nd Monitor (Projector)</strong>, including the <strong>Song Title</strong> or <strong>Book Chapter:Verse</strong> overlay.
                  </li>
                </ul>
              </div>

              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-2.5">
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-booth-800 pb-2">
                  <ListMusic className="w-4 h-4 text-amber-400" />
                  <span>Right Panel — Service Schedule &amp; Stage Alerts</span>
                </h3>
                <ul className="space-y-2">
                  <li>
                    <strong className="text-amber-300">Service Schedule (Run-of-Show):</strong>{' '}
                    Holds your ordered Sunday service flow. Reorder items, click any item to cue it into Live, or save/load the schedule from <strong>File &gt; Save / Load Schedule</strong>.
                  </li>
                  <li>
                    <strong className="text-emerald-300">Stage Countdown &amp; Nursery Alerts (Bottom-Right):</strong>{' '}
                    Start/pause the service countdown timer and send messages directly to the 3rd Stage Monitor (or Urgent notices onto the main projector).
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ================= TAB 3: HOW TO USE PC & ANDROID ================= */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="bg-booth-950 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2 border-b border-booth-800 pb-2">
                  <Monitor className="w-4 h-4" />
                  <span>Using the Windows Desktop Studio App</span>
                </h3>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Open Output Screens:</strong> Click <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">2nd Screen</span> in the top-right bar to send fullscreen projection to your church projector/TV.
                  </li>
                  <li>
                    <strong>Build Your Service Schedule:</strong> Go to the <strong>Songs</strong> or <strong>Bible</strong> tab on the left, pick items, and click <strong>+ Schedule</strong> (or drag and drop into the right panel). Save schedules anytime with <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono text-amber-300">Ctrl+S</kbd>.
                  </li>
                  <li>
                    <strong>Preview Before Projecting:</strong> Single-click any song in the library to view its lyrics in <strong>Preview</strong> without interrupting what is currently live. Double-click a slide (or click <strong>Go Live</strong>) when ready.
                  </li>
                  <li>
                    <strong>Operate Live Slides:</strong> Click any slide in the <strong>Live</strong> deck or press <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono text-amber-300">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono text-amber-300">→</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono text-amber-300">←</kbd>. The 2nd monitor automatically displays the active lyrics/verse along with the <strong>Song Title</strong> or <strong>Book Chapter:Verse</strong>.
                  </li>
                  <li>
                    <strong>Spontaneous Changes &amp; Panic Keys:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono">B</kbd> (Blackout), <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono">L</kbd> (Logo), <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono">C</kbd> (Clear Text), or <kbd className="px-1.5 py-0.5 rounded bg-booth-800 font-mono">Esc</kbd> (Restore).
                  </li>
                </ol>
              </div>

              <div className="bg-booth-950 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2 border-b border-booth-800 pb-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Using the Android 3rd Monitor &amp; Remote App</span>
                </h3>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Choose Your View Mode:</strong> Switch between <strong>3rd Monitor + Remote</strong>, <strong>Full 3rd Monitor</strong> (for singers/band showing Current Slide, Chords, Up Next, Timer &amp; Clock), or <strong>Full Controller</strong>.
                  </li>
                  <li>
                    <strong>Control Projector Slides Remotely:</strong> Use <strong>PREV SLIDE</strong> / <strong>NEXT SLIDE (LIVE)</strong> or tap any slide card in <strong>Slides</strong>. You can also trigger <strong>Blackout</strong>, <strong>Logo</strong>, <strong>Clear Text</strong>, and <strong>Restore</strong>.
                  </li>
                  <li>
                    <strong>Navigate Schedule Items:</strong> Open the <strong>Schedule</strong> tab to switch the active live song or scripture, or remove items.
                  </li>
                  <li>
                    <strong>Add Songs &amp; Bible Verses Remotely:</strong> Tap <strong>Song / Bible</strong> (or click <strong>+ Add Song / Bible</strong> inside Schedule). Search PC songs, create a custom song, or pick Book/Chapter/Verse + Translation—then tap <strong>+ Schedule</strong> or <strong>Go Live</strong>.
                  </li>
                  <li>
                    <strong>Timer &amp; Stage Alerts:</strong> Use the <strong>Tools</strong> tab to control the countdown timer or send stage/nursery alerts.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ================= TAB 4: CONNECT ANDROID TO PC ================= */}
          {activeTab === 'android-connect' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 flex-1 min-w-[240px]">
                  <div className="font-black text-sky-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Zero-Cloud Local Wi-Fi Sync (Port 5174)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    No internet required—your Android device connects directly to this PC over your local church Wi-Fi router or hotspot.
                  </p>
                </div>
                {onOpenAndroidSetup && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAndroidSetup();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Open Android APK &amp; QR Hub</span>
                  </button>
                )}
              </div>

              <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-black text-white border-b border-booth-800 pb-2">
                  Step-by-Step Connection Guide
                </h3>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-booth-900 border border-booth-800">
                    <div className="font-bold text-amber-300">Step 1: Connect Both Devices to the Same Wi-Fi</div>
                    <p className="text-slate-300 mt-0.5">
                      Connect both your Windows PC and Android device to the <strong>same Wi-Fi network</strong> (or connect the PC to the Android phone&apos;s Wi-Fi Hotspot). Turn off VPNs on the phone.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-booth-900 border border-booth-800">
                    <div className="font-bold text-emerald-300">Step 2: Install the Android APK via QR Code</div>
                    <p className="text-slate-300 mt-0.5">
                      Click <strong>Android APK</strong> in the top-right bar of FreeWorship Studio. Scan the <strong>QR code</strong> with your Android phone camera to download &amp; install directly over Wi-Fi (or click <strong>Download APK Installer</strong> to save the file).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-booth-900 border border-booth-800">
                    <div className="font-bold text-sky-300">Step 3: Auto-Discover Using &ldquo;Scan PC&rdquo;</div>
                    <p className="text-slate-300 mt-0.5">
                      Keep FreeWorship Studio open on Windows, open <strong>FreeWorship 3rd Monitor</strong> on Android, and tap <strong>Scan PC</strong>. Both PC and Android will pop up a green connection confirmation once synced.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-booth-900 border border-booth-800">
                    <div className="font-bold text-white">Step 4: Manual Connection (Optional Backup)</div>
                    <p className="text-slate-300 mt-0.5">
                      Type the PC&apos;s local IP shown in the Android APK hub (e.g. <code>192.168.1.50:5174</code>) into the <strong>PC IP</strong> box on Android and tap <strong>Connect</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Windows Firewall &amp; Network Profile Troubleshooting</span>
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  <li>
                    <strong>Allow Ports with Admin Prompt:</strong> Click <strong>Allow Port in Windows Firewall</strong> inside the <em>Android APK</em> window and select <strong>Yes</strong> on the Windows Administrator prompt to unblock TCP <code>5174, 5173</code> and UDP <code>41234</code>.
                  </li>
                  <li>
                    <strong>Set Windows Wi-Fi Profile to Private:</strong> In <em>Windows Settings &gt; Network &amp; Internet &gt; Wi-Fi</em>, set the profile to <strong>Private</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-booth-950 border-t border-booth-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {platform === 'android'
                ? 'Switch tabs above to replay animations or read setup steps'
                : 'Tip: Press ? anytime for Keyboard Shortcuts'}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition shadow"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
