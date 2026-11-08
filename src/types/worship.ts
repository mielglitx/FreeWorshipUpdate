export type SectionTag =
  | 'Verse 1'
  | 'Verse 2'
  | 'Verse 3'
  | 'Verse 4'
  | 'Pre-Chorus'
  | 'Chorus'
  | 'Bridge'
  | 'Tag'
  | 'Intro'
  | 'Outro'
  | 'Scripture'
  | 'Announcement'
  | 'Sermon Point';

export interface Slide {
  id: string;
  tag: SectionTag | string;
  label?: string;
  lines: string[];
  subtext?: string; // e.g. Scripture reference or CCLI credit
  chords?: string;  // Optional stage-only chord notes
  backgroundOverrideId?: string;
}

export interface SongItem {
  id: string;
  title: string;
  author: string;
  ccliNumber: string;
  musicalKey: string;
  bpm?: number;
  defaultBackgroundId?: string;
  slides: Slide[];
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface BibleTranslationMeta {
  code: string;
  name: string;
  verseCount: number;
  isBuiltIn?: boolean;
}

export type MediaType = 'motion-canvas' | 'gradient' | 'image' | 'video';

export interface MediaAsset {
  id: string;
  name: string;
  category: 'Motion Loop' | 'Still Background' | 'Logo / Graphic' | 'Custom Upload';
  type: MediaType;
  previewGradient: string;
  motionPreset?: 'aurora' | 'particles' | 'nebula' | 'warm-worship' | 'deep-ocean' | 'royal-gold' | 'cross-glow';
  mediaUrl?: string;
}

export interface TextBoundaryRect {
  x: number;      // Left offset in % (0 - 90)
  y: number;      // Top offset in % (0 - 90)
  width: number;  // Width in % (10 - 100)
  height: number; // Height in % (10 - 100)
  paddingPx?: number; // Inner box padding in px (0 - 80)
  showGuideOnPreview?: boolean; // Show boundary dashed frame on Operator Preview
}

export interface HardwareDisplayInfo {
  id: string | number;
  index: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor?: number;
  isPrimary: boolean;
}

export type SlideTransitionType =
  | 'cut'
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'zoom-in'
  | 'blur-fade'
  | 'flip-3d';

export type SlideTransitionEasing =
  | 'cubic-bezier(0.22, 1, 0.36, 1)'
  | 'ease-in-out'
  | 'ease-out'
  | 'linear';

export interface SlideTransitionSettings {
  type: SlideTransitionType;
  durationMs: number; // 0 to 1500 (default 380)
  easing: SlideTransitionEasing;
}

export interface MultiScreenRoutingSettings {
  projectorDisplayId: string; // 'auto' | display.id | 'custom'
  stageDisplayId: string;     // 'auto' | display.id | 'custom'
  enableStageMonitor: boolean; // False when only 2nd monitor is used or Android APK is used as 3rd monitor
  projectorCustomBounds: { x: number; y: number; width: number; height: number };
  stageCustomBounds: { x: number; y: number; width: number; height: number };
  borderlessFullscreen: boolean;
  alwaysOnTop: boolean;
  keepOperatorFocus: boolean;
  hideCursorOnProjector: boolean;
  autoLaunchOnStartup: boolean;
  stageDisplayMode: 'confidence' | 'mirror-projector' | 'lyrics-chords-large';
  stageFontSizeScale: number;
  transition?: SlideTransitionSettings;
}

export type RemoteControlAction =
  | { action: 'NEXT_SLIDE' }
  | { action: 'PREV_SLIDE' }
  | { action: 'SELECT_SLIDE'; index: number }
  | { action: 'SELECT_ITEM'; itemId: string }
  | { action: 'ADD_SONG_TO_SCHEDULE'; songId: string; goLive?: boolean }
  | { action: 'ADD_SCRIPTURE_TO_SCHEDULE'; reference: string; translation?: string; goLive?: boolean }
  | { action: 'TOGGLE_PANIC'; key: 'blackout' | 'logoMode' | 'clearText' }
  | { action: 'RESTORE_PANIC' }
  | { action: 'TOGGLE_TIMER' }
  | { action: 'SET_TIMER'; minutes: number }
  | { action: 'SEND_ALERT'; message: string; urgent: boolean }
  | { action: 'CLEAR_ALERT' };

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  fontFamily: 'sans' | 'serif' | 'display' | 'mono';
  customFontName?: string; // e.g., 'Montserrat', 'Arial Black', 'Georgia', 'Segoe UI', etc.
  subtextFontName?: string;
  fontSizeScale: number; // 0.6 to 1.6
  baseFontSizePx?: number; // Exact reference font size in px at 1080p (e.g., 24 to 130, default 64)
  subtextFontSizePx?: number; // Exact reference subtext size in px (default 28)
  fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  textAlign: 'center' | 'left' | 'right' | 'justify';
  verticalAlign: 'center' | 'bottom' | 'top';
  uppercase: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  wordWrapMode?: 'balance' | 'normal' | 'break-words' | 'nowrap';
  overflowBehavior?: 'auto-fit' | 'clip' | 'visible';
  lineHeight?: number; // 0.9 to 2.2
  letterSpacingEm?: number; // -0.05 to 0.30
  wordSpacingPx?: number; // 0 to 24
  lineGapPx?: number; // 0 to 36
  strokeWidthPx?: number; // 0 to 8
  strokeColor?: string; // e.g., '#000000'
  textShadow: 'strong' | 'soft' | 'outline' | 'box' | 'glow' | 'none';
  textColor: string;
  accentColor: string;
  backgroundDimOpacity?: number; // 0 to 0.90
  lowerThirdBand: boolean;
  lowerThirdColor?: string;
  lowerThirdOpacity?: number; // 0.0 to 1.0
  lowerThirdBorderRadiusPx?: number; // 0 to 32
  maxContentWidth?: number; // 60 to 100 (%)
  boundary?: TextBoundaryRect; // Explicit draggable/resizable bounding box on screen
  transition?: SlideTransitionSettings; // Slide transition animation
}

