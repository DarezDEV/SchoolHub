import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_ROUTES } from '../../utils/constants';

export default function LoginPage() {
  const { signIn, user, loading, authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.role) {
      const target = ROLE_ROUTES[user.role];
      navigate(target, { replace: true });
    }
  }, [loading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setError('Completa correo y contrasena.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Ingresa un correo valido.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: signInError } = await signIn(normalizedEmail, password);
      if (signInError) {
        setError(signInError.message || 'Credenciales incorrectas.');
      }
    } catch {
      setError('No se pudo iniciar sesion. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen bg-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-blue-200">SchoolHub</p>
          <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight">Gestion escolar moderna para equipos academicos.</h1>
          <p className="mt-4 max-w-md text-sm text-blue-100/90">Centraliza cursos, materias, profesores y estudiantes con un flujo administrativo profesional.</p>
        </div>
        <p className="text-xs text-blue-100/80">Plataforma administrativa · Seguridad Supabase · Dashboard responsive</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Iniciar sesion</h2>
          <p className="mt-1 text-sm text-text-secondary">Ingresa con tu cuenta institucional.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-text-primary">Correo</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="usuario@escuela.com" required />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-text-primary">Contrasena</label>
              <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="********" required />
            </div>

            {error && <p className="text-sm text-error">{error}</p>}
            {!error && authError && <p className="text-sm text-amber-700">{authError}</p>}

            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
              {submitting ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
