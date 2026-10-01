-- One-off backfill: accounts created on mobile before onboarding started
-- writing users.display_name have it empty, so the web catalog and public
-- page fall back to the technical username (e.g. andrey_3a1db7).
-- Copies the hero name the user picked at onboarding into display_name.
--
-- Safe to re-run: only touches rows where display_name is still empty, and
-- skips the Edge Function's placeholder name 'Герой' (not a user choice).

update users u
set display_name = btrim(c.name)
from characters c
where c.user_id = u.id
  and (u.display_name is null or btrim(u.display_name) = '')
  and btrim(c.name) <> ''
  and btrim(c.name) <> 'Герой';

-- Check the result:
-- select username, display_name from users order by created_at desc;
