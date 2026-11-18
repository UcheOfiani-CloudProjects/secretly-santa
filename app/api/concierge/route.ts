import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const FIELDS: [string, string][] = [
  ['loves', 'Things I love'], ['wants', 'Things I’d love to receive'], ['needs', 'Things I need'],
  ['colours', 'Favourite colours'], ['treats', 'Favourite snacks/treats'], ['gift_types', 'Favourite kinds of gifts'],
  ['avoid', 'Things to AVOID (dislikes, allergies)'], ['notes', 'Anything else'],
];

export async function POST(req: Request) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const key = openaiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'The Gift Concierge isn’t switched on yet.' }, { status: 503 });

  let body: { roomId?: string; budget?: number; currency?: string; location?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }); }
  const { roomId } = body;
  const budget = Number(body.budget);
  const currency = body.currency === 'USD' ? 'USD' : 'NGN';
  const location = (body.location ?? '').toString().slice(0, 60) || (currency === 'NGN' ? 'Nigeria' : 'not specified');
  if (!roomId || !Number.isFinite(budget) || budget <= 0 || budget > 100_000_000) {
    return NextResponse.json({ error: 'Please enter a valid budget.' }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const { data: a, error: aErr } = await supabase.rpc('my_assignment', { p_room: roomId, p_reveal: false });
  if (aErr || a?.state !== 'revealed') return NextResponse.json({ error: 'Reveal your recipient first.' }, { status: 403 });

  const limit = Number(process.env.CONCIERGE_LIMIT ?? 12);
  const { data: remaining, error: capErr } = await supabase.rpc('use_concierge', { p_room: roomId, p_limit: limit });
  if (capErr) return NextResponse.json({ error: capErr.message }, { status: 429 });

  const r = a.recipient as Record<string, string | null>;
  const profile = FIELDS.map(([k, label]) => `${label}: ${r[k]?.trim() || '(not given)'}`).join('\n');
  const money = currency === 'NGN' ? `₦${budget.toLocaleString('en-NG')}` : `$${budget.toLocaleString('en-US')}`;

  const system = `You are the Gift Concierge for Secretly Santa, a Christmas gift exchange. You suggest thoughtful, realistic gifts based ONLY on what the recipient wrote about themselves.
Rules:
- Every suggestion must clearly connect to something specific they wrote. Never give generic filler.
- Stay within the budget. Include at least one budget-friendly option well under it and one creative or personalised idea.
- Strictly respect everything under "Things to AVOID", including allergies.
- Suggest things genuinely obtainable where the giver is shopping. For Nigeria, think of what is actually available there (local markets, malls, Jumia, Konga, Instagram vendors, local artisans) and price in naira.
- Prices are rough ranges; never claim exact current prices.
- British English. Warm, concise.
Return ONLY valid JSON, no prose, in this shape:
{"suggestions":[{"title":"short gift name","why":"one sentence linking it to what they wrote","price_range":"e.g. ₦8,000–₦12,000","where":"where to find it","category":"e.g. Practical"}],"tip":"one short wrapping or presentation tip tied to their tastes"}
Give exactly 5 suggestions.`;

  const user_msg = `Budget: ${money} (${currency})\nGiver is shopping in: ${location}\n\nRecipient's Christmas Identity:\n${profile}`;

  try {
    let text = '';
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user_msg }],
        }),
      });
      if (!res.ok) {
        console.error('OpenAI error', res.status, await res.text());
        return NextResponse.json({ error: 'The Concierge is busy. Try again in a moment.' }, { status: 502 });
      }
      const j = await res.json();
      text = j.choices?.[0]?.message?.content ?? '';
    } else {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
          max_tokens: 1400,
          system,
          messages: [{ role: 'user', content: user_msg }],
        }),
      });
      if (!res.ok) {
        console.error('Anthropic error', res.status, await res.text());
        return NextResponse.json({ error: 'The Concierge is busy. Try again in a moment.' }, { status: 502 });
      }
      const j = await res.json();
      text = j.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '';
    }
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    const suggestions = (Array.isArray(json.suggestions) ? json.suggestions : []).slice(0, 6).map((g: Record<string, unknown>) => ({
      title: String(g.title ?? ''), why: String(g.why ?? ''), price_range: String(g.price_range ?? ''),
      where: String(g.where ?? ''), category: String(g.category ?? ''),
    }));
    return NextResponse.json({ suggestions, tip: String(json.tip ?? ''), remaining });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'The Concierge got tongue-tied. Give it another go.' }, { status: 502 });
  }
}
