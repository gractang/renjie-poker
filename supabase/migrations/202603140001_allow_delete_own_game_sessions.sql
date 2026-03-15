drop policy if exists "game_sessions_delete_own"
  on public.game_sessions;

create policy "game_sessions_delete_own"
  on public.game_sessions
  for delete
  using (auth.uid() = user_id);
