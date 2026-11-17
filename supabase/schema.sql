-- =====================================================================
-- SECRETLY SANTA — database schema
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- Security model:
--   * Every table has row-level security ON.
--   * The browser can only READ a few safe rows directly.
--   * Every WRITE, and every read of secret data (assignments,
--     recipient profiles), goes through the functions below, which
--     check who is asking on the server.
--   * Nobody — not even the organiser — can read the assignments table.
-- =====================================================================

-- ---------- Tables ---------------------------------------------------

create table if not exists public.rooms (
  id                    uuid primary key default gen_random_uuid(),
  organiser_id          uuid not null references auth.users(id) on delete cascade,
  name                  text not null check (char_length(name) between 2 and 80),
  join_code             text not null unique,
  description           text check (char_length(description) <= 600),
  registration_deadline timestamptz not null,
  draw_date             timestamptz not null,
  exchange_date         timestamptz not null,
  budget_note           text check (char_length(budget_note) <= 120),
  rules                 text check (char_length(rules) <= 1000),
  announcement          text check (char_length(announcement) <= 1000),
  reveal_mode           text not null default 'mystery' check (reveal_mode in ('mystery','reveal')),
  name_theme            text not null default 'treats' check (name_theme in ('treats','winter','ornaments')),
  status                text not null default 'open' check (status in ('open','drawn')),
  created_at            timestamptz not null default now(),
  check (registration_deadline <= draw_date and draw_date <= exchange_date)
);

create table if not exists public.participants (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  number        int  not null,
  code_name     text not null,
  display_name  text not null check (char_length(display_name) between 1 and 60),
  joined_at     timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, number),
  unique (room_id, code_name)
);

create table if not exists public.identities (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  loves       text check (char_length(loves)      <= 600),
  wants       text check (char_length(wants)      <= 600),
  needs       text check (char_length(needs)      <= 600),
  colours     text check (char_length(colours)    <= 200),
  treats      text check (char_length(treats)     <= 300),
  gift_types  text check (char_length(gift_types) <= 300),
  avoid       text check (char_length(avoid)      <= 600),
  notes       text check (char_length(notes)      <= 800),
  updated_at  timestamptz not null default now()
);

create table if not exists public.assignments (
  santa_id      uuid primary key references public.participants(id) on delete cascade,
  room_id       uuid not null references public.rooms(id) on delete cascade,
  recipient_id  uuid not null unique references public.participants(id) on delete cascade,
  revealed_at   timestamptz,
  check (santa_id <> recipient_id)
);

create table if not exists public.exclusions (
  room_id uuid not null references public.rooms(id) on delete cascade,
  a_id    uuid not null references public.participants(id) on delete cascade,
  b_id    uuid not null references public.participants(id) on delete cascade,
  primary key (a_id, b_id),
  check (a_id < b_id)
);

create index if not exists participants_room_idx on public.participants(room_id);
create index if not exists assignments_room_idx  on public.assignments(room_id);

-- ---------- Row-level security --------------------------------------

alter table public.rooms        enable row level security;
alter table public.participants enable row level security;
alter table public.identities   enable row level security;
alter table public.assignments  enable row level security;
alter table public.exclusions   enable row level security;

-- No direct writes from the browser at all.
revoke insert, update, delete on public.rooms, public.participants, public.identities,
  public.assignments, public.exclusions from anon, authenticated;
revoke select on public.assignments, public.exclusions from anon, authenticated;
revoke select on public.rooms, public.participants, public.identities from anon;

create or replace function public.is_room_member(p_room uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from participants where room_id = p_room and user_id = auth.uid())
$$;

create or replace function public.is_room_organiser(p_room uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from rooms where id = p_room and organiser_id = auth.uid())
$$;

drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms for select to authenticated
  using (organiser_id = auth.uid() or public.is_room_member(id));

drop policy if exists participants_read_own on public.participants;
create policy participants_read_own on public.participants for select to authenticated
  using (user_id = auth.uid());

