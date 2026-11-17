import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import SignIn from '@/components/SignIn';
import JoinByCode from '@/components/JoinByCode';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Room = { id: string; name: string; status: string; draw_date: string; exchange_date: string; registration_deadline: string; organiser_id: string };

export default async function Home() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page fade-in">
        <TopBar signedIn={false} />
        <div className="stack-lg">
          <div className="stack" style={{ gap: 8 }}>
            <span className="eyebrow">Welcome</span>
            <h1>Your Christmas rooms await</h1>
          </div>
          <SignIn next="/home" />
        </div>
      </main>
    );
  }

  const { data: rooms } = await supabase.from('rooms').select('id,name,status,draw_date,exchange_date,registration_deadline,organiser_id').order('created_at', { ascending: false });
  const { data: mine } = await supabase.from('participants').select('room_id,code_name');
  const codeByRoom = new Map((mine ?? []).map((p) => [p.room_id, p.code_name]));
  const list = (rooms ?? []) as Room[];

  return (
    <main className="page fade-in">
      <TopBar signedIn />
      <div className="stack-lg">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Your Christmas rooms</span>
          <h1>Welcome back</h1>
        </div>

        {list.length > 0 && (
          <div className="stack">
            {list.map((r) => {
              const organiser = r.organiser_id === user.id;
              const code = codeByRoom.get(r.id);
              return (
                <div key={r.id} className="card">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="stack" style={{ gap: 6 }}>
                      <h3>{r.name}</h3>
                      <div className="row" style={{ gap: 8 }}>
                        {organiser && <span className="pill pill-gold">Organiser</span>}
                        {code && <span className="pill">You are <span className="codename">&nbsp;{code}</span></span>}
                        <span className="pill">{r.status === 'drawn' ? 'Draw complete' : 'Registration open'}</span>
                      </div>
                      <p className="small muted">Exchange: {fmtDate(r.exchange_date)}</p>
                    </div>
                    <div className="row">
                      {code && <Link className="btn btn-sm" href={`/room/${r.id}`}>Open room</Link>}
                      {organiser && <Link className="btn btn-ghost btn-sm" href={`/room/${r.id}/organise`}>Manage</Link>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid-2">
          <div className="card stack">
            <h3>Join a room</h3>
            <p className="small muted">Got a code from your organiser? Enter it here — or just tap the invite link they shared.</p>
            <JoinByCode />
          </div>
          <div className="card stack">
            <h3>Organise an exchange</h3>
            <p className="small muted">Create a private Christmas room for your department, family or team.</p>
            <Link className="btn btn-green" href="/create">Create a room</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
