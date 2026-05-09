import type { CapabilityKey, RoleName } from '../types';

export const APP_DOMAIN = {
  name: 'SchoolHub',
  type: 'school-management',
  description: 'Sistema de gestion escolar con roles para direccion, coordinacion, docencia y estudiantes.',
} as const;

export const ROLE_LABELS: Record<RoleName, string> = {
  director: 'Director',
  coordinator: 'Coordinador',
  teacher: 'Profesor',
  student: 'Estudiante',
};

export const ROLE_ROUTES: Record<RoleName, string> = {
  director: '/director/dashboard',
  coordinator: '/coordinador/dashboard',
  teacher: '/profesor/dashboard',
  student: '/estudiante/dashboard',
};

export const ROLE_COLORS: Record<RoleName, string> = {
  director: 'bg-purple-600',
  coordinator: 'bg-primary',
  teacher: 'bg-emerald-600',
  student: 'bg-secondary',
};

export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  director: 'Puede ver el resumen general del sistema y consultar la informacion academica.',
  coordinator: 'Gestiona profesores, cursos, estudiantes por curso, asignaciones y seguimiento academico.',
  teacher: 'Registra notas unicamente en los cursos que le fueron asignados.',
  student: 'Consulta sus propias notas y su avance academico.',
};

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  view_global_summary: 'Ver resumen general del sistema',
  manage_teachers: 'Crear y administrar profesores',
  manage_courses: 'Crear y administrar cursos',
  manage_subjects: 'Crear y administrar materias',
  manage_students_within_course: 'Crear estudiantes dentro de un curso',
  assign_teachers_to_courses: 'Asignar profesores a cursos',
  view_all_student_grades: 'Ver notas y detalle de todos los estudiantes',
  grade_own_courses: 'Asignar notas solo en cursos propios',
  view_own_grades: 'Ver sus propias notas',
};

export const ROLE_CAPABILITIES: Record<RoleName, CapabilityKey[]> = {
  director: ['view_global_summary'],
  coordinator: [
    'manage_teachers',
    'manage_courses',
    'manage_subjects',
    'manage_students_within_course',
    'assign_teachers_to_courses',
    'view_all_student_grades',
  ],
  teacher: ['grade_own_courses'],
  student: ['view_own_grades'],
};
