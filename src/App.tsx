import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Music,
  BookOpen,
  Film,
  Palette,
  SkipForward,
  SkipBack,
  Monitor,
  Tv,
  Radio,
  EyeOff,
  Sparkles,
  Type,
  Plus,
  Trash2,
  Edit3,
  Check,
  Bell,
  Clock,
  Search,
  Upload,
  ChevronUp,
  ChevronDown,
  Layers,
  Zap,
  HelpCircle,
  Volume2,
  FileUp,
  Download,
  FileText,
  Sliders,
  Move,
  Database,
  Heart,
  Info,
  Star,
  Play,
} from 'lucide-react';
import {
  BIBLE_DATABASE,
  DEFAULT_MEDIA_POOL,
  DEFAULT_SERVICE_SCHEDULE,
  DEFAULT_SONGS,
  DEFAULT_THEMES,
} from './data/defaultData';
import {
  AudioTrackItem,
  BibleVerse,
  LiveBroadcastPayload,
  MediaAsset,
  MultiScreenRoutingSettings,
  ScheduleItem,
  Slide,
  SlideTransitionType,
  SongItem,
  ThemeTemplate,
} from './types/worship';
import {
  closeExternalDisplayWindow,
  DEFAULT_ROUTING_SETTINGS,
  fetchLocalLanServerInfo,
  liveSyncBus,
  loadPersistedRouting,
  openExternalDisplayWindow,
  savePersistedRouting,
  subscribeRemoteCommands,
} from './services/liveSyncBus';
import { SlideStageRenderer } from './components/SlideStageRenderer';
import { OutputDisplayView } from './components/OutputDisplayView';
import { AndroidStageControllerView } from './components/AndroidStageControllerView';
import { SongEditorModal } from './components/SongEditorModal';
import { MotionBackgroundCanvas } from './components/MotionBackgroundCanvas';
import {
  BIBLE_BOOKS_66,
  fetchAndInstallPublicDomainBible,
  loadAllBiblesFromIndexedDB,
  parseBibleFile,
  parseScriptureReference,
  saveBibleToIndexedDB,
} from './services/bibleImporter';
import {
  importChordProOrTextSong,
  importOpenLyricsOrXmlSong,
  importPptxFile,
} from './services/fileImporters';
import { AudioPadDeck } from './components/AudioPadDeck';
import { ThemeDesignerModal } from './components/ThemeDesignerModal';
import { DisplaySettingsModal } from './components/DisplaySettingsModal';
import { ImportExportModal } from './components/ImportExportModal';
import {
  ConfirmDeleteModal,
  markDailyWelcomeShown,
  shouldShowDailyWelcomeModal,
  StartupSplashScreen,
  WelcomeAboutModal,
} from './components/SystemModals';
import {
  downloadTextFile,
  exportBiblesJson,
  exportScheduleJson,
  exportSettingsJson,
  exportSongsLibraryJson,
  exportSongToOpenLyricsXml,
  FreeWorshipBackupBundle,
  normalizeSongItem,
  parseBackupOrModuleJson,
} from './services/backupService';

type LeftTab = 'songs' | 'scripture' | 'media' | 'audio' | 'themes';

interface ContextMenuState {
  x: number;
  y: number;
  category: 'songs' | 'scripture' | 'media' | 'audio';
}

interface PendingDeleteState {
  category: 'Song' | 'Media' | 'Audio Track';
  ids: string[];
  titles: string[];
}

export function App() {
  // Check if this window is an external output display (?view=projector | stage | stream | android)
  // OR if packaged inside the dedicated Android 3rd-Monitor + Controller APK
  const viewMode = useMemo(() => {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (metaEnv?.VITE_APP_TARGET === 'android') {
      return 'android';
    }
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'android') return 'android';
    if (v === 'projector' || v === 'stage' || v === 'stream') return v;
    return 'operator';
  }, []);

  if (viewMode === 'android') {
    return <AndroidStageControllerView />;
  }

  if (viewMode !== 'operator') {
    return <OutputDisplayView mode={viewMode} />;
  }

  return <OperatorConsole />;
}

const STORAGE_KEYS = {
  SONGS: 'freeworship_songs_v1',
  SCHEDULE: 'freeworship_schedule_v1',
  MEDIA: 'freeworship_media_v1',
  THEMES: 'freeworship_themes_v1',
  DEFAULT_LOGO_ID: 'freeworship_default_logo_id_v1',
  UI_COLOR_THEME: 'freeworship_ui_color_theme_v1',
};

type UiColorTheme = 'dark' | 'dark-gray' | 'gray' | 'light';

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getTagBadgeStyle(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes('chorus')) return 'bg-amber-500/25 text-amber-300 border-amber-500/50';
  if (lower.includes('bridge')) return 'bg-purple-500/25 text-purple-300 border-purple-500/50';
  if (lower.includes('verse')) return 'bg-sky-500/25 text-sky-300 border-sky-500/50';
  if (lower.includes('scripture')) return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50';
  if (lower.includes('tag') || lower.includes('outro')) return 'bg-rose-500/25 text-rose-300 border-rose-500/50';
  return 'bg-slate-700/60 text-slate-200 border-slate-600';
}

