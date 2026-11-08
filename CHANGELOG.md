# FreeWorship Studio — Changelog

All notable changes to the **FreeWorship Studio** (Windows Desktop Presentation Suite) and **FreeWorship Android Remote** (3rd Monitor & Stage Controller) will be documented in this file.

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
