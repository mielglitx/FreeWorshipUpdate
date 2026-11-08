// Web Audio API Cathedral Ambient Worship Pad Synthesizer
// Produces a warm, detuned multi-oscillator drone pad in any of the 12 musical keys
// with smooth 2.2-second crossfades for seamless prayer, scripture, and song transitions.

export const MUSICAL_KEYS = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export type MusicalKeyName = (typeof MUSICAL_KEYS)[number];

const KEY_BASE_FREQ: Record<string, number> = {
  C: 130.81,
  'C#': 138.59,
  Db: 138.59,
  D: 146.83,
  'D#': 155.56,
  Eb: 155.56,
  E: 164.81,
  F: 174.61,
  'F#': 185.0,
  Gb: 185.0,
  G: 196.0,
  'G#': 207.65,
  Ab: 207.65,
  A: 110.0,
  'A#': 116.54,
  Bb: 116.54,
  B: 123.47,
};

interface ActiveVoiceGroup {
  masterGain: GainNode;
  filterNode: BiquadFilterNode;
  oscillators: OscillatorNode[];
}

class WorshipPadSynthesizer {
  private ctx: AudioContext | null = null;
  private currentGroup: ActiveVoiceGroup | null = null;
  private activeKey: string | null = null;
  private volume = 0.65;
  private shimmerBrightness = 0.5; // 0 = warm prayer low-pass, 1 = bright cathedral shimmer

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public normalizeKey(rawKey: string): MusicalKeyName {
    const clean = rawKey.trim().replace(/m(in|aj)?$/i, '');
    const map: Record<string, MusicalKeyName> = {
      'C#': 'Db',
      'D#': 'Eb',
      'F#': 'Gb',
      'G#': 'Ab',
      'A#': 'Bb',
    };
    const mapped = map[clean] || clean;
    if ((MUSICAL_KEYS as readonly string[]).includes(mapped)) {
      return mapped as MusicalKeyName;
    }
    return 'C';
  }

  public startOrSwitchKey(rawKey: string): void {
    const key = this.normalizeKey(rawKey);
    if (this.activeKey === key && this.currentGroup) {
      return;
    }

    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Crossfade out previous voice group smoothly over 2.0 seconds
    if (this.currentGroup) {
      const prev = this.currentGroup;
      try {
        prev.masterGain.gain.cancelScheduledValues(now);
        prev.masterGain.gain.setValueAtTime(prev.masterGain.gain.value, now);
        prev.masterGain.gain.linearRampToValueAtTime(0.0001, now + 2.0);
        setTimeout(() => {
          prev.oscillators.forEach((osc) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {}
          });
          try {
            prev.masterGain.disconnect();
          } catch {}
        }, 2200);
      } catch {}
    }

    const rootFreq = KEY_BASE_FREQ[key] || 130.81;

    // Harmonic intervals: Sub-Octave (0.5x), Root (1x), Perfect Fifth (1.498x), Octave (2x), Major 3rd Shimmer (2.52x), Octave Fifth (2.996x)
    const harmonicRatios = [
      { ratio: 0.5, detune: -4, type: 'sine' as OscillatorType, gain: 0.35 },
      { ratio: 1.0, detune: -8, type: 'sawtooth' as OscillatorType, gain: 0.22 },
      { ratio: 1.0, detune: +8, type: 'triangle' as OscillatorType, gain: 0.24 },
      { ratio: 1.4983, detune: -6, type: 'sawtooth' as OscillatorType, gain: 0.18 },
      { ratio: 1.4983, detune: +7, type: 'triangle' as OscillatorType, gain: 0.18 },
      { ratio: 2.0, detune: -10, type: 'sine' as OscillatorType, gain: 0.16 },
      { ratio: 2.5198, detune: +9, type: 'sine' as OscillatorType, gain: 0.08 },
      { ratio: 2.9966, detune: +5, type: 'sine' as OscillatorType, gain: 0.09 },
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(this.volume * 0.45, now + 2.2);

    // Warm low-pass filter with gentle LFO breathing
    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    const baseCutoff = 280 + this.shimmerBrightness * 950;
    filterNode.frequency.setValueAtTime(baseCutoff, now);
    filterNode.Q.setValueAtTime(1.2, now);

    // Slow LFO modulating the filter cutoff for organic pad motion
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.14, now); // 7-second breathing cycle
    lfoGain.gain.setValueAtTime(140, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filterNode.frequency);
    lfo.start(now);

    filterNode.connect(masterGain);
    masterGain.connect(ctx.destination);

    const oscillators: OscillatorNode[] = [lfo];

    for (const h of harmonicRatios) {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      osc.type = h.type;
      osc.frequency.setValueAtTime(rootFreq * h.ratio, now);
      osc.detune.setValueAtTime(h.detune, now);
      voiceGain.gain.setValueAtTime(h.gain, now);

      osc.connect(voiceGain);
      voiceGain.connect(filterNode);
      osc.start(now);
      oscillators.push(osc);
    }

    this.currentGroup = {
      masterGain,
      filterNode,
      oscillators,
    };
    this.activeKey = key;
  }

  public stopWithFade(fadeSeconds = 2.0): void {
    if (!this.currentGroup || !this.ctx) {
      this.activeKey = null;
      return;
    }
    const now = this.ctx.currentTime;
    const group = this.currentGroup;
    this.currentGroup = null;
    this.activeKey = null;

    try {
      group.masterGain.gain.cancelScheduledValues(now);
      group.masterGain.gain.setValueAtTime(group.masterGain.gain.value, now);
      group.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);
      setTimeout(() => {
        group.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        try {
          group.masterGain.disconnect();
        } catch {}
      }, fadeSeconds * 1000 + 150);
    } catch {}
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.currentGroup && this.ctx) {
      const now = this.ctx.currentTime;
      this.currentGroup.masterGain.gain.setTargetAtTime(this.volume * 0.45, now, 0.1);
    }
  }

  public setShimmerBrightness(val: number): void {
    this.shimmerBrightness = Math.max(0, Math.min(1, val));
    if (this.currentGroup && this.ctx) {
      const now = this.ctx.currentTime;
      const cutoff = 280 + this.shimmerBrightness * 950;
      this.currentGroup.filterNode.frequency.setTargetAtTime(cutoff, now, 0.15);
    }
  }

  public getActiveKey(): string | null {
    return this.activeKey;
  }
}

export const worshipPadSynth = new WorshipPadSynthesizer();