drop policy if exists identities_read_own on public.identities;
create policy identities_read_own on public.identities for select to authenticated
  using (exists (select 1 from participants p where p.id = participant_id and p.user_id = auth.uid()));

-- ---------- Helpers --------------------------------------------------

create or replace function public._new_join_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- no 0/O/1/I/L
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from rooms where join_code = code);
  end loop;
  return code;
end $$;

create or replace function public._code_name(p_room uuid, p_theme text)
returns text language plpgsql volatile set search_path = public as $$
declare
  adj  text[];
  noun text[];
  candidate text;
  tries int := 0;
begin
  if p_theme = 'winter' then
    adj  := array['Silver','Midnight','Frosted','Starlit','Hushed','Glimmering','Moonlit','Crystal','Northern','Quiet','Silken','Shimmering'];
    noun := array['Comet','Snowfall','Lantern','Aurora','Evergreen','Pine','Sleighbell','Starlight','Frost','Hearth','Candle','Snowdrift'];
  elsif p_theme = 'ornaments' then
    adj  := array['Golden','Crimson','Velvet','Gilded','Ivory','Emerald','Ruby','Champagne','Satin','Glass','Painted','Twinkling'];
    noun := array['Bauble','Ribbon','Star','Bell','Wreath','Garland','Ornament','Bow','Tinsel','Angel','Pinecone','Lantern'];
  else -- treats
    adj  := array['Velvet','Honey','Spiced','Sugared','Toasted','Cinnamon','Caramel','Peppermint','Butter','Cocoa','Maple','Vanilla'];
    noun := array['Cocoa','Gingerbread','Truffle','Cookie','Fudge','Chin Chin','Shortbread','Puff Puff','Candy Cane','Marshmallow','Plum Pudding','Toffee'];
  end if;
  loop
    tries := tries + 1;
    candidate := adj[1 + floor(random() * array_length(adj,1))::int] || ' ' ||
                 noun[1 + floor(random() * array_length(noun,1))::int];
    if split_part(candidate,' ',1) = split_part(candidate,' ',2) then continue; end if;
    exit when not exists (select 1 from participants where room_id = p_room and code_name = candidate);
    if tries > 200 then
      candidate := candidate || ' ' || (select coalesce(max(number),0)+1 from participants where room_id = p_room);
      exit;
    end if;
  end loop;
  return candidate;
end $$;

-- ---------- Organiser: rooms ----------------------------------------

