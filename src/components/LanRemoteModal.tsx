import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import { fetchLocalLanServerInfo, LanServerInfo } from '../services/liveSyncBus';

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
  const [firewallNotice, setFirewallNotice] = useState<string | null>(null);
  const [isApplyingFirewall, setIsApplyingFirewall] = useState(false);

  const loadLanInfo = async () => {
    setIsRefreshing(true);
    try {
      const info = await fetchLocalLanServerInfo();
      setLanInfo(info);
    } catch {}
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLanInfo();
      const interval = window.setInterval(loadLanInfo, 3000);
      return () => window.clearInterval(interval);
    }
  }, [isOpen]);

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
          setFirewallNotice('Windows Firewall rule added successfully for port 5174 and 5173!');
        } else {
          setFirewallNotice(
            res.error || 'Could not add rule automatically. Please ensure Windows network profile is set to Private.'
          );
        }
      } else {
        setFirewallNotice('Available when running inside the FreeWorship Windows Desktop application.');
      }
    } catch (e: any) {
      setFirewallNotice(e?.message || 'Failed to configure firewall.');
    } finally {
      setIsApplyingFirewall(false);
    }
  };

  const validIps = lanInfo.ips.filter((ip) => ip !== '127.0.0.1' && ip !== 'Detecting...');
  const displayIps = validIps.length > 0 ? validIps : lanInfo.ips;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-booth-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-booth-950 via-booth-900 to-amber-950/40 border-b border-booth-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
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
        <div className="p-5 space-y-4 overflow-y-auto">
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
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Windows Firewall & Network Profile Check
              </span>
              <button
                onClick={handleApplyFirewall}
                disabled={isApplyingFirewall}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
              >
                {isApplyingFirewall ? 'Configuring...' : 'Allow Port in Windows Firewall'}
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If your Android phone cannot connect, verify that Windows has set your Wi-Fi network to <strong className="text-white">Private Network</strong> (Windows Settings &gt; Network &amp; Internet &gt; Wi-Fi &gt; Network Profile). Windows blocks incoming connections when the network is set to &quot;Public&quot;.
            </p>
            {firewallNotice && (
              <p className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                {firewallNotice}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-booth-950 border-t border-booth-800 flex items-center justify-between">
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
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-booth-800 hover:bg-booth-700 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
