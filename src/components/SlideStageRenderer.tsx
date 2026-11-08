import React, { useEffect, useRef, useState } from 'react';
import {
  MediaAsset,
  Slide,
  SlideTransitionSettings,
  SlideTransitionType,
  TextBoundaryRect,
  ThemeTemplate,
} from '../types/worship';
import { MotionBackgroundCanvas } from './MotionBackgroundCanvas';

interface SlideStageRendererProps {
  slide: Slide | null;
  background: MediaAsset;
  theme: ThemeTemplate;
  transition?: SlideTransitionSettings;
  panic?: {
    blackout: boolean;
    logoMode: boolean;
    clearText: boolean;
  };
  logoTitle?: string;
  logoSubtitle?: string;
  logoAsset?: MediaAsset | null;
  stageAlert?: {
    message: string;
    active: boolean;
    urgent: boolean;
  };
  scaleMode?: 'thumbnail' | 'preview' | 'projector';
  transparentStreamMode?: boolean;
  forceShowBoundaryGuide?: boolean;
}

export function resolveEffectiveBoundary(
  theme: ThemeTemplate,
  transparentStreamMode = false
): TextBoundaryRect {
  if (theme.boundary) {
    return {
      x: Math.max(0, Math.min(92, theme.boundary.x)),
      y: Math.max(0, Math.min(92, theme.boundary.y)),
      width: Math.max(8, Math.min(100 - theme.boundary.x, theme.boundary.width)),
      height: Math.max(8, Math.min(100 - theme.boundary.y, theme.boundary.height)),
      paddingPx: theme.boundary.paddingPx ?? 16,
      showGuideOnPreview: theme.boundary.showGuideOnPreview ?? false,
    };
  }

  const maxW = theme.maxContentWidth ?? 90;
  const leftX = Math.round((100 - maxW) / 2);

  if (theme.lowerThirdBand || theme.verticalAlign === 'bottom' || transparentStreamMode) {
    return {
      x: leftX,
      y: 68,
      width: maxW,
      height: 26,
      paddingPx: 20,
      showGuideOnPreview: false,
    };
  }

  if (theme.verticalAlign === 'top') {
    return {
      x: leftX,
      y: 6,
      width: maxW,
      height: 36,
      paddingPx: 20,
      showGuideOnPreview: false,
    };
  }

  return {
    x: leftX,
    y: 12,
    width: maxW,
    height: 76,
    paddingPx: 24,
    showGuideOnPreview: false,
  };
}

const FONT_WEIGHT_MAP: Record<string, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

function getAnimationName(type: SlideTransitionType, phase: 'in' | 'out'): string | null {
  switch (type) {
    case 'fade':
      return phase === 'in' ? 'fw-fade-in' : 'fw-fade-out';
    case 'slide-up':
      return phase === 'in' ? 'fw-slide-up-in' : 'fw-slide-up-out';
    case 'slide-down':
      return phase === 'in' ? 'fw-slide-down-in' : 'fw-slide-down-out';
    case 'slide-left':
      return phase === 'in' ? 'fw-slide-left-in' : 'fw-slide-left-out';
    case 'zoom-in':
      return phase === 'in' ? 'fw-zoom-in' : 'fw-zoom-out';
    case 'blur-fade':
      return phase === 'in' ? 'fw-blur-in' : 'fw-blur-out';
    case 'flip-3d':
      return phase === 'in' ? 'fw-flip-in' : 'fw-flip-out';
    default:
      return null;
  }
}

