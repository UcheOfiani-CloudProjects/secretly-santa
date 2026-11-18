import TopBar from '@/components/TopBar';
import IdentityForm from '@/components/IdentityForm';
import { loadRoom } from '@/lib/room';
import { fmtDate, padNo } from '@/lib/format';
import type { Identity } from '@/lib/identity';
import IdentityCard from '@/components/IdentityCard';
import CodeNameReveal from '@/components/CodeNameReveal';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IdentityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string; edit?: string; sealed?: string }> }) {
  const { id } = await params;
  const { welcome, edit, sealed } = await searchParams;
  const { supabase, room, me, registrationOpen } = await loadRoom(id, { requireMember: true });
  const { data } = await supabase.from('identities').select('loves,wants,needs,colours,treats,gift_types,avoid,notes').eq('participant_id', me!.id).maybeSingle();

  const ident = (data ?? {}) as Identity;
  const done = !!(ident.loves && ident.wants);

  if (welcome) {
    const first = (me!.display_name ?? '').split(' ')[0];
    return <main className="page fade-in"><CodeNameReveal firstName={first} codeName={me!.code_name} number={padNo(me!.number)} roomName={room.name} next={`/room/${id}/identity`} /></main>;
  }

  if (done && !edit) {
    return (
      <main className="page fade-in">
        <TopBar signedIn back={{ href: `/room/${id}`, label: 'Room' }} />
        <div className="stack-lg">
          <div className="stack" style={{ gap: 8 }}>
            <span className="eyebrow">{sealed ? 'Sealed ✦' : 'My profile'}</span>
            <h1>{sealed ? 'Your identity is sealed' : 'My Christmas Identity'}</h1>
            <p className="muted">This is what your Secret Santa will read. {registrationOpen ? <>You can still change it until <strong>{fmtDate(room.registration_deadline)}</strong>.</> : 'Registration has closed, so it’s locked in.'}</p>
          </div>
          <div className={sealed ? 'unsealed' : ''}><IdentityCard codeName={me!.code_name} number={padNo(me!.number)} roomName={room.name} identity={ident} /></div>
          <div className="row" style={{ gap: 10 }}>
            <Link className="btn" href={`/room/${id}`}>Go to my room</Link>
            {registrationOpen && <Link className="btn btn-ghost" href={`/room/${id}/identity?edit=1`}>Edit my identity</Link>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page fade-in">
      <TopBar signedIn back={{ href: `/room/${id}`, label: 'Room' }} />
      <div className="stack-lg">
        <div className="stack" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">Step 2 of 3</span></div>
          <div className="progress"><i style={{ width: '66%' }} /></div>
          <h1>Your Christmas <span style={{ color: 'var(--gold)' }}>Identity</span></h1>
          <p className="muted">
            {registrationOpen
              ? <>Your Secret Santa will read this card. You can edit it until <strong>{fmtDate(room.registration_deadline)}</strong>.</>
              : 'Registration has closed, so your Christmas Identity is now locked.'}
          </p>
          {room.reveal_mode === 'mystery' && registrationOpen && (
            <p className="small muted">Tip: this room is in Mystery mode. Very specific details (your exact job, your children’s names) might give you away, so keep it about what you love.</p>
          )}
        </div>
        <div className="card-ivory" style={{ paddingBottom: 0 }}>
          <div className="keep-head" style={{ borderBottom: '2px dashed rgba(86,24,39,.2)', paddingBottom: 16 }}>
            <span className="wax wax-sm" aria-hidden>S</span>
            <div><div className="keep-eyebrow">Code name</div><div className="keep-name">{me!.code_name}</div></div>
          </div>
        </div>
        <IdentityForm roomId={id} initial={ident} locked={!registrationOpen} />
      </div>
    </main>
  );
}
