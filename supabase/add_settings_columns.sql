-- Buildyfit -- M-15 Настройки toggles (push/напоминание/приватность).
-- §10 users table doesn't list these columns; adding them is a schema
-- change the designer explicitly approved rather than storing them
-- only on-device.

alter table users
  add column if not exists push_enabled boolean not null default true,
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists is_private boolean not null default false;
