-- Buildyfit -- weekly workout goal (mobile Settings sets it; web Stats reads it).
-- §10 users table doesn't list this column; adding it is a schema change
-- (a requirement of the designer's, not from the original book).
-- Existing users get the default of 4. RLS: users_update_own already lets a
-- user change their own row, so no new policy is needed.

alter table users
  add column if not exists weekly_goal integer not null default 4
  check (weekly_goal between 1 and 14);
