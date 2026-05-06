# SchoolHub

SchoolHub es un sistema de gestion escolar con autenticacion por roles.

## Roles del sistema

- `director`: puede ver resumen general, metricas y estado academico.
- `coordinator`: puede crear profesores, crear cursos, crear estudiantes dentro de un curso, asignar profesores a cursos y ver todas las notas.
- `teacher`: puede asignar notas solo a los cursos que le pertenecen.
- `student`: puede ver sus propias notas.

## Reglas de negocio base

- El proyecto representa una escuela.
- Los estudiantes se registran dentro de un curso.
- Las notas deben estar ligadas a un estudiante, un curso y un profesor.
- Los permisos de cada dashboard deben respetar el rol autenticado.
