'use client';
import { useEffect, useState } from 'react';

const b64 = (s: string) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

/** Registers the service worker once, so the app can be installed. */
export function RegisterSW() {
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []);
  return null;
}

/** Install hint + notifications switch. Shown on the Home screen. */
export default function AppHelpers() {
  const [evt, setEvt] = useState<Event & { prompt?: () => void } | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [msg, setMsg] = useState('');
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) setPerm(Notification.permission);
    const h = (e: Event) => { e.preventDefault(); setEvt(e as never); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const enable = async () => {
    try {
      const p = await Notification.requestPermission(); setPerm(p);
      if (p !== 'granted' || !vapid) { if (!vapid) setMsg('Reminders are almost ready. Check back soon.'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(vapid) });
      const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setMsg(r.ok ? 'Done. We’ll nudge you on the big days.' : 'Couldn’t switch that on. Try again.');
    } catch { setMsg('Couldn’t switch that on. Try again.'); }
  };

  const showInstall = !standalone;
  const showNotify = perm !== 'unsupported' && perm !== 'granted' && (!ios || standalone);
  if (!showInstall && !showNotify && !msg) return null;
  return (
    <div className="card stack" style={{ gap: 10 }}>
      {showInstall && (
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Keep it close</span>
          {evt ? (
            <button type="button" className="btn" onClick={() => evt.prompt?.()}>Add Secretly Santa to my phone</button>
          ) : (
            <p className="small muted">{ios ? 'Tap the Share button, then “Add to Home Screen”, and it opens like an app.' : 'Open your browser menu and choose “Add to Home screen” or “Install app”.'}</p>
          )}
        </div>
      )}
      {showNotify && <button type="button" className="btn btn-ghost" onClick={enable}>Remind me on the big days</button>}
      {ios && !standalone && <p className="small muted">On iPhone, add it to your Home Screen first. Then you can switch reminders on.</p>}
      {msg && <p className="small">{msg}</p>}
    </div>
  );
}
