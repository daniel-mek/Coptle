create table coptle.draft_imports (
  fingerprint text primary key,
  author_id uuid not null references auth.users,
  draft_count integer not null check (draft_count between 1 and 25),
  imported_at timestamptz not null default now()
);
alter table coptle.draft_imports enable row level security;
revoke all on coptle.draft_imports from public, anon, authenticated, service_role, coptle_studio;

create function coptle.studio_import_drafts(drafts jsonb)
returns table(draft_count integer, repeated boolean)
language plpgsql security definer set search_path = pg_catalog as $$
declare
  author uuid;
  count integer;
  draft jsonb;
begin
  author := coptle.editorial_person('draft');
  if jsonb_typeof(drafts) is distinct from 'array' or octet_length(drafts::text) > 240000 then
    raise exception 'Invalid draft batch' using errcode = '23514';
  end if;
  count := jsonb_array_length(drafts);
  if count not between 1 and 25 then
    raise exception 'Invalid draft count' using errcode = '23514';
  end if;
  insert into coptle.draft_imports(fingerprint, author_id, draft_count)
    values (encode(sha256(convert_to(drafts::text, 'UTF8')), 'hex'), author, count)
    on conflict (fingerprint) do nothing;
  if not found then
    return query select count, true;
    return;
  end if;

  for draft in select value from jsonb_array_elements(drafts) loop
    if jsonb_typeof(draft->'payload'->'aliases') is distinct from 'array' then
      raise exception 'Invalid draft payload' using errcode = '23514';
    end if;
    if not coalesce(coptle.playable_payload(draft->>'game', draft->>'difficulty', draft->'payload'), false)
      or length(draft->>'citation') > 500 then
      raise exception 'Invalid draft payload' using errcode = '23514';
    end if;
    perform coptle.editorial_draft(null, draft->>'game', draft->>'difficulty',
      draft->>'category', draft->>'inventory', draft->>'citation', draft->>'license', draft->'payload');
  end loop;
  return query select count, false;
end;
$$;
revoke all on function coptle.studio_import_drafts(jsonb) from public, anon, authenticated, service_role;
grant execute on function coptle.studio_import_drafts(jsonb) to coptle_studio;
