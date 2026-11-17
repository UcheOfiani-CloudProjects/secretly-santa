# Secretly Santa

A private Christmas gift exchange: rooms, secret code names, Christmas Identity profiles, a sealed one-to-one draw, an animated reveal and an AI Gift Concierge.

**Stack:** Next.js 15 · Supabase (Postgres, row-level security, email-code sign-in) · Claude API · Vercel

- `supabase/schema.sql`: the whole database, access rules and draw engine
- `tests/db.test.mjs`: 13 checks on the draw and privacy rules (`npm run test:db`)
- `SETUP.md`: step-by-step go-live guide

Local dev: copy `.env.example` to `.env.local`, fill it in, then run `npm install && npm run dev`.
