import Link from 'next/link';
import TopBar from '@/components/TopBar';
import BigDraw from '@/components/BigDraw';
import { loadRoom } from '@/lib/room';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, room } = await loadRoom(id, { requireMember: true });
  const [{ data: a }, { data: roster }] = await Promise.all([
    supabase.rpc('my_assignment', { p_room: id, p_reveal: false }),
    supabase.rpc('room_roster', { p_room: id }),
  ]);
  const decoys = ((roster ?? []) as { code_name: string; is_me: boolean }[]).filter((r) => !r.is_me).map((r) => r.code_name).sort(() => Math.random() - 0.5);

  return (
    <main className="page fade-in">
      <TopBar signedIn back={{ href: `/room/${id}`, label: 'Room' }} />
      <div className="stack" style={{ textAlign: 'center', alignItems: 'center', gap: 10 }}>
        <span className="eyebrow">The Big Draw · {room.name}</span>
        <h1>Who will you surprise?</h1>
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
