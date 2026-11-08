import React, { useEffect, useRef } from 'react';
import { MediaAsset } from '../types/worship';

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

    const particles: Particle[] = Array.from({ length: 42 }, (_, i) => ({
      x: ((i * 97) % 100) * (width / 100),
      y: ((i * 53) % 100) * (height / 100),
      r: 1.5 + (i % 5) * 1.4,
      vx: ((i % 2 === 0 ? 1 : -1) * (0.12 + (i % 4) * 0.06)),
      vy: -(0.18 + (i % 5) * 0.08),
      alpha: 0.18 + (i % 6) * 0.1,
      hueOffset: (i * 15) % 60,
    }));

    const preset = asset.motionPreset || 'aurora';

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Base gradient per preset
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      if (preset === 'warm-worship') {
        baseGrad.addColorStop(0, '#140703');
        baseGrad.addColorStop(0.5, '#3b1507');
        baseGrad.addColorStop(1, '#1a0904');
      } else if (preset === 'particles') {
        baseGrad.addColorStop(0, '#060714');
        baseGrad.addColorStop(0.5, '#131638');
        baseGrad.addColorStop(1, '#221447');
      } else if (preset === 'deep-ocean') {
        baseGrad.addColorStop(0, '#03111a');
        baseGrad.addColorStop(0.5, '#0a3142');
        baseGrad.addColorStop(1, '#041821');
      } else if (preset === 'nebula') {
        baseGrad.addColorStop(0, '#0f051d');
        baseGrad.addColorStop(0.5, '#2b0d3d');
        baseGrad.addColorStop(1, '#120521');
      } else if (preset === 'royal-gold') {
        baseGrad.addColorStop(0, '#120e04');
        baseGrad.addColorStop(0.5, '#2e2208');
        baseGrad.addColorStop(1, '#140f03');
      } else {
        // aurora default
        baseGrad.addColorStop(0, '#061021');
        baseGrad.addColorStop(0.5, '#0d2949');
        baseGrad.addColorStop(1, '#061426');
      }
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Drifting volumetric light orbs
      for (let i = 0; i < 3; i++) {
        const orbX = width * (0.25 + 0.25 * i + Math.sin(time * (0.7 + i * 0.2) + i * 2) * 0.18);
        const orbY = height * (0.45 + Math.cos(time * (0.5 + i * 0.3) + i) * 0.22);
        const radius = width * (0.34 + i * 0.06);
        const radial = ctx.createRadialGradient(orbX, orbY, 5, orbX, orbY, radius);

        if (preset === 'warm-worship') {
          radial.addColorStop(0, i === 1 ? 'rgba(245, 158, 11, 0.28)' : 'rgba(234, 88, 12, 0.24)');
        } else if (preset === 'royal-gold') {
          radial.addColorStop(0, 'rgba(251, 191, 36, 0.24)');
        } else if (preset === 'nebula') {
          radial.addColorStop(0, i === 0 ? 'rgba(192, 38, 211, 0.26)' : 'rgba(99, 102, 241, 0.22)');
        } else if (preset === 'deep-ocean') {
          radial.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
        } else {
          radial.addColorStop(0, i === 1 ? 'rgba(56, 189, 248, 0.26)' : 'rgba(45, 212, 191, 0.20)');
        }
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
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
        ctx.fillStyle =
          preset === 'warm-worship'
            ? 'rgba(251, 146, 60, 0.07)'
            : preset === 'royal-gold'
            ? 'rgba(250, 204, 21, 0.06)'
            : 'rgba(125, 211, 252, 0.06)';
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
        ctx.fillStyle =
          preset === 'warm-worship' || preset === 'royal-gold'
            ? `rgba(253, 224, 71, ${(p.alpha * twinkle).toFixed(3)})`
            : `rgba(224, 242, 254, ${(p.alpha * twinkle).toFixed(3)})`;
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
