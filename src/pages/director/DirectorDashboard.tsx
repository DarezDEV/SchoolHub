import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { schoolService } from '../../services/supabase';
import type { UserListItem } from '../../types';
import { DashboardCard, EmptyState, PageHeader } from '../../components/ui';

type SectionKey = 'dashboard' | 'estudiantes' | 'profesores' | 'cursos' | 'materias' | 'usuarios' | 'reportes' | 'configuracion';

export default function DirectorDashboard() {
  const [searchParams] = useSearchParams();
  const section = (searchParams.get('section') as SectionKey) || 'dashboard';

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await schoolService.listUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalTeachers = users.filter(u => u.role === 'teacher').length;
    const totalCoordinators = users.filter(u => u.role === 'coordinator').length;
    const activeUsers = users.filter(u => u.active).length;

    return [
      { label: 'Estudiantes activos', value: totalStudents },
      { label: 'Docentes activos', value: totalTeachers },
      { label: 'Coordinadores', value: totalCoordinators },
      { label: 'Usuarios totales', value: activeUsers },
    ];
  }, [users]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader title="Panel del Director" description="Vista ejecutiva con indicadores, estado institucional y reportes." />

        {section === 'dashboard' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <DashboardCard key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="font-semibold text-text-primary">Resumen semanal</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  La institucion mantiene estabilidad operativa. No se detectan alertas criticas en gestion academica.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-text-primary">Sección de supervisión</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Este bloque muestra solo información para el director. Su rol es supervisar, no editar ni modificar procesos.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li className="rounded-xl bg-slate-50 p-3">Revisa métricas clave y tendencias institucionales.</li>
                  <li className="rounded-xl bg-slate-50 p-3">Supervisa reportes de asistencia, rendimiento y estado de cursos.</li>
                  <li className="rounded-xl bg-slate-50 p-3">Verifica alertas y recomendaciones antes de delegar acciones.</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {section !== 'dashboard' && (
          <EmptyState
            title="Vista de consulta"
            description="Como director, este modulo esta disponible en modo analitico. Puedes usar estas secciones para seguimiento y supervisión sin edición directa."
          />
        )}
      </div>
    </MainLayout>
  );
}
