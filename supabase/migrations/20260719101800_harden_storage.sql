-- Harden avatar listing + revoke accidental public SECURITY DEFINER execute

drop policy if exists "Avatar public read" on storage.objects;

create policy "Avatar authenticated read"
on storage.objects for select to authenticated
using (bucket_id = 'avatars');

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
