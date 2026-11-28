export type MidiTriggerAction =
  | 'NEXT_SLIDE'
  | 'PREV_SLIDE'
  | 'BLACKOUT'
  | 'LOGO'
  | 'CLEAR'
  | 'RESTORE';

export interface MidiMappingRule {
  action: MidiTriggerAction;
  label: string;
  note: number; // MIDI Note number (0-127)
}

export const DEFAULT_MIDI_MAPPINGS: MidiMappingRule[] = [
  { action: 'NEXT_SLIDE', label: 'Next Slide', note: 60 },
  { action: 'PREV_SLIDE', label: 'Previous Slide', note: 62 },
  { action: 'BLACKOUT', label: 'Toggle Blackout', note: 64 },
  { action: 'LOGO', label: 'Toggle Sanctuary Logo', note: 65 },
  { action: 'CLEAR', label: 'Toggle Clear Text', note: 67 },
  { action: 'RESTORE', label: 'Restore Output', note: 69 },
];

export interface MidiListenerStatus {
  supported: boolean;
  connectedInputs: string[];
  lastMessage: string;
}

export type MidiTriggerCallback = (action: MidiTriggerAction, rawSummary: string) => void;

export async function startWebMidiListener(
  mappings: MidiMappingRule[],
  onTrigger: MidiTriggerCallback,
  onStatusChange: (status: MidiListenerStatus) => void
): Promise<() => void> {
  const nav = navigator as Navigator & {
    requestMIDIAccess?: () => Promise<{
      inputs: Map<string, { name?: string; onmidimessage: ((ev: { data: Uint8Array }) => void) | null }>;
      onstatechange: (() => void) | null;
    }>;
  };

  if (typeof navigator === 'undefined' || typeof nav.requestMIDIAccess !== 'function') {
    onStatusChange({
      supported: false,
      connectedInputs: [],
      lastMessage: 'Web MIDI not supported in this environment',
    });
    return () => {};
  }

  let disposed = false;
  try {
    const access = await nav.requestMIDIAccess();
    if (disposed) return () => {};

    const attachInputs = () => {
      const names: string[] = [];
      access.inputs.forEach((input) => {
        names.push(input.name || 'MIDI Device');
        input.onmidimessage = (ev) => {
          const data = ev.data;
          if (!data || data.length < 2) return;
          const statusByte = data[0] & 0xf0;
          const data1 = data[1];
          const data2 = data[2] ?? 0;

          // Note On with velocity > 0
          if (statusByte === 0x90 && data2 > 0) {
            const summary = `Note ${data1} (vel ${data2})`;
            const matched = mappings.find((m) => m.note === data1);
            if (matched) {
              onTrigger(matched.action, `${summary} → ${matched.label}`);
            } else {
              onStatusChange({
                supported: true,
                connectedInputs: names,
                lastMessage: `Received ${summary}`,
              });
            }
            return;
          }

          // Standard Sustain / Foot Pedal CC 64 pressed (>= 64) triggers Next Slide
          if (statusByte === 0xb0 && data1 === 64 && data2 >= 64) {
            onTrigger('NEXT_SLIDE', `CC 64 Pedal → Next Slide`);
          }
        };
      });
      onStatusChange({
        supported: true,
        connectedInputs: names,
        lastMessage:
          names.length > 0
            ? `Listening on ${names.join(', ')}`
            : 'No USB MIDI foot pedal / controller detected',
      });
    };

    attachInputs();
    access.onstatechange = attachInputs;

    return () => {
      disposed = true;
      access.onstatechange = null;
      access.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    };
  } catch {
    onStatusChange({
      supported: false,
      connectedInputs: [],
      lastMessage: 'MIDI access permission denied or unavailable',
    });
    return () => {};
  }
}
