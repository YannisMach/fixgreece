-- =============================================
-- ADDITIONAL FEATURES MIGRATION
-- =============================================

-- =============================================
-- CATEGORIES TABLE
-- =============================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  color text default '#6366f1',
  icon text,
  created_at timestamp with time zone default now()
);

alter table public.categories enable row level security;

create policy "categories_select" on public.categories for select using (true);
create policy "categories_insert_admin" on public.categories for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "categories_update_admin" on public.categories for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "categories_delete_admin" on public.categories for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Add category to mind_maps
alter table public.mind_maps add column if not exists category_id uuid references public.categories(id) on delete set null;

-- =============================================
-- TAGS TABLE
-- =============================================
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamp with time zone default now()
);

alter table public.tags enable row level security;

create policy "tags_select" on public.tags for select using (true);
create policy "tags_insert_auth" on public.tags for insert with check (auth.uid() is not null);

-- =============================================
-- MIND MAP TAGS (Junction table)
-- =============================================
create table if not exists public.mind_map_tags (
  id uuid primary key default gen_random_uuid(),
  mind_map_id uuid not null references public.mind_maps(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(mind_map_id, tag_id)
);

alter table public.mind_map_tags enable row level security;

create policy "mind_map_tags_select" on public.mind_map_tags for select using (true);
create policy "mind_map_tags_insert" on public.mind_map_tags for insert with check (
  exists (select 1 from public.mind_maps where id = mind_map_id and user_id = auth.uid())
);
create policy "mind_map_tags_delete" on public.mind_map_tags for delete using (
  exists (select 1 from public.mind_maps where id = mind_map_id and user_id = auth.uid())
);

-- =============================================
-- NODE TAGS (Junction table)
-- =============================================
create table if not exists public.node_tags (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(node_id, tag_id)
);

alter table public.node_tags enable row level security;

create policy "node_tags_select" on public.node_tags for select using (true);
create policy "node_tags_insert" on public.node_tags for insert with check (
  exists (select 1 from public.nodes where id = node_id and user_id = auth.uid())
);
create policy "node_tags_delete" on public.node_tags for delete using (
  exists (select 1 from public.nodes where id = node_id and user_id = auth.uid())
);

-- =============================================
-- SAVES/BOOKMARKS with FOLDERS
-- =============================================
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  color text default '#6366f1',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.folders enable row level security;

create policy "folders_select_own" on public.folders for select using (auth.uid() = user_id);
create policy "folders_insert_own" on public.folders for insert with check (auth.uid() = user_id);
create policy "folders_update_own" on public.folders for update using (auth.uid() = user_id);
create policy "folders_delete_own" on public.folders for delete using (auth.uid() = user_id);

create table if not exists public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  node_id uuid references public.nodes(id) on delete cascade,
  mind_map_id uuid references public.mind_maps(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  created_at timestamp with time zone default now(),
  constraint saves_has_target check (node_id is not null or mind_map_id is not null),
  unique(user_id, node_id),
  unique(user_id, mind_map_id)
);

alter table public.saves enable row level security;

create policy "saves_select_own" on public.saves for select using (auth.uid() = user_id);
create policy "saves_insert_own" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves_update_own" on public.saves for update using (auth.uid() = user_id);
create policy "saves_delete_own" on public.saves for delete using (auth.uid() = user_id);

-- =============================================
-- INVITES (for branches/nodes)
-- =============================================
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  node_id uuid references public.nodes(id) on delete cascade,
  mind_map_id uuid references public.mind_maps(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text not null,
  invitee_id uuid references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamp with time zone default now(),
  responded_at timestamp with time zone,
  constraint invites_has_target check (node_id is not null or mind_map_id is not null)
);

alter table public.invites enable row level security;

create policy "invites_select_own" on public.invites for select using (
  auth.uid() = inviter_id or auth.uid() = invitee_id
);
create policy "invites_insert_own" on public.invites for insert with check (auth.uid() = inviter_id);
create policy "invites_update_invitee" on public.invites for update using (auth.uid() = invitee_id);

-- =============================================
-- VIEW TRACKING
-- =============================================
create table if not exists public.views (
  id uuid primary key default gen_random_uuid(),
  mind_map_id uuid references public.mind_maps(id) on delete cascade,
  node_id uuid references public.nodes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  ip_hash text,
  viewed_at timestamp with time zone default now(),
  constraint views_has_target check (mind_map_id is not null or node_id is not null)
);

alter table public.views enable row level security;

create policy "views_select_admin" on public.views for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator'))
);
create policy "views_insert" on public.views for insert with check (true);

