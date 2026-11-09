# FreeWorship Studio — Changelog

All notable changes to the **FreeWorship Studio** (Windows Desktop Presentation Suite) and **FreeWorship Android Remote** (3rd Monitor & Stage Controller) will be documented in this file.

---

## [1.1.7] — November 9, 2026

### 🚀 Highlights & Major Features
- **Android Cleartext Traffic & Network Security Config**:
  - Added an explicit Android network security configuration (`network_security_config.xml`) permitting cleartext HTTP traffic across local LAN subnets (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`, `localhost`).
  - Added `MIXED_CONTENT_ALWAYS_ALLOW` and content access flags to Android WebView settings in `MainActivity.java`.
  - Added missing Android permissions (`ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `CHANGE_WIFI_MULTICAST_STATE`), completely eliminating Android 9+ system-level silent socket blocking of local HTTP requests.
- **Native Wi-Fi Subnet Detection & Zero-Guesswork Auto-Discovery**:
  - Implemented a native Android network plugin method `getDeviceWifiIp()` that directly inspects hardware network interfaces to extract the device's real local IPv4 address and subnet prefix.
  - Added full support for modern mesh Wi-Fi subnets (including TP-Link Deco `192.168.68.x`), major Philippine ISPs (PLDT `192.168.254.x` / `192.168.1.x`, Globe `192.168.100.x`, Converge `192.168.8.x`), and mobile hotspots.
  - Accelerated subnet scanning with priority octets (100–150 first, then full sweep) and 500ms abort signals, finding host PCs in under 2 seconds.
- **Dual-Port Windows Host & Resilient Host Normalization**:
  - Windows built-in LAN server now listens simultaneously on primary port `5174` and alias port `5173` with universal CORS headers (`*`).
  - Added health/ping endpoints (`/`, `/ping`, `/health`) allowing fast connectivity verification.
  - Hardened URL normalization in `normalizeHostUrl` to cleanly strip protocol prefixes (`http://`, `https://`) and trailing endpoints (`/api/lan-sync`), automatically attaching port `:5174` when omitted.
  - Added real-time connection status feedback on Android ("Connecting...", "Connected!", or actionable diagnostics).
- **Operator Android Remote Header Bar & Windows Firewall Helper**:
  - Added a dedicated "Android Remote" button in the Windows top navigation bar showing the active LAN IP (e.g. `192.168.68.130:5174`) and a green pulsing indicator when devices are connected.
  - Created a dedicated `LanRemoteModal` dialog with 1-click IP copy, connection instructions, and an automated Windows Firewall rule configurator for ports 5174 and 5173.

---

## [1.1.6] — November 9, 2026

### 🚀 Highlights & Major Features
- **MBB 1901 Complete 66-Book Verse Resolution**:
  - Fixed issue where books after 2 Samuel appeared empty due to old uncanonical IndexedDB caches.
  - Added strict canonical English book verification (`isBibleCanonicallyIndexed`) and automatic Tagalog book name resolution (`resolveBookName`), ensuring all 66 books from Genesis through Revelation (Pahayag) display all 31,088 authentic verses.
- **Double-Click Preview to Project Live**:
  - Single-clicking any slide in the Preview Deck now only selects and inspects that verse in the preview panel, preventing accidental changes to sanctuary projection.
  - Double-clicking any preview slide (or pressing the dedicated "Live" / "Go Live" action button) immediately projects that slide to the live screens.
- **Save & Load Schedule from File**:
  - Added prominent **Save Schedule** and **Load Schedule** buttons directly in the Service Schedule header.
  - Allows saving and opening `.fws.json` and standard `.json` schedule files with instant visual confirmation and automatic activation of the first schedule item.

---

## [1.1.5] — November 9, 2026

### 🚀 Highlights & Major Features
- **100% Pre-bundled Offline Bibles (Zero Internet Required)**:
  - All 5 sanctuary standard translations (**KJV**, **NIV**, **NASB**, **ESV**, and **MBB 1901**) are now completely built-in and packaged directly with the application on both Windows Desktop and Android.
  - Eliminated any need to download Bibles over the internet or CDN.
  - All ~155,453 verses across all 330 books load from local storage/assets in milliseconds.
- **Full 66-Book Magandang Balita Bibliya (MBB 1901) Fix**:
  - Resolved missing verses by establishing strict canonical 1-to-1 mapping for all 66 Tagalog book names (*Genesis* through *Pahayag*), allowing instant filtering, chapter navigation, and full-text search.
