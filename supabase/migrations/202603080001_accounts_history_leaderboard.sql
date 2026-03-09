create extension if not exists pgcrypto;

create type public.game_session_status as enum (
  'in_progress',
  'completed',
  'abandoned'
);

create type public.game_outcome as enum (
  'win',
  'loss'
);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  leaderboard_name text,
  leaderboard_opt_in boolean not null default false,
  leaderboard_opted_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_leaderboard_name_required
    check (
      leaderboard_opt_in = false
      or nullif(trim(leaderboard_name), '') is not null
    )
);

create unique index profiles_leaderboard_name_unique
  on public.profiles (lower(leaderboard_name))
  where leaderboard_name is not null;

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.game_session_status not null default 'in_progress',
  client_version text,
  deck_order text[] not null,
  turns_played integer not null default 0,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  abandoned_at timestamptz,
  player_cards text[],
  dealer_cards text[],
  remaining_cards text[],
  player_hand_category text,
  player_hand_name text,
  dealer_hand_category text,
  dealer_hand_name text,
  outcome public.game_outcome,
  dealer_won_tie boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  constraint completed_sessions_have_summary
    check (
      status <> 'completed'
      or (
        completed_at is not null
        and outcome is not null
        and player_hand_category is not null
        and player_hand_name is not null
        and dealer_hand_category is not null
        and dealer_hand_name is not null
        and player_cards is not null
        and dealer_cards is not null
      )
    )
);

create index game_sessions_user_completed_at_idx
  on public.game_sessions (user_id, completed_at desc);

create index game_sessions_status_completed_at_idx
  on public.game_sessions (status, completed_at desc);

create index game_sessions_user_status_idx
  on public.game_sessions (user_id, status);

create table public.game_turns (
  id bigint generated always as identity primary key,
  game_session_id uuid not null references public.game_sessions (id) on delete cascade,
  turn_index integer not null,
  selection_ids text[] not null,
  dealer_card_ids text[] not null default '{}'::text[],
  player_card_id text,
  top_up_card_ids text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_session_id, turn_index)
);

create index game_turns_session_turn_idx
  on public.game_turns (game_session_id, turn_index);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_turns enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "game_sessions_select_own"
  on public.game_sessions
  for select
  using (auth.uid() = user_id);

create policy "game_sessions_insert_own"
  on public.game_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "game_sessions_update_own"
  on public.game_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "game_turns_select_own"
  on public.game_turns
  for select
  using (
    exists (
      select 1
      from public.game_sessions gs
      where gs.id = game_session_id
        and gs.user_id = auth.uid()
    )
  );

create policy "game_turns_insert_own"
  on public.game_turns
  for insert
  with check (
    exists (
      select 1
      from public.game_sessions gs
      where gs.id = game_session_id
        and gs.user_id = auth.uid()
    )
  );

create or replace view public.user_stats as
select
  gs.user_id,
  count(*) filter (where gs.status = 'completed')::integer as completed_hands,
  count(*) filter (where gs.status = 'completed' and gs.outcome = 'win')::integer as wins,
  count(*) filter (where gs.status = 'completed' and gs.outcome = 'loss')::integer as losses,
  case
    when count(*) filter (where gs.status = 'completed') = 0 then 0::numeric
    else round(
      (
        count(*) filter (where gs.status = 'completed' and gs.outcome = 'win')::numeric
        / count(*) filter (where gs.status = 'completed')::numeric
      ) * 100,
      2
    )
  end as win_rate_pct,
  max(gs.completed_at) as last_completed_at
from public.game_sessions gs
group by gs.user_id;

create or replace view public.user_hand_stats as
select
  gs.user_id,
  gs.player_hand_category,
  count(*)::integer as hand_count
from public.game_sessions gs
where gs.status = 'completed'
group by gs.user_id, gs.player_hand_category;

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
where p.leaderboard_opt_in = true
  and us.completed_hands >= 100;
