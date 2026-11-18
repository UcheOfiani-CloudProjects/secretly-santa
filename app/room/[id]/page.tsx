import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Wordmark from '@/components/Wordmark';
import AdventStrip from '@/components/AdventStrip';
import IdentityCard from '@/components/IdentityCard';
import { loadRoom } from '@/lib/room';
import { fmtDate, fmtLong, daysUntil, nextEvent, padNo } from '@/lib/format';

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
      <div className="room-bar">
        <Wordmark size="sm" href="/home" />
        <Link href={`/room/${id}/identity`} className="chip-me" aria-label="My profile">
          <span>{me!.code_name.charAt(0)}</span>{me!.code_name}
        </Link>
      </div>
      <div className="stack-lg">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Your room</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 7vw, 2.2rem)', lineHeight: 1.1 }}>{room.name}</h1>
          {room.description && <p className="muted">{room.description}</p>}
          <div className="row" style={{ gap: 8 }}>
            <span className="pill">{list.length} {list.length === 1 ? 'Santa' : 'Santas'}</span>
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

        {ev && (
          <div className="hero">
            <span className="hero-eyebrow">{ev.label}</span>
            <div className="hero-num">{daysUntil(ev.at)}</div>
            <div className="hero-unit">{daysUntil(ev.at) === 1 ? 'day to go' : 'days to go'}</div>
            <span className="hero-date">{fmtLong(ev.at)}</span>
          </div>
        )}

        <div className="stack" style={{ gap: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ fontSize: '1.4rem' }}>The countdown</h2>
            <span className="eyebrow" style={{ color: 'var(--ivory-50)' }}>{new Date().toLocaleDateString('en-GB', { month: 'long', timeZone: 'Africa/Lagos' })}</span>
          </div>
          <AdventStrip reg={room.registration_deadline} draw={room.draw_date} gift={room.exchange_date} />
        </div>

        <div className="steps">
          <Link href={`/room/${id}/identity`} className={`step ${profileDone ? 'step-done' : 'step-now'}`}>
            <i className="step-dot" style={{ background: profileDone ? 'var(--evergreen)' : 'var(--red)' }}>{profileDone ? '✓' : '1'}</i>
            <div><b>{profileDone ? 'Identity sealed' : 'Fill in your Christmas Identity'}</b><small>{profileDone ? 'Your Santa knows what you love.' : 'So your Santa can choose something you’ll love.'}</small></div>
          </Link>
          {a.state === 'ready' ? (
            <Link href={`/room/${id}/draw`} className="step step-now">
              <i className="step-dot" style={{ background: 'var(--red)' }}>✦</i>
              <div><b>Open your envelope</b><small>The names are in. Tap to meet your person.</small></div>
            </Link>
          ) : a.state === 'revealed' ? (
            <div className="step step-done">
              <i className="step-dot" style={{ background: 'var(--evergreen)' }}>✓</i>
              <div><b>Big draw done</b><small>You know who you’re Secret Santa to.</small></div>
            </div>
          ) : (
            <div className="step step-now">
              <i className="step-dot" style={{ background: 'var(--red)' }}>2</i>
              <div><b>Wait for the big draw</b><small>Opens on {fmtDate(room.draw_date)}.</small></div>
            </div>
          )}
          {a.state === 'revealed' && a.recipient ? (
            <Link href={`/room/${id}/recipient`} className="step step-now">
              <i className="step-dot" style={{ background: 'var(--gold)', color: 'var(--wine)' }}>♥</i>
              <div><b>Meet your person: <span className="codename">{a.recipient.code_name}</span></b><small>Their Christmas Identity and your Gift Concierge.</small></div>
            </Link>
          ) : (
            <div className="step step-locked">
              <i className="step-dot step-dot-empty">3</i>
              <div><b>Meet your person</b><small>Locked until the draw.</small></div>
            </div>
          )}
        </div>

        {profileDone && (
          <div className="stack" style={{ gap: 10 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="eyebrow">My Christmas Identity</span>
              <Link className="pill pill-gold" href={`/room/${id}/identity`}>{registrationOpen ? 'View / edit →' : 'View →'}</Link>
            </div>
            <IdentityCard compact codeName={me!.code_name} number={padNo(me!.number)} roomName={room.name} identity={identity as never} />
          </div>
        )}

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
