'use client';
import { useState } from 'react';

type Gift = { title: string; why: string; price_range: string; where: string; category: string };

export default function Concierge({ roomId, defaultBudget }: { roomId: string; defaultBudget?: string }) {
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [budget, setBudget] = useState(defaultBudget ?? '');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [tip, setTip] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch('/api/concierge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, budget: Number(budget.replace(/[^\d.]/g, '')), currency, location }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? 'Something went wrong.');
      setGifts(j.suggestions); setTip(j.tip ?? ''); setRemaining(j.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setBusy(false); }
  };

  return (
    <div className="card card-gold stack-lg">
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Gift Concierge</span>
        <h2>Ideas made for them, not for anyone</h2>
        <p className="muted small">Suggestions are based on what your recipient actually wrote. Prices are rough guides — always check before you buy.</p>
      </div>
      <form onSubmit={ask} className="stack">
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 110px' }}>
            <label htmlFor="cur">Currency</label>
            <select id="cur" value={currency} onChange={(e) => setCurrency(e.target.value as 'NGN' | 'USD')}>
              <option value="NGN">₦ Naira</option>
              <option value="USD">$ Dollars</option>
            </select>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label htmlFor="budget">Your budget</label>
            <input id="budget" required inputMode="numeric" placeholder={currency === 'NGN' ? '15000' : '25'} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label htmlFor="loc">Where you’re shopping</label>
            <input id="loc" maxLength={60} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn btn-green btn-block" disabled={busy || !budget}>{busy ? <><span className="loader" /> Thinking about them…</> : gifts.length ? 'Get fresh ideas' : 'Suggest gifts'}</button>
        {remaining !== null && <p className="hint" style={{ textAlign: 'center' }}>{remaining} request{remaining === 1 ? '' : 's'} left for this room</p>}
      </form>
      {gifts.length > 0 && (
        <div className="stack fade-in">
          {gifts.map((g, i) => (
            <div key={i} className="gift stack" style={{ gap: 6 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>{g.title}</h3>
                <span className="price">{g.price_range}</span>
              </div>
              <p className="small">{g.why}</p>
              <p className="small muted">Where: {g.where} · {g.category}</p>
            </div>
          ))}
          {tip && <p className="small muted" style={{ fontStyle: 'italic' }}>✦ {tip}</p>}
        </div>
      )}
    </div>
  );
}
