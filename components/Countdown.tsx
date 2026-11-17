'use client';
import { useEffect, useState } from 'react';

export default function Countdown({ to, label }: { to: string; label: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  const ms = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <span className="eyebrow">{label}</span>
      <div className="countdown">
        <div><strong>{d}</strong><span>days</span></div>
        <div><strong>{h}</strong><span>hrs</span></div>
        <div><strong>{m}</strong><span>min</span></div>
        <div><strong>{s}</strong><span>sec</span></div>
      </div>
    </div>
  );
}