export interface AudioTrackItem {
  id: string;
  title: string;
  category: 'Backing Track' | 'Pre-Service' | 'Worship Pad' | 'Custom Audio';
  url: string;
  duration?: number;
  musicalKey?: string;
}

export type ScheduleItemType = 'song' | 'scripture' | 'presentation' | 'announcement';

export interface ScheduleItem {
  id: string;
  type: ScheduleItemType;
  title: string;
  subtitle: string;
  sourceId?: string;
  backgroundId: string;
  themeId: string;
  slides: Slide[];
  notes?: string;
}

export interface PanicState {
  blackout: boolean;
  logoMode: boolean;
  clearText: boolean;
}

export interface StageAlertState {
  message: string;
  active: boolean;
  urgent: boolean;
}

export interface CountdownState {
  secondsRemaining: number;
  running: boolean;
  label: string;
}

export interface LiveBroadcastPayload {
  activeItemId: string;
  activeItemTitle: string;
  activeItemSubtitle: string;
  activeSlideIndex: number;
  currentSlide: Slide | null;
  nextSlide: Slide | null;
  activeItemSlides?: Slide[];
  scheduleSummary?: Array<{
    id: string;
    type: ScheduleItemType;
    title: string;
    subtitle: string;
    slideCount: number;
  }>;
  songsCatalog?: Array<{
    id: string;
    title: string;
    author: string;
    musicalKey: string;
    slideCount: number;
  }>;
  background: MediaAsset;
  theme: ThemeTemplate;
  routing?: MultiScreenRoutingSettings;
  panic: {
    blackout: boolean;
    logoMode: boolean;
    clearText: boolean;
  };
  stageAlert: StageAlertState;
  countdown: CountdownState;
  logoTitle: string;
  logoSubtitle: string;
  logoAsset?: MediaAsset | null;
  timestamp: number;
}
