'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function JoinForm({ code, roomId }: { code: string; roomId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form className="card card-gold stack" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError('');
      const { error } = await supabaseBrowser().rpc('join_room', { p_code: code, p_display_name: name });
      setBusy(false);
      if (error) setError(error.message); else { router.push(`/room/${roomId}/identity?welcome=1`); router.refresh(); }
    }}>
      <h2>What should we call you?</h2>
      <p className="muted">Only the organiser sees your real name. Everyone else will know you by a secret Christmas code name, chosen for you when you join.</p>
      <div>
        <label htmlFor="dn">Your name</label>
        <input id="dn" required maxLength={60} autoComplete="name" placeholder="Your full or preferred name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn btn-block" disabled={busy}>{busy ? <span className="loader" /> : 'Join the room'}</button>
    </form>
  );
}
