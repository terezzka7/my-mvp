-- Buildyfit -- weekly workout goal HISTORY (replaces the old single users.weekly_goal idea;
-- supabase/add_weekly_goal.sql, the singular one, is no longer needed).
-- §10 doesn't list this table; adding it is a schema change the designer asked for:
-- the goal can differ from week to week (5 this week, 6 the next), and past
-- weeks keep the goal they had.
--
-- One row = "from this Monday on the goal is N". The goal of a given week is the
-- row of that week, else the latest earlier row, else the app default of 4.
-- Idempotent: safe to re-run.

create table if not exists weekly_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1), -- always a Monday
  goal integer not null check (goal between 1 and 14),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

drop trigger if exists set_updated_at_weekly_goals on weekly_goals;
create trigger set_updated_at_weekly_goals
before update on weekly_goals
for each row execute function set_updated_at();

-- The unique (user_id, week_start) constraint already indexes user_id lookups.

-- RLS (rule from §10: each user only sees and writes their own rows).
alter table weekly_goals enable row level security;

drop policy if exists weekly_goals_select_own on weekly_goals;
create policy weekly_goals_select_own
on weekly_goals for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists weekly_goals_insert_own on weekly_goals;
create policy weekly_goals_insert_own
on weekly_goals for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists weekly_goals_update_own on weekly_goals;
create policy weekly_goals_update_own
on weekly_goals for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
-- No DELETE policy: history is never removed by the client.

-- Existing players: one starting row from the Monday of their sign-up week with
-- the default goal of 4, so every past week keeps the goal that was in force
-- (nobody could change it before this table existed).
-- Does not depend on users.weekly_goal: that column was never required.
insert into weekly_goals (user_id, week_start, goal)
select u.id, date_trunc('week', u.created_at)::date, 4
from users u
on conflict (user_id, week_start) do nothing;
