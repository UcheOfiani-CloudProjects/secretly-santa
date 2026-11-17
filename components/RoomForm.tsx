'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export type RoomValues = {
  id?: string; name: string; description: string; registration_deadline: string; draw_date: string; exchange_date: string;
  budget_note: string; rules: string; announcement: string; reveal_mode: 'mystery' | 'reveal'; name_theme: 'treats' | 'winter' | 'ornaments'; status?: string;
};

const toLocal = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};
const fromLocal = (v: string) => new Date(v).toISOString();

const THEMES = [
  { v: 'treats', label: 'Christmas treats', eg: 'Velvet Cocoa, Honey Gingerbread, Sugared Puff Puff' },
  { v: 'winter', label: 'Winter night', eg: 'Silver Comet, Moonlit Lantern, Frosted Pine' },
  { v: 'ornaments', label: 'Ornaments', eg: 'Golden Bauble, Velvet Ribbon, Ruby Bell' },
] as const;

export default function RoomForm({ initial }: { initial?: RoomValues }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const locked = initial?.status === 'drawn';
  const [v, setV] = useState<RoomValues>(initial ?? {
    name: '', description: '', registration_deadline: '', draw_date: '', exchange_date: '',
    budget_note: '', rules: '', announcement: '', reveal_mode: 'mystery', name_theme: 'treats',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const set = (k: keyof RoomValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setSaved(false); setV({ ...v, [k]: e.target.value }); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    const sb = supabaseBrowser();
    if (editing) {
      const { error } = await sb.rpc('update_room', {
        p_room: v.id, p_name: v.name, p_description: v.description,
        p_registration_deadline: v.registration_deadline, p_draw_date: v.draw_date, p_exchange_date: v.exchange_date,
        p_budget_note: v.budget_note, p_rules: v.rules, p_announcement: v.announcement, p_reveal_mode: v.reveal_mode,
      });
      setBusy(false);
      if (error) setError(error.message); else { setSaved(true); router.refresh(); }
    } else {
      const { data, error } = await sb.rpc('create_room', {
        p_name: v.name, p_description: v.description,
        p_registration_deadline: v.registration_deadline, p_draw_date: v.draw_date, p_exchange_date: v.exchange_date,
        p_budget_note: v.budget_note, p_rules: v.rules, p_reveal_mode: v.reveal_mode, p_name_theme: v.name_theme,
      });
      setBusy(false);
      if (error) setError(error.message); else router.push(`/room/${data}/organise`);
    }
  };

  const dateInput = (k: 'registration_deadline' | 'draw_date' | 'exchange_date', label: string, hint: string, disabled = false) => (
    <div>
      <label htmlFor={k}>{label}</label>
      <input id={k} type="datetime-local" required disabled={disabled} value={toLocal(v[k])}
        onChange={(e) => { setSaved(false); setV({ ...v, [k]: e.target.value ? fromLocal(e.target.value) : '' }); }} />
      <p className="hint">{hint}</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="stack-lg">
      <div className="card stack">
        <h3>The basics</h3>
        <div>
          <label htmlFor="name">Room name</label>
          <input id="name" required maxLength={80} placeholder="Follow-Up Department Christmas Exchange" value={v.name} onChange={set('name')} />
        </div>
        <div>
          <label htmlFor="description">A short welcome (optional)</label>
          <textarea id="description" maxLength={600} placeholder="Welcome! Fill in your Christmas Identity so your Secret Santa knows what you love." value={v.description} onChange={set('description')} />
        </div>
        <div>
          <label htmlFor="budget">Gift budget (optional)</label>
          <input id="budget" maxLength={120} placeholder="₦10,000 – ₦15,000" value={v.budget_note} onChange={set('budget_note')} />
        </div>
      </div>

      <div className="card stack">
        <h3>Key dates</h3>
        {dateInput('registration_deadline', 'Registration closes', 'After this, nobody can join and profiles are locked.', locked)}
        {dateInput('draw_date', 'The Big Draw opens', 'From this moment, everyone can tap to reveal who they’re buying for.')}
        {dateInput('exchange_date', 'Gift exchange', 'When everyone hands over their gifts.')}
      </div>

      <div className="card stack">
        <h3>How mysterious?</h3>
        <div className="choice">
          <label>
            <input type="radio" name="mode" checked={v.reveal_mode === 'mystery'} disabled={locked} onChange={() => setV({ ...v, reveal_mode: 'mystery' })} />
            <strong>Mystery mode</strong>
            <span className="hint" style={{ display: 'block' }}>Santas only ever see a code name. Best when there’s an exchange event — gifts are tagged with the code name.</span>
          </label>
          <label>
            <input type="radio" name="mode" checked={v.reveal_mode === 'reveal'} disabled={locked} onChange={() => setV({ ...v, reveal_mode: 'reveal' })} />
            <strong>Reveal mode</strong>
            <span className="hint" style={{ display: 'block' }}>The real name appears after the code-name reveal. Best for remote groups or families.</span>
          </label>
        </div>
        {!editing && (
          <div>
            <label htmlFor="theme">Code-name theme</label>
            <select id="theme" value={v.name_theme} onChange={set('name_theme')}>
              {THEMES.map((t) => <option key={t.v} value={t.v}>{t.label} — e.g. {t.eg}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="card stack">
        <h3>Rules & announcements</h3>
        <div>
          <label htmlFor="rules">House rules (optional)</label>
          <textarea id="rules" maxLength={1000} placeholder="Wrap your gift and tag it with your recipient’s code name. Bring it to the department meeting." value={v.rules} onChange={set('rules')} />
        </div>
        {editing && (
          <div>
            <label htmlFor="announcement">Announcement (shows at the top of the room)</label>
            <textarea id="announcement" maxLength={1000} placeholder="Reminder: registration closes Sunday night!" value={v.announcement} onChange={set('announcement')} />
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {saved && <div className="success">Saved.</div>}
      <button className="btn btn-block" disabled={busy}>{busy ? <span className="loader" /> : editing ? 'Save changes' : 'Create my Christmas room'}</button>
    </form>
  );
}
