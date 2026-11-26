import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import {
  downloadOrSaveAndroidApk,
  fetchLocalLanServerInfo,
  LanServerInfo,
} from '../services/liveSyncBus';
import { GITHUB_RAW_APK_URL } from './SystemModals';

interface LanRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanRemoteModal: React.FC<LanRemoteModalProps> = ({ isOpen, onClose }) => {
  const [lanInfo, setLanInfo] = useState<LanServerInfo>({
    ips: ['Detecting...'],
    port: 5174,
    connectedClients: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [firewallNotice, setFirewallNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [isFirewallAllowed, setIsFirewallAllowed] = useState<boolean>(false);
  const [firewallChecked, setFirewallChecked] = useState<boolean>(false);
  const [isApplyingFirewall, setIsApplyingFirewall] = useState(false);
  const [apkNotice, setApkNotice] = useState<string | null>(null);
  const [isSavingApk, setIsSavingApk] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [appleQrDataUrl, setAppleQrDataUrl] = useState<string>('');
  const [qrZoomedMode, setQrZoomedMode] = useState<'android' | 'apple' | null>(null);

  const handleGetApk = async () => {
    setIsSavingApk(true);
    setApkNotice(null);
    try {
      const res = await downloadOrSaveAndroidApk();
      if (res.ok) {
        setApkNotice(
          res.path
            ? `Saved APK to: ${res.path}`
            : 'Downloading FreeWorship-StageController.apk...'
        );
      } else if (!res.canceled) {
        setApkNotice(res.error || 'Could not export APK file.');
      }
    } finally {
      setIsSavingApk(false);
    }
  };

  const loadLanInfo = async () => {
    setIsRefreshing(true);
    try {
      const info = await fetchLocalLanServerInfo();
      setLanInfo(info);
    } catch {}
    setIsRefreshing(false);
  };

  const checkFirewallStatus = async () => {
    try {
      if (typeof window !== 'undefined' && window.freeworshipDesktop?.checkFirewallRule) {
        const res = await window.freeworshipDesktop.checkFirewallRule();
        setIsFirewallAllowed(Boolean(res?.allowed));
        setFirewallChecked(true);
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      loadLanInfo();
      checkFirewallStatus();
      const interval = window.setInterval(loadLanInfo, 3000);
      return () => window.clearInterval(interval);
    }
  }, [isOpen]);

  const validIps = lanInfo.ips.filter((ip) => ip !== '127.0.0.1' && ip !== 'Detecting...');
  const displayIps = validIps.length > 0 ? validIps : lanInfo.ips;
  const apkDownloadUrl =
    validIps.length > 0
      ? `http://${validIps[0]}:${lanInfo.port}/FreeWorship-StageController.apk`
      : GITHUB_RAW_APK_URL;
  const appleWebRemoteUrl =
    validIps.length > 0
      ? `http://${validIps[0]}:${lanInfo.port}/remote`
      : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174'}/?view=android`;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const qrOptions = {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M' as const,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    };
    if (apkDownloadUrl) {
      QRCode.toDataURL(apkDownloadUrl, qrOptions)
        .then((url) => {
          if (!cancelled) setQrDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setQrDataUrl('');
        });
    }
    if (appleWebRemoteUrl) {
      QRCode.toDataURL(appleWebRemoteUrl, qrOptions)
        .then((url) => {
          if (!cancelled) setAppleQrDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setAppleQrDataUrl('');
        });
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, apkDownloadUrl, appleWebRemoteUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIp(text);
      setTimeout(() => setCopiedIp(null), 2500);
    } catch {}
  };

  const handleApplyFirewall = async () => {
    setIsApplyingFirewall(true);
    setFirewallNotice(null);
    try {
      if (typeof window !== 'undefined' && window.freeworshipDesktop?.setupFirewallRule) {
        const res = await window.freeworshipDesktop.setupFirewallRule();
        if (res.ok) {
          setIsFirewallAllowed(true);
          setFirewallNotice({
            ok: true,
            text:
              res.message ||
              'Windows Firewall rules added successfully for ports 5174, 5173 & UDP 41234!',
          });
        } else {
          setFirewallNotice({
            ok: false,
            text:
              res.error ||
              'Could not add rule automatically. Please run Windows Firewall as Administrator to allow TCP 5174/5173 and UDP 41234.',
          });
        }
      } else {
        setFirewallNotice({
          ok: false,
          text: 'Available when running inside the FreeWorship Windows Desktop application.',
        });
      }
    } catch (e: any) {
      setFirewallNotice({
        ok: false,
        text: e?.message || 'Failed to configure firewall.',
      });
    } finally {
      setIsApplyingFirewall(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-booth-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-booth-950 via-booth-900 to-amber-950/40 border-b border-booth-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base flex items-center gap-2">
                Mobile &amp; Browser 3rd Monitor Remote
              </h3>
              <p className="text-xs text-slate-400">
                Android APK &amp; Apple iPhone / iPad Safari Web Server • LAN Wi-Fi Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-booth-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {/* Proactive Firewall Permission Prompt when not yet allowed */}
          {firewallChecked && !isFirewallAllowed && (
            <div className="bg-amber-950/45 border-2 border-amber-500/60 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Permission Needed: Allow Local Web Server in Windows Firewall</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">
                  Before scanning on iPhone Safari or Android, grant Windows Administrator permission to allow FreeWorship&apos;s local web server (ports 5174, 5173 &amp; UDP 41234).
                </p>
              </div>
              <button
                type="button"
                onClick={handleApplyFirewall}
                disabled={isApplyingFirewall}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition shrink-0 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isApplyingFirewall ? 'Requesting Admin...' : 'Allow Firewall Access (Admin)'}</span>
              </button>
            </div>
          )}

          {/* Dual QR Access Cards: Apple / Browser Remote + Android APK Installer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Apple / Web Browser Remote QR Card */}
            <div className="bg-gradient-to-br from-sky-950/60 via-booth-950 to-indigo-950/40 border-2 border-sky-500/45 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  Apple iPhone / iPad &amp; Web Remote
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  No app install needed. Scan with iPhone/iPad Camera to control FreeWorship &amp; view the 3rd Monitor in Safari or any browser.
                </p>
              </div>

              <div className="bg-black/60 border border-booth-700 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-sky-300">
                    Local Web Server URL:
                  </div>
                  <div className="text-[11px] font-mono text-sky-200 break-all">
                    {appleWebRemoteUrl}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(appleWebRemoteUrl)}
                      className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition"
                    >
                      {copiedIp === appleWebRemoteUrl ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(
                          appleWebRemoteUrl,
                          'freeworship_web_remote',
                          'width=1024,height=720'
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-booth-850 hover:bg-booth-800 border border-booth-700 text-sky-300 font-bold text-[10px] flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                  </div>
                </div>
                {appleQrDataUrl && (
                  <button
                    type="button"
                    onClick={() => setQrZoomedMode('apple')}
                    className="p-1.5 bg-white rounded-xl border-2 border-sky-400/80 shadow-lg hover:scale-105 transition shrink-0"
                    title="Click to enlarge Apple / Browser Remote QR code"
                  >
                    <img
                      src={appleQrDataUrl}
                      alt="Scan QR for Apple / Web Browser Remote"
                      className="w-20 h-20 block"
                    />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                First time on Apple Safari / Chrome? Tap <strong className="text-amber-300">Allow</strong> if asked for <strong className="text-slate-200">Local Network</strong> permission. Tap <strong className="text-slate-200">Share &gt; Add to Home Screen</strong> for app mode.
              </p>
            </div>

            {/* Android APK Installer Card */}
            <div className="bg-gradient-to-br from-emerald-950/60 via-booth-950 to-amber-950/35 border-2 border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  Android APK Installer
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Install <span className="font-mono text-amber-300">FreeWorship-StageController.apk</span> on your Android phone or tablet (native auto-discovery).
                </p>
              </div>

              {apkDownloadUrl && (
                <div className="bg-black/60 border border-booth-700 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-emerald-300 flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      <span>Scan to Download .APK:</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-200 break-all">
                      {apkDownloadUrl}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Click QR to enlarge (same Wi-Fi).
                    </p>
                  </div>
                  {qrDataUrl && (
                    <button
                      type="button"
                      onClick={() => setQrZoomedMode('android')}
                      className="p-1.5 bg-white rounded-xl border-2 border-emerald-400/80 shadow-lg hover:scale-105 transition shrink-0"
                      title="Click to enlarge Android APK QR code"
                    >
                      <img
                        src={qrDataUrl}
                        alt="Scan QR to Download Android APK"
                        className="w-20 h-20 block"
                      />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleGetApk}
                  disabled={isSavingApk}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isSavingApk ? 'Saving APK...' : 'Download APK'}</span>
                </button>
                <a
                  href={GITHUB_RAW_APK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-booth-850 hover:bg-booth-800 border border-booth-700 text-sky-300 font-bold text-[11px] flex items-center gap-1 transition"
                  title="Download latest release APK from GitHub"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>GitHub Mirror</span>
                </a>
              </div>
            </div>
          </div>

          {apkNotice && (
            <p className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30 break-all">
              {apkNotice}
            </p>
          )}

          {/* Server IP Address Banner */}
          <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                This PC&apos;s Local Wi-Fi Address
              </span>
              <button
                onClick={loadLanInfo}
                disabled={isRefreshing}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {displayIps.map((ip) => {
                const targetText = `${ip}:${lanInfo.port}`;
                const isCopied = copiedIp === targetText;
                return (
                  <div
                    key={ip}
                    className="flex items-center justify-between bg-black/70 border border-amber-500/40 rounded-xl px-4 py-2.5 font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-base font-black text-amber-300 tracking-wide">
                        {targetText}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(targetText)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-900" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy IP
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              LAN Port: <span className="font-mono text-amber-400">{lanInfo.port}</span> (alias on 5173). Connected devices: <span className="font-bold text-emerald-400">{lanInfo.connectedClients}</span>
            </p>
          </div>

          {/* Step-by-Step Connection Instructions */}
          <div className="bg-booth-950/70 border border-booth-800 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              How to Connect from Apple / Web Browser or Android
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Connect your iPhone, iPad, Mac, or Android device to the <strong className="text-white">same Wi-Fi network</strong> as this PC.
              </li>
              <li>
                <strong className="text-sky-300">Apple / Web Browser Users:</strong> Open Camera and scan the <strong className="text-sky-300">Apple / Web Remote QR</strong> (or visit <strong className="font-mono text-sky-300">{appleWebRemoteUrl}</strong>) to launch the live controller &amp; stage view directly in Safari or Chrome.
              </li>
              <li>
                <strong className="text-emerald-300">Android App Users:</strong> Open <strong className="text-amber-300">FreeWorship 3rd Monitor</strong> and tap <strong className="text-emerald-400">Scan PC</strong> (or type <strong className="font-mono text-amber-300">{displayIps[0]}:{lanInfo.port}</strong>).
              </li>
            </ol>
          </div>

          {/* Windows Firewall & Network Notice */}
          <div
            className={`rounded-xl p-4 space-y-2.5 border transition ${
              isFirewallAllowed
                ? 'bg-emerald-950/25 border-emerald-500/50'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  isFirewallAllowed ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                <ShieldCheck
                  className={`w-4 h-4 ${
                    isFirewallAllowed ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <span>Windows Firewall &amp; Network Profile Check</span>
                {isFirewallAllowed && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black uppercase">
                    Already Allowed
                  </span>
                )}
              </span>
              <button
                onClick={handleApplyFirewall}
                disabled={isApplyingFirewall}
                title={
                  isFirewallAllowed
                    ? 'Ports 5174, 5173 & UDP 41234 are already allowed (click to re-apply)'
                    : 'Add Windows Firewall inbound rules for Android 3rd Monitor'
                }
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 ${
                  isFirewallAllowed
                    ? 'bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/60 text-emerald-300'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {isFirewallAllowed && !isApplyingFirewall && <Check className="w-3.5 h-3.5" />}
                <span>
                  {isApplyingFirewall
                    ? 'Configuring...'
                    : isFirewallAllowed
                    ? 'Already Allowed'
                    : 'Allow Port in Windows Firewall'}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isFirewallAllowed
                ? 'Windows Firewall already allows TCP ports 5174, 5173, UDP discovery 41234, and the FreeWorship host app. Keep your Wi-Fi profile set to Private Network.'
                : 'If Apple Safari or Android cannot connect, click "Allow Port in Windows Firewall" and verify Windows Wi-Fi is set to Private Network (Windows Settings > Network & Internet > Wi-Fi > Network Profile).'}
            </p>
            {firewallNotice && (
              <p
                className={`text-[11px] font-bold p-2.5 rounded-lg border ${
                  firewallNotice.ok
                    ? 'text-emerald-300 bg-emerald-950/50 border-emerald-500/40'
                    : 'text-rose-200 bg-rose-950/50 border-rose-500/40'
                }`}
              >
                {firewallNotice.text}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-booth-950 border-t border-booth-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleGetApk}
              disabled={isSavingApk}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isSavingApk ? 'Saving...' : 'Download APK Installer'}</span>
            </button>
            <button
              onClick={() => {
                window.open(
                  `${window.location.origin}${window.location.pathname}?view=android`,
                  'freeworship_web_remote_preview',
                  'width=1024,height=720'
                );
              }}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Mobile / Browser UI
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-booth-800 hover:bg-booth-700 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Enlarged QR Code Lightbox Overlay */}
      {qrZoomedMode && (qrZoomedMode === 'apple' ? appleQrDataUrl : qrDataUrl) && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setQrZoomedMode(null)}
        >
          <div
            className={`bg-booth-900 border-2 ${
              qrZoomedMode === 'apple' ? 'border-sky-400' : 'border-emerald-400'
            } rounded-2xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  qrZoomedMode === 'apple' ? 'text-sky-300' : 'text-emerald-300'
                }`}
              >
                {qrZoomedMode === 'apple'
                  ? 'Scan for Apple / Browser Remote'
                  : 'Scan to Download Android APK'}
              </span>
              <button
                type="button"
                onClick={() => setQrZoomedMode(null)}
                className="p-1 rounded-lg hover:bg-booth-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white p-3 rounded-xl inline-block mx-auto">
              <img
                src={qrZoomedMode === 'apple' ? appleQrDataUrl : qrDataUrl}
                alt={
                  qrZoomedMode === 'apple'
                    ? 'Apple Web Browser Remote QR Code'
                    : 'Android APK Download QR Code'
                }
                className="w-56 h-56 block"
              />
            </div>
            <p className="text-[11px] font-mono text-sky-300 break-all">
              {qrZoomedMode === 'apple' ? appleWebRemoteUrl : apkDownloadUrl}
            </p>
            <p className="text-[11px] text-slate-400">
              {qrZoomedMode === 'apple'
                ? 'Point your iPhone, iPad, or Mac camera to open the live remote controller in Safari (same Wi-Fi).'
                : 'Scan with your Android camera or QR app while connected to the same Wi-Fi network.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
