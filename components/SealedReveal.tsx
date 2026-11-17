'use client';
import { useEffect, useState } from 'react';

/** Wax-sealed wrapper: tap to break the seal, then the details rise into view. Stays open on this device afterwards. */
export default function SealedReveal({ roomId, children }: { roomId: string; children: React.ReactNode }) {
  const key = `ss-seal-${roomId}`;
  const [state, setState] = useState<'loading' | 'sealed' | 'cracking' | 'open'>('loading');
  useEffect(() => {
    let was = false;
    try { was = localStorage.getItem(key) === '1'; } catch {}
    setState(was ? 'open' : 'sealed');
  }, [key]);
  const crack = () => {
    setState('cracking');
    setTimeout(() => { setState('open'); try { localStorage.setItem(key, '1'); } catch {} }, 650);
  };
  if (state === 'loading') return null;
  if (state === 'open') return <div className="unsealed">{children}</div>;
  return (
    <div className={`card-ivory sealed ${state === 'cracking' ? 'cracking' : ''}`}>
      <button type="button" className="seal-btn" onClick={crack}>
        <span className="wax" aria-hidden>S</span>
        Break the seal
        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: .7, maxWidth: 240, lineHeight: 1.5 }}>Their Christmas Identity is inside. Once opened, it stays open.</span>
      </button>
    </div>
  );
}
