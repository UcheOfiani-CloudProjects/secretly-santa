import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import SignIn from '@/components/SignIn';
import JoinForm from '@/components/JoinForm';

export const dynamic = 'force-dynamic';

export default async function Join({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.rpc('room_preview', { p_code: code });
  const room = data?.[0];

  if (!room) {
    return (
      <main className="page fade-in">
        <TopBar signedIn={!!user} back={{ href: '/home', label: 'Home' }} />
        <div className="card stack">
          <h2>No room by that name</h2>
          <p className="muted">Double-check the code with your organiser. It’s 6 letters and numbers.</p>
          <Link className="btn" href="/home">Back home</Link>
        </div>
      </main>
    );
  }

  if (user) {
    const { data: me } = await supabase.from('participants').select('id').eq('room_id', room.room_id).maybeSingle();
    if (me) redirect(`/room/${room.room_id}`);
  }

  const closed = room.status !== 'open' || new Date(room.registration_deadline) < new Date();

  return (
    <main className="page fade-in">
      <TopBar signedIn={!!user} />
      <div className="stack-lg">
        <div className="card-ivory ticket">
          <div className="ticket-top">
            <span className="eyebrow" style={{ color: 'var(--cranberry)' }}>You’ve been invited</span>
            <h1 style={{ color: 'var(--cranberry)', fontSize: '1.9rem', marginTop: 8, textShadow: 'none' }}>{room.name}</h1>
            {room.description && <p style={{ color: 'rgba(86,24,39,.72)', fontSize: '.9rem', marginTop: 8 }}>{room.description}</p>}
          </div>
          <div className="ticket-perf" />
          <div className="ticket-days">
            {[['Sign-up closes', room.registration_deadline, '#8E182C'], ['The big draw', room.draw_date, '#D8B66F'], ['Gift exchange', room.exchange_date, '#29483B']].map(([l, d, c]) => {
              const dt = new Date(d as string);
              return (
                <div key={l} className="tday"><i style={{ background: c as string }} />
                  <small>{l}</small>
                  <b>{dt.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Africa/Lagos' })}</b>
                  <em>{dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Africa/Lagos' }).toUpperCase()}</em>
                </div>
              );
            })}
          </div>
          <div className="ticket-bottom">
            <span className="pill">{room.participant_count} joined</span>
            {room.budget_note && <span className="pill pill-gold">Budget {room.budget_note}</span>}
          </div>
        </div>
        {closed ? (
          <div className="card stack">
            <h2>Registration has closed</h2>
            <p className="muted">This room has filled up with Santas and closed its doors. If you already joined, sign in to get back to it.</p>
            {!user && <SignIn next={`/join/${code}`} />}
          </div>
        ) : user ? (
          <JoinForm code={code} roomId={room.room_id} />
        ) : (
          <SignIn next={`/join/${code}`} intro="First, sign in with your email. We’ll send a short code, and that’s how you’ll get back into your room later." />
        )}
      </div>
    </main>
  );
}
