/** Soft falling snow + gold glow, pure CSS so it stays light. Positions are fixed so server and client agree. */
const FLAKES = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
  return { left: r(1) * 100, size: 2 + r(2) * 5, dur: 9 + r(3) * 9, delay: -r(4) * 14, op: 0.35 + r(5) * 0.5, drift: (r(6) - 0.5) * 60 };
});
const GLOWS = [
  { left: 12, top: 22, s: 90 }, { left: 78, top: 14, s: 70 }, { left: 64, top: 62, s: 110 }, { left: 20, top: 78, s: 80 },
];
export default function Snow() {
  return (
    <div className="snow" aria-hidden>
      {GLOWS.map((g, i) => <i key={i} className="glow-dot" style={{ left: `${g.left}%`, top: `${g.top}%`, width: g.s, height: g.s, animationDelay: `${-i * 1.7}s` }} />)}
      {FLAKES.map((f, i) => (
        <i key={i} className="flake" style={{ left: `${f.left}%`, width: f.size, height: f.size, opacity: f.op, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, ['--drift' as string]: `${f.drift}px` } as React.CSSProperties} />
      ))}
    </div>
  );
}
