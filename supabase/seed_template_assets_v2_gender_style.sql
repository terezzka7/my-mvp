-- Fitness RPG Tracker — onboarding criteria change: "телосложение" (body
-- type) → "пол" (gender); style set 3 → 4 (Классика/Ретро/Стрит/Футуризм).
-- Removes the old 7 placeholder template_assets rows and inserts the new
-- 6 (2 body + 4 style). Old Storage objects are left in place (harmless,
-- no DELETE policy granted on that bucket for regular users) — only the
-- DB rows that made them selectable are removed here.
--
-- Any existing character referencing the old body/style templates blocks
-- the delete below via the characters_body_template_id_fkey/
-- characters_style_template_id_fkey foreign keys. Deleting them first is
-- intentional — the plan was always to reassemble via "Пересобрать".
-- Scoped by what's actually referenced (not a specific user_id), since
-- more than one test account turned out to have assembled a character.

delete from characters
where body_template_id in (select id from template_assets where created_by = 'placeholder-script')
   or style_template_id in (select id from template_assets where created_by = 'placeholder-script');

delete from template_assets where created_by = 'placeholder-script';

insert into template_assets (category, name, criteria_tags, image_url, created_by) values
  ('body', 'Мужской', ARRAY['мужской'], 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/body/male.png', 'placeholder-script'),
  ('body', 'Женский', ARRAY['женский'], 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/body/female.png', 'placeholder-script'),
  ('style', 'Классика', ARRAY['классика'], 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/style/classic.png', 'placeholder-script'),
  ('style', 'Ретро', ARRAY['ретро'], 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/style/retro.png', 'placeholder-script'),
  ('style', 'Стрит', ARRAY['стрит'], 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/style/street-look.png', 'placeholder-script'),
  ('style', 'Футуризм', ARRAY['футуризм'], 'https://btarlycwkcyjaqvvvnvx.supabase.co/storage/v1/object/public/template-assets/style/futurism.png', 'placeholder-script');
