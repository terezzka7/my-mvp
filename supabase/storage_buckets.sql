-- Buildyfit — Storage buckets for template_assets / characters
-- assembly pipeline (§7.1/§11.1/§13.2 assemble-character).
-- Run in Supabase SQL Editor before seeding placeholder template assets.

-- template-assets: source body/style layers prepared by the designer.
-- Non-sensitive content, safe to read publicly (matches how public_profiles
-- already exposes character images publicly on /u/:username).
insert into storage.buckets (id, name, public)
values ('template-assets', 'template-assets', true)
on conflict (id) do nothing;

drop policy if exists "template_assets_authenticated_upload" on storage.objects;
create policy "template_assets_authenticated_upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'template-assets');

drop policy if exists "template_assets_public_read" on storage.objects;
create policy "template_assets_public_read"
on storage.objects for select
to public
using (bucket_id = 'template-assets');

-- characters: final composited character images (assemble-character output).
-- Also public — character art is shown on public profiles by design (§9.1 W-03).
insert into storage.buckets (id, name, public)
values ('characters', 'characters', true)
on conflict (id) do nothing;

drop policy if exists "characters_own_upload" on storage.objects;
create policy "characters_own_upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'characters' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "characters_own_update" on storage.objects;
create policy "characters_own_update"
on storage.objects for update
to authenticated
using (bucket_id = 'characters' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "characters_public_read" on storage.objects;
create policy "characters_public_read"
on storage.objects for select
to public
using (bucket_id = 'characters');
