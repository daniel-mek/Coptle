-- Disposable database tests only. The records are synthetic game and approval data.
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000001');
do $$
declare
  p uuid;
  v uuid;
  src uuid;
  n integer;
  day date := (now() at time zone 'America/New_York')::date;
  inventory text;
  answer text;
  actor uuid := '00000000-0000-0000-0000-000000000001';
begin
  insert into coptle.sources(citation) values ('Synthetic test citation') returning id into src;
  for n in -1..32 loop
    inventory := case when n >= 30 then 'practice' else 'daily' end;
    answer := case n when -1 then 'slate' when 0 then 'stone' when 30 then 'light'
      when 31 then 'stone' when 32 then 'plant' else 'g' || chr(97 + n / 26) || chr(97 + n % 26) || 'me' end;
    insert into coptle.puzzles(game, difficulty, category, inventory)
      values ('word','beginner','test only',inventory) returning id into p;
    insert into coptle.puzzle_versions(puzzle_id, game, difficulty, inventory, version, source_id, payload)
      values (p,'word','beginner',inventory,1,src,jsonb_build_object('answer', answer, 'explanation', 'Test-only explanation', 'aliases', '[]'::jsonb))
      returning id into v;
    insert into coptle.content_reviews(version_id, stage, reviewer_id, decision)
      select v, stage, actor, 'approved' from unnest(array['source','theology','gameplay']) as stage;
    insert into coptle.approved_versions(version_id, publisher_id) values (v, actor);
    if inventory = 'daily' then
      insert into coptle.daily_puzzles(puzzle_date, game, difficulty, version_id)
        values (day + n, 'word','beginner',v);
    end if;
  end loop;
end;
$$;
