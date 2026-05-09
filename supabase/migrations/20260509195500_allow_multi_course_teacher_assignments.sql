-- Allow a professor to appear in multiple course assignments while keeping
-- each subject unique per course.

alter table public.profesor_materia_curso
  drop constraint if exists profesor_materia_curso_profesor_id_key;

drop index if exists public.ux_profesor_materia_curso_profesor;

create unique index if not exists ux_profesor_materia_curso_course_subject
  on public.profesor_materia_curso(course_id, subject_id);
