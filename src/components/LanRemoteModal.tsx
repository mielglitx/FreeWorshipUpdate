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
  const [isApplyingFirewall, setIsApplyingFirewall] = useState(false);
  const [apkNotice, setApkNotice] = useState<string | null>(null);
  const [isSavingApk, setIsSavingApk] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrZoomed, setQrZoomed] = useState<boolean>(false);

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

  useEffect(() => {
    if (!isOpen || !apkDownloadUrl) return;
    let cancelled = false;
    QRCode.toDataURL(apkDownloadUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, apkDownloadUrl]);

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
      <div className="relative w-full max-w-2xl bg-booth-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-booth-950 via-booth-900 to-amber-950/40 border-b border-booth-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base flex items-center gap-2">
                Android 3rd Monitor & Remote Controller
              </h3>
              <p className="text-xs text-slate-400">
                LAN Wi-Fi Bridge • Zero-Latency Bidirectional Live Sync
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
          {/* Quick Get Android APK Installer Banner */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-booth-950 to-amber-950/40 border-2 border-emerald-500/40 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  Download Android APK Installer
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Install <span className="font-mono text-amber-300">FreeWorship-StageController.apk</span> on your Android phone or tablet (3rd Stage Monitor &amp; Remote Controller).
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleGetApk}
                  disabled={isSavingApk}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSavingApk ? 'Saving APK...' : 'Download APK Installer'}</span>
                </button>
                <a
                  href={GITHUB_RAW_APK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-700 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition"
                  title="Download latest release APK from GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub Mirror</span>
                </a>
              </div>
            </div>

            {apkDownloadUrl && (
              <div className="bg-black/60 border border-booth-700 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-300 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR Code on Android to Open APK Download Link:</span>
                  </div>
                  <div className="text-xs font-mono text-sky-300 break-all">
                    {apkDownloadUrl}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Point your Android phone camera or QR scanner at the QR code (same Wi-Fi). Click QR to enlarge.
                  </p>
                </div>
                {qrDataUrl && (
                  <button
                    type="button"
                    onClick={() => setQrZoomed(true)}
                    className="p-1.5 bg-white rounded-xl border-2 border-emerald-400/80 shadow-lg hover:scale-105 transition shrink-0"
                    title="Click to enlarge QR code"
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

            {apkNotice && (
              <p className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30 break-all">
                {apkNotice}
              </p>
            )}
          </div>

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
              How to Connect from Android
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Connect your Android phone or tablet to the <strong className="text-white">same Wi-Fi network</strong> as this laptop.
              </li>
              <li>
                Open the <strong className="text-amber-300">FreeWorship 3rd Monitor</strong> Android app.
              </li>
              <li>
                Tap <strong className="text-emerald-400">Scan PC</strong> — it will auto-discover this laptop within seconds.
              </li>
              <li>
                If scanning does not auto-detect, type <strong className="font-mono text-amber-300">{displayIps[0]}:{lanInfo.port}</strong> into the PC IP box and tap <strong className="text-amber-400">Connect</strong>.
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
                ? 'Windows Firewall already allows TCP ports 5174, 5173 and UDP discovery port 41234. Keep your Wi-Fi profile set to Private Network.'
                : 'If your Android phone cannot connect, verify that Windows has set your Wi-Fi network to Private Network (Windows Settings > Network & Internet > Wi-Fi > Network Profile). Windows blocks incoming connections when the network is set to "Public".'}
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
                  'freeworship_android_preview',
                  'width=1024,height=720'
                );
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Android UI in Browser
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
      {qrZoomed && qrDataUrl && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setQrZoomed(false)}
        >
          <div
            className="bg-booth-900 border-2 border-emerald-400 rounded-2xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Scan to Download Android APK
              </span>
              <button
                type="button"
                onClick={() => setQrZoomed(false)}
                className="p-1 rounded-lg hover:bg-booth-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white p-3 rounded-xl inline-block mx-auto">
              <img
                src={qrDataUrl}
                alt="Android APK Download QR Code"
                className="w-56 h-56 block"
              />
            </div>
            <p className="text-[11px] font-mono text-sky-300 break-all">{apkDownloadUrl}</p>
            <p className="text-[11px] text-slate-400">
              Scan with your Android camera or QR app while connected to the same Wi-Fi network.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
