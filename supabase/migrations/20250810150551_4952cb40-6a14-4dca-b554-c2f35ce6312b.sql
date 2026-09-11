
-- Phase 1: Collaboration MVP for Delegation
-- 1) Extensions for search
create extension if not exists pg_trgm;

-- 2) Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'channel_visibility') then
    create type public.channel_visibility as enum ('private','public','direct');
  end if;
end$$;

-- 3) Channels
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  type text not null default 'topic',
  visibility public.channel_visibility not null default 'private',
  created_by uuid not null,
  domain text not null default 'personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.channels enable row level security;

-- Members can view channels only if they are members
create policy if not exists "Members can view channels"
on public.channels for select
using (
  exists (
    select 1 from public.channel_members m
    where m.channel_id = channels.id and m.user_id = auth.uid()
  )
);

-- Users can create channels (they become owner via app/trigger)
create policy if not exists "Users can create channels"
on public.channels for insert
with check (created_by = auth.uid());

-- Owners (creators) can update channels
create policy if not exists "Owners can update channels"
on public.channels for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

create index if not exists idx_channels_org on public.channels(organization_id);
create index if not exists idx_channels_created_at on public.channels(created_at desc);

create trigger set_updated_at_channels
before update on public.channels
for each row execute function public.update_updated_at_column();

-- 4) Channel Members
create table if not exists public.channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member', -- member|admin|owner
  joined_at timestamptz not null default now(),
  last_read_at timestamptz
);
alter table public.channel_members add constraint uq_channel_member unique (channel_id, user_id);
alter table public.channel_members enable row level security;

-- Members of a channel can see the membership list (for that channel)
create policy if not exists "Channel members can view memberships"
on public.channel_members for select
using (
  exists (
    select 1 from public.channel_members m2
    where m2.channel_id = channel_members.channel_id and m2.user_id = auth.uid()
  )
);

-- Admins/owners or channel creator can add members
create policy if not exists "Admins or creator can add members"
on public.channel_members for insert
with check (
  exists (
    select 1 from public.channel_members m2
    where m2.channel_id = channel_members.channel_id
      and m2.user_id = auth.uid()
      and m2.role in ('owner','admin')
  )
  or exists (
    select 1 from public.channels c
    where c.id = channel_members.channel_id
      and c.created_by = auth.uid()
  )
);

-- Member can update own row (e.g., last_read_at), admins/owners can manage
create policy if not exists "Members can update self or admins manage"
on public.channel_members for update
using (
  user_id = auth.uid() or exists (
    select 1 from public.channel_members m2
    where m2.channel_id = channel_members.channel_id
      and m2.user_id = auth.uid()
      and m2.role in ('owner','admin')
  )
)
with check (
  user_id = auth.uid() or exists (
    select 1 from public.channel_members m2
    where m2.channel_id = channel_members.channel_id
      and m2.user_id = auth.uid()
      and m2.role in ('owner','admin')
  )
);

-- Member can remove self; admins/owners can remove others
create policy if not exists "Members can delete self or admins manage"
on public.channel_members for delete
using (
  user_id = auth.uid() or exists (
    select 1 from public.channel_members m2
    where m2.channel_id = channel_members.channel_id
      and m2.user_id = auth.uid()
      and m2.role in ('owner','admin')
  )
);

create index if not exists idx_channel_members_channel on public.channel_members(channel_id);
create index if not exists idx_channel_members_user on public.channel_members(user_id);

-- 5) Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null,
  body text,
  rich jsonb not null default '{}'::jsonb,
  thread_root_id uuid references public.messages(id) on delete set null,
  reply_to_id uuid references public.messages(id) on delete set null,
  mentions jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  tsv tsvector generated always as (to_tsvector('simple', coalesce(body, ''))) stored
);
alter table public.messages enable row level security;

-- Channel members can view messages
create policy if not exists "Channel members can view messages"
on public.messages for select
using (
  exists (
    select 1 from public.channel_members m
    where m.channel_id = messages.channel_id and m.user_id = auth.uid()
  )
);

-- Channel members can send messages as themselves
create policy if not exists "Members can send messages"
on public.messages for insert
with check (
  sender_id = auth.uid() and
  exists (
    select 1 from public.channel_members m
    where m.channel_id = messages.channel_id and m.user_id = auth.uid()
  )
);

-- Sender can edit/delete own messages
create policy if not exists "Sender can update messages"
on public.messages for update
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

create policy if not exists "Sender can delete messages"
on public.messages for delete
using (sender_id = auth.uid());

