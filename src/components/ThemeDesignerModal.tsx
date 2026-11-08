import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Sparkles,
  Copy,
} from 'lucide-react';
import { MediaAsset, Slide, ThemeTemplate } from '../types/worship';
import { SlideStageRenderer } from './SlideStageRenderer';

interface ThemeDesignerModalProps {
  initialTheme: ThemeTemplate | null;
  previewBackground: MediaAsset;
  onSave: (theme: ThemeTemplate, applyImmediately: boolean) => void;
  onClose: () => void;
}

const SAMPLE_PREVIEW_SLIDE: Slide = {
  id: 'preview-slide',
  tag: 'Chorus',
  lines: [
    'Maker of heaven, Healer of hearts',
    'Promise Keeper, Light in the dark',
    'My God, that is who You are',
  ],
  subtext: 'God of Revival & Light • CCLI #7100492',
};

export const ThemeDesignerModal: React.FC<ThemeDesignerModalProps> = ({
  initialTheme,
  previewBackground,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialTheme?.name || 'Custom Sanctuary Theme');
  const [description, setDescription] = useState(
    initialTheme?.description || 'Custom typography, shadow, and positioning template'
  );
  const [fontFamily, setFontFamily] = useState<ThemeTemplate['fontFamily']>(
    initialTheme?.fontFamily || 'display'
  );
  const [fontSizeScale, setFontSizeScale] = useState<number>(
    initialTheme?.fontSizeScale ?? 1.05
  );
  const [fontWeight, setFontWeight] = useState<NonNullable<ThemeTemplate['fontWeight']>>(
    initialTheme?.fontWeight || 'bold'
  );
  const [textAlign, setTextAlign] = useState<ThemeTemplate['textAlign']>(
    initialTheme?.textAlign || 'center'
  );
  const [verticalAlign, setVerticalAlign] = useState<ThemeTemplate['verticalAlign']>(
    initialTheme?.verticalAlign || 'center'
  );
  const [uppercase, setUppercase] = useState<boolean>(initialTheme?.uppercase ?? false);
  const [textShadow, setTextShadow] = useState<ThemeTemplate['textShadow']>(
    initialTheme?.textShadow || 'strong'
  );
  const [textColor, setTextColor] = useState<string>(initialTheme?.textColor || '#ffffff');
  const [accentColor, setAccentColor] = useState<string>(initialTheme?.accentColor || '#fbbf24');
  const [backgroundDimOpacity, setBackgroundDimOpacity] = useState<number>(
    initialTheme?.backgroundDimOpacity ?? 0.25
  );
  const [lowerThirdBand, setLowerThirdBand] = useState<boolean>(
    initialTheme?.lowerThirdBand ?? false
  );
  const [lowerThirdColor, setLowerThirdColor] = useState<string>(
    initialTheme?.lowerThirdColor || '#020617'
  );
  const [lowerThirdOpacity, setLowerThirdOpacity] = useState<number>(
    initialTheme?.lowerThirdOpacity ?? 0.85
  );
  const [maxContentWidth, setMaxContentWidth] = useState<number>(
    initialTheme?.maxContentWidth ?? 92
  );

  const draftTheme: ThemeTemplate = {
    id: initialTheme?.id || `theme-custom-${Date.now()}`,
    name: name.trim() || 'Untitled Theme',
    description: description.trim() || 'Custom theme',
    fontFamily,
    fontSizeScale,
    fontWeight,
    textAlign,
    verticalAlign,
    uppercase,
    textShadow,
    textColor,
    accentColor,
    backgroundDimOpacity,
    lowerThirdBand,
    lowerThirdColor,
    lowerThirdOpacity,
    maxContentWidth,
  };

  const handleSave = (applyLive: boolean, saveAsCopy = false) => {
    const finalTheme: ThemeTemplate = {
      ...draftTheme,
      id: saveAsCopy ? `theme-copy-${Date.now()}` : draftTheme.id,
      name: saveAsCopy ? `${draftTheme.name} (Copy)` : draftTheme.name,
    };
    onSave(finalTheme, applyLive);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-booth-900 border border-booth-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-booth-950 border-b border-booth-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Palette className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialTheme ? `Edit Theme: ${initialTheme.name}` : 'Create Custom Worship Theme'}
              </h3>
              <p className="text-xs text-slate-400">
                Design global fonts, drop shadows, outlines, background dimming, and lower-thirds broadcast bars
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-booth-850 hover:bg-booth-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Left Controls + Right Real-Time Stage Preview */}
        <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
          {/* Left 7 Cols: Theme Controls */}
          <div className="col-span-7 p-5 overflow-y-auto space-y-5 border-r border-booth-800">
            {/* Name & Description */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-booth-950 border border-booth-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Description / Usage Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-booth-950 border border-booth-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Typography Controls */}
            <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Type className="w-4 h-4" />
                <span>Typography & Sizing</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as ThemeTemplate['fontFamily'])}
                    className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="display">Montserrat (Arena Display)</option>
                    <option value="sans">Inter (Clean Broadcast Sans)</option>
                    <option value="serif">Merriweather (Scripture Serif)</option>
                    <option value="mono">JetBrains Mono (Technical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Font Weight
                  </label>
                  <select
                    value={fontWeight}
                    onChange={(e) =>
                      setFontWeight(e.target.value as NonNullable<ThemeTemplate['fontWeight']>)
                    }
                    className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="normal">Normal (400)</option>
                    <option value="semibold">Semi-Bold (600)</option>
                    <option value="bold">Bold (700)</option>
                    <option value="black">Heavy Black (900)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 bg-booth-900 border border-booth-700 rounded-lg px-3 py-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={uppercase}
                      onChange={(e) => setUppercase(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="font-bold">ALL-CAPS LYRICS</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Font Size Scale</span>
                    <span className="font-mono text-amber-300">{Math.round(fontSizeScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={1.45}
                    step={0.02}
                    value={fontSizeScale}
                    onChange={(e) => setFontSizeScale(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Max Text Container Width</span>
                    <span className="font-mono text-amber-300">{maxContentWidth}%</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    step={2}
                    value={maxContentWidth}
                    onChange={(e) => setMaxContentWidth(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Alignment & Screen Position */}
            <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Layout Position & Alignment
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1.5">
                    Horizontal Text Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'left', label: 'Left', icon: AlignLeft },
                        { id: 'center', label: 'Center', icon: AlignCenter },
                        { id: 'right', label: 'Right', icon: AlignRight },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTextAlign(id)}
                        className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border ${
                          textAlign === id
                            ? 'bg-sky-500 text-black border-sky-300'
                            : 'bg-booth-900 text-slate-300 border-booth-700 hover:bg-booth-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1.5">
                    Vertical Screen Anchor
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'top', label: 'Top' },
                        { id: 'center', label: 'Center' },
                        { id: 'bottom', label: 'Lower-Third' },
                      ] as const
                    ).map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setVerticalAlign(id)}
                        className={`py-2 rounded-lg text-xs font-bold border ${
                          verticalAlign === id
                            ? 'bg-sky-500 text-black border-sky-300'
                            : 'bg-booth-900 text-slate-300 border-booth-700 hover:bg-booth-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors, Shadows, Outlines & Lower-Thirds Band */}
            <div className="bg-booth-950 border border-booth-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Colors, Drop-Shadow & Broadcast Lower-Thirds</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Lyric Text Color
                  </label>
                  <div className="flex items-center gap-2 bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-1.5">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Reference / Accent Color
                  </label>
                  <div className="flex items-center gap-2 bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-1.5">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Shadow / Stroke Treatment
                  </label>
                  <select
                    value={textShadow}
                    onChange={(e) => setTextShadow(e.target.value as ThemeTemplate['textShadow'])}
                    className="w-full bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="strong">Strong Drop Shadow</option>
                    <option value="outline">Crisp 2px Black Outline</option>
                    <option value="soft">Soft Subtle Shadow</option>
                    <option value="glow">Accent Halo Glow</option>
                    <option value="none">No Shadow (Flat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Background Dimming Layer</span>
                    <span className="font-mono text-emerald-400">
                      {Math.round(backgroundDimOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.85}
                    step={0.05}
                    value={backgroundDimOpacity}
                    onChange={(e) => setBackgroundDimOpacity(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={lowerThirdBand}
                      onChange={(e) => {
                        setLowerThirdBand(e.target.checked);
                        if (e.target.checked) setVerticalAlign('bottom');
                      }}
                      className="rounded accent-emerald-500"
                    />
                    <span className="font-bold">Enable Lower-Thirds Broadcast Banner Box</span>
                  </label>
                </div>
              </div>

              {lowerThirdBand && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-booth-800">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Lower-Third Box Background Color
                    </label>
                    <div className="flex items-center gap-2 bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-1.5">
                      <input
                        type="color"
                        value={lowerThirdColor}
                        onChange={(e) => setLowerThirdColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-white">{lowerThirdColor}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Banner Box Opacity</span>
                      <span className="font-mono text-emerald-400">
                        {Math.round(lowerThirdOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={0.98}
                      step={0.02}
                      value={lowerThirdOpacity}
                      onChange={(e) => setLowerThirdOpacity(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Real-Time 16:9 Live Preview */}
          <div className="col-span-5 bg-booth-950 p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Real-Time Projector Preview (16:9)
                </span>
                <span className="text-[11px] text-slate-400">{previewBackground.name}</span>
              </div>

              <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-amber-500/60 shadow-2xl relative bg-black">
                <SlideStageRenderer
                  slide={SAMPLE_PREVIEW_SLIDE}
                  background={previewBackground}
                  theme={draftTheme}
                  scaleMode="preview"
                />
              </div>

              {/* Transparent OBS Stream Preview */}
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block mb-1.5">
                  OBS / Livestream Overlay Preview
                </span>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-booth-700 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] bg-slate-900">
                  <SlideStageRenderer
                    slide={SAMPLE_PREVIEW_SLIDE}
                    background={previewBackground}
                    theme={draftTheme}
                    scaleMode="preview"
                    transparentStreamMode={true}
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-booth-900 border border-booth-800 rounded-xl p-3">
              Changes made here update any schedule item assigned to this theme and broadcast to all connected screens in real time.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-booth-950 border-t border-booth-800 flex items-center justify-between">
          <div>
            {initialTheme && (
              <button
                type="button"
                onClick={() => handleSave(true, true)}
                className="px-3.5 py-2 rounded-xl bg-booth-800 hover:bg-booth-700 text-xs font-bold text-slate-200 border border-booth-600 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Save as New Copy</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-booth-850 hover:bg-booth-800 text-xs font-bold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl bg-booth-800 hover:bg-booth-700 text-xs font-bold text-amber-300 border border-amber-500/40"
            >
              Save Theme
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Live</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
