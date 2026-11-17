export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export function nextEvent(room: { registration_deadline: string; draw_date: string; exchange_date: string; status: string }) {
  const now = Date.now();
  if (room.status === 'open' && new Date(room.registration_deadline).getTime() > now)
    return { label: 'Registration closes in', at: room.registration_deadline };
  if (new Date(room.draw_date).getTime() > now) return { label: 'The Big Draw opens in', at: room.draw_date };
  if (new Date(room.exchange_date).getTime() > now) return { label: 'Gift exchange in', at: room.exchange_date };
  return null;
}

export function padNo(n: number) {
  return String(n).padStart(3, '0');
}
