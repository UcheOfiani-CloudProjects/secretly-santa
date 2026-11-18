const TZ = 'Africa/Lagos';

/** Day-only display, always in Lagos time, e.g. "Fri 18 Dec". */
export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
}

/** ISO timestamp -> "YYYY-MM-DD" in Lagos. */
export function toDay(iso: string) {
  return iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }) : '';
}

/** "YYYY-MM-DD" -> timestamp at the Lagos day boundary (registration closes at day's end; others open at day's start). */
export function fromDay(day: string, end = false) {
  if (!day) return '';
  return new Date(`${day}${end ? 'T23:59:59' : 'T00:00:00'}+01:00`).toISOString();
}

/** Whole days from today (Lagos) to the given day. */
export function daysUntil(iso: string) {
  const day = (d: Date) => Date.parse(d.toLocaleDateString('en-CA', { timeZone: TZ }));
  return Math.max(0, Math.round((day(new Date(iso)) - day(new Date())) / 86400000));
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

/** "Monday, 15 December" in Lagos time. */
export function fmtLong(iso: string) {
  const d = new Date(iso);
  const wd = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: TZ });
  const rest = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: TZ });
  return `${wd}, ${rest}`;
}
