// Runs the real schema.sql inside an in-memory Postgres (PGlite) with a
// minimal Supabase-like auth shim, then checks the draw + privacy rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

async function freshDb() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid());
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
  `);
  await db.exec(schema);
  return db;
}

async function user(db) {
  const r = await db.query(`insert into auth.users default values returning id`);
  return r.rows[0].id;
}

// Run SQL as a signed-in user, with the browser's role.
async function as(db, uid, sql, params = []) {
  await db.exec(`reset role; select set_config('test.uid', '${uid ?? ''}', false); set role authenticated;`);
  try { return await db.query(sql, params); }
  finally { await db.exec(`reset role;`); }
}

async function setupRoom(db, n, { drawPast = true } = {}) {
  const org = await user(db);
  const now = Date.now();
  const iso = (ms) => new Date(now + ms).toISOString();
  const room = (await as(db, org,
    `select create_room('Follow-Up Dept', null, $1, $2, $3, '₦10,000', null, 'mystery', 'treats') as id`,
    [iso(3600e3), iso(7200e3), iso(9000e3)])).rows[0].id;
  const code = (await db.query(`select join_code from rooms where id=$1`, [room])).rows[0].join_code;
  const people = [];
  for (let i = 0; i < n; i++) {
    const u = await user(db);
    const pid = (await as(db, u, `select join_room($1, $2) as id`, [code, `Person ${i + 1}`])).rows[0].id;
    await as(db, u, `select save_identity($1,'loves ${i}','wants ${i}',null,null,null,null,null,null)`, [room]);
    people.push({ uid: u, pid });
  }
  if (drawPast) {
    // pretend time has passed: move dates into the past (superuser edit)
    await db.query(`update rooms set registration_deadline = now() - interval '2 hours',
                    draw_date = now() - interval '1 hour' where id = $1`, [room]);
  }
  return { org, room, code, people };
}

test('draw makes one valid loop: everyone gives once, receives once, never themselves', async () => {
  for (const n of [3, 4, 7, 25]) {
    const db = await freshDb();
    const { org, room } = await setupRoom(db, n);
    await as(db, org, `select run_draw($1)`, [room]);
    const a = (await db.query(`select santa_id, recipient_id from assignments where room_id=$1`, [room])).rows;
    assert.equal(a.length, n);
    assert.equal(new Set(a.map(x => x.santa_id)).size, n);
    assert.equal(new Set(a.map(x => x.recipient_id)).size, n);
    assert.ok(a.every(x => x.santa_id !== x.recipient_id));
    // single cycle
    const next = Object.fromEntries(a.map(x => [x.santa_id, x.recipient_id]));
    let cur = a[0].santa_id, steps = 0;
    do { cur = next[cur]; steps++; } while (cur !== a[0].santa_id);
    assert.equal(steps, n);
  }
});

test('numbers and code names are auto-assigned and unique', async () => {
  const db = await freshDb();
  const { room } = await setupRoom(db, 30, { drawPast: false });
  const p = (await db.query(`select number, code_name from participants where room_id=$1 order by number`, [room])).rows;
  assert.deepEqual(p.map(x => x.number), Array.from({ length: 30 }, (_, i) => i + 1));
  assert.equal(new Set(p.map(x => x.code_name)).size, 30);
});

test('exclusions are respected', async () => {
  const db = await freshDb();
  for (let run = 0; run < 20; run++) {
    const { org, room, people } = await setupRoom(db, 5);
    await as(db, org, `select set_exclusion($1,$2,$3,true)`, [room, people[0].pid, people[1].pid]);
    await as(db, org, `select set_exclusion($1,$2,$3,true)`, [room, people[2].pid, people[3].pid]);
    await as(db, org, `select run_draw($1)`, [room]);
    const a = (await db.query(`select santa_id s, recipient_id r from assignments where room_id=$1`, [room])).rows;
    const bad = new Set([[0,1],[1,0],[2,3],[3,2]].map(([x,y]) => people[x].pid + people[y].pid));
    assert.ok(a.every(x => !bad.has(x.s + x.r)));
  }
});

test('nobody can read the assignments table directly — not even the organiser', async () => {
  const db = await freshDb();
  const { org, room, people } = await setupRoom(db, 4);
  await as(db, org, `select run_draw($1)`, [room]);
  for (const uid of [org, people[0].uid]) {
    await assert.rejects(as(db, uid, `select * from assignments`), /permission denied/);
  }
});

test('participants cannot read other people’s profiles or names directly', async () => {
  const db = await freshDb();
  const { room, people } = await setupRoom(db, 4);
  const ids = (await as(db, people[0].uid, `select * from identities`)).rows;
  assert.equal(ids.length, 1); // only their own
  const ps = (await as(db, people[0].uid, `select * from participants`)).rows;
  assert.equal(ps.length, 1);
  const roster = (await as(db, people[0].uid, `select * from room_roster($1)`, [room])).rows;
  assert.equal(roster.length, 4);
  assert.ok(!('display_name' in roster[0]));
});

test('organiser cannot see assignments through any function', async () => {
  const db = await freshDb();
  const { org, room } = await setupRoom(db, 4);
  await as(db, org, `select run_draw($1)`, [room]);
  // organiser is not a participant, so my_assignment refuses
  await assert.rejects(as(db, org, `select my_assignment($1, true)`, [room]), /not in this room/);
});

test('reveal is blocked before draw date, then permanent and only shows your own recipient', async () => {
  const db = await freshDb();
  const { org, room, people } = await setupRoom(db, 4, { drawPast: false });
  await db.query(`update rooms set registration_deadline = now() - interval '1 minute' where id=$1`, [room]);
  await as(db, org, `select run_draw($1)`, [room]);
  let r = (await as(db, people[0].uid, `select my_assignment($1, true) j`, [room])).rows[0].j;
  assert.equal(r.state, 'waiting');
  await db.query(`update rooms set draw_date = now() - interval '1 minute' where id=$1`, [room]);
  r = (await as(db, people[0].uid, `select my_assignment($1, false) j`, [room])).rows[0].j;
  assert.equal(r.state, 'ready');
  r = (await as(db, people[0].uid, `select my_assignment($1, true) j`, [room])).rows[0].j;
  assert.equal(r.state, 'revealed');
  assert.equal(r.recipient.display_name, null); // mystery mode hides the real name
  const truth = (await db.query(`select p.code_name from assignments a join participants p on p.id=a.recipient_id where a.santa_id=$1`, [people[0].pid])).rows[0].code_name;
  assert.equal(r.recipient.code_name, truth);
  const again = (await as(db, people[0].uid, `select my_assignment($1, true) j`, [room])).rows[0].j;
  assert.equal(again.recipient.code_name, truth);
});

test('reveal mode shows the real name', async () => {
  const db = await freshDb();
  const { org, room, people } = await setupRoom(db, 3);
  await db.query(`update rooms set reveal_mode='reveal' where id=$1`, [room]);
  await as(db, org, `select run_draw($1)`, [room]);
  const r = (await as(db, people[0].uid, `select my_assignment($1, true) j`, [room])).rows[0].j;
  assert.match(r.recipient.display_name, /^Person \d$/);
});

test('removing someone after the draw repairs the loop without touching anyone else', async () => {
  const db = await freshDb();
  const { org, room, people } = await setupRoom(db, 6);
  await as(db, org, `select run_draw($1)`, [room]);
  const before = (await db.query(`select santa_id s, recipient_id r from assignments`)).rows;
  const victim = people[2].pid;
  const santa = before.find(x => x.r === victim).s;
  const theirRecipient = before.find(x => x.s === victim).r;
  await as(db, org, `select remove_participant($1)`, [victim]);
  const after = (await db.query(`select santa_id s, recipient_id r from assignments`)).rows;
  assert.equal(after.length, 5);
  assert.equal(after.find(x => x.s === santa).r, theirRecipient);
  for (const x of after) if (x.s !== santa) assert.equal(before.find(b => b.s === x.s).r, x.r);
  assert.ok(after.every(x => x.s !== x.r));
});

test('profiles lock after the registration deadline; late joins refused', async () => {
  const db = await freshDb();
  const { room, code, people } = await setupRoom(db, 3);
  await assert.rejects(as(db, people[0].uid,
    `select save_identity($1,'x','y',null,null,null,null,null,null)`, [room]), /locked/);
  const late = await user(db);
  await assert.rejects(as(db, late, `select join_room($1,'Late')`, [code]), /closed/);
});

test('non-organiser cannot run the draw or remove people', async () => {
  const db = await freshDb();
  const { room, people } = await setupRoom(db, 4);
  await assert.rejects(as(db, people[0].uid, `select run_draw($1)`, [room]), /organiser/);
  await assert.rejects(as(db, people[0].uid, `select remove_participant($1)`, [people[1].pid]), /organiser/);
});

test('rejoining returns the same participant, not a duplicate', async () => {
  const db = await freshDb();
  const { code, people, room } = await setupRoom(db, 3, { drawPast: false });
  const again = (await as(db, people[0].uid, `select join_room($1,'Dup') id`, [code])).rows[0].id;
  assert.equal(again, people[0].pid);
  const n = (await db.query(`select count(*)::int c from participants where room_id=$1`, [room])).rows[0].c;
  assert.equal(n, 3);
});

test('concierge cap: needs a reveal, then counts down', async () => {
  const db = await freshDb();
  const { org, room, people } = await setupRoom(db, 3);
  await as(db, org, `select run_draw($1)`, [room]);
  await assert.rejects(as(db, people[0].uid, `select use_concierge($1, 2)`, [room]), /Reveal/);
  await as(db, people[0].uid, `select my_assignment($1, true)`, [room]);
  assert.equal((await as(db, people[0].uid, `select use_concierge($1, 2) n`, [room])).rows[0].n, 1);
  assert.equal((await as(db, people[0].uid, `select use_concierge($1, 2) n`, [room])).rows[0].n, 0);
  await assert.rejects(as(db, people[0].uid, `select use_concierge($1, 2)`, [room]), /used all/);
});