- **Enhanced Bible Import Parser**:
  - Expanded natural language Tagalog and Spanish book aliases across all 66 books, ensuring any imported external JSON or Zefania/OpenSong XML files map correctly.
- **Sanctuary Offline Indicator**:
  - Cleaned up Bible management header to display a permanent green **Built-in Offline** status badge.

---

## [1.1.4] — November 9, 2026

### 🚀 Highlights & Major Features
- **Ad-hoc Live Projection on Double Click**:
  - Double-clicking any song card in the Songs library or any scripture verse in the Bible list immediately projects it directly to the Live View and Sanctuary display output.
  - Does **not** alter, modify, or add items to the Service Schedule. Service Schedule Run-of-Show remains strictly user-controlled via the `+ Schedule` button or drag-and-drop.
- **Side-by-Side Dual View (Preview & Live Deck)**:
  - Center panel header now offers a persistent 3-mode switcher:
    - **`[🔴 Live View]`**: Shows full-width Live Service controls and active slide deck.
    - **`[👁️ Preview]`**: Shows full-width Song Preview inspection deck.
    - **`[◫ Side-by-Side]`**: Splits the workspace into two independent responsive columns with the **Preview Deck** on the left and the **Live Deck** on the right.
  - Operators can view and control both live output and upcoming songs simultaneously.
- **Instant Live Projection on Preview Slide Click**:
  - Clicking any slide or section jump pill (e.g. *Verse 2*, *Chorus*) in the Preview Deck immediately loads that song's full slides to Live and focuses directly on the selected slide with `ON AIR` status.
- **Media Background Defaults for Songs and Bible Verses**:
  - Added right-click context menu options in the Media tab:
    - `Use as Background for Songs`: Automatically sets default motion/still background for all songs.
    - `Use as Background for Bible Verses`: Sets default background for scripture readings.
    - `Use as Background for Songs & Bible`: Sets both in a single click.
    - `Set as Default Sanctuary Logo ([L])`: Sets the default pre-service / blackout loop.
- **Custom Ministry / Church Logo Upload in Themes**:
  - In the Themes tab under **`Sanctuary Logo & Splash Screen ([L] Key)`**, users can now upload their own custom church logo file (PNG, JPG, SVG, WEBP with full transparency support).
  - Features real-time thumbnail preview, `Change Logo`, and `Remove` controls.
  - Renders at maximum resolution during sanctuary blackout, pre-service announcements, or whenever the `[L]` key is pressed.

---

## [1.1.3] — November 9, 2026

### 🚀 Highlights & Major Features
- **Dedicated Song Preview Workspace**:
  - Center Panel now features a dual workspace switcher: **[🔴 Live Service]** and **[👁️ Song Preview]**.
  - Clicking any song in the library instantly selects it into the preview workspace, allowing operators to inspect all stanzas, choruses, and chord notations without interrupting the live sanctuary projection.
  - Includes dedicated preview section jump buttons (e.g. *Verse 1*, *Chorus*, *Verse 2*) to instantly jump to any part of the song in preview.
  - 1-click **"Go Live Now"** and **"Take Live to Projector"** buttons immediately project the selected previewed verse onto all live outputs.
- **Slide Deck Grid & List View Toggle**:
  - Added an instant **View: [Grid | List]** toggle persistent across sessions.
  - **List View** renders slides as full-width vertical stacked cards, displaying verse tags, live/next/preview badges, lyrics lines, and chords side-by-side for rapid verse scanning during live worship.
- **Triple-Layer User Song Data Retention Across Updates**:
  - Created persistent multi-tier backup system writing all user-created and customized songs across **LocalStorage**, **IndexedDB**, and persistent Electron disk storage (`%APPDATA%\freeworship\user_library_songs.json`).
  - Implemented non-destructive merging (`mergeSongsWithDefaults`), guaranteeing 100% data retention of all user songs across any future app update or installer run.
- **Alphabetical Song Library Sorting**:
  - Songs library list is now automatically sorted from A to Z by title (`localeCompare`).
- **20 Classic Hymns Added**:
  - Integrated complete stanzas, choruses, and chord progressions for:
    1. *Love Lifted Me*
    2. *In The Garden*
    3. *He Lives*
    4. *At the cross*
    5. *At Calvary*
    6. *Because He Lives*
    7. *Beulah Land*
    8. *I stand amaze*
    9. *Now I belong to Jesus*
    10. *Standing on the promises*
    11. *Showers of Blessings*
    12. *Bringing in the sheaves*
    13. *Blessed assurance*
    14. *Draw me nearer*
    15. *Great is thy faithfulness*
    16. *There is power in the blood*
    17. *Leaning on the everlasting arms*
    18. *I'll fly away*
    19. *Mansion over the hilltop*
    20. *when we all get to heaven*
