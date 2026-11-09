import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  ExternalLink,
  FileText,
  Heart,
  Monitor,
  RefreshCw,
  Smartphone,
  Sparkles,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const APP_VERSION = '1.1.3';
export const APP_RELEASE_DATE = 'November 9, 2026';
export const GITHUB_UPDATE_REPO = 'https://github.com/mielglitx/FreeWorshipUpdate';
export const GITHUB_RELEASES_API =
  'https://api.github.com/repos/mielglitx/FreeWorshipUpdate/releases/latest';
export const GITHUB_RAW_UPDATES_URL =
  'https://raw.githubusercontent.com/mielglitx/FreeWorshipUpdate/main/updates.json';
export const GITHUB_RAW_APK_URL =
  'https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.2/FreeWorship-StageController.apk';

/**
 * Semver comparison: returns true ONLY if remoteVersion is strictly greater than currentVersion.
 * Prevents downgrading or false update prompts when local version is newer or equal.
 */
export function isNewerVersion(remoteVersion: string, currentVersion: string): boolean {
  if (!remoteVersion || !currentVersion) return false;
  const parseParts = (v: string) =>
    v.replace(/^v/i, '').split('.').map((p) => parseInt(p, 10) || 0);
  const rParts = parseParts(remoteVersion);
  const cParts = parseParts(currentVersion);

  const maxLen = Math.max(rParts.length, cParts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export interface ChangelogItem {
  version: string;
  date: string;
  platform: string;
  title: string;
  highlights: string[];
}

export const APP_CHANGELOG: ChangelogItem[] = [
  {
    version: '1.1.2',
    date: 'November 9, 2026',
    platform: 'Windows & Android',
    title: '5 Built-in Bibles, 9 Classic Hymns, Schedule Clear/Delete & Importer Fixes',
    highlights: [
      'Full Schedule Deletion & Clear All: Allowed removing any item (including the last item) and added a 1-click "Clear All" button with checkbox confirmation to completely clear the Run-of-Show.',
      'Right-Click Schedule Menu: Right-click any schedule item to Project Live Now, Remove from Schedule, or Clear Entire Schedule.',
      'Android Remote Schedule Management: Android Stage Controller can now delete individual schedule items and clear the entire schedule remotely.',
      'Empty Schedule Reflow: Built graceful zero-item empty states and real-time broadcast reflow across all connected screens when schedule is empty.',
      'Built-in Scripture Translations: Integrated NIV, NASB, Magandang Balita Bibliya 1901 (MBB 1901), and ESV alongside KJV with 1-click full 66-book offline IndexedDB installation.',
      '9 Classic Hymns Added: Seeded complete lyrics, verses, choruses, and chords for To God Be The Glory, Wonderful Grace of Jesus, The Battle Hymn of Republic, Love Lifted Me, Stand up, Stand up for Jesus, Holy, Holy, Holy, The Banner of The Cross, The Fight is On, and Victory in Jesus.',
      'Universal Bible Importer Fix: Resolved round-trip import of exported FreeWorship Bible files (*.fwx.json), backup archives, and multi-translation bundles without structure errors.',
      'Removed WEB Selection: Standardized on KJV, NIV, NASB, ESV, and MBB 1901 as sanctuary standard translations.',
      'Remote Scripture Translation Selector: Android Stage Controller can now select specific translations when pushing scripture passages to the live screen.',
    ],
  },
  {
    version: '1.1.1',
    date: 'November 8, 2026',
    platform: 'Windows & Android',
    title: 'In-App Direct Updates & Universal Bible/Song Importers',
    highlights: [
      'In-App One-Click Updates: Both Windows and Android apps now directly download and launch update installation inside the app.',
      'Windows Electron Auto-Installer: Downloads setup package with real-time percentage progress bar and automatically restarts FreeWorship Studio.',
      'Android Native Package Installer: Native ApkUpdater plugin downloads the latest APK and immediately opens the system package installer.',
      'Universal Bible Importer: Full round-trip support for exported FreeWorship Bible archives (*.fwx.json), multi-translation bundles, and Zefania/XML scriptures.',
      'Universal Song Importer: Robust parsing for FreeWorship song backup bundles, raw song arrays (with/without musicalKey), single-song JSON, and OpenLyrics XML.',
      'Live Download Progress: Visual percentage bar showing streamed megabytes and total size during update installation.',
    ],
  },
  {
    version: '1.1.0',
    date: 'November 8, 2026',
    platform: 'Windows & Android',
    title: 'Platform-Aware Updates, Remote Scheduling, Sharp Design & Theme Studio',
    highlights: [
      'Platform-Aware GitHub Updater: Windows (.exe) and Android (.apk) independently detect and download their respective updates.',
      'In-App Changelog & Release Notes: Detailed version history accessible from the About page on both Windows and Android.',
      'Android Remote Scheduling: Search songs and Bible passages on your Android phone/tablet and project or add them to the Windows schedule.',
      'WebRTC Wi-Fi Scanner: Auto-discovers Windows PC across all home/church router subnets (PLDT, Globe, Converge, Huawei, hotspots).',
      '4 Simplified UI Themes: Light, Gray, Dark Gray, and Dark color schemes for operator preference.',
      'Sharp Modern Geometry: Enforced clean, sharp corners (0px border-radius) throughout all UI controls.',
      'Refined Scripture Engine: Renamed "Bible 66" to "Bible", set KJV as default standard, and removed WEB.',
      'Permanent Delete Safeguard: Checkbox confirmation modal prevents accidental deletion of songs, media, or audio tracks.',
      'Default Sanctuary Logo: Choose any media item to display as the organization logo when [L] Logo panic mode is active.',
      'Persistent 3rd Screen OFF: Stage Monitor disabled state is remembered across app restarts.',
      'Multi-Select & Drag-to-Schedule: Ctrl/Shift item multi-selection, right-click context menus, and drag-and-drop to service schedule.',
      'Complete Backup Studio: Import and export songs, schedules, display routing, and offline 66-book Bibles.',
    ],
  },
  {
    version: '1.0.0',
    date: 'November 8, 2026',
    platform: 'Windows & Android',
    title: 'Initial Release of FreeWorship Studio',
    highlights: [
      'Zero-latency multi-monitor broadcast presentation suite for churches.',
      '2nd Screen Projector / LED Wall output with borderless fullscreen.',
      '3rd Screen Stage Confidence Monitor with timer, chords, and live alerts.',
      'Instant emergency panic controls: Blackout [B], Logo [L], Clear Text [C], Restore [Esc].',
      '12-Key Cathedral Ambient Worship Pad synthesizer with 2.2s stereo crossfade.',
      'Multi-track audio player with smooth 3-second booth fade out.',
      'Typography, word-wrapping, and interactive 16:9 text boundary box designer.',
      'Offline 66-book KJV Bible database with chapter and verse jump navigation.',
      'Service Schedule run-of-show planner with instant section jump tags.',
    ],
  },
];

// ============================================================================
// 1. STARTUP SPLASH SCREEN (Displays while databases & engines initialize)
// ============================================================================
interface StartupSplashScreenProps {
  statusText: string;
  progress: number;
}

export const StartupSplashScreen: React.FC<StartupSplashScreenProps> = ({
  statusText,
  progress,
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-booth-950 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-booth-900 border-2 border-amber-500/60 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl space-y-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/30 border-2 border-amber-200 animate-pulse">
          <Sparkles className="w-10 h-10 text-black" />
        </div>

        <div>
          <h1 className="font-display font-black tracking-tight text-3xl text-white">
            FREE<span className="text-amber-400">WORSHIP</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mt-1">
            Studio v.{APP_VERSION} • Zero-Latency Broadcast Engine
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-2.5 bg-booth-950 rounded-full overflow-hidden border border-booth-700">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
            <span>{statusText}</span>
            <span className="text-amber-400 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic pt-1">
          &ldquo;Distributed freely for the glorification of God.&rdquo;
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// 2. DAILY WELCOME / ABOUT & DONATION MODAL + GITHUB UPDATE CHECKER
// ============================================================================
const WELCOME_HIDE_FOREVER_KEY = 'freeworship_welcome_do_not_show_again_v1';
const WELCOME_LAST_SHOWN_DATE_KEY = 'freeworship_welcome_last_shown_date_v1';

export function shouldShowDailyWelcomeModal(): boolean {
  try {
    if (localStorage.getItem(WELCOME_HIDE_FOREVER_KEY) === 'true') {
      return false;
    }
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastShown = localStorage.getItem(WELCOME_LAST_SHOWN_DATE_KEY);
    if (lastShown === today) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function markDailyWelcomeShown(doNotShowAgain: boolean): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(WELCOME_LAST_SHOWN_DATE_KEY, today);
    if (doNotShowAgain) {
      localStorage.setItem(WELCOME_HIDE_FOREVER_KEY, 'true');
    } else {
      localStorage.removeItem(WELCOME_HIDE_FOREVER_KEY);
    }
  } catch {}
}

interface WelcomeAboutModalProps {
  platform?: 'windows' | 'android';
  onClose: () => void;
}

export const WelcomeAboutModal: React.FC<WelcomeAboutModalProps> = ({
  platform,
  onClose,
}) => {
  // Determine if this instance is running on Android or Windows
  const isAndroid =
    platform === 'android' ||
    (typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('view') === 'android' ||
        (import.meta as unknown as { env?: Record<string, string> }).env
          ?.VITE_APP_TARGET === 'android' ||
        /Android/i.test(navigator.userAgent)));

  const appDisplayName = isAndroid
    ? 'FreeWorship Android Remote'
    : 'FreeWorship Studio (Windows)';

  const [activeTab, setActiveTab] = useState<'about' | 'changelog'>('about');
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem(WELCOME_HIDE_FOREVER_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [installProgress, setInstallProgress] = useState<{
    percent: number;
    bytesReceived?: number;
    totalBytes?: number;
    statusText?: string;
  } | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const [updateStatus, setUpdateStatus] = useState<{
    state: 'idle' | 'up-to-date' | 'available' | 'error';
    targetPlatform: 'windows' | 'android';
    latestVersion?: string;
    downloadUrl?: string;
    fileName?: string;
    message?: string;
  }>({
    state: 'idle',
    targetPlatform: isAndroid ? 'android' : 'windows',
  });

  useEffect(() => {
    checkForUpdatesFromGitHub();
  }, []);

  const checkForUpdatesFromGitHub = async () => {
    setCheckingUpdate(true);
    setInstallError(null);
    const targetPlat = isAndroid ? 'android' : 'windows';

    try {
      // 1. Check updates.json manifest in repository (primary channel for repo updates)
      let manifestPlat: any = null;
      let manifestVersion = '';
      try {
        const manifestRes = await fetch(`${GITHUB_RAW_UPDATES_URL}?t=${Date.now()}`);
        if (manifestRes.ok) {
          const manifest = await manifestRes.json();
          manifestPlat = targetPlat === 'android' ? manifest.android : manifest.windows;
          manifestVersion = String(manifestPlat?.version || manifest.version || '').replace(/^v/i, '');
        }
      } catch {
        // manifest fetch failed, continue to other checks
      }

      // 2. Check official GitHub Releases API
      let releaseTag = '';
      let releaseAssetUrl = '';
      let releaseFileName = '';
      try {
        const res = await fetch(GITHUB_RELEASES_API, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (res.ok) {
          const release = await res.json();
          releaseTag = String(release.tag_name || release.name || '').replace(/^v/i, '');
          const assets: Array<{ name: string; browser_download_url: string }> = release.assets || [];

          if (targetPlat === 'android') {
            const apkAsset = assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
            if (apkAsset) {
              releaseAssetUrl = apkAsset.browser_download_url;
              releaseFileName = apkAsset.name;
            }
          } else {
            const winAsset =
              assets.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe')) ||
              assets.find((a) => a.name.endsWith('.exe'));
            if (winAsset) {
              releaseAssetUrl = winAsset.browser_download_url;
              releaseFileName = winAsset.name;
            }
          }
        }
      } catch {
        // release fetch failed
      }

      // Determine the highest available version among manifest and release tag
      let highestRemoteVersion = '';
      let bestDownloadUrl = '';
      let bestFileName = '';

      if (manifestVersion && isNewerVersion(manifestVersion, releaseTag)) {
        highestRemoteVersion = manifestVersion;
        bestDownloadUrl = manifestPlat?.downloadUrl || manifestPlat?.fallbackDownloadUrl || '';
        bestFileName = manifestPlat?.fileName || '';
      } else if (releaseTag) {
        highestRemoteVersion = releaseTag;
        bestDownloadUrl = releaseAssetUrl;
        bestFileName = releaseFileName;
      } else if (manifestVersion) {
        highestRemoteVersion = manifestVersion;
        bestDownloadUrl = manifestPlat?.downloadUrl || manifestPlat?.fallbackDownloadUrl || '';
        bestFileName = manifestPlat?.fileName || '';
      }

      // Sensible fallbacks if download URL or filename was empty
      if (!bestDownloadUrl) {
        bestDownloadUrl =
          targetPlat === 'android'
            ? GITHUB_RAW_APK_URL
            : `https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v${highestRemoteVersion || APP_VERSION}/FreeWorship.Studio-Setup-${highestRemoteVersion || APP_VERSION}.exe`;
      }
      if (!bestFileName) {
        bestFileName = targetPlat === 'android' ? 'FreeWorship-StageController.apk' : `FreeWorship Studio-Setup-${highestRemoteVersion || APP_VERSION}.exe`;
      }

      // Crucial: Only prompt an update if remote is STRICTLY newer than local APP_VERSION
      if (highestRemoteVersion && isNewerVersion(highestRemoteVersion, APP_VERSION)) {
        setUpdateStatus({
          state: 'available',
          targetPlatform: targetPlat,
          latestVersion: highestRemoteVersion,
          downloadUrl: bestDownloadUrl,
          fileName: bestFileName,
          message: `New ${targetPlat === 'android' ? 'Android APK' : 'Windows Studio'} update v.${highestRemoteVersion} is available!`,
        });
      } else {
        setUpdateStatus({
          state: 'up-to-date',
          targetPlatform: targetPlat,
          latestVersion: APP_VERSION,
          downloadUrl: bestDownloadUrl,
          fileName: bestFileName,
          message: `${targetPlat === 'android' ? 'Android Remote' : 'Windows Studio'} is up to date (v.${APP_VERSION}).`,
        });
      }
    } catch {
      setUpdateStatus({
        state: 'error',
        targetPlatform: targetPlat,
        downloadUrl: GITHUB_UPDATE_REPO,
        message: 'Offline mode — visit the GitHub repository when online to check for updates.',
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleDownloadAndInstallUpdate = async () => {
    const defaultWinUrl =
      'https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.2/FreeWorship.Studio-Setup-1.1.2.exe';
    const targetUrl =
      updateStatus.downloadUrl || (isAndroid ? GITHUB_RAW_APK_URL : defaultWinUrl);

    setInstallingUpdate(true);
    setInstallError(null);
    setInstallProgress({ percent: 0, statusText: 'Connecting to update download server...' });

    try {
      if (isAndroid) {
        const apkUpdater = (window as any).Capacitor?.Plugins?.ApkUpdater;
        if (apkUpdater && typeof apkUpdater.downloadAndInstall === 'function') {
          let removeListener: (() => void) | null = null;
          if (typeof apkUpdater.addListener === 'function') {
            const handle = await apkUpdater.addListener('downloadProgress', (data: any) => {
              const mbRead = ((data.bytesRead || 0) / 1048576).toFixed(1);
              const mbTotal = ((data.totalBytes || 0) / 1048576).toFixed(1);
              setInstallProgress({
                percent: data.percent || 0,
                bytesReceived: data.bytesRead,
                totalBytes: data.totalBytes,
                statusText:
                  data.percent >= 100
                    ? 'Download complete! Launching Android package installer...'
                    : `Downloading APK: ${data.percent}% (${mbRead} MB / ${mbTotal} MB)`,
              });
            });
            removeListener = () => handle?.remove?.();
          }

          setInstallProgress({ percent: 0, statusText: 'Starting background APK download...' });
          const res = await apkUpdater.downloadAndInstall({ url: targetUrl });
          if (removeListener) removeListener();

          if (res?.success) {
            setInstallProgress({
              percent: 100,
              statusText: 'Android package installer opened! Tap Install to update.',
            });
          }
        } else {
          // Fallback in web browser mode on Android
          setInstallProgress({ percent: 100, statusText: 'Starting browser download...' });
          const link = document.createElement('a');
          link.href = targetUrl;
          link.download = 'FreeWorship-StageController.apk';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Windows Desktop
        const desktop = typeof window !== 'undefined' ? (window as any).freeworshipDesktop : null;
        if (desktop?.downloadAndInstallUpdate) {
          let unsubProgress: (() => void) | undefined;
          if (desktop.onUpdateDownloadProgress) {
            unsubProgress = desktop.onUpdateDownloadProgress((prog: any) => {
              const mbRead = ((prog.bytesReceived || 0) / 1048576).toFixed(1);
              const mbTotal = ((prog.totalBytes || 0) / 1048576).toFixed(1);
              setInstallProgress({
                percent: prog.percent,
                bytesReceived: prog.bytesReceived,
                totalBytes: prog.totalBytes,
                statusText:
                  prog.stage === 'installing' || prog.percent >= 100
                    ? 'Download complete! Closing FreeWorship and launching Setup installer...'
                    : `Downloading Windows Setup: ${prog.percent}% (${mbRead} MB / ${mbTotal} MB)`,
              });
            });
          }

          setInstallProgress({ percent: 0, statusText: 'Downloading update from GitHub...' });
          const res = await desktop.downloadAndInstallUpdate(targetUrl);
          if (unsubProgress) unsubProgress();

          if (!res.ok) {
            throw new Error(res.error || 'Failed to download or launch Windows update installer.');
          } else {
            setInstallProgress({
              percent: 100,
              statusText: 'Setup installer started! Relaunching FreeWorship...',
            });
          }
        } else {
          // Fallback if desktop bridge is not found (browser preview)
          window.open(targetUrl, '_blank');
          setInstallProgress({
            percent: 100,
            statusText: 'Download opened in web browser.',
          });
        }
      }
    } catch (err: any) {
      console.error('Update install error:', err);
      setInstallError(err.message || 'An error occurred during update download.');
      setInstallingUpdate(false);
    }
  };

  useEffect(() => {
    checkForUpdatesFromGitHub();
  }, []);

  const handleClose = () => {
    markDailyWelcomeShown(doNotShowAgain);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-booth-900 border-2 border-amber-500/70 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Banner */}
        <div className="px-5 py-3.5 bg-booth-950 border-b-2 border-booth-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg border border-amber-200">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white">
                  FreeWorship v.{APP_VERSION}
                </h3>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {isAndroid ? 'Android Remote' : 'Windows Studio'}
                </span>
              </div>
              <p className="text-[11px] text-amber-300/90 font-medium">
                Release Date: {APP_RELEASE_DATE} • {appDisplayName}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Navigation Tabs (About & Support vs Version Changelog) */}
        <div className="flex items-center border-b-2 border-booth-800 bg-booth-950 px-4 pt-1.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'border-amber-500 text-amber-300 bg-booth-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>About & GCash Donation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'changelog'
                ? 'border-amber-500 text-amber-300 bg-booth-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>What&apos;s New & Changelog</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
              v.{APP_VERSION}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: ABOUT & DONATION */}
          {activeTab === 'about' && (
            <>
              {/* Author & Mission Card */}
              <div className="bg-booth-950 border-2 border-booth-700 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Author
                  </span>
                  <span className="font-black text-amber-300 text-sm">Amiel Yalung</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Platform
                  </span>
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    {isAndroid ? (
                      <>
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Android 3rd Monitor & Remote
                      </>
                    ) : (
                      <>
                        <Monitor className="w-3.5 h-3.5 text-sky-400" /> Windows Desktop Studio
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Release Date
                  </span>
                  <span className="font-semibold text-slate-200">{APP_RELEASE_DATE}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-booth-800 text-center">
                  <p className="font-bold text-emerald-300 text-xs sm:text-sm">
                    Distributed freely for the glorification of God.
                  </p>
                </div>
              </div>

              {/* Donation Card (GCash) */}
              <div className="bg-gradient-to-br from-amber-500/15 via-booth-950 to-emerald-500/10 border-2 border-amber-500/60 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span>Support & Donations</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Donations are welcome for the further improvement of the software.
                </p>
                <div className="bg-black/60 border border-amber-500/40 p-3 space-y-1.5 font-mono text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Donation Method:</span>
                    <span className="font-black text-sky-300">GCash</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="font-bold text-white">Amiel Yalung</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Number:</span>
                    <span className="font-black text-amber-300 text-sm">09120600138</span>
                  </div>
                </div>
              </div>

              {/* Official GitHub Platform-Specific Software Update Section */}
              <div className="bg-booth-950 border-2 border-booth-700 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-emerald-400 ${
                        checkingUpdate ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      GitHub Update Channel ({isAndroid ? 'Android APK' : 'Windows Setup'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={checkForUpdatesFromGitHub}
                      disabled={checkingUpdate}
                      className="px-2.5 py-1 bg-booth-850 hover:bg-booth-800 border border-booth-600 font-bold text-[11px] text-slate-200"
                    >
                      {checkingUpdate ? 'Checking...' : 'Check Updates'}
                    </button>
                    <a
                      href={GITHUB_UPDATE_REPO}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 font-bold text-[11px] text-emerald-300 flex items-center gap-1"
                    >
                      <span>Repository</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Download Progress Bar (Real-Time in Electron & Android) */}
                {installingUpdate && installProgress && (
                  <div className="p-3 bg-booth-900 border-2 border-amber-500/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>{installProgress.statusText || 'Downloading update...'}</span>
                      </span>
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {installProgress.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-booth-950 border border-amber-500/30 h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-150"
                        style={{ width: `${installProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Banner if Download/Install Fails */}
                {installError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-600/70 text-rose-300 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{installError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadAndInstallUpdate}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Status and Action Buttons */}
                <div className="p-3 bg-booth-900 border border-booth-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] font-mono">
                    <span className="text-slate-300">
                      {updateStatus.message || `Current version: v.${APP_VERSION} (${isAndroid ? 'Android Remote' : 'Windows Studio'})`}
                    </span>
                    <span className="text-slate-400">
                      {isAndroid ? 'Target: FreeWorship-StageController.apk' : 'Target: FreeWorship Studio-Setup.exe'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-booth-800">
                    <button
                      type="button"
                      onClick={handleDownloadAndInstallUpdate}
                      disabled={installingUpdate}
                      className={`px-3.5 py-2 font-black text-xs uppercase flex items-center gap-2 shadow-md shrink-0 transition ${
                        updateStatus.state === 'available'
                          ? 'bg-amber-500 hover:bg-amber-400 text-black animate-pulse'
                          : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      {installingUpdate ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Installing...</span>
                        </>
                      ) : updateStatus.state === 'available' ? (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {isAndroid
                              ? 'Download & Install APK Now'
                              : 'Download & Install Windows Update'}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {isAndroid
                              ? 'Up to Date • Reinstall APK'
                              : 'Up to Date • Reinstall Setup'}
                          </span>
                        </>
                      )}
                    </button>

                    <a
                      href={
                        updateStatus.downloadUrl ||
                        (isAndroid
                          ? GITHUB_RAW_APK_URL
                          : 'https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.1/FreeWorship.Studio-Setup-1.1.1.exe')
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5"
                    >
                      <span>Manual Browser Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CHANGELOG & RELEASE HISTORY */}
          {activeTab === 'changelog' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Release History & Changelog</h4>
                  <p className="text-[11px] text-slate-400">
                    Showing latest changes for Windows Desktop Studio and Android Remote
                  </p>
                </div>
                <a
                  href={`${GITHUB_UPDATE_REPO}/blob/main/CHANGELOG.md`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-sky-300 font-bold text-[10px] flex items-center gap-1"
                >
                  <span>CHANGELOG.md</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {APP_CHANGELOG.map((item) => (
                <div
                  key={item.version}
                  className="bg-booth-950 border-2 border-booth-700 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-booth-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500 text-black font-black text-xs font-mono">
                        v.{item.version}
                      </span>
                      <span className="font-bold text-white text-xs">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{item.date}</span>
                  </div>

                  <ul className="space-y-1.5 pl-2 text-[11px] text-slate-200">
                    {item.highlights.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">•</span>
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with "Do not show again" checkbox */}
        <div className="px-5 py-3 bg-booth-950 border-t-2 border-booth-700 flex items-center justify-between gap-4 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(e) => setDoNotShowAgain(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <span>Do not show again</span>
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow"
          >
            <Check className="w-4 h-4" />
            <span>Continue to FreeWorship</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. DELETE CONFIRMATION DIALOG (Requires agreeing via checkbox before delete)
// ============================================================================
interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  itemNames: string[];
  onConfirmDelete: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  title,
  description,
  itemNames,
  onConfirmDelete,
  onCancel,
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-booth-900 border-2 border-red-500/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-red-950/50 border-b-2 border-red-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-sm text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-booth-850 hover:bg-booth-800 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-200 leading-relaxed">{description}</p>

          {itemNames.length > 0 && (
            <div className="bg-booth-950 border-2 border-booth-700 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1">
              {itemNames.map((name, idx) => (
                <div key={idx} className="text-amber-300 font-semibold truncate">
                  • {name}
                </div>
              ))}
            </div>
          )}

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/30 border-2 border-red-500/40 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded accent-red-500 shrink-0"
            />
            <span className="font-bold text-red-200 leading-snug">
              I agree to permanently delete {itemNames.length > 1 ? `these ${itemNames.length} records` : 'this record'}.
            </span>
          </label>
        </div>

        <div className="px-5 py-3.5 bg-booth-950 border-t-2 border-booth-700 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-700 text-xs font-bold text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!agreed}
            onClick={onConfirmDelete}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-xs flex items-center gap-1.5 shadow-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};
