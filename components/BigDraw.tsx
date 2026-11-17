'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import { padNo } from '@/lib/format';

type Recipient = { code_name: string; number: number; display_name: string | null };

export default function BigDraw({ roomId, decoys, initial }: { roomId: string; decoys: string[]; initial: Recipient | null }) {
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'done'>(initial ? 'done' : 'idle');
  const [shuffle, setShuffle] = useState('');
  const [rec, setRec] = useState<Recipient | null>(initial);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const draw = async () => {
    setError(''); setPhase('drawing');
    const pool = decoys.length ? decoys : ['✦', '✧', '✦'];
    let i = 0, delay = 70;
    const tick = () => { setShuffle(pool[i++ % pool.length]); };
    timer.current = setInterval(tick, delay);
    const started = Date.now();
    const { data, error } = await supabaseBrowser().rpc('my_assignment', { p_room: roomId, p_reveal: true });
    const wait = Math.max(0, 2800 - (Date.now() - started));
    // slow the shuffle down before the reveal
    setTimeout(() => { if (timer.current) clearInterval(timer.current); timer.current = setInterval(tick, 180); }, Math.max(0, wait - 900));
    setTimeout(() => {
      if (timer.current) clearInterval(timer.current);
      if (error || data?.state !== 'revealed') { setError(error?.message ?? 'The draw isn’t open yet.'); setPhase('idle'); return; }
      setRec(data.recipient); setPhase('done');
    }, wait);
  };

  if (phase === 'done' && rec) {
    return (
      <div className="draw-stage">
        <div className="card-ivory reveal-card stack" style={{ alignItems: 'center', textAlign: 'center', width: 'min(460px, 100%)' }}>
          <span className="eyebrow">You are Secret Santa to</span>
          <div className="reveal-name">{rec.code_name}</div>
          <p className="muted">Participant {padNo(rec.number)}</p>
          {rec.display_name && <p style={{ fontSize: '1.15rem' }}>That’s <strong>{rec.display_name}</strong>.</p>}
          <p className="small muted">This is final — and it’s your secret to keep.</p>
          <Link className="btn" href={`/room/${roomId}/recipient`}>Open their Christmas Identity →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="draw-stage">
      <div className={`envelope ${phase === 'drawing' ? 'shaking' : 'idle'}`}>
        <div className="seal">S</div>
      </div>
      <div className="shuffle" aria-live="polite">{phase === 'drawing' ? shuffle : ''}</div>
      {phase === 'idle' && (
        <>
          <p className="muted" style={{ maxWidth: 380 }}>Somewhere in this envelope is the name of the person you’ll surprise this Christmas.</p>
          <button className="btn btn-invite" onClick={draw}>Open the envelope ✦</button>
        </>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
