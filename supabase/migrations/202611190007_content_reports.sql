create table coptle.content_reports (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references coptle.approved_versions,
  reporter_hash text references coptle.play_guests(token_hash) on delete set null,
  category text not null check (category in ('answer','theology','scripture','history','ambiguity','translation','feast','technical','inappropriate')),
  details text not null check (length(details) <= 1000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  unique (reporter_hash, version_id)
);
create index content_reports_queue on coptle.content_reports(status, created_at desc);
create index play_sessions_report_lookup on coptle.play_sessions(token_hash, (board->>'id'));

create table coptle.content_report_events (
  id bigint generated always as identity primary key,
  report_id uuid not null references coptle.content_reports,
  moderator_id uuid not null references auth.users,
  status text not null check (status in ('open','resolved')),
  note text not null check (length(trim(note)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index content_report_events_report on coptle.content_report_events(report_id, id desc);
alter table coptle.content_reports enable row level security;
alter table coptle.content_report_events enable row level security;
revoke all on coptle.content_reports, coptle.content_report_events
  from public, anon, authenticated, service_role, coptle_studio, coptle_play;

create function coptle.play_report(subject_hash text, board_id uuid, report_category text, report_details text)
returns text language plpgsql security definer set search_path = pg_catalog as $$
declare
  version uuid;
begin
  -- Serialize reports from this guest and verify the live session owns the board.
  perform 1 from coptle.play_guests where token_hash = subject_hash and expires_at > now() for update;
  if not found then return 'unavailable'; end if;
  select s.version_id into version from coptle.play_sessions as s
    where s.token_hash = subject_hash and s.board->>'id' = board_id::text;
  if not found then return 'unavailable'; end if;
  if exists (select 1 from coptle.content_reports where reporter_hash = subject_hash and version_id = version) then
    return 'duplicate';
  end if;
  if (select count(*) from coptle.content_reports where reporter_hash = subject_hash and created_at >= now() - interval '24 hours') >= 10 then
    return 'limited';
  end if;
  insert into coptle.content_reports(version_id, reporter_hash, category, details)
    values (version, subject_hash, report_category, trim(report_details));
  return 'saved';
end;
$$;

create function coptle.studio_reports()
returns table(id uuid, version_id uuid, puzzle_id uuid, game text, difficulty text, version integer,
  category text, details text, status text, created_at timestamptz, history jsonb, withdrawn boolean)
language plpgsql stable security definer set search_path = pg_catalog as $$
begin
  perform coptle.editorial_person('publish');
  return query select r.id, r.version_id, v.puzzle_id, v.game, v.difficulty, v.version,
    r.category, r.details, r.status, r.created_at,
    coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'note', e.note,
      'moderator_id', e.moderator_id, 'created_at', e.created_at) order by e.id desc)
      from coptle.content_report_events as e where e.report_id = r.id), '[]'::jsonb),
    exists (select 1 from coptle.withdrawn_versions as w where w.version_id = r.version_id)
    from coptle.content_reports as r join coptle.puzzle_versions as v on v.id = r.version_id
    order by (r.status = 'open') desc, r.created_at desc, r.id limit 100;
end;
$$;

create function coptle.studio_moderate_report(target uuid, expected_status text, next_status text, internal_note text)
returns void language plpgsql security definer set search_path = pg_catalog as $$
declare
  moderator uuid := coptle.editorial_person('publish');
begin
  if expected_status not in ('open', 'resolved') or next_status not in ('open', 'resolved')
    or expected_status is not distinct from next_status or expected_status is null or next_status is null then
    raise exception 'Invalid report status transition' using errcode = '23514';
  end if;
  update coptle.content_reports set status = next_status where id = target and status = expected_status;
  if not found then raise exception 'Report changed or is unavailable' using errcode = '40001'; end if;
  insert into coptle.content_report_events(report_id, moderator_id, status, note)
    values (target, moderator, next_status, trim(internal_note));
end;
$$;

revoke all on function coptle.play_report(text, uuid, text, text), coptle.studio_reports(),
  coptle.studio_moderate_report(uuid, text, text, text) from public, anon, authenticated, service_role;
grant execute on function coptle.play_report(text, uuid, text, text) to coptle_play;
grant execute on function coptle.studio_reports(), coptle.studio_moderate_report(uuid, text, text, text) to coptle_studio;
