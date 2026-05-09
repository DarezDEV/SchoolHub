-- Restore roles + user_roles as role source of truth

create table if not exists public.roles (
  id serial primary key,
  name text not null unique check (name in ('director','coordinator','teacher','student'))
);

insert into public.roles (name)
values ('director'), ('coordinator'), ('teacher'), ('student')
on conflict (name) do nothing;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id int not null references public.roles(id) on delete restrict,
  primary key (user_id, role_id)
);

-- Backfill user_roles from profiles.role where possible
insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
join public.roles r on r.name = p.role
left join public.user_roles ur on ur.user_id = p.id and ur.role_id = r.id
where ur.user_id is null;

-- Ensure single role per user (as per current business rule)
-- Keep the lowest role_id when duplicates exist
delete from public.user_roles ur
using public.user_roles ur2
where ur.user_id = ur2.user_id
  and ur.role_id > ur2.role_id;

create unique index if not exists ux_user_roles_single_role_per_user on public.user_roles(user_id);

-- has_role should evaluate using user_roles
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
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid()
      and r.name = role_name
      and p.active = true
  );
$$;

grant execute on function public.has_role(text) to authenticated;

-- Convenience views for app listing
create or replace view public.vw_students as
select p.id, p.name, p.email, p.course_id, p.created_at, p.active
from public.profiles p
join public.user_roles ur on ur.user_id = p.id
join public.roles r on r.id = ur.role_id
where r.name = 'student';

create or replace view public.vw_teachers as
select p.id, p.name, p.email, p.created_at, p.active
from public.profiles p
join public.user_roles ur on ur.user_id = p.id
join public.roles r on r.id = ur.role_id
where r.name = 'teacher';
