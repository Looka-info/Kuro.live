-- Kuru.live social, watch progress, comments, XP, levels, and watched details.
-- Run in Supabase SQL editor or via: supabase db push

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'premium')),
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level between 1 and 99),
  watch_minutes integer not null default 0 check (watch_minutes >= 0),
  episodes_completed integer not null default 0 check (episodes_completed >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  current_streak_days integer not null default 0 check (current_streak_days >= 0),
  longest_streak_days integer not null default 0 check (longest_streak_days >= 0),
  last_watch_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anime_titles (
  anime_id integer primary key,
  title text not null,
  poster_url text,
  banner_url text,
  total_episodes integer,
  source text not null default 'anilist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anime_id integer not null,
  status text not null default 'plan_to_watch' check (status in ('watching','completed','plan_to_watch','dropped','on_hold')),
  progress integer not null default 0 check (progress >= 0),
  score integer check (score between 1 and 10),
  is_favorite boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anime_id)
);

create table if not exists public.episode_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anime_id integer not null,
  episode_num integer not null check (episode_num > 0),
  episode_title text,
  duration_s integer check (duration_s is null or duration_s >= 0),
  position_s integer not null default 0 check (position_s >= 0),
  percent_complete numeric(5,2) not null default 0 check (percent_complete between 0 and 100),
  completed boolean not null default false,
  completed_at timestamptz,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anime_id, episode_num)
);

create table if not exists public.watch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anime_id integer not null,
  episode_num integer not null check (episode_num > 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  start_position_s integer not null default 0 check (start_position_s >= 0),
  end_position_s integer not null default 0 check (end_position_s >= 0),
  device text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.watched_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anime_id integer not null,
  episode_num integer not null check (episode_num > 0),
  watched_at timestamptz not null default now(),
  source_progress_id uuid references public.episode_progress(id) on delete set null,
  unique (user_id, anime_id, episode_num)
);

