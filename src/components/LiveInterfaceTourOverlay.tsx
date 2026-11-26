import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

export interface LiveTourStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  audioUrl: string;
  tip?: string;
  onEnter?: () => void;
}

export const PC_LIVE_TOUR_STEPS: Omit<LiveTourStep, 'onEnter'>[] = [
  {
    id: 'pc-01',
    selector: '[data-tour="pc-menus"]',
    title: '1. Top Menu Bar (File • Output • View • Tools • Help)',
    description:
      'Use File to save and load service schedules (.fws/.json), Output to configure your 2nd & 3rd monitors, View to change layout/theme, Tools for Android setup, and Help to reopen this live tour.',
    audioUrl: './tour-audio/pc-01.mp3',
    tip: 'Shortcuts: Ctrl+S Save Schedule • Ctrl+O Load Schedule',
  },
  {
    id: 'pc-02',
    selector: '[data-tour="pc-panic"]',
    title: '2. Emergency Panic Deck (Blackout • Logo • Clear)',
    description:
      'Instantly control what appears on the 2nd Monitor projector: Blackout [B] cuts to black, Logo [L] displays your sanctuary logo, Clear [C] hides lyrics over your motion background, and [Esc] restores live output.',
    audioUrl: './tour-audio/pc-02.mp3',
    tip: 'Keyboard: B = Blackout • L = Logo • C = Clear • Esc = Restore',
  },
  {
    id: 'pc-03',
    selector: '[data-tour="pc-screens"]',
    title: '3. Launch 2nd Screen (Projector Output)',
    description:
      'Click "2nd Screen" to open a borderless fullscreen projection window on your church projector or LED display.',
    audioUrl: './tour-audio/pc-03.mp3',
    tip: 'Assign displays anytime via Output > Display & Boundary Settings',
  },
  {
    id: 'pc-04',
    selector: '[data-tour="pc-android-btn"]',
    title: '4. Mobile / QR Hub (Apple Safari & Android APK)',
    description:
      'Click "Mobile / QR" to scan the Apple Web Remote QR in Safari or download the Android APK over Wi-Fi, view your PC IP address, and configure Windows Firewall.',
    audioUrl: './tour-audio/pc-04.mp3',
    tip: 'Shows a green counter badge whenever mobile or web devices connect',
  },
  {
    id: 'pc-05',
    selector: '[data-tour="pc-left-tabs"]',
    title: '5. Resource Library Tabs',
    description:
      'Switch between Songs, the offline 66-book Bible (KJV, NIV, NASB, ESV, MBB 1901), motion Media backgrounds, worship Audio pads, and slide Themes.',
    audioUrl: './tour-audio/pc-05.mp3',
  },
  {
    id: 'pc-06',
    selector: '[data-tour="pc-song-list"]',
    title: '6. Songs & Bible Library List',
    description:
      'Single-click any song or Scripture passage to inspect it safely in Preview. Click "+ Schedule" (or drag it) to add it to your service order, or double-click to project live right away.',
    audioUrl: './tour-audio/pc-06.mp3',
    tip: 'Click = Preview • Double-click = Go Live Immediately',
  },
  {
    id: 'pc-07',
    selector: '[data-tour="pc-preview-deck"]',
    title: '7. Preview Workspace (Safe Pre-Check)',
    description:
      'Check song verses, chorus jumps, and lyrics here without disturbing what the congregation currently sees. Double-click any slide or click "Go Live" when ready.',
    audioUrl: './tour-audio/pc-07.mp3',
  },
  {
    id: 'pc-08',
    selector: '[data-tour="pc-live-deck"]',
    title: '8. Live Workspace (ON AIR Projection)',
    description:
      'Only the slide currently shown on the projector is highlighted green as ON AIR. Click any slide, use Jump tags, or press Spacebar / Arrow keys to advance smoothly.',
    audioUrl: './tour-audio/pc-08.mp3',
    tip: 'Keys: Space / → Next Slide • ← / ↑ Previous Slide',
  },
  {
    id: 'pc-09',
    selector: '[data-tour="pc-program-monitor"]',
    title: '9. Program Live Output Monitor',
    description:
      'This live mirror shows the exact image appearing on your 2nd Monitor projector—complete with the Song Title or Bible Book, Chapter & Verse overlay.',
    audioUrl: './tour-audio/pc-09.mp3',
  },
  {
    id: 'pc-10',
    selector: '[data-tour="pc-schedule"]',
    title: '10. Service Schedule & Stage Countdown Tools',
    description:
      'Build your Sunday Run-of-Show on the right, save/load schedules, start the pre-service countdown timer, and send stage or nursery alerts.',
    audioUrl: './tour-audio/pc-10.mp3',
    tip: 'You are ready to lead worship! Press Esc or Exit Tour anytime.',
  },
];

