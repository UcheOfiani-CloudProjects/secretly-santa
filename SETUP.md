# Secretly Santa — going live

About 30–40 minutes. Four free accounts: **Supabase** (database and sign-in), **Resend** (sends the sign-in emails), **Vercel** (hosting) and **Anthropic** (Gift Concierge, pay-as-you-go).

---

## 1. Supabase: database and sign-in

1. Go to [supabase.com](https://supabase.com) → **New project**. Name it `secretly-santa`, pick the **London (eu-west-2)** region (closest to Lagos) and save the database password somewhere.
2. Open **SQL Editor** → **New query**, paste the whole of `supabase/schema.sql` and click **Run**. It should end with "Success. No rows returned".
3. Go to **Authentication → Sign In / Providers → Email** and make sure Email is **enabled**.
4. Go to **Authentication → Emails → Templates → Magic Link** and replace the body with:

   ```html
   <h2>Your Secretly Santa code</h2>
   <p>Enter this code to step inside:</p>
   <p style="font-size:28px;letter-spacing:6px;font-weight:bold">{{ .Token }}</p>
   <p>It expires in an hour. If you didn't ask for it, ignore this email.</p>
   ```
   Subject: `Your Secretly Santa code`

   This sends a **code** instead of a link. That's deliberate: links often open in WhatsApp's or Gmail's built-in browser and fail to sign people in.
5. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key for step 3.

## 2. Resend: email sending (required)

Supabase's built-in email only sends a handful of emails an hour, which isn't enough for a whole department.

1. Sign up at [resend.com](https://resend.com). The free tier gives 3,000 emails a month.
2. **Domains → Add domain**. Use a domain you own (e.g. `mail.yourdomain.com`) and add the DNS records it shows you. Verification usually takes a few minutes.
3. **API Keys → Create** and copy the key.
4. Back in Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - Host `smtp.resend.com`, Port `465`, Username `resend`, Password: your Resend API key
   - Sender email: `santa@yourdomain.com` (on your verified domain); Sender name: `Secretly Santa`
5. **Authentication → Rate Limits**: raise "emails sent per hour" to about 100.

## 3. Vercel: put it online

1. Push this folder to a new GitHub repo, e.g. `secretly-santa`.
2. At [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from step 1.5 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon public key from step 1.5 |
   | `ANTHROPIC_API_KEY` | from step 4 |
   | `CONCIERGE_LIMIT` | `12` (AI requests per person per room) |

4. Click **Deploy**. You'll get a URL like `secretly-santa.vercel.app`, and you can attach a custom domain later.
5. Back in Supabase → **Authentication → URL Configuration**: set **Site URL** to your Vercel URL.

## 4. Anthropic: Gift Concierge

1. At [console.anthropic.com](https://console.anthropic.com), add a little credit ($5–10 is plenty for a church pilot) and create an API key.
2. Put it in Vercel as `ANTHROPIC_API_KEY`, then redeploy.

Each Concierge request costs a cent or two. The cap of 12 per person keeps the total predictable.

---

## 5. Dress rehearsal (do this before inviting anyone)

Use 3–4 of your own email addresses, or ask two friends.

1. Create a room with **registration closing in 10 minutes and the draw in 15**.
2. Join it from 3 different emails (use a private/incognito window for each) and fill in the Christmas Identities.
3. In **Manage**, add one "keep apart" pair and click **Seal the draw**.
4. After the draw time, open each person's envelope. Check that everyone got someone different and nobody got themselves.
5. Try the Gift Concierge.
6. Remove one person and check that their Santa is told to re-open the envelope.

Once that works, delete the test room data in Supabase (Table Editor → rooms → delete the row) and create the real one.

---

## How the room works

- **Organiser** creates the room, then shares the link or code by WhatsApp.
- **Participants** sign in with an emailed code, enter their name, get a code name (e.g. *Velvet Cocoa*) and fill in their Christmas Identity.
- At or after the deadline, the organiser clicks **Seal the draw**. That closes registration, locks profiles and assigns everyone in one secret loop.
- On the **draw date**, everyone opens their envelope. The assignment is permanent.
- **Mystery mode**: Santas only see a code name, so gifts are tagged with it at the exchange. **Reveal mode**: the real name shows after the reveal.
- **Dropouts after the draw**: remove them in Manage. Their Santa automatically gets their recipient instead, and nobody else is affected.
- If the organiser wants to take part too, they join through their own invite link like everyone else.

## Privacy, as built

- Nobody can read the assignments table, including the organiser and anyone poking at the database through the browser.
- Each participant can only read their own profile directly. Recipient details come only from the server, and only after their own reveal.
- Everyone else in the room sees code names only. Real names are visible to the organiser alone.
- Changing IDs in a URL gets nothing: every check happens on the server against the signed-in account.

Run `npm run test:db` to re-run the 13 automated checks on the draw and privacy rules.
