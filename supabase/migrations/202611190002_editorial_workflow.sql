-- Operators authenticate with individual PostgreSQL LOGIN roles mapped by a trusted administrator.
create role coptle_editorial nologin;
grant usage on schema coptle to coptle_editorial;

create table coptle.editorial_permissions (
  login name not null,
  person_id uuid not null references auth.users,
  permission text not null check (permission in ('draft', 'source', 'theology', 'gameplay', 'publish')),
  primary key (login, permission)
);
alter table coptle.editorial_permissions enable row level security;
revoke all on coptle.editorial_permissions from public, anon, authenticated, service_role, coptle_editorial;

create function coptle.editorial_person(required text) returns uuid
language plpgsql stable set search_path = pg_catalog as $$
declare person uuid;
begin
  select person_id into person from coptle.editorial_permissions
    where login = session_user and permission = required;
  if not found then raise exception 'Editorial permission required' using errcode = '42501'; end if;
  return person;
end;
$$;

create function coptle.editorial_draft(
  existing_puzzle uuid, game_id text, puzzle_difficulty text, category_name text,
  inventory_type text, citation_text text, license_text text, puzzle_payload jsonb
) returns uuid language plpgsql security definer set search_path = pg_catalog as $$
declare
  puzzle uuid := existing_puzzle;
  source uuid;
  version_id uuid;
  next_version integer;
begin
  perform coptle.editorial_person('draft');
  if puzzle is null then
    insert into coptle.puzzles(game, difficulty, category, inventory)
      values (game_id, puzzle_difficulty, category_name, inventory_type) returning id into puzzle;
  else
    perform 1 from coptle.puzzles where id = puzzle and game = game_id
      and difficulty = puzzle_difficulty and category = category_name and inventory = inventory_type for update;
    if not found then raise exception 'Puzzle metadata does not match' using errcode = '23514'; end if;
  end if;
  select coalesce(max(version), 0) + 1 into next_version
    from coptle.puzzle_versions where puzzle_id = puzzle;
  insert into coptle.sources(citation, license) values (citation_text, license_text) returning id into source;
  insert into coptle.puzzle_versions(puzzle_id, game, difficulty, inventory, version, source_id, payload)
    values (puzzle, game_id, puzzle_difficulty, inventory_type, next_version, source, puzzle_payload)
    returning id into version_id;
  return version_id;
end;
$$;

create function coptle.editorial_review(target_version uuid, review_stage text, verdict text)
returns void language plpgsql security definer set search_path = pg_catalog as $$
declare person uuid;
begin
  if review_stage is null or review_stage not in ('source', 'theology', 'gameplay') then
    raise exception 'Invalid review stage' using errcode = '23514';
  end if;
  person := coptle.editorial_person(review_stage);
  insert into coptle.content_reviews(version_id, stage, reviewer_id, decision)
    values (target_version, review_stage, person, verdict);
end;
$$;

create function coptle.editorial_approve(target_version uuid)
returns void language plpgsql security definer set search_path = pg_catalog as $$
begin
  insert into coptle.approved_versions(version_id, publisher_id)
    values (target_version, coptle.editorial_person('publish'));
end;
$$;

create function coptle.editorial_schedule(target_version uuid, target_date date)
returns void language plpgsql security definer set search_path = pg_catalog as $$
begin
  perform coptle.editorial_person('publish');
  insert into coptle.daily_puzzles(puzzle_date, game, difficulty, version_id)
    select target_date, game, difficulty, id from coptle.puzzle_versions where id = target_version;
  if not found then raise exception 'Puzzle version does not exist' using errcode = '23503'; end if;
end;
$$;

create function coptle.editorial_withdraw(target_version uuid, note text)
returns void language plpgsql security definer set search_path = pg_catalog as $$
begin
  perform coptle.editorial_person('publish');
  insert into coptle.withdrawn_versions(version_id, reason) values (target_version, note);
end;
$$;

create function coptle.editorial_versions()
returns table (version_id uuid, puzzle_id uuid, game text, difficulty text, category text,
  inventory text, version integer, payload jsonb, citation text, reviews jsonb, approved boolean, withdrawn boolean)
language plpgsql stable security definer set search_path = pg_catalog as $$
begin
  if not exists (select 1 from coptle.editorial_permissions where login = session_user) then
    raise exception 'Editorial permission required' using errcode = '42501';
  end if;
  return query select v.id, v.puzzle_id, v.game, v.difficulty, p.category, v.inventory, v.version, v.payload, s.citation,
    coalesce((select jsonb_object_agg(r.stage, jsonb_build_object('decision', r.decision, 'reviewer_id', r.reviewer_id, 'reviewed_at', r.reviewed_at)) from coptle.content_reviews as r where r.version_id = v.id), '{}'::jsonb),
    exists (select 1 from coptle.approved_versions as a where a.version_id = v.id),
    exists (select 1 from coptle.withdrawn_versions as w where w.version_id = v.id)
    from coptle.puzzle_versions as v
    join coptle.puzzles as p on p.id = v.puzzle_id
    join coptle.sources as s on s.id = v.source_id
    order by v.created_at desc, v.id desc limit 100;
end;
$$;

revoke all on all functions in schema coptle from public, anon, authenticated, service_role;
grant execute on function
  coptle.editorial_draft(uuid, text, text, text, text, text, text, jsonb),
  coptle.editorial_review(uuid, text, text), coptle.editorial_approve(uuid),
  coptle.editorial_schedule(uuid, date), coptle.editorial_withdraw(uuid, text),
  coptle.editorial_versions()
to coptle_editorial;
