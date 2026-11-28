import { Slide } from '../types/worship';

const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

// Keys that conventionally prefer flat accidentals
const FLAT_PREF_INDICES = new Set([1, 3, 5, 6, 8, 10]);

export function parseNoteToSemitone(note: string): number | null {
  if (!note) return null;
  const normalized = note.charAt(0).toUpperCase() + note.slice(1);
  return NOTE_TO_SEMITONE[normalized] ?? null;
}

export function semitoneToNoteName(semitone: number, preferFlats?: boolean): string {
  const idx = ((semitone % 12) + 12) % 12;
  const useFlats = preferFlats ?? FLAT_PREF_INDICES.has(idx);
  return useFlats ? FLAT_SCALE[idx] : SHARP_SCALE[idx];
}

/**
 * Transposes a musical key string (e.g., "G", "Em", "F#", "Bb") by `semitones`.
 */
export function transposeMusicalKey(rawKey: string | undefined, semitones: number): string {
  if (!rawKey) return 'C';
  const trimmed = rawKey.trim();
  const match = trimmed.match(/^([A-G][#b]?)(.*)$/i);
  if (!match) return trimmed;
  const baseSemi = parseNoteToSemitone(match[1]);
  if (baseSemi === null) return trimmed;
  const nextSemi = ((baseSemi + semitones) % 12 + 12) % 12;
  const preferFlats =
    match[1].includes('b') || (semitones < 0 && FLAT_PREF_INDICES.has(nextSemi)) || FLAT_PREF_INDICES.has(nextSemi);
  const nextRoot = semitoneToNoteName(nextSemi, preferFlats);
  return `${nextRoot}${match[2] || ''}`;
}

/**
 * Transposes a single chord token (e.g., "G", "Em7", "C/G", "F#m7b5", "Asus4").
 */
export function transposeChordToken(token: string, semitones: number): string {
  if (!token || semitones === 0) return token;
  const slashParts = token.split('/');
  if (slashParts.length === 2) {
    const main = transposeSimpleChord(slashParts[0], semitones);
    const bassSemi = parseNoteToSemitone(slashParts[1]);
    if (bassSemi !== null) {
      const nextBass = semitoneToNoteName(bassSemi + semitones);
      return `${main}/${nextBass}`;
    }
    return `${main}/${slashParts[1]}`;
  }
  return transposeSimpleChord(token, semitones);
}

function transposeSimpleChord(chord: string, semitones: number): string {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const semi = parseNoteToSemitone(match[1]);
  if (semi === null) return chord;
  const nextRoot = semitoneToNoteName(semi + semitones);
  return `${nextRoot}${match[2]}`;
}

/**
 * Transposes every chord token inside a stage chord chart line (e.g., "G | C | Em7 | D/F#").
 */
export function transposeChordLine(chordLine: string | undefined, semitones: number): string {
  if (!chordLine) return '';
  if (!semitones) return chordLine;
  return chordLine.replace(
    /\b([A-G][#b]?(?:maj|min|m|dim|aug|sus|add|[0-9])*(?:\/[A-G][#b]?)?)\b/g,
    (match) => transposeChordToken(match, semitones)
  );
}

/**
 * Computes guitar capo display info given sounding key and capo fret (1-7).
 */
export function getCapoShapeKey(soundingKey: string | undefined, capoFret: number): string {
  if (!soundingKey || capoFret <= 0) return soundingKey || 'C';
  return transposeMusicalKey(soundingKey, -capoFret);
}

/**
 * Expands/orders a song's slides according to an arrangement tag list (e.g., ["Verse 1", "Chorus", "Verse 2", "Chorus"]).
 * Falls back cleanly to original slides when arrangement is empty or produces zero matches.
 */
export function expandSongSlidesWithArrangement(
  slides: Slide[],
  arrangement?: string[]
): Slide[] {
  if (!arrangement || arrangement.length === 0 || slides.length === 0) {
    return slides;
  }

  const expanded: Slide[] = [];
  arrangement.forEach((entry, orderIdx) => {
    const target = entry.trim().toLowerCase();
    if (!target) return;
    const matching = slides.filter((s) => s.tag.trim().toLowerCase() === target);
    matching.forEach((slide, matchIdx) => {
      expanded.push({
        ...slide,
        id: `${slide.id}-arr-${orderIdx}-${matchIdx}`,
      });
    });
  });

  return expanded.length > 0 ? expanded : slides;
}
