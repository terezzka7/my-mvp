-- Buildyfit — "Auth trigger" from product_book.md §10 (users.INSERT)
-- Creates the public.users row automatically whenever a new auth.users row
-- appears (signup), and backfills existing auth users that predate this
-- trigger (e.g. accounts created while testing auth before this was wired).

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    username,
    platform_origin,
    subscription_status,
    currency_earned,
    currency_premium
  )
  values (
    new.id,
    new.email,
    split_part(coalesce(new.email, 'user'), '@', 1) || '_' || substr(md5(random()::text), 1, 6),
    coalesce((new.raw_user_meta_data ->> 'platform_origin')::platform_origin_user, 'web'),
    'free',
    0,
    0
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- Backfill: give every existing auth.users row a public.users row too,
-- for accounts created before this trigger existed.
insert into public.users (id, email, username, platform_origin, subscription_status, currency_earned, currency_premium)
select
  au.id,
  au.email,
  split_part(coalesce(au.email, 'user'), '@', 1) || '_' || substr(md5(random()::text), 1, 6),
  'web',
  'free',
  0,
  0
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null;
