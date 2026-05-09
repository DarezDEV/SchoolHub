-- Drop legacy/unused tables after migration to profiles.role + courses/subjects schema

drop table if exists public.user_roles;
drop table if exists public.roles;
drop table if exists public.cursos;
drop table if exists public.materias;