- **Dynamic Dual Confidence Monitor**:
  - Bottom right monitor seamlessly toggles between **CUED NEXT** (in Live Service mode) and **SONG PREVIEW** (in Song Preview mode) with full interactive preview stage rendering and 1-click Take Live overlay.

---

## [1.1.2] — November 9, 2026

### 🚀 Highlights & Major Features
- **Schedule Item Deletion & Clear All**:
  - Fixed issue where the user could not delete the last remaining item in the schedule (`schedule.length <= 1`).
  - Added a **"Clear All"** button in the Service Schedule header with a checkbox agreement confirmation dialog to safely wipe the Run-of-Show when needed.
  - Added right-click context menu options on schedule items: `Project Live Now`, `Remove from Schedule`, and `Clear Entire Schedule...`.
  - Android Stage Controller users can now remove individual items and clear the whole schedule remotely via LAN.
  - Added graceful empty states and zero-latency broadcast reflow across all connected screens when the schedule has 0 items.
- **Built-in 5 Bible Translations**: Added full built-in support for **KJV** (King James Version), **NIV** (New International Version), **NASB** (New American Standard Bible), **MBB 1901** (Magandang Balita Bibliya 1901 / Ang Biblia 1901 Tagalog), and **ESV** (English Standard Version). Every translation has pre-seeded core sanctuary verses and a 1-click installer to download and permanently store all 31,102 verses offline into IndexedDB.
- **9 Classic Built-in Hymns Added**: Added the requested classic hymns with complete stanzas, choruses, and chord notations:
  1. *To God Be The Glory*
  2. *Wonderful Grace of Jesus*
  3. *The Battle Hymn of Republic*
  4. *Love Lifted Me*
  5. *Stand up, Stand up for Jesus*
  6. *Holy, Holy, Holy*
  7. *The Banner of The Cross*
  8. *The Fight is On*
  9. *Victory in Jesus*
  Existing local storage databases automatically merge missing default hymns on launch without overwriting customized libraries.
- **Universal Bible Importer Round-Trip Fix**: Fixed issue where re-importing FreeWorship-exported Bible files (`.fwx.json`) threw "No valid verses found in file". The importer now flawlessly extracts `format: "freeworship-backup-v1"` bundles, `bibles` dictionaries, multi-translation archives, nested book/chapter maps, and flat verse arrays.
- **Removed WEB Scripture Selection**: Removed `WEB` from translation selectors and standardized church sanctuary operations on KJV, NIV, NASB, ESV, and MBB 1901.
- **Android Remote Translation Switcher**: Operators on the Android Stage Controller can now choose which translation (`KJV`, `NIV`, `NASB`, `ESV`, or `MBB 1901`) to push when scheduling or projecting scripture live.

---

## [1.1.1] — November 8, 2026

### 🚀 Highlights & Major Features
- **In-App Windows Updater**: Seamlessly downloads the setup executable directly from GitHub inside the desktop app with real-time percentage and byte progress, automatically launches the installer detached, and cleanly restarts FreeWorship Studio.
- **In-App Android APK Installer**: Built a native Capacitor plugin (`ApkUpdater`) that downloads the latest APK to application cache and directly invokes Android's native package installer (`application/vnd.android.package-archive` via `FileProvider` and `REQUEST_INSTALL_PACKAGES`) with zero manual browsing.
- **Universal Bible Importer**: Full round-trip support for exported FreeWorship Bible JSON files (`format: 'freeworship-backup-v1'`), multi-translation bundles, and direct `{ "KJV": [...] }` maps. Single and multi-translation files are safely installed to offline IndexedDB storage.
- **Universal Song Importer**: Hardened song file parser to accept FreeWorship Song JSON exports, raw song arrays (with or without `musicalKey`), single-song JSON files, OpenLyrics XML, OpenSong XML, ChordPro, and plain text. Added user notification alerts when songs are imported.
- **Direct GitHub Update Channel**: Added permanent direct download and install buttons on the About dialog for `FreeWorship-StageController.apk` (Android) and Windows installers so operators can re-download or update at any time.
- **Automatic Background Update Checking**: Checks for new releases upon opening the About dialog.

