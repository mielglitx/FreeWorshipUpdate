import React, { useEffect, useRef } from 'react';
import { MediaAsset, MotionPresetId } from '../types/worship';

interface MotionBackgroundCanvasProps {
  asset: MediaAsset;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  hueOffset: number;
}

interface MotionPresetPalette {
  gradStops: [string, string, string];
  orbA: string;
  orbB: string;
  waveFill: string;
  particleRgb: string;
  rayColor?: string;
  rayCount?: number;
  raySpeed?: number;
  haloColor?: string;
  showCross?: boolean;
  crossColor?: string;
  particleSpeedMult?: number;
}

const PRESET_PALETTES: Record<MotionPresetId, MotionPresetPalette> = {
  aurora: {
    gradStops: ['#061021', '#0d2949', '#061426'],
    orbA: 'rgba(45, 212, 191, 0.20)',
    orbB: 'rgba(56, 189, 248, 0.26)',
    waveFill: 'rgba(125, 211, 252, 0.06)',
    particleRgb: '224, 242, 254',
  },
  'warm-worship': {
    gradStops: ['#140703', '#3b1507', '#1a0904'],
    orbA: 'rgba(234, 88, 12, 0.24)',
    orbB: 'rgba(245, 158, 11, 0.28)',
    waveFill: 'rgba(251, 146, 60, 0.07)',
    particleRgb: '253, 224, 71',
  },
  particles: {
    gradStops: ['#060714', '#131638', '#221447'],
    orbA: 'rgba(99, 102, 241, 0.22)',
    orbB: 'rgba(167, 139, 250, 0.24)',
    waveFill: 'rgba(165, 180, 252, 0.06)',
    particleRgb: '224, 242, 254',
  },
  'deep-ocean': {
    gradStops: ['#03111a', '#0a3142', '#041821'],
    orbA: 'rgba(14, 165, 233, 0.25)',
    orbB: 'rgba(20, 184, 166, 0.22)',
    waveFill: 'rgba(56, 189, 248, 0.08)',
    particleRgb: '186, 230, 253',
  },
  nebula: {
    gradStops: ['#0f051d', '#2b0d3d', '#120521'],
    orbA: 'rgba(192, 38, 211, 0.26)',
    orbB: 'rgba(99, 102, 241, 0.22)',
    waveFill: 'rgba(216, 180, 254, 0.06)',
    particleRgb: '245, 208, 254',
  },
  'royal-gold': {
    gradStops: ['#120e04', '#2e2208', '#140f03'],
    orbA: 'rgba(251, 191, 36, 0.24)',
    orbB: 'rgba(217, 119, 6, 0.22)',
    waveFill: 'rgba(250, 204, 21, 0.06)',
    particleRgb: '253, 224, 71',
  },
  // WORSHIP THEMES
  'worship-altar': {
    gradStops: ['#160608', '#421216', '#210b06'],
    orbA: 'rgba(245, 158, 11, 0.26)',
    orbB: 'rgba(225, 29, 72, 0.20)',
    waveFill: 'rgba(251, 146, 60, 0.07)',
    particleRgb: '253, 230, 138',
    haloColor: 'rgba(251, 191, 36, 0.08)',
    particleSpeedMult: 0.85,
  },
  'worship-river': {
    gradStops: ['#03121c', '#0b2f45', '#0b1e3b'],
    orbA: 'rgba(56, 189, 248, 0.24)',
    orbB: 'rgba(45, 212, 191, 0.22)',
    waveFill: 'rgba(103, 232, 249, 0.09)',
    particleRgb: '207, 250, 254',
    particleSpeedMult: 0.75,
  },
  // PRAISE THEMES
  'praise-jubilee': {
    gradStops: ['#071330', '#163570', '#0a1f47'],
    orbA: 'rgba(56, 189, 248, 0.30)',
    orbB: 'rgba(250, 204, 21, 0.24)',
    waveFill: 'rgba(125, 211, 252, 0.08)',
    particleRgb: '254, 240, 138',
    rayColor: 'rgba(125, 211, 252, 0.11)',
    rayCount: 6,
    raySpeed: 1.5,
    particleSpeedMult: 1.5,
  },
  'praise-hosanna': {
    gradStops: ['#1b0629', '#4a1259', '#240b3d'],
    orbA: 'rgba(244, 114, 182, 0.26)',
    orbB: 'rgba(251, 191, 36, 0.24)',
    waveFill: 'rgba(244, 114, 182, 0.08)',
    particleRgb: '253, 224, 71',
    rayColor: 'rgba(244, 114, 182, 0.09)',
    rayCount: 5,
    raySpeed: 1.35,
    particleSpeedMult: 1.4,
  },
  // GLORY THEMES
  'glory-shekinah': {
    gradStops: ['#140e02', '#382506', '#1a1103'],
    orbA: 'rgba(251, 191, 36, 0.30)',
    orbB: 'rgba(254, 240, 138, 0.22)',
    waveFill: 'rgba(250, 204, 21, 0.07)',
    particleRgb: '254, 249, 195',
    rayColor: 'rgba(251, 191, 36, 0.12)',
    rayCount: 8,
    raySpeed: 0.7,
    haloColor: 'rgba(253, 224, 71, 0.12)',
    particleSpeedMult: 0.9,
  },
  'glory-throne': {
    gradStops: ['#040d21', '#0d2b4d', '#062629'],
    orbA: 'rgba(52, 211, 153, 0.24)',
    orbB: 'rgba(96, 165, 250, 0.26)',
    waveFill: 'rgba(110, 231, 183, 0.07)',
    particleRgb: '209, 250, 229',
    rayColor: 'rgba(147, 197, 253, 0.10)',
    rayCount: 6,
    raySpeed: 0.65,
    haloColor: 'rgba(52, 211, 153, 0.09)',
  },
  // HOLINESS THEMES
  'holiness-seraphim': {
    gradStops: ['#0b1120', '#1e293b', '#0f172a'],
    orbA: 'rgba(226, 232, 240, 0.20)',
    orbB: 'rgba(148, 163, 184, 0.20)',
    waveFill: 'rgba(226, 232, 240, 0.05)',
    particleRgb: '248, 250, 252',
    rayColor: 'rgba(241, 245, 249, 0.09)',
    rayCount: 5,
    raySpeed: 0.45,
    particleSpeedMult: 0.7,
  },
  'holiness-sanctuary': {
    gradStops: ['#0f0721', '#261447', '#130b2e'],
    orbA: 'rgba(167, 139, 250, 0.24)',
    orbB: 'rgba(251, 191, 36, 0.16)',
    waveFill: 'rgba(196, 181, 253, 0.07)',
    particleRgb: '237, 233, 254',
    haloColor: 'rgba(196, 181, 253, 0.09)',
    particleSpeedMult: 0.75,
  },
  // SALVATION THEMES
  'cross-glow': {
    gradStops: ['#160509', '#380d17', '#140814'],
    orbA: 'rgba(225, 29, 72, 0.26)',
    orbB: 'rgba(251, 146, 60, 0.22)',
    waveFill: 'rgba(251, 113, 133, 0.06)',
    particleRgb: '254, 215, 170',
    rayColor: 'rgba(253, 186, 116, 0.10)',
    rayCount: 6,
    raySpeed: 0.5,
    showCross: true,
    crossColor: 'rgba(254, 243, 199, 0.24)',
    particleSpeedMult: 0.85,
  },
  'salvation-dawn': {
    gradStops: ['#12081c', '#4c1628', '#2b1808'],
    orbA: 'rgba(251, 113, 133, 0.24)',
    orbB: 'rgba(251, 191, 36, 0.28)',
    waveFill: 'rgba(253, 186, 116, 0.07)',
    particleRgb: '254, 240, 138',
    rayColor: 'rgba(253, 224, 71, 0.10)',
    rayCount: 5,
    raySpeed: 0.6,
    haloColor: 'rgba(251, 146, 60, 0.10)',
  },
};

