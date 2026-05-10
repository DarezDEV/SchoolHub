import { createClient } from '@supabase/supabase-js';
import type {
  Course,
  Subject,
  Curso,
  Materia,
  Estudiante,
  EstudianteListItem,
  Profesor,
  ProfesorListItem,
  ProfesorMateriaCurso,
<<<<<<< HEAD
  UserListItem,
  RoleName,
=======
  TeacherAssignmentView,
  TeacherGradeView,
  TeacherStudentView,
>>>>>>> 5c1034d (rol del profesor con todos sus apartados)
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function parseFunctionError(error: unknown): Error {
  const messageFromError = error instanceof Error ? error.message : '';
  const context = (error as any)?.context;
  const contextError = context?.error || context?.message;
  const finalMessage =
    contextError ||
    messageFromError ||
    'Error en la funcion remota.';
  return new Error(finalMessage);
}

export interface CoursePayload {
  name: string;
  code: string;
  academic_year?: string;
  section?: string;
  description?: string;
  active?: boolean;
}

export interface SubjectPayload {
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}

export interface EstudiantePayload {
  nombre: string;
  email: string;
  curso_id: string;
}

export interface ProfesorPayload {
  nombre: string;
  email: string;
  materia_id: string;
  curso_id: string;
}

<<<<<<< HEAD
export interface CourseSubjectAssignmentPayload {
  profesor_id: string;
  materia_id: string;
  curso_id: string;
=======
export interface NotaPayload {
  estudiante_id: string;
  course_id: string;
  subject_id: string;
  periodo: string;
  nota: number;
  observacion?: string;
>>>>>>> 5c1034d (rol del profesor con todos sus apartados)
}

function mapAssignmentColumns(record: any): { materiaId: string | null; cursoId: string | null } {
  return {
    materiaId: record?.materia_id ?? record?.subject_id ?? null,
    cursoId: record?.curso_id ?? record?.course_id ?? null,
  };
}

<<<<<<< HEAD
async function insertCourseSubjectAssignment(params: CourseSubjectAssignmentPayload) {
  const [
    { data: teacherExists, error: teacherError },
    { data: subjectExists, error: subjectError },
    { data: courseExists, error: courseError },
    { data: courseAssignments, error: courseAssignmentsError },
    { data: teacherSubjectAssignment, error: teacherSubjectError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,role,active')
      .eq('id', params.profesor_id)
      .eq('role', 'teacher')
      .eq('active', true)
      .maybeSingle(),
    supabase.from('subjects').select('id').eq('id', params.materia_id).maybeSingle(),
    supabase.from('courses').select('id').eq('id', params.curso_id).maybeSingle(),
    supabase
      .from('profesor_materia_curso')
      .select('id,materia_id,subject_id,curso_id,course_id')
      .or(`curso_id.eq.${params.curso_id},course_id.eq.${params.curso_id}`),
    supabase
      .from('profesor_materia_curso')
      .select('id')
      .eq('profesor_id', params.profesor_id)
      .or(`materia_id.eq.${params.materia_id},subject_id.eq.${params.materia_id}`)
      .limit(1)
      .maybeSingle(),
=======
function mapCourse(item: any): { id: string; nombre: string; nivel: string } {
  return {
    id: item.id,
    nombre: item.name ?? item.nombre ?? '',
    nivel: item.academic_year ?? item.section ?? item.nivel ?? '',
  };
}

function mapSubject(item: any): { id: string; nombre: string } {
  return {
    id: item.id,
    nombre: item.name ?? item.nombre ?? '',
  };
}

async function insertTeacherAssignment(params: { profesorId: string; materiaId: string; cursoId: string }) {
  const [{ data: subjectExists, error: subjectError }, { data: courseExists, error: courseError }] = await Promise.all([
    supabase.from('subjects').select('id').eq('id', params.materiaId).maybeSingle(),
    supabase.from('courses').select('id').eq('id', params.cursoId).maybeSingle(),
>>>>>>> 5c1034d (rol del profesor con todos sus apartados)
  ]);

  const duplicateAssignment = (courseAssignments ?? []).find((assignment: any) => {
    const mapped = mapAssignmentColumns(assignment);
    return mapped.cursoId === params.curso_id && mapped.materiaId === params.materia_id;
  });

  if (teacherError) throw new Error(teacherError.message || 'No se pudo validar el profesor.');
  if (subjectError) throw new Error(subjectError.message || 'No se pudo validar la materia.');
  if (courseError) throw new Error(courseError.message || 'No se pudo validar el curso.');
  if (courseAssignmentsError) throw new Error(courseAssignmentsError.message || 'No se pudo validar la asignacion actual del curso.');
  if (teacherSubjectError) throw new Error(teacherSubjectError.message || 'No se pudo validar la materia del profesor.');
  if (!teacherExists) throw new Error('El profesor seleccionado no existe o fue eliminado.');
  if (!subjectExists) throw new Error('La materia seleccionada no existe o fue eliminada.');
  if (!courseExists) throw new Error('El curso seleccionado no existe o fue eliminado.');
  if (duplicateAssignment) throw new Error('Este curso ya tiene un profesor asignado para esa materia.');
  if (!teacherSubjectAssignment) throw new Error('El profesor seleccionado no tiene esa materia asociada actualmente.');

  const firstTry = await supabase.from('profesor_materia_curso').insert({
    profesor_id: params.profesor_id,
    materia_id: params.materia_id,
    curso_id: params.curso_id,
  });

  if (!firstTry.error) return;

  const fallbackTry = await supabase.from('profesor_materia_curso').insert({
    profesor_id: params.profesor_id,
    subject_id: params.materia_id,
    course_id: params.curso_id,
  } as any);

  if (fallbackTry.error) {
    const message = fallbackTry.error.message || firstTry.error?.message || 'No se pudo crear la asignacion del curso.';
    if (message.includes('profesor_materia_curso_profesor_id_key')) {
      throw new Error('La interfaz ya evita repetir materias por curso. Si este error sigue saliendo, falta aplicar la migracion que permite que un profesor tenga varios cursos con la misma materia.');
    }
    throw new Error(fallbackTry.error.message || firstTry.error.message || 'No se pudo crear la asignacion del curso.');
  }
}

export const courseService = {
  async list(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Course[];
  },

  async create(payload: CoursePayload): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...payload,
        active: payload.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Course;
  },

  async update(id: string, payload: CoursePayload): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Course;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  },
};

export const subjectService = {
  async list(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Subject[];
  },

  async create(payload: SubjectPayload): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        ...payload,
        active: payload.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Subject;
  },

  async update(id: string, payload: SubjectPayload): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Subject;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  },
};

export const schoolService = {
  async listUsers(): Promise<UserListItem[]> {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('id,name,email,role,course_id,active,created_at').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id,roles(name)'),
    ]);
    if (profilesRes.error) throw profilesRes.error;

    const roleByUserId = new Map<string, RoleName>();
    for (const row of rolesRes.error ? [] : rolesRes.data ?? []) {
      const roleRaw = Array.isArray((row as any).roles) ? (row as any).roles[0]?.name : (row as any).roles?.name;
      if (typeof roleRaw === 'string') roleByUserId.set((row as any).user_id, roleRaw as RoleName);
    }

    return (profilesRes.data ?? []).map((profile: any) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      active: profile.active,
      created_at: profile.created_at,
      role: roleByUserId.get(profile.id) ?? ((profile.role ?? null) as RoleName | null),
    })) as UserListItem[];
  },

  async inviteUser(payload: { name: string; email: string; role: RoleName; courseId?: string; subjectId?: string }) {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { action: 'invite', ...payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } catch (error) {
      throw parseFunctionError(error);
    }
  },

  async updateUser(payload: { userId: string; name?: string; email?: string; role?: RoleName; active?: boolean; courseId?: string | null; subjectId?: string | null }) {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { action: 'update', ...payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } catch (error) {
      throw parseFunctionError(error);
    }
  },

  async deleteUser(userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { action: 'delete', userId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } catch (error) {
      throw parseFunctionError(error);
    }
  },

  async listCursos(): Promise<Curso[]> {
    const { data, error } = await supabase.from('courses').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      nombre: item.name,
      nivel: item.academic_year ?? item.section ?? '',
      created_at: item.created_at,
    })) as Curso[];
  },

  async listMaterias(): Promise<Materia[]> {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      nombre: item.name,
      created_at: item.created_at,
    })) as Materia[];
  },

  async listEstudiantes(): Promise<EstudianteListItem[]> {
<<<<<<< HEAD
    const [users, coursesRes] = await Promise.all([
      schoolService.listUsers(),
=======
    const [{ data: students, error: studentsError }, { data: courses, error: coursesError }] = await Promise.all([
      supabase.from('estudiantes').select('*').order('created_at', { ascending: false }),
>>>>>>> 5c1034d (rol del profesor con todos sus apartados)
      supabase.from('courses').select('id,name,academic_year,section'),
    ]);
    if (coursesRes.error) throw coursesRes.error;
    const students = users.filter((u) => u.role === 'student');

    const profilesRes = await supabase.from('profiles').select('id,course_id');
    if (profilesRes.error) throw profilesRes.error;
    const courseIdByUserId = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.course_id]));
    const courseById = new Map((coursesRes.data ?? []).map((course: any) => [course.id, course]));

    return (students ?? []).map((item: any) => {
      const courseId = courseIdByUserId.get(item.id);
      const course = courseById.get(courseId);
      return {
        id: item.id,
        nombre: item.name,
        email: item.email,
<<<<<<< HEAD
        curso_id: courseId,
=======
        curso_id: item.curso_id,
        matricula: item.matricula,
        foto_url: item.foto_url,
>>>>>>> 5c1034d (rol del profesor con todos sus apartados)
        created_at: item.created_at,
        cursos: course
          ? {
              id: course.id,
              nombre: course.name,
              nivel: course.academic_year ?? course.section ?? '',
            }
          : undefined,
      };
    }) as EstudianteListItem[];
  },

  async createEstudiante(payload: EstudiantePayload): Promise<Estudiante> {
    if (!payload.curso_id) throw new Error('Debe seleccionar un curso.');
    await schoolService.inviteUser({
      name: payload.nombre,
      email: payload.email,
      role: 'student',
      courseId: payload.curso_id,
    });
    return {
      id: '',
      nombre: payload.nombre,
      email: payload.email,
      curso_id: payload.curso_id,
      created_at: new Date().toISOString(),
    };
  },

  async updateEstudiante(id: string, payload: EstudiantePayload): Promise<Estudiante> {
    if (!payload.curso_id) throw new Error('Debe seleccionar un curso.');

    await schoolService.updateUser({
      userId: id,
      name: payload.nombre,
      email: payload.email,
      role: 'student',
      courseId: payload.curso_id,
    });
    return {
      id,
      nombre: payload.nombre,
      email: payload.email,
      curso_id: payload.curso_id,
      created_at: new Date().toISOString(),
    };
  },

  async deleteEstudiante(id: string): Promise<void> {
    await schoolService.deleteUser(id);
  },

  async listProfesores(): Promise<ProfesorListItem[]> {
    const [
      { data: teachers, error: teachersError },
      { data: assignments, error: assignmentsError },
      { data: subjects, error: subjectsError },
      { data: courses, error: coursesError },
    ] = await Promise.all([
      supabase.from('vw_teachers').select('id,name,email,created_at').order('created_at', { ascending: false }),
      supabase.from('profesor_materia_curso').select('*'),
      supabase.from('subjects').select('id,name'),
      supabase.from('courses').select('id,name,academic_year,section'),
    ]);

    if (teachersError) throw teachersError;
    if (assignmentsError) throw assignmentsError;
    if (subjectsError) throw subjectsError;
    if (coursesError) throw coursesError;

    const subjectById = new Map((subjects ?? []).map((item: any) => [item.id, item]));
    const courseById = new Map((courses ?? []).map((item: any) => [item.id, item]));

    return (teachers ?? []).map((teacher: any) => {
      const teacherAssignments = (assignments ?? []).filter((assignment: any) => assignment.profesor_id === teacher.id);
      return {
        id: teacher.id,
        nombre: teacher.name,
        email: teacher.email,
        created_at: teacher.created_at,
        profesor_materia_curso: teacherAssignments.map((assignment: any) => {
          const mapped = mapAssignmentColumns(assignment);
          const subject = mapped.materiaId ? subjectById.get(mapped.materiaId) : null;
          const course = mapped.cursoId ? courseById.get(mapped.cursoId) : null;
          return {
            id: assignment.id,
            materias: subject
              ? {
                  id: subject.id,
                  nombre: subject.name,
                }
              : undefined,
            cursos: course
              ? {
                  id: course.id,
                  nombre: course.name,
                  nivel: course.academic_year ?? course.section ?? '',
                }
              : undefined,
          };
        }),
      };
    }) as ProfesorListItem[];
  },

  async createProfesor(payload: ProfesorPayload): Promise<Profesor> {
    if (!payload.materia_id || !payload.curso_id) {
      throw new Error('Debe seleccionar materia y curso.');
    }

    await schoolService.inviteUser({
      name: payload.nombre,
      email: payload.email,
      role: 'teacher',
      subjectId: payload.materia_id,
      courseId: payload.curso_id,
    });
    return {
      id: '',
      nombre: payload.nombre,
      email: payload.email,
      created_at: new Date().toISOString(),
    };
  },

  async updateProfesor(id: string, payload: ProfesorPayload): Promise<void> {
    if (!payload.materia_id || !payload.curso_id) {
      throw new Error('Debe seleccionar materia y curso.');
    }

    await schoolService.updateUser({
      userId: id,
      name: payload.nombre,
      email: payload.email,
      role: 'teacher',
      subjectId: payload.materia_id,
      courseId: payload.curso_id,
    });
  },

  async deleteProfesor(id: string): Promise<void> {
    await schoolService.deleteUser(id);
  },

  async getProfesorAssignment(profesorId: string): Promise<ProfesorMateriaCurso | null> {
    const { data, error } = await supabase
      .from('profesor_materia_curso')
      .select('*')
      .eq('profesor_id', profesorId)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message || 'No se pudo leer la asignacion del profesor.');
    if (!data) return null;
    const mapped = mapAssignmentColumns(data);
    return {
      id: data.id,
      profesor_id: data.profesor_id,
      materia_id: mapped.materiaId ?? '',
      curso_id: mapped.cursoId ?? '',
    } as ProfesorMateriaCurso;
  },

  async assignMateriaToCurso(payload: CourseSubjectAssignmentPayload): Promise<void> {
    if (!payload.profesor_id || !payload.materia_id || !payload.curso_id) {
      throw new Error('Debe seleccionar curso, materia y profesor.');
    }

    await insertCourseSubjectAssignment(payload);
  },

  async removeMateriaFromCurso(assignmentId: string): Promise<void> {
    const { error } = await supabase.from('profesor_materia_curso').delete().eq('id', assignmentId);
    if (error) throw new Error(error.message || 'No se pudo eliminar la asignacion del curso.');
  },
};