---

## [1.1.0] — November 8, 2026

### 🚀 Highlights & Major Features
- **Platform-Aware GitHub Updater**: Both the Windows app (`.exe`) and Android app (`.apk`) can now check for updates directly from [FreeWorshipUpdate](https://github.com/mielglitx/FreeWorshipUpdate). The apps automatically distinguish which release package is designated for their respective platform.
- **In-App Changelog & Release Notes**: Integrated a dedicated Changelog viewer on the About page for both Windows and Android, making release history easily readable inside the app.
- **Android Remote Song & Scripture Scheduling**: Operators using the Android app can now search the song library or input any Scripture reference (e.g. `John 3:16`, `Psalms 23:1-6`) and either push it directly to the live projector or add it to the active Windows service schedule.
- **WebRTC Local Subnet Discovery for Android**: Resolved Wi-Fi connection issues by detecting local Wi-Fi subnet candidates via WebRTC ICE host candidates and conducting a sweep across all common church/home router IP ranges (`192.168.1.x`, `192.168.0.x`, `192.168.254.x`, `192.168.100.x`, `192.168.8.x`, `10.0.0.x`, mobile hotspots) on both port 5174 (packaged Windows server) and port 5173.
- **4 Simplified UI Color Themes**: Added instant UI theme switching between **Light**, **Gray**, **Dark Gray**, and **Dark** interface styles for optimal contrast in bright or dim lighting environments.
- **Sharp Modern Geometry**: Replaced rounded corners with crisp `0px` sharp borders across all buttons, panels, cards, inputs, and modals.
- **Scripture Engine Refinements**:
  - Renamed the navigation tab from `Bible 66` to `Bible`.
  - Removed `WEB` translation from default selection; initialized `KJV` as the default offline 66-book translation with support for custom offline Bible imports.
- **Permanent Delete Safeguards**: Added a mandatory confirmation dialog with an agreement checkbox required before permanently deleting Songs, Media, or Audio Tracks.
- **Default Sanctuary Logo**: Users can choose any media asset from the Media Pool to act as the primary church logo when triggering Logo Panic mode (`[L]`).
- **Persistent Stage Monitor OFF State**: If the 3rd monitor (Stage Monitor) is turned off by the operator, this preference is saved to persistent storage and remembered across app restarts.
- **Multi-Select, Context Menu & Drag-and-Drop**:
  - `Ctrl + Click` to select individual items; `Shift + Click` to select ranges of items.
  - Right-click context menus with `Add to Schedule`, `Project Live`, `Set as Default Logo`, and `Delete`.
  - Native Drag-and-Drop from Songs, Bible Verses, and Media directly into the Service Schedule.
- **Complete Import/Export Studio**: Full JSON & XML data backup and restore capabilities for songs, bibles, schedules, and display settings.
- **Universal Bible Importer Fix**: Resolved import issues when re-importing exported FreeWorship Bible files (`.fwx.json`), backup bundles with `bibles` dictionaries, multi-translation packages, or direct `{ "KJV": [...] }` maps. Both single and multi-translation files are parsed and saved to offline IndexedDB storage.

---

## [1.0.0] — November 8, 2026

### 🌟 Initial Release
- **Zero-Latency Multi-Monitor Broadcast**: Simultaneous borderless fullscreen display for House Projectors / LED Walls (Screen 2) and Stage Confidence Monitors (Screen 3).
- **Emergency Panic Controls**: Rapid keyboard overrides for Blackout (`[B]`), Logo Mode (`[L]`), Clear Text (`[C]`), and Restore (`[Esc]`).
- **Cathedral Ambient Worship Pad Synth**: Real-time 12-key ambient audio synthesizer with smooth 2.2-second crossfades and song-key auto-follow.
- **Multi-Track Backing Audio Deck**: Integrated audio player with 3-second booth fade out for smooth service transitions.
- **Typography & Boundary Designer**: Interactive 16:9 canvas with draggable boundary boxes, auto-shrink text fitting, and lower-third band overlays.
- **Offline Scripture Engine**: Offline KJV Bible database with chapter and verse jump navigation.
- **Service Schedule Timeline**: Complete Run-of-Show planner with reordering, quick slides, and section jump tags (`Verse`, `Chorus`, `Bridge`, `Tag`).

---
*Distributed freely for the glorification of God.*
*Author: Amiel Yalung*
