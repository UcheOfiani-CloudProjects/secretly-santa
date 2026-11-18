import Link from 'next/link';
import TopBar from '@/components/TopBar';
import BigDraw from '@/components/BigDraw';
import { loadRoom } from '@/lib/room';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, room, me } = await loadRoom(id, { requireMember: true });
  const [{ data: a }, { data: roster }] = await Promise.all([
    supabase.rpc('my_assignment', { p_room: id, p_reveal: false }),
    supabase.rpc('room_roster', { p_room: id }),
  ]);
  const decoys = ((roster ?? []) as { code_name: string; is_me: boolean }[]).filter((r) => !r.is_me).map((r) => r.code_name).sort(() => Math.random() - 0.5);

  return (
    <main className="page fade-in">
      <TopBar signedIn back={{ href: `/room/${id}`, label: 'Room' }} />
      <div className="stack" style={{ textAlign: 'center', alignItems: 'center', gap: 10 }}>
        <span className="eyebrow">{fmtDate(room.draw_date)} · Draw day</span>
        <h1>It’s time{me ? <>, <span className="codename">{me.code_name}</span></> : ''}.</h1>
        <p className="muted" style={{ maxWidth: 360 }}>Someone is counting on you this Christmas. Tap the envelope to find out who.</p>
        <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
          <span className="pill">{room.name}</span>
          {room.budget_note && <span className="pill pill-gold">Budget {room.budget_note}</span>}
        </div>
      </div>
      {a?.state === 'ready' || a?.state === 'revealed' ? (
        <BigDraw roomId={id} decoys={decoys} initial={a.state === 'revealed' ? a.recipient : null} />
      ) : (
        <div className="card stack" style={{ marginTop: 32, textAlign: 'center', alignItems: 'center' }}>
          <h2>Not quite yet</h2>
          <p className="muted">The envelope opens on <strong>{fmtDate(room.draw_date)}</strong>{a?.state === 'not_drawn' ? ', once the organiser has sealed the draw' : ''}.</p>
          <Link className="btn" href={`/room/${id}`}>Back to the room</Link>
        </div>
      )}
    </main>
  );
}
