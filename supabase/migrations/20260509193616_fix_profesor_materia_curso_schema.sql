-- Normalize professor assignment table to subject_id/course_id schema
-- and keep backward-compatible columns for legacy app code.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profesor_materia_curso' and column_name = 'materia_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profesor_materia_curso' and column_name = 'subject_id'
  ) then
    execute 'update public.profesor_materia_curso set subject_id = coalesce(subject_id, materia_id) where subject_id is null and materia_id is not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profesor_materia_curso' and column_name = 'curso_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profesor_materia_curso' and column_name = 'course_id'
  ) then
    execute 'update public.profesor_materia_curso set course_id = coalesce(course_id, curso_id) where course_id is null and curso_id is not null';
  end if;
end $$;

-- Ensure required columns exist
alter table public.profesor_materia_curso add column if not exists subject_id uuid;
alter table public.profesor_materia_curso add column if not exists course_id uuid;
alter table public.profesor_materia_curso add column if not exists profesor_id uuid;

-- Backward-compatible aliases for existing frontend code
alter table public.profesor_materia_curso add column if not exists materia_id uuid;
alter table public.profesor_materia_curso add column if not exists curso_id uuid;

-- Sync aliases from canonical columns
update public.profesor_materia_curso
set materia_id = coalesce(materia_id, subject_id),
    curso_id = coalesce(curso_id, course_id)
where materia_id is null or curso_id is null;

-- Remove invalid rows that would violate FK constraints
-- (rows with dangling subject_id/course_id)
delete from public.profesor_materia_curso pmc
where (pmc.subject_id is not null and not exists (select 1 from public.subjects s where s.id = pmc.subject_id))
   or (pmc.course_id is not null and not exists (select 1 from public.courses c where c.id = pmc.course_id));

-- Recreate constraints safely
alter table public.profesor_materia_curso drop constraint if exists profesor_materia_curso_subject_id_fkey;
alter table public.profesor_materia_curso drop constraint if exists profesor_materia_curso_course_id_fkey;
alter table public.profesor_materia_curso drop constraint if exists profesor_materia_curso_profesor_id_fkey;

alter table public.profesor_materia_curso
  add constraint profesor_materia_curso_subject_id_fkey
  foreign key (subject_id) references public.subjects(id) on delete restrict;

alter table public.profesor_materia_curso
  add constraint profesor_materia_curso_course_id_fkey
  foreign key (course_id) references public.courses(id) on delete restrict;

alter table public.profesor_materia_curso
  add constraint profesor_materia_curso_profesor_id_fkey
  foreign key (profesor_id) references public.profesores(id) on delete cascade;

-- Keep columns consistent for both naming conventions
create or replace function public.sync_profesor_materia_curso_aliases()
returns trigger
language plpgsql
as $$
begin
  if new.subject_id is null then new.subject_id := new.materia_id; end if;
  if new.course_id is null then new.course_id := new.curso_id; end if;
  if new.materia_id is null then new.materia_id := new.subject_id; end if;
  if new.curso_id is null then new.curso_id := new.course_id; end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_profesor_materia_curso_aliases on public.profesor_materia_curso;
create trigger trg_sync_profesor_materia_curso_aliases
before insert or update on public.profesor_materia_curso
for each row execute function public.sync_profesor_materia_curso_aliases();

-- Ensure NOT NULL on canonical columns once synced
alter table public.profesor_materia_curso alter column subject_id set not null;
alter table public.profesor_materia_curso alter column course_id set not null;
alter table public.profesor_materia_curso alter column profesor_id set not null;

-- One assignment per profesor (as current app expects)
create unique index if not exists ux_profesor_materia_curso_profesor on public.profesor_materia_curso(profesor_id);
