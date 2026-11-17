'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Wordmark from '@/components/Wordmark';

export default function Entrance() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [veil, setVeil] = useState<'' | 'on' | 'on fade'>('');

  const sparks = useMemo(
    () => Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 90 + Math.random() * 160;
      return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, delay: Math.random() * 0.25 };
    }), []);

  const enter = () => {
    if (leaving) return;
    router.prefetch('/home');
    setLeaving(true);
    setTimeout(() => setVeil('on'), 250);
    setTimeout(() => router.push('/home'), 1150);
  };

  return (
    <main className="entrance">
      <div className={`stage ${leaving ? 'leaving' : ''}`}>
        <div className="tint" />
        <div className="vignette" />
        <div className="head">
          <span className="eyebrow-s emb">An invitation to something magical</span>
          <h1 className="title emb" aria-label="Secretly Santa">Secretly<br />Santa</h1>
        </div>
        <div className="treetop" aria-hidden />
        <div className="frame" aria-hidden />
        <div className="foot">
          <p className="tag">A little mystery.<br />A thoughtful gift.<br />A Christmas to remember.</p>
          <button className="cta" onClick={enter}>ENTER THE CHRISTMAS WORLD <span className="arrow">→</span></button>
          <p className="whisper">Take a moment. The magic is just behind the door.</p>
        </div>
      </div>
      <div className={`veil ${veil}`} aria-hidden>
        <div className="glow" />
        {sparks.map((s, i) => (
          <span key={i} className="spark" style={{ left: '50%', top: '55%', ['--dx' as string]: `${s.dx}px`, ['--dy' as string]: `${s.dy}px`, animationDelay: `${s.delay}s` } as React.CSSProperties} />
        ))}
      </div>
    </main>
  );
}
