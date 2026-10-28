-- Single-user app: no user_id columns. Access is server-only via the service-role key.
-- RLS is enabled on every table with NO policies, so the anon/authenticated roles get nothing.

create extension if not exists "pgcrypto";

create type project_status as enum ('active', 'on_hold', 'completed');
create type task_status as enum ('todo', 'doing', 'done');
create type task_priority as enum ('low', 'medium', 'high');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  goal text,
  status project_status not null default 'active',
  start_date date,
  deadline date,
  color text not null default '#c8502d',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  deadline date,
  position integer not null default 0
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete set null,
  parent_task_id uuid references tasks(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  start_date date,
  deadline date,
  estimate_minutes integer check (estimate_minutes is null or estimate_minutes >= 0),
  completed_at timestamptz,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_task_id is null or parent_task_id <> id)
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  color text not null default '#78716c'
);

create table task_tags (
  task_id uuid not null references tasks(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

-- Indexes
create index tasks_status_idx on tasks (status);
create index tasks_deadline_idx on tasks (deadline);
create index tasks_project_id_idx on tasks (project_id);
create index tasks_milestone_id_idx on tasks (milestone_id);
create index tasks_parent_task_id_idx on tasks (parent_task_id);
create index milestones_project_id_idx on milestones (project_id);
create index task_tags_tag_id_idx on task_tags (tag_id);

-- completed_at: set when a task becomes done, cleared when it moves back.
-- updated_at: bumped on every update.
create function tasks_before_write() returns trigger
language plpgsql as $$
begin
  if new.status = 'done' then
    if tg_op = 'INSERT' then
      new.completed_at := coalesce(new.completed_at, now());
    elsif old.status is distinct from 'done' then
      new.completed_at := now();
    else
      new.completed_at := old.completed_at;
    end if;
  else
    new.completed_at := null;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger tasks_before_write
before insert or update on tasks
for each row execute function tasks_before_write();

-- Row Level Security: enabled, no policies => deny all for anon/authenticated.
alter table projects enable row level security;
alter table milestones enable row level security;
alter table tasks enable row level security;
alter table tags enable row level security;
alter table task_tags enable row level security;

-- Belt and braces: also remove table privileges from the public API roles.
revoke all on projects, milestones, tasks, tags, task_tags from anon, authenticated;
