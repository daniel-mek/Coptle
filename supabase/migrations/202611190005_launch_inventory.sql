-- Shared inventory rules for the staff dashboard and the public availability gate.
create function coptle.launch_inventory()
returns table(game text, difficulty text, window_start date, window_end date,
  daily_ready integer, practice_ready integer, gaps jsonb)
language sql stable set search_path = pg_catalog as $$
  with launch_window as (
    select (now() at time zone 'America/New_York')::date as start_date
  ), combinations as (
    select g.id as game, level.difficulty
    from coptle.games as g
    cross join (values ('beginner'), ('intermediate'), ('advanced')) as level(difficulty)
  ), slots as (
    select c.game, c.difficulty, w.start_date + day.number as puzzle_date,
      case
        when d.version_id is null then 'missing'
        when withdrawn.version_id is not null then 'withdrawn'
        when length(trim(source.citation)) <= 500
          and coptle.playable_payload(c.game, c.difficulty, version.payload) then 'ready'
        else 'format'
      end as status
    from combinations as c cross join launch_window as w cross join generate_series(0, 29) as day(number)
    left join coptle.daily_puzzles as d
      on (d.game, d.difficulty, d.puzzle_date) = (c.game, c.difficulty, w.start_date + day.number)
    left join coptle.withdrawn_versions as withdrawn on withdrawn.version_id = d.version_id
    left join coptle.puzzle_versions as version on version.id = d.version_id
    left join coptle.sources as source on source.id = version.source_id
  ), daily as (
    select s.game, s.difficulty, count(*) filter (where s.status = 'ready')::integer as ready,
      coalesce(jsonb_agg(jsonb_build_object('date', s.puzzle_date, 'reason', s.status) order by s.puzzle_date)
        filter (where s.status <> 'ready'), '[]'::jsonb) as gaps
    from slots as s group by s.game, s.difficulty
  ), practice as (
    select p.game, p.difficulty, count(*)::integer as ready
    from coptle.available_practice_puzzles as p cross join launch_window as w
    where length(trim(p.citation)) <= 500 and coptle.playable_payload(p.game, p.difficulty, p.payload)
      and not exists (select 1 from coptle.available_daily_puzzles as future
        where future.game = p.game and future.puzzle_date >= w.start_date
          and lower(trim(future.payload->>'answer')) = lower(trim(p.payload->>'answer')))
    group by p.game, p.difficulty
  )
  select d.game, d.difficulty, w.start_date, w.start_date + 29,
    d.ready, coalesce(p.ready, 0), d.gaps
  from daily as d cross join launch_window as w left join practice as p using (game, difficulty);
$$;

create or replace function coptle.play_ready() returns table(game text, difficulty text)
language sql stable security definer set search_path = pg_catalog as $$
  select inventory.game, inventory.difficulty from coptle.launch_inventory() as inventory
  where inventory.daily_ready = inventory.window_end - inventory.window_start + 1
    and inventory.practice_ready > 0;
$$;

create function coptle.studio_launch_inventory()
returns table(game text, difficulty text, window_start date, window_end date,
  daily_ready integer, practice_ready integer, gaps jsonb)
language plpgsql stable security definer set search_path = pg_catalog as $$
begin
  if cardinality(coptle.editorial_capabilities()) = 0 then
    raise exception 'Editorial permission required' using errcode = '42501';
  end if;
  return query select * from coptle.launch_inventory();
end;
$$;

revoke all on function coptle.launch_inventory(), coptle.studio_launch_inventory()
  from public, anon, authenticated, service_role;
grant execute on function coptle.studio_launch_inventory() to coptle_studio;
