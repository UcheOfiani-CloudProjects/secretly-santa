'use client';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function SignOut() {
  const router = useRouter();
  return (
    <button className="btn btn-ghost btn-sm" onClick={async () => { await supabaseBrowser().auth.signOut(); router.push('/home'); router.refresh(); }}>
      Sign out
    </button>
  );
}
