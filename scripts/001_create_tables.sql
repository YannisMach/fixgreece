-- Social Mind Mapping App Database Schema

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text not null,
  nickname text not null,
  bio text,
  role text not null default 'user' check (role in ('admin', 'moderator', 'user')),
  
  -- Privacy settings (true = public, false = private)
  first_name_public boolean not null default true,
  last_name_public boolean not null default false,
  nickname_public boolean not null default true,
  bio_public boolean not null default true,
  
  -- Display name format: 'first', 'last', 'nickname', 'first_last', 'first_nickname', 'nickname_first_initial'
  display_name_format text not null default 'nickname',
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Everyone can view public profile info
create policy "profiles_select_public" on public.profiles 
  for select using (true);

-- Users can insert their own profile
create policy "profiles_insert_own" on public.profiles 
  for insert with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles 
  for update using (auth.uid() = id);

-- =============================================
-- DISPLAY NAME CHANGE LOG (Admin transparency)
-- =============================================
create table if not exists public.display_name_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  old_format text not null,
  new_format text not null,
  old_first_name text,
  old_last_name text,
  old_nickname text,
  new_first_name text,
  new_last_name text,
  new_nickname text,
  changed_at timestamp with time zone default now()
);

alter table public.display_name_logs enable row level security;

-- Only admins can view logs (we'll check role in application layer)
create policy "display_name_logs_select_admin" on public.display_name_logs 
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- System can insert logs (via trigger)
create policy "display_name_logs_insert" on public.display_name_logs 
  for insert with check (auth.uid() = user_id);

-- =============================================
-- MIND MAPS (Subjects/Problems/Ideas)
-- =============================================
create table if not exists public.mind_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.mind_maps enable row level security;

-- Everyone can view public mind maps
create policy "mind_maps_select_public" on public.mind_maps 
  for select using (is_public = true or auth.uid() = user_id);

-- Users can insert their own mind maps
create policy "mind_maps_insert_own" on public.mind_maps 
  for insert with check (auth.uid() = user_id);

-- Users can update their own mind maps
create policy "mind_maps_update_own" on public.mind_maps 
  for update using (auth.uid() = user_id);

-- Users can delete their own mind maps
create policy "mind_maps_delete_own" on public.mind_maps 
  for delete using (auth.uid() = user_id);

-- =============================================
-- NODES (Branches in the mind map)
-- =============================================
create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  mind_map_id uuid not null references public.mind_maps(id) on delete cascade,
  parent_id uuid references public.nodes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  position_x float not null default 0,
  position_y float not null default 0,
  color text default '#3b82f6',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.nodes enable row level security;

-- Everyone can view nodes of public mind maps
create policy "nodes_select" on public.nodes 
  for select using (
    exists (
      select 1 from public.mind_maps 
      where id = nodes.mind_map_id 
      and (is_public = true or user_id = auth.uid())
    )
  );

-- Authenticated users can insert nodes to public mind maps
create policy "nodes_insert" on public.nodes 
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.mind_maps 
      where id = mind_map_id 
      and (is_public = true or user_id = auth.uid())
    )
  );

-- Users can update their own nodes
create policy "nodes_update_own" on public.nodes 
  for update using (auth.uid() = user_id);

-- Users can delete their own nodes, admins/mods can delete any
create policy "nodes_delete" on public.nodes 
  for delete using (
    auth.uid() = user_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- =============================================
-- VOTES (Upvotes/Downvotes on nodes)
-- =============================================
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote_type integer not null check (vote_type in (-1, 1)), -- -1 = downvote, 1 = upvote
  created_at timestamp with time zone default now(),
  unique(node_id, user_id)
);

alter table public.votes enable row level security;

-- Everyone can see votes
create policy "votes_select" on public.votes 
  for select using (true);

-- Authenticated users can vote
create policy "votes_insert" on public.votes 
  for insert with check (auth.uid() = user_id);

-- Users can update their own votes
create policy "votes_update_own" on public.votes 
  for update using (auth.uid() = user_id);

-- Users can delete their own votes
create policy "votes_delete_own" on public.votes 
  for delete using (auth.uid() = user_id);

-- =============================================
-- COMMENTS (on nodes)
-- =============================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.comments enable row level security;

-- Everyone can see comments
create policy "comments_select" on public.comments 
  for select using (true);

-- Authenticated users can comment
create policy "comments_insert" on public.comments 
  for insert with check (auth.uid() = user_id);

-- Users can update their own comments
create policy "comments_update_own" on public.comments 
  for update using (auth.uid() = user_id);

-- Users can delete their own comments, admins/mods can delete any
create policy "comments_delete" on public.comments 
  for delete using (
    auth.uid() = user_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- =============================================
-- REPORTS (on nodes)
-- =============================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.reports enable row level security;

-- Admins and mods can see all reports
create policy "reports_select_admin" on public.reports 
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Users can see their own reports
create policy "reports_select_own" on public.reports 
  for select using (auth.uid() = user_id);

-- Authenticated users can create reports
create policy "reports_insert" on public.reports 
  for insert with check (auth.uid() = user_id);

-- Admins and mods can update reports
create policy "reports_update_admin" on public.reports 
  for update using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, 
    email,
    first_name, 
    last_name, 
    nickname,
    bio,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'nickname', ''),
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================
-- TRIGGER: Log display name changes
-- =============================================
create or replace function public.log_display_name_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.display_name_format is distinct from new.display_name_format or
    old.first_name is distinct from new.first_name or
    old.last_name is distinct from new.last_name or
    old.nickname is distinct from new.nickname
  ) then
    insert into public.display_name_logs (
      user_id,
      old_format,
      new_format,
      old_first_name,
      old_last_name,
      old_nickname,
      new_first_name,
      new_last_name,
      new_nickname
    )
    values (
      new.id,
      old.display_name_format,
      new.display_name_format,
      old.first_name,
      old.last_name,
      old.nickname,
      new.first_name,
      new.last_name,
      new.nickname
    );
  end if;
  
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_update on public.profiles;

create trigger on_profile_update
  before update on public.profiles
  for each row
  execute function public.log_display_name_change();

-- =============================================
-- FUNCTION: Get computed display name
-- =============================================
create or replace function public.get_display_name(profile_row public.profiles)
returns text
language plpgsql
as $$
begin
  case profile_row.display_name_format
    when 'first' then
      return profile_row.first_name;
    when 'last' then
      return profile_row.last_name;
    when 'nickname' then
      return profile_row.nickname;
    when 'first_last' then
      return profile_row.first_name || ' ' || profile_row.last_name;
    when 'first_nickname' then
      return profile_row.first_name || ' (' || profile_row.nickname || ')';
    when 'nickname_first_initial' then
      return profile_row.nickname || ' ' || left(profile_row.first_name, 1) || '.';
    when 'first_initial_last' then
      return left(profile_row.first_name, 1) || '. ' || profile_row.last_name;
    else
      return profile_row.nickname;
  end case;
end;
$$;

-- =============================================
-- INDEXES for performance
-- =============================================
create index if not exists idx_nodes_mind_map_id on public.nodes(mind_map_id);
create index if not exists idx_nodes_parent_id on public.nodes(parent_id);
create index if not exists idx_votes_node_id on public.votes(node_id);
create index if not exists idx_comments_node_id on public.comments(node_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_mind_maps_user_id on public.mind_maps(user_id);
create index if not exists idx_display_name_logs_user_id on public.display_name_logs(user_id);
