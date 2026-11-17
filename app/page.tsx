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
      <div className={`entrance-inner ${leaving ? 'leaving' : ''}`}>
        <span className="eyebrow">An invitation to something magical</span>
        <h1 style={{ margin: 0 }}><Wordmark size="lg" /></h1>
        <p className="tagline">A little mystery. A thoughtful gift. A Christmas to remember.</p>
        <button className="btn btn-invite" onClick={enter} style={{ marginTop: 12 }}>
          ENTER THE CHRISTMAS WORLD <span className="arrow">→</span>
        </button>
        <p className="whisper">Take a moment. The magic is just behind the door.</p>
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
