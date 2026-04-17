-- Run this in your Supabase project: SQL Editor → New query → Run
--
-- Step 1: Ensure the wardrobe-images bucket exists and is public.
-- (If you haven't created it yet: Storage → Create bucket → name: wardrobe-images → Public: yes)
--
-- Step 2: Drop any existing policy and recreate with correct bucket scope and WITH CHECK.

drop policy if exists "users manage own images" on storage.objects;

create policy "users manage own images"
  on storage.objects
  for all
  to authenticated
  using  (bucket_id = 'wardrobe-images' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'wardrobe-images' and auth.uid()::text = (storage.foldername(name))[1]);