-- Add view_count to mind_maps for quick access
alter table public.mind_maps add column if not exists view_count integer default 0;

-- =============================================
-- CHANGE LOGS (all user changes for transparency)
-- =============================================
create table if not exists public.change_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null, -- 'profile', 'mind_map', 'node', 'comment'
  entity_id uuid not null,
  action text not null, -- 'create', 'update', 'delete'
  changes jsonb not null, -- stores old and new values
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

alter table public.change_logs enable row level security;

create policy "change_logs_select_admin" on public.change_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "change_logs_insert" on public.change_logs for insert with check (auth.uid() = user_id);

-- =============================================
-- GDPR DATA EXPORT REQUESTS
-- =============================================
create table if not exists public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  download_url text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

alter table public.data_export_requests enable row level security;

create policy "data_export_requests_select_own" on public.data_export_requests for select using (auth.uid() = user_id);
create policy "data_export_requests_insert_own" on public.data_export_requests for insert with check (auth.uid() = user_id);

-- =============================================
-- ACCOUNT DELETION REQUESTS (GDPR)
-- =============================================
create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  confirmation_token text,
  scheduled_deletion_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

alter table public.deletion_requests enable row level security;

create policy "deletion_requests_select_own" on public.deletion_requests for select using (auth.uid() = user_id);
create policy "deletion_requests_insert_own" on public.deletion_requests for insert with check (auth.uid() = user_id);
create policy "deletion_requests_update_own" on public.deletion_requests for update using (auth.uid() = user_id);

-- =============================================
-- INSERT DEFAULT CATEGORIES
-- =============================================
insert into public.categories (name, slug, description, color, icon) values
  ('Economy', 'economy', 'Economic issues and solutions', '#10b981', 'TrendingUp'),
  ('Education', 'education', 'Education system improvements', '#3b82f6', 'GraduationCap'),
  ('Healthcare', 'healthcare', 'Healthcare system ideas', '#ef4444', 'Heart'),
  ('Environment', 'environment', 'Environmental challenges', '#22c55e', 'Leaf'),
  ('Infrastructure', 'infrastructure', 'Infrastructure development', '#f59e0b', 'Building'),
  ('Technology', 'technology', 'Technology and innovation', '#8b5cf6', 'Cpu'),
  ('Tourism', 'tourism', 'Tourism industry ideas', '#06b6d4', 'Plane'),
  ('Agriculture', 'agriculture', 'Agricultural development', '#84cc16', 'Sprout'),
  ('Culture', 'culture', 'Cultural preservation and promotion', '#ec4899', 'Music'),
  ('Governance', 'governance', 'Government and administration', '#6366f1', 'Scale')
on conflict (slug) do nothing;

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_mind_maps_category on public.mind_maps(category_id);
create index if not exists idx_mind_map_tags_mind_map on public.mind_map_tags(mind_map_id);
create index if not exists idx_mind_map_tags_tag on public.mind_map_tags(tag_id);
create index if not exists idx_node_tags_node on public.node_tags(node_id);
create index if not exists idx_node_tags_tag on public.node_tags(tag_id);
create index if not exists idx_saves_user on public.saves(user_id);
create index if not exists idx_saves_folder on public.saves(folder_id);
create index if not exists idx_invites_inviter on public.invites(inviter_id);
create index if not exists idx_invites_invitee on public.invites(invitee_id);
create index if not exists idx_views_mind_map on public.views(mind_map_id);
create index if not exists idx_views_node on public.views(node_id);
create index if not exists idx_change_logs_user on public.change_logs(user_id);
create index if not exists idx_change_logs_entity on public.change_logs(entity_type, entity_id);
