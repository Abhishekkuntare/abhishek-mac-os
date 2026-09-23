import React, { useEffect, useRef } from 'react';

interface LiveWallpaperProps {
  type: 'aurora' | 'particles' | 'gradient' | 'stars' | 'mesh';
  performanceMode?: 'balanced' | 'quality' | 'batterySaver';
}

export const LiveWallpaper: React.FC<LiveWallpaperProps> = ({ type, performanceMode = 'balanced' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Speed / count based on performance mode
    const speedMultiplier = performanceMode === 'batterySaver' ? 0.4 : performanceMode === 'quality' ? 1.0 : 0.7;
    const countMultiplier = performanceMode === 'batterySaver' ? 0.4 : performanceMode === 'quality' ? 1.0 : 0.7;

    let step = 0;

    // Stars particle array
    const numStars = Math.floor(220 * countMultiplier);
    const stars = Array.from({ length: numStars }, () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * width,
      size: Math.random() * 1.6 + 0.5,
      color: ['#ffffff', '#93c5fd', '#c084fc', '#f472b6'][Math.floor(Math.random() * 4)],
    }));

    // Floating particles
    const numParticles = Math.floor(70 * countMultiplier);
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8 * speedMultiplier,
      vy: (Math.random() - 0.5) * 0.8 * speedMultiplier,
      radius: Math.random() * 80 + 30,
      hue: Math.random() * 60 + 200, // blues to purples
      alpha: Math.random() * 0.25 + 0.08,
    }));

    const render = () => {
      step += 0.012 * speedMultiplier;

      if (type === 'aurora') {
        // Deep obsidian background
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, width, height);

        // Draw multiple smooth aurora ribbons
        for (let i = 0; i < 3; i++) {
          const t = step + i * 1.5;
          const grad = ctx.createLinearGradient(0, height * 0.2, width, height * 0.8);
          if (i === 0) {
            grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
            grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.28)');
            grad.addColorStop(1, 'rgba(59, 130, 246, 0.22)');
          } else if (i === 1) {
            grad.addColorStop(0, 'rgba(147, 51, 234, 0)');
            grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
            grad.addColorStop(1, 'rgba(236, 72, 153, 0.18)');
          } else {
            grad.addColorStop(0, 'rgba(14, 165, 233, 0)');
            grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
            grad.addColorStop(1, 'rgba(99, 102, 241, 0.15)');
          }

          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 25) {
            const wave1 = Math.sin(x * 0.003 + t) * (height * 0.15);
            const wave2 = Math.cos(x * 0.006 - t * 0.7) * (height * 0.1);
            const y = height * 0.45 + wave1 + wave2 + i * 40;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
        }
      } else if (type === 'stars') {
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        for (const s of stars) {
          s.z -= 1.8 * speedMultiplier;
          if (s.z <= 0) {
            s.z = width;
            s.x = (Math.random() - 0.5) * width;
            s.y = (Math.random() - 0.5) * height;
          }

          const k = 250 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const alpha = Math.min(1, (1 - s.z / width) * 1.5);
            ctx.beginPath();
            ctx.arc(px, py, s.size * (1 - s.z / width) * 2, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        }
      } else {
        // Floating particles / gradient mesh
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, width, height);

        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -p.radius) p.x = width + p.radius;
          if (p.x > width + p.radius) p.x = -p.radius;
          if (p.y < -p.radius) p.y = height + p.radius;
          if (p.y > height + p.radius) p.y = -p.radius;

          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          g.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${p.alpha})`);
          g.addColorStop(1, `hsla(${p.hue}, 80%, 65%, 0)`);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [type, performanceMode]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};
