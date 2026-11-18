'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { IDENTITY_FIELDS, type Identity } from '@/lib/identity';

export default function IdentityForm({ roomId, initial, locked }: { roomId: string; initial: Identity; locked: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<Identity>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const toggle = (k: 'colours' | 'treats' | 'gift_types', opt: string) => {
    const list = (v[k] ?? '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    const has = list.some((x) => x.toLowerCase() === opt.toLowerCase());
    const next = has ? list.filter((x) => x.toLowerCase() !== opt.toLowerCase()) : [...list, opt];
    setSaved(false); setV({ ...v, [k]: next.join(', ') });
  };
  const isOn = (k: 'colours' | 'treats' | 'gift_types', opt: string) => (v[k] ?? '').split(/[,;]/).some((x) => x.trim().toLowerCase() === opt.toLowerCase());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setSaved(false);
    const val = (k: string) => (v[k as keyof Identity] ?? '').toString().trim() || null;
    const { error } = await supabaseBrowser().rpc('save_identity', {
      p_room: roomId, p_loves: val('loves'), p_wants: val('wants'), p_needs: val('needs'), p_colours: val('colours'),
      p_treats: val('treats'), p_gift_types: val('gift_types'), p_avoid: val('avoid'), p_notes: val('notes'),
    });
    setBusy(false);
    if (error) setError(error.message); else { setSaved(true); router.replace(`/room/${roomId}/identity?sealed=1`); router.refresh(); }
  };

  return (
    <form onSubmit={submit} className="card-ivory stack-lg">
      {IDENTITY_FIELDS.map((f) => (
        <div key={f.key} className="idfield">
          <label htmlFor={f.key}><h3>{f.title}{'required' in f && f.required ? '' : <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'rgba(86,24,39,0.5)' }}> · optional</span>}</h3></label>
          {f.hint && <p className="hint" style={{ marginTop: 0, marginBottom: 8 }}>{f.hint}</p>}
          {!locked && (f.key === 'colours' || f.key === 'treats' || f.key === 'gift_types') && (
            <div className="chip-row">
              {(f.key === 'colours' ? ['Cranberry', 'Gold', 'Forest green', 'Blush', 'Navy', 'Black', 'White'] : f.key === 'gift_types' ? ['Men’s gifts', 'Women’s gifts', 'Unisex, anything goes'] : ['Chin chin', 'Chocolate', 'Popcorn', 'Fruit', 'Biscuits', 'Puff puff']).map((o) => (
                <button type="button" key={o} className={`chip ${isOn(f.key as 'colours' | 'treats' | 'gift_types', o) ? 'on' : ''}`} onClick={() => toggle(f.key as 'colours' | 'treats' | 'gift_types', o)}>{o}</button>
              ))}
            </div>
          )}
          {locked ? (
            <p className="value">{v[f.key] || <span className="muted">Not shared</span>}</p>
          ) : f.rows === 1 ? (
            <input id={f.key} maxLength={f.max} placeholder={f.placeholder} value={v[f.key] ?? ''} onChange={(e) => { setSaved(false); setV({ ...v, [f.key]: e.target.value }); }} />
          ) : (
            <textarea id={f.key} maxLength={f.max} rows={f.rows + 1} required={'required' in f && f.required} placeholder={f.placeholder} value={v[f.key] ?? ''} onChange={(e) => { setSaved(false); setV({ ...v, [f.key]: e.target.value }); }} />
          )}
        </div>
      ))}
      {!locked && (
        <>
          {error && <div className="error">{error}</div>}
                    <button className="btn btn-block" disabled={busy}>{busy ? <span className="loader" /> : 'SEAL MY IDENTITY →'}</button>
        </>
      )}
    </form>
  );
}
