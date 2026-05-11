import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        setError('Enlace invalido o expirado. Solicita una nueva invitacion.');
      }
      setLoading(false);
    };
    void checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('Completa ambos campos.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message || 'No se pudo guardar la contraseña.');
      return;
    }

    setMessage('Contraseña creada correctamente. Redirigiendo...');
    window.setTimeout(() => navigate('/', { replace: true }), 800);
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
        <h1 className="text-2xl font-bold text-text-primary">Crea tu contraseña</h1>
        <p className="text-text-secondary text-sm mt-1">Define una contraseña para activar tu cuenta.</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium text-text-primary">Nueva contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-text-primary"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-text-primary"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
