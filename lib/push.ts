import * as webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

/** Server-only helpers. Everything here quietly does nothing until the env vars are set. */
export const pushReady = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function sendToUsers(userIds: string[], payload: { title: string; body: string; url: string }) {
  if (!pushReady() || userIds.length === 0) return { sent: 0 };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hello@example.com', process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const db = admin();
  const { data: subs } = await db.from('push_subscriptions').select('id,endpoint,p256dh,auth').in('user_id', userIds);
  let sent = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
      sent++;
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', s.id);
    }
  }));
  return { sent };
}
