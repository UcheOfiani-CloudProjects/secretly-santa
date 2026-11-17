/** 14-day calendar strip from today, marking the three key days. Server-rendered. */
export default function AdventStrip({ reg, draw, gift }: { reg: string; draw: string; gift: string }) {
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
  const marks: Record<string, [string, string]> = { [day(reg)]: ['ev-reg', 'CLOSE'], [day(draw)]: ['ev-draw', 'DRAW'], [day(gift)]: ['ev-gift', 'GIFTS'] };
  const base = Date.parse(today + 'T12:00:00Z');
  const days = Array.from({ length: 14 }, (_, i) => new Date(base + i * 86400000).toISOString().slice(0, 10));
  return (
    <div className="advent" aria-label="Countdown calendar">
      {days.map((d) => {
        const m = marks[d];
        return <div key={d} className={`door ${d === today ? 'today' : ''} ${m ? m[0] : ''}`}>{Number(d.slice(8))}{m && <small>{m[1]}</small>}</div>;
      })}
    </div>
  );
}
