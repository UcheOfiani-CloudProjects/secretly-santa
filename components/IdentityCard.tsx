import type { Identity } from '@/lib/identity';
import { IDENTITY_FIELDS } from '@/lib/identity';

const chips = (s?: string | null) => (s ?? '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);

/** The keepsake card: shows everything the person wrote, Christmas-card style. */
export default function IdentityCard({ codeName, number, roomName, identity, compact = false }: {
  codeName: string; number: string; roomName?: string; identity: Identity; compact?: boolean;
}) {
  const rest = IDENTITY_FIELDS.filter((f) => !['colours', 'treats'].includes(f.key) && identity[f.key]).slice(0, compact ? 2 : 99);
  return (
    <div className="keepsake">
      <div className="keep-head">
        <span className="wax wax-sm" aria-hidden>S</span>
        <div>
          <div className="keep-eyebrow">Christmas Identity · No. {number}</div>
          <div className="keep-name">{codeName}</div>
          {roomName && <div className="keep-room">{roomName}</div>}
        </div>
      </div>
      {(['colours', 'treats'] as const).map((k) => chips(identity[k]).length > 0 && (
        <div key={k} className="keep-block">
          <div className="keep-label">{k === 'colours' ? 'Favourite colours' : 'Favourite snacks'}</div>
          <div className="keep-chips">{chips(identity[k]).map((c) => <span key={c} className="chip on">{c}</span>)}</div>
        </div>
      ))}
      {rest.map((f) => (
        <div key={f.key} className="keep-block">
          <div className="keep-label" style={f.key === 'avoid' ? { color: 'var(--red)' } : undefined}>{f.title}</div>
          <p className="keep-value">{identity[f.key]}</p>
        </div>
      ))}
    </div>
  );
}
