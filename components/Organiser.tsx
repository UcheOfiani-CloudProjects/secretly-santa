'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { padNo } from '@/lib/format';

export type OrgParticipant = { id: string; number: number; code_name: string; display_name: string; profile_complete: boolean };

export function InviteCard({ code, roomName }: { code: string; roomName: string }) {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/join/${code}`;
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1800); } catch { /* ignore */ } };
  const msg = `🎄 You’re invited to "${roomName}" on Secretly Santa!\n\nJoin here: ${link}\n(or use room code ${code})`;
  return (
    <div className="card card-gold stack">
      <span className="eyebrow">Invite people</span>
      <div className="code">{code}</div>
      <p className="small muted" style={{ wordBreak: 'break-all' }}>{link}</p>
      <div className="row">
        <button className="btn btn-sm" onClick={() => copy(link, 'link')}>{copied === 'link' ? 'Copied ✓' : 'Copy link'}</button>
        <a className="btn btn-green btn-sm" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
        <button className="btn btn-ghost btn-sm" onClick={() => copy(msg, 'msg')}>{copied === 'msg' ? 'Copied ✓' : 'Copy invite message'}</button>
      </div>
    </div>
  );
}

export function ParticipantsPanel({ roomId, people, drawn }: { roomId: string; people: OrgParticipant[]; drawn: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const remove = async (p: OrgParticipant) => {
    setError(''); setMsg('');
    const { data, error } = await supabaseBrowser().rpc('remove_participant', { p_participant: p.id });
    setConfirming(null);
    if (error) { setError(error.message); return; }
    setMsg(drawn && data
      ? `${p.display_name} was removed. The person who was buying for them (${data}) has a new recipient and will need to open the envelope again, so let them know.`
      : `${p.display_name} was removed.`);
    router.refresh();
  };
  const complete = people.filter((p) => p.profile_complete).length;
  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>Participants</h3>
        <span className="pill">{people.length} joined · {complete} identities ready</span>
      </div>
      {people.length === 0 ? <p className="muted small">No one’s here yet. Send out your invite link.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>No.</th><th>Name</th><th className="hide-mobile">Code name</th><th>Identity</th><th></th></tr></thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>{padNo(p.number)}</td>
                  <td>{p.display_name}</td>
                  <td className="hide-mobile codename">{p.code_name}</td>
                  <td>{p.profile_complete ? <span className="pill pill-green">Ready</span> : <span className="pill">Pending</span>}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {confirming === p.id ? (
                      <span className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-sm" onClick={() => remove(p)}>Remove</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>Cancel</button>
                      </span>
                    ) : <button className="link-btn small" onClick={() => setConfirming(p.id)}>Remove</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export function ExclusionsPanel({ roomId, people, pairs }: { roomId: string; people: OrgParticipant[]; pairs: { a_id: string; b_id: string }[] }) {
  const router = useRouter();
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [error, setError] = useState('');
  const name = (id: string) => people.find((p) => p.id === id)?.display_name ?? '?';
  const set = async (x: string, y: string, on: boolean) => {
    setError('');
    const { error } = await supabaseBrowser().rpc('set_exclusion', { p_room: roomId, p_a: x, p_b: y, p_on: on });
    if (error) setError(error.message); else { setA(''); setB(''); router.refresh(); }
  };
  return (
    <div className="card stack">
      <h3>Keep apart</h3>
      <p className="small muted">Couples or family members who shouldn’t draw each other. Neither will be assigned the other.</p>
      {pairs.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          {pairs.map((p) => (
            <div key={p.a_id + p.b_id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{name(p.a_id)} <span className="muted">↔</span> {name(p.b_id)}</span>
              <button className="link-btn small" onClick={() => set(p.a_id, p.b_id, false)}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {people.length >= 2 && (
        <div className="row">
          <select value={a} onChange={(e) => setA(e.target.value)} style={{ flex: '1 1 160px' }}>
            <option value="">Choose person…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
          </select>
          <select value={b} onChange={(e) => setB(e.target.value)} style={{ flex: '1 1 160px' }}>
            <option value="">…and person</option>
            {people.filter((p) => p.id !== a).map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
          </select>
          <button className="btn btn-sm" disabled={!a || !b} onClick={() => set(a, b, true)}>Add</button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export function DrawPanel({ roomId, count, incomplete, deadlinePassed }: { roomId: string; count: number; incomplete: number; deadlinePassed: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async () => {
    setBusy(true); setError('');
    const { error } = await supabaseBrowser().rpc('run_draw', { p_room: roomId });
    setBusy(false); setConfirm(false);
    if (error) setError(error.message); else { fetch('/api/push/drawn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) }).catch(() => {}); router.refresh(); }
  };
  return (
    <div className="card card-gold stack">
      <span className="eyebrow">Close registration & seal the draw</span>
      <p className="muted small">
        This closes the room to new people, locks everyone’s Christmas Identity and secretly assigns every Santa. Nobody, including you, can see the assignments.
        Participants can open their envelopes from the draw date.
      </p>
      {!deadlinePassed && <p className="small">The registration deadline hasn’t passed yet. You can still seal early if everyone is in.</p>}
      {incomplete > 0 && <p className="small" style={{ color: 'var(--gold)' }}>{incomplete} {incomplete === 1 ? 'person hasn’t' : 'people haven’t'} finished their Christmas Identity.</p>}
      {count < 3 ? <p className="small muted">You need at least 3 participants.</p> : confirm ? (
        <div className="row">
          <button className="btn" onClick={run} disabled={busy}>{busy ? <span className="loader" /> : `Yes, seal the draw for ${count}`}</button>
          <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Not yet</button>
        </div>
      ) : (
        <button className="btn" onClick={() => setConfirm(true)}>Seal the draw</button>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
