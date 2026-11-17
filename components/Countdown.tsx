'use client';
import { useEffect, useState } from 'react';
import { daysUntil } from '@/lib/format';

export default function Countdown({ to, label }: { to: string; label: string }) {
  const [d, setD] = useState<number | null>(null);
  useEffect(() => { setD(daysUntil(to)); }, [to]);
  if (d === null) return null;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <span className="eyebrow">{label}</span>
      <div className="countdown">
        <div><strong>{d}</strong><span>{d === 1 ? 'day' : 'days'}</span></div>
      </div>
    </div>
  );
}
