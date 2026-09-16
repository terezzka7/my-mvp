-- Fitness RPG Tracker — schema from product_book.md §10 (МОДЕЛЬ ДАННЫХ)
-- Tables: users, characters, workout_logs, challenges, user_challenges,
--         items, user_items, share_cards, streaks, template_assets
-- No RLS policies here — separate step.

create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type oauth_provider as enum ('email', 'apple', 'google');

-- users.platform_origin (§10 users table)
create type platform_origin_user as enum ('ios', 'web', 'android', 'tg-bot');

-- workout_logs.platform_origin has a DIFFERENT value set in §10 (no android)
create type platform_origin_workout as enum ('ios', 'web', 'tg-bot');

create type subscription_status as enum ('free', 'trial', 'active', 'expired');

create type workout_type as enum ('strength', 'cardio', 'flexibility', 'sports', 'other');

create type challenge_type as enum ('workout_count', 'duration_total', 'streak', 'type_specific');

-- user_challenges.status
create type user_challenge_status as enum ('active', 'completed', 'failed');

create type item_type as enum ('skin', 'equipment', 'frame', 'animation');

create type item_slot as enum ('head', 'body', 'weapon', 'cloak', 'background', 'card_frame');

create type item_rarity as enum ('common', 'rare', 'epic', 'legendary');

create type purchased_with as enum ('earned_currency', 'premium_currency', 'reward');

-- template_assets.category
create type template_category as enum ('body', 'style');

-- ============================================================
-- TABLES
-- ============================================================

-- template_assets (справочник, заполняется дизайнером до запуска)
create table template_assets (
  id uuid primary key default uuid_generate_v4(),
  category template_category not null,
  name text not null,
  criteria_tags text[] not null,
  image_url text not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- users (PK — FK на auth.users(id), БЕЗ default uuid_generate_v4())
create table users (
  id uuid primary key references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text,
  username text not null unique,
  display_name text,
  oauth_provider oauth_provider,
  telegram_id bigint,
  platform_origin platform_origin_user not null,
  referral_source text,
  referred_by uuid references users (id),
  subscription_status subscription_status not null,
  subscription_expires_at timestamptz,
  currency_earned integer not null,
  currency_premium integer not null
);

-- characters (1:1 → users)
create table characters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references users (id),
  name text not null,
  level integer not null,
  xp_current integer not null,
  xp_to_next integer not null,
  body_template_id uuid not null references template_assets (id),
  style_template_id uuid not null references template_assets (id),
  image_url text not null,
  equipped_items uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- workout_logs (1:N → users)
create table workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users (id),
  type workout_type not null,
  duration_minutes integer,
  weight_kg numeric,
  reps integer,
  note text,
  xp_earned integer not null,
  currency_earned integer not null,
  logged_at timestamptz not null,
  platform_origin platform_origin_workout not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- challenges (справочник)
create table challenges (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  type challenge_type not null,
  target_value integer not null,
  duration_days integer not null,
  xp_reward integer not null,
  currency_reward integer not null,
  is_seasonal boolean not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- user_challenges (N:M users ↔ challenges)
create table user_challenges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users (id),
  challenge_id uuid not null references challenges (id),
  progress integer not null,
  status user_challenge_status not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- items (каталог)
create table items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  type item_type not null,
  slot item_slot,
  image_url text not null,
  price_earned integer,
  price_premium integer,
  is_seasonal boolean not null,
  available_from timestamptz,
  available_until timestamptz,
  rarity item_rarity not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- user_items (N:M users ↔ items) — §10 указывает только created_at, без updated_at
create table user_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users (id),
  item_id uuid not null references items (id),
  purchased_with purchased_with not null,
  created_at timestamptz not null default now()
);

-- share_cards (1:N → users) — §10 указывает только created_at, без updated_at
create table share_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users (id),
  character_snapshot jsonb not null,
  stats_snapshot jsonb not null,
  frame_item_id uuid references items (id),
  og_image_url text,
  platform_shared_to text,
  created_at timestamptz not null default now()
);

-- streaks (1:1 → users)
create table streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references users (id),
  current_streak integer not null,
  longest_streak integer not null,
  last_workout_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES ON FK COLUMNS
-- (unique FK columns — characters.user_id, streaks.user_id — already have
-- an implicit index from their UNIQUE constraint, so no separate index)
-- ============================================================

create index idx_users_referred_by on users (referred_by);
create index idx_characters_body_template_id on characters (body_template_id);
create index idx_characters_style_template_id on characters (style_template_id);
create index idx_workout_logs_user_id on workout_logs (user_id);
create index idx_user_challenges_user_id on user_challenges (user_id);
create index idx_user_challenges_challenge_id on user_challenges (challenge_id);
create index idx_user_items_user_id on user_items (user_id);
create index idx_user_items_item_id on user_items (item_id);
create index idx_share_cards_user_id on share_cards (user_id);
create index idx_share_cards_frame_item_id on share_cards (frame_item_id);

-- ============================================================
-- updated_at AUTO-UPDATE TRIGGER
-- (skipped for user_items, share_cards — no updated_at column per §10)
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_template_assets
before update on template_assets
for each row execute function set_updated_at();

create trigger set_updated_at_users
before update on users
for each row execute function set_updated_at();

create trigger set_updated_at_characters
before update on characters
for each row execute function set_updated_at();

create trigger set_updated_at_workout_logs
before update on workout_logs
for each row execute function set_updated_at();

create trigger set_updated_at_challenges
before update on challenges
for each row execute function set_updated_at();

create trigger set_updated_at_user_challenges
before update on user_challenges
for each row execute function set_updated_at();

create trigger set_updated_at_items
before update on items
for each row execute function set_updated_at();

create trigger set_updated_at_streaks
before update on streaks
for each row execute function set_updated_at();
