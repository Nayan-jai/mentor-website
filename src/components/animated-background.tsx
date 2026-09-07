'use client';

import React, { useEffect, useState, useRef } from 'react';

const words = [
  'STUDY', 'MENTORSHIP', 'SYLLABUS', 'MAINS', 'PRELIMS',
  'MISTAKES', 'PATH', 'CONSISTENCY', 'DISTRACTION', 'GUIDANCE',
];

const ORBIT_RADII   = [30, 38, 46, 54, 62]; // vw
const ORBIT_RADII_Y = [22, 28, 34, 40, 46]; // vh
const CENTER_X = 50; // vw
const CENTER_Y = 38; // vh

function generateStarBoxShadow(n: number, size = 2000) {
  let v = `${Math.random() * size}px ${Math.random() * size}px #FFF`;
  for (let i = 1; i < n; i++) v += `, ${Math.random() * size}px ${Math.random() * size}px #FFF`;
  return v;
}

// Deterministic orbit assignment per word (seeded, no hydration mismatch)
const ORBIT_IDX = words.map((_, i) => i % ORBIT_RADII.length);
const BASE_ANGLE = words.map((_, i) => (2 * Math.PI * i) / words.length);
const SPEED      = words.map((_, i) => 0.3 + i * 0.04); // rad/s
const FONT_SIZE  = words.map(w => Math.max(2.0, 3.2 - ((w.length - 4) / 8) * 1.0));

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  const [shadows, setShadows] = useState({ sm: '', md: '', lg: '' });
  const [positions, setPositions] = useState(
    words.map((_, i) => {
      const r  = ORBIT_RADII[ORBIT_IDX[i]];
      const ry = ORBIT_RADII_Y[ORBIT_IDX[i]];
      const a  = BASE_ANGLE[i];
      return { x: CENTER_X + r * Math.cos(a), y: CENTER_Y + ry * Math.sin(a), z: Math.sin(a) };
    })
  );
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setShadows({
      sm: generateStarBoxShadow(700),
      md: generateStarBoxShadow(200),
      lg: generateStarBoxShadow(100),
    });
    setMounted(true);

    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      setPositions(words.map((_, i) => {
        const r  = ORBIT_RADII[ORBIT_IDX[i]];
        const ry = ORBIT_RADII_Y[ORBIT_IDX[i]];
        const a  = BASE_ANGLE[i] + SPEED[i] * t;
        const z  = Math.sin(a); // -1 (far) to 1 (near)
        return {
          x: CENTER_X + r  * Math.cos(a),
          y: CENTER_Y + ry * Math.sin(a),
          z,
        };
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes animStar {
          from { transform: translateY(0px); }
          to   { transform: translateY(-2000px); }
        }
      `}</style>

      {/* Starfield */}
      <div style={{ position:'fixed', top:0, left:0, width:'1px', height:'1px', background:'transparent', boxShadow:shadows.sm, animation:'animStar 50s linear infinite',  zIndex:0, pointerEvents:'none' }} />
      <div style={{ position:'fixed', top:0, left:0, width:'2px', height:'2px', background:'transparent', boxShadow:shadows.md, animation:'animStar 100s linear infinite', zIndex:0, pointerEvents:'none' }} />
      <div style={{ position:'fixed', top:0, left:0, width:'3px', height:'3px', background:'transparent', boxShadow:shadows.lg, animation:'animStar 150s linear infinite', zIndex:0, pointerEvents:'none' }} />

      {/* Orbiting words */}
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:1, pointerEvents:'none' }}>
        {words.map((word, i) => {
          const { x, y, z } = positions[i];
          const scale   = 0.7 + 0.6 * (z + 1) / 2;   // 0.7–1.3 (near = bigger)
          const opacity = 0.4 + 0.6 * (z + 1) / 2;   // 0.4–1.0
          const blur    = 3.5 - 3 * (z + 1) / 2;     // 0.5–3.5px (near = sharp)
          return (
            <span
              key={word}
              style={{
                position:   'absolute',
                left:       `${x}vw`,
                top:        `${y}vh`,
                transform:  `translate(-50%, -50%) scale(${scale})`,
                fontSize:   `${FONT_SIZE[i]}vw`,
                color:      '#fff',
                fontWeight: 800,
                opacity,
                filter:     `blur(${blur}px)`,
                textShadow: '0 2px 8px #0008',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                willChange: 'transform, opacity, filter',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </>
  );
}