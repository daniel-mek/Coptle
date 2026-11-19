create role coptle_play nologin;
grant usage on schema coptle to coptle_play;

create table coptle.play_guests (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  window_started timestamptz not null default now(),
  mutations integer not null default 0 check (mutations between 0 and 60)
);
create index play_guests_expiry on coptle.play_guests(expires_at);

create table coptle.play_sessions (
  token_hash text not null references coptle.play_guests on delete cascade,
  game text not null references coptle.games,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  mode text not null check (mode in ('daily', 'archive', 'practice')),
  slot text not null check (slot = 'practice' or slot ~ '^\d{4}-\d{2}-\d{2}$'),
  version_id uuid not null references coptle.approved_versions,
  inventory text generated always as (case when mode = 'practice' then 'practice' else 'daily' end) stored,
  board jsonb not null check (jsonb_typeof(board) = 'object' and octet_length(board::text) <= 524288),
  last_mutation uuid,
  primary key (token_hash, game, difficulty, mode, slot),
  foreign key (version_id, game, difficulty, inventory)
    references coptle.puzzle_versions(id, game, difficulty, inventory)
);
alter table coptle.play_guests enable row level security;
alter table coptle.play_sessions enable row level security;
revoke all on coptle.play_guests, coptle.play_sessions from public, anon, authenticated, service_role, coptle_studio, coptle_editorial;
grant select, insert, update(window_started, mutations) on coptle.play_guests to coptle_play;
grant select, insert, update(version_id, board, last_mutation), delete on coptle.play_sessions to coptle_play;
create policy play_guest_rows on coptle.play_guests for all to coptle_play using (true) with check (true);
create policy play_session_rows on coptle.play_sessions for all to coptle_play using (true) with check (true);

