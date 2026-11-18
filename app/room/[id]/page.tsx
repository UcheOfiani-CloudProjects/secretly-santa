import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Countdown from '@/components/Countdown';
import AdventStrip from '@/components/AdventStrip';
import IdentityCard from '@/components/IdentityCard';
import { loadRoom } from '@/lib/room';
import { fmtDate, nextEvent, padNo } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Roster = { number: number; code_name: string; is_me: boolean; profile_complete: boolean }[];
type Assignment = { state: 'not_drawn' | 'waiting' | 'ready' | 'revealed'; draw_date: string; recipient?: { code_name: string; number: number; display_name: string | null } };

export default async function RoomHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, room, me, isOrganiser, registrationOpen } = await loadRoom(id, { requireMember: true });
  const [{ data: roster }, { data: assignment }, { data: identity }] = await Promise.all([
    supabase.rpc('room_roster', { p_room: id }),
    supabase.rpc('my_assignment', { p_room: id, p_reveal: false }),
    supabase.from('identities').select('loves,wants,needs,colours,treats,gift_types,avoid,notes').eq('participant_id', me!.id).maybeSingle(),
  ]);
  const list = (roster ?? []) as Roster;
  const a = assignment as Assignment;
  const ev = nextEvent(room);
  const profileDone = !!(identity?.loves && identity?.wants);

  return (
    <main className="page fade-in">
      <TopBar signedIn back={{ href: '/home', label: 'Home' }} />
      <div className="stack-lg">
        <div className="stack" style={{ gap: 10 }}>
          <span className="eyebrow">Christmas room</span>
          <h1>{room.name}</h1>
          {room.description && <p className="muted">{room.description}</p>}
          <div className="row" style={{ gap: 8 }}>
            <span className={`pill ${registrationOpen ? 'pill-green' : ''}`}>{registrationOpen ? 'Registration open' : room.status === 'drawn' ? 'Draw complete' : 'Registration closed'}</span>
            <span className="pill">{list.length} participants</span>
            {room.budget_note && <span className="pill pill-gold">Budget {room.budget_note}</span>}
            {isOrganiser && <Link href={`/room/${id}/organise`} className="pill pill-gold">Manage room →</Link>}
          </div>
        </div>

        {room.announcement && (
          <div className="card card-gold stack" style={{ gap: 6 }}>
            <span className="eyebrow">Announcement</span>
            <p style={{ whiteSpace: 'pre-wrap' }}>{room.announcement}</p>
          </div>
        )}

        {ev && <div className="card stack"><Countdown to={ev.at} label={ev.label} /><AdventStrip reg={room.registration_deadline} draw={room.draw_date} gift={room.exchange_date} /></div>}

        {profileDone && (
          <div className="stack" style={{ gap: 10 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="eyebrow">My Christmas Identity</span>
              <Link className="pill pill-gold" href={`/room/${id}/identity`}>{registrationOpen ? 'View / edit →' : 'View →'}</Link>
            </div>
            <IdentityCard compact codeName={me!.code_name} number={padNo(me!.number)} roomName={room.name} identity={identity as never} />
          </div>
        )}

        {/* The Big Draw */}
        <div className="card card-gold stack">
          <span className="eyebrow">The Big Draw</span>
          {a.state === 'revealed' && a.recipient ? (
            <>
              <h2>You’re Secret Santa to <span className="codename">{a.recipient.code_name}</span></h2>
              {a.recipient.display_name && <p className="muted">That’s {a.recipient.display_name}. Keep it secret!</p>}
              <div className="row">
                <Link className="btn" href={`/room/${id}/recipient`}>Open their Christmas Identity</Link>
              </div>
            </>
          ) : a.state === 'ready' ? (
            <>
              <h2>Your recipient is waiting</h2>
              <p className="muted">The names are in! Open your envelope when you’re ready. Once it’s open, it’s yours to keep secret.</p>
              <Link className="btn btn-invite" href={`/room/${id}/draw`}>Discover my recipient →</Link>
            </>
          ) : a.state === 'waiting' ? (
            <>
              <h2>Names are drawn and sealed</h2>
              <p className="muted">Come back on <strong>{fmtDate(room.draw_date)}</strong> to discover who you’re buying for.</p>
            </>
          ) : (
            <>
              <h2>Not drawn yet</h2>
              <p className="muted">Once registration closes, the organiser seals the draw. It opens to everyone on <strong>{fmtDate(room.draw_date)}</strong>.</p>
            </>
          )}
        </div>

        {/* My identity */}
        <div className="card-ivory stack">
          <span className="eyebrow">Your secret identity</span>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <p className="muted small">Participant {padNo(me!.number)}</p>
              <h2 style={{ fontSize: '2rem' }}>{me!.code_name}</h2>
            </div>
          </div>
          <p className="muted">
            {profileDone ? 'Your Christmas Identity is filled in. Only your Secret Santa will ever see it.' : 'Your Secret Santa can’t see anything about you yet. Fill in your Christmas Identity so they can choose something you’ll love.'}
          </p>
          <div className="row">
            <Link className="btn" href={`/room/${id}/identity`}>
              {registrationOpen ? (profileDone ? 'Edit my Christmas Identity' : 'Fill in my Christmas Identity') : 'View my Christmas Identity'}
            </Link>
          </div>
        </div>

        <div className="grid-2">
          <div className="card stack" style={{ gap: 10 }}>
            <h3>Key dates</h3>
            <p className="small"><span className="muted">Registration closes</span><br />{fmtDate(room.registration_deadline)}</p>
            <p className="small"><span className="muted">The Big Draw</span><br />{fmtDate(room.draw_date)}</p>
            <p className="small"><span className="muted">Gift exchange</span><br />{fmtDate(room.exchange_date)}</p>
          </div>
          {room.rules && (
            <div className="card stack" style={{ gap: 10 }}>
              <h3>House rules</h3>
              <p className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{room.rules}</p>
            </div>
          )}
        </div>

        <div className="card stack">
          <h3>Who’s in the room</h3>
          <p className="small muted">Everyone appears by code name only.</p>
          <div className="roster">
            {list.map((p) => (
              <div key={p.number} className={`roster-item ${p.is_me ? 'me' : ''}`}>
                <div className="roster-no">{padNo(p.number)}{p.is_me ? ' · you' : ''}</div>
                <div className="codename">{p.code_name}</div>
                <div className="small" style={{ color: p.profile_complete ? 'var(--gold)' : 'var(--ivory-50)' }}>{p.profile_complete ? '✦ Identity ready' : 'Still writing…'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
