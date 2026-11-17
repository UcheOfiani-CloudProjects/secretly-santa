import TopBar from '@/components/TopBar';
import IdentityForm from '@/components/IdentityForm';
import { loadRoom } from '@/lib/room';
import { fmtDate, padNo } from '@/lib/format';
import type { Identity } from '@/lib/identity';

export const dynamic = 'force-dynamic';

export default async function IdentityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { id } = await params;
  const { welcome } = await searchParams;
  const { supabase, room, me, registrationOpen } = await loadRoom(id, { requireMember: true });
  const { data } = await supabase.from('identities').select('loves,wants,needs,colours,treats,gift_types,avoid,notes').eq('participant_id', me!.id).maybeSingle();

  return (
    <main className="page fade-in">
      <TopBar signedIn back={{ href: `/room/${id}`, label: 'Room' }} />
      <div className="stack-lg">
        {welcome && (
          <div className="card card-gold stack" style={{ textAlign: 'center', alignItems: 'center' }}>
            <span className="eyebrow">Welcome to {room.name}</span>
            <p className="muted">From now on, you are</p>
            <h1 className="codename" style={{ fontSize: 'clamp(2.2rem, 8vw, 3rem)' }}>{me!.code_name}</h1>
            <p className="small muted">Participant {padNo(me!.number)} · This is the only name the room will see.</p>
          </div>
        )}
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Christmas Identity · {me!.code_name}</span>
          <h1>Help your Secret Santa get it right</h1>
          <p className="muted">
            {registrationOpen
              ? <>Only the person who draws you will see this. You can edit it until <strong>{fmtDate(room.registration_deadline)}</strong>.</>
              : 'Registration has closed, so your Christmas Identity is now locked.'}
          </p>
          {room.reveal_mode === 'mystery' && registrationOpen && (
            <p className="small muted">Tip: this room is in Mystery mode. Very specific details (your exact job, your children’s names) might give you away — keep it about what you like.</p>
          )}
        </div>
        <IdentityForm roomId={id} initial={(data ?? {}) as Identity} locked={!registrationOpen} />
      </div>
    </main>
  );
}
