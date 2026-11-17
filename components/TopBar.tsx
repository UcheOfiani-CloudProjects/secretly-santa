import Link from 'next/link';
import Wordmark from './Wordmark';
import SignOut from './SignOut';

export default function TopBar({ signedIn, back }: { signedIn: boolean; back?: { href: string; label: string } }) {
  return (
    <header className="topbar">
      <Wordmark href="/home" />
      <div className="row">
        {back && <Link href={back.href} className="btn btn-ghost btn-sm">← {back.label}</Link>}
        {signedIn && <SignOut />}
      </div>
    </header>
  );
}
