import React, { useEffect, useState } from 'react';
import { Activity, Volume2, VolumeX } from 'lucide-react';

interface StageBpmPulseProps {
  bpm?: number;
  compact?: boolean;
}

export const StageBpmPulse: React.FC<StageBpmPulseProps> = ({ bpm, compact = false }) => {
  const [beatIndex, setBeatIndex] = useState(0);
  const [clickEnabled, setClickEnabled] = useState(false);

  const validBpm = bpm && bpm >= 30 && bpm <= 240 ? Math.round(bpm) : 0;

  useEffect(() => {
    if (!validBpm) return;
    const intervalMs = Math.round(60000 / validBpm);
    let audioCtx: AudioContext | null = null;

    const triggerTick = (isDownbeat: boolean) => {
      if (!clickEnabled) return;
      try {
        if (!audioCtx) {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isDownbeat ? 1100 : 760, now);
        gain.gain.setValueAtTime(isDownbeat ? 0.14 : 0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch {}
    };

    const timer = window.setInterval(() => {
      setBeatIndex((prev) => {
        const next = (prev + 1) % 4;
        triggerTick(next === 0);
        return next;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [validBpm, clickEnabled]);

  if (!validBpm) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/90 ${
        compact ? 'px-2 py-1' : 'px-3 py-1.5'
      }`}
    >
      <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="font-mono font-black text-xs text-emerald-300">{validBpm} BPM</span>
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((idx) => {
          const active = beatIndex === idx;
          const isDownbeat = idx === 0;
          return (
            <span
              key={idx}
              className={`rounded-full transition-transform duration-75 ${
                compact ? 'w-2 h-2' : 'w-2.5 h-2.5'
              } ${
                active
                  ? isDownbeat
                    ? 'bg-amber-400 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                    : 'bg-emerald-400 scale-110 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : 'bg-neutral-700'
              }`}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setClickEnabled((c) => !c)}
        className={`p-1 rounded border text-[10px] transition ${
          clickEnabled
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
        }`}
        title={clickEnabled ? 'Mute stage metronome click' : 'Enable audible stage click'}
      >
        {clickEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
      </button>
    </div>
  );
};
