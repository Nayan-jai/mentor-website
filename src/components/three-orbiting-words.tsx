'use client';

import { useEffect, useRef } from 'react';
import type * as THREE from 'three';

const WORDS = [
  { text: 'MENTORSHIP', color: '#3b82f6', glow: '#60a5fa', lightColor: '#2563eb', lightBorder: '#bfdbfe', lightText: '#1e3a8a', radius: 10, speed: 0.35, yOffset: 1.2, tilt: 0.15 },
  { text: 'SYLLABUS', color: '#6366f1', glow: '#818cf8', lightColor: '#4f46e5', lightBorder: '#c7d2fe', lightText: '#312e81', radius: 12.5, speed: -0.28, yOffset: -1.5, tilt: -0.2 },
  { text: 'CONSISTENCY', color: '#10b981', glow: '#34d399', lightColor: '#059669', lightBorder: '#a7f3d0', lightText: '#065f46', radius: 14, speed: 0.22, yOffset: 2.2, tilt: 0.25 },
  { text: 'STUDYPATH', color: '#2563eb', glow: '#93c5fd', lightColor: '#1d4ed8', lightBorder: '#93c5fd', lightText: '#1e40af', radius: 8.5, speed: -0.42, yOffset: 0.0, tilt: -0.1 },
  { text: '1-ON-1 SESSIONS', color: '#f59e0b', glow: '#fbbf24', lightColor: '#d97706', lightBorder: '#fde68a', lightText: '#92400e', radius: 11.5, speed: 0.26, yOffset: -2.8, tilt: 0.3 },
  { text: 'SPEED & FOCUS', color: '#8b5cf6', glow: '#a78bfa', lightColor: '#7c3aed', lightBorder: '#ddd6fe', lightText: '#5b21b6', radius: 13, speed: -0.32, yOffset: 3.0, tilt: -0.15 },
];
type Word = typeof WORDS[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDarkTextTexture(THREE: any, item: Word): any {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background pill / badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((ctx as any).roundRect) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx as any).roundRect(40, 38, 944, 180, 90);
  } else {
    ctx.rect(40, 38, 944, 180);
  }
  ctx.fill();

  // Border with glow
  ctx.strokeStyle = item.color;
  ctx.lineWidth = 10;
  ctx.shadowColor = item.glow;
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Dot indicator
  ctx.beginPath();
  ctx.arc(130, 128, 22, 0, Math.PI * 2);
  ctx.fillStyle = item.glow;
  ctx.shadowColor = item.glow;
  ctx.shadowBlur = 0;
  ctx.fill();

  // Text
  ctx.shadowBlur = 0;
  ctx.font = 'bold 84px system-ui, -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.text, 180, 130);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createLightTextTexture(THREE: any, item: Word): any {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Soft shadow under light pill
  ctx.save();
  ctx.shadowColor = 'rgba(30, 58, 138, 0.12)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((ctx as any).roundRect) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx as any).roundRect(40, 36, 944, 184, 92);
  } else {
    ctx.rect(40, 36, 944, 184);
  }
  ctx.fill();
  ctx.restore();

  // Border with color tint
  ctx.strokeStyle = item.lightBorder;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Dot indicator
  ctx.fillStyle = item.lightColor + '20';
  ctx.beginPath();
  ctx.arc(135, 128, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = item.lightColor;
  ctx.beginPath();
  ctx.arc(135, 128, 16, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.font = 'bold 74px system-ui, -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = item.lightText;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.text, 205, 130);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function getResponsiveSettings(width: number) {
  if (width < 640) {
    // Mobile devices (iPhone, Android)
    return {
      orbitRadiusScale: 0.45,
      badgeScale: 0.52,
      yScale: 0.55,
      cameraZ: 20,
    };
  } else if (width < 1024) {
    // Tablets / small screens
    return {
      orbitRadiusScale: 0.72,
      badgeScale: 0.75,
      yScale: 0.80,
      cameraZ: 19,
    };
  } else {
    // Desktops & laptops
    return {
      orbitRadiusScale: 1.0,
      badgeScale: 1.0,
      yScale: 1.0,
      cameraZ: 18,
    };
  }
}

export function ThreeOrbitingWords() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any = null;
    let onMouseMove: ((e: MouseEvent) => void) | null = null;
    let onTouchMove: ((e: TouchEvent) => void) | null = null;
    let onResize: (() => void) | null = null;
    let mo: MutationObserver | null = null;

    import('three').then((THREE) => {
      if (!containerRef.current) return;

      let isDark = document.documentElement.classList.contains('dark');
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || (window.innerHeight * 0.85);

      let screenSettings = getResponsiveSettings(width);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.set(0, 0, screenSettings.cameraZ);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const materials: any[] = [];

      const wordMeshes = WORDS.map((item, index) => {
        const texture = isDark ? createDarkTextTexture(THREE, item) : createLightTextTexture(THREE, item);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        materials[index] = material;

        const geometry = new THREE.PlaneGeometry(5.2, 1.3);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.userData = {
          radius: item.radius,
          speed: item.speed,
          yOffset: item.yOffset,
          tilt: item.tilt,
          angle: (index / WORDS.length) * Math.PI * 2,
        };

        group.add(mesh);
        return mesh;
      });

      // Ambient dust particles
      const particleCount = 200;
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 35;
        particlePositions[i + 1] = (Math.random() - 0.5) * 20;
        particlePositions[i + 2] = (Math.random() - 0.5) * 25;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: isDark ? 0x93c5fd : 0x3b82f6,
        size: 0.12,
        transparent: true,
        opacity: isDark ? 0.55 : 0.35,
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      // Mutation observer for theme switches
      mo = new MutationObserver(() => {
        const nowDark = document.documentElement.classList.contains('dark');
        if (nowDark === isDark) return;
        isDark = nowDark;
        WORDS.forEach((item, i) => {
          const oldMap = materials[i].map;
          materials[i].map = isDark ? createDarkTextTexture(THREE, item) : createLightTextTexture(THREE, item);
          materials[i].needsUpdate = true;
          oldMap?.dispose();
        });
        particleMaterial.color.set(isDark ? 0x93c5fd : 0x3b82f6);
        particleMaterial.opacity = isDark ? 0.55 : 0.35;
      });
      mo.observe(document.documentElement, { attributeFilter: ['class'] });

      // Interactive mouse and touch tilt
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouseMove);

      onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
          mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
        }
      };
      window.addEventListener('touchmove', onTouchMove, { passive: true });

      const clock = new THREE.Clock();

      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        targetX += (mouseX * 0.4 - targetX) * 0.05;
        targetY += (mouseY * 0.25 - targetY) * 0.05;
        group.rotation.y = targetX * 0.5;
        group.rotation.x = -targetY * 0.3;

        particles.rotation.y = elapsedTime * 0.03;

        wordMeshes.forEach((mesh) => {
          const data = mesh.userData;
          const currentAngle = data.angle + elapsedTime * data.speed * 0.65;

          const currentRadius = data.radius * screenSettings.orbitRadiusScale;
          const currentYOffset = data.yOffset * screenSettings.yScale;

          // Elliptical orbit with tilt
          const x = Math.cos(currentAngle) * currentRadius;
          const z = Math.sin(currentAngle) * (currentRadius * 0.7);
          const y = currentYOffset + Math.sin(currentAngle + data.tilt) * (1.5 * screenSettings.yScale);

          mesh.position.set(x, y, z);

          // Billboard effect (face camera) with slight 3D perspective
          mesh.quaternion.copy(camera.quaternion);

          // Responsive depth scaling & opacity based on z position
          const depthFactor = (z + currentRadius) / (currentRadius * 2); // 0 (far) to 1 (near)
          const dynamicScale = (0.75 + depthFactor * 0.35) * screenSettings.badgeScale;
          mesh.scale.setScalar(dynamicScale);
          (mesh.material as THREE.MeshBasicMaterial).opacity = isDark
            ? 0.35 + depthFactor * 0.65
            : 0.45 + depthFactor * 0.55;
        });

        renderer.render(scene, camera);
      };
      animate();

      onResize = () => {
        const newWidth = container.clientWidth || window.innerWidth;
        const newHeight = container.clientHeight || (window.innerHeight * 0.85);
        screenSettings = getResponsiveSettings(newWidth);
        camera.position.z = screenSettings.cameraZ;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };
      window.addEventListener('resize', onResize);
    });

    return () => {
      cancelAnimationFrame(rafId);
      mo?.disconnect();
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
      if (onTouchMove) window.removeEventListener('touchmove', onTouchMove);
      if (onResize) window.removeEventListener('resize', onResize);
      renderer?.dispose();
      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
