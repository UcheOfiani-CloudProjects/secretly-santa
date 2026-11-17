import { redirect } from 'next/navigation';
import TopBar from '@/components/TopBar';
import Concierge from '@/components/Concierge';
import { loadRoom } from '@/lib/room';
import { fmtDate, padNo } from '@/lib/format';
import { IDENTITY_FIELDS } from '@/lib/identity';

export const dynamic = 'force-dynamic';

export default async function RecipientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, room } = await loadRoom(id, { requireMember: true });
  const { data: a } = await supabase.rpc('my_assignment', { p_room: id, p_reveal: false });
  if (a?.state !== 'revealed') redirect(`/room/${id}/draw`);
  const r = a.recipient as Record<string, string | number | null>;
  const filled = IDENTITY_FIELDS.filter((f) => r[f.key]);
  const digits = room.budget_note?.match(/\d[\d,]*/)?.[0]?.replace(/,/g, '');

  return (
    <main className="page fade-in">
      <TopBar signedIn back={{ href: `/room/${id}`, label: 'Room' }} />
      <div className="stack-lg">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">My Recipient</span>
          <h1>Shopping for <span className="codename">{r.code_name}</span></h1>
          <p className="muted">
            Participant {padNo(Number(r.number))}{r.display_name ? <> · <strong>{r.display_name}</strong></> : ''} · Exchange on {fmtDate(room.exchange_date)}
          </p>
          {room.reveal_mode === 'mystery' && <p className="small muted">Mystery mode: tag your wrapped gift with “{r.code_name}”.</p>}
        </div>

        <div className="card-ivory stack-lg">
          <span className="eyebrow">Christmas Identity</span>
          {filled.length === 0 ? (
            <p className="muted">They didn’t fill in their Christmas Identity. The Gift Concierge can still suggest safe, thoughtful ideas.</p>
          ) : filled.map((f) => (
            <div key={f.key} className="idfield">
              <h3 style={f.key === 'avoid' ? { color: 'var(--red)' } : undefined}>{f.title}</h3>
              <p className="value">{r[f.key]}</p>
            </div>
          ))}
        </div>

        <Concierge roomId={id} defaultBudget={digits} />
      </div>
    </main>
  );
}
