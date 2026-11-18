import type { Metadata } from 'next';
import Wordmark from '@/components/Wordmark';
import CodeNameReveal from '@/components/CodeNameReveal';
import IdentityCard from '@/components/IdentityCard';
import RecipientCard from '@/components/RecipientCard';
import SealedReveal from '@/components/SealedReveal';
import AdventStrip from '@/components/AdventStrip';
import PreviewDays from '@/components/PreviewDays';

export const metadata: Metadata = { title: 'Screen preview', robots: { index: false, follow: false } };

const sample = {
  loves: 'Gospel music, baking on Saturdays, long novels, my plants.',
  wants: 'A nice journal, a scented candle, a spa voucher.',
  needs: 'A good water bottle.',
  colours: 'Cranberry, Forest green',
  treats: 'Chin chin, Chocolate',
  gift_types: 'Women’s gifts',
  avoid: 'No perfumes please. Allergic to nuts.',
  notes: 'I already have too many scarves.',
};
const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

/** Every screen with sample data, so one person can check how it all looks. Nothing here is saved. */
export default function Preview() {
  return (
    <main className="page" style={{ gap: 48, display: 'flex', flexDirection: 'column' }}>
      <div className="stack" style={{ gap: 8 }}>
        <Wordmark size="sm" />
        <span className="eyebrow">Screen preview</span>
        <h1>Every screen, with sample people</h1>
        <p className="muted">This page only shows how things look. Nothing here is saved, and nobody else’s details are used.</p>
      </div>

      <section className="stack"><span className="eyebrow">0 · My room (home base)</span>
        <div className="room-bar"><Wordmark size="sm" /><span className="chip-me"><span>V</span>Velvet Cocoa</span></div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Your room</span>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.1 }}>Follow-Up Department Christmas Exchange</h1>
        </div>
        <div className="hero"><span className="hero-eyebrow">The Big Draw opens in</span><div className="hero-num">4</div><div className="hero-unit">days to go</div><span className="hero-date">Sunday, 22 November</span></div>
        <div className="advent-wrap"><AdventStrip reg={day(3)} draw={day(4)} gift={day(9)} /></div>
        <div className="steps">
          <div className="step step-done"><i className="step-dot" style={{ background: 'var(--evergreen)' }}>✓</i><div><b>Identity sealed</b><small>Your Santa knows what you love.</small></div></div>
          <div className="step step-now"><i className="step-dot" style={{ background: 'var(--red)' }}>2</i><div><b>Wait for the big draw</b><small>Opens on Sun 22 Nov.</small></div></div>
          <div className="step step-locked"><i className="step-dot step-dot-empty">3</i><div><b>Meet your person</b><small>Locked until the draw.</small></div></div>
        </div>
      </section>

      <section className="stack"><span className="eyebrow">1 · Your secret name (right after joining)</span>
        <CodeNameReveal firstName="Adaeze" codeName="Velvet Cocoa" number="014" roomName="Follow-Up Department Christmas Exchange" next="/preview" />
      </section>

      <section className="stack"><span className="eyebrow">2 · My saved Christmas Identity card</span>
        <IdentityCard codeName="Velvet Cocoa" number="014" roomName="Follow-Up Department Christmas Exchange" identity={sample} />
      </section>

      <section className="stack"><span className="eyebrow">3 · Room countdown strip</span>
        <div className="card stack"><AdventStrip reg={day(3)} draw={day(4)} gift={day(9)} /></div>
      </section>

      <section className="stack"><span className="eyebrow">4 · Draw day: the envelope</span>
        <div className="stack" style={{ textAlign: 'center', alignItems: 'center', gap: 10 }}>
          <h1>It’s time, <span className="codename">Velvet Cocoa</span>.</h1>
          <p className="muted" style={{ maxWidth: 360 }}>Someone is counting on you this Christmas. Tap the envelope to find out who.</p>
        </div>
        <div className="draw-stage">
          <div className="envelope idle"><div className="seal">S</div></div>
          <button type="button" className="btn btn-invite">OPEN MY ENVELOPE</button>
          <p className="small muted">Once opened, it can’t be undone.</p>
        </div>
      </section>

      <section className="stack"><span className="eyebrow">5 · After the envelope</span>
        <div className="draw-stage">
          <div className="card-ivory reveal-card stack" style={{ alignItems: 'center', textAlign: 'center', width: 'min(460px, 100%)' }}>
            <span className="eyebrow">You are Secret Santa to</span>
            <div className="reveal-name">Sugar Plum</div>
            <p className="muted">Participant 007</p>
            <p className="small muted">That’s your person. Keep it zipped.</p>
          </div>
        </div>
      </section>

      <section className="stack"><span className="eyebrow">6 · Their details, behind the wax seal (tap it)</span>
        <SealedReveal roomId="preview-demo">
          <RecipientCard codeName="Sugar Plum" number="007" identity={sample} />
        </SealedReveal>
      </section>

      <section className="stack"><span className="eyebrow">7 · Organiser: pick three days (try the calendar)</span>
        <PreviewDays />
      </section>
    </main>
  );
}
