'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Email + one-time code. A code (not a link) is used on purpose:
 * links often open in a different browser (e.g. WhatsApp/Gmail in-app browsers) and fail.
 */
export default function SignIn({ next, intro }: { next?: string; intro?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) setError(error.message); else setStep('code');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    const { error } = await supabaseBrowser().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) { setError('That code didn’t work. Check it, or send a new one.'); return; }
    if (next) router.push(next);
    router.refresh();
  };

  return (
    <div className="card card-gold stack fade-in">
      {step === 'email' ? (
        <form onSubmit={send} className="stack">
          <div>
            <h2>Step inside</h2>
            <p className="muted" style={{ marginTop: 6 }}>{intro ?? 'Enter your email and we’ll send you a short code. No password to remember.'}</p>
          </div>
          <div>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-block" disabled={busy}>{busy ? <span className="loader" /> : 'Send my code'}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="stack">
          <div>
            <h2>Check your email</h2>
            <p className="muted" style={{ marginTop: 6 }}>We sent a code to <strong>{email}</strong>. It may take a minute — check spam too.</p>
          </div>
          <div>
            <label htmlFor="code">Your code</label>
            <input id="code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ letterSpacing: '0.3em', fontSize: '1.3rem', textAlign: 'center' }} />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-block" disabled={busy}>{busy ? <span className="loader" /> : 'Continue'}</button>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="link-btn small" onClick={() => { setStep('email'); setCode(''); }}>Use a different email</button>
            <button type="button" className="link-btn small" onClick={send as unknown as () => void}>Send a new code</button>
          </div>
        </form>
      )}
    </div>
  );
}
