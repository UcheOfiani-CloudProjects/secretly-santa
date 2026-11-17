import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export type RoomRow = {
  id: string; name: string; description: string | null; join_code: string; organiser_id: string;
  registration_deadline: string; draw_date: string; exchange_date: string; budget_note: string | null;
  rules: string | null; announcement: string | null; reveal_mode: 'mystery' | 'reveal'; name_theme: 'treats' | 'winter' | 'ornaments'; status: 'open' | 'drawn';
};
export type Me = { id: string; number: number; code_name: string; display_name: string };

/** Loads the room for the signed-in user. Redirects away if they don't belong. */
export async function loadRoom(id: string, opts: { requireMember?: boolean } = {}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/home');
  const { data: room } = await supabase.from('rooms').select('*').eq('id', id).maybeSingle<RoomRow>();
  if (!room) redirect('/home');
  const { data: me } = await supabase.from('participants').select('id,number,code_name,display_name').eq('room_id', id).maybeSingle<Me>();
  const isOrganiser = room.organiser_id === user.id;
  if (opts.requireMember && !me) redirect(isOrganiser ? `/room/${id}/organise` : '/home');
  const registrationOpen = room.status === 'open' && new Date(room.registration_deadline) > new Date();
  return { supabase, user, room, me, isOrganiser, registrationOpen };
}
