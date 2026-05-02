import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../hooks/useAuth';

export default function CoordinatorDashboard() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-4xl shadow-inner">
          🧑‍💼
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary">Pantalla del Coordinador</h1>
          <p className="text-text-secondary mt-2 text-lg">
            Bienvenido,{' '}
            <span className="font-semibold text-text-primary">
              {user?.profile?.name} {user?.profile?.last_name}
            </span>
          </p>
          <p className="text-text-secondary mt-1 text-sm">
            Gestiona cursos, materias, profesores y estudiantes.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-8 py-4 text-center">
          <p className="text-blue-700 font-medium text-sm">🚧 Módulos del coordinador en construcción</p>
        </div>
      </div>
    </MainLayout>
  );
}
