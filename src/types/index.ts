export type RoleName = 'director' | 'coordinator' | 'teacher' | 'student';

export interface Role {
  id: number;
  name: RoleName;
}

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