export const MotionBackgroundCanvas: React.FC<MotionBackgroundCanvasProps> = ({ asset, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (asset.type !== 'motion-canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const width = (canvas.width = 640);
    const height = (canvas.height = 360);

    const preset = asset.motionPreset || 'aurora';
    const palette = PRESET_PALETTES[preset] || PRESET_PALETTES.aurora;
    const speedMult = palette.particleSpeedMult ?? 1;

    const particles: Particle[] = Array.from({ length: 46 }, (_, i) => ({
      x: ((i * 97) % 100) * (width / 100),
      y: ((i * 53) % 100) * (height / 100),
      r: 1.4 + (i % 5) * 1.3,
      vx: ((i % 2 === 0 ? 1 : -1) * (0.12 + (i % 4) * 0.06)) * speedMult,
      vy: -(0.18 + (i % 5) * 0.08) * speedMult,
      alpha: 0.18 + (i % 6) * 0.09,
      hueOffset: (i * 15) % 60,
    }));

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Base gradient per preset
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, palette.gradStops[0]);
      baseGrad.addColorStop(0.5, palette.gradStops[1]);
      baseGrad.addColorStop(1, palette.gradStops[2]);
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Drifting volumetric light orbs
      for (let i = 0; i < 3; i++) {
        const orbX = width * (0.25 + 0.25 * i + Math.sin(time * (0.7 + i * 0.2) + i * 2) * 0.18);
        const orbY = height * (0.45 + Math.cos(time * (0.5 + i * 0.3) + i) * 0.22);
        const radius = width * (0.34 + i * 0.06);
        const radial = ctx.createRadialGradient(orbX, orbY, 5, orbX, orbY, radius);
        radial.addColorStop(0, i === 1 ? palette.orbB : palette.orbA);
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
      }

      // Optional Volumetric Heavenly Light Rays (Glory, Praise, Holiness, Salvation)
      if (palette.rayColor && palette.rayCount) {
        ctx.save();
        const originX = width * (0.5 + Math.sin(time * 0.35) * 0.08);
        const originY = -height * 0.15;
        const speed = palette.raySpeed ?? 0.8;
        for (let rIdx = 0; rIdx < palette.rayCount; rIdx++) {
          const baseAngle =
            Math.PI * 0.32 +
            (rIdx / Math.max(1, palette.rayCount - 1)) * (Math.PI * 0.36) +
            Math.sin(time * speed + rIdx * 1.3) * 0.07;
          const spread = 0.065 + (rIdx % 2) * 0.03;
          const rayLen = width * 1.35;
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(
            originX + Math.cos(baseAngle - spread) * rayLen,
            originY + Math.sin(baseAngle - spread) * rayLen
          );
          ctx.lineTo(
            originX + Math.cos(baseAngle + spread) * rayLen,
            originY + Math.sin(baseAngle + spread) * rayLen
          );
          ctx.closePath();
          ctx.fillStyle = palette.rayColor;
          ctx.fill();
        }
        ctx.restore();
      }

      // Optional Expanding Glory Halo Rings
      if (palette.haloColor) {
        ctx.save();
        const cx = width * 0.5;
        const cy = height * 0.44;
        for (let ring = 0; ring < 3; ring++) {
          const phase = ((time * 0.25 + ring / 3) % 1);
          const radius = 35 + phase * (width * 0.48);
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = palette.haloColor;
          ctx.lineWidth = 2.5 * (1 - phase) + 0.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Optional Soft Radiant Cross Silhouette (Salvation: Radiance of the Cross)
      if (palette.showCross && palette.crossColor) {
        ctx.save();
        const cx = width * 0.5;
        const cy = height * 0.46;
        const pulse = 0.82 + 0.18 * Math.sin(time * 1.4);
        const crossHalo = ctx.createRadialGradient(cx, cy - 18, 6, cx, cy - 18, width * 0.28);
        crossHalo.addColorStop(0, palette.crossColor);
        crossHalo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = crossHalo;
        ctx.fillRect(0, 0, width, height);

        ctx.globalAlpha = 0.28 * pulse;
        ctx.fillStyle = '#fef3c7';
        ctx.shadowColor = 'rgba(253, 224, 71, 0.75)';
        ctx.shadowBlur = 24;
        // Vertical beam
        ctx.fillRect(cx - 5, cy - 86, 10, 178);
        // Horizontal crossbar
        ctx.fillRect(cx - 48, cy - 42, 96, 10);
        ctx.restore();
      }

      // Flowing wave ribbons
      ctx.save();
      for (let wave = 0; wave < 2; wave++) {
        ctx.beginPath();
        const baseY = height * (0.55 + wave * 0.15);
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 24) {
          const y =
            baseY +
            Math.sin(x * 0.009 + time * (1.1 + wave * 0.4)) * 22 +
            Math.cos(x * 0.005 - time * 0.8) * 14;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = palette.waveFill;
        ctx.fill();
      }
      ctx.restore();

      // Floating sanctuary bokeh particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const twinkle = 0.65 + 0.35 * Math.sin(time * 2.5 + p.hueOffset);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette.particleRgb}, ${(p.alpha * twinkle).toFixed(3)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [asset.id, asset.type, asset.motionPreset]);

  if (asset.type === 'video' && asset.mediaUrl) {
    return (
      <video
        src={asset.mediaUrl}
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  if (asset.type === 'image' && asset.mediaUrl) {
    return (
      <img
        src={asset.mediaUrl}
        alt={asset.name}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  if (asset.type === 'gradient') {
    return (
      <div
        className={`w-full h-full ${className}`}
        style={{ background: asset.previewGradient }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full object-cover ${className}`}
    />
  );
};
