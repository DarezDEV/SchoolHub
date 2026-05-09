create extension if not exists pgcrypto;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

grant execute on function public.has_role(text) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  academic_year text,
  section text,
  description text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists courses_code_idx on public.courses (code);
create index if not exists subjects_code_idx on public.subjects (code);
create index if not exists courses_active_idx on public.courses (active);
create index if not exists subjects_active_idx on public.subjects (active);

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

drop trigger if exists set_subjects_updated_at on public.subjects;
create trigger set_subjects_updated_at
before update on public.subjects
for each row
execute function public.set_updated_at();

alter table public.courses enable row level security;
alter table public.subjects enable row level security;

drop policy if exists "coordinators can read courses" on public.courses;
create policy "coordinators can read courses"
on public.courses
for select
to authenticated
using (public.has_role('coordinator'));

drop policy if exists "coordinators can insert courses" on public.courses;
create policy "coordinators can insert courses"
on public.courses
for insert
to authenticated
with check (public.has_role('coordinator'));

drop policy if exists "coordinators can update courses" on public.courses;
create policy "coordinators can update courses"
on public.courses
for update
to authenticated
using (public.has_role('coordinator'))
with check (public.has_role('coordinator'));

drop policy if exists "coordinators can delete courses" on public.courses;
create policy "coordinators can delete courses"
on public.courses
for delete
to authenticated
using (public.has_role('coordinator'));

drop policy if exists "coordinators can read subjects" on public.subjects;
create policy "coordinators can read subjects"
on public.subjects
for select
to authenticated
using (public.has_role('coordinator'));

drop policy if exists "coordinators can insert subjects" on public.subjects;
create policy "coordinators can insert subjects"
on public.subjects
for insert
to authenticated
with check (public.has_role('coordinator'));

drop policy if exists "coordinators can update subjects" on public.subjects;
create policy "coordinators can update subjects"
on public.subjects
for update
to authenticated
using (public.has_role('coordinator'))
with check (public.has_role('coordinator'));

drop policy if exists "coordinators can delete subjects" on public.subjects;
create policy "coordinators can delete subjects"
on public.subjects
for delete
to authenticated
using (public.has_role('coordinator'));