create index if not exists idx_messages_channel_time on public.messages(channel_id, created_at desc);
create index if not exists idx_messages_tsv on public.messages using gin (tsv);
create index if not exists idx_messages_body_trgm on public.messages using gin (body gin_trgm_ops);

-- For better realtime updates on UPDATE
alter table public.messages replica identity full;

create trigger set_updated_at_messages
before update on public.messages
for each row execute function public.update_updated_at_column();

-- 6) Read receipts
create table if not exists public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null,
  read_at timestamptz not null default now(),
  unique (message_id, user_id)
);
alter table public.message_reads enable row level security;

create policy if not exists "Members can view read receipts"
on public.message_reads for select
using (
  exists (
    select 1
    from public.messages msg
    join public.channel_members m on m.channel_id = msg.channel_id
    where msg.id = message_reads.message_id
      and m.user_id = auth.uid()
  )
);

create policy if not exists "Members can insert own read receipts"
on public.message_reads for insert
with check (
  user_id = auth.uid() and
  exists (
    select 1
    from public.messages msg
    join public.channel_members m on m.channel_id = msg.channel_id
    where msg.id = message_reads.message_id
      and m.user_id = auth.uid()
  )
);

-- 7) Polls
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  question text not null,
  anonymous boolean not null default false,
  allow_multi boolean not null default false,
  closes_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
alter table public.polls enable row level security;

create policy if not exists "Channel members can view polls"
on public.polls for select
using (
  exists (
    select 1 from public.channel_members m
    where m.channel_id = polls.channel_id and m.user_id = auth.uid()
  )
);

create policy if not exists "Members can create polls"
on public.polls for insert
with check (
  created_by = auth.uid() and
  exists (
    select 1 from public.channel_members m
    where m.channel_id = polls.channel_id and m.user_id = auth.uid()
  )
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null,
  option_order int not null default 0
);
alter table public.poll_options enable row level security;

create policy if not exists "Members can view poll options"
on public.poll_options for select
using (
  exists (
    select 1 from public.polls p
    join public.channel_members m on m.channel_id = p.channel_id
    where p.id = poll_options.poll_id and m.user_id = auth.uid()
  )
);

create policy if not exists "Poll creators can add options"
on public.poll_options for insert
with check (
  exists (
    select 1 from public.polls p
    where p.id = poll_options.poll_id and p.created_by = auth.uid()
  )
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null,
  voted_at timestamptz not null default now(),
  unique (poll_id, option_id, user_id)
);
alter table public.poll_votes enable row level security;

create policy if not exists "Members can view votes"
on public.poll_votes for select
using (
  exists (
    select 1 from public.polls p
    join public.channel_members m on m.channel_id = p.channel_id
    where p.id = poll_votes.poll_id and m.user_id = auth.uid()
  )
);

create policy if not exists "Members can vote within deadline"
on public.poll_votes for insert
with check (
  user_id = auth.uid() and
  exists (
    select 1 from public.polls p
    join public.channel_members m on m.channel_id = p.channel_id
    where p.id = poll_votes.poll_id
      and m.user_id = auth.uid()
      and (p.closes_at is null or now() < p.closes_at)
  )
);

-- 8) Link Delegation Tasks to Channels (per-task chat)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='delegation_tasks' and column_name='channel_id'
  ) then
    alter table public.delegation_tasks
      add column channel_id uuid references public.channels(id) on delete set null;
  end if;
end$$;

-- Trigger function to create a private channel and add delegator/delegatee as members for each new task
create or replace function public.create_task_channel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel_id uuid;
begin
  -- Create channel
  insert into public.channels (organization_id, name, type, visibility, created_by, domain)
  values (NEW.organization_id, 'Task: ' || NEW.title, 'task', 'private', NEW.delegator_id, coalesce(NEW.domain, 'personal'))
  returning id into v_channel_id;

  -- Add delegator as owner
  insert into public.channel_members (channel_id, user_id, role)
  values (v_channel_id, NEW.delegator_id, 'owner');

  -- Add delegatee if present
  if NEW.delegatee_id is not null then
    insert into public.channel_members (channel_id, user_id, role)
    values (v_channel_id, NEW.delegatee_id, 'member');
  end if;

  -- Link channel to task
  update public.delegation_tasks
  set channel_id = v_channel_id, updated_at = now()
  where id = NEW.id;

  return NEW;
end;
$$;

drop trigger if exists trg_create_task_channel on public.delegation_tasks;
create trigger trg_create_task_channel
after insert on public.delegation_tasks
for each row execute procedure public.create_task_channel();

-- Helpful indexes
create index if not exists idx_delegation_tasks_channel on public.delegation_tasks(channel_id);
