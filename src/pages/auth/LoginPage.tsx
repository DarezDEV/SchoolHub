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
      console.log('[auth] redirecting by role', user.role, target);
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
      console.log('[auth] sending login request', { email: normalizedEmail });
      const { error: signInError } = await signIn(normalizedEmail, password);
      if (signInError) {
        console.error('[auth] signIn error', signInError);
        setError(signInError.message || 'Credenciales incorrectas.');
      }
    } catch (err) {
      console.error('[auth] unexpected signIn error', err);
      setError('No se pudo iniciar sesion. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-text-primary">Iniciar sesion</h1>
        <p className="text-text-secondary text-sm mt-1">Ingresa tus credenciales para continuar.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-text-primary">Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-text-primary"
              placeholder="usuario@escuela.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-text-primary">Contrasena</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-text-primary"
              placeholder="********"
              required
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
          {!error && authError && <p className="text-sm text-amber-700">{authError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl disabled:opacity-60"
          >
            {submitting ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>
      </div>
    </div>
  );
}
