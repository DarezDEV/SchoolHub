-- Teacher workspace: multiple assignments, grade periods and RLS guards.

alter table public.estudiantes add column if not exists matricula text;
alter table public.estudiantes add column if not exists foto_url text;

alter table public.profesor_materia_curso drop constraint if exists profesor_materia_curso_profesor_id_key;
drop index if exists public.ux_profesor_materia_curso_profesor;

create unique index if not exists ux_profesor_materia_curso_profesor_subject_course
  on public.profesor_materia_curso(profesor_id, subject_id, course_id);

create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  profesor_id uuid not null references public.profesores(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  periodo text not null,
  nota numeric(5,2) not null check (nota >= 0 and nota <= 100),
  observacion text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notas_no_duplicadas unique (estudiante_id, profesor_id, course_id, subject_id, periodo),
  constraint notas_estudiante_curso_check check (periodo <> '')
);

create index if not exists idx_notas_profesor on public.notas(profesor_id);
create index if not exists idx_notas_estudiante on public.notas(estudiante_id);
create index if not exists idx_notas_course_subject on public.notas(course_id, subject_id);

drop trigger if exists set_notas_updated_at on public.notas;
create trigger set_notas_updated_at
before update on public.notas
for each row
execute function public.set_updated_at();

alter table public.notas enable row level security;

drop policy if exists "authenticated_all_estudiantes" on public.estudiantes;
drop policy if exists "authenticated_all_profesores" on public.profesores;
drop policy if exists "authenticated_all_profesor_materia_curso" on public.profesor_materia_curso;

create or replace function public.current_profesor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profesores p
  where p.id = auth.uid()
     or lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

grant execute on function public.current_profesor_id() to authenticated;

create or replace function public.teacher_has_assignment(p_profesor_id uuid, p_course_id uuid, p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profesor_materia_curso pmc
    where pmc.profesor_id = p_profesor_id
      and pmc.course_id = p_course_id
      and pmc.subject_id = p_subject_id
  );
$$;

grant execute on function public.teacher_has_assignment(uuid, uuid, uuid) to authenticated;

drop policy if exists "teachers can read assigned courses" on public.courses;
create policy "teachers can read assigned courses"
on public.courses
for select
to authenticated
using (
  public.has_role('teacher')
  and exists (
    select 1
    from public.profesor_materia_curso pmc
    where pmc.course_id = courses.id
      and pmc.profesor_id = public.current_profesor_id()
  )
);

drop policy if exists "teachers can read assigned subjects" on public.subjects;
create policy "teachers can read assigned subjects"
on public.subjects
for select
to authenticated
using (
  public.has_role('teacher')
  and exists (
    select 1
    from public.profesor_materia_curso pmc
    where pmc.subject_id = subjects.id
      and pmc.profesor_id = public.current_profesor_id()
  )
);

drop policy if exists "teachers can read own profesor row" on public.profesores;
drop policy if exists "coordinators can manage profesores" on public.profesores;
create policy "coordinators can manage profesores"
on public.profesores
for all
to authenticated
using (public.has_role('coordinator'))
with check (public.has_role('coordinator'));

create policy "teachers can read own profesor row"
on public.profesores
for select
to authenticated
using (
  public.has_role('teacher')
  and id = public.current_profesor_id()
);

drop policy if exists "teachers can read own assignments" on public.profesor_materia_curso;
drop policy if exists "coordinators can manage profesor assignments" on public.profesor_materia_curso;
create policy "coordinators can manage profesor assignments"
on public.profesor_materia_curso
for all
to authenticated
using (public.has_role('coordinator'))
with check (public.has_role('coordinator'));

create policy "teachers can read own assignments"
on public.profesor_materia_curso
for select
to authenticated
using (
  public.has_role('teacher')
  and profesor_id = public.current_profesor_id()
);

drop policy if exists "teachers can read assigned students" on public.estudiantes;
drop policy if exists "coordinators can manage estudiantes" on public.estudiantes;
create policy "coordinators can manage estudiantes"
on public.estudiantes
for all
to authenticated
using (public.has_role('coordinator'))
with check (public.has_role('coordinator'));

create policy "teachers can read assigned students"
on public.estudiantes
for select
to authenticated
using (
  public.has_role('teacher')
  and exists (
    select 1
    from public.profesor_materia_curso pmc
    where pmc.profesor_id = public.current_profesor_id()
      and pmc.course_id = estudiantes.curso_id
  )
);

drop policy if exists "teachers can read own notas" on public.notas;
create policy "teachers can read own notas"
on public.notas
for select
to authenticated
using (
  public.has_role('coordinator')
  or (
    public.has_role('teacher')
    and profesor_id = public.current_profesor_id()
    and public.teacher_has_assignment(profesor_id, course_id, subject_id)
  )
);

drop policy if exists "teachers can insert own notas" on public.notas;
create policy "teachers can insert own notas"
on public.notas
for insert
to authenticated
with check (
  public.has_role('teacher')
  and profesor_id = public.current_profesor_id()
  and public.teacher_has_assignment(profesor_id, course_id, subject_id)
  and exists (
    select 1
    from public.estudiantes e
    where e.id = estudiante_id
      and e.curso_id = course_id
  )
);

drop policy if exists "teachers can update own notas" on public.notas;
create policy "teachers can update own notas"
on public.notas
for update
to authenticated
using (
  public.has_role('teacher')
  and profesor_id = public.current_profesor_id()
  and public.teacher_has_assignment(profesor_id, course_id, subject_id)
)
with check (
  public.has_role('teacher')
  and profesor_id = public.current_profesor_id()
  and public.teacher_has_assignment(profesor_id, course_id, subject_id)
);

drop policy if exists "coordinators can manage notas" on public.notas;
create policy "coordinators can manage notas"
on public.notas
for all
to authenticated
using (public.has_role('coordinator'))
with check (public.has_role('coordinator'));
