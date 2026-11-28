export type ResolutionPresetId =
  | 'auto'
  | '1920x1080'
  | '1760x990'
  | '1680x1050'
  | '1600x900'
  | '1440x900'
  | '1366x768'
  | '1280x1024'
  | '1280x720'
  | '1128x634'
  | '1024x768'
  | '800x600';

export interface ResolutionPresetMeta {
  id: Exclude<ResolutionPresetId, 'auto'>;
  label: string;
  width: number;
  height: number;
  recommended?: boolean;
}

export const SUPPORTED_RESOLUTION_PRESETS: ResolutionPresetMeta[] = [
  { id: '1920x1080', label: '1920 × 1080 (Recommended)', width: 1920, height: 1080, recommended: true },
  { id: '1760x990', label: '1760 × 990', width: 1760, height: 990 },
  { id: '1680x1050', label: '1680 × 1050', width: 1680, height: 1050 },
  { id: '1600x900', label: '1600 × 900', width: 1600, height: 900 },
  { id: '1440x900', label: '1440 × 900', width: 1440, height: 900 },
  { id: '1366x768', label: '1366 × 768', width: 1366, height: 768 },
  { id: '1280x1024', label: '1280 × 1024', width: 1280, height: 1024 },
  { id: '1280x720', label: '1280 × 720', width: 1280, height: 720 },
  { id: '1128x634', label: '1128 × 634', width: 1128, height: 634 },
  { id: '1024x768', label: '1024 × 768', width: 1024, height: 768 },
  { id: '800x600', label: '800 × 600', width: 800, height: 600 },
];

export type AdaptiveDensityTier =
  | 'ultra-compact'
  | 'compact'
  | 'balanced'
  | 'standard'
  | 'widescreen';

export interface DetectedDisplayMetrics {
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  physicalWidth: number;
  physicalHeight: number;
  devicePixelRatio: number;
  matchedPresetLabel: string;
}

export interface AdaptiveLayoutProfile {
  presetId: ResolutionPresetId;
  tier: AdaptiveDensityTier;
  effectiveWidth: number;
  effectiveHeight: number;
  rootFontSizePx: number;
  topBarHeightPx: number;
  gridTemplateColumns: string;
  bottomMonitorHeightPx: number;
  sideBySideDeckCols: 1 | 2;
  singleDeckCols: 1 | 2 | 3;
  compactTopBar: boolean;
  hideTopKeycaps: boolean;
  compactSidebars: boolean;
  preferSingleDeck: boolean;
  metrics: DetectedDisplayMetrics;
}

const STORAGE_RESOLUTION_MODE_KEY = 'freeworship_ui_resolution_mode_v1';

export function loadPersistedResolutionMode(): ResolutionPresetId {
  try {
    const saved = localStorage.getItem(STORAGE_RESOLUTION_MODE_KEY) as ResolutionPresetId | null;
    if (
      saved &&
      (saved === 'auto' || SUPPORTED_RESOLUTION_PRESETS.some((p) => p.id === saved))
    ) {
      return saved;
    }
  } catch {}
  return 'auto';
}

export function savePersistedResolutionMode(mode: ResolutionPresetId): void {
  try {
    localStorage.setItem(STORAGE_RESOLUTION_MODE_KEY, mode);
  } catch {}
}

export function matchClosestResolutionLabel(width: number, height: number): string {
  let best = SUPPORTED_RESOLUTION_PRESETS[0];
  let bestDist = Infinity;
  for (const preset of SUPPORTED_RESOLUTION_PRESETS) {
    const dist = Math.abs(preset.width - width) + Math.abs(preset.height - height);
    if (dist < bestDist) {
      bestDist = dist;
      best = preset;
    }
  }
  return `${best.width} × ${best.height}`;
}

export function detectDisplayMetrics(): DetectedDisplayMetrics {
  if (typeof window === 'undefined') {
    return {
      viewportWidth: 1920,
      viewportHeight: 1080,
      screenWidth: 1920,
      screenHeight: 1080,
      physicalWidth: 1920,
      physicalHeight: 1080,
      devicePixelRatio: 1,
      matchedPresetLabel: '1920 × 1080',
    };
  }
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const vw = Math.max(320, Math.round(window.innerWidth));
  const vh = Math.max(240, Math.round(window.innerHeight));
  const sw = Math.round(window.screen?.width || vw);
  const sh = Math.round(window.screen?.height || vh);
  const pw = Math.round(sw * dpr);
  const ph = Math.round(sh * dpr);

  return {
    viewportWidth: vw,
    viewportHeight: vh,
    screenWidth: sw,
    screenHeight: sh,
    physicalWidth: pw,
    physicalHeight: ph,
    devicePixelRatio: Number(dpr.toFixed(2)),
    matchedPresetLabel: matchClosestResolutionLabel(pw, ph),
  };
}

