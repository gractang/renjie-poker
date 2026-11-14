-- Lets a signed-in user permanently delete their own account (App Store Guideline 5.1.1(v)).
-- profiles and game_sessions cascade from auth.users, and game_turns cascades from game_sessions,
-- so removing the auth user removes all of their data.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  delete from auth.users where id = caller;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
