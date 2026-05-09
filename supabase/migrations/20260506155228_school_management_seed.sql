insert into public.cursos (nombre, nivel)
values
  ('Primero A', 'Primaria'),
  ('Segundo B', 'Primaria'),
  ('Tercero A', 'Secundaria')
on conflict do nothing;

insert into public.materias (nombre)
values
  ('Matematicas'),
  ('Lenguaje'),
  ('Ciencias Naturales'),
  ('Historia')
on conflict do nothing;