export const ANDROID_LIVE_TOUR_STEPS: Omit<LiveTourStep, 'onEnter'>[] = [
  {
    id: 'and-01',
    selector: '[data-tour="and-connect-bar"]',
    title: '1. Connect Android to Windows PC (Scan PC)',
    description:
      'Ensure your phone and Windows laptop share the same Wi-Fi network, then tap "Scan PC" to auto-discover your laptop (or type the PC IP manually and tap Connect).',
    audioUrl: './tour-audio/and-01.mp3',
    tip: 'A green confirmation banner pops on both PC and Android when synced',
  },
  {
    id: 'and-02',
    selector: '[data-tour="and-view-modes"]',
    title: '2. View Mode Switcher',
    description:
      'Switch cleanly between "3rd Monitor + Remote" (Split View), "Full 3rd Monitor" for singers/musicians on stage, or "Full Controller".',
    audioUrl: './tour-audio/and-02.mp3',
  },
  {
    id: 'and-03',
    selector: '[data-tour="and-stage-monitor"]',
    title: '3. 3rd Monitor Stage Confidence Screen',
    description:
      'Shows large ON AIR lyrics, chord charts for your band, the upcoming slide, plus your countdown timer and live wall clock.',
    audioUrl: './tour-audio/and-03.mp3',
  },
  {
    id: 'and-04',
    selector: '[data-tour="and-transport"]',
    title: '4. Wireless Projector & Panic Controls',
    description:
      'Tap "NEXT SLIDE" or "PREV SLIDE" to change slides wirelessly on the 2nd Monitor, or trigger Blackout, Logo, Clear Text, and Restore.',
    audioUrl: './tour-audio/and-04.mp3',
  },
  {
    id: 'and-05',
    selector: '[data-tour="and-tabs"]',
    title: '5. Slides, Schedule & Add Song / Bible Tabs',
    description:
      'Jump directly to any slide, switch Schedule items, or open the "Song / Bible" tab to search/create songs and pick Bible verses to add to the PC Schedule or Go Live!',
    audioUrl: './tour-audio/and-05.mp3',
  },
  {
    id: 'and-06',
    selector: '[data-tour="and-browser-permissions"]',
    title: '6. Keep Screen Awake & Safari Permissions',
    description:
      'In Apple Safari or web browsers, tap "Permissions" to verify Local Network access and tap "Keep Screen Awake" so your stage monitor never dims during worship.',
    audioUrl: './tour-audio/and-06.mp3',
    tip: 'iOS: Settings > Privacy & Security > Local Network > Safari = ON',
  },
];

export type PcTourTopicId =
  | 'essentials'
  | 'display-boundary'
  | 'bible-lookup'
  | 'songs-pptx'
  | 'media-logo'
  | 'audio-pads'
  | 'layout-alerts'
  | 'mobile-apple-qr';

export interface PcTourTopicDefinition {
  id: PcTourTopicId;
  shortLabel: string;
  title: string;
  badge: string;
  description: string;
  steps: Omit<LiveTourStep, 'onEnter'>[];
}

