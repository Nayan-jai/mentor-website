'use client';

import { useEffect, useRef, useState } from 'react';

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(true);

  // Track dark/light from <html> class
  useEffect(() => {
    const html = document.documentElement;
    const check = () => setIsDark(html.classList.contains('dark'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(html, { attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  // Moving Starfield canvas — active for BOTH light & dark modes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cv = canvas;
    const cx = ctx;

    let rafId = 0;
    const COUNT = 450;

    // Dark space palette vs Rich vibrant light-mode celestial jewel palette
    const DARK_COLORS = ['#ffffff', '#ffffff', '#93c5fd', '#a5b4fc', '#e0e7ff', '#bfdbfe', '#c7d2fe', '#60a5fa'];
    const LIGHT_COLORS = ['#2563eb', '#3b82f6', '#4f46e5', '#6366f1', '#7c3aed', '#0284c7', '#059669', '#d97706'];
    const currentColors = isDark ? DARK_COLORS : LIGHT_COLORS;

    type Star = {
      x: number;
      y: number;
      r: number;
      alpha: number;
      speed: number;
      phase: number;
      color: string;
      vx: number;
      vy: number;
    };
    let stars: Star[] = [];

    function resize() {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
      stars = Array.from({ length: COUNT }, () => {
        const r = isDark 
          ? Math.random() * 1.4 + 0.4
          : Math.random() * 1.8 + 0.8; // Larger and prominent for light mode
        const depthSpeed = r / 1.6;
        return {
          x: Math.random() * cv.width,
          y: Math.random() * cv.height,
          r,
          alpha: isDark ? Math.random() * 0.75 + 0.25 : Math.random() * 0.55 + 0.45, // High contrast in light mode
          speed: Math.random() * 1.5 + 0.5,
          phase: Math.random() * Math.PI * 2,
          color: currentColors[Math.floor(Math.random() * currentColors.length)],
          vx: (Math.random() - 0.5) * 0.25 * depthSpeed,
          vy: -(Math.random() * 0.45 + 0.15) * depthSpeed, // smooth upward drift
        };
      });
    }
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    function draw() {
      rafId = requestAnimationFrame(draw);
      t += 0.020;
      cx.clearRect(0, 0, cv.width, cv.height);

      stars.forEach((s) => {
        // Position update
        s.x += s.vx;
        s.y += s.vy;

        // Screen wrapping for infinite smooth loop
        if (s.y < -6) {
          s.y = cv.height + 6;
          s.x = Math.random() * cv.width;
        } else if (s.y > cv.height + 6) {
          s.y = -6;
          s.x = Math.random() * cv.width;
        }
        if (s.x < -6) s.x = cv.width + 6;
        else if (s.x > cv.width + 6) s.x = -6;

        // Twinkle alpha calculation
        const a = s.alpha * (0.4 + 0.6 * Math.sin(t * s.speed + s.phase));
        cx.globalAlpha = Math.max(isDark ? 0.15 : 0.35, Math.min(1, a));
        
        if (!isDark) {
          cx.shadowColor = s.color;
          cx.shadowBlur = 4;
        } else {
          cx.shadowColor = 'transparent';
          cx.shadowBlur = 0;
        }

        cx.fillStyle = s.color;
        cx.beginPath();
        cx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        cx.fill();
      });
      cx.globalAlpha = 1;
      cx.shadowBlur = 0;
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <>
      {/* Light mode soft ambient glows behind the moving stars */}
      {!isDark && (
        <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[750px]"
            style={{ background: 'radial-gradient(circle at 50% 35%, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.08) 35%, rgba(250,248,255,0) 70%)' }} />
          <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] rounded-full bg-blue-300/20 blur-[120px]" />
          <div className="absolute top-1/3 -right-48 w-[500px] h-[500px] rounded-full bg-indigo-300/20 blur-[120px]" />
          <div className="absolute bottom-10 left-1/3 w-[600px] h-[300px] rounded-full bg-sky-200/20 blur-[140px]" />
        </div>
      )}

      {/* Moving Starfield Canvas (Active in both Light & Dark modes) */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
    </>
  );
}
