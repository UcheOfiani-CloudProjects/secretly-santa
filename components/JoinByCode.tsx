'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinByCode() {
  const router = useRouter();
  const [code, setCode] = useState('');
  return (
    <form className="row" onSubmit={(e) => { e.preventDefault(); if (code.trim()) router.push(`/join/${code.trim().toUpperCase()}`); }}>
      <input aria-label="Room code" placeholder="ROOM CODE" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ flex: '1 1 160px', letterSpacing: '0.2em', textTransform: 'uppercase' }} />
      <button className="btn">Join</button>
    </form>
  );
}
