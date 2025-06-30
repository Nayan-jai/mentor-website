'use client';

import React, { useEffect, useState } from 'react';

const words = [
  'UPSC',
  'MENTORSHIP',
  'SYLLABUS',
  'MAINS',
  'PRELIMS',
  'MISTAKES',
  'PATH',
  'CONSISTENCY',
  'DISTRACTION',
  'GUIDANCE',
];

const ORBIT_LEVELS = [32, 40, 48, 56, 64]; // vw
const ORBIT_LEVELS_Y = [24, 30, 36, 42, 48]; // vh, higher to cover more upper area
const CENTER_X = 50; // vw
const CENTER_Y = 35; // vh (move center up)

function getRandomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

function generateStarBoxShadow(n: number, size: number = 2000) {
  let value = `${Math.random() * size}px ${Math.random() * size}px #FFF`;
  for (let i = 1; i < n; i++) {
    value += `, ${Math.random() * size}px ${Math.random() * size}px #FFF`;
  }
  return value;
}

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [orbits, setOrbits] = useState<number[]>(
    () => words.map(() => getRandomIndex(ORBIT_LEVELS.length))
  );
  const [shadowsSmall] = useState(() => generateStarBoxShadow(700));
  const [shadowsMedium] = useState(() => generateStarBoxShadow(200));
  const [shadowsBig] = useState(() => generateStarBoxShadow(100));

  // Animate tick for orbiting
  useEffect(() => {
    setMounted(true);
    let frame: number;
    const animate = () => {
      setTick((t) => t + 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Randomly change orbits every 3-6 seconds
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setOrbits((prev) =>
        prev.map(() =>
          getRandomIndex(ORBIT_LEVELS.length)
        )
      );
    }, 3000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) return null;

  const now = Date.now() / 1000; // seconds

  return (
    <>
      <style jsx global>{`
        @keyframes animStar {
          from { transform: translateY(0px); }
          to { transform: translateY(-2000px); }
        }
      `}</style>
      {/* Starfield layers */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          background: 'transparent',
          boxShadow: shadowsSmall,
          animation: 'animStar 50s linear infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '2px',
          height: '2px',
          background: 'transparent',
          boxShadow: shadowsMedium,
          animation: 'animStar 100s linear infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '3px',
          height: '3px',
          background: 'transparent',
          boxShadow: shadowsBig,
          animation: 'animStar 150s linear infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Orbiting words */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {words.map((word, i) => {
          // Use the current orbit index for this word
          const orbitIdx = orbits[i];
          const orbitRadius = ORBIT_LEVELS[orbitIdx];
          const orbitRadiusY = ORBIT_LEVELS_Y[orbitIdx];

          // Orbit parameters
          const baseAngle = (2 * Math.PI * i) / words.length;
          const speed = 0.25 + i * 0.05; // radians/sec
          const angle = baseAngle + now * speed;

          // 3D position
          const x = CENTER_X + orbitRadius * Math.cos(angle);
          const y = CENTER_Y + orbitRadiusY * Math.sin(angle);
          const z = Math.sin(angle); // -1 (far) to 1 (near)

          // Perspective: closer = bigger, less blur; farther = smaller, more blur
          const scale = 0.7 + 0.6 * (z + 1) / 2; // 0.7 to 1.3
          const blur = 4 - 3.5 * (z + 1) / 2; // 0.5px (front) to 4px (back)
          const opacity = 0.5 + 0.5 * (z + 1) / 2; // 0.5 to 1

          // Font size: shorter words are larger, longer words are smaller
          const minFont = 2.2; // vw
          const maxFont = 3.2; // vw
          const minLen = 4;
          const maxLen = 12;
          const baseFontSize = maxFont - ((word.length - minLen) / (maxLen - minLen)) * (maxFont - minFont);

          return (
            <span
              key={word}
              style={{
                position: 'absolute',
                left: `${x}vw`,
                top: `${y}vh`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                fontSize: `${baseFontSize}vw`,
                color: '#fff', // changed from blue to white
                fontWeight: 800,
                opacity,
                textShadow: '0 2px 8px #0008',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                filter: `blur(${blur}px)`,
                transition: 'filter 0.5s, opacity 0.5s, font-size 0.5s, left 1s, top 1s, transform 0.5s',
                willChange: 'filter, opacity, font-size, left, top, transform',
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