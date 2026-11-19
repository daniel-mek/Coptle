-- Only the migration/operator role can write while Content Studio authorization is pending.
create schema coptle;
revoke all on schema coptle from public, anon, authenticated, service_role;

create table coptle.games (
  id text primary key
);
insert into coptle.games values ('word'), ('saintle'), ('versele');

create table coptle.sources (
  id uuid primary key default gen_random_uuid(),
  citation text not null check (length(trim(citation)) > 0),
  license text
);

create table coptle.puzzles (
  id uuid primary key default gen_random_uuid(),
  game text not null references coptle.games,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text not null check (length(trim(category)) > 0),
  inventory text not null check (inventory in ('daily', 'practice')),
  unique (id, game, difficulty, inventory)
);

create table coptle.puzzle_versions (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid not null,
  game text not null,
  difficulty text not null,
  inventory text not null,
  version integer not null check (version > 0),
  source_id uuid not null references coptle.sources,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ?& array['answer', 'explanation', 'aliases']
    and jsonb_typeof(payload->'answer') = 'string'
    and jsonb_typeof(payload->'explanation') = 'string'
    and jsonb_typeof(payload->'aliases') = 'array'
    and length(trim(payload->>'answer')) > 0
    and length(trim(payload->>'explanation')) > 0
  ),
  created_at timestamptz not null default now(),
  unique (puzzle_id, version),
  unique (id, game, difficulty, inventory),
  foreign key (puzzle_id, game, difficulty, inventory)
    references coptle.puzzles (id, game, difficulty, inventory)
);

create table coptle.content_reviews (
  version_id uuid not null references coptle.puzzle_versions,
  stage text not null check (stage in ('source', 'theology', 'gameplay')),
  reviewer_id uuid not null references auth.users,
  decision text not null check (decision in ('approved', 'rejected')),
  reviewed_at timestamptz not null default now(),
  primary key (version_id, stage),
  unique (version_id, stage, decision)
);

create table coptle.approved_versions (
  version_id uuid primary key references coptle.puzzle_versions,
  publisher_id uuid not null references auth.users,
  approved_at timestamptz not null default now(),
  decision text generated always as ('approved') stored,
  source_stage text generated always as ('source') stored,
  theology_stage text generated always as ('theology') stored,
  gameplay_stage text generated always as ('gameplay') stored,
  foreign key (version_id, source_stage, decision) references coptle.content_reviews (version_id, stage, decision),
  foreign key (version_id, theology_stage, decision) references coptle.content_reviews (version_id, stage, decision),
  foreign key (version_id, gameplay_stage, decision) references coptle.content_reviews (version_id, stage, decision)
);

create table coptle.withdrawn_versions (
  version_id uuid primary key references coptle.puzzle_versions,
  withdrawn_at timestamptz not null default now(),
  reason text not null check (length(trim(reason)) > 0)
);

create table coptle.daily_puzzles (
  puzzle_date date not null,
  game text not null,
  difficulty text not null,
  version_id uuid not null references coptle.approved_versions,
  inventory text generated always as ('daily') stored,
  primary key (puzzle_date, game, difficulty),
  unique (version_id),
  foreign key (version_id, game, difficulty, inventory)
    references coptle.puzzle_versions (id, game, difficulty, inventory)
);

-- Version creation and scheduling serialize on the puzzle row.
create function coptle.lock_version_parent() returns trigger language plpgsql
  set search_path = pg_catalog
as $$
begin
  perform 1 from coptle.puzzles where id = new.puzzle_id for update;
  return new;
end;
$$;

create trigger version_lock before insert on coptle.puzzle_versions
  for each row execute function coptle.lock_version_parent();

create function coptle.check_schedule_version() returns trigger language plpgsql
  set search_path = pg_catalog
as $$
declare
  chosen coptle.puzzle_versions%rowtype;
begin
  select * into chosen from coptle.puzzle_versions where id = new.version_id;
  if not found then return new; end if;
  perform 1 from coptle.puzzles where id = chosen.puzzle_id for update;
  if exists (
    select 1 from coptle.puzzle_versions as newer
    where newer.puzzle_id = chosen.puzzle_id and newer.version > chosen.version
  ) or exists (
    select 1 from coptle.withdrawn_versions as withdrawn where withdrawn.version_id = chosen.id
  ) then
    raise exception 'Schedule the latest approved and active version' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger schedule_version before insert or update on coptle.daily_puzzles
  for each row execute function coptle.check_schedule_version();

create function coptle.immutable_record() returns trigger language plpgsql
  set search_path = pg_catalog
as $$
begin
  raise exception 'Create a new version instead of changing review evidence or versioned content';
end;
$$;

create trigger immutable_source before update or delete on coptle.sources
  for each row execute function coptle.immutable_record();
create trigger immutable_puzzle before update or delete on coptle.puzzles
  for each row execute function coptle.immutable_record();
create trigger immutable_version before update or delete on coptle.puzzle_versions
  for each row execute function coptle.immutable_record();
create trigger immutable_review before update or delete on coptle.content_reviews
  for each row execute function coptle.immutable_record();
create trigger immutable_approval before update or delete on coptle.approved_versions
  for each row execute function coptle.immutable_record();
create trigger immutable_withdrawal before update or delete on coptle.withdrawn_versions
  for each row execute function coptle.immutable_record();

create view coptle.available_daily_puzzles with (security_invoker = true) as
select schedule.puzzle_date, schedule.game, schedule.difficulty, version.id as version_id,
       version.payload, source.citation
from coptle.daily_puzzles as schedule
join coptle.puzzle_versions as version on version.id = schedule.version_id
join coptle.sources as source on source.id = version.source_id
where not exists (
  select 1 from coptle.withdrawn_versions as withdrawn where withdrawn.version_id = version.id
);

create view coptle.available_practice_puzzles with (security_invoker = true) as
select version.game, version.difficulty, version.id as version_id, version.payload, source.citation
from coptle.approved_versions as approval
join coptle.puzzle_versions as version on version.id = approval.version_id
join coptle.sources as source on source.id = version.source_id
where version.inventory = 'practice' and not exists (
  select 1 from coptle.withdrawn_versions as withdrawn where withdrawn.version_id = version.id
);

alter table coptle.games enable row level security;
alter table coptle.sources enable row level security;
alter table coptle.puzzles enable row level security;
alter table coptle.puzzle_versions enable row level security;
alter table coptle.content_reviews enable row level security;
alter table coptle.approved_versions enable row level security;
alter table coptle.withdrawn_versions enable row level security;
alter table coptle.daily_puzzles enable row level security;
revoke all on all tables in schema coptle from public, anon, authenticated, service_role;
revoke all on all functions in schema coptle from public, anon, authenticated, service_role;
