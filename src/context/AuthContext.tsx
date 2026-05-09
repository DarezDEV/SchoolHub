import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { AuthUser, Profile, RoleName } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'schoolhub.session';
const USER_KEY = 'schoolhub.user';

async function fetchUserData(supabaseUser: User): Promise<AuthUser> {
  const [profileRes, roleRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', supabaseUser.id).maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (roleRes.error) throw roleRes.error;
  const profile = profileRes.data as Profile | null;
  const roleRaw = Array.isArray((roleRes.data as any)?.roles)
    ? (roleRes.data as any)?.roles?.[0]?.name
    : (roleRes.data as any)?.roles?.name;
  const role = (roleRaw ?? profile?.role ?? null) as RoleName | null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    profile,
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUser = useCallback(async (supabaseUser: User | null) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }
    const authUser = await fetchUserData(supabaseUser);
    setUser(authUser);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log('[auth] getSession response', data);
        if (!isMounted) return;
        setSession(data.session);
      } catch (error) {
        console.error('[auth] getSession error', error);
        if (isMounted) {
          setSession(null);
          setAuthError('No se pudo cargar la sesion actual.');
        }
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    void initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[auth] onAuthStateChange', event, nextSession?.user?.email);
      if (!isMounted) return;
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    let cancelled = false;
    const syncUser = async () => {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await loadUser(session.user);
        if (!cancelled) setAuthError(null);
      } catch (error) {
        console.error('[auth] profile/role sync error', error);
        if (!cancelled) {
          setUser(null);
          setAuthError('No se pudo cargar el perfil del usuario.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void syncUser();
    return () => {
      cancelled = true;
    };
  }, [initialized, loadUser, session]);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    console.log('[auth] signIn start', email);
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[auth] signIn response', { hasSession: !!data.session, userId: data.user?.id, error });
    if (error) return { error: error as Error };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthError(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authError, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
