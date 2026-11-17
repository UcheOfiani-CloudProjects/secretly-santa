import { supabaseServer } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import SignIn from '@/components/SignIn';
import RoomForm from '@/components/RoomForm';

export const dynamic = 'force-dynamic';

export default async function Create() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="page fade-in">
      <TopBar signedIn={!!user} back={{ href: '/home', label: 'Home' }} />
      <div className="stack-lg">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">For organisers</span>
          <h1>Create a Christmas room</h1>
          <p className="muted">You’ll manage the room, but you won’t see who drew whom. That stays secret — even from you.</p>
        </div>
        {user ? <RoomForm /> : <SignIn next="/create" intro="Sign in first so the room is saved to your account." />}
      </div>
    </main>
  );
}
