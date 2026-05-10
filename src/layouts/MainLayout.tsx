import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '../utils/constants';
import type { RoleName } from '../types';
import { BarChart3, BookOpen, ClipboardEdit, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, Shield, User, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../lib/cn';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
}

const adminMenuItems: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: 'dashboard' },
  { key: 'estudiantes', label: 'Estudiantes', icon: GraduationCap, href: 'estudiantes' },
  { key: 'profesores', label: 'Profesores', icon: Users, href: 'profesores' },
  { key: 'cursos', label: 'Cursos', icon: BookOpen, href: 'cursos' },
  { key: 'materias', label: 'Materias', icon: Shield, href: 'materias' },
  { key: 'usuarios', label: 'Usuarios', icon: Users, href: 'usuarios' },
  { key: 'reportes', label: 'Reportes', icon: BarChart3, href: 'reportes' },
  { key: 'configuracion', label: 'Configuracion', icon: Settings, href: 'configuracion' },
];

const teacherMenuItems: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: 'dashboard' },
  { key: 'mis-cursos', label: 'Mis Cursos', icon: BookOpen, href: 'mis-cursos' },
  { key: 'estudiantes', label: 'Estudiantes', icon: GraduationCap, href: 'estudiantes' },
  { key: 'publicar-notas', label: 'Publicar Notas', icon: ClipboardEdit, href: 'publicar-notas' },
  { key: 'gestionar-notas', label: 'Gestionar Notas', icon: BarChart3, href: 'gestionar-notas' },
  { key: 'perfil', label: 'Perfil', icon: User, href: 'perfil' },
];

function roleBasePath(role: RoleName | null | undefined) {
  if (role === 'director') return '/director/dashboard';
  if (role === 'coordinator') return '/coordinador/dashboard';
  if (role === 'teacher') return '/profesor/dashboard';
  return '/estudiante/dashboard';
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role as RoleName;
  const roleLabel = role ? ROLE_LABELS[role] : '';
  const showSidebar = role === 'coordinator' || role === 'director' || role === 'teacher';
  const menuItems = role === 'teacher' ? teacherMenuItems : adminMenuItems;

  const activeSection = useMemo(() => {
    const search = new URLSearchParams(location.search);
    return search.get('section') ?? 'dashboard';
  }, [location.search]);

  const basePath = roleBasePath(role);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navigateToSection = (section: string) => {
    navigate(`${basePath}?section=${section}`);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-text-primary">
      <div className="flex">
        {showSidebar && (
          <>
            <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
              <div className="flex h-16 items-center border-b border-slate-200 px-6">
                <p className="text-lg font-semibold tracking-tight">SchoolHub</p>
              </div>
              <nav className="space-y-1 p-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => navigateToSection(item.href)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                        isActive ? 'bg-blue-50 text-primary' : 'text-text-secondary hover:bg-slate-100 hover:text-text-primary',
                      )}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-slate-200 p-4">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-slate-100 hover:text-text-primary"
                >
                  <LogOut size={17} />
                  <span>Cerrar sesion</span>
                </button>
              </div>
            </aside>

            {sidebarOpen && (
              <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setSidebarOpen(false)}>
                <aside className="h-full w-72 border-r border-slate-200 bg-white p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-lg font-semibold">SchoolHub</p>
                    <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                      <X size={18} />
                    </button>
                  </div>
                  <nav className="space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.href;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => navigateToSection(item.href)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                            isActive ? 'bg-blue-50 text-primary' : 'text-text-secondary hover:bg-slate-100 hover:text-text-primary',
                          )}
                        >
                          <Icon size={17} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-slate-100 hover:text-text-primary"
                    >
                      <LogOut size={17} />
                      <span>Cerrar sesion</span>
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                {showSidebar && (
                  <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
                    <Menu size={18} />
                  </button>
                )}
                <div>
                  <p className="text-sm text-text-secondary">{roleLabel}</p>
                  <p className="text-sm font-semibold text-text-primary">{user?.profile?.name} {user?.profile?.last_name}</p>
                </div>
              </div>
              <button onClick={handleSignOut} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-slate-100 hover:text-text-primary">
                Cerrar sesion
              </button>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
