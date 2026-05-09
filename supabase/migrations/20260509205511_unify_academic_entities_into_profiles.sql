-- Unify academic entities into profiles

alter table public.profiles
  add column if not exists course_id uuid references public.courses(id) on delete set null;

-- Migrate existing students to profiles when matching auth user by email
insert into public.profiles (id, name, last_name, email, role, active)
select au.id, e.nombre, '', e.email, 'student', true
from public.estudiantes e
join auth.users au on lower(au.email) = lower(e.email)
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;

update public.profiles p
set course_id = e.curso_id,
    role = 'student'
from public.estudiantes e
where lower(p.email) = lower(e.email);

-- Migrate existing teachers to profiles when matching auth user by email
insert into public.profiles (id, name, last_name, email, role, active)
select au.id, pr.nombre, '', pr.email, 'teacher', true
from public.profesores pr
join auth.users au on lower(au.email) = lower(pr.email)
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;

update public.profiles p
set role = 'teacher'
from public.profesores pr
where lower(p.email) = lower(pr.email);

-- Re-point profesor_materia_curso.profesor_id to profiles ids using email
alter table public.profesor_materia_curso
  drop constraint if exists profesor_materia_curso_profesor_id_fkey;

update public.profesor_materia_curso pmc
set profesor_id = p.id
from public.profesores pr
join public.profiles p on lower(p.email) = lower(pr.email)
where pmc.profesor_id = pr.id;

-- Remove orphan assignments that cannot be mapped to a profile/auth user
delete from public.profesor_materia_curso pmc
where not exists (
  select 1
  from public.profiles p
  where p.id = pmc.profesor_id
);

alter table public.profesor_materia_curso
  add constraint profesor_materia_curso_profesor_id_fkey
  foreign key (profesor_id) references public.profiles(id) on delete cascade;

create index if not exists profiles_course_id_idx on public.profiles(course_id);

-- Optional cleanup of legacy tables
drop table if exists public.estudiantes;
drop table if exists public.profesores;