export const SlideStageRenderer: React.FC<SlideStageRendererProps> = ({
  slide,
  background,
  theme,
  transition,
  panic = { blackout: false, logoMode: false, clearText: false },
  logoTitle = 'FREEWORSHIP SANCTUARY',
  logoSubtitle = 'WORSHIP • WORD • COMMUNITY',
  logoAsset = null,
  stageAlert,
  scaleMode = 'preview',
  transparentStreamMode = false,
  forceShowBoundaryGuide = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boundaryBoxRef = useRef<HTMLDivElement | null>(null);
  const textContentRef = useRef<HTMLDivElement | null>(null);

  const [stageHeight, setStageHeight] = useState<number>(
    scaleMode === 'projector' ? 1080 : scaleMode === 'preview' ? 270 : 120
  );
  const [autoFitRatio, setAutoFitRatio] = useState<number>(1);

  // Dual-buffer slide transition state (keeps previous slide alive while animating out)
  const effectiveTransition: SlideTransitionSettings = transition ||
    theme.transition || {
      type: 'fade',
      durationMs: 380,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    };

  const prevSlideRef = useRef<Slide | null>(slide);
  const [exitingSlide, setExitingSlide] = useState<Slide | null>(null);
  const [animKey, setAnimKey] = useState<number>(0);

  useEffect(() => {
    const prev = prevSlideRef.current;
    if (prev?.id !== slide?.id) {
      if (
        prev &&
        effectiveTransition.type !== 'cut' &&
        effectiveTransition.durationMs > 0
      ) {
        setExitingSlide(prev);
        setAnimKey((k) => k + 1);
        const timer = setTimeout(() => {
          setExitingSlide(null);
        }, effectiveTransition.durationMs);
        prevSlideRef.current = slide;
        return () => clearTimeout(timer);
      } else {
        setExitingSlide(null);
        setAnimKey((k) => k + 1);
      }
    }
    prevSlideRef.current = slide;
  }, [slide, effectiveTransition.type, effectiveTransition.durationMs]);

  // Measure actual stage container height so px sizes scale proportionally across Thumbnail, Preview, 1080p, and 4K
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const h = el.clientHeight;
      if (h > 0) setStageHeight(h);
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const boundary = resolveEffectiveBoundary(theme, transparentStreamMode);
  const scaleRatio = stageHeight / 1080;

  // Base reference font size in px at 1080p
  const refMainPx = (theme.baseFontSizePx ?? 64) * (theme.fontSizeScale ?? 1);
  const refSubPx = (theme.subtextFontSizePx ?? 28) * (theme.fontSizeScale ?? 1);

  // Auto-Fit calculation when text is taller than the user's boundary box
  useEffect(() => {
    if (theme.overflowBehavior && theme.overflowBehavior !== 'auto-fit') {
      setAutoFitRatio(1);
      return;
    }
    const boxEl = boundaryBoxRef.current;
    const txtEl = textContentRef.current;
    if (!boxEl || !txtEl) {
      setAutoFitRatio(1);
      return;
    }

    const availH = boxEl.clientHeight - (boundary.paddingPx ?? 16) * 2 * scaleRatio;
    const naturalH = txtEl.scrollHeight / (autoFitRatio || 1);
    if (availH > 10 && naturalH > availH) {
      const ratio = Math.max(0.45, Math.min(1, (availH / naturalH) * 0.94));
      if (Math.abs(ratio - autoFitRatio) > 0.03) {
        setAutoFitRatio(ratio);
      }
    } else if (autoFitRatio !== 1) {
      setAutoFitRatio(1);
    }
  }, [
    slide,
    stageHeight,
    boundary.width,
    boundary.height,
    boundary.paddingPx,
    refMainPx,
    theme.lineHeight,
    theme.wordWrapMode,
    theme.overflowBehavior,
  ]);

  const computedMainFontSizePx = Math.max(8, refMainPx * scaleRatio * autoFitRatio);
  const computedSubFontSizePx = Math.max(7, refSubPx * scaleRatio * autoFitRatio);
  const computedPaddingPx = Math.max(2, (boundary.paddingPx ?? 16) * scaleRatio);
  const computedLineGapPx = Math.max(1, (theme.lineGapPx ?? 8) * scaleRatio);

  const fontStack = theme.customFontName
    ? `${theme.customFontName}, sans-serif`
    : theme.fontFamily === 'serif'
    ? 'Merriweather, Georgia, serif'
    : theme.fontFamily === 'display'
    ? 'Montserrat, Inter, system-ui, sans-serif'
    : theme.fontFamily === 'mono'
    ? '"JetBrains Mono", Consolas, monospace'
    : 'Inter, system-ui, -apple-system, sans-serif';

  const subtextFontStack = theme.subtextFontName
    ? `${theme.subtextFontName}, sans-serif`
    : fontStack;

  const fontWeightValue = FONT_WEIGHT_MAP[theme.fontWeight || 'bold'] || 700;

  const textTransformValue: React.CSSProperties['textTransform'] =
    theme.textTransform && theme.textTransform !== 'none'
      ? theme.textTransform
      : theme.uppercase
      ? 'uppercase'
      : 'none';

  const getWordWrapStyles = (): React.CSSProperties => {
    const mode = theme.wordWrapMode || 'balance';
    if (mode === 'nowrap') {
      return {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };
    }
    if (mode === 'break-words') {
      return {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      };
    }
    if (mode === 'normal') {
      return {
        whiteSpace: 'pre-wrap',
        wordBreak: 'normal',
        overflowWrap: 'break-word',
      };
    }
    return {
      whiteSpace: 'pre-wrap',
      wordBreak: 'normal',
      overflowWrap: 'break-word',
      textWrap: 'balance' as any,
    };
  };

  const getTextShadowAndStrokeStyle = (): React.CSSProperties => {
    const strokePx = (theme.strokeWidthPx ?? 0) * scaleRatio;
    const strokeColor = theme.strokeColor || '#000000';
    const strokeStyle: React.CSSProperties =
      strokePx > 0
        ? {
            WebkitTextStroke: `${strokePx.toFixed(1)}px ${strokeColor}`,
          }
        : {};

    if (theme.textShadow === 'none') {
      return strokeStyle;
    }
    if (theme.textShadow === 'strong') {
      return {
        ...strokeStyle,
        textShadow: '0 4px 18px rgba(0,0,0,0.92), 0 2px 4px rgba(0,0,0,0.95)',
      };
    }
    if (theme.textShadow === 'outline') {
      return {
        ...strokeStyle,
        textShadow:
          '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 6px 20px rgba(0,0,0,0.85)',
      };
    }
    if (theme.textShadow === 'glow') {
      return {
        ...strokeStyle,
        textShadow: `0 0 22px ${theme.accentColor || '#fbbf24'}, 0 2px 10px rgba(0,0,0,0.9)`,
      };
    }
    if (theme.textShadow === 'soft') {
      return {
        ...strokeStyle,
        textShadow: '0 2px 10px rgba(0,0,0,0.65)',
      };
    }
    return strokeStyle;
  };

  const verticalJustifyClass =
    theme.verticalAlign === 'bottom'
      ? 'justify-end'
      : theme.verticalAlign === 'top'
      ? 'justify-start'
      : 'justify-center';

  const horizontalItemsClass =
    theme.textAlign === 'left'
      ? 'items-start text-left'
      : theme.textAlign === 'right'
      ? 'items-end text-right'
      : theme.textAlign === 'justify'
      ? 'items-stretch text-justify'
      : 'items-center text-center';

  const dimOpacity = theme.backgroundDimOpacity ?? 0.25;
  const ltColor = theme.lowerThirdColor || '#020617';
  const ltOpacity = theme.lowerThirdOpacity ?? 0.85;
  const ltRadius = (theme.lowerThirdBorderRadiusPx ?? 14) * scaleRatio;

  const showGuide =
    scaleMode !== 'projector' && (forceShowBoundaryGuide || boundary.showGuideOnPreview);

  const enterAnimName = getAnimationName(effectiveTransition.type, 'in');
  const exitAnimName = getAnimationName(effectiveTransition.type, 'out');

  const renderSlideTextBlock = (
    targetSlide: Slide,
    phase: 'in' | 'out',
    attachRef: boolean
  ) => {
    const animName = phase === 'in' ? enterAnimName : exitAnimName;
    const animStyle: React.CSSProperties =
      animName && effectiveTransition.durationMs > 0
        ? {
            animation: `${animName} ${effectiveTransition.durationMs}ms ${effectiveTransition.easing} both`,
          }
        : {};

    return (
      <div
        key={`${targetSlide.id}-${phase}-${animKey}`}
        ref={attachRef ? textContentRef : undefined}
        className={`w-full ${phase === 'out' ? 'absolute inset-x-0 pointer-events-none' : 'relative'}`}
        style={{
          padding: phase === 'out' ? `${computedPaddingPx}px` : undefined,
          fontFamily: fontStack,
          fontWeight: fontWeightValue,
          fontStyle: theme.fontStyle || 'normal',
          textDecoration: theme.underline ? 'underline' : 'none',
          textTransform: textTransformValue,
          fontSize: `${computedMainFontSizePx}px`,
          lineHeight: theme.lineHeight ?? 1.25,
          letterSpacing: `${theme.letterSpacingEm ?? 0.02}em`,
          wordSpacing: `${(theme.wordSpacingPx ?? 0) * scaleRatio}px`,
          color: theme.textColor,
          ...getWordWrapStyles(),
          ...getTextShadowAndStrokeStyle(),
          ...animStyle,
        }}
      >
        {targetSlide.lines.map((line, idx) => (
          <p
            key={idx}
            style={{
              marginBottom: idx < targetSlide.lines.length - 1 ? `${computedLineGapPx}px` : 0,
            }}
          >
            {line}
          </p>
        ))}

        {targetSlide.subtext && (
          <div
            style={{
              fontFamily: subtextFontStack,
              fontSize: `${computedSubFontSizePx}px`,
              color: theme.accentColor,
              marginTop: `${Math.max(4, 14 * scaleRatio)}px`,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              ...getTextShadowAndStrokeStyle(),
            }}
          >
            {targetSlide.subtext}
          </div>
        )}
      </div>
    );
  };

  if (panic.blackout) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-black transition-opacity duration-300"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${
        transparentStreamMode ? 'bg-transparent' : 'bg-black'
      }`}
    >
      {/* Background Layer */}
      {!transparentStreamMode && (
        <div className="absolute inset-0">
          <MotionBackgroundCanvas
            asset={panic.logoMode && logoAsset && logoAsset.type !== 'image' ? logoAsset : background}
          />
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{ backgroundColor: `rgba(0, 0, 0, ${dimOpacity})` }}
          />
        </div>
      )}

      {/* Logo Mode Overlay */}
      {panic.logoMode && !transparentStreamMode && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          {logoAsset?.mediaUrl ? (
            <img
              src={logoAsset.mediaUrl}
              alt={logoAsset.name}
              className="max-h-[48%] max-w-[65%] object-contain rounded-2xl mb-4 shadow-2xl"
            />
          ) : (
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center mb-4 shadow-2xl backdrop-blur-md">
              <span className="text-amber-300 font-black text-2xl md:text-4xl tracking-tighter">
                FW
              </span>
            </div>
          )}
          <h2
            className="font-display font-black tracking-widest text-white uppercase"
            style={{
              fontSize: `${Math.max(12, 54 * scaleRatio)}px`,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            }}
          >
            {logoTitle}
          </h2>
          <p
            className="text-amber-300/90 tracking-[0.25em] uppercase mt-1 font-medium"
            style={{
              fontSize: `${Math.max(8, 22 * scaleRatio)}px`,
            }}
          >
            {logoSubtitle}
          </p>
        </div>
      )}

      {/* Positioned & Bounded Text Container with Dual-Buffer Enter/Exit Slide Transitions */}
      {!panic.logoMode && !panic.clearText && (slide || exitingSlide) && (
        <div
          ref={boundaryBoxRef}
          className={`absolute z-10 flex flex-col transition-all duration-150 ${verticalJustifyClass} ${horizontalItemsClass} ${
            theme.overflowBehavior === 'visible' ? 'overflow-visible' : 'overflow-hidden'
          }`}
          style={{
            left: `${boundary.x}%`,
            top: `${boundary.y}%`,
            width: `${boundary.width}%`,
            height: `${boundary.height}%`,
            padding: `${computedPaddingPx}px`,
            ...(theme.lowerThirdBand || transparentStreamMode
              ? {
                  backgroundColor: ltColor,
                  opacity: ltOpacity,
                  borderRadius: `${ltRadius}px`,
                  borderTop: `${Math.max(1.5, 3 * scaleRatio)}px solid ${
                    theme.accentColor || '#fbbf24'
                  }`,
                }
              : {}),
            ...(showGuide
              ? {
                  outline: '1.5px dashed rgba(251, 191, 36, 0.75)',
                  backgroundColor:
                    theme.lowerThirdBand || transparentStreamMode
                      ? ltColor
                      : 'rgba(251, 191, 36, 0.05)',
                }
              : {}),
          }}
        >
          {showGuide && (
            <div className="absolute top-0.5 right-1 px-1.5 py-0.2 bg-amber-500/90 text-black font-mono font-bold text-[8px] rounded pointer-events-none z-20">
              X:{Math.round(boundary.x)}% Y:{Math.round(boundary.y)}% • W:{Math.round(boundary.width)}% H:{Math.round(boundary.height)}%
            </div>
          )}

          {/* Exiting Slide Layer (during cross-transition) */}
          {exitingSlide && renderSlideTextBlock(exitingSlide, 'out', false)}

          {/* Entering / Active Slide Layer */}
          {slide && renderSlideTextBlock(slide, 'in', true)}
        </div>
      )}

      {/* Optional Urgent Nursery / Sanctuary Alert Ticker on Projector */}
      {stageAlert?.active &&
        stageAlert.urgent &&
        stageAlert.message &&
        scaleMode !== 'thumbnail' && (
          <div className="absolute top-4 inset-x-8 z-30 flex justify-center">
            <div className="bg-red-600/95 text-white px-5 py-2 rounded-lg shadow-2xl border border-red-300 font-bold tracking-wide text-sm md:text-lg flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>NOTICE: {stageAlert.message}</span>
            </div>
          </div>
        )}
    </div>
  );
};
