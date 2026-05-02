import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS, ROLE_COLORS } from '../utils/constants';
import type { RoleName } from '../types';

const ROLE_ICONS: Record<RoleName, string> = {
  director: '👑',
  coordinator: '🧑‍💼',
  teacher: '👨‍🏫',
  student: '👨‍🎓',
};

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const role = user?.role as RoleName;
  const colorClass = role ? ROLE_COLORS[role] : 'bg-primary';
  const roleLabel = role ? ROLE_LABELS[role] : '';
  const roleIcon = role ? ROLE_ICONS[role] : '';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-dark rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5">
                <path d="M20 4L35 12V28L20 36L5 28V12L20 4Z" fill="#2563EB" stroke="#1E40AF" strokeWidth="2"/>
                <circle cx="20" cy="16" r="4" fill="white"/>
                <path d="M12 27 Q20 22 28 27" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-text-primary">
              School<span className="text-primary">Hub</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:flex items-center gap-1.5 ${colorClass} text-white text-xs font-semibold px-3 py-1.5 rounded-full`}>
              <span>{roleIcon}</span>
              <span>{roleLabel}</span>
            </span>

            {user?.profile && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-text-primary leading-tight">
                  {user.profile.name} {user.profile.last_name}
                </span>
                <span className="text-xs text-text-secondary">{user.email}</span>
              </div>
            )}

            <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {user?.profile?.name?.[0]?.toUpperCase() ?? '?'}
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-text-secondary hover:text-error transition-colors px-2 py-2 rounded-lg hover:bg-red-50"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
