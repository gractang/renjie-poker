create table if not exists public.app_config (
  id integer primary key check (id = 1),
  leaderboard_min_hands integer not null check (leaderboard_min_hands > 0),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.app_config (id, leaderboard_min_hands)
values (1, 100)
on conflict (id) do nothing;

alter table public.app_config enable row level security;

drop policy if exists "app config is readable by everyone" on public.app_config;
create policy "app config is readable by everyone"
  on public.app_config
  for select
  to anon, authenticated
  using (true);

grant select on public.app_config to anon, authenticated;

create or replace view public.leaderboard_candidates as
select
  p.user_id,
  coalesce(nullif(trim(p.leaderboard_name), ''), nullif(trim(p.display_name), '')) as display_name,
  us.completed_hands,
  us.wins,
  us.losses,
  us.win_rate_pct,
  us.last_completed_at
from public.profiles p
join public.user_stats us on us.user_id = p.user_id
join public.app_config cfg on cfg.id = 1
where p.leaderboard_opt_in = true
  and us.completed_hands >= cfg.leaderboard_min_hands;
