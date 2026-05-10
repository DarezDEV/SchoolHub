export type RoleName = 'director' | 'coordinator' | 'teacher' | 'student';

export interface Role {
  id: number;
  name: RoleName;
}

export type CapabilityKey =
  | 'view_global_summary'
  | 'manage_teachers'
  | 'manage_courses'
  | 'manage_subjects'
  | 'manage_students_within_course'
  | 'assign_teachers_to_courses'
  | 'view_all_student_grades'
  | 'grade_own_courses'
  | 'view_own_grades';

export interface Profile {
  id: string;
  name: string;
  last_name: string;
  email: string;
  active: boolean;
  created_at: string;
  avatar_url?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  role: RoleName | null;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  academic_year?: string;
  section?: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentCourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface TeacherCourseAssignment {
  id: string;
  teacher_id: string;
  course_id: string;
  assigned_at: string;
}

export interface GradeRecord {
  id: string;
  student_id: string;
  course_id: string;
  teacher_id: string;
  score: number;
  period?: string;
  notes?: string;
  created_at: string;
}

export interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  created_at: string;
}

export interface Materia {
  id: string;
  nombre: string;
  created_at: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  curso_id: string;
  created_at: string;
  matricula?: string;
  foto_url?: string;
}

export interface EstudianteListItem extends Estudiante {
  cursos: Pick<Curso, 'id' | 'nombre' | 'nivel'>;
}

export interface Profesor {
  id: string;
  nombre: string;
  email: string;
  created_at: string;
}

export interface ProfesorMateriaCurso {
  id: string;
  profesor_id: string;
  materia_id: string;
  curso_id: string;
}

export interface TeacherAssignmentView {
  id: string;
  profesor_id: string;
  materia_id: string;
  curso_id: string;
  materia: Pick<Materia, 'id' | 'nombre'>;
  curso: Pick<Curso, 'id' | 'nombre' | 'nivel'>;
  student_count: number;
}

export interface TeacherStudentView extends Estudiante {
  curso: Pick<Curso, 'id' | 'nombre' | 'nivel'>;
  materia: Pick<Materia, 'id' | 'nombre'>;
}

export interface Nota {
  id: string;
  estudiante_id: string;
  profesor_id: string;
  course_id: string;
  subject_id: string;
  periodo: string;
  nota: number;
  observacion?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TeacherGradeView extends Nota {
  estudiante: Pick<Estudiante, 'id' | 'nombre' | 'email' | 'matricula' | 'foto_url'>;
  curso: Pick<Curso, 'id' | 'nombre' | 'nivel'>;
  materia: Pick<Materia, 'id' | 'nombre'>;
}

export interface ProfesorListItem extends Profesor {
  profesor_materia_curso: {
    id: string;
    materias: Pick<Materia, 'id' | 'nombre'>;
    cursos: Pick<Curso, 'id' | 'nombre' | 'nivel'>;
  }[];
}
