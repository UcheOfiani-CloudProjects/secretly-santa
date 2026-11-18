import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { admin, pushReady, sendToUsers } from '@/lib/push';

/** Called by the organiser's browser right after sealing the draw. */
export async function POST(req: Request) {
  if (!pushReady()) return NextResponse.json({ skipped: true });
  const { roomId } = await req.json().catch(() => ({}));
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !roomId) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const { data: room } = await supabase.from('rooms').select('id,name,organiser_id,status,draw_date').eq('id', roomId).maybeSingle();
  if (!room || room.organiser_id !== user.id || room.status !== 'drawn') return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const { data: people } = await admin().from('participants').select('user_id').eq('room_id', roomId);
  const day = new Date(room.draw_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' });
  const r = await sendToUsers((people ?? []).map((p) => p.user_id), {
    title: 'The names are drawn 🎁',
    body: `${room.name}: everyone has a Secret Santa. Your envelope opens on ${day}.`,
    url: `/room/${roomId}`,
  });
  return NextResponse.json(r);
}
