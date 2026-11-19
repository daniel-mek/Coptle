-- Apply only to a dedicated development/preview database.
-- Provision a LOGIN role outside of source control and grant it membership in coptle_fixture_app.
create role coptle_fixture_app nologin;
create table coptle.fixture_guests (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_ms bigint not null,
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) < 524288)
);
create index fixture_guests_expiry on coptle.fixture_guests (expires_ms);
alter table coptle.fixture_guests enable row level security;
revoke all on coptle.fixture_guests from public, anon, authenticated, service_role;
grant usage on schema coptle to coptle_fixture_app;
grant select, insert, update (state) on coptle.fixture_guests to coptle_fixture_app;
create policy fixture_app_rows on coptle.fixture_guests
  for all to coptle_fixture_app using (true) with check (true);