export function computeAdaptiveLayoutProfile(
  presetId: ResolutionPresetId,
  metrics: DetectedDisplayMetrics
): AdaptiveLayoutProfile {
  const presetMeta =
    presetId !== 'auto'
      ? SUPPORTED_RESOLUTION_PRESETS.find((p) => p.id === presetId)
      : undefined;

  const effectiveWidth = presetMeta ? presetMeta.width : metrics.viewportWidth;
  const effectiveHeight = presetMeta ? presetMeta.height : metrics.viewportHeight;

  let tier: AdaptiveDensityTier = 'widescreen';
  if (effectiveWidth <= 1080 || effectiveHeight <= 650) {
    tier = 'ultra-compact';
  } else if (effectiveWidth <= 1380 || effectiveHeight <= 790) {
    tier = 'compact';
  } else if (effectiveWidth <= 1620 || effectiveHeight <= 920) {
    tier = 'balanced';
  } else if (effectiveWidth <= 1820) {
    tier = 'standard';
  }

  // Smooth root font scaling so UI text & padding remain crisp and readable at any resolution
  let rootFontSizePx = 16;
  let topBarHeightPx = 36;
  let gridTemplateColumns = 'minmax(290px, 24%) minmax(0, 1fr) minmax(265px, 22%)';
  let bottomMonitorHeightPx = 228;
  let sideBySideDeckCols: 1 | 2 = 2;
  let singleDeckCols: 1 | 2 | 3 = 3;

  switch (tier) {
    case 'ultra-compact': // 800x600, 1024x768, 1128x634
      rootFontSizePx = effectiveWidth <= 860 ? 12 : 13;
      topBarHeightPx = 32;
      gridTemplateColumns =
        effectiveWidth <= 920
          ? 'minmax(185px, 26%) minmax(0, 1fr) minmax(180px, 24%)'
          : 'minmax(215px, 25%) minmax(0, 1fr) minmax(205px, 23%)';
      bottomMonitorHeightPx = effectiveHeight <= 620 ? 118 : 138;
      sideBySideDeckCols = 1;
      singleDeckCols = effectiveWidth <= 940 ? 1 : 2;
      break;

    case 'compact': // 1280x720, 1280x1024, 1366x768
      rootFontSizePx = 13.75;
      topBarHeightPx = 34;
      gridTemplateColumns = 'minmax(250px, 24.5%) minmax(0, 1fr) minmax(235px, 22.5%)';
      bottomMonitorHeightPx = effectiveHeight <= 740 ? 148 : 168;
      sideBySideDeckCols = 1;
      singleDeckCols = 2;
      break;

    case 'balanced': // 1440x900, 1600x900, or 1920x1080 @ 125% DPI (1536x864 logical)
      rootFontSizePx = 14.5;
      topBarHeightPx = 36;
      gridTemplateColumns = 'minmax(275px, 24%) minmax(0, 1fr) minmax(255px, 22%)';
      bottomMonitorHeightPx = effectiveHeight <= 840 ? 176 : 198;
      sideBySideDeckCols = 1;
      singleDeckCols = effectiveWidth >= 1460 ? 3 : 2;
      break;

    case 'standard': // 1680x1050, 1760x990
      rootFontSizePx = 15.25;
      topBarHeightPx = 36;
      gridTemplateColumns = 'minmax(290px, 24%) minmax(0, 1fr) minmax(265px, 22%)';
      bottomMonitorHeightPx = 216;
      sideBySideDeckCols = effectiveWidth >= 1720 ? 2 : 1;
      singleDeckCols = 3;
      break;

    case 'widescreen': // 1920x1080 @ 100% and higher
    default:
      rootFontSizePx = 16;
      topBarHeightPx = 36;
      gridTemplateColumns = 'minmax(305px, 24%) minmax(0, 1fr) minmax(275px, 22%)';
      bottomMonitorHeightPx = 232;
      sideBySideDeckCols = 2;
      singleDeckCols = 3;
      break;
  }

  return {
    presetId,
    tier,
    effectiveWidth,
    effectiveHeight,
    rootFontSizePx,
    topBarHeightPx,
    gridTemplateColumns,
    bottomMonitorHeightPx,
    sideBySideDeckCols,
    singleDeckCols,
    compactTopBar: effectiveWidth < 1260,
    hideTopKeycaps: effectiveWidth < 1140,
    compactSidebars: effectiveWidth < 1380,
    preferSingleDeck: effectiveWidth < 1160,
    metrics,
  };
}