export const PC_TOUR_TOPICS: PcTourTopicDefinition[] = [
  {
    id: 'essentials',
    shortLabel: 'Console Essentials',
    title: 'Core Console Tour (10 Steps)',
    badge: 'Start Here',
    description: 'Top menus, Panic deck, 2nd Screen, Library, Preview vs Live, and Service Schedule.',
    steps: PC_LIVE_TOUR_STEPS,
  },
  {
    id: 'display-boundary',
    shortLabel: '1. Displays & Boundaries',
    title: 'Multi-Display & Text Boundary Designer',
    badge: 'Screens',
    description: 'Assign Projector (Screen 2) & Stage Monitor (Screen 3) and drag the 16:9 safe box.',
    steps: [
      {
        id: 'disp-01',
        selector: '[data-tour="pc-display-settings-btn"]',
        title: '1. Open Display Routing & Boundary Studio',
        description:
          'Click the sliders icon in the top-right bar (or Output > Display & Boundary Settings) to configure your physical monitors and text safe area.',
        audioUrl: './tour-audio/disp-01.mp3',
      },
      {
        id: 'disp-02',
        selector: '[data-tour="modal-display-routing"]',
        title: '2. Assign Projector & Stage Displays',
        description:
          'Click Detect Displays to map Screen 1 Operator, Screen 2 Projector, and Screen 3 Stage Monitor, or toggle Desktop 3rd Screen ON/OFF.',
        audioUrl: './tour-audio/disp-02.mp3',
        tip: 'Turn Desktop 3rd Screen OFF if using Android/iPhone instead of a wired monitor',
      },
      {
        id: 'disp-03',
        selector: '[data-tour="modal-text-boundary"]',
        title: '3. Drag & Resize 16:9 Text Boundary Box',
        description:
          'Switch to Text Boundary & Fonts to drag or resize the yellow safe-area rectangle directly on the 16:9 stage canvas and customize fonts and shadows.',
        audioUrl: './tour-audio/disp-03.mp3',
      },
    ],
  },
  {
    id: 'bible-lookup',
    shortLabel: '2. Continuous Bible',
    title: 'Unified Bible Lookup & Offline 66 Books',
    badge: 'Bible',
    description: 'Type "e" for OT/NT suggestions, jump cleanly to any verse, and scroll 66 books continuously.',
    steps: [
      {
        id: 'bib-01',
        selector: '[data-tour="pc-bible-manager"]',
        title: '1. Pre-Bundled 66-Book Offline Bibles',
        description:
          'Manage built-in offline translations (KJV, NIV, NASB, ESV, MBB 1901) or import your own JSON/XML Bible files with zero internet needed.',
        audioUrl: './tour-audio/bib-01.mp3',
      },
      {
        id: 'bib-02',
        selector: '[data-tour="bible-lookup-bar"]',
        title: '2. Single Smart Bible Search Bar',
        description:
          'Type a letter like "e" to see Exodus through Ephesians ordered Old Testament to New Testament, or type "John 3:16" to jump right to the verse.',
        audioUrl: './tour-audio/bib-02.mp3',
        tip: 'Try: "e" -> Exodus..Ephesians • "John 3:16" -> Jump & Highlight',
      },
      {
        id: 'bib-03',
        selector: '[data-tour="pc-song-list"]',
        title: '3. Highlighted Context in Continuous Scroll',
        description:
          'Searched verses stay inside the seamless 66-book scroll list with preceding and following verses still visible. Select verses to + Schedule or Go Live.',
        audioUrl: './tour-audio/bib-03.mp3',
        tip: 'Click = Select • Shift+Click = Multi-Verse Range • Double-click = Go Live',
      },
    ],
  },
  {
    id: 'songs-pptx',
    shortLabel: '3. Songs & .PPTX',
    title: 'Song Authoring, Import & PowerPoint Export',
    badge: 'Songs/PPTX',
    description: 'Create chorded songs, import .PPTX/.XML/.TXT decks, and export schedules to .PPTX.',
    steps: [
      {
        id: 'song-01',
        selector: '[data-tour="pc-song-new-btn"]',
        title: '1. Create Custom Songs with Chords',
        description:
          'Click + New to write worship songs using [Verse] and [Chorus] section tags plus inline chord brackets like [G] or [Em].',
        audioUrl: './tour-audio/song-01.mp3',
      },
      {
        id: 'song-02',
        selector: '[data-tour="pc-song-io-bar"]',
        title: '2. Import Songs & PowerPoint (.PPTX)',
        description:
          'Import songs from JSON, OpenLyrics XML, ChordPro, or TXT, or click Import .PPTX to load announcement or sermon PowerPoint decks into Schedule.',
        audioUrl: './tour-audio/song-02.mp3',
      },
      {
        id: 'song-03',
        selector: '[data-tour="pc-schedule-actions"]',
        title: '3. Save Schedules & Export as PowerPoint (.PPTX)',
        description:
          'Save or load offline .fws.json schedules anytime, or click Export .PPTX (or .PPTX on any song card) to generate widescreen PowerPoint decks.',
        audioUrl: './tour-audio/song-03.mp3',
      },
    ],
  },
  {
    id: 'media-logo',
    shortLabel: '4. Media & Logo',
    title: 'Motion Backgrounds & Custom Church Logo',
    badge: 'Visuals',
    description: 'Upload MP4/WebM motion loops, assign defaults, and upload custom [L] Logo branding.',
    steps: [
      {
        id: 'med-01',
        selector: '[data-tour="pc-media-import-btn"]',
        title: '1. Import Custom Photos & Motion Loops',
        description:
          'Click Import Media in the Media tab to bring in church photography or looping MP4 / WebM worship video backgrounds.',
        audioUrl: './tour-audio/med-01.mp3',
      },
      {
        id: 'med-02',
        selector: '[data-tour="pc-media-grid"]',
        title: '2. Assign Active & Default Backgrounds',
        description:
          'Click any background to apply it now, click the Star to choose your default Logo screen, or right-click to set Song vs Scripture default loops.',
        audioUrl: './tour-audio/med-02.mp3',
      },
      {
        id: 'med-03',
        selector: '[data-tour="pc-themes-logo"]',
        title: '3. Upload Custom Church Logo ([L] Key)',
        description:
          'At the bottom of the Themes tab, upload a transparent PNG/SVG logo so pressing [L] displays your custom church emblem cleanly.',
        audioUrl: './tour-audio/med-03.mp3',
      },
    ],
  },
  {
    id: 'audio-pads',
    shortLabel: '5. Worship Pads & Audio',
    title: 'Ambient Worship Pads & Backing Tracks',
    badge: 'Audio',
    description: 'Trigger 12-key cathedral shimmer pads and fade pre-service audio smoothly.',
    steps: [
      {
        id: 'aud-01',
        selector: '[data-tour="pc-audio-pads"]',
        title: '1. 12-Key Cathedral Ambient Worship Pads',
        description:
          'Tap any musical key to trigger lush stereo synth pads for prayer or transitions, with smooth 2.2s crossfades and automatic song-key following.',
        audioUrl: './tour-audio/aud-01.mp3',
      },
      {
        id: 'aud-02',
        selector: '[data-tour="pc-audio-player"]',
        title: '2. Multi-Track Audio Player & Booth Fade Out',
        description:
          'Load pre-service MP3/WAV tracks or click Fade Out to gently bring backing music down over 3 seconds before worship starts.',
        audioUrl: './tour-audio/aud-02.mp3',
      },
    ],
  },
  {
    id: 'layout-alerts',
    shortLabel: '6. Layout, Slides & Alerts',
    title: 'Workspace Layouts, Quick Slide & Stage Alerts',
    badge: 'Workflow',
    description: 'Use Split/Live/Preview modes, transitions, Quick Slide, timers, and nursery alerts.',
    steps: [
      {
        id: 'deck-01',
        selector: '[data-tour="pc-layout-switcher"]',
        title: '1. Split, Live & Preview Layouts',
        description:
          'Switch between Side-by-Side Split view (Preview on left, Live on right), Live Only, or Preview Only right from the top-right bar.',
        audioUrl: './tour-audio/deck-01.mp3',
      },
      {
        id: 'deck-02',
        selector: '[data-tour="pc-view-transition"]',
        title: '2. Slide Transitions & Grid / List Views',
        description:
          'Pick Crossfade, Slide Up, Scale Zoom, or 3D Flip animations with speed control, and switch between Grid cards and compact List rows.',
        audioUrl: './tour-audio/deck-02.mp3',
      },
      {
        id: 'deck-03',
        selector: '[data-tour="pc-quick-slide-btn"]',
        title: '3. Spontaneous + Quick Slide',
        description:
          'Click + Quick Slide mid-service to type an instant chorus repeat, scripture cue, or announcement slide on the spot.',
        audioUrl: './tour-audio/deck-03.mp3',
      },
      {
        id: 'deck-04',
        selector: '[data-tour="pc-stage-alerts"]',
        title: '4. Stage Countdown & Private / Projector Alerts',
        description:
          'Run countdown presets (5m, 10m, 30m) and send messages quietly to singers with Send to Stage Only, or visibly with Projector Banner.',
        audioUrl: './tour-audio/deck-04.mp3',
      },
    ],
  },
  {
    id: 'mobile-apple-qr',
    shortLabel: '7. Apple QR & Android Sync',
    title: 'Apple Safari Web Remote, Android APK & Permissions',
    badge: 'Mobile/Wi-Fi',
    description: 'Scan Apple or Android QR codes, unblock Windows Firewall, and keep mobile awake.',
    steps: [
      {
        id: 'mob-01',
        selector: '[data-tour="pc-android-btn"]',
        title: '1. Open Mobile / QR Remote Hub',
        description:
          'Click Mobile / QR in the header anytime to open your PC LAN server info, dual QR codes, and connected remote device count.',
        audioUrl: './tour-audio/mob-01.mp3',
      },
      {
        id: 'mob-02',
        selector: '[data-tour="modal-dual-qr"]',
        title: '2. Apple / Browser QR & Android APK QR',
        description:
          'iPhone/iPad/Mac users scan the blue Apple QR to open the live Safari Web Remote served by this PC; Android users scan the green QR to install the APK.',
        audioUrl: './tour-audio/mob-02.mp3',
        tip: 'Apple iOS: Allow Local Network access in Safari & tap Keep Screen Awake',
      },
      {
        id: 'mob-03',
        selector: '[data-tour="modal-firewall-panel"]',
        title: '3. Windows Firewall Permission Check',
        description:
          'Confirm this panel shows green Already Allowed (or click Allow Port in Windows Firewall and accept the Admin prompt) so mobile browsers connect reliably.',
        audioUrl: './tour-audio/mob-03.mp3',
      },
    ],
  },
];