const OperatorConsole: React.FC = () => {
  // Core Databases
  const [songs, setSongs] = useState<SongItem[]>(() =>
    loadPersisted(STORAGE_KEYS.SONGS, DEFAULT_SONGS)
  );
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() =>
    loadPersisted(STORAGE_KEYS.SCHEDULE, DEFAULT_SERVICE_SCHEDULE)
  );
  const [mediaPool, setMediaPool] = useState<MediaAsset[]>(() =>
    loadPersisted(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA_POOL)
  );
  const [themes, setThemes] = useState<ThemeTemplate[]>(() =>
    loadPersisted(STORAGE_KEYS.THEMES, DEFAULT_THEMES)
  );
  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>([]);

  // Offline Bible Database (Seeded + IndexedDB Full 66-Book Translations)
  const [customBibles, setCustomBibles] = useState<Record<string, BibleVerse[]>>({});
  const [bibleImportStatus, setBibleImportStatus] = useState<string>('');
  const [isDownloadingBible, setIsDownloadingBible] = useState<boolean>(false);

  // Left Panel Navigation & Search
  const [leftTab, setLeftTab] = useState<LeftTab>('songs');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Schedule Item & Active Slide Index
  const [activeItemId, setActiveItemId] = useState<string>(() => schedule[1]?.id || schedule[0]?.id || '');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Panic Controls: Blackout (B), Logo (L), Clear Text (C)
  const [panic, setPanic] = useState({
    blackout: false,
    logoMode: false,
    clearText: false,
  });

  // Organization Logo Settings
  const [logoTitle, setLogoTitle] = useState('FREEWORSHIP SANCTUARY');
  const [logoSubtitle, setLogoSubtitle] = useState('WORSHIP • WORD • COMMUNITY');

  // Stage Display Alert & Countdown Timer
  const [stageAlertInput, setStageAlertInput] = useState('');
  const [stageAlert, setStageAlert] = useState({
    message: '',
    active: false,
    urgent: false,
  });
  const [countdown, setCountdown] = useState({
    secondsRemaining: 300,
    running: false,
    label: 'Pre-Service Countdown',
  });

  // Live Quick-Edit Reflow State
  const [quickEditSlideId, setQuickEditSlideId] = useState<string | null>(null);
  const [quickEditText, setQuickEditText] = useState<string>('');
  const [quickEditSubtext, setQuickEditSubtext] = useState<string>('');

  // Song Editor Modal State
  const [songModalOpen, setSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongItem | null>(null);

  // Theme Designer Modal State
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeTemplate | null>(null);

  // Multi-Screen Routing (2nd & 3rd Monitor) + Text Display Boundary Studio State
  const [routingSettings, setRoutingSettings] = useState<MultiScreenRoutingSettings>(() =>
    loadPersistedRouting()
  );
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState<boolean>(false);
  const [displaySettingsTab, setDisplaySettingsTab] = useState<'screens' | 'text-boundary'>('screens');

  // Spontaneous Slide Modal / Quick Add
  const [showQuickSlideModal, setShowQuickSlideModal] = useState(false);
  const [spontaneousTitle, setSpontaneousTitle] = useState('Spontaneous Announcement / Lyric');
  const [spontaneousLines, setSpontaneousLines] = useState(
    'Welcome to our Sunday Gathering!\nJoin us for fellowship after service'
  );

  // Scripture Engine State
  const [selectedTranslation, setSelectedTranslation] = useState<string>('KJV');
  const [selectedBook, setSelectedBook] = useState<string>('Psalms');
  const [selectedChapter, setSelectedChapter] = useState<number>(23);
  const [scriptureSearch, setScriptureSearch] = useState<string>('');

  // Keyboard Shortcuts Help Popover & Import/Export Data Studio Modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);

  // Startup Splash Screen & Daily Welcome / About / GCash Donation Modal State
  const [splashProgress, setSplashProgress] = useState<number>(18);
  const [splashStatus, setSplashStatus] = useState<string>(
    'Loading Songs, Themes, and Multi-Screen Routing...'
  );
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  // Default Logo Selection in Media Pool
  const [defaultLogoMediaId, setDefaultLogoMediaId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DEFAULT_LOGO_ID) || '';
    } catch {
      return '';
    }
  });

  // Simplified App UI Color Theme: 'dark' | 'dark-gray' | 'gray' | 'light'
  const [uiColorTheme, setUiColorTheme] = useState<UiColorTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UI_COLOR_THEME) as UiColorTheme | null;
      if (saved === 'light' || saved === 'gray' || saved === 'dark-gray' || saved === 'dark') {
        return saved;
      }
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-ui-theme', uiColorTheme);
      localStorage.setItem(STORAGE_KEYS.UI_COLOR_THEME, uiColorTheme);
    } catch {}
  }, [uiColorTheme]);

  // Multi-Select State (CTRL + Click / Shift + Click) & Right-Click Context Menu
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [lastClickedSongIdx, setLastClickedSongIdx] = useState<number | null>(null);
  const [selectedVerseKeys, setSelectedVerseKeys] = useState<string[]>([]);
  const [lastClickedVerseIdx, setLastClickedVerseIdx] = useState<number | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [lastClickedMediaIdx, setLastClickedMediaIdx] = useState<number | null>(null);
  const [selectedAudioIds, setSelectedAudioIds] = useState<string[]>([]);
  const [lastClickedAudioIdx, setLastClickedAudioIdx] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isDraggingOverSchedule, setIsDraggingOverSchedule] = useState<boolean>(false);

  // Checkbox Delete Confirmation Modal State
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const songImportInputRef = useRef<HTMLInputElement | null>(null);
  const pptxImportInputRef = useRef<HTMLInputElement | null>(null);
  const bibleImportInputRef = useRef<HTMLInputElement | null>(null);
  const scheduleJsonImportInputRef = useRef<HTMLInputElement | null>(null);
  const settingsJsonImportInputRef = useRef<HTMLInputElement | null>(null);

  // Load any full 66-book Bibles previously saved in IndexedDB + drive Startup Splash Screen
  useEffect(() => {
    let mounted = true;
    const t1 = setTimeout(() => {
      if (mounted) {
        setSplashProgress(55);
        setSplashStatus('Initializing Offline 66-Book Scripture IndexedDB Engine...');
      }
    }, 220);

    loadAllBiblesFromIndexedDB()
      .then((loaded) => {
        if (!mounted) return;
        const filteredLoaded: Record<string, BibleVerse[]> = {};
        Object.entries(loaded).forEach(([k, v]) => {
          if (k.toUpperCase() !== 'WEB') {
            filteredLoaded[k] = v;
          }
        });
        if (Object.keys(filteredLoaded).length > 0) {
          setCustomBibles(filteredLoaded);
        }
        setSplashProgress(90);
        setSplashStatus('Starting LAN Android Remote & Multi-Screen Broadcast Bus...');
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          if (!mounted) return;
          setSplashProgress(100);
          setSplashStatus('Ready for Service.');
          setTimeout(() => {
            if (!mounted) return;
            setShowSplashScreen(false);
            if (shouldShowDailyWelcomeModal()) {
              setShowWelcomeModal(true);
              markDailyWelcomeShown(false);
            }
          }, 260);
        }, 420);
      });

    return () => {
      mounted = false;
      clearTimeout(t1);
    };
  }, []);

  // Dismiss Right-Click Context Menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [contextMenu]);

  // Persist user changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
    } catch {}
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(mediaPool));
    } catch {}
  }, [mediaPool]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEFAULT_LOGO_ID, defaultLogoMediaId);
    } catch {}
  }, [defaultLogoMediaId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    } catch {}
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
    } catch {}
  }, [themes]);

  // Derived active item, slide, next slide, background, and theme
  const activeItem = useMemo(
    () => schedule.find((item) => item.id === activeItemId) || schedule[0],
    [schedule, activeItemId]
  );

  const activeSongKey = useMemo(() => {
    if (!activeItem) return undefined;
    if (activeItem.sourceId) {
      const matchedSong = songs.find((s) => s.id === activeItem.sourceId);
      if (matchedSong) return matchedSong.musicalKey;
    }
    const keyMatch = activeItem.subtitle?.match(/Key of ([A-G][#b]?)/i);
    return keyMatch ? keyMatch[1] : undefined;
  }, [activeItem, songs]);

  const currentSlide: Slide | null = useMemo(() => {
    if (!activeItem || activeItem.slides.length === 0) return null;
    const clamped = Math.min(Math.max(0, activeSlideIndex), activeItem.slides.length - 1);
    return activeItem.slides[clamped] || null;
  }, [activeItem, activeSlideIndex]);

  const nextSlide: Slide | null = useMemo(() => {
    if (!activeItem) return null;
    if (activeSlideIndex + 1 < activeItem.slides.length) {
      return activeItem.slides[activeSlideIndex + 1];
    }
    const currentIdx = schedule.findIndex((s) => s.id === activeItem.id);
    if (currentIdx >= 0 && currentIdx + 1 < schedule.length) {
      return schedule[currentIdx + 1].slides[0] || null;
    }
    return null;
  }, [activeItem, activeSlideIndex, schedule]);

  const activeBackground: MediaAsset = useMemo(() => {
    const overrideId = currentSlide?.backgroundOverrideId || activeItem?.backgroundId;
    return mediaPool.find((m) => m.id === overrideId) || mediaPool[0];
  }, [currentSlide, activeItem, mediaPool]);

  const activeLogoAsset: MediaAsset | null = useMemo(() => {
    if (!defaultLogoMediaId) return null;
    return mediaPool.find((m) => m.id === defaultLogoMediaId) || null;
  }, [defaultLogoMediaId, mediaPool]);

  const activeTheme: ThemeTemplate = useMemo(() => {
    return themes.find((t) => t.id === activeItem?.themeId) || themes[0];
  }, [activeItem, themes]);

  // Distinct Section Jump Tags for Dynamic Song Flow Control
  const sectionJumpButtons = useMemo(() => {
    if (!activeItem) return [];
    const seen = new Map<string, number>();
    activeItem.slides.forEach((sl, idx) => {
      if (!seen.has(sl.tag)) {
        seen.set(sl.tag, idx);
      }
    });
    return Array.from(seen.entries()).map(([tag, index]) => ({ tag, index }));
  }, [activeItem]);

  // Countdown Timer Effect
  useEffect(() => {
    if (!countdown.running) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.secondsRemaining <= 1) {
          return { ...prev, secondsRemaining: 0, running: false };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown.running]);

  const handleUpdateRouting = (next: MultiScreenRoutingSettings) => {
    setRoutingSettings(next);
    savePersistedRouting(next);
    if (next.enableStageMonitor === false) {
      closeExternalDisplayWindow('stage');
    }
  };

  // Auto-launch 2nd & 3rd screens on startup if configured
  useEffect(() => {
    if (routingSettings.autoLaunchOnStartup) {
      openExternalDisplayWindow('projector', routingSettings);
      if (routingSettings.enableStageMonitor !== false) {
        openExternalDisplayWindow('stage', routingSettings);
      }
    }
  }, []);

  // Broadcast live state on any change (<1ms zero-latency sync + LAN Android sync)
  useEffect(() => {
    if (!activeItem) return;
    const payload: LiveBroadcastPayload = {
      activeItemId: activeItem.id,
      activeItemTitle: activeItem.title,
      activeItemSubtitle: activeItem.subtitle,
      activeSlideIndex,
      currentSlide,
      nextSlide,
      activeItemSlides: activeItem.slides,
      scheduleSummary: schedule.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        slideCount: s.slides.length,
      })),
      songsCatalog: songs.map((s) => ({
        id: s.id,
        title: s.title,
        author: s.author,
        musicalKey: s.musicalKey,
        slideCount: s.slides.length,
      })),
      background: activeBackground,
      logoAsset: activeLogoAsset,
      theme: activeTheme,
      routing: routingSettings,
      panic,
      stageAlert,
      countdown,
      logoTitle,
      logoSubtitle,
      timestamp: Date.now(),
    };
    liveSyncBus.publish(payload);
  }, [
    activeItem,
    activeSlideIndex,
    currentSlide,
    nextSlide,
    schedule,
    songs,
    activeBackground,
    activeLogoAsset,
    activeTheme,
    routingSettings,
    panic,
    stageAlert,
    countdown,
    logoTitle,
    logoSubtitle,
  ]);

  // Navigation Handlers
  const goToNextSlide = () => {
    if (!activeItem) return;
    if (activeSlideIndex + 1 < activeItem.slides.length) {
      setActiveSlideIndex(activeSlideIndex + 1);
    } else {
      const idx = schedule.findIndex((i) => i.id === activeItem.id);
      if (idx >= 0 && idx + 1 < schedule.length) {
        setActiveItemId(schedule[idx + 1].id);
        setActiveSlideIndex(0);
      }
    }
  };

  const goToPrevSlide = () => {
    if (!activeItem) return;
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else {
      const idx = schedule.findIndex((i) => i.id === activeItem.id);
      if (idx > 0) {
        const prevItem = schedule[idx - 1];
        setActiveItemId(prevItem.id);
        setActiveSlideIndex(Math.max(0, prevItem.slides.length - 1));
      }
    }
  };

  // Global Zero-Latency Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        goToNextSlide();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setPanic((prev) => ({ ...prev, blackout: !prev.blackout, logoMode: false }));
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setPanic((prev) => ({ ...prev, logoMode: !prev.logoMode, blackout: false }));
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setPanic((prev) => ({ ...prev, clearText: !prev.clearText }));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPanic({ blackout: false, logoMode: false, clearText: false });
      } else if (/^[1-9]$/.test(e.key)) {
        const numIdx = parseInt(e.key, 10) - 1;
        if (activeItem && numIdx < activeItem.slides.length) {
          setActiveSlideIndex(numIdx);
        }
      } else if (e.key.toLowerCase() === 'v') {
        const vSlide = activeItem?.slides.findIndex((s) => s.tag.toLowerCase().includes('verse'));
        if (vSlide !== undefined && vSlide >= 0) setActiveSlideIndex(vSlide);
      } else if (e.key.toLowerCase() === 'r') {
        const cSlide = activeItem?.slides.findIndex((s) => s.tag.toLowerCase().includes('chorus'));
        if (cSlide !== undefined && cSlide >= 0) setActiveSlideIndex(cSlide);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Subscribe to Remote Control commands sent by the Android 3rd-Monitor + Controller APK over Wi-Fi
  useEffect(() => {
    return subscribeRemoteCommands((cmd) => {
      switch (cmd.action) {
        case 'NEXT_SLIDE':
          goToNextSlide();
          break;
        case 'PREV_SLIDE':
          goToPrevSlide();
          break;
        case 'SELECT_SLIDE':
          setActiveSlideIndex(cmd.index);
          setPanic((prev) => ({ ...prev, blackout: false, logoMode: false }));
          break;
        case 'SELECT_ITEM':
          setActiveItemId(cmd.itemId);
          setActiveSlideIndex(0);
          break;
        case 'TOGGLE_PANIC':
          setPanic((prev) => ({
            ...prev,
            blackout: cmd.key === 'blackout' ? !prev.blackout : false,
            logoMode: cmd.key === 'logoMode' ? !prev.logoMode : false,
            clearText: cmd.key === 'clearText' ? !prev.clearText : prev.clearText,
          }));
          break;
        case 'RESTORE_PANIC':
          setPanic({ blackout: false, logoMode: false, clearText: false });
          break;
        case 'TOGGLE_TIMER':
          setCountdown((prev) => ({ ...prev, running: !prev.running }));
          break;
        case 'SET_TIMER':
          setCountdown((prev) => ({
            ...prev,
            secondsRemaining: cmd.minutes * 60,
            running: true,
          }));
          break;
        case 'SEND_ALERT':
          setStageAlert({
            message: cmd.message,
            active: Boolean(cmd.message.trim()),
            urgent: cmd.urgent,
          });
          break;
        case 'CLEAR_ALERT':
          setStageAlert((prev) => ({ ...prev, active: false, message: '' }));
          break;
        case 'ADD_SONG_TO_SCHEDULE': {
          const foundSong = songs.find((s) => s.id === cmd.songId);
          if (foundSong) {
            addSongToSchedule(foundSong, Boolean(cmd.goLive));
          }
          break;
        }
        case 'ADD_SCRIPTURE_TO_SCHEDULE': {
          const parsed = parseScriptureReference(cmd.reference);
          if (parsed) {
            const matchedVerses = activeTranslationVerses.filter((v) => {
              if (v.book.toLowerCase() !== parsed.book.toLowerCase()) return false;
              if (v.chapter !== parsed.chapter) return false;
              if (parsed.verseStart !== undefined) {
                const end = parsed.verseEnd ?? parsed.verseStart;
                return v.verse >= parsed.verseStart && v.verse <= end;
              }
              return true;
            });
            if (matchedVerses.length > 0) {
              sendVerseListToSchedule(matchedVerses, Boolean(cmd.goLive));
            } else {
              // Fallback slide if full 66-book verse isn't cached yet
              const fallbackItem: ScheduleItem = {
                id: `sched-scr-remote-${Date.now()}`,
                type: 'scripture',
                title: `${parsed.book} ${parsed.chapter}${
                  parsed.verseStart ? `:${parsed.verseStart}` : ''
                } (${cmd.translation || 'KJV'})`,
                subtitle: 'Scripture Reading (Remote)',
                backgroundId: activeBackground.id,
                themeId: activeTheme.id,
                slides: [
                  {
                    id: `scr-remote-sl-${Date.now()}`,
                    tag: 'Scripture',
                    lines: [cmd.reference],
                    subtext: `${parsed.book} ${parsed.chapter} (KJV)`,
                  },
                ],
              };
              setSchedule((prev) => [...prev, fallbackItem]);
              if (cmd.goLive) {
                setActiveItemId(fallbackItem.id);
                setActiveSlideIndex(0);
              }
            }
          }
          break;
        }
      }
    });
  });

  // Live Quick-Edit Reflow Functions
  const startQuickEdit = (slide: Slide) => {
    setQuickEditSlideId(slide.id);
    setQuickEditText(slide.lines.join('\n'));
    setQuickEditSubtext(slide.subtext || '');
  };

  const saveQuickEdit = () => {
    if (!activeItem || !quickEditSlideId) return;
    const updatedLines = quickEditText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    setSchedule((prev) =>
      prev.map((item) => {
        if (item.id !== activeItem.id) return item;
        return {
          ...item,
          slides: item.slides.map((sl) =>
            sl.id === quickEditSlideId
              ? {
                  ...sl,
                  lines: updatedLines.length > 0 ? updatedLines : [''],
                  subtext: quickEditSubtext.trim() || undefined,
                }
              : sl
          ),
        };
      })
    );
    setQuickEditSlideId(null);
  };

  // Add Song to Schedule
  const addSongToSchedule = (song: SongItem, goLiveImmediately = false) => {
    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: 'song',
      title: song.title,
      subtitle: `${song.author} • Key of ${song.musicalKey}${song.bpm ? ` • ${song.bpm} BPM` : ''}`,
      sourceId: song.id,
      backgroundId: song.defaultBackgroundId || activeBackground.id,
      themeId: activeTheme.id,
      slides: song.slides.map((s) => ({ ...s, id: `${s.id}-${Date.now()}` })),
    };
    setSchedule((prev) => [...prev, newItem]);
    if (goLiveImmediately) {
      setActiveItemId(newItem.id);
      setActiveSlideIndex(0);
    }
  };

  // Save Song from Modal
  const handleSaveSong = (savedSong: SongItem, addToSched: boolean) => {
    setSongs((prev) => {
      const exists = prev.some((s) => s.id === savedSong.id);
      return exists ? prev.map((s) => (s.id === savedSong.id ? savedSong : s)) : [savedSong, ...prev];
    });
    setSchedule((prev) =>
      prev.map((item) =>
        item.sourceId === savedSong.id
          ? {
              ...item,
              title: savedSong.title,
              subtitle: `${savedSong.author} • Key of ${savedSong.musicalKey}`,
              slides: savedSong.slides,
            }
          : item
      )
    );
    if (addToSched) {
      addSongToSchedule(savedSong, true);
    }
    setSongModalOpen(false);
    setEditingSong(null);
  };

  // Import OpenLyrics XML / OpenSong XML / ChordPro / TXT / FreeWorship Songs JSON
  const handleSongFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const importedSongs: SongItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
          try {
            const bundle = parseBackupOrModuleJson(text);
            if (bundle.songs && bundle.songs.length > 0) {
              importedSongs.push(...bundle.songs.map((s) => normalizeSongItem(s, file.name)));
            }
          } catch {
            const song = importChordProOrTextSong(text, file.name);
            importedSongs.push(normalizeSongItem(song, file.name));
          }
        } else {
          const isXml = lower.endsWith('.xml') || text.trim().startsWith('<');
          const song = isXml
            ? importOpenLyricsOrXmlSong(text, file.name)
            : importChordProOrTextSong(text, file.name);
          importedSongs.push(normalizeSongItem(song, file.name));
        }
      } catch (err) {
        console.error('Song file import error:', err);
      }
    }

    if (importedSongs.length > 0) {
      setSongs((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const uniqueNew = importedSongs.filter((s) => !existingIds.has(s.id));
        const updatedPrev = prev.map(
          (s) => importedSongs.find((inc) => inc.id === s.id) || s
        );
        return [...uniqueNew, ...updatedPrev];
      });
      addSongToSchedule(importedSongs[0], true);
      alert(`Successfully imported ${importedSongs.length} song(s) into your library!`);
    } else {
      alert(
        'No valid songs found in selected file(s). Supported formats: FreeWorship Songs JSON (.fwx.json), OpenLyrics (.xml), OpenSong (.xml), ChordPro (.cho), or Plain Text (.txt).'
      );
    }
    e.target.value = '';
  };

  // Import Schedule (.fws.json) directly from the Service Schedule header
  const handleScheduleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const bundle = parseBackupOrModuleJson(text);
      if (bundle.schedule && bundle.schedule.length > 0) {
        await handleApplyImportedBundle(bundle, 'replace');
      }
    } catch (err) {
      console.error('Failed to import schedule JSON:', err);
    }
    e.target.value = '';
  };

  // Import Settings & Themes (.fwsettings.json)
  const handleSettingsJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const bundle = parseBackupOrModuleJson(text);
      await handleApplyImportedBundle(bundle, 'merge');
    } catch (err) {
      console.error('Failed to import settings JSON:', err);
    }
    e.target.value = '';
  };

  // Master Import Bundle Processor (Songs, Bibles, Schedule, Themes & Display Routing Settings)
  const handleApplyImportedBundle = async (
    bundle: FreeWorshipBackupBundle,
    mode: 'merge' | 'replace'
  ): Promise<string> => {
    const importedParts: string[] = [];

    if (bundle.songs && bundle.songs.length > 0) {
      setSongs((prev) => {
        if (mode === 'replace') return bundle.songs!;
        const incomingMap = new Map(bundle.songs!.map((s) => [s.id, s]));
        const merged = prev.map((s) => incomingMap.get(s.id) || s);
        const existingIds = new Set(prev.map((s) => s.id));
        const added = bundle.songs!.filter((s) => !existingIds.has(s.id));
        return [...added, ...merged];
      });
      importedParts.push(`${bundle.songs.length} Songs`);
    }

    if (bundle.bibles && Object.keys(bundle.bibles).length > 0) {
      const bibleEntries = Object.entries(bundle.bibles);
      for (const [code, verses] of bibleEntries) {
        if (Array.isArray(verses) && verses.length > 0) {
          await saveBibleToIndexedDB(code, verses);
        }
      }
      setCustomBibles((prev) => ({
        ...(mode === 'replace' ? {} : prev),
        ...bundle.bibles,
      }));
      if (bibleEntries[0]) {
        setSelectedTranslation(bibleEntries[0][0]);
      }
      importedParts.push(`${bibleEntries.length} Bible Translation(s)`);
    }

    if (bundle.schedule && bundle.schedule.length > 0) {
      setSchedule((prev) => {
        const next = mode === 'replace' ? bundle.schedule! : [...prev, ...bundle.schedule!];
        if (next[0]) {
          setActiveItemId(next[0].id);
          setActiveSlideIndex(0);
        }
        return next;
      });
      importedParts.push(`${bundle.schedule.length} Schedule Item(s)`);
    }

    if (bundle.settings) {
      if (bundle.settings.themes && bundle.settings.themes.length > 0) {
        setThemes((prev) => {
          if (mode === 'replace') return bundle.settings!.themes!;
          const incomingMap = new Map(bundle.settings!.themes!.map((t) => [t.id, t]));
          const merged = prev.map((t) => incomingMap.get(t.id) || t);
          const existingIds = new Set(prev.map((t) => t.id));
          const added = bundle.settings!.themes!.filter((t) => !existingIds.has(t.id));
          return [...added, ...merged];
        });
        importedParts.push(`${bundle.settings.themes.length} Theme(s)`);
      }
      if (bundle.settings.routingSettings) {
        handleUpdateRouting(bundle.settings.routingSettings);
        importedParts.push('Multi-Screen & Transition Settings');
      }
      if (bundle.settings.logoTitle) {
        setLogoTitle(bundle.settings.logoTitle);
      }
      if (bundle.settings.logoSubtitle) {
        setLogoSubtitle(bundle.settings.logoSubtitle);
      }
    }

    return importedParts.length > 0
      ? `Imported: ${importedParts.join(' • ')}`
      : 'File parsed, no new changes found.';
  };

  // Import PowerPoint (.pptx) Presentation File
  const handlePptxFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { scheduleItem, extractedMedia } = await importPptxFile(file, activeTheme.id);
      if (extractedMedia.length > 0) {
        setMediaPool((prev) => [...extractedMedia, ...prev]);
      }
      setSchedule((prev) => [...prev, scheduleItem]);
      setActiveItemId(scheduleItem.id);
      setActiveSlideIndex(0);
    } catch (err) {
      console.error('Failed to import PPTX:', err);
    }
    e.target.value = '';
  };

  // =========================================================================
  // 66-BOOK OFFLINE SCRIPTURE ENGINE & JSON/XML BIBLE IMPORTER
  // =========================================================================
  const allAvailableBiblesMap: Record<string, BibleVerse[]> = useMemo(() => {
    const map: Record<string, BibleVerse[]> = {
      KJV: BIBLE_DATABASE.filter((v) => v.translation === 'KJV'),
      ...customBibles,
    };
    return map;
  }, [customBibles]);

  const availableTranslations = useMemo(() => {
    const codes = new Set<string>(['KJV']);
    Object.keys(customBibles).forEach((c) => {
      codes.add(c);
    });
    return Array.from(codes);
  }, [customBibles]);

  const activeTranslationVerses: BibleVerse[] = useMemo(() => {
    const customList = customBibles[selectedTranslation];
    if (customList && customList.length > 0) {
      return customList;
    }
    return BIBLE_DATABASE.filter((v) => v.translation === selectedTranslation);
  }, [customBibles, selectedTranslation]);

  const availableChaptersForBook = useMemo(() => {
    const bookChapters = Array.from(
      new Set(
        activeTranslationVerses
          .filter((v) => v.book.toLowerCase() === selectedBook.toLowerCase())
          .map((v) => v.chapter)
      )
    ).sort((a, b) => a - b);

    if (bookChapters.length > 0) return bookChapters;
    const canonBook = BIBLE_BOOKS_66.find((b) => b.name === selectedBook);
    const total = canonBook?.chapters || 1;
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }, [activeTranslationVerses, selectedBook]);

  const filteredVerses = useMemo(() => {
    const query = scriptureSearch.trim();
    if (query) {
      // 1. Check if the operator typed a structured reference like "John 3:16-17" or "Ps 23:1-6"
      const parsedRef = parseScriptureReference(query);
      if (parsedRef) {
        return activeTranslationVerses.filter((v) => {
          if (v.book.toLowerCase() !== parsedRef.book.toLowerCase()) return false;
          if (v.chapter !== parsedRef.chapter) return false;
          if (parsedRef.verseStart !== undefined) {
            const end = parsedRef.verseEnd ?? parsedRef.verseStart;
            return v.verse >= parsedRef.verseStart && v.verse <= end;
          }
          return true;
        });
      }

      // 2. Otherwise perform full-text keyword or partial reference search
      const q = query.toLowerCase();
      return activeTranslationVerses
        .filter(
          (v) =>
            v.text.toLowerCase().includes(q) ||
            `${v.book} ${v.chapter}:${v.verse}`.toLowerCase().includes(q)
        )
        .slice(0, 120);
    }

    return activeTranslationVerses.filter(
      (v) => v.book.toLowerCase() === selectedBook.toLowerCase() && v.chapter === selectedChapter
    );
  }, [activeTranslationVerses, selectedBook, selectedChapter, scriptureSearch]);

  // Import local JSON / XML 66-book Bible file
  const handleBibleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBibleImportStatus(`Parsing ${file.name}...`);
    try {
      const content = await file.text();
      const { translationCode, verses, allTranslations } = parseBibleFile(content, file.name);

      if (allTranslations && Object.keys(allTranslations).length > 0) {
        for (const [code, tVerses] of Object.entries(allTranslations)) {
          if (tVerses.length > 0) {
            await saveBibleToIndexedDB(code, tVerses);
          }
        }
        setCustomBibles((prev) => ({ ...prev, ...allTranslations }));
        const primaryCode = translationCode || Object.keys(allTranslations)[0];
        setSelectedTranslation(primaryCode);
        const totalCount = Object.values(allTranslations).reduce((acc, cur) => acc + cur.length, 0);
        setBibleImportStatus(
          `Installed ${Object.keys(allTranslations).join(', ')} (${totalCount.toLocaleString()} verses saved offline)`
        );
      } else if (verses.length > 0) {
        await saveBibleToIndexedDB(translationCode, verses);
        setCustomBibles((prev) => ({ ...prev, [translationCode]: verses }));
        setSelectedTranslation(translationCode);
        setBibleImportStatus(
          `Installed ${translationCode} (${verses.length.toLocaleString()} verses across 66 books)`
        );
      } else {
        setBibleImportStatus('No valid verses found in file. Check JSON/XML structure.');
      }
    } catch (err) {
      setBibleImportStatus(
        `Import error: ${err instanceof Error ? err.message : 'Invalid Bible file'}`
      );
    }
    e.target.value = '';
  };

  // 1-Click Download & Offline Install of Full 31,102-Verse 66-Book Bible
  const handleInstallFullPublicBible = async (edition: 'en_kjv' | 'en_bbe') => {
    setIsDownloadingBible(true);
    setBibleImportStatus(`Downloading full 66-book ${edition === 'en_kjv' ? 'KJV' : 'BBE'} (31,102 verses)...`);
    try {
      const { translationCode, verses } = await fetchAndInstallPublicDomainBible(edition);
      setCustomBibles((prev) => ({ ...prev, [translationCode]: verses }));
      setSelectedTranslation(translationCode);
      setBibleImportStatus(
        `Offline ${translationCode} Ready (${verses.length.toLocaleString()} verses saved to IndexedDB)`
      );
    } catch {
      setBibleImportStatus(
        'Offline mode: Could not reach GitHub CDN. Use "Import JSON/XML" to load a local Bible file.'
      );
    } finally {
      setIsDownloadingBible(false);
    }
  };

  const sendVerseListToSchedule = (versesToCompile: BibleVerse[], goLive: boolean) => {
    if (versesToCompile.length === 0) return;
    const first = versesToCompile[0];
    const last = versesToCompile[versesToCompile.length - 1];
    const refTitle = `${first.book} ${first.chapter}:${first.verse}${
      versesToCompile.length > 1 ? `–${last.verse}` : ''
    } (${first.translation})`;

    const compiledSlides: Slide[] = versesToCompile.map((v) => ({
      id: `scr-${v.book}-${v.chapter}-${v.verse}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      tag: 'Scripture',
      lines: [`${v.verse} ${v.text}`],
      subtext: `${v.book} ${v.chapter}:${v.verse} (${v.translation})`,
    }));

    const newSched: ScheduleItem = {
      id: `sched-scr-${Date.now()}`,
      type: 'scripture',
      title: refTitle,
      subtitle: 'Scripture Reading',
      backgroundId: activeBackground.id,
      themeId: 'theme-scripture-classic',
      slides: compiledSlides,
    };

    setSchedule((prev) => [...prev, newSched]);
    if (goLive) {
      setActiveItemId(newSched.id);
      setActiveSlideIndex(0);
    }
  };

  // Apply Background or Theme to Active Schedule Item
  const applyBackgroundToActiveItem = (bgId: string) => {
    if (!activeItem) return;
    setSchedule((prev) =>
      prev.map((item) => (item.id === activeItem.id ? { ...item, backgroundId: bgId } : item))
    );
  };

  const applyThemeToActiveItem = (themeId: string) => {
    if (!activeItem) return;
    setSchedule((prev) =>
      prev.map((item) => (item.id === activeItem.id ? { ...item, themeId } : item))
    );
  };

  // Save Theme from ThemeDesignerModal
  const handleSaveTheme = (savedTheme: ThemeTemplate, applyImmediately: boolean) => {
    setThemes((prev) => {
      const exists = prev.some((t) => t.id === savedTheme.id);
      return exists
        ? prev.map((t) => (t.id === savedTheme.id ? savedTheme : t))
        : [savedTheme, ...prev];
    });
    if (applyImmediately) {
      applyThemeToActiveItem(savedTheme.id);
    }
    setThemeModalOpen(false);
    setEditingTheme(null);
  };

  const handleDeleteTheme = (themeId: string) => {
    if (themes.length <= 1) return;
    setThemes((prev) => prev.filter((t) => t.id !== themeId));
  };

  // Custom Media File Upload (Images / MP4 / WebM Motion Loops)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const newAsset: MediaAsset = {
      id: `media-custom-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category: 'Custom Upload',
      type: isVideo ? 'video' : 'image',
      previewGradient: 'linear-gradient(135deg, #1e293b, #0f172a)',
      mediaUrl: url,
    };
    setMediaPool((prev) => [newAsset, ...prev]);
    applyBackgroundToActiveItem(newAsset.id);
    e.target.value = '';
  };

  // Reorder or Delete Schedule Item
  const moveScheduleItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= schedule.length) return;
    setSchedule((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      copy.splice(target, 0, removed);
      return copy;
    });
  };

  const deleteScheduleItem = (id: string) => {
    if (schedule.length <= 1) return;
    setSchedule((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (activeItemId === id && next[0]) {
        setActiveItemId(next[0].id);
        setActiveSlideIndex(0);
      }
      return next;
    });
  };

  // Add Spontaneous Slide to Current Item
  const addSpontaneousSlide = () => {
    if (!activeItem) return;
    const newSlide: Slide = {
      id: `spont-${Date.now()}`,
      tag: 'Announcement',
      lines: spontaneousLines
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      subtext: spontaneousTitle,
    };
    const newIndex = activeItem.slides.length;
    setSchedule((prev) =>
      prev.map((item) =>
        item.id === activeItem.id ? { ...item, slides: [...item.slides, newSlide] } : item
      )
    );
    setActiveSlideIndex(newIndex);
    setShowQuickSlideModal(false);
  };

  // Filtered Songs List for Display & Multi-Select
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.ccliNumber.toLowerCase().includes(q) ||
        s.slides.some((sl) => sl.lines.join(' ').toLowerCase().includes(q))
    );
  }, [songs, searchQuery]);

  const getVerseKey = (v: BibleVerse) => `${v.translation}-${v.book}-${v.chapter}-${v.verse}`;

  // Multi-Select Click Handlers (Supports CTRL + Click and Shift + Click range selection)
  const handleSongItemSelect = (songId: string, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedSongIdx !== null) {
      const start = Math.min(lastClickedSongIdx, index);
      const end = Math.max(lastClickedSongIdx, index);
      const rangeIds = filteredSongs.slice(start, end + 1).map((s) => s.id);
      setSelectedSongIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedSongIds((prev) =>
        prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
      );
      setLastClickedSongIdx(index);
    } else {
      setSelectedSongIds([songId]);
      setLastClickedSongIdx(index);
    }
  };

  const handleVerseItemSelect = (
    verse: BibleVerse,
    index: number,
    e: React.MouseEvent,
    projectOnSingleClick = true
  ) => {
    const vKey = getVerseKey(verse);
    if (e.shiftKey && lastClickedVerseIdx !== null) {
      const start = Math.min(lastClickedVerseIdx, index);
      const end = Math.max(lastClickedVerseIdx, index);
      const rangeKeys = filteredVerses.slice(start, end + 1).map(getVerseKey);
      setSelectedVerseKeys((prev) => Array.from(new Set([...prev, ...rangeKeys])));
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedVerseKeys((prev) =>
        prev.includes(vKey) ? prev.filter((k) => k !== vKey) : [...prev, vKey]
      );
      setLastClickedVerseIdx(index);
    } else {
      setSelectedVerseKeys([vKey]);
      setLastClickedVerseIdx(index);
      if (projectOnSingleClick) {
        sendVerseListToSchedule([verse], true);
      }
    }
  };

  const handleMediaItemSelect = (mediaId: string, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedMediaIdx !== null) {
      const start = Math.min(lastClickedMediaIdx, index);
      const end = Math.max(lastClickedMediaIdx, index);
      const rangeIds = mediaPool.slice(start, end + 1).map((m) => m.id);
      setSelectedMediaIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedMediaIds((prev) =>
        prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
      );
      setLastClickedMediaIdx(index);
    } else {
      setSelectedMediaIds([mediaId]);
      setLastClickedMediaIdx(index);
      applyBackgroundToActiveItem(mediaId);
    }
  };

  const handleAudioItemSelect = (trackId: string, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedAudioIdx !== null) {
      const start = Math.min(lastClickedAudioIdx, index);
      const end = Math.max(lastClickedAudioIdx, index);
      const rangeIds = audioTracks.slice(start, end + 1).map((t) => t.id);
      setSelectedAudioIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedAudioIds((prev) =>
        prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
      );
      setLastClickedAudioIdx(index);
    } else {
      setSelectedAudioIds([trackId]);
      setLastClickedAudioIdx(index);
    }
  };

  // Add Media Asset(s) as a Schedule Presentation Item
  const addMediaAssetsToSchedule = (assets: MediaAsset[], goLive = false) => {
    if (assets.length === 0) return;
    const newItems: ScheduleItem[] = assets.map((asset) => ({
      id: `sched-media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'announcement',
      title: asset.name,
      subtitle: `${asset.category} (${asset.type.toUpperCase()})`,
      backgroundId: asset.id,
      themeId: activeTheme.id,
      slides: [
        {
          id: `media-sl-${asset.id}-${Date.now()}`,
          tag: 'Media',
          lines: [''],
          subtext: asset.name,
          backgroundOverrideId: asset.id,
        },
      ],
    }));
    setSchedule((prev) => [...prev, ...newItems]);
    if (goLive && newItems[0]) {
      setActiveItemId(newItems[0].id);
      setActiveSlideIndex(0);
    }
  };

  // Request Deletion with Checkbox Confirmation Modal
  const requestDeleteSongs = (ids: string[]) => {
    const targets = songs.filter((s) => ids.includes(s.id));
    if (targets.length === 0) return;
    setPendingDelete({
      category: 'Song',
      ids: targets.map((s) => s.id),
      titles: targets.map((s) => `${s.title} (${s.author})`),
    });
  };

  const requestDeleteMedia = (ids: string[]) => {
    const targets = mediaPool.filter((m) => ids.includes(m.id));
    if (targets.length === 0) return;
    setPendingDelete({
      category: 'Media',
      ids: targets.map((m) => m.id),
      titles: targets.map((m) => `${m.name} (${m.category})`),
    });
  };

  const requestDeleteAudioTracks = (ids: string[]) => {
    const targets = audioTracks.filter((t) => ids.includes(t.id));
    if (targets.length === 0) return;
    setPendingDelete({
      category: 'Audio Track',
      ids: targets.map((t) => t.id),
      titles: targets.map((t) => t.title),
    });
  };

  const executeConfirmedDelete = () => {
    if (!pendingDelete) return;
    const idSet = new Set(pendingDelete.ids);
    if (pendingDelete.category === 'Song') {
      setSongs((prev) => prev.filter((s) => !idSet.has(s.id)));
      setSelectedSongIds((prev) => prev.filter((id) => !idSet.has(id)));
    } else if (pendingDelete.category === 'Media') {
      setMediaPool((prev) => {
        const remaining = prev.filter((m) => !idSet.has(m.id));
        return remaining.length > 0 ? remaining : DEFAULT_MEDIA_POOL.slice(0, 1);
      });
      if (defaultLogoMediaId && idSet.has(defaultLogoMediaId)) {
        setDefaultLogoMediaId('');
      }
      setSelectedMediaIds((prev) => prev.filter((id) => !idSet.has(id)));
    } else if (pendingDelete.category === 'Audio Track') {
      setAudioTracks((prev) => prev.filter((t) => !idSet.has(t.id)));
      setSelectedAudioIds((prev) => prev.filter((id) => !idSet.has(id)));
    }
    setPendingDelete(null);
  };

  // Drag-and-Drop Drop Handler on Service Schedule
  const handleScheduleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverSchedule(false);
    const raw = e.dataTransfer.getData('application/x-freeworship-items');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        category: 'songs' | 'scripture' | 'media';
        ids: string[];
      };
      if (parsed.category === 'songs') {
        const toAdd = songs.filter((s) => parsed.ids.includes(s.id));
        toAdd.forEach((s) => addSongToSchedule(s, false));
      } else if (parsed.category === 'scripture') {
        const keySet = new Set(parsed.ids);
        const versesToAdd = filteredVerses.filter((v) => keySet.has(getVerseKey(v)));
        if (versesToAdd.length > 0) {
          sendVerseListToSchedule(versesToAdd, false);
        }
      } else if (parsed.category === 'media') {
        const assetsToAdd = mediaPool.filter((m) => parsed.ids.includes(m.id));
        addMediaAssetsToSchedule(assetsToAdd, false);
      }
    } catch {}
  };

  return (
    <div
      data-ui-theme={uiColorTheme}
      className="ui-console-shell h-screen w-screen bg-booth-950 text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Hidden Global File Inputs */}
      <input
        ref={songImportInputRef}
        type="file"
        accept=".json,.xml,.cho,.crd,.pro,.txt"
        multiple
        onChange={handleSongFileImport}
        className="hidden"
      />
      <input
        ref={pptxImportInputRef}
        type="file"
        accept=".pptx"
        onChange={handlePptxFileImport}
        className="hidden"
      />
      <input
        ref={bibleImportInputRef}
        type="file"
        accept=".json,.xml,.xmm"
        onChange={handleBibleFileUpload}
        className="hidden"
      />
      <input
        ref={scheduleJsonImportInputRef}
        type="file"
        accept=".json"
        onChange={handleScheduleJsonImport}
        className="hidden"
      />
      <input
        ref={settingsJsonImportInputRef}
        type="file"
        accept=".json"
        onChange={handleSettingsJsonImport}
        className="hidden"
      />

      {/* =====================================================================
          TOP COMMAND BAR: Branding, Multi-Screen Launchers, and PANIC BUTTONS
         ===================================================================== */}
      <header className="h-16 bg-booth-900 border-b border-booth-800 px-4 flex items-center justify-between gap-4 shrink-0">
        {/* Left: App Identity & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-tight text-lg text-white">
                FREE<span className="text-amber-400">WORSHIP</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE ENGINE READY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Zero-Latency Multi-Monitor Worship & Broadcast Presentation Suite
            </p>
          </div>
        </div>

        {/* Center: EMERGENCY PANIC BUTTONS (Huge Hit Targets for Volunteers) */}
        <div className="flex items-center gap-2 bg-booth-950 p-1.5 rounded-xl border border-booth-800">
          <button
            onClick={() =>
              setPanic((prev) => ({ ...prev, blackout: !prev.blackout, logoMode: false }))
            }
            title="Shortcut: [B] — Instantly blacks out the main projector output"
            className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              panic.blackout
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-2 ring-red-300 animate-pulse'
                : 'bg-booth-850 hover:bg-booth-800 text-slate-200 border border-booth-700'
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>Blackout</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-black/40 text-slate-300">B</kbd>
          </button>

          <button
            onClick={() =>
              setPanic((prev) => ({ ...prev, logoMode: !prev.logoMode, blackout: false }))
            }
            title="Shortcut: [L] — Switches display to Sanctuary Logo & Background Loop"
            className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              panic.logoMode
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40 ring-2 ring-amber-200'
                : 'bg-booth-850 hover:bg-booth-800 text-slate-200 border border-booth-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Logo</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-black/40 text-slate-300">L</kbd>
          </button>

          <button
            onClick={() => setPanic((prev) => ({ ...prev, clearText: !prev.clearText }))}
            title="Shortcut: [C] — Clears lyrics while keeping the motion background playing"
            className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              panic.clearText
                ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/40 ring-2 ring-sky-200'
                : 'bg-booth-850 hover:bg-booth-800 text-slate-200 border border-booth-700'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Clear Text</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-black/40 text-slate-300">C</kbd>
          </button>

          {(panic.blackout || panic.logoMode || panic.clearText) && (
            <button
              onClick={() => setPanic({ blackout: false, logoMode: false, clearText: false })}
              className="px-3 py-2 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Restore [Esc]
            </button>
          )}
        </div>

        {/* Right: Multi-Display Output Launchers (Projector, Stage Monitor, NDI/OBS Stream & Display Settings) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openExternalDisplayWindow('projector', routingSettings)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition"
            title="Launch borderless fullscreen Projector Output directly onto Screen 2"
          >
            <Monitor className="w-4 h-4" />
            <span>Launch 2nd Screen (Projector)</span>
          </button>

          <div className="flex items-center rounded-xl border border-amber-500/40 bg-booth-850 overflow-hidden">
            <button
              onClick={() => openExternalDisplayWindow('stage', routingSettings)}
              disabled={routingSettings.enableStageMonitor === false}
              className="px-3 py-2 hover:bg-booth-700 disabled:opacity-40 disabled:pointer-events-none text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
              title={
                routingSettings.enableStageMonitor === false
                  ? 'Desktop 3rd Screen is disabled (click ON/OFF toggle to enable)'
                  : 'Launch borderless fullscreen Stage Confidence Monitor directly onto Screen 3'
              }
            >
              <Tv className="w-4 h-4" />
              <span>Launch 3rd Screen (Stage)</span>
            </button>
            <button
              onClick={() =>
                handleUpdateRouting({
                  ...routingSettings,
                  enableStageMonitor: routingSettings.enableStageMonitor === false ? true : false,
                })
              }
              className={`px-2 py-2 text-[10px] font-black uppercase border-l border-booth-700 transition ${
                routingSettings.enableStageMonitor !== false
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
              }`}
              title="Enable or Disable Desktop 3rd Monitor (disable when only 2nd monitor is connected or when using Android APK as 3rd monitor)"
            >
              {routingSettings.enableStageMonitor !== false ? '3rd: ON' : '3rd: OFF'}
            </button>
          </div>

          <button
            onClick={() => {
              setDisplaySettingsTab('screens');
              setDisplaySettingsOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            title="Configure 2nd & 3rd Monitor Routing, Fonts, Word Wrapping, and Text Boundary Box"
          >
            <Sliders className="w-4 h-4" />
            <span>Display & Boundary Settings</span>
          </button>

          <button
            onClick={() => setImportExportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-booth-800 hover:bg-booth-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition"
            title="Import or Export Songs, 66-Book Bibles, Service Schedules, and Display/Boundary Settings"
          >
            <Database className="w-4 h-4" />
            <span>Import / Export</span>
          </button>

          <button
            onClick={() => openExternalDisplayWindow('stream', routingSettings)}
            className="px-3 py-2 rounded-xl bg-booth-800 hover:bg-booth-700 text-sky-300 border border-sky-500/40 font-bold text-xs flex items-center gap-1.5 transition"
            title="Open Transparent Lower-Thirds Overlay for OBS / vMix / NDI"
          >
            <Radio className="w-4 h-4" />
            <span className="hidden 2xl:inline">OBS</span>
          </button>

          {/* App UI Color Theme Selector (Light, Gray, Dark Gray, Dark) */}
          <select
            value={uiColorTheme}
            onChange={(e) => setUiColorTheme(e.target.value as UiColorTheme)}
            className="px-2.5 py-2 bg-booth-850 hover:bg-booth-800 text-slate-200 border border-booth-700 font-bold text-xs focus:outline-none cursor-pointer"
            title="Switch App UI Color Theme (Light, Gray, Dark Gray, Dark)"
          >
            <option value="dark">Theme: Dark</option>
            <option value="dark-gray">Theme: Dark Gray</option>
            <option value="gray">Theme: Gray</option>
            <option value="light">Theme: Light</option>
          </select>

          <button
            onClick={() => setShowWelcomeModal(true)}
            className="px-2.5 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition"
            title="About FreeWorship, Version Updates & GCash Donation Info"
          >
            <Heart className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">About</span>
          </button>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 rounded-xl bg-booth-850 hover:bg-booth-800 text-slate-300 border border-booth-700"
            title="Keyboard Shortcuts & Booth Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =====================================================================
          THREE-PANEL WORKSPACE PARADIGM
         ===================================================================== */}
      <div className="flex-1 grid grid-cols-12 min-h-0">
        {/* -------------------------------------------------------------------
            LEFT PANEL (3 cols): Library & Asset Pool (Songs, Bible, Media, Audio, Themes)
           ------------------------------------------------------------------- */}
        <aside className="col-span-3 bg-booth-900 border-r border-booth-800 flex flex-col min-h-0">
          {/* Library Category Tabs (5 Tabs) */}
          <div className="grid grid-cols-5 gap-1 p-1.5 bg-booth-950 border-b border-booth-800">
            <button
              onClick={() => setLeftTab('songs')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'songs'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white hover:bg-booth-850'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Songs</span>
            </button>
            <button
              onClick={() => setLeftTab('scripture')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'scripture'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white hover:bg-booth-850'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Bible</span>
            </button>
            <button
              onClick={() => setLeftTab('media')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'media'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white hover:bg-booth-850'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Media</span>
            </button>
            <button
              onClick={() => setLeftTab('audio')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'audio'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white hover:bg-booth-850'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Audio/Pad</span>
            </button>
            <button
              onClick={() => setLeftTab('themes')}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'themes'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white hover:bg-booth-850'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Themes</span>
            </button>
          </div>

          {/* TAB 1: SONGS DATABASE + OPENLYRICS / CHORDPRO / PPTX IMPORT */}
          {leftTab === 'songs' && (
            <div className="flex-1 flex flex-col min-h-0 p-3 gap-2.5">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, lyrics, key, CCLI..."
                    className="w-full bg-booth-950 border border-booth-700 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingSong(null);
                    setSongModalOpen(true);
                  }}
                  className="px-2.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* Import & Export Bar: Songs JSON / OpenLyrics XML / ChordPro + PowerPoint (.pptx) */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => songImportInputRef.current?.click()}
                  className="py-1.5 px-2 rounded-lg bg-booth-950 hover:bg-booth-850 border border-booth-700 text-[10px] font-bold text-sky-300 flex items-center justify-center gap-1"
                  title="Import Songs from FreeWorship JSON, OpenLyrics (.xml), ChordPro (.cho), or Plain Text (.txt)"
                >
                  <FileUp className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Import Songs</span>
                </button>
                <button
                  onClick={() => exportSongsLibraryJson(songs)}
                  className="py-1.5 px-2 rounded-lg bg-booth-950 hover:bg-booth-850 border border-booth-700 text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1"
                  title="Export all Songs in library to a portable .fwx.json file"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Export Songs</span>
                </button>
                <button
                  onClick={() => pptxImportInputRef.current?.click()}
                  className="py-1.5 px-2 rounded-lg bg-booth-950 hover:bg-booth-850 border border-booth-700 text-[10px] font-bold text-amber-300 flex items-center justify-center gap-1"
                  title="Import Microsoft PowerPoint (.pptx) presentation deck into Schedule"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Import .PPTX</span>
                </button>
              </div>

              {selectedSongIds.length > 1 && (
                <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300">
                    {selectedSongIds.length} songs selected (Right-click or drag to Schedule)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const toAdd = songs.filter((s) => selectedSongIds.includes(s.id));
                        toAdd.forEach((s) => addSongToSchedule(s, false));
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]"
                    >
                      + Schedule All
                    </button>
                    <button
                      onClick={() => requestDeleteSongs(selectedSongIds)}
                      className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredSongs.map((song, idx) => {
                  const isMultiSelected = selectedSongIds.includes(song.id);
                  return (
                    <div
                      key={song.id}
                      draggable
                      onDragStart={(e) => {
                        const idsToDrag = selectedSongIds.includes(song.id)
                          ? selectedSongIds
                          : [song.id];
                        e.dataTransfer.setData(
                          'application/x-freeworship-items',
                          JSON.stringify({ category: 'songs', ids: idsToDrag })
                        );
                      }}
                      onClick={(e) => handleSongItemSelect(song.id, idx, e)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!selectedSongIds.includes(song.id)) {
                          setSelectedSongIds([song.id]);
                          setLastClickedSongIdx(idx);
                        }
                        setContextMenu({ x: e.clientX, y: e.clientY, category: 'songs' });
                      }}
                      className={`bg-booth-950 border-2 rounded-xl p-3 transition group cursor-pointer ${
                        isMultiSelected
                          ? 'border-amber-400 bg-amber-950/20 shadow-md'
                          : 'border-booth-700 hover:border-booth-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-slate-400">{song.author}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-booth-800 border border-booth-700 text-[10px] font-mono text-amber-300 font-bold">
                          Key: {song.musicalKey}
                        </span>
                      </div>

                      <div
                        className="flex items-center justify-between mt-3 pt-2 border-t border-booth-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-slate-400">
                          {song.slides.length} slides • CCLI #{song.ccliNumber || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => requestDeleteSongs([song.id])}
                            className="p-1.5 rounded bg-booth-850 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-booth-700"
                            title="Delete Song"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const xml = exportSongToOpenLyricsXml(song);
                              const safeTitle = song.title.replace(/[^a-z0-9_-]+/gi, '_');
                              downloadTextFile(
                                `${safeTitle}.xml`,
                                xml,
                                'application/xml;charset=utf-8'
                              );
                            }}
                            className="p-1.5 rounded bg-booth-850 hover:bg-booth-700 text-emerald-300 border border-booth-700"
                            title="Export this song as OpenLyrics (.xml)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSong(song);
                              setSongModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-booth-850 hover:bg-booth-700 text-slate-300 border border-booth-700"
                            title="Edit Song Lyrics & Chords"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => addSongToSchedule(song, false)}
                            className="px-2 py-1 rounded bg-booth-800 hover:bg-booth-700 text-xs font-semibold text-slate-200 border border-booth-600"
                          >
                            + Schedule
                          </button>
                          <button
                            onClick={() => addSongToSchedule(song, true)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                          >
                            Go Live
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FULL 66-BOOK SCRIPTURE ENGINE + OFFLINE JSON/XML IMPORTER */}
          {leftTab === 'scripture' && (
            <div className="flex-1 flex flex-col min-h-0 p-3 gap-2.5">
              {/* Offline Bible JSON/XML Import & 1-Click 66-Book Installer */}
              <div className="bg-booth-950 border border-booth-800 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Offline 66-Book Bible Manager
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {activeTranslationVerses.length.toLocaleString()} verses loaded
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => bibleImportInputRef.current?.click()}
                    className="py-1.5 px-2 rounded-lg bg-booth-850 hover:bg-booth-800 border border-booth-700 text-[10px] font-bold text-white flex items-center justify-center gap-1"
                    title="Import any full 66-book Bible JSON or Zefania/OpenSong XML file"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Import Bible</span>
                  </button>

                  <button
                    onClick={() =>
                      exportBiblesJson(allAvailableBiblesMap, selectedTranslation)
                    }
                    className="py-1.5 px-2 rounded-lg bg-booth-850 hover:bg-booth-800 border border-booth-700 text-[10px] font-bold text-sky-300 flex items-center justify-center gap-1"
                    title={`Export ${selectedTranslation} Bible to offline JSON file`}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Export {selectedTranslation}</span>
                  </button>

                  <button
                    onClick={() => handleInstallFullPublicBible('en_kjv')}
                    disabled={isDownloadingBible}
                    className="py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1 disabled:opacity-50"
                    title="Download & cache all 31,102 KJV verses across all 66 books into offline IndexedDB"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {isDownloadingBible ? 'Installing...' : 'Full 66 KJV'}
                    </span>
                  </button>
                </div>

                {bibleImportStatus && (
                  <p className="text-[10px] text-sky-300 bg-booth-900 px-2 py-1 rounded border border-booth-800">
                    {bibleImportStatus}
                  </p>
                )}
              </div>

              {/* Translation, 66-Book Selector (OT & NT), and Chapter Selector */}
              <div className="grid grid-cols-12 gap-1.5">
                <select
                  value={selectedTranslation}
                  onChange={(e) => setSelectedTranslation(e.target.value)}
                  className="col-span-3 bg-booth-950 border border-booth-700 rounded-lg px-2 py-2 text-xs font-bold text-amber-300 focus:outline-none"
                >
                  {availableTranslations.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedBook}
                  onChange={(e) => {
                    const b = e.target.value;
                    setSelectedBook(b);
                    setScriptureSearch('');
                    const firstChap =
                      activeTranslationVerses.find(
                        (v) => v.book.toLowerCase() === b.toLowerCase()
                      )?.chapter || 1;
                    setSelectedChapter(firstChap);
                  }}
                  className="col-span-6 bg-booth-950 border border-booth-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
                >
                  <optgroup label="Old Testament (39 Books)">
                    {BIBLE_BOOKS_66.filter((b) => b.testament === 'OT').map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.number}. {b.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="New Testament (27 Books)">
                    {BIBLE_BOOKS_66.filter((b) => b.testament === 'NT').map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.number}. {b.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(Number(e.target.value));
                    setScriptureSearch('');
                  }}
                  className="col-span-3 bg-booth-950 border border-booth-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
                >
                  {availableChaptersForBook.map((c) => (
                    <option key={c} value={c}>
                      Ch. {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Smart Reference & Keyword Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={scriptureSearch}
                  onChange={(e) => setScriptureSearch(e.target.value)}
                  placeholder="Type reference (John 3:16-17, Ps 23:1-4, Rom 8:28) or keyword..."
                  className="w-full bg-booth-950 border border-booth-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">
                  {selectedVerseKeys.length > 1
                    ? `${selectedVerseKeys.length} Verses Selected`
                    : `${filteredVerses.length} Verses Shown`}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const targetVerses =
                        selectedVerseKeys.length > 0
                          ? filteredVerses.filter((v) =>
                              selectedVerseKeys.includes(getVerseKey(v))
                            )
                          : filteredVerses;
                      sendVerseListToSchedule(targetVerses, false);
                    }}
                    className="px-2.5 py-1 rounded bg-booth-800 hover:bg-booth-700 text-xs font-bold text-amber-300 border border-booth-600"
                  >
                    {selectedVerseKeys.length > 1
                      ? `+ Schedule (${selectedVerseKeys.length})`
                      : '+ Schedule Passage'}
                  </button>
                  <button
                    onClick={() => {
                      const targetVerses =
                        selectedVerseKeys.length > 0
                          ? filteredVerses.filter((v) =>
                              selectedVerseKeys.includes(getVerseKey(v))
                            )
                          : filteredVerses;
                      sendVerseListToSchedule(targetVerses, true);
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                  >
                    {selectedVerseKeys.length > 1
                      ? `Project (${selectedVerseKeys.length})`
                      : 'Project Passage'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredVerses.map((v, idx) => {
                  const vKey = getVerseKey(v);
                  const isMultiSelected = selectedVerseKeys.includes(vKey);
                  return (
                    <div
                      key={`${v.book}-${v.chapter}-${v.verse}-${idx}`}
                      draggable
                      onDragStart={(e) => {
                        const keysToDrag = selectedVerseKeys.includes(vKey)
                          ? selectedVerseKeys
                          : [vKey];
                        e.dataTransfer.setData(
                          'application/x-freeworship-items',
                          JSON.stringify({ category: 'scripture', ids: keysToDrag })
                        );
                      }}
                      onClick={(e) => handleVerseItemSelect(v, idx, e, true)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!selectedVerseKeys.includes(vKey)) {
                          setSelectedVerseKeys([vKey]);
                          setLastClickedVerseIdx(idx);
                        }
                        setContextMenu({ x: e.clientX, y: e.clientY, category: 'scripture' });
                      }}
                      className={`bg-booth-950 border-2 rounded-xl p-3 cursor-pointer transition group ${
                        isMultiSelected
                          ? 'border-amber-400 bg-amber-950/25 shadow-md'
                          : 'border-booth-700 hover:border-emerald-500/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-400">
                          {v.book} {v.chapter}:{v.verse} ({v.translation})
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-300">
                          {isMultiSelected ? '✓ Selected' : 'Click / Ctrl+Click / Drag →'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-serif">{v.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA POOL (Motion Backgrounds, Video/Image Upload, Default Logo Selection) */}
          {leftTab === 'media' && (
            <div className="flex-1 flex flex-col min-h-0 p-3 gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Motion Loops, Backgrounds & Logo
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Click to apply • Star to set Default Logo ([L]) • Right-click/Drag
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Media</span>
                </button>
              </div>

              {selectedMediaIds.length > 1 && (
                <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300">
                    {selectedMediaIds.length} media items selected
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const toAdd = mediaPool.filter((m) => selectedMediaIds.includes(m.id));
                        addMediaAssetsToSchedule(toAdd, false);
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]"
                    >
                      + Schedule
                    </button>
                    <button
                      onClick={() => requestDeleteMedia(selectedMediaIds)}
                      className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 pr-1">
                {mediaPool.map((asset, idx) => {
                  const isSelected = activeBackground.id === asset.id;
                  const isMultiSelected = selectedMediaIds.includes(asset.id);
                  const isDefaultLogo = defaultLogoMediaId === asset.id;

                  return (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => {
                        const idsToDrag = selectedMediaIds.includes(asset.id)
                          ? selectedMediaIds
                          : [asset.id];
                        e.dataTransfer.setData(
                          'application/x-freeworship-items',
                          JSON.stringify({ category: 'media', ids: idsToDrag })
                        );
                      }}
                      onClick={(e) => handleMediaItemSelect(asset.id, idx, e)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!selectedMediaIds.includes(asset.id)) {
                          setSelectedMediaIds([asset.id]);
                          setLastClickedMediaIdx(idx);
                        }
                        setContextMenu({ x: e.clientX, y: e.clientY, category: 'media' });
                      }}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition aspect-video flex flex-col justify-between ${
                        isMultiSelected
                          ? 'border-amber-400 ring-2 ring-amber-500/50'
                          : isSelected
                          ? 'border-emerald-400 ring-2 ring-emerald-500/40'
                          : 'border-booth-700 hover:border-amber-400/60'
                      }`}
                    >
                      <div className="absolute inset-0">
                        <MotionBackgroundCanvas asset={asset} />
                      </div>

                      {/* Top Action Badges: Default Logo Toggle & Delete Media */}
                      <div
                        className="relative z-10 flex items-center justify-between p-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setDefaultLogoMediaId((prev) => (prev === asset.id ? '' : asset.id))
                          }
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 border transition ${
                            isDefaultLogo
                              ? 'bg-amber-500 text-black border-amber-200 shadow'
                              : 'bg-black/70 hover:bg-black text-slate-200 border-white/20 opacity-85 group-hover:opacity-100'
                          }`}
                          title="Set this media item as the Default Logo displayed when [L] Logo Mode is active"
                        >
                          <Star
                            className={`w-2.5 h-2.5 ${isDefaultLogo ? 'fill-current' : ''}`}
                          />
                          <span>{isDefaultLogo ? 'DEFAULT LOGO' : 'Set Logo'}</span>
                        </button>

                        <button
                          onClick={() => requestDeleteMedia([asset.id])}
                          className="p-1 rounded bg-black/75 hover:bg-red-600 text-slate-200 hover:text-white border border-white/20 opacity-80 group-hover:opacity-100 transition"
                          title="Delete Media Item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="relative z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-white truncate">
                            {asset.name}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[9px] uppercase shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-300 uppercase tracking-wider">
                          {asset.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIO TRACKS & CATHEDRAL AMBIENT WORSHIP PADS */}
          {leftTab === 'audio' && (
            <div className="flex-1 flex flex-col min-h-0 p-3 overflow-y-auto">
              <AudioPadDeck
                activeSongKey={activeSongKey}
                tracks={audioTracks}
                selectedTrackIds={selectedAudioIds}
                onSelectTrack={handleAudioItemSelect}
                onTrackContextMenu={(track, idx, e) => {
                  e.preventDefault();
                  if (!selectedAudioIds.includes(track.id)) {
                    setSelectedAudioIds([track.id]);
                    setLastClickedAudioIdx(idx);
                  }
                  setContextMenu({ x: e.clientX, y: e.clientY, category: 'audio' });
                }}
                onAddTrack={(track) => setAudioTracks((prev) => [track, ...prev])}
                onRemoveTrack={(id) => requestDeleteAudioTracks([id])}
              />
            </div>
          )}

          {/* TAB 5: TEMPLATES & CUSTOM THEME DESIGNER STUDIO */}
          {leftTab === 'themes' && (
            <div className="flex-1 flex flex-col min-h-0 p-3 gap-3 overflow-y-auto">
              {/* App Interface Color Theme Selector (Light, Gray, Dark Gray, Dark) */}
              <div className="bg-booth-950 border-2 border-booth-700 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    App Interface Color Theme
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {uiColorTheme}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(
                    [
                      { id: 'light', label: 'Light' },
                      { id: 'gray', label: 'Gray' },
                      { id: 'dark-gray', label: 'Dark Gray' },
                      { id: 'dark', label: 'Dark' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setUiColorTheme(opt.id)}
                      className={`py-1.5 px-1 text-[10px] font-bold border transition ${
                        uiColorTheme === opt.id
                          ? 'bg-amber-500 text-black border-amber-300'
                          : 'bg-booth-900 hover:bg-booth-800 text-slate-200 border-booth-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Global Themes & Lower-Thirds
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Click to apply or customize in Theme Studio
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingTheme(null);
                    setThemeModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Design Theme</span>
                </button>
              </div>

              {/* Quick Launch into Interactive Text Boundary & Font Studio + Settings Import/Export */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setDisplaySettingsTab('text-boundary');
                    setDisplaySettingsOpen(true);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-booth-950 hover:bg-booth-850 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Text Boundary & Fonts</span>
                </button>
                <button
                  onClick={() => {
                    setDisplaySettingsTab('screens');
                    setDisplaySettingsOpen(true);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-booth-950 hover:bg-booth-850 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>2nd & 3rd Screen Setup</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => settingsJsonImportInputRef.current?.click()}
                  className="py-1.5 px-2.5 rounded-lg bg-booth-950 hover:bg-booth-850 border border-booth-700 text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1.5"
                  title="Import Display Settings, Text Boundaries, and Themes from JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Settings/Themes</span>
                </button>
                <button
                  onClick={() =>
                    exportSettingsJson({
                      themes,
                      routingSettings,
                      logoTitle,
                      logoSubtitle,
                    })
                  }
                  className="py-1.5 px-2.5 rounded-lg bg-booth-950 hover:bg-booth-850 border border-booth-700 text-[11px] font-bold text-sky-300 flex items-center justify-center gap-1.5"
                  title="Export Display Settings, Text Boundaries, and Themes to JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Settings/Themes</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {themes.map((t) => {
                  const isCurrent = activeTheme.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => applyThemeToActiveItem(t.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                        isCurrent
                          ? 'bg-booth-850 border-amber-400 shadow-lg'
                          : 'bg-booth-950 border-booth-800 hover:border-booth-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="font-bold text-sm text-white truncate">{t.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black uppercase">
                              ACTIVE
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTheme(t);
                              setThemeModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-booth-800 hover:bg-booth-700 text-slate-200"
                            title="Customize Theme Typography, Shadow, Colors & Lower-Thirds"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {themes.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTheme(t.id);
                              }}
                              className="p-1.5 rounded bg-booth-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                              title="Delete Theme"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{t.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-booth-800 border border-booth-700">
                          {t.fontFamily.toUpperCase()} • {Math.round(t.fontSizeScale * 100)}%
                        </span>
                        <span className="px-2 py-0.5 rounded bg-booth-800 border border-booth-700">
                          {t.verticalAlign.toUpperCase()}
                        </span>
                        <span
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: t.textColor }}
                          title={`Text: ${t.textColor}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: t.accentColor }}
                          title={`Accent: ${t.accentColor}`}
                        />
                        {t.lowerThirdBand && (
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            Lower-Thirds Band
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Organization Logo Customization */}
              <div className="mt-2 pt-3 border-t border-booth-800 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Sanctuary Logo Screen Settings ([L] Key)
                </h5>
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Church / Event Title
                  </label>
                  <input
                    type="text"
                    value={logoTitle}
                    onChange={(e) => setLogoTitle(e.target.value)}
                    className="w-full bg-booth-950 border border-booth-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={logoSubtitle}
                    onChange={(e) => setLogoSubtitle(e.target.value)}
                    className="w-full bg-booth-950 border border-booth-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* -------------------------------------------------------------------
            CENTER PANEL (6 cols): Dynamic Slide Grid + Live Reflow + Monitors
           ------------------------------------------------------------------- */}
        <main className="col-span-6 bg-booth-950 flex flex-col min-h-0">
          {/* Active Item Header + Dynamic Section Jump Bar */}
          <div className="p-3 bg-booth-900 border-b border-booth-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
                    {activeItem?.type || 'ITEM'}
                  </span>
                  <h2 className="font-bold text-base text-white truncate">
                    {activeItem?.title || 'Select an item'}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 truncate">{activeItem?.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowQuickSlideModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-booth-800 hover:bg-booth-700 text-xs font-bold text-amber-300 border border-booth-700 flex items-center gap-1"
                  title="Add a spontaneous lyric or announcement slide on the fly"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>+ Quick Slide</span>
                </button>
                <div className="flex items-center gap-1 bg-booth-950 p-1 rounded-lg border border-booth-800">
                  <button
                    onClick={goToPrevSlide}
                    className="px-3 py-1.5 rounded bg-booth-850 hover:bg-booth-700 text-xs font-bold text-white flex items-center gap-1"
                    title="Previous Slide (Left/Up Arrow)"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={goToNextSlide}
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white flex items-center gap-1 shadow"
                    title="Next Slide (Spacebar / Right Arrow)"
                  >
                    <span>Next</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Song Flow Control Bar + Quick Slide Transition & Text Boundary Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Instant Jump:
                </span>
                {sectionJumpButtons.map(({ tag, index }) => {
                  const isCurrentSection = currentSlide?.tag === tag;
                  return (
                    <button
                      key={`${tag}-${index}`}
                      onClick={() => setActiveSlideIndex(index)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border transition ${
                        isCurrentSection
                          ? 'bg-emerald-500 text-black border-emerald-300 shadow'
                          : `${getTagBadgeStyle(tag)} hover:brightness-125`
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Inline Slide Transition Selector & Text Boundary Shortcut */}
              <div className="flex items-center gap-1.5 bg-booth-950 px-2 py-1 rounded-lg border border-booth-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Transition:
                </span>
                <select
                  value={routingSettings.transition?.type || 'fade'}
                  onChange={(e) => {
                    const nextType = e.target.value as SlideTransitionType;
                    handleUpdateRouting({
                      ...routingSettings,
                      transition: {
                        type: nextType,
                        durationMs: routingSettings.transition?.durationMs ?? 380,
                        easing:
                          routingSettings.transition?.easing ||
                          'cubic-bezier(0.22, 1, 0.36, 1)',
                      },
                    });
                  }}
                  className="bg-booth-900 border border-booth-700 rounded px-2 py-0.5 text-[11px] font-bold text-white focus:outline-none"
                  title="Select slide transition animation for Projector & Live Output"
                >
                  <option value="fade">Crossfade</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="slide-down">Slide Down</option>
                  <option value="slide-left">Push Left</option>
                  <option value="zoom-in">Scale Zoom</option>
                  <option value="blur-fade">Blur Dissolve</option>
                  <option value="flip-3d">3D Flip</option>
                  <option value="cut">Instant Cut (0ms)</option>
                </select>

                <select
                  value={routingSettings.transition?.durationMs ?? 380}
                  onChange={(e) => {
                    const nextMs = parseInt(e.target.value, 10);
                    handleUpdateRouting({
                      ...routingSettings,
                      transition: {
                        type: routingSettings.transition?.type || 'fade',
                        durationMs: nextMs,
                        easing:
                          routingSettings.transition?.easing ||
                          'cubic-bezier(0.22, 1, 0.36, 1)',
                      },
                    });
                  }}
                  className="bg-booth-900 border border-booth-700 rounded px-1.5 py-0.5 text-[11px] font-mono text-amber-300 focus:outline-none"
                  title="Transition Animation Speed"
                >
                  <option value={180}>Fast (180ms)</option>
                  <option value={380}>Smooth (380ms)</option>
                  <option value={600}>Medium (600ms)</option>
                  <option value={950}>Slow Worship (950ms)</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setDisplaySettingsTab('text-boundary');
                    setDisplaySettingsOpen(true);
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-[10px] font-bold text-amber-300 flex items-center gap-1"
                  title="Open Text Boundary Box, Font & Word Wrap Studio"
                >
                  <Move className="w-3 h-3" />
                  <span>Text Boundary & Fonts</span>
                </button>
              </div>
            </div>
          </div>

          {/* Slide Deck Grid (With Huge Hit Targets, Glow Indicators, and Live Quick-Edit) */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {activeItem?.slides.map((slide, idx) => {
                const isLive = idx === activeSlideIndex;
                const isNext = idx === activeSlideIndex + 1;
                const isEditingThis = quickEditSlideId === slide.id;

                return (
                  <div
                    key={slide.id}
                    onClick={() => {
                      if (!isEditingThis) setActiveSlideIndex(idx);
                    }}
                    className={`relative rounded-xl border-2 p-3 flex flex-col justify-between transition-all cursor-pointer min-h-[148px] ${
                      isLive
                        ? 'bg-emerald-950/35 border-emerald-400 ring-4 ring-emerald-500/30 shadow-xl'
                        : isNext
                        ? 'bg-amber-950/20 border-amber-500/70 hover:border-amber-400'
                        : 'bg-booth-900 border-booth-800 hover:border-booth-600'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] font-black ${
                            isLive
                              ? 'bg-emerald-400 text-black'
                              : isNext
                              ? 'bg-amber-500 text-black'
                              : 'bg-booth-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTagBadgeStyle(
                            slide.tag
                          )}`}
                        >
                          {slide.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isLive && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                            ON AIR
                          </span>
                        )}
                        {isNext && !isLive && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold text-[9px] uppercase">
                            NEXT
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startQuickEdit(slide);
                          }}
                          className="p-1 rounded hover:bg-booth-700 text-slate-400 hover:text-white"
                          title="Quick-Edit Slide Live (Instant Reflow)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Slide Body or Inline Live Quick-Editor */}
                    {isEditingThis ? (
                      <div
                        className="space-y-2 z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          rows={3}
                          value={quickEditText}
                          onChange={(e) => setQuickEditText(e.target.value)}
                          className="w-full bg-booth-950 border border-amber-400 rounded p-1.5 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={quickEditSubtext}
                          onChange={(e) => setQuickEditSubtext(e.target.value)}
                          placeholder="Subtext / reference..."
                          className="w-full bg-booth-950 border border-booth-700 rounded px-2 py-1 text-[11px] text-slate-200"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setQuickEditSlideId(null)}
                            className="px-2 py-1 rounded bg-booth-800 text-[11px] text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveQuickEdit}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-black font-bold text-[11px] flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Update Live
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="my-auto space-y-1">
                        {slide.lines.map((line, lIdx) => (
                          <p
                            key={lIdx}
                            className={`text-xs leading-snug font-semibold ${
                              isLive ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Slide Footer (Chords / Subtext) */}
                    <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                      {slide.chords ? (
                        <span className="font-mono text-amber-300/90 truncate">
                          ♪ {slide.chords}
                        </span>
                      ) : (
                        <span className="text-slate-500 truncate">{slide.subtext || ''}</span>
                      )}
                      <span className="text-slate-500 font-mono">Key [{idx + 1}]</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Dual Broadcast Monitors: LIVE PROGRAM OUTPUT vs NEXT CUED PREVIEW */}
          <div className="h-60 bg-booth-900 border-t border-booth-800 p-3 grid grid-cols-2 gap-4 shrink-0">
            {/* LIVE PROGRAM MONITOR */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    PROGRAM LIVE (PROJECTOR OUTPUT)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Slide {activeSlideIndex + 1} of {activeItem?.slides.length || 0}
                </span>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-lg relative bg-black">
                <SlideStageRenderer
                  slide={currentSlide}
                  background={activeBackground}
                  logoAsset={activeLogoAsset}
                  theme={activeTheme}
                  transition={routingSettings.transition || activeTheme.transition}
                  panic={panic}
                  logoTitle={logoTitle}
                  logoSubtitle={logoSubtitle}
                  stageAlert={stageAlert}
                  scaleMode="preview"
                />
              </div>
            </div>

            {/* CUED NEXT SLIDE MONITOR */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    CUED NEXT (PREVIEW & STAGE CONFIDENCE)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {nextSlide ? nextSlide.tag : 'End of Schedule'}
                </span>
              </div>
              <div
                onClick={goToNextSlide}
                title="Click to transition to Next Slide"
                className="flex-1 rounded-xl overflow-hidden border-2 border-amber-500/60 hover:border-amber-400 cursor-pointer relative bg-black"
              >
                <SlideStageRenderer
                  slide={nextSlide}
                  background={activeBackground}
                  theme={activeTheme}
                  panic={{ blackout: false, logoMode: false, clearText: false }}
                  logoTitle={logoTitle}
                  logoSubtitle={logoSubtitle}
                  scaleMode="preview"
                />
                <div className="absolute bottom-2 right-2 bg-black/75 border border-amber-400/50 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  Click or Press [Space] to Take Live →
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* -------------------------------------------------------------------
            RIGHT PANEL (3 cols): Service Schedule (Run-of-Show) + Stage Messaging
           ------------------------------------------------------------------- */}
        <aside
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDraggingOverSchedule) setIsDraggingOverSchedule(true);
          }}
          onDragLeave={() => setIsDraggingOverSchedule(false)}
          onDrop={handleScheduleDrop}
          className={`col-span-3 bg-booth-900 border-l flex flex-col min-h-0 transition ${
            isDraggingOverSchedule
              ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/15'
              : 'border-booth-800'
          }`}
        >
          {/* Service Schedule Header */}
          <div className="p-3 bg-booth-950 border-b border-booth-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
                    Service Schedule
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {schedule.length} items in Run-of-Show
                  </p>
                </div>
              </div>

              <button
                onClick={() => pptxImportInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-booth-850 hover:bg-booth-800 border border-booth-700 text-[10px] font-bold text-amber-300 flex items-center gap-1 shrink-0"
                title="Import PowerPoint (.pptx) sermon or announcement slides directly into Schedule"
              >
                <FileUp className="w-3 h-3" />
                <span>+ .PPTX</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => scheduleJsonImportInputRef.current?.click()}
                className="py-1 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[10px] font-bold text-sky-300 flex items-center justify-center gap-1"
                title="Import / Load a saved Service Schedule (.fws.json)"
              >
                <Upload className="w-3 h-3" />
                <span>Import Schedule</span>
              </button>
              <button
                onClick={() => exportScheduleJson(schedule, themes)}
                className="py-1 px-2 rounded-lg bg-booth-900 hover:bg-booth-800 border border-booth-700 text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1"
                title="Save / Export this Service Schedule (.fws.json)"
              >
                <Download className="w-3 h-3" />
                <span>Export Schedule</span>
              </button>
            </div>
          </div>

          {/* Schedule Timeline List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {schedule.map((item, idx) => {
              const isSelected = item.id === activeItem?.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveItemId(item.id);
                    setActiveSlideIndex(0);
                  }}
                  className={`rounded-xl p-3 border-2 cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-booth-850 border-emerald-400 shadow-lg'
                      : 'bg-booth-950 border-booth-800 hover:border-booth-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-400 text-black'
                            : 'bg-booth-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-booth-800 text-amber-300">
                            {item.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.slides.length} slides
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-white truncate mt-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>

                    {/* Item Order & Delete Controls */}
                    <div
                      className="flex items-center gap-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => moveScheduleItem(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-booth-800 text-slate-400 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveScheduleItem(idx, 1)}
                        disabled={idx === schedule.length - 1}
                        className="p-1 rounded hover:bg-booth-800 text-slate-400 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteScheduleItem(item.id)}
                        className="p-1 rounded hover:bg-red-950 text-slate-400 hover:text-red-400"
                        title="Remove from Schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stage Display & Confidence Monitor Controls (Timer + Private Band/Speaker Alert) */}
          <div className="p-3 bg-booth-950 border-t border-booth-800 space-y-3 shrink-0">
            {/* Stage Countdown Timer Control */}
            <div className="bg-booth-900 border border-booth-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Stage Countdown Timer
                </span>
                <span className="font-mono text-base font-black text-white">
                  {Math.floor(countdown.secondsRemaining / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(countdown.secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCountdown((prev) => ({ ...prev, running: !prev.running }))
                  }
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                    countdown.running
                      ? 'bg-amber-500 text-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {countdown.running ? 'Pause Timer' : 'Start Timer'}
                </button>
                {[5, 10, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() =>
                      setCountdown({
                        secondsRemaining: mins * 60,
                        running: false,
                        label: `${mins}m Countdown`,
                      })
                    }
                    className="px-2 py-1.5 rounded-lg bg-booth-800 hover:bg-booth-700 text-[11px] font-mono text-slate-200"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Stage & Sanctuary Alert Messaging */}
            <div className="bg-booth-900 border border-booth-800 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  Stage / Nursery Alert
                </span>
                {stageAlert.active && (
                  <button
                    onClick={() =>
                      setStageAlert({ message: '', active: false, urgent: false })
                    }
                    className="text-[10px] font-bold text-red-400 hover:underline"
                  >
                    Clear Alert
                  </button>
                )}
              </div>

              <input
                type="text"
                value={stageAlertInput}
                onChange={(e) => setStageAlertInput(e.target.value)}
                placeholder="e.g. Wrap up in 2 mins / Parent #104 to Nursery"
                className="w-full bg-booth-950 border border-booth-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    if (!stageAlertInput.trim()) return;
                    setStageAlert({
                      message: stageAlertInput.trim(),
                      active: true,
                      urgent: false,
                    });
                  }}
                  className="py-1.5 rounded-lg bg-booth-800 hover:bg-booth-700 text-amber-300 border border-amber-500/40 font-bold text-[11px]"
                >
                  Send to Stage Only
                </button>
                <button
                  onClick={() => {
                    if (!stageAlertInput.trim()) return;
                    setStageAlert({
                      message: stageAlertInput.trim(),
                      active: true,
                      urgent: true,
                    });
                  }}
                  className="py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-bold text-[11px]"
                >
                  Projector Banner
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* =====================================================================
          MODALS: Song Editor, Theme Designer, Spontaneous Slide, Shortcuts
         ===================================================================== */}
      {songModalOpen && (
        <SongEditorModal
          initialSong={editingSong}
          onSave={handleSaveSong}
          onClose={() => {
            setSongModalOpen(false);
            setEditingSong(null);
          }}
        />
      )}

      {themeModalOpen && (
        <ThemeDesignerModal
          initialTheme={editingTheme}
          previewBackground={activeBackground}
          onSave={handleSaveTheme}
          onClose={() => {
            setThemeModalOpen(false);
            setEditingTheme(null);
          }}
        />
      )}

      {displaySettingsOpen && (
        <DisplaySettingsModal
          initialTab={displaySettingsTab}
          routing={routingSettings}
          onUpdateRouting={handleUpdateRouting}
          activeTheme={activeTheme}
          previewSlide={currentSlide}
          previewBackground={activeBackground}
          onSaveTheme={(updatedTheme, applyNow) => {
            handleSaveTheme(updatedTheme, applyNow);
            setDisplaySettingsOpen(false);
          }}
          onResetAllDefaults={() => {
            handleUpdateRouting({ ...DEFAULT_ROUTING_SETTINGS });
            setThemes(DEFAULT_THEMES);
            setLogoTitle('FREEWORSHIP SANCTUARY');
            setLogoSubtitle('WORSHIP • WORD • COMMUNITY');
          }}
          onClose={() => setDisplaySettingsOpen(false)}
        />
      )}

      {/* Right-Click Context Menu for Multi-Selected Songs, Bible Verses, Media, and Audio */}
      {contextMenu && (
        <div
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 190),
            left: Math.min(contextMenu.x, window.innerWidth - 230),
          }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[110] w-56 bg-booth-900 border-2 border-booth-600 rounded-xl shadow-2xl py-1.5 text-xs overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-booth-800 text-[10px] font-black uppercase tracking-wider text-amber-400">
            {contextMenu.category === 'songs' && `${selectedSongIds.length} Song(s) Selected`}
            {contextMenu.category === 'scripture' &&
              `${selectedVerseKeys.length} Verse(s) Selected`}
            {contextMenu.category === 'media' && `${selectedMediaIds.length} Media Item(s) Selected`}
            {contextMenu.category === 'audio' && `${selectedAudioIds.length} Audio Track(s) Selected`}
          </div>

          {contextMenu.category !== 'audio' && (
            <>
              <button
                onClick={() => {
                  if (contextMenu.category === 'songs') {
                    const toAdd = songs.filter((s) => selectedSongIds.includes(s.id));
                    toAdd.forEach((s) => addSongToSchedule(s, false));
                  } else if (contextMenu.category === 'scripture') {
                    const toAdd = filteredVerses.filter((v) =>
                      selectedVerseKeys.includes(getVerseKey(v))
                    );
                    sendVerseListToSchedule(toAdd, false);
                  } else if (contextMenu.category === 'media') {
                    const toAdd = mediaPool.filter((m) => selectedMediaIds.includes(m.id));
                    addMediaAssetsToSchedule(toAdd, false);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-booth-800 text-slate-100 font-bold flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Selected to Schedule</span>
              </button>

              <button
                onClick={() => {
                  if (contextMenu.category === 'songs') {
                    const toAdd = songs.filter((s) => selectedSongIds.includes(s.id));
                    toAdd.forEach((s, i) => addSongToSchedule(s, i === toAdd.length - 1));
                  } else if (contextMenu.category === 'scripture') {
                    const toAdd = filteredVerses.filter((v) =>
                      selectedVerseKeys.includes(getVerseKey(v))
                    );
                    sendVerseListToSchedule(toAdd, true);
                  } else if (contextMenu.category === 'media') {
                    const toAdd = mediaPool.filter((m) => selectedMediaIds.includes(m.id));
                    addMediaAssetsToSchedule(toAdd, true);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left hover:bg-booth-800 text-emerald-300 font-bold flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Project Selected Live Now</span>
              </button>
            </>
          )}

          {contextMenu.category === 'media' && selectedMediaIds.length === 1 && (
            <button
              onClick={() => {
                const targetId = selectedMediaIds[0];
                setDefaultLogoMediaId((prev) => (prev === targetId ? '' : targetId));
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left hover:bg-booth-800 text-amber-300 font-bold flex items-center gap-2 border-t border-booth-800"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {defaultLogoMediaId === selectedMediaIds[0]
                  ? 'Clear Default Logo'
                  : 'Set as Default Sanctuary Logo ([L])'}
              </span>
            </button>
          )}

          {contextMenu.category !== 'scripture' && (
            <button
              onClick={() => {
                if (contextMenu.category === 'songs') {
                  requestDeleteSongs(selectedSongIds);
                } else if (contextMenu.category === 'media') {
                  requestDeleteMedia(selectedMediaIds);
                } else if (contextMenu.category === 'audio') {
                  requestDeleteAudioTracks(selectedAudioIds);
                }
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left hover:bg-red-950/60 text-red-400 font-bold flex items-center gap-2 border-t border-booth-800"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Selected...</span>
            </button>
          )}
        </div>
      )}

      {/* Checkbox Delete Confirmation Modal */}
      {pendingDelete && (
        <ConfirmDeleteModal
          title={`Confirm ${pendingDelete.category} Deletion`}
          description={`Are you sure you want to permanently remove the following ${pendingDelete.category.toLowerCase()}(s) from your library?`}
          itemNames={pendingDelete.titles}
          onConfirmDelete={executeConfirmedDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {/* Startup Splash Screen (Displays until all databases & functions finish initializing) */}
      {showSplashScreen && (
        <StartupSplashScreen progress={splashProgress} statusText={splashStatus} />
      )}

      {/* Daily Welcome / About / GCash Donation & GitHub Update Modal */}
      {showWelcomeModal && !showSplashScreen && (
        <WelcomeAboutModal onClose={() => setShowWelcomeModal(false)} />
      )}

      {importExportModalOpen && (
        <ImportExportModal
          songs={songs}
          customBibles={customBibles}
          allAvailableBibles={allAvailableBiblesMap}
          selectedTranslation={selectedTranslation}
          schedule={schedule}
          themes={themes}
          routingSettings={routingSettings}
          logoTitle={logoTitle}
          logoSubtitle={logoSubtitle}
          mediaPool={mediaPool}
          onImportBundle={handleApplyImportedBundle}
          onImportSongs={(newSongs, mode) => {
            setSongs((prev) => {
              if (mode === 'replace') return newSongs;
              const existingIds = new Set(prev.map((s) => s.id));
              const added = newSongs.filter((s) => !existingIds.has(s.id));
              const updated = prev.map(
                (s) => newSongs.find((inc) => inc.id === s.id) || s
              );
              return [...added, ...updated];
            });
          }}
          onImportBibleTranslation={async (code, verses) => {
            await saveBibleToIndexedDB(code, verses);
            setCustomBibles((prev) => ({ ...prev, [code]: verses }));
            setSelectedTranslation(code);
          }}
          onImportSchedule={(items, mode) => {
            setSchedule((prev) => {
              const next = mode === 'replace' ? items : [...prev, ...items];
              if (next[0]) {
                setActiveItemId(next[0].id);
                setActiveSlideIndex(0);
              }
              return next;
            });
          }}
          onClose={() => setImportExportModalOpen(false)}
        />
      )}

      {showQuickSlideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-booth-900 border border-booth-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Add Spontaneous Live Slide
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Slide Subtitle / Reference</label>
              <input
                type="text"
                value={spontaneousTitle}
                onChange={(e) => setSpontaneousTitle(e.target.value)}
                className="w-full bg-booth-950 border border-booth-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Slide Lines</label>
              <textarea
                rows={4}
                value={spontaneousLines}
                onChange={(e) => setSpontaneousLines(e.target.value)}
                className="w-full bg-booth-950 border border-booth-700 rounded-lg p-3 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowQuickSlideModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={addSpontaneousSlide}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-black"
              >
                Add & Project Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showShortcutsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-booth-900 border border-booth-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">
              Booth Operator Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Next Slide</span>
                <kbd className="px-2 py-0.5 rounded bg-booth-800 text-amber-300 font-mono">
                  Space / →
                </kbd>
              </div>
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Previous Slide</span>
                <kbd className="px-2 py-0.5 rounded bg-booth-800 text-amber-300 font-mono">
                  ← / ↑
                </kbd>
              </div>
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Blackout Screen</span>
                <kbd className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono">B</kbd>
              </div>
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Sanctuary Logo</span>
                <kbd className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">
                  L
                </kbd>
              </div>
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Clear Text Only</span>
                <kbd className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono">C</kbd>
              </div>
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Restore All Output</span>
                <kbd className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                  Esc
                </kbd>
              </div>
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Jump to Slide 1–9</span>
                <kbd className="px-2 py-0.5 rounded bg-booth-800 text-amber-300 font-mono">
                  1 – 9
                </kbd>
              </div>
              <div className="bg-booth-950 p-2.5 rounded-lg border border-booth-800 flex justify-between">
                <span className="text-slate-300">Jump to Chorus / Verse</span>
                <kbd className="px-2 py-0.5 rounded bg-booth-800 text-amber-300 font-mono">
                  R / V
                </kbd>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
