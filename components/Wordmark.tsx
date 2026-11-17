import Link from 'next/link';

/** "Secretly Santa" in Aloha Nineties. */
export default function Wordmark({ size = 'sm', href }: { size?: 'sm' | 'lg'; href?: string }) {
  const mark = (
    <span className={`wordmark wordmark-${size}`} aria-label="Secretly Santa">Secretly Santa</span>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{mark}</Link> : mark;
}
