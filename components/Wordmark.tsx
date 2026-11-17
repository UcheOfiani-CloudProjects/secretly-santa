import Link from 'next/link';

/** "Secretly Santa" with the Santa hat sitting on the first S. */
export function Hat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 92" aria-hidden>
      {/* cone, flopping to the right */}
      <path d="M14 70 C 22 40, 40 14, 64 10 C 78 8, 90 16, 92 30 C 84 22, 74 22, 68 30 C 60 42, 66 58, 82 70 Z" fill="#B51F35" />
      <path d="M14 70 C 22 40, 40 14, 64 10 C 52 22, 44 44, 46 70 Z" fill="#8E182C" opacity="0.55" />
      {/* fur trim */}
      <rect x="6" y="62" width="84" height="18" rx="9" fill="#FBF5ED" />
      <rect x="6" y="62" width="84" height="6" rx="3" fill="#ffffff" opacity="0.5" />
      {/* pompom */}
      <circle cx="91" cy="33" r="8.5" fill="#FBF5ED" />
      <circle cx="89" cy="31" r="3" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

export default function Wordmark({ size = 'sm', href }: { size?: 'sm' | 'lg'; href?: string }) {
  const mark = (
    <span className={`wordmark wordmark-${size}`} aria-label="Secretly Santa">
      <span className="s-wrap">S<Hat className="hat" /></span>ecretly Santa
    </span>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{mark}</Link> : mark;
}