interface LiveInterfaceTourOverlayProps {
  isOpen: boolean;
  steps: LiveTourStep[];
  tourTitle?: string;
  onClose: () => void;
  onOpenWrittenGuide?: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const LiveInterfaceTourOverlay: React.FC<LiveInterfaceTourOverlayProps> = ({
  isOpen,
  steps,
  tourTitle,
  onClose,
  onOpenWrittenGuide,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const currentStep = steps[stepIdx] || steps[0];

  const stopAudioAndTimers = () => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      } catch {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Reset to step 0 when opened or tour topic changes
  useEffect(() => {
    if (isOpen) {
      setStepIdx(0);
      setIsPlaying(true);
    } else {
      stopAudioAndTimers();
    }
    return () => stopAudioAndTimers();
  }, [isOpen, steps]);

  // Trigger optional UI preparation hook (e.g. switch layout to show target panel) & measure target rect
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    if (currentStep.onEnter) {
      try {
        currentStep.onEnter();
      } catch {}
    }

    const measure = () => {
      const el = document.querySelector(currentStep.selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const pad = 5;
        setRect({
          top: Math.max(4, r.top - pad),
          left: Math.max(4, r.left - pad),
          width: Math.min(window.innerWidth - 8, r.width + pad * 2),
          height: Math.min(window.innerHeight - 8, r.height + pad * 2),
        });
      }
    };

    const el = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch {}
    }

    const initialTimer = window.setTimeout(measure, 120);
    const interval = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen, stepIdx, currentStep?.selector]);

  // Play Neural Pre-recorded Voice-Over & Auto-Advance cleanly when narration finishes
  useEffect(() => {
    stopAudioAndTimers();
    if (!isOpen || !currentStep) return;

    const scheduleAdvance = (delayMs: number) => {
      if (!isPlaying) return;
      advanceTimerRef.current = window.setTimeout(() => {
        setStepIdx((prev) => {
          if (prev + 1 < steps.length) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, delayMs);
    };

    if (audioEnabled && currentStep.audioUrl) {
      const audio = new Audio(currentStep.audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        scheduleAdvance(850);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        scheduleAdvance(5000);
      };
      audio.play().catch(() => {
        setIsSpeaking(false);
        scheduleAdvance(5000);
      });
    } else if (isPlaying) {
      scheduleAdvance(5000);
    }

    return () => stopAudioAndTimers();
  }, [isOpen, stepIdx, isPlaying, audioEnabled]);

  // Allow Escape key to exit tour
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setStepIdx((i) => Math.min(steps.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, steps.length, onClose]);

  if (!isOpen || !currentStep) return null;

  const replayAudio = () => {
    stopAudioAndTimers();
    if (!currentStep.audioUrl) return;
    setAudioEnabled(true);
    const audio = new Audio(currentStep.audioUrl);
    audioRef.current = audio;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      if (isPlaying) {
        advanceTimerRef.current = window.setTimeout(() => {
          setStepIdx((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
        }, 850);
      }
    };
    audio.play().catch(() => setIsSpeaking(false));
  };

  // Compute smart floating coach card placement so it never obscures the spotlighted control
  const cardWidth = Math.min(410, window.innerWidth - 24);
  const cardEstHeight = 235;
  let cardLeft = Math.round((window.innerWidth - cardWidth) / 2);
  let cardTop = Math.round(window.innerHeight - cardEstHeight - 20);

  if (rect) {
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - (rect.left + rect.width);
    const spaceLeft = rect.left;

    if (spaceBelow >= cardEstHeight + 24) {
      cardTop = rect.top + rect.height + 16;
      cardLeft = Math.min(
        Math.max(12, rect.left + rect.width / 2 - cardWidth / 2),
        window.innerWidth - cardWidth - 12
      );
    } else if (spaceAbove >= cardEstHeight + 24) {
      cardTop = rect.top - cardEstHeight - 16;
      cardLeft = Math.min(
        Math.max(12, rect.left + rect.width / 2 - cardWidth / 2),
        window.innerWidth - cardWidth - 12
      );
    } else if (spaceRight >= cardWidth + 28) {
      cardLeft = rect.left + rect.width + 18;
      cardTop = Math.min(
        Math.max(12, rect.top),
        window.innerHeight - cardEstHeight - 12
      );
    } else if (spaceLeft >= cardWidth + 28) {
      cardLeft = rect.left - cardWidth - 18;
      cardTop = Math.min(
        Math.max(12, rect.top),
        window.innerHeight - cardEstHeight - 12
      );
    } else {
      // Fallback: place opposite edge vertically
      cardTop = rect.top > window.innerHeight / 2 ? 16 : window.innerHeight - cardEstHeight - 16;
      cardLeft = Math.round((window.innerWidth - cardWidth) / 2);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] pointer-events-auto select-none">
      {/* Backdrop click catcher (when no rect or outside rect) */}
      {!rect && (
        <div
          className="fixed inset-0 bg-slate-950/80 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Smooth Real-UI Spotlight Cutout */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78)',
            transition: 'all 450ms cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: 'none',
          }}
          className="border-2 border-amber-400 ring-4 ring-amber-400/35 z-[131]"
        >
          {/* Animated Clicking Pointer Badge on Real Target */}
          <div
            className="absolute -bottom-3 -right-3 w-8 h-8 bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-white animate-fw-tap"
            style={{ pointerEvents: 'none' }}
          >
            <MousePointerClick className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* Floating Coach / Narrator Card */}
      <div
        style={{
          position: 'fixed',
          top: `${Math.max(12, Math.min(cardTop, window.innerHeight - 210))}px`,
          left: `${Math.max(12, Math.min(cardLeft, window.innerWidth - cardWidth - 12))}px`,
          width: `${cardWidth}px`,
          transition: 'all 450ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="z-[135] bg-booth-900 border-2 border-amber-400 shadow-2xl p-4 space-y-3"
      >
        {/* Top Metadata Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shrink-0">
              {tourTitle ? `${tourTitle} • ` : ''}Step {stepIdx + 1} / {steps.length}
            </span>
            {isSpeaking && (
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                <Volume2 className="w-3 h-3" />
                <span>Voice Guide</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={replayAudio}
              className="p-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-200"
              title="Replay voice narration for this step"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAudioEnabled((a) => !a)}
              className={`p-1.5 border ${
                audioEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-booth-850 border-booth-700 text-slate-400'
              }`}
              title={audioEnabled ? 'Mute voice-over' : 'Unmute voice-over'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-booth-850 hover:bg-red-600/80 border border-booth-700 text-slate-200 hover:text-white"
              title="Exit Live Tour (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white leading-snug">{currentStep.title}</h3>
          <p className="text-xs text-slate-200 leading-relaxed">{currentStep.description}</p>
          {currentStep.tip && (
            <div className="mt-1.5 px-2.5 py-1 bg-booth-950 border border-booth-700 text-[10px] font-mono text-amber-300">
              {currentStep.tip}
            </div>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1 pt-0.5">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIdx(idx)}
              className={`h-1.5 transition-all ${
                idx === stepIdx
                  ? 'flex-[2] bg-amber-400'
                  : idx < stepIdx
                  ? 'flex-1 bg-emerald-500/70'
                  : 'flex-1 bg-booth-700 hover:bg-booth-500'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Controls Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-booth-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="px-2.5 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-amber-300 font-bold text-[11px] flex items-center gap-1"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {onOpenWrittenGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWrittenGuide();
                }}
                className="px-2 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-300 font-bold text-[11px] flex items-center gap-1"
                title="Open written Help manual"
              >
                <BookOpen className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">Manual</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={stepIdx === 0}
              className="px-2.5 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-white font-bold text-[11px] flex items-center gap-0.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {stepIdx + 1 < steps.length ? (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-0.5 shadow"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px]"
              >
                Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
