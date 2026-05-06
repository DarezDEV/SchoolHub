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
