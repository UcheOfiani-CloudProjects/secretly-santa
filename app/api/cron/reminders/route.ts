import { NextResponse } from 'next/server';
import { admin, pushReady, sendToUsers } from '@/lib/push';

export const dynamic = 'force-dynamic';

const lagosDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

/** Runs once a day (see vercel.json). Sends the three date reminders. */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No' }, { status: 401 });
  }
  if (!pushReady()) return NextResponse.json({ skipped: true });
  const db = admin();
  const today = new Date();
  const tomorrow = lagosDay(new Date(today.getTime() + 86400000));
  const now = lagosDay(today);
  const { data: rooms } = await db.from('rooms').select('id,name,status,registration_deadline,draw_date,exchange_date');
  let sent = 0;
  for (const r of rooms ?? []) {
    const { data: people } = await db.from('participants').select('user_id').eq('room_id', r.id);
    const ids = (people ?? []).map((p) => p.user_id);
    const jobs: { title: string; body: string }[] = [];
    if (r.status === 'open' && lagosDay(new Date(r.registration_deadline)) === tomorrow)
      jobs.push({ title: 'Last call for your Christmas Identity ✨', body: `${r.name}: registration closes tomorrow. Make sure your card is filled in.` });
    if (r.status === 'drawn' && lagosDay(new Date(r.draw_date)) === now)
      jobs.push({ title: 'Your envelope is open 💌', body: `${r.name}: tap to find out who you’re Secret Santa to.` });
    if (lagosDay(new Date(r.exchange_date)) === tomorrow)
      jobs.push({ title: 'Gift day is tomorrow 🎄', body: `${r.name}: wrap it up and tag it with your recipient’s code name.` });
    for (const j of jobs) sent += (await sendToUsers(ids, { ...j, url: `/room/${r.id}` })).sent;
  }
  return NextResponse.json({ sent });
}
