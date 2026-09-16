-- Fitness RPG Tracker — RLS policies from product_book.md §10 "Правила доступа (RLS)"
-- Run after supabase/schema.sql. Idempotent: safe to re-run (drops policies/view first).

-- ============================================================
-- PUBLIC VIEW for /u/:username and the public catalog
-- RLS is row-level, not column-level, so "публичные поля для /u/username"
-- for users/characters cannot be a plain policy on those tables without
-- also exposing private columns (email, subscription_status, currency...).
-- Standard fix: keep users/characters fully private (owner-only RLS) and
-- expose only safe columns through a view. Views run with the privileges
-- of their OWNER (postgres) by default, so this view can see all rows
-- while the base tables stay locked down for anon/authenticated.
-- ============================================================

drop view if exists public_profiles;

create view public_profiles as
select
  u.id as user_id,
  u.username,
  u.display_name,
  c.level,
  c.xp_current,
  c.image_url
from users u
join characters c on c.user_id = u.id;

grant select on public_profiles to anon, authenticated;

-- ============================================================
-- users
-- SELECT/UPDATE/DELETE: auth.uid() = id. Public fields go through the
-- public_profiles view above, not a policy on this table.
-- INSERT: no policy for anon/authenticated — row is meant to be created
-- by an Auth trigger (SECURITY DEFINER, not built yet) running as an
-- elevated role that bypasses RLS, not by the client directly.
-- ============================================================

alter table users enable row level security;

drop policy if exists users_select_own on users;
create policy users_select_own
on users for select
to authenticated
using (auth.uid() = id);

drop policy if exists users_update_own on users;
create policy users_update_own
on users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists users_delete_own on users;
create policy users_delete_own
on users for delete
to authenticated
using (auth.uid() = id);

-- ============================================================
-- characters
-- SELECT/INSERT/UPDATE: auth.uid() = user_id. Public fields via view.
-- DELETE: no policy at all (§10: "Запрещено").
-- ============================================================

alter table characters enable row level security;

drop policy if exists characters_select_own on characters;
create policy characters_select_own
on characters for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists characters_insert_own on characters;
create policy characters_insert_own
on characters for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists characters_update_own on characters;
create policy characters_update_own
on characters for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- no delete policy — DELETE is forbidden per §10

-- ============================================================
-- workout_logs
-- SELECT/INSERT/DELETE: auth.uid() = user_id, full row.
-- UPDATE: §10 marks this "auth.uid() = user_id (note)" — only the
-- `note` column may be edited after creation (xp/weight/reps feed the
-- gamification formula and must not be editable via the API). Enforced
-- with a column-level GRANT on top of the row-level policy.
-- ============================================================

alter table workout_logs enable row level security;

drop policy if exists workout_logs_select_own on workout_logs;
create policy workout_logs_select_own
on workout_logs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists workout_logs_insert_own on workout_logs;
create policy workout_logs_insert_own
on workout_logs for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists workout_logs_update_own on workout_logs;
create policy workout_logs_update_own
on workout_logs for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke update on workout_logs from authenticated;
grant update (note) on workout_logs to authenticated;

drop policy if exists workout_logs_delete_own on workout_logs;
create policy workout_logs_delete_own
on workout_logs for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================================
-- challenges (справочник)
-- SELECT: authenticated only. No client INSERT/UPDATE/DELETE policy —
-- only service_role (which bypasses RLS) may write.
-- ============================================================

alter table challenges enable row level security;

drop policy if exists challenges_select_authenticated on challenges;
create policy challenges_select_authenticated
on challenges for select
to authenticated
using (true);

-- ============================================================
-- user_challenges
-- SELECT/INSERT: auth.uid() = user_id. UPDATE (progress) is owned by an
-- Edge Function using service_role — no client policy. DELETE forbidden.
-- ============================================================

alter table user_challenges enable row level security;

drop policy if exists user_challenges_select_own on user_challenges;
create policy user_challenges_select_own
on user_challenges for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists user_challenges_insert_own on user_challenges;
create policy user_challenges_insert_own
on user_challenges for insert
to authenticated
with check (auth.uid() = user_id);

-- no update policy — Edge Function / service_role only
-- no delete policy — forbidden per §10

-- ============================================================
-- items (каталог)
-- Same pattern as challenges: read-only for authenticated, writes via
-- service_role only.
-- ============================================================

alter table items enable row level security;

drop policy if exists items_select_authenticated on items;
create policy items_select_authenticated
on items for select
to authenticated
using (true);

-- ============================================================
-- user_items
-- SELECT: auth.uid() = user_id. INSERT/UPDATE/DELETE: Edge Function /
-- service_role only — purchases must go through server-side logic.
-- ============================================================

alter table user_items enable row level security;

drop policy if exists user_items_select_own on user_items;
create policy user_items_select_own
on user_items for select
to authenticated
using (auth.uid() = user_id);

-- no insert/update/delete policy — Edge Function / service_role only

-- ============================================================
-- share_cards
-- SELECT/INSERT: auth.uid() = user_id. UPDATE/DELETE forbidden (§10).
-- ============================================================

alter table share_cards enable row level security;

drop policy if exists share_cards_select_own on share_cards;
create policy share_cards_select_own
on share_cards for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists share_cards_insert_own on share_cards;
create policy share_cards_insert_own
on share_cards for insert
to authenticated
with check (auth.uid() = user_id);

-- no update/delete policy — forbidden per §10

-- ============================================================
-- streaks
-- SELECT: auth.uid() = user_id. INSERT/UPDATE/DELETE: Edge Function /
-- service_role only (streak math must not be client-writable).
-- ============================================================

alter table streaks enable row level security;

drop policy if exists streaks_select_own on streaks;
create policy streaks_select_own
on streaks for select
to authenticated
using (auth.uid() = user_id);

-- no insert/update/delete policy — Edge Function / service_role only

-- ============================================================
-- template_assets (справочник)
-- SELECT: authenticated only. Writes: service_role only (designer content).
-- ============================================================

alter table template_assets enable row level security;

drop policy if exists template_assets_select_authenticated on template_assets;
create policy template_assets_select_authenticated
on template_assets for select
to authenticated
using (true);
