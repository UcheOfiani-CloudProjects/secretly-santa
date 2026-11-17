'use client';
import { useState } from 'react';

type Key = 'registration_deadline' | 'draw_date' | 'exchange_date';
const META: Record<Key, { label: string; cls: string; dot: string }> = {
  registration_deadline: { label: 'Registration closes', cls: 'reg', dot: '#D8B66F' },
  draw_date: { label: 'The Big Draw', cls: 'draw', dot: '#B51F35' },
  exchange_date: { label: 'Gift exchange', cls: 'gift', dot: '#29483B' },
};
const ORDER: Key[] = ['registration_deadline', 'draw_date', 'exchange_date'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const pretty = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Pick a day';

/** Calendar for choosing three key days. Values are "YYYY-MM-DD" strings. */
export default function DayPicker({ value, onChange, lockedReg = false }: {
  value: Record<Key, string>; onChange: (k: Key, day: string) => void; lockedReg?: boolean;
}) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
  const start = value.registration_deadline || value.draw_date || todayStr;
  const [active, setActive] = useState<Key>('registration_deadline');
  const [view, setView] = useState(() => { const [y, m] = start.split('-').map(Number); return { y, m: m - 1 }; });

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) =>
    `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)];
  const monthName = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const move = (n: number) => setView(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const owner = (day: string) => ORDER.find((k) => value[k] === day);

  return (
    <div className="daypick">
      <div className="dp-tabs">
        {ORDER.map((k) => (
          <button type="button" key={k} className={`dp-tab dp-${META[k].cls} ${active === k ? 'on' : ''}`} onClick={() => setActive(k)}>
            {META[k].label}
          </button>
        ))}
      </div>
      <div className="dp-head">
        <button type="button" className="dp-nav" onClick={() => move(-1)} aria-label="Previous month">‹</button>
        <h3>{monthName}</h3>
        <button type="button" className="dp-nav" onClick={() => move(1)} aria-label="Next month">›</button>
      </div>
      <div className="dp-grid">
        {DOW.map((d, i) => <div key={i} className="dp-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const o = owner(day);
          const disabled = day < todayStr || (lockedReg && active === 'registration_deadline');
          return (
            <button type="button" key={i} disabled={disabled} className={`dp-day ${o ? 'd-' + META[o].cls : ''}`}
              onClick={() => onChange(active, day)}>{Number(day.slice(8))}</button>
          );
        })}
      </div>
      <div className="dp-sum">
        {ORDER.map((k) => (
          <div className="dp-row" key={k}><i style={{ background: META[k].dot }} />{META[k].label}<b>{pretty(value[k])}</b></div>
        ))}
      </div>
    </div>
  );
}
