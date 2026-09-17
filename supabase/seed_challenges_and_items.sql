-- Buildyfit -- seed data for challenges/items (§10). Both tables are
-- read-only for authenticated clients (RLS) and empty until now, which
-- is why M-07/M-08/M-09/M-10/M-10a had nothing real to show.
--
-- Convention for Pro-gated items (no is_pro column in §10 items table):
-- price_earned = null AND price_premium = null means the item is only
-- unlocked via Buildyfit Pro subscription, not purchasable with coins.

insert into challenges (title, description, type, target_value, duration_days, xp_reward, currency_reward, is_seasonal, starts_at, ends_at) values
  ('7 тренировок за 14 дней', 'Базовый челлендж на регулярность. Считается любая залогированная тренировка.', 'workout_count', 7, 14, 400, 100, false, now(), now() + interval '14 days'),
  ('Серия 10 дней подряд', 'Держи серию без пропусков. Пропуск не сбрасывает счётчик до нуля, но и не продвигает прогресс.', 'streak', 10, 10, 600, 150, false, now(), now() + interval '10 days'),
  ('Кардио-марафон · 300 минут', 'Набери 300 минут кардио-тренировок за месяц.', 'duration_total', 300, 30, 800, 200, false, now(), now() + interval '30 days'),
  ('Разминка: 3 тренировки', 'Разминочный челлендж для новых игроков — считается любая тренировка.', 'type_specific', 3, 7, 200, 50, false, now(), now() + interval '7 days')
on conflict do nothing;

insert into items (name, description, type, slot, image_url, price_earned, price_premium, is_seasonal, rarity) values
  ('Ретро-худи', 'Оверсайз-худи в стиле ретро.', 'skin', 'body', 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/items/retro-hoodie.png', 180, null, false, 'rare'),
  ('Неон-кроссы', 'Кроссовки со светящейся подошвой. Заметны на шеринг-карточке.', 'skin', 'body', 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/items/neon-sneakers.png', 240, null, false, 'rare'),
  ('Кепка снепбек', 'Классический снепбек. Базовый предмет.', 'skin', 'head', 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/items/snapback.png', 120, null, false, 'common'),
  ('Фон «Спортзал»', 'Фон для публичной страницы и шеринг-карточки.', 'frame', 'background', 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/items/gym-background.png', 300, null, false, 'common'),
  ('Титановый скин', 'Pro-предмет. Доступен только по подписке Buildyfit Pro.', 'skin', 'body', 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/items/titanium-skin.png', null, null, false, 'legendary'),
  ('Аура победителя', 'Эффект вокруг персонажа. Pro-предмет.', 'animation', null, 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/items/winner-aura.png', null, null, false, 'legendary')
on conflict do nothing;
