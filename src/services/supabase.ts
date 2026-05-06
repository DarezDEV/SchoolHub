import { createClient } from '@supabase/supabase-js';
import type { Course, Subject } from '../types';

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
