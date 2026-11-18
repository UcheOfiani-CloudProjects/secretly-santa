import { IDENTITY_FIELDS, type Identity } from '@/lib/identity';

const chips = (s?: string | null) => (s ?? '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
const LABEL: Record<string, string> = { loves: 'Loves', wants: 'Would love', needs: 'Needs', gift_types: 'Gift style', avoid: 'Please avoid', notes: 'Also' };

/** What your recipient wrote, on a cranberry-topped card. */
export default function RecipientCard({ codeName, number, identity }: { codeName: string; number: string; identity: Identity }) {
  const [a, ...b] = codeName.split(' ');
  const rows = IDENTITY_FIELDS.filter((f) => !['colours', 'treats'].includes(f.key) && identity[f.key]);
  const tags = [...chips(identity.colours), ...chips(identity.treats)];
  return (
    <div className="recip">
      <div className="recip-top">
        <span className="recip-no">No. {number}</span>
        <div className="recip-name">{a}{b.length > 0 && <><br />{b.join(' ')}</>}</div>
        <div className="recip-sub">Keep it secret. Keep it kind.</div>
      </div>
      <div className="recip-body">
        {tags.length > 0 && (
          <div className="recip-row"><div className="recip-label">Favourites</div><div className="keep-chips">{tags.map((t) => <span key={t} className="tagchip">{t}</span>)}</div></div>
        )}
        {rows.map((f) => (
          <div key={f.key} className="recip-row">
            <div className="recip-label" style={f.key === 'avoid' ? { color: 'var(--red)', fontWeight: 600 } : undefined}>{LABEL[f.key] ?? f.title}</div>
            <div className="recip-val">{identity[f.key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
