import Link from 'next/link';
import { redirect } from 'next/navigation';
import TopBar from '@/components/TopBar';
import RoomForm from '@/components/RoomForm';
import { InviteCard, ParticipantsPanel, ExclusionsPanel, DrawPanel, type OrgParticipant } from '@/components/Organiser';
import { loadRoom } from '@/lib/room';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Organise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, room, me, isOrganiser } = await loadRoom(id);
  if (!isOrganiser) redirect(`/room/${id}`);
  const [{ data: ppl }, { data: pairs }] = await Promise.all([
    supabase.rpc('organiser_participants', { p_room: id }),
    supabase.rpc('organiser_exclusions', { p_room: id }),
  ]);
  const people = (ppl ?? []) as OrgParticipant[];
  const drawn = room.status === 'drawn';
  const deadlinePassed = new Date(room.registration_deadline) < new Date();

  return (
    <main className="page page-wide fade-in">
      <TopBar signedIn back={{ href: '/home', label: 'Home' }} />
      <div className="stack-lg">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Organiser</span>
          <h1>{room.name}</h1>
          <div className="row" style={{ gap: 8 }}>
            <span className={`pill ${drawn ? 'pill-gold' : 'pill-green'}`}>{drawn ? 'Draw sealed' : deadlinePassed ? 'Deadline passed — ready to seal' : 'Registration open'}</span>
            <span className="pill">{room.reveal_mode === 'mystery' ? 'Mystery mode' : 'Reveal mode'}</span>
            {me ? <Link className="pill pill-gold" href={`/room/${id}`}>Go to my room view →</Link> : null}
          </div>
          {!me && !drawn && <p className="small muted">Taking part yourself? Open your own invite link and join like everyone else.</p>}
        </div>

        <div className="grid-2">
          {!drawn ? <InviteCard code={room.join_code} roomName={room.name} /> : (
            <div className="card card-gold stack">
              <span className="eyebrow">Draw sealed</span>
              <h3>Everyone has a Secret Santa</h3>
              <p className="small muted">Envelopes open on {fmtDate(room.draw_date)}. If someone drops out, remove them below — their Santa is automatically given a new recipient and nobody else is affected.</p>
            </div>
          )}
          {!drawn && <DrawPanel roomId={id} count={people.length} incomplete={people.filter((p) => !p.profile_complete).length} deadlinePassed={deadlinePassed} />}
        </div>

        <ParticipantsPanel roomId={id} people={people} drawn={drawn} />
        {!drawn && <ExclusionsPanel roomId={id} people={people} pairs={(pairs ?? []) as { a_id: string; b_id: string }[]} />}

        <div className="stack" style={{ gap: 8 }}>
          <h2>Room settings</h2>
        </div>
        <RoomForm initial={{
          id: room.id, name: room.name, description: room.description ?? '', registration_deadline: room.registration_deadline,
          draw_date: room.draw_date, exchange_date: room.exchange_date, budget_note: room.budget_note ?? '', rules: room.rules ?? '',
          announcement: room.announcement ?? '', reveal_mode: room.reveal_mode, name_theme: room.name_theme, status: room.status,
        }} />
      </div>
    </main>
  );
}
