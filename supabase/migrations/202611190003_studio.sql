-- Dedicated server login only. The web server verifies identity with Supabase Auth
-- before binding the subject to a transaction using coptle.studio_subject.
create role coptle_studio nologin;
grant usage on schema coptle to coptle_studio;

create table coptle.studio_permissions (
  person_id uuid not null references auth.users on delete cascade,
  permission text not null check (permission in ('draft', 'source', 'theology', 'gameplay', 'publish')),
  primary key (person_id, permission)
);
alter table coptle.studio_permissions enable row level security;
revoke all on coptle.studio_permissions from public, anon, authenticated, service_role, coptle_studio;

create function coptle.editorial_capabilities() returns text[]
language sql stable security definer set search_path = pg_catalog as $$
  select coalesce(array_agg(permission order by permission), '{}'::text[])
  from (
    select permission from coptle.studio_permissions
    where pg_has_role(session_user, 'coptle_studio', 'member')
      and person_id = case
        when current_setting('coptle.studio_subject', true) ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
        then current_setting('coptle.studio_subject', true)::uuid end
    union all
    select permission from coptle.editorial_permissions
      where login = session_user and not pg_has_role(session_user, 'coptle_studio', 'member')
  ) as assigned;
$$;

create or replace function coptle.editorial_person(required text) returns uuid
language plpgsql stable set search_path = pg_catalog as $$
declare person uuid;
begin
  if required is null or not (required = any(coptle.editorial_capabilities())) then
    raise exception 'Editorial permission required' using errcode = '42501';
  end if;
  if pg_has_role(session_user, 'coptle_studio', 'member') then
    return current_setting('coptle.studio_subject', true)::uuid;
  end if;
  select person_id into person from coptle.editorial_permissions
    where login = session_user and permission = required;
  return person;
end;
$$;

create or replace function coptle.editorial_versions()
returns table (version_id uuid, puzzle_id uuid, game text, difficulty text, category text,
  inventory text, version integer, payload jsonb, citation text, reviews jsonb, approved boolean, withdrawn boolean)
language plpgsql stable security definer set search_path = pg_catalog as $$
begin
  if cardinality(coptle.editorial_capabilities()) = 0 then
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

create function coptle.studio_schedule()
returns table (version_id uuid, puzzle_date date)
language plpgsql stable security definer set search_path = pg_catalog as $$
begin
  if cardinality(coptle.editorial_capabilities()) = 0 then
    raise exception 'Editorial permission required' using errcode = '42501';
  end if;
  return query select d.version_id, d.puzzle_date from coptle.daily_puzzles as d
    join coptle.available_daily_puzzles as a on a.version_id = d.version_id;
end;
$$;

revoke all on function coptle.editorial_capabilities(), coptle.studio_schedule() from public, anon, authenticated, service_role;
grant execute on function coptle.editorial_capabilities(), coptle.studio_schedule(),
  coptle.editorial_draft(uuid, text, text, text, text, text, text, jsonb),
  coptle.editorial_review(uuid, text, text), coptle.editorial_approve(uuid),
  coptle.editorial_schedule(uuid, date), coptle.editorial_withdraw(uuid, text), coptle.editorial_versions()
to coptle_studio;
