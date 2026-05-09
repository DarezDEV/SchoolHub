import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { DashboardCard, EmptyState, PageHeader } from '../../components/ui';

type SectionKey = 'dashboard' | 'estudiantes' | 'profesores' | 'cursos' | 'materias' | 'usuarios' | 'reportes' | 'configuracion';

export default function DirectorDashboard() {
  const [searchParams] = useSearchParams();
  const section = (searchParams.get('section') as SectionKey) || 'dashboard';

  const metrics = useMemo(() => [
    { label: 'Asistencia promedio', value: '93%' },
    { label: 'Rendimiento academico', value: '88%' },
    { label: 'Cursos activos', value: 24 },
    { label: 'Docentes activos', value: 57 },
  ], []);

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
                <h3 className="font-semibold text-text-primary">Acciones sugeridas</h3>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li>Revisar reporte de asistencia por curso.</li>
                  <li>Validar asignaciones docentes del proximo periodo.</li>
                  <li>Auditar estado de materias troncales.</li>
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
