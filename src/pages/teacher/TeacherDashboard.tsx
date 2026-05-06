import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { CAPABILITY_LABELS, ROLE_CAPABILITIES, ROLE_DESCRIPTIONS } from '../../utils/constants';

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-emerald-100 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
              👨‍🏫
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Panel del Profesor</h1>
              <p className="text-text-secondary mt-2 text-lg">
                Bienvenido,{' '}
                <span className="font-semibold text-text-primary">
                  {user?.profile?.name} {user?.profile?.last_name}
                </span>
              </p>
              <p className="text-text-secondary mt-2">
                {ROLE_DESCRIPTIONS.teacher}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Funciones definidas para este rol</h2>
          <div className="mt-4 grid gap-3">
            {ROLE_CAPABILITIES.teacher.map((capability) => (
              <div key={capability} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900">
                {CAPABILITY_LABELS[capability]}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4">
          <p className="text-emerald-800 font-medium">
            Restriccion clave: el profesor solo puede registrar o editar notas en los cursos que le pertenecen a el mismo.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
