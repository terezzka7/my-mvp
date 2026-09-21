-- Buildyfit — public_profiles must honor users.is_private (M-15 "Скрыть
-- публичный профиль"). Run AFTER supabase/add_settings_columns.sql (that
-- one creates the is_private column; this fails without it).
--
-- create or replace keeps the existing grants (anon, authenticated) and
-- the exact same column list, so the web catalog/search and /u/:username
-- keep working unchanged — private users just stop appearing in them.

create or replace view public_profiles as
select
  u.id as user_id,
  u.username,
  u.display_name,
  c.level,
  c.xp_current,
  c.image_url
from users u
join characters c on c.user_id = u.id
where u.is_private = false;