-- These checks match the formats currently playable. Unsupported editorial drafts
-- can still be saved and reviewed, but do not satisfy the launch inventory.
create function coptle.playable_payload(game text, difficulty text, payload jsonb) returns boolean
language sql immutable set search_path = pg_catalog as $$
  select length(trim(payload->>'answer')) between 1 and 120
    and length(trim(payload->>'explanation')) between 1 and 4000
    and jsonb_array_length(payload->'aliases') <= 20
    and not exists (select 1 from jsonb_array_elements(payload->'aliases') as alias(value)
      where jsonb_typeof(alias.value) <> 'string' or length(trim(alias.value #>> '{}')) not between 1 and 120)
    and case game
    when 'word' then payload->>'answer' ~ case difficulty
      when 'beginner' then '^[A-Za-z]{5}$' when 'intermediate' then '^[A-Za-z]{6}$' else '^[A-Za-z]{7,9}$' end
    when 'versele' then jsonb_typeof(payload->'prompt') = 'string' and length(trim(payload->>'prompt')) between 1 and 1000
      and case when jsonb_typeof(payload->'options') = 'array' then
        jsonb_array_length(payload->'options') between 2 and 6
        and not exists (select 1 from jsonb_array_elements(payload->'options') as option(value)
          where jsonb_typeof(option.value) <> 'string' or length(trim(option.value #>> '{}')) not between 1 and 120)
        and (select count(distinct lower(trim(value))) from jsonb_array_elements_text(payload->'options')) = jsonb_array_length(payload->'options')
        and exists (
          select 1 from jsonb_array_elements_text(payload->'options') as opt(value)
          where lower(trim(opt.value)) = lower(trim(payload->>'answer')))
      else difficulty <> 'beginner' and not (payload ? 'options') end
    when 'saintle' then jsonb_typeof(payload->'region') = 'string' and length(trim(payload->>'region')) between 1 and 120
      and jsonb_typeof(payload->'vocation') = 'string' and length(trim(payload->>'vocation')) between 1 and 120
      and case when jsonb_typeof(payload->'candidates') = 'array' then
        jsonb_array_length(payload->'candidates') between 3 and 20
        and (select count(distinct lower(trim(value->>'answer'))) from jsonb_array_elements(payload->'candidates')) = jsonb_array_length(payload->'candidates')
        and not exists (
          select 1 from jsonb_array_elements(payload->'candidates') as candidate(value)
          where not coalesce(
            jsonb_typeof(candidate.value->'answer') = 'string' and length(trim(candidate.value->>'answer')) between 1 and 120
            and jsonb_typeof(candidate.value->'region') = 'string' and length(trim(candidate.value->>'region')) between 1 and 120
            and jsonb_typeof(candidate.value->'vocation') = 'string' and length(trim(candidate.value->>'vocation')) between 1 and 120
            and case when candidate.value ? 'aliases' then
              case when jsonb_typeof(candidate.value->'aliases') = 'array' then
                jsonb_array_length(candidate.value->'aliases') <= 20
                and not exists (select 1 from jsonb_array_elements(candidate.value->'aliases') as alias(value)
                  where jsonb_typeof(alias.value) <> 'string' or length(trim(alias.value #>> '{}')) not between 1 and 120)
                else false end
              else true end, false))
        and exists (
          select 1 from jsonb_array_elements(payload->'candidates') as candidate(value)
          where lower(trim(candidate.value->>'answer')) = lower(trim(payload->>'answer'))
          and candidate.value->>'region' = payload->>'region'
          and candidate.value->>'vocation' = payload->>'vocation')
      else false end
    else false end;
$$;

create function coptle.play_ready() returns table(game text, difficulty text)
language sql stable security definer set search_path = pg_catalog as $$
  select d.game, d.difficulty
  from coptle.available_daily_puzzles as d
  where d.puzzle_date >= (now() at time zone 'America/New_York')::date
    and d.puzzle_date < (now() at time zone 'America/New_York')::date + 30
    and length(trim(d.citation)) <= 500
    and coptle.playable_payload(d.game, d.difficulty, d.payload)
    and exists (select 1 from coptle.available_practice_puzzles as p
      where p.game = d.game and p.difficulty = d.difficulty
        and length(trim(p.citation)) <= 500
        and coptle.playable_payload(p.game, p.difficulty, p.payload)
        and not exists (select 1 from coptle.available_daily_puzzles as future
          where future.game = p.game and future.puzzle_date >= (now() at time zone 'America/New_York')::date
            and lower(trim(future.payload->>'answer')) = lower(trim(p.payload->>'answer'))))
  group by d.game, d.difficulty having count(*) = 30;
$$;

create function coptle.play_archive(wanted_difficulty text)
returns table(game text, puzzle_date date)
language sql stable security definer set search_path = pg_catalog as $$
  select d.game, d.puzzle_date from coptle.available_daily_puzzles as d
  join coptle.play_ready() as r using (game, difficulty)
  where d.difficulty = wanted_difficulty
    and d.puzzle_date between (now() at time zone 'America/New_York')::date - 7
      and (now() at time zone 'America/New_York')::date - 1
    and length(trim(d.citation)) <= 500
    and coptle.playable_payload(d.game, d.difficulty, d.payload)
  order by d.puzzle_date desc, d.game;
$$;

create function coptle.play_pick(wanted_game text, wanted_difficulty text, wanted_mode text,
  wanted_date date, subject_hash text default null, avoid uuid default null)
returns table(version_id uuid, payload jsonb, citation text)
language sql volatile security definer set search_path = pg_catalog as $$
  with pinned as (
    select session.version_id from coptle.play_sessions as session
    join coptle.play_guests as guest using (token_hash)
    where session.token_hash = subject_hash and guest.expires_at > now()
      and session.game = wanted_game and session.difficulty = wanted_difficulty and session.mode = wanted_mode
      and session.slot = case when wanted_mode = 'practice' then 'practice' else wanted_date::text end
  )
  select chosen.version_id, chosen.payload, chosen.citation
  from (
    select d.version_id, d.payload, d.citation from coptle.available_daily_puzzles as d
    where wanted_mode in ('daily','archive') and d.puzzle_date = wanted_date
      and d.game = wanted_game and d.difficulty = wanted_difficulty and not exists (select 1 from pinned)
      and (wanted_mode = 'daily' and wanted_date = (now() at time zone 'America/New_York')::date
        or wanted_mode = 'archive' and wanted_date between (now() at time zone 'America/New_York')::date - 7
          and (now() at time zone 'America/New_York')::date - 1)
    union all
    select p.version_id, p.payload, p.citation from coptle.available_practice_puzzles as p
    where wanted_mode = 'practice' and p.game = wanted_game and p.difficulty = wanted_difficulty
      and not exists (select 1 from pinned)
      and not exists (select 1 from coptle.available_daily_puzzles as future
        where future.game = p.game and future.puzzle_date >= (now() at time zone 'America/New_York')::date
          and lower(trim(future.payload->>'answer')) = lower(trim(p.payload->>'answer')))
    union all
    select v.id, v.payload, s.citation from coptle.puzzle_versions as v
    join coptle.approved_versions as a on a.version_id = v.id
    join coptle.sources as s on s.id = v.source_id
    where v.id = (select version_id from pinned) and v.game = wanted_game and v.difficulty = wanted_difficulty
      and v.inventory = case when wanted_mode = 'practice' then 'practice' else 'daily' end
      and not exists (select 1 from coptle.withdrawn_versions as w where w.version_id = v.id)
  ) as chosen
  where (wanted_mode = 'practice' or
    wanted_mode = 'daily' and wanted_date = (now() at time zone 'America/New_York')::date or
    wanted_mode = 'archive' and wanted_date between (now() at time zone 'America/New_York')::date - 7
      and (now() at time zone 'America/New_York')::date - 1)
    and length(trim(chosen.citation)) <= 500
    and (wanted_mode <> 'practice' or not exists (
      select 1 from coptle.available_daily_puzzles as future
      where future.game = wanted_game and future.puzzle_date >= (now() at time zone 'America/New_York')::date
        and lower(trim(future.payload->>'answer')) = lower(trim(chosen.payload->>'answer'))))
    and coptle.playable_payload(wanted_game, wanted_difficulty, chosen.payload)
    and exists (select 1 from coptle.play_ready() as r where r.game = wanted_game and r.difficulty = wanted_difficulty)
  order by coalesce(chosen.version_id = avoid, false), random()
  limit 1;
$$;

revoke all on function coptle.playable_payload(text,text,jsonb), coptle.play_ready(),
  coptle.play_archive(text), coptle.play_pick(text,text,text,date,text,uuid) from public, anon, authenticated, service_role;
grant execute on function coptle.play_ready(), coptle.play_archive(text),
  coptle.play_pick(text,text,text,date,text,uuid) to coptle_play;