create table if not exists public.episode_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anime_id integer not null,
  episode_num integer check (episode_num is null or episode_num > 0),
  parent_id uuid references public.episode_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  spoiler boolean not null default false,
  hidden boolean not null default false,
  upvotes integer not null default 0 check (upvotes >= 0),
  downvotes integer not null default 0 check (downvotes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_id uuid not null references public.episode_comments(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (user_id, comment_id)
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in (
    'episode_started',
    'episode_completed',
    'watch_minutes',
    'comment_created',
    'review_created',
    'daily_streak',
    'manual_adjustment'
  )),
  xp_delta integer not null,
  anime_id integer,
  episode_num integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_watchlists_user_status on public.watchlists(user_id, status);
create index if not exists idx_episode_progress_user_anime on public.episode_progress(user_id, anime_id);
create index if not exists idx_watch_sessions_user_started on public.watch_sessions(user_id, started_at desc);
create index if not exists idx_watched_episodes_user on public.watched_episodes(user_id, watched_at desc);
create index if not exists idx_episode_comments_thread on public.episode_comments(anime_id, episode_num, created_at desc);
create index if not exists idx_episode_comments_parent on public.episode_comments(parent_id);
create index if not exists idx_xp_events_user_created on public.xp_events(user_id, created_at desc);

create or replace function public.kuru_level_for_xp(total_xp integer)
returns integer
language sql
immutable
as $$
  select least(99, greatest(1, floor(sqrt(greatest(total_xp, 0)::numeric / 100))::integer + 1));
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.award_xp(
  target_user_id uuid,
  event_name text,
  amount integer,
  event_anime_id integer default null,
  event_episode_num integer default null,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if amount = 0 then
    return;
  end if;

  insert into public.xp_events (user_id, event_type, xp_delta, anime_id, episode_num, metadata)
  values (target_user_id, event_name, amount, event_anime_id, event_episode_num, event_metadata);

  update public.profiles
  set
    xp = greatest(0, xp + amount),
    level = public.kuru_level_for_xp(greatest(0, xp + amount)),
    updated_at = now()
  where id = target_user_id;
end;
$$;

create or replace function public.after_episode_progress_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  newly_completed boolean;
  minutes_delta integer;
  previous_position integer;
  previous_completed boolean;
begin
  previous_position := case when tg_op = 'INSERT' then 0 else old.position_s end;
  previous_completed := case when tg_op = 'INSERT' then false else old.completed end;
  newly_completed := new.completed and previous_completed is distinct from true;
  minutes_delta := greatest(0, floor((new.position_s - previous_position) / 60));

  if new.duration_s is not null and new.duration_s > 0 then
    new.percent_complete := least(100, round((new.position_s::numeric / new.duration_s::numeric) * 100, 2));
  end if;

  update public.profiles
  set
    watch_minutes = watch_minutes + minutes_delta,
    episodes_completed = episodes_completed + case when newly_completed then 1 else 0 end,
    last_watch_at = now(),
    updated_at = now()
  where id = new.user_id;

  if minutes_delta > 0 then
    perform public.award_xp(new.user_id, 'watch_minutes', minutes_delta, new.anime_id, new.episode_num);
  end if;

  if newly_completed then
    insert into public.watched_episodes (user_id, anime_id, episode_num, source_progress_id)
    values (new.user_id, new.anime_id, new.episode_num, new.id)
    on conflict (user_id, anime_id, episode_num)
    do update set watched_at = excluded.watched_at, source_progress_id = excluded.source_progress_id;

    update public.watchlists
    set progress = greatest(progress, new.episode_num), status = case when status = 'plan_to_watch' then 'watching' else status end, updated_at = now()
    where user_id = new.user_id and anime_id = new.anime_id;

    perform public.award_xp(new.user_id, 'episode_completed', 50, new.anime_id, new.episode_num);
  end if;

  return new;
end;
$$;

create or replace function public.after_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set comments_count = comments_count + 1, updated_at = now()
  where id = new.user_id;

  perform public.award_xp(new.user_id, 'comment_created', 10, new.anime_id, new.episode_num, jsonb_build_object('comment_id', new.id));
  return new;
end;
$$;

create or replace function public.after_comment_reaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.episode_comments c
  set
    upvotes = (
      select count(*)::integer from public.comment_reactions r
      where r.comment_id = c.id and r.value = 1
    ),
    downvotes = (
      select count(*)::integer from public.comment_reactions r
      where r.comment_id = c.id and r.value = -1
    ),
    updated_at = now()
  where c.id = coalesce(new.comment_id, old.comment_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_watchlists_updated_at on public.watchlists;
create trigger touch_watchlists_updated_at
before update on public.watchlists
for each row execute function public.touch_updated_at();

drop trigger if exists touch_episode_comments_updated_at on public.episode_comments;
create trigger touch_episode_comments_updated_at
before update on public.episode_comments
for each row execute function public.touch_updated_at();

drop trigger if exists award_episode_progress_xp on public.episode_progress;
create trigger award_episode_progress_xp
before insert or update on public.episode_progress
for each row execute function public.after_episode_progress_upsert();

drop trigger if exists award_comment_xp on public.episode_comments;
create trigger award_comment_xp
after insert on public.episode_comments
for each row execute function public.after_comment_insert();

drop trigger if exists refresh_comment_votes_insert on public.comment_reactions;
create trigger refresh_comment_votes_insert
after insert or update or delete on public.comment_reactions
for each row execute function public.after_comment_reaction_change();

alter table public.profiles enable row level security;
alter table public.anime_titles enable row level security;
alter table public.watchlists enable row level security;
alter table public.episode_progress enable row level security;
alter table public.watch_sessions enable row level security;
alter table public.watched_episodes enable row level security;
alter table public.episode_comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.xp_events enable row level security;

drop policy if exists "profiles are public readable" on public.profiles;
create policy "profiles are public readable" on public.profiles
for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "anime titles are public readable" on public.anime_titles;
create policy "anime titles are public readable" on public.anime_titles
for select using (true);

drop policy if exists "users manage own watchlists" on public.watchlists;
create policy "users manage own watchlists" on public.watchlists
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own episode progress" on public.episode_progress;
create policy "users manage own episode progress" on public.episode_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own watch sessions" on public.watch_sessions;
create policy "users manage own watch sessions" on public.watch_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users read own watched episodes" on public.watched_episodes;
create policy "users read own watched episodes" on public.watched_episodes
for select using (auth.uid() = user_id);

drop policy if exists "comments are public readable" on public.episode_comments;
create policy "comments are public readable" on public.episode_comments
for select using (hidden = false);

drop policy if exists "users create own comments" on public.episode_comments;
create policy "users create own comments" on public.episode_comments
for insert with check (auth.uid() = user_id);

drop policy if exists "users update own comments" on public.episode_comments;
create policy "users update own comments" on public.episode_comments
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own comments" on public.episode_comments;
create policy "users delete own comments" on public.episode_comments
for delete using (auth.uid() = user_id);

drop policy if exists "users manage own comment reactions" on public.comment_reactions;
create policy "users manage own comment reactions" on public.comment_reactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users read own xp events" on public.xp_events;
create policy "users read own xp events" on public.xp_events
for select using (auth.uid() = user_id);

drop policy if exists "admins can read xp events" on public.xp_events;
create policy "admins can read xp events" on public.xp_events
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('moderator', 'admin')
  )
);
