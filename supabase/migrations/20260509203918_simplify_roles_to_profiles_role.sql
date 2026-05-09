-- Simplify roles architecture: use profiles.role as single source of truth

-- 1) Add role column to profiles if missing
alter table public.profiles
  add column if not exists role text;

-- 2) Backfill role from user_roles + roles when available
-- Priority:
--   a) existing profiles.role if valid
--   b) mapped role from user_roles
--   c) default 'student'
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'user_roles'
  ) and exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'roles'
  ) then
    update public.profiles p
    set role = coalesce(
      case when p.role in ('director','coordinator','teacher','student') then p.role else null end,
      r.name,
      'student'
    )
    from (
      select ur.user_id, min(ro.name)::text as name
      from public.user_roles ur
      join public.roles ro on ro.id = ur.role_id
      group by ur.user_id
    ) r
    where p.id = r.user_id
      and (
        p.role is null
        or p.role not in ('director','coordinator','teacher','student')
      );
  end if;
end $$;

-- Fill any remaining null/invalid roles
update public.profiles
set role = 'student'
where role is null
   or role not in ('director','coordinator','teacher','student');

-- 3) Enforce constraints
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('director','coordinator','teacher','student'));

alter table public.profiles
  alter column role set not null;

create index if not exists profiles_role_idx on public.profiles(role);

-- 4) Replace has_role() to use profiles.role
create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = role_name
      and p.active = true
  );
$$;

grant execute on function public.has_role(text) to authenticated;

-- 5) Drop bridge tables if they exist (no longer needed)
drop table if exists public.user_roles;
drop table if exists public.roles;