async function getProfesorForUser(userEmail?: string | null, userId?: string | null): Promise<Profesor | null> {
  if (!userEmail && !userId) return null;

  const filters = [
    userId ? `id.eq.${userId}` : '',
    userEmail ? `email.eq.${userEmail}` : '',
  ].filter(Boolean).join(',');

  const { data, error } = await supabase
    .from('profesores')
    .select('*')
    .or(filters)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message || 'No se pudo leer el perfil del profesor.');
  return data as Profesor | null;
}

async function getTeacherBaseData(userEmail?: string | null, userId?: string | null) {
  const profesor = await getProfesorForUser(userEmail, userId);
  if (!profesor) {
    return { profesor: null, assignments: [] as TeacherAssignmentView[], students: [] as TeacherStudentView[], grades: [] as TeacherGradeView[] };
  }

  const [
    { data: assignmentRows, error: assignmentError },
    { data: courses, error: coursesError },
    { data: subjects, error: subjectsError },
    { data: students, error: studentsError },
    { data: grades, error: gradesError },
  ] = await Promise.all([
    supabase.from('profesor_materia_curso').select('*').eq('profesor_id', profesor.id),
    supabase.from('courses').select('id,name,academic_year,section'),
    supabase.from('subjects').select('id,name'),
    supabase.from('estudiantes').select('*'),
    supabase.from('notas').select('*').eq('profesor_id', profesor.id).order('created_at', { ascending: false }),
  ]);

  if (assignmentError) throw new Error(assignmentError.message || 'No se pudieron leer las asignaciones.');
  if (coursesError) throw new Error(coursesError.message || 'No se pudieron leer los cursos.');
  if (subjectsError) throw new Error(subjectsError.message || 'No se pudieron leer las materias.');
  if (studentsError) throw new Error(studentsError.message || 'No se pudieron leer los estudiantes.');
  if (gradesError) throw new Error(gradesError.message || 'No se pudieron leer las notas.');

  const courseById = new Map((courses ?? []).map((item: any) => [item.id, mapCourse(item)]));
  const subjectById = new Map((subjects ?? []).map((item: any) => [item.id, mapSubject(item)]));
  const studentsByCourse = new Map<string, any[]>();

  (students ?? []).forEach((student: any) => {
    const rows = studentsByCourse.get(student.curso_id) ?? [];
    rows.push(student);
    studentsByCourse.set(student.curso_id, rows);
  });

  const assignments = (assignmentRows ?? []).map((assignment: any) => {
    const mapped = mapAssignmentColumns(assignment);
    const curso = mapped.cursoId ? courseById.get(mapped.cursoId) : undefined;
    const materia = mapped.materiaId ? subjectById.get(mapped.materiaId) : undefined;

    return {
      id: assignment.id,
      profesor_id: assignment.profesor_id,
      materia_id: mapped.materiaId ?? '',
      curso_id: mapped.cursoId ?? '',
      curso: curso ?? { id: mapped.cursoId ?? '', nombre: 'Curso no disponible', nivel: '' },
      materia: materia ?? { id: mapped.materiaId ?? '', nombre: 'Materia no disponible' },
      student_count: mapped.cursoId ? (studentsByCourse.get(mapped.cursoId)?.length ?? 0) : 0,
    };
  }) as TeacherAssignmentView[];

  const assignmentByPair = new Map(assignments.map((assignment) => [`${assignment.curso_id}:${assignment.materia_id}`, assignment]));
  const studentById = new Map((students ?? []).map((student: any) => [student.id, student]));

  const teacherStudents = assignments.flatMap((assignment) => (
    studentsByCourse.get(assignment.curso_id) ?? []
  ).map((student: any) => ({
    id: student.id,
    nombre: student.nombre,
    email: student.email,
    matricula: student.matricula,
    foto_url: student.foto_url,
    curso_id: student.curso_id,
    created_at: student.created_at,
    curso: assignment.curso,
    materia: assignment.materia,
  }))) as TeacherStudentView[];

  const teacherGrades = (grades ?? []).map((grade: any) => {
    const assignment = assignmentByPair.get(`${grade.course_id}:${grade.subject_id}`);
    const student = studentById.get(grade.estudiante_id);
    return {
      id: grade.id,
      estudiante_id: grade.estudiante_id,
      profesor_id: grade.profesor_id,
      course_id: grade.course_id,
      subject_id: grade.subject_id,
      periodo: grade.periodo,
      nota: Number(grade.nota),
      observacion: grade.observacion,
      created_at: grade.created_at,
      updated_at: grade.updated_at,
      estudiante: {
        id: student?.id ?? grade.estudiante_id,
        nombre: student?.nombre ?? 'Estudiante no disponible',
        email: student?.email ?? '',
        matricula: student?.matricula,
        foto_url: student?.foto_url,
      },
      curso: assignment?.curso ?? courseById.get(grade.course_id) ?? { id: grade.course_id, nombre: 'Curso no disponible', nivel: '' },
      materia: assignment?.materia ?? subjectById.get(grade.subject_id) ?? { id: grade.subject_id, nombre: 'Materia no disponible' },
    };
  }) as TeacherGradeView[];

  return { profesor, assignments, students: teacherStudents, grades: teacherGrades };
}