create or replace function public.create_room(
  p_name text, p_description text,
  p_registration_deadline timestamptz, p_draw_date timestamptz, p_exchange_date timestamptz,
  p_budget_note text, p_rules text, p_reveal_mode text, p_name_theme text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if p_registration_deadline <= now() then raise exception 'The registration deadline must be in the future.'; end if;
  if not (p_registration_deadline <= p_draw_date and p_draw_date <= p_exchange_date) then
    raise exception 'Dates must be in order: registration closes, then draw, then exchange.';
  end if;
  insert into rooms (organiser_id, name, join_code, description, registration_deadline, draw_date,
                     exchange_date, budget_note, rules, reveal_mode, name_theme)
  values (auth.uid(), trim(p_name), _new_join_code(), nullif(trim(p_description),''),
          p_registration_deadline, p_draw_date, p_exchange_date,
          nullif(trim(p_budget_note),''), nullif(trim(p_rules),''),
          coalesce(p_reveal_mode,'mystery'), coalesce(p_name_theme,'treats'))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.update_room(
  p_room uuid, p_name text, p_description text,
  p_registration_deadline timestamptz, p_draw_date timestamptz, p_exchange_date timestamptz,
  p_budget_note text, p_rules text, p_announcement text, p_reveal_mode text)
returns void language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  select * into r from rooms where id = p_room and organiser_id = auth.uid();
  if not found then raise exception 'Only the organiser can change this room.'; end if;
  if not (p_registration_deadline <= p_draw_date and p_draw_date <= p_exchange_date) then
    raise exception 'Dates must be in order: registration closes, then draw, then exchange.';
  end if;
  update rooms set
    name = trim(p_name),
    description = nullif(trim(p_description),''),
    registration_deadline = case when r.status = 'open' then p_registration_deadline else registration_deadline end,
    draw_date = p_draw_date,
    exchange_date = p_exchange_date,
    budget_note = nullif(trim(p_budget_note),''),
    rules = nullif(trim(p_rules),''),
    announcement = nullif(trim(p_announcement),''),
    reveal_mode = case when r.status = 'open' then coalesce(p_reveal_mode, reveal_mode) else reveal_mode end
  where id = p_room;
end $$;

-- Organiser sees names + code names + whether profiles are filled. Never assignments.
create or replace function public.organiser_participants(p_room uuid)
returns table (id uuid, number int, code_name text, display_name text, profile_complete boolean, joined_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_room_organiser(p_room) then raise exception 'Only the organiser can see this.'; end if;
  return query
    select p.id, p.number, p.code_name, p.display_name,
           (i.participant_id is not null and coalesce(i.loves,'') <> '' and coalesce(i.wants,'') <> ''),
           p.joined_at
    from participants p left join identities i on i.participant_id = p.id
    where p.room_id = p_room order by p.number;
end $$;

create or replace function public.organiser_exclusions(p_room uuid)
returns table (a_id uuid, b_id uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_room_organiser(p_room) then raise exception 'Only the organiser can see this.'; end if;
  return query select e.a_id, e.b_id from exclusions e where e.room_id = p_room;
end $$;

create or replace function public.set_exclusion(p_room uuid, p_a uuid, p_b uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
declare lo uuid := least(p_a,p_b); hi uuid := greatest(p_a,p_b);
begin
  if not is_room_organiser(p_room) then raise exception 'Only the organiser can do this.'; end if;
  if (select status from rooms where id = p_room) <> 'open' then raise exception 'The draw has already happened.'; end if;
  if p_a = p_b then raise exception 'Pick two different people.'; end if;
  if (select count(*) from participants where room_id = p_room and id in (p_a,p_b)) <> 2 then
    raise exception 'Both people must be in this room.';
  end if;
  if p_on then
    insert into exclusions(room_id,a_id,b_id) values (p_room,lo,hi) on conflict do nothing;
  else
    delete from exclusions where a_id = lo and b_id = hi;
  end if;
end $$;

-- ---------- The draw -------------------------------------------------
-- Builds ONE random loop A→B→C→…→A. That guarantees:
--   everyone gives exactly once, receives exactly once, nobody draws themselves.
-- Exclusion pairs (couples, family) are never placed next to each other.
create or replace function public.run_draw(p_room uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  ids uuid[];
  n int;
  attempt int := 0;
  ok boolean;
  i int;
begin
  if not is_room_organiser(p_room) then raise exception 'Only the organiser can run the draw.'; end if;
  perform 1 from rooms where id = p_room for update;
  if (select status from rooms where id = p_room) <> 'open' then raise exception 'The draw has already happened.'; end if;
  select count(*) into n from participants where room_id = p_room;
  if n < 3 then raise exception 'You need at least 3 participants for a draw.'; end if;

  loop
    attempt := attempt + 1;
    select array_agg(id order by random()) into ids from participants where room_id = p_room;
    ok := true;
    for i in 1..n loop
      if exists (select 1 from exclusions
                 where a_id = least(ids[i], ids[(i % n) + 1])
                   and b_id = greatest(ids[i], ids[(i % n) + 1])) then
        ok := false; exit;
      end if;
    end loop;
    exit when ok;
    if attempt >= 2000 then
      raise exception 'The exclusion rules make a fair draw impossible. Remove some exclusions and try again.';
    end if;
  end loop;

  for i in 1..n loop
    insert into assignments(santa_id, room_id, recipient_id) values (ids[i], p_room, ids[(i % n) + 1]);
  end loop;

  update rooms set status = 'drawn' where id = p_room;
  return n;
end $$;

-- Remove someone. If the draw already happened, the loop is repaired:
-- whoever was buying for them now buys for the person they were buying for.
-- Returns the code name of the Santa whose recipient changed (or null).
create or replace function public.remove_participant(p_participant uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_room uuid;
  v_santa uuid;
  v_recipient uuid;
  v_santa_code text;
begin
  select room_id into v_room from participants where id = p_participant;
  if v_room is null then raise exception 'Participant not found.'; end if;
  if not is_room_organiser(v_room) then raise exception 'Only the organiser can remove people.'; end if;
  perform 1 from rooms where id = v_room for update;

  if (select status from rooms where id = v_room) = 'drawn' then
    if (select count(*) from participants where room_id = v_room) <= 3 then
      raise exception 'At least 3 people must remain after the draw.';
    end if;
    select santa_id into v_santa from assignments where recipient_id = p_participant;
    select recipient_id into v_recipient from assignments where santa_id = p_participant;
    delete from assignments where santa_id = p_participant;
    update assignments set recipient_id = v_recipient, revealed_at = null where santa_id = v_santa;
    select code_name into v_santa_code from participants where id = v_santa;
  end if;

  delete from participants where id = p_participant;
  return v_santa_code;
end $$;

-- ---------- Participants --------------------------------------------

-- Public-safe preview so the join page can show the room before sign-in.
create or replace function public.room_preview(p_code text)
returns table (room_id uuid, name text, description text, registration_deadline timestamptz,
               draw_date timestamptz, exchange_date timestamptz, status text, participant_count int, budget_note text)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, r.description, r.registration_deadline, r.draw_date, r.exchange_date, r.status,
         (select count(*)::int from participants p where p.room_id = r.id), r.budget_note
  from rooms r where r.join_code = upper(trim(p_code))
$$;

create or replace function public.join_room(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r rooms;
  existing uuid;
  new_id uuid;
  next_no int;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select * into r from rooms where join_code = upper(trim(p_code)) for update;
  if not found then raise exception 'That room code doesn''t exist.'; end if;

  select id into existing from participants where room_id = r.id and user_id = auth.uid();
  if existing is not null then return existing; end if;

  if r.status <> 'open' or now() > r.registration_deadline then
    raise exception 'Registration for this room has closed.';
  end if;
  if char_length(trim(coalesce(p_display_name,''))) = 0 then raise exception 'Please enter your name.'; end if;

  select coalesce(max(number),0) + 1 into next_no from participants where room_id = r.id;
  insert into participants(room_id, user_id, number, code_name, display_name)
  values (r.id, auth.uid(), next_no, _code_name(r.id, r.name_theme), trim(p_display_name))
  returning id into new_id;
  insert into identities(participant_id) values (new_id);
  return new_id;
end $$;

-- What everyone in the room may see: numbers and code names only.
create or replace function public.room_roster(p_room uuid)
returns table (number int, code_name text, is_me boolean, profile_complete boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_room_member(p_room) or is_room_organiser(p_room)) then raise exception 'You are not in this room.'; end if;
  return query
    select p.number, p.code_name, p.user_id = auth.uid(),
           (coalesce(i.loves,'') <> '' and coalesce(i.wants,'') <> '')
    from participants p left join identities i on i.participant_id = p.id
    where p.room_id = p_room order by p.number;
end $$;

create or replace function public.save_identity(
  p_room uuid, p_loves text, p_wants text, p_needs text, p_colours text,
  p_treats text, p_gift_types text, p_avoid text, p_notes text)
returns void language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
  r rooms;
begin
  select * into r from rooms where id = p_room;
  select id into pid from participants where room_id = p_room and user_id = auth.uid();
  if pid is null then raise exception 'You are not in this room.'; end if;
  if r.status <> 'open' or now() > r.registration_deadline then
    raise exception 'Registration has closed, so profiles are now locked.';
  end if;
  insert into identities(participant_id, loves, wants, needs, colours, treats, gift_types, avoid, notes, updated_at)
  values (pid, p_loves, p_wants, p_needs, p_colours, p_treats, p_gift_types, p_avoid, p_notes, now())
  on conflict (participant_id) do update set
    loves = excluded.loves, wants = excluded.wants, needs = excluded.needs, colours = excluded.colours,
    treats = excluded.treats, gift_types = excluded.gift_types, avoid = excluded.avoid,
    notes = excluded.notes, updated_at = now();
end $$;

-- The one place a participant learns about their recipient.
-- p_reveal = true is the "tap to reveal" action; it is only allowed on/after the draw date
-- and is permanent.
create or replace function public.my_assignment(p_room uuid, p_reveal boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r rooms;
  me participants;
  a assignments;
  rec participants;
  idt identities;
begin
  select * into r from rooms where id = p_room;
  select * into me from participants where room_id = p_room and user_id = auth.uid();
  if me.id is null then raise exception 'You are not in this room.'; end if;

  if r.status <> 'drawn' then
    return jsonb_build_object('state','not_drawn','draw_date',r.draw_date);
  end if;

  select * into a from assignments where santa_id = me.id;
  if a.santa_id is null then
    return jsonb_build_object('state','not_drawn','draw_date',r.draw_date);
  end if;

  if a.revealed_at is null then
    if now() < r.draw_date then
      return jsonb_build_object('state','waiting','draw_date',r.draw_date);
    end if;
    if not p_reveal then
      return jsonb_build_object('state','ready','draw_date',r.draw_date);
    end if;
    update assignments set revealed_at = now() where santa_id = me.id;
  end if;

  select * into rec from participants where id = a.recipient_id;
  select * into idt from identities where participant_id = rec.id;

  return jsonb_build_object(
    'state','revealed',
    'draw_date', r.draw_date,
    'exchange_date', r.exchange_date,
    'reveal_mode', r.reveal_mode,
    'recipient', jsonb_build_object(
      'number', rec.number,
      'code_name', rec.code_name,
      'display_name', case when r.reveal_mode = 'reveal' then rec.display_name else null end,
      'loves', idt.loves, 'wants', idt.wants, 'needs', idt.needs, 'colours', idt.colours,
      'treats', idt.treats, 'gift_types', idt.gift_types, 'avoid', idt.avoid, 'notes', idt.notes
    )
  );
end $$;


-- ---------- Gift Concierge usage cap --------------------------------
alter table public.participants add column if not exists concierge_uses int not null default 0;

-- Called by the server before each AI request. Only works once you've revealed.
create or replace function public.use_concierge(p_room uuid, p_limit int default 12)
returns int language plpgsql security definer set search_path = public as $$
declare me participants; used int;
begin
  select * into me from participants where room_id = p_room and user_id = auth.uid() for update;
  if me.id is null then raise exception 'You are not in this room.'; end if;
  if not exists (select 1 from assignments where santa_id = me.id and revealed_at is not null) then
    raise exception 'Reveal your recipient first.';
  end if;
  if me.concierge_uses >= p_limit then
    raise exception 'You''ve used all your Gift Concierge requests for this room.';
  end if;
  update participants set concierge_uses = concierge_uses + 1 where id = me.id returning concierge_uses into used;
  return p_limit - used;
end $$;

-- ---------- Function permissions ------------------------------------

revoke execute on all functions in schema public from public, anon;
grant execute on function public.room_preview(text) to anon, authenticated;
grant execute on function
  public.create_room(text,text,timestamptz,timestamptz,timestamptz,text,text,text,text),
  public.update_room(uuid,text,text,timestamptz,timestamptz,timestamptz,text,text,text,text),
  public.organiser_participants(uuid),
  public.organiser_exclusions(uuid),
  public.set_exclusion(uuid,uuid,uuid,boolean),
  public.run_draw(uuid),
  public.remove_participant(uuid),
  public.join_room(text,text),
  public.room_roster(uuid),
  public.save_identity(uuid,text,text,text,text,text,text,text,text),
  public.my_assignment(uuid,boolean),
  public.use_concierge(uuid,int),
  public.is_room_member(uuid),
  public.is_room_organiser(uuid)
to authenticated;
revoke execute on function public._new_join_code(), public._code_name(uuid,text) from authenticated;
