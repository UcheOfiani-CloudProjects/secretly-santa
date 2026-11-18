'use client';
import { useState } from 'react';
import DayPicker from './DayPicker';

export default function PreviewDays() {
  const [v, setV] = useState({ registration_deadline: '', draw_date: '', exchange_date: '' });
  return <DayPicker value={v} onChange={(k, d) => setV({ ...v, [k]: d })} />;
}
