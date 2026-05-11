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
  UserListItem,
  RoleName,
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function parseFunctionError(error: unknown): Promise<Error> {
  const messageFromError = error instanceof Error ? error.message : '';
  const context = (error as any)?.context;

  if (context && typeof context === 'object') {
    if (typeof context.error === 'string') return new Error(context.error);
    if (typeof context.message === 'string') return new Error(context.message);

    if (typeof (context as any).json === 'function') {
      try {
        const body = await (context as any).json();
        if (typeof body?.error === 'string') return new Error(body.error);
        if (typeof body?.message === 'string') return new Error(body.message);
      } catch {
        // Ignore and fallback
      }
    }

    if (typeof (context as any).text === 'function') {
      try {
        const text = await (context as any).text();
        if (text) return new Error(text);
      } catch {
        // Ignore and fallback
      }
    }

    const status = (context as any).status;
    const statusText = (context as any).statusText;
    if (typeof status === 'number') {
      return new Error(`Edge Function error (${status}${statusText ? ` ${statusText}` : ''}).`);
    }
  }

  return new Error(messageFromError || 'Error en la funcion remota.');
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

export interface CourseSubjectAssignmentPayload {
  profesor_id: string;
  materia_id: string;
  curso_id: string;
}

function mapAssignmentColumns(record: any): { materiaId: string | null; cursoId: string | null } {
  return {
    materiaId: record?.materia_id ?? record?.subject_id ?? null,
    cursoId: record?.curso_id ?? record?.course_id ?? null,
  };
}

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
  async getAuthHeaders() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message || 'No se pudo obtener la sesion.');
    const token = data.session?.access_token;
    if (!token) throw new Error('Sesion expirada. Vuelve a iniciar sesion.');
    return { Authorization: `Bearer ${token}` };
  },

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
    const normalizedEmail = payload.email.trim().toLowerCase();
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('id,email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfileError) throw new Error(existingProfileError.message || 'No se pudo validar el email.');
    if (existingProfile?.id) {
      throw new Error('Ya existe un usuario con ese correo. Usa editar usuario o cambia el email.');
    }

    try {
      const headers = await schoolService.getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('create-user', {
        headers,
        body: { action: 'invite', ...payload, email: normalizedEmail, accessToken: headers.Authorization.replace('Bearer ', '') },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } catch (error) {
      throw await parseFunctionError(error);
    }
  },

  async updateUser(payload: { userId: string; name?: string; email?: string; role?: RoleName; active?: boolean; courseId?: string | null; subjectId?: string | null }) {
    try {
      const headers = await schoolService.getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('create-user', {
        headers,
        body: { action: 'update', ...payload, accessToken: headers.Authorization.replace('Bearer ', '') },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } catch (error) {
      throw await parseFunctionError(error);
    }
  },

  async deleteUser(userId: string) {
    try {
      const headers = await schoolService.getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('create-user', {
        headers,
        body: { action: 'delete', userId, accessToken: headers.Authorization.replace('Bearer ', '') },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } catch (error) {
      throw await parseFunctionError(error);
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
    const [users, coursesRes] = await Promise.all([
      schoolService.listUsers(),
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
        curso_id: courseId,
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
