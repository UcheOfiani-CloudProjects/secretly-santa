'use client';
import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; r: number; vx: number; vy: number; base: number; phase: number; speed: number; big: boolean };

/** Subtle midnight sky: small stars drift, larger stars blink at their own pace, the odd bright twinkle. */
export default function Starfield({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0;
    let stars: Star[] = [];
    let twinkle: { x: number; y: number; t: number } | null = null;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / 9000) * density);
      stars = Array.from({ length: count }, () => {
        const big = Math.random() < 0.12;
        const depth = Math.random();
        return {
          x: Math.random() * w, y: Math.random() * h,
          r: big ? 1.2 + Math.random() * 1.1 : 0.4 + depth * 0.7,
          vx: (0.02 + depth * 0.06) * (big ? 0.3 : 1), vy: (0.005 + depth * 0.015),
          base: big ? 0.55 + Math.random() * 0.35 : 0.25 + depth * 0.45,
          phase: Math.random() * Math.PI * 2,
          speed: big ? 0.6 + Math.random() * 1.6 : 0.2 + Math.random() * 0.5,
          big,
        };
      });
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - last, 50) / 16.67; last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduce) {
          s.x += s.vx * dt; s.y += s.vy * dt;
          if (s.x > w + 4) s.x = -4; if (s.y > h + 4) s.y = -4;
        }
        const blink = s.big ? 0.5 + 0.5 * Math.sin(t * s.speed + s.phase) : 0.85 + 0.15 * Math.sin(t * s.speed + s.phase);
        const a = s.base * (reduce ? 1 : blink);
        ctx.beginPath();
        ctx.fillStyle = s.big ? `rgba(251,245,237,${a})` : `rgba(251,245,237,${a * 0.9})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.big && blink > 0.92) {
          ctx.fillStyle = `rgba(216,182,111,${(blink - 0.92) * 3})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      // occasional brighter twinkle
      if (!reduce) {
        if (!twinkle && Math.random() < 0.004) twinkle = { x: Math.random() * w, y: Math.random() * h * 0.8, t: 0 };
        if (twinkle) {
          twinkle.t += 0.02 * dt;
          const p = Math.sin(Math.min(twinkle.t, 1) * Math.PI);
          const len = 10 * p;
          ctx.strokeStyle = `rgba(251,245,237,${0.8 * p})`; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(twinkle.x - len, twinkle.y); ctx.lineTo(twinkle.x + len, twinkle.y);
          ctx.moveTo(twinkle.x, twinkle.y - len); ctx.lineTo(twinkle.x, twinkle.y + len);
          ctx.stroke();
          ctx.fillStyle = `rgba(216,182,111,${0.9 * p})`;
          ctx.beginPath(); ctx.arc(twinkle.x, twinkle.y, 1.6, 0, Math.PI * 2); ctx.fill();
          if (twinkle.t >= 1) twinkle = null;
        }
      }
      raf = requestAnimationFrame(frame);
    };

    build();
    raf = requestAnimationFrame(frame);
    const onResize = () => build();
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); };
  }, [density]);

  return <canvas ref={ref} aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
