import type { RoleName } from '../types';

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
