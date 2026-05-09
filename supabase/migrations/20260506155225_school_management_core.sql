create extension if not exists "pgcrypto";

create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nivel text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.materias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.estudiantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  curso_id uuid not null references public.cursos(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.profesores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profesor_materia_curso (
  id uuid primary key default gen_random_uuid(),
  profesor_id uuid not null references public.profesores(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete restrict,
  curso_id uuid not null references public.cursos(id) on delete restrict,
  unique (profesor_id)
);

create index if not exists idx_estudiantes_curso_id on public.estudiantes(curso_id);
create index if not exists idx_profesor_materia_curso_profesor_id on public.profesor_materia_curso(profesor_id);
create index if not exists idx_profesor_materia_curso_materia_id on public.profesor_materia_curso(materia_id);
create index if not exists idx_profesor_materia_curso_curso_id on public.profesor_materia_curso(curso_id);

alter table public.cursos enable row level security;
alter table public.materias enable row level security;
alter table public.estudiantes enable row level security;
alter table public.profesores enable row level security;
alter table public.profesor_materia_curso enable row level security;

drop policy if exists "authenticated_all_cursos" on public.cursos;
create policy "authenticated_all_cursos" on public.cursos
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated_all_materias" on public.materias;
create policy "authenticated_all_materias" on public.materias
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated_all_estudiantes" on public.estudiantes;
create policy "authenticated_all_estudiantes" on public.estudiantes
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated_all_profesores" on public.profesores;
create policy "authenticated_all_profesores" on public.profesores
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated_all_profesor_materia_curso" on public.profesor_materia_curso;
create policy "authenticated_all_profesor_materia_curso" on public.profesor_materia_curso
  for all
  to authenticated
  using (true)
  with check (true);
