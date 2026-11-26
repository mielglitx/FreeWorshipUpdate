import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Layers, Play, Plus, Search, Sparkles, X } from 'lucide-react';
import { BibleVerse } from '../types/worship';
import {
  BIBLE_BOOKS_66,
  CanonicalBook,
  parseLiveBibleInput,
  ParsedScriptureRef,
} from '../services/bibleImporter';

interface ContinuousBibleBrowserProps {
  verses: BibleVerse[];
  selectedTranslation: string;
  availableTranslations: string[];
  onSelectTranslation: (code: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedVerseKeys: string[];
  getVerseKey: (v: BibleVerse) => string;
  onSelectVerse: (verse: BibleVerse, index: number, e: React.MouseEvent) => void;
  onSelectVerseRange?: (verses: BibleVerse[]) => void;
  onDoubleClickVerse: (verse: BibleVerse, index: number) => void;
  onContextMenuVerse?: (verse: BibleVerse, index: number, e: React.MouseEvent) => void;
  onAddPassagesToSchedule?: (verses: BibleVerse[], label?: string) => void;
  onProjectPassagesLive?: (verses: BibleVerse[], label?: string) => void;
  onJumpToReference?: (
    parsed: ParsedScriptureRef,
    matchedVerses: BibleVerse[],
    anchorIndex: number
  ) => void;
  initialBook?: string;
  initialChapter?: number;
  compact?: boolean;
  isLoadingTranslation?: boolean;
  listTourId?: string;
  emptyActionLabel?: string;
}

function makeBookChapterKey(book: string, chapter: number): string {
  return `${book.toLowerCase()}|${chapter}`;
}

function makeVerseLookupKey(book: string, chapter: number, verse: number): string {
  return `${book.toLowerCase()}|${chapter}|${verse}`;
}

export const ContinuousBibleBrowser: React.FC<ContinuousBibleBrowserProps> = ({
  verses,
  selectedTranslation,
  availableTranslations,
  onSelectTranslation,
  searchQuery,
  onSearchQueryChange,
  selectedVerseKeys,
  getVerseKey,
  onSelectVerse,
  onSelectVerseRange,
  onDoubleClickVerse,
  onContextMenuVerse,
  onAddPassagesToSchedule,
  onProjectPassagesLive,
  onJumpToReference,
  initialBook = 'Psalms',
  initialChapter = 23,
  compact = false,
  isLoadingTranslation = false,
  listTourId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownWrapperRef = useRef<HTMLDivElement | null>(null);
  const rowHeightsRef = useRef<Map<number, number>>(new Map());
  const pendingMeasureRafRef = useRef<number | null>(null);
  const hasPerformedInitialScrollRef = useRef<boolean>(false);

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(compact ? 320 : 520);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [highlightedVerseKeys, setHighlightedVerseKeys] = useState<string[]>([]);
  const [rangeAnchorIdx, setRangeAnchorIdx] = useState<number | null>(null);
  const [touchRangeMode, setTouchRangeMode] = useState(false);

  const selectedKeySet = useMemo(() => new Set(selectedVerseKeys), [selectedVerseKeys]);
  const highlightedKeySet = useMemo(() => new Set(highlightedVerseKeys), [highlightedVerseKeys]);

  // Fast O(N) lookup maps across the entire 66-book Bible
  const {
    bookStartIndex,
    chapterStartIndex,
    verseIndexMap,
    isBookBoundary,
    isChapterBoundary,
  } = useMemo(() => {
    const bStart = new Map<string, number>();
    const cStart = new Map<string, number>();
    const vMap = new Map<string, number>();
    const bookBound = new Uint8Array(verses.length);
    const chapBound = new Uint8Array(verses.length);

    let prevBook = '';
    let prevChapter = -1;

    for (let i = 0; i < verses.length; i++) {
      const v = verses[i];
      const bKey = v.book.toLowerCase();
      const cKey = makeBookChapterKey(v.book, v.chapter);
      const vKey = makeVerseLookupKey(v.book, v.chapter, v.verse);

      if (!bStart.has(bKey)) {
        bStart.set(bKey, i);
      }
      if (!cStart.has(cKey)) {
        cStart.set(cKey, i);
      }
      if (!vMap.has(vKey)) {
        vMap.set(vKey, i);
      }

      if (bKey !== prevBook) {
        bookBound[i] = 1;
        chapBound[i] = 1;
        prevBook = bKey;
        prevChapter = v.chapter;
      } else if (v.chapter !== prevChapter) {
        chapBound[i] = 1;
        prevChapter = v.chapter;
      }
    }

    return {
      bookStartIndex: bStart,
      chapterStartIndex: cStart,
      verseIndexMap: vMap,
      isBookBoundary: bookBound,
      isChapterBoundary: chapBound,
    };
  }, [verses]);

  // Reset cached measurements whenever dataset changes
  useEffect(() => {
    rowHeightsRef.current.clear();
    setLayoutVersion((v) => v + 1);
  }, [verses]);

  const estimateRowHeight = useCallback(
    (index: number) => {
      const v = verses[index];
      if (!v) return 86;
      const charsPerLine = compact ? 38 : 42;
      const textLines = Math.max(1, Math.ceil((v.text?.length || 40) / charsPerLine));
      const baseBody = compact ? 44 : 50;
      const lineHeight = compact ? 17 : 18;
      const dividerHeight = isBookBoundary[index]
        ? compact
          ? 34
          : 38
        : isChapterBoundary[index]
        ? compact
          ? 24
          : 26
        : 0;
      const gap = 8;
      return baseBody + textLines * lineHeight + dividerHeight + gap;
    },
    [verses, compact, isBookBoundary, isChapterBoundary]
  );

  // Prefix offsets array in typed Float64Array (<0.3ms for 31,102 verses)
  const offsets = useMemo(() => {
    const arr = new Float64Array(verses.length + 1);
    let running = 0;
    for (let i = 0; i < verses.length; i++) {
      arr[i] = running;
      running += rowHeightsRef.current.get(i) ?? estimateRowHeight(i);
    }
    arr[verses.length] = running;
    return arr;
  }, [verses, layoutVersion, estimateRowHeight]);

  const totalHeight = offsets[verses.length] || 0;

  // Binary search first index whose bottom exceeds targetTop
  const findIndexAtOffset = useCallback(
    (targetTop: number) => {
      if (verses.length === 0) return 0;
      let lo = 0;
      let hi = verses.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (offsets[mid + 1] <= targetTop) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      return lo;
    },
    [verses.length, offsets]
  );

  const visibleStart = Math.max(0, findIndexAtOffset(scrollTop) - 6);
  const visibleEnd = Math.min(
    verses.length - 1,
    findIndexAtOffset(scrollTop + viewportHeight) + 8
  );

  const topVisibleIndex = findIndexAtOffset(scrollTop + 28);
  const topVisibleVerse = verses[topVisibleIndex] || verses[0] || null;

  // Observe container viewport height
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el.clientHeight > 0) setViewportHeight(el.clientHeight);
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Measure rendered row heights safely without jitter
  const measureRowRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (!el) return;
      const h = Math.ceil(el.getBoundingClientRect().height) + 8;
      const prev = rowHeightsRef.current.get(index);
      if (prev === undefined || Math.abs(h - prev) > 1.5) {
        rowHeightsRef.current.set(index, h);
        if (pendingMeasureRafRef.current === null) {
          pendingMeasureRafRef.current = window.requestAnimationFrame(() => {
            pendingMeasureRafRef.current = null;
            setLayoutVersion((v) => v + 1);
          });
        }
      }
    },
    []
  );

  // Scroll to exact verse index cleanly (positioning it ~25% down so preceding & proceeding verses remain visible)
  const scrollToVerseIndex = useCallback(
    (targetIdx: number, centerOffsetRatio = 0.25) => {
      const container = scrollContainerRef.current;
      if (!container || targetIdx < 0 || targetIdx >= verses.length) return;
      const rawTop = offsets[targetIdx];
      const vH = container.clientHeight || viewportHeight || 420;
      const desiredTop = Math.max(0, rawTop - Math.round(vH * centerOffsetRatio));
      container.scrollTop = desiredTop;
      setScrollTop(desiredTop);

      // Single follow-up refinement after newly mounted visible rows are measured
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const el = container.querySelector(
            `[data-verse-index="${targetIdx}"]`
          ) as HTMLElement | null;
          if (el) {
            const refinedTop = Math.max(0, el.offsetTop - Math.round(vH * centerOffsetRatio));
            container.scrollTop = refinedTop;
            setScrollTop(refinedTop);
          }
        });
      });
    },
    [offsets, verses.length, viewportHeight]
  );

  // Initial scroll to default book & chapter (e.g. Psalms 23) once verses load
  useEffect(() => {
    if (verses.length === 0 || hasPerformedInitialScrollRef.current) return;
    const initIdx =
      chapterStartIndex.get(makeBookChapterKey(initialBook, initialChapter)) ??
      bookStartIndex.get(initialBook.toLowerCase()) ??
      0;
    hasPerformedInitialScrollRef.current = true;
    window.requestAnimationFrame(() => {
      scrollToVerseIndex(initIdx, 0.04);
    });
  }, [verses.length, initialBook, initialChapter, chapterStartIndex, bookStartIndex, scrollToVerseIndex]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownWrapperRef.current &&
        !dropdownWrapperRef.current.contains(e.target as Node)
      ) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Classify live typing input
  const parsedInput = useMemo(() => parseLiveBibleInput(searchQuery), [searchQuery]);

  // Split book suggestions strictly into Old Testament then New Testament
  const { otSuggestions, ntSuggestions, flatSuggestions } = useMemo(() => {
    const list =
      parsedInput.kind === 'book-prefix' || parsedInput.kind === 'empty'
        ? parsedInput.suggestions
        : [];
    const ot = list.filter((b) => b.testament === 'OT');
    const nt = list.filter((b) => b.testament === 'NT');
    return {
      otSuggestions: ot,
      ntSuggestions: nt,
      flatSuggestions: [...ot, ...nt],
    };
  }, [parsedInput]);

  // Keyword jump matches when query isn't a book prefix or scripture reference
  const keywordMatches = useMemo(() => {
    if (parsedInput.kind !== 'keyword') return [];
    const q = parsedInput.keyword.toLowerCase();
    if (q.length < 2) return [];
    const hits: Array<{ index: number; verse: BibleVerse }> = [];
    for (let i = 0; i < verses.length; i++) {
      const v = verses[i];
      if (
        v.text.toLowerCase().includes(q) ||
        `${v.book} ${v.chapter}:${v.verse}`.toLowerCase().includes(q)
      ) {
        hits.push({ index: i, verse: v });
        if (hits.length >= 40) break;
      }
    }
    return hits;
  }, [parsedInput, verses]);

  // Keep active suggestion index bounded
  useEffect(() => {
    setActiveSuggestionIdx(0);
  }, [searchQuery]);

  // Automatic jump-and-highlight when user types a complete reference (e.g. "John 3:16" or "Ps 23:1-6")
  const lastAutoJumpSigRef = useRef<string>('');
  useEffect(() => {
    if (parsedInput.kind !== 'reference' || verses.length === 0) {
      if (parsedInput.kind === 'empty') {
        setHighlightedVerseKeys([]);
      }
      return;
    }

    const { book, chapter, verseStart, verseEnd } = parsedInput.ref;
    const sig = `${selectedTranslation}|${book}|${chapter}|${verseStart ?? ''}|${verseEnd ?? ''}`;
    if (lastAutoJumpSigRef.current === sig) return;

    let anchorIdx = -1;
    if (verseStart !== undefined) {
      anchorIdx = verseIndexMap.get(makeVerseLookupKey(book, chapter, verseStart)) ?? -1;
    }
    if (anchorIdx < 0) {
      anchorIdx = chapterStartIndex.get(makeBookChapterKey(book, chapter)) ?? -1;
    }
    if (anchorIdx < 0) {
      anchorIdx = bookStartIndex.get(book.toLowerCase()) ?? -1;
    }

    if (anchorIdx >= 0) {
      lastAutoJumpSigRef.current = sig;
      const startV = verseStart ?? 1;
      const endV = verseEnd ?? startV;

      const matched = verses.filter((v) => {
        if (v.book.toLowerCase() !== book.toLowerCase()) return false;
        if (v.chapter !== chapter) return false;
        if (verseStart === undefined) return v.verse === 1;
        return v.verse >= startV && v.verse <= endV;
      });

      const hlKeys = matched.map(getVerseKey);
      setHighlightedVerseKeys(hlKeys);
      scrollToVerseIndex(anchorIdx, verseStart !== undefined ? 0.25 : 0.06);

      if (onJumpToReference) {
        onJumpToReference(parsedInput.ref, matched, anchorIdx);
      }
    }
  }, [
    parsedInput,
    verses,
    selectedTranslation,
    verseIndexMap,
    chapterStartIndex,
    bookStartIndex,
    getVerseKey,
    scrollToVerseIndex,
    onJumpToReference,
  ]);

  const selectBookSuggestion = (book: CanonicalBook) => {
    const nextText = `${book.name} `;
    onSearchQueryChange(nextText);
    const idx =
      chapterStartIndex.get(makeBookChapterKey(book.name, 1)) ??
      bookStartIndex.get(book.name.toLowerCase()) ??
      -1;
    if (idx >= 0) {
      const targetV = verses[idx];
      if (targetV) {
        setHighlightedVerseKeys([getVerseKey(targetV)]);
      }
      scrollToVerseIndex(idx, 0.06);
    }
    inputRef.current?.focus();
  };

  const jumpToKeywordHit = (index: number, verse: BibleVerse) => {
    const k = getVerseKey(verse);
    setHighlightedVerseKeys([k]);
    onSelectVerseRange?.([verse]);
    scrollToVerseIndex(index, 0.25);
    setIsInputFocused(false);
  };

  // Resolve target verses for "+ Schedule" / "Project" action bar:
  // Selected verses -> Highlighted verses -> Current top visible chapter (never all 31k verses!)
  const resolveActionTargetVerses = (): { targetVerses: BibleVerse[]; label: string } => {
    if (selectedVerseKeys.length > 0) {
      const selected = verses.filter((v) => selectedKeySet.has(getVerseKey(v)));
      if (selected.length > 0) {
        const first = selected[0];
        const last = selected[selected.length - 1];
        const label =
          selected.length > 1 && first.book === last.book && first.chapter === last.chapter
            ? `${first.book} ${first.chapter}:${first.verse}-${last.verse}`
            : `${first.book} ${first.chapter}:${first.verse}${selected.length > 1 ? ` (+${selected.length - 1})` : ''}`;
        return { targetVerses: selected, label };
      }
    }
    if (highlightedVerseKeys.length > 0) {
      const highlighted = verses.filter((v) => highlightedKeySet.has(getVerseKey(v)));
      if (highlighted.length > 0) {
        const first = highlighted[0];
        const last = highlighted[highlighted.length - 1];
        const label =
          highlighted.length > 1 && first.book === last.book && first.chapter === last.chapter
            ? `${first.book} ${first.chapter}:${first.verse}-${last.verse}`
            : `${first.book} ${first.chapter}:${first.verse}`;
        return { targetVerses: highlighted, label };
      }
    }
    if (topVisibleVerse) {
      const chapterVerses = verses.filter(
        (v) =>
          v.book.toLowerCase() === topVisibleVerse.book.toLowerCase() &&
          v.chapter === topVisibleVerse.chapter
      );
      return {
        targetVerses: chapterVerses,
        label: `${topVisibleVerse.book} ${topVisibleVerse.chapter}`,
      };
    }
    return { targetVerses: [], label: '' };
  };

  const handleRowClick = (v: BibleVerse, idx: number, e: React.MouseEvent) => {
    if (touchRangeMode && rangeAnchorIdx !== null && onSelectVerseRange) {
      const start = Math.min(rangeAnchorIdx, idx);
      const end = Math.max(rangeAnchorIdx, idx);
      onSelectVerseRange(verses.slice(start, end + 1));
      setRangeAnchorIdx(null);
      setTouchRangeMode(false);
      return;
    }
    if (touchRangeMode && rangeAnchorIdx === null) {
      setRangeAnchorIdx(idx);
    }
    onSelectVerse(v, idx, e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatSuggestions.length > 0 && isInputFocused) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIdx((i) => Math.min(flatSuggestions.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIdx((i) => Math.max(0, i - 1));
        return;
      }
      if ((e.key === 'Tab' || e.key === 'Enter') && parsedInput.kind === 'book-prefix') {
        const chosen = flatSuggestions[activeSuggestionIdx] || flatSuggestions[0];
        if (chosen) {
          e.preventDefault();
          selectBookSuggestion(chosen);
          return;
        }
      }
    }
    if (e.key === 'Enter') {
      if (parsedInput.kind === 'keyword' && keywordMatches.length > 0) {
        e.preventDefault();
        jumpToKeywordHit(keywordMatches[0].index, keywordMatches[0].verse);
        return;
      }
      setIsInputFocused(false);
    } else if (e.key === 'Escape') {
      setIsInputFocused(false);
    }
  };

  const showBookDropdown =
    isInputFocused &&
    (parsedInput.kind === 'book-prefix' || (parsedInput.kind === 'empty' && flatSuggestions.length > 0));
  const showKeywordDropdown =
    isInputFocused && parsedInput.kind === 'keyword' && searchQuery.trim().length >= 2;

  const { targetVerses, label: actionTargetLabel } = resolveActionTargetVerses();

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2">
      {/* Unified Translation + Single Bible Lookup Bar */}
      <div ref={dropdownWrapperRef} className="relative z-30 flex items-center gap-1.5">
        <select
          value={selectedTranslation}
          onChange={(e) => onSelectTranslation(e.target.value)}
          className="bg-booth-950 border border-booth-700 rounded-lg px-2 py-2 text-xs font-bold text-amber-300 focus:outline-none shrink-0"
          title="Select Bible Translation"
        >
          {availableTranslations.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsInputFocused(true)}
            onChange={(e) => {
              onSearchQueryChange(e.target.value);
              setIsInputFocused(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder='Type book ("e", "Exod"), ref ("John 3:16"), or words...'
            className="w-full bg-booth-950 border border-booth-700 rounded-lg pl-8 pr-7 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchQueryChange('');
                setHighlightedVerseKeys([]);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-2 text-slate-400 hover:text-white p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Book Autocomplete Suggestions (OT First, then NT) */}
        {showBookDropdown && flatSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto bg-booth-900 border-2 border-amber-500/50 rounded-xl shadow-2xl p-2 space-y-2">
            {otSuggestions.length > 0 && (
              <div>
                <div className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Old Testament ({otSuggestions.length})</span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    Click or Tab to select
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                  {otSuggestions.map((b) => {
                    const globalIdx = flatSuggestions.findIndex((x) => x.number === b.number);
                    const isActive = globalIdx === activeSuggestionIdx;
                    return (
                      <button
                        key={b.number}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectBookSuggestion(b);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-left text-xs font-bold flex items-center justify-between transition ${
                          isActive
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-booth-950 hover:bg-booth-800 text-slate-100 border border-booth-800'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        <span
                          className={`text-[9px] font-mono ml-1 shrink-0 ${
                            isActive ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          OT
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {ntSuggestions.length > 0 && (
              <div>
                <div className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-400">
                  New Testament ({ntSuggestions.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                  {ntSuggestions.map((b) => {
                    const globalIdx = flatSuggestions.findIndex((x) => x.number === b.number);
                    const isActive = globalIdx === activeSuggestionIdx;
                    return (
                      <button
                        key={b.number}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectBookSuggestion(b);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-left text-xs font-bold flex items-center justify-between transition ${
                          isActive
                            ? 'bg-sky-400 text-slate-950'
                            : 'bg-booth-950 hover:bg-booth-800 text-slate-100 border border-booth-800'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        <span
                          className={`text-[9px] font-mono ml-1 shrink-0 ${
                            isActive ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          NT
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyword Jump Matches Popover (jumps directly into full continuous context) */}
        {showKeywordDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-booth-900 border-2 border-emerald-500/45 rounded-xl shadow-2xl p-2 space-y-1">
            <div className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-between">
              <span>
                {keywordMatches.length > 0
                  ? `Jump to Verse (${keywordMatches.length}${keywordMatches.length >= 40 ? '+' : ''} matches)`
                  : 'No verse matches found'}
              </span>
              <span className="text-[9px] text-slate-400 font-normal">
                Jumps with surrounding verses
              </span>
            </div>
            {keywordMatches.map(({ index, verse }) => (
              <button
                key={`kw-${index}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  jumpToKeywordHit(index, verse);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-booth-950 hover:bg-booth-800 border border-booth-800 transition"
              >
                <div className="text-[11px] font-bold text-emerald-300">
                  {verse.book} {verse.chapter}:{verse.verse}
                </div>
                <div className="text-[11px] text-slate-300 truncate">{verse.text}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Location Header + Schedule / Project Passage Controls */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          {topVisibleVerse && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-booth-900 border border-booth-700 text-[10px] font-bold text-emerald-300 truncate">
              <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                {topVisibleVerse.book} {topVisibleVerse.chapter}:{topVisibleVerse.verse}
              </span>
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-semibold truncate">
            {selectedVerseKeys.length > 0
              ? `${selectedVerseKeys.length} selected`
              : `${verses.length.toLocaleString()} verses`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onSelectVerseRange && (
            <button
              type="button"
              onClick={() => {
                setTouchRangeMode((prev) => !prev);
                setRangeAnchorIdx(null);
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                touchRangeMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-booth-900 hover:bg-booth-800 text-slate-300 border-booth-700'
              }`}
              title="Tap first verse then last verse to select a passage range"
            >
              {touchRangeMode
                ? rangeAnchorIdx !== null
                  ? 'Tap End Verse'
                  : 'Tap Start'
                : 'Select Range'}
            </button>
          )}

          {onAddPassagesToSchedule && (
            <button
              type="button"
              disabled={targetVerses.length === 0}
              onClick={() => onAddPassagesToSchedule(targetVerses, actionTargetLabel)}
              className="px-2 py-1 rounded bg-booth-800 hover:bg-booth-700 text-[11px] font-bold text-amber-300 border border-booth-600 flex items-center gap-1 disabled:opacity-40"
              title={`Add ${actionTargetLabel || 'passage'} to Service Schedule`}
            >
              <Plus className="w-3 h-3" />
              <span>
                {selectedVerseKeys.length > 1
                  ? `+ Schedule (${selectedVerseKeys.length})`
                  : selectedVerseKeys.length === 1
                  ? `+ ${actionTargetLabel}`
                  : '+ Schedule'}
              </span>
            </button>
          )}

          {onProjectPassagesLive && (
            <button
              type="button"
              disabled={targetVerses.length === 0}
              onClick={() => onProjectPassagesLive(targetVerses, actionTargetLabel)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white flex items-center gap-1 disabled:opacity-40"
              title={`Project ${actionTargetLabel || 'passage'} directly to Live View`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>
                {selectedVerseKeys.length > 1
                  ? `Project (${selectedVerseKeys.length})`
                  : 'Go Live'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Virtualized Seamless 66-Book Scroll List */}
      <div
        ref={scrollContainerRef}
        data-tour={listTourId}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="flex-1 min-h-0 overflow-y-auto pr-1 relative"
      >
        {isLoadingTranslation && verses.length < 100 ? (
          <div className="p-6 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Loading full 66-book {selectedTranslation} Bible...</span>
          </div>
        ) : verses.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No verses loaded for {selectedTranslation}.
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {Array.from(
              { length: Math.max(0, visibleEnd - visibleStart + 1) },
              (_, offsetIdx) => {
                const idx = visibleStart + offsetIdx;
                const v = verses[idx];
                if (!v) return null;

                const vKey = getVerseKey(v);
                const isSelected = selectedKeySet.has(vKey);
                const isHighlighted = highlightedKeySet.has(vKey);
                const bookBoundary = isBookBoundary[idx] === 1;
                const chapterBoundary = isChapterBoundary[idx] === 1;
                const canonInfo = bookBoundary
                  ? BIBLE_BOOKS_66.find((b) => b.name.toLowerCase() === v.book.toLowerCase())
                  : undefined;

                return (
                  <div
                    key={vKey}
                    data-verse-index={idx}
                    ref={measureRowRef(idx)}
                    style={{
                      position: 'absolute',
                      top: `${offsets[idx]}px`,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {bookBoundary && (
                      <div className="mb-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-booth-900 to-booth-950 border border-amber-500/40 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <Layers className="w-3 h-3" />
                          <span>
                            {canonInfo ? `${canonInfo.number}. ` : ''}
                            {v.book} — Chapter {v.chapter}
                          </span>
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {canonInfo?.testament || ''}
                        </span>
                      </div>
                    )}

                    {!bookBoundary && chapterBoundary && (
                      <div className="mb-1 px-2 py-0.5 rounded bg-booth-900/90 border border-booth-800 text-[10px] font-bold text-sky-300 flex items-center justify-between">
                        <span>
                          {v.book} — Chapter {v.chapter}
                        </span>
                      </div>
                    )}

                    <div
                      draggable={!compact}
                      onDragStart={(e) => {
                        const keysToDrag = selectedKeySet.has(vKey)
                          ? selectedVerseKeys
                          : [vKey];
                        e.dataTransfer.setData(
                          'application/x-freeworship-items',
                          JSON.stringify({ category: 'scripture', ids: keysToDrag })
                        );
                      }}
                      onClick={(e) => handleRowClick(v, idx, e)}
                      onDoubleClick={() => onDoubleClickVerse(v, idx)}
                      onContextMenu={
                        onContextMenuVerse
                          ? (e) => onContextMenuVerse(v, idx, e)
                          : undefined
                      }
                      className={`border-2 rounded-xl ${
                        compact ? 'p-2.5' : 'p-3'
                      } cursor-pointer transition group ${
                        isHighlighted && isSelected
                          ? 'bg-emerald-950/55 border-emerald-400 shadow-lg shadow-emerald-500/15'
                          : isHighlighted
                          ? 'bg-emerald-950/40 border-emerald-400/90 shadow-md shadow-emerald-500/10'
                          : isSelected
                          ? 'bg-amber-950/25 border-amber-400 shadow-md'
                          : 'bg-booth-950 border-booth-700 hover:border-emerald-500/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isHighlighted ? 'text-emerald-300' : 'text-emerald-400'
                          }`}
                        >
                          {v.book} {v.chapter}:{v.verse} ({v.translation})
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 shrink-0">
                          {isHighlighted
                            ? '★ Match'
                            : isSelected
                            ? '✓ Selected'
                            : compact
                            ? 'Tap'
                            : 'Click / Drag →'}
                        </span>
                      </div>
                      <p
                        className={`${
                          compact ? 'text-[11px]' : 'text-xs'
                        } text-slate-200 leading-relaxed font-serif`}
                      >
                        {v.text}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
};