export const teacherService = {
  async getWorkspace(userEmail?: string | null, userId?: string | null) {
    return getTeacherBaseData(userEmail, userId);
  },

  async createNota(userEmail: string | null | undefined, userId: string | null | undefined, payload: NotaPayload): Promise<void> {
    const profesor = await getProfesorForUser(userEmail, userId);
    if (!profesor) throw new Error('No se encontro el perfil del profesor.');

    const { data: assignment, error: assignmentError } = await supabase
      .from('profesor_materia_curso')
      .select('id')
      .eq('profesor_id', profesor.id)
      .eq('course_id', payload.course_id)
      .eq('subject_id', payload.subject_id)
      .maybeSingle();

    if (assignmentError) throw new Error(assignmentError.message || 'No se pudo validar la asignacion.');
    if (!assignment) throw new Error('Solo puedes publicar notas en tus cursos y materias asignados.');

    const { data: duplicate, error: duplicateError } = await supabase
      .from('notas')
      .select('id')
      .eq('estudiante_id', payload.estudiante_id)
      .eq('profesor_id', profesor.id)
      .eq('course_id', payload.course_id)
      .eq('subject_id', payload.subject_id)
      .eq('periodo', payload.periodo)
      .maybeSingle();

    if (duplicateError) throw new Error(duplicateError.message || 'No se pudo validar la nota.');
    if (duplicate) throw new Error('Ya existe una nota para este estudiante, materia, curso y periodo.');

    const { error } = await supabase.from('notas').insert({
      estudiante_id: payload.estudiante_id,
      profesor_id: profesor.id,
      course_id: payload.course_id,
      subject_id: payload.subject_id,
      periodo: payload.periodo,
      nota: payload.nota,
      observacion: payload.observacion?.trim() || null,
    });

    if (error) throw new Error(error.message || 'No se pudo publicar la nota.');
  },

  async updateNota(id: string, nota: number, observacion?: string): Promise<void> {
    const { error } = await supabase
      .from('notas')
      .update({ nota, observacion: observacion?.trim() || null })
      .eq('id', id);

    if (error) throw new Error(error.message || 'No se pudo actualizar la nota.');
  },
};
