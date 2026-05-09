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
    const { data, error } = await supabase.from('cursos').select('*').order('nombre');
    if (error) throw error;
    return (data ?? []) as Curso[];
  },

  async listMaterias(): Promise<Materia[]> {
    const { data, error } = await supabase.from('materias').select('*').order('nombre');
    if (error) throw error;
    return (data ?? []) as Materia[];
  },

  async listEstudiantes(): Promise<EstudianteListItem[]> {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('id,nombre,email,curso_id,created_at,cursos(id,nombre,nivel)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      email: item.email,
      curso_id: item.curso_id,
      created_at: item.created_at,
      cursos: Array.isArray(item.cursos) ? item.cursos[0] : item.cursos,
    })) as EstudianteListItem[];
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
    const { data, error } = await supabase
      .from('profesores')
      .select('id,nombre,email,created_at,profesor_materia_curso(id,materias(id,nombre),cursos(id,nombre,nivel))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      email: item.email,
      created_at: item.created_at,
      profesor_materia_curso: (item.profesor_materia_curso ?? []).map((assign: any) => ({
        id: assign.id,
        materias: Array.isArray(assign.materias) ? assign.materias[0] : assign.materias,
        cursos: Array.isArray(assign.cursos) ? assign.cursos[0] : assign.cursos,
      })),
    })) as ProfesorListItem[];
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

    if (profesorError || !profesor) throw profesorError ?? new Error('No se pudo crear el profesor.');

    const { error: assignmentError } = await supabase.from('profesor_materia_curso').insert({
      profesor_id: profesor.id,
      materia_id: payload.materia_id,
      curso_id: payload.curso_id,
    });

    if (assignmentError) {
      await supabase.from('profesores').delete().eq('id', profesor.id);
      throw assignmentError;
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

    if (profesorError) throw profesorError;

    const { data: currentAssignment, error: assignmentFetchError } = await supabase
      .from('profesor_materia_curso')
      .select('id')
      .eq('profesor_id', id)
      .maybeSingle();

    if (assignmentFetchError) throw assignmentFetchError;

    if (currentAssignment?.id) {
      const { error: assignmentUpdateError } = await supabase
        .from('profesor_materia_curso')
        .update({ materia_id: payload.materia_id, curso_id: payload.curso_id })
        .eq('id', currentAssignment.id);

      if (assignmentUpdateError) throw assignmentUpdateError;
      return;
    }

    const { error: assignmentCreateError } = await supabase.from('profesor_materia_curso').insert({
      profesor_id: id,
      materia_id: payload.materia_id,
      curso_id: payload.curso_id,
    });

    if (assignmentCreateError) throw assignmentCreateError;
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
      .maybeSingle();

    if (error) throw error;
    return (data as ProfesorMateriaCurso | null) ?? null;
  },
};
