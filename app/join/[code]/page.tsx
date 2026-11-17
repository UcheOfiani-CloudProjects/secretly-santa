import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import SignIn from '@/components/SignIn';
import JoinForm from '@/components/JoinForm';
import { fmtDate } from '@/lib/format';

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
          <h2>We couldn’t find that room</h2>
          <p className="muted">Check the code with your organiser — it’s 6 letters and numbers.</p>
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
        <div className="stack" style={{ gap: 10 }}>
          <span className="eyebrow">You’ve been invited</span>
          <h1>{room.name}</h1>
          {room.description && <p className="muted">{room.description}</p>}
          <div className="row" style={{ gap: 8 }}>
            <span className="pill">{room.participant_count} joined</span>
            <span className="pill">Registration closes {fmtDate(room.registration_deadline)}</span>
            {room.budget_note && <span className="pill pill-gold">Budget {room.budget_note}</span>}
          </div>
        </div>
        {closed ? (
          <div className="card stack">
            <h2>Registration has closed</h2>
            <p className="muted">This room isn’t taking new people any more. If you already joined, sign in to get back to it.</p>
            {!user && <SignIn next={`/join/${code}`} />}
          </div>
        ) : user ? (
          <JoinForm code={code} roomId={room.room_id} />
        ) : (
          <SignIn next={`/join/${code}`} intro="First, sign in with your email. We’ll send a short code — this is how you’ll get back into your room later." />
        )}
      </div>
    </main>
  );
}
