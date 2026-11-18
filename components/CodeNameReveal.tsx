import Link from 'next/link';

/** Full-screen "here's your secret name" moment: a gift tag swaying on a string. */
export default function CodeNameReveal({ firstName, codeName, number, roomName, next }: { firstName: string; codeName: string; number: string; roomName: string; next: string }) {
  const [a, ...b] = codeName.split(' ');
  return (
    <div className="reveal-screen">
      <i className="cf" style={{ left: 46, top: 90 }} /><i className="cf c2" style={{ left: '82%', top: 170 }} /><i className="cf c3" style={{ left: '16%', top: 380 }} />
      <p className="rs-eyebrow">You’re in{firstName ? `, ${firstName}` : ''}</p>
      <h1 className="rs-title">Here’s your secret name</h1>
      <div className="tag-sway">
        <svg viewBox="0 0 250 370" aria-hidden>
          <path d="M125 0C125 40 118 52 118 74" fill="none" stroke="#D8B66F" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 70H190L238 118V338Q238 358 218 358H32Q12 358 12 338V118Z" fill="#FBF5ED" />
          <path d="M66 82H184L226 124V334Q226 346 214 346H36Q24 346 24 334V124Z" fill="none" stroke="#D8B66F" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
          <circle cx="125" cy="96" r="11" fill="#1A0A10" /><circle cx="125" cy="96" r="11" fill="none" stroke="#D8B66F" strokeWidth="3" />
        </svg>
        <div className="tag-body">
          <div className="tag-eyebrow">Participant</div>
          <div className="tag-no">No. {number}</div>
          <div className="tag-name">{a}<br />{b.join(' ')}</div>
          <div className="tag-room">{roomName}</div>
        </div>
      </div>
      <p className="rs-copy">From now on, this is who you are in the room. Your Secret Santa will know you only by this name, so keep it close.</p>
      <Link className="btn btn-block" href={next}>FILL IN MY CHRISTMAS IDENTITY →</Link>
      <p className="rs-step">Step 2 of 3 · takes about 3 minutes</p>
    </div>
  );
}
