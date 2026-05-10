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
  TeacherAssignmentView,
  TeacherGradeView,
  TeacherStudentView,
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export interface NotaPayload {
  estudiante_id: string;
  course_id: string;
  subject_id: string;
  periodo: string;
  nota: number;
  observacion?: string;
}

function mapAssignmentColumns(record: any): { materiaId: string | null; cursoId: string | null } {
  return {
    materiaId: record?.materia_id ?? record?.subject_id ?? null,
    cursoId: record?.curso_id ?? record?.course_id ?? null,
  };
}

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
  ]);

  if (subjectError) throw new Error(subjectError.message || 'No se pudo validar la materia.');
  if (courseError) throw new Error(courseError.message || 'No se pudo validar el curso.');
  if (!subjectExists) throw new Error('La materia seleccionada no existe o fue eliminada. Vuelve a seleccionarla.');
  if (!courseExists) throw new Error('El curso seleccionado no existe o fue eliminado. Vuelve a seleccionarlo.');

  const firstTry = await supabase.from('profesor_materia_curso').insert({
    profesor_id: params.profesorId,
    materia_id: params.materiaId,
    curso_id: params.cursoId,
  });

  if (!firstTry.error) return;

  const fallbackTry = await supabase.from('profesor_materia_curso').insert({
    profesor_id: params.profesorId,
    subject_id: params.materiaId,
    course_id: params.cursoId,
  } as any);

  if (fallbackTry.error) {
    throw new Error(fallbackTry.error.message || firstTry.error.message || 'No se pudo crear la asignacion del profesor.');
  }
}

async function updateTeacherAssignment(params: { assignmentId: string; materiaId: string; cursoId: string }) {
  const [{ data: subjectExists, error: subjectError }, { data: courseExists, error: courseError }] = await Promise.all([
    supabase.from('subjects').select('id').eq('id', params.materiaId).maybeSingle(),
    supabase.from('courses').select('id').eq('id', params.cursoId).maybeSingle(),
  ]);

  if (subjectError) throw new Error(subjectError.message || 'No se pudo validar la materia.');
  if (courseError) throw new Error(courseError.message || 'No se pudo validar el curso.');
  if (!subjectExists) throw new Error('La materia seleccionada no existe o fue eliminada. Vuelve a seleccionarla.');
  if (!courseExists) throw new Error('El curso seleccionado no existe o fue eliminado. Vuelve a seleccionarlo.');

  const firstTry = await supabase
    .from('profesor_materia_curso')
    .update({ materia_id: params.materiaId, curso_id: params.cursoId })
    .eq('id', params.assignmentId);

  if (!firstTry.error) return;

  const fallbackTry = await supabase
    .from('profesor_materia_curso')
    .update({ subject_id: params.materiaId, course_id: params.cursoId } as any)
    .eq('id', params.assignmentId);

  if (fallbackTry.error) {
    throw new Error(fallbackTry.error.message || firstTry.error.message || 'No se pudo actualizar la asignacion del profesor.');
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
    const [{ data: students, error: studentsError }, { data: courses, error: coursesError }] = await Promise.all([
      supabase.from('estudiantes').select('*').order('created_at', { ascending: false }),
      supabase.from('courses').select('id,name,academic_year,section'),
    ]);

    if (studentsError) throw studentsError;
    if (coursesError) throw coursesError;

    const courseById = new Map((courses ?? []).map((course: any) => [course.id, course]));

    return (students ?? []).map((item: any) => {
      const course = courseById.get(item.curso_id);
      return {
        id: item.id,
        nombre: item.nombre,
        email: item.email,
        curso_id: item.curso_id,
        matricula: item.matricula,
        foto_url: item.foto_url,
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

    const { data, error } = await supabase
      .from('estudiantes')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return data as Estudiante;
  },

  async updateEstudiante(id: string, payload: EstudiantePayload): Promise<Estudiante> {
    if (!payload.curso_id) throw new Error('Debe seleccionar un curso.');

    const { data, error } = await supabase
      .from('estudiantes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Estudiante;
  },

  async deleteEstudiante(id: string): Promise<void> {
    const { error } = await supabase.from('estudiantes').delete().eq('id', id);
    if (error) throw error;
  },

  async listProfesores(): Promise<ProfesorListItem[]> {
    const [
      { data: teachers, error: teachersError },
      { data: assignments, error: assignmentsError },
      { data: subjects, error: subjectsError },
      { data: courses, error: coursesError },
    ] = await Promise.all([
      supabase.from('profesores').select('id,nombre,email,created_at').order('created_at', { ascending: false }),
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
        nombre: teacher.nombre,
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

    const { data: profesor, error: profesorError } = await supabase
      .from('profesores')
      .insert({ nombre: payload.nombre, email: payload.email })
      .select('*')
      .single();

    if (profesorError || !profesor) throw new Error(profesorError?.message || 'No se pudo crear el profesor.');

    try {
      await insertTeacherAssignment({
        profesorId: profesor.id,
        materiaId: payload.materia_id,
        cursoId: payload.curso_id,
      });
    } catch (assignmentError) {
      await supabase.from('profesores').delete().eq('id', profesor.id);
      throw assignmentError instanceof Error
        ? assignmentError
        : new Error('No se pudo crear la asignacion del profesor.');
    }

    return profesor as Profesor;
  },

  async updateProfesor(id: string, payload: ProfesorPayload): Promise<void> {
    if (!payload.materia_id || !payload.curso_id) {
      throw new Error('Debe seleccionar materia y curso.');
    }

    const { error: profesorError } = await supabase
      .from('profesores')
      .update({ nombre: payload.nombre, email: payload.email })
      .eq('id', id);

    if (profesorError) throw new Error(profesorError.message || 'No se pudo actualizar el profesor.');

    const { data: currentAssignment, error: assignmentFetchError } = await supabase
      .from('profesor_materia_curso')
      .select('id')
      .eq('profesor_id', id)
      .maybeSingle();

    if (assignmentFetchError) throw new Error(assignmentFetchError.message || 'No se pudo leer la asignacion.');

    if (currentAssignment?.id) {
      await updateTeacherAssignment({
        assignmentId: currentAssignment.id,
        materiaId: payload.materia_id,
        cursoId: payload.curso_id,
      });
      return;
    }

    await insertTeacherAssignment({
      profesorId: id,
      materiaId: payload.materia_id,
      cursoId: payload.curso_id,
    });
  },

  async deleteProfesor(id: string): Promise<void> {
    const { error } = await supabase.from('profesores').delete().eq('id', id);
    if (error) throw error;
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
