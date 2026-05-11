import { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Home,
  Layers3,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../hooks/useAuth';

type Grade = {
  evaluation: string;
  score: number;
  date: string;
  weight: number;
};

type SubjectCard = {
  id: string;
  name: string;
  code: string;
  professor?: string;
  color: string;
  grades: Grade[];
};

const subjects: SubjectCard[] = [
  {
    id: 'math',
    name: 'Matematicas Aplicadas',
    code: 'MAT-204',
    professor: 'Laura Martinez',
    color: 'blue',
    grades: [
      { evaluation: 'Parcial 1', score: 88, date: '2026-02-14', weight: 25 },
      { evaluation: 'Tarea de funciones', score: 94, date: '2026-03-01', weight: 15 },
      { evaluation: 'Proyecto estadistico', score: 91, date: '2026-03-22', weight: 30 },
      { evaluation: 'Parcial 2', score: 86, date: '2026-04-18', weight: 30 },
    ],
  },
  {
    id: 'history',
    name: 'Historia Dominicana',
    code: 'HIS-118',
    professor: 'Miguel Santana',
    color: 'amber',
    grades: [
      { evaluation: 'Ensayo documental', score: 82, date: '2026-02-20', weight: 20 },
      { evaluation: 'Exposicion grupal', score: 90, date: '2026-03-12', weight: 25 },
      { evaluation: 'Parcial 1', score: 78, date: '2026-04-05', weight: 25 },
      { evaluation: 'Proyecto final', score: 87, date: '2026-04-27', weight: 30 },
    ],
  },
  {
    id: 'science',
    name: 'Ciencias Naturales',
    code: 'CNA-132',
    professor: 'Andrea Perez',
    color: 'emerald',
    grades: [
      { evaluation: 'Laboratorio 1', score: 96, date: '2026-02-18', weight: 20 },
      { evaluation: 'Quiz de celulas', score: 89, date: '2026-03-09', weight: 15 },
      { evaluation: 'Parcial 1', score: 92, date: '2026-03-30', weight: 30 },
      { evaluation: 'Informe de ecosistemas', score: 95, date: '2026-04-22', weight: 35 },
    ],
  },
  {
    id: 'literature',
    name: 'Lengua Espanola',
    code: 'ESP-110',
    professor: 'Carolina Ruiz',
    color: 'rose',
    grades: [
      { evaluation: 'Analisis literario', score: 84, date: '2026-02-25', weight: 20 },
      { evaluation: 'Dictado evaluativo', score: 79, date: '2026-03-14', weight: 15 },
      { evaluation: 'Parcial 1', score: 81, date: '2026-04-02', weight: 30 },
      { evaluation: 'Proyecto de lectura', score: 88, date: '2026-04-25', weight: 35 },
    ],
  },
];

const navItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'subjects', label: 'Materias', icon: Layers3 },
  { id: 'grades', label: 'Notas', icon: BarChart3 },
] as const;

const colorClasses = {
  blue: {
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
    solid: 'bg-blue-600',
    ring: 'hover:border-blue-200 hover:bg-blue-50/60',
  },
  amber: {
    soft: 'bg-amber-50 text-amber-700 border-amber-100',
    solid: 'bg-amber-500',
    ring: 'hover:border-amber-200 hover:bg-amber-50/60',
  },
  emerald: {
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    solid: 'bg-emerald-600',
    ring: 'hover:border-emerald-200 hover:bg-emerald-50/60',
  },
  rose: {
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
    solid: 'bg-rose-600',
    ring: 'hover:border-rose-200 hover:bg-rose-50/60',
  },
};

function getAverage(grades: Grade[]) {
  const totalWeight = grades.reduce((total, grade) => total + grade.weight, 0);
  const weightedTotal = grades.reduce((total, grade) => total + grade.score * grade.weight, 0);

  return Math.round(weightedTotal / totalWeight);
}

function getPerformance(score: number) {
  if (score >= 90) {
    return {
      label: 'Excelente',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      bar: 'bg-emerald-500',
    };
  }

  if (score >= 80) {
    return {
      label: 'Bueno',
      pill: 'bg-blue-50 text-blue-700 border-blue-100',
      bar: 'bg-blue-500',
    };
  }

  if (score >= 70) {
    return {
      label: 'En progreso',
      pill: 'bg-amber-50 text-amber-700 border-amber-100',
      bar: 'bg-amber-500',
    };
  }

  return {
    label: 'Reforzar',
    pill: 'bg-red-50 text-red-700 border-red-100',
    bar: 'bg-red-500',
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<(typeof navItems)[number]['id']>('home');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0].id);

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0];
  const selectedAverage = getAverage(selectedSubject.grades);
  const selectedPerformance = getPerformance(selectedAverage);

  const overallAverage = useMemo(() => {
    const total = subjects.reduce((sum, subject) => sum + getAverage(subject.grades), 0);
    return Math.round(total / subjects.length);
  }, []);

  const topSubject = useMemo(
    () => subjects.reduce((best, subject) => (getAverage(subject.grades) > getAverage(best.grades) ? subject : best)),
    [],
  );

  const openSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setActiveView('grades');
  };

  return (
    <MainLayout>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col justify-between gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    <GraduationCap className="h-4 w-4" />
                    Panel del estudiante
                  </div>
                  <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Hola, {user?.profile?.name ?? 'estudiante'}.
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                    Tu progreso academico esta organizado por materias, evaluaciones y promedio final.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <p className="mt-4 text-2xl font-bold text-slate-950">{subjects.length}</p>
                    <p className="text-sm font-medium text-slate-500">Materias</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-2xl font-bold text-slate-950">{overallAverage}</p>
                    <p className="text-sm font-medium text-slate-500">Promedio general</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Award className="h-5 w-5 text-amber-600" />
                    <p className="mt-4 truncate text-lg font-bold text-slate-950">{topSubject.code}</p>
                    <p className="text-sm font-medium text-slate-500">Mejor materia</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Resumen actual</p>
                    <p className="mt-1 text-4xl font-bold">{overallAverage}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Sparkles className="h-6 w-6 text-sky-300" />
                  </div>
                </div>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${overallAverage}%` }} />
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <span className="text-sm font-medium text-slate-100">
                    {subjects.filter((subject) => getAverage(subject.grades) >= 80).length} materias sobre 80 puntos.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {activeView !== 'grades' && (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Materias</h2>
                  <p className="text-sm text-slate-500">Selecciona una materia para consultar sus notas.</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  <Search className="h-4 w-4" />
                  Periodo 2026
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {subjects.map((subject) => {
                  const average = getAverage(subject.grades);
                  const performance = getPerformance(average);
                  const palette = colorClasses[subject.color as keyof typeof colorClasses];

                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => openSubject(subject.id)}
                      className={`group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${palette.ring}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className={`rounded-2xl border p-3 ${palette.soft}`}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-500" />
                      </div>
                      <h3 className="mt-5 min-h-14 text-lg font-bold leading-tight text-slate-950">{subject.name}</h3>
                      <div className="mt-4 space-y-2 text-sm text-slate-500">
                        <p className="flex items-center gap-2">
                          <Layers3 className="h-4 w-4" />
                          {subject.code}
                        </p>
                        {subject.professor && (
                          <p className="flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            {subject.professor}
                          </p>
                        )}
                      </div>
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-600">Promedio</span>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${performance.pill}`}>
                            {average}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${palette.solid}`} style={{ width: `${average}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {activeView !== 'subjects' && (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{selectedSubject.code}</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">{selectedSubject.name}</h2>
                    {selectedSubject.professor && (
                      <p className="mt-1 text-sm text-slate-500">Profesor: {selectedSubject.professor}</p>
                    )}
                  </div>
                  <div className={`w-fit rounded-full border px-3 py-1.5 text-sm font-bold ${selectedPerformance.pill}`}>
                    Promedio final: {selectedAverage}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-bold">Evaluacion</th>
                        <th className="px-5 py-4 font-bold">Calificacion</th>
                        <th className="px-5 py-4 font-bold">Fecha</th>
                        <th className="px-5 py-4 font-bold">Peso</th>
                        <th className="px-5 py-4 font-bold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSubject.grades.map((grade) => {
                        const performance = getPerformance(grade.score);

                        return (
                          <tr key={`${selectedSubject.id}-${grade.evaluation}`} className="transition-colors hover:bg-slate-50">
                            <td className="px-5 py-4 font-semibold text-slate-900">{grade.evaluation}</td>
                            <td className="px-5 py-4">
                              <span className="text-lg font-bold text-slate-950">{grade.score}</span>
                              <span className="text-slate-400">/100</span>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                {formatDate(grade.date)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-slate-600">{grade.weight}%</td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${performance.pill}`}>
                                {performance.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Materia seleccionada</p>
                  <div className="mt-4 space-y-2">
                    {subjects.map((subject) => {
                      const isSelected = subject.id === selectedSubject.id;
                      const average = getAverage(subject.grades);

                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => setSelectedSubjectId(subject.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                            isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">{subject.name}</span>
                            <span className={`block text-xs ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                              {subject.code}
                            </span>
                          </span>
                          <span className="text-sm font-bold">{average}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Rendimiento</p>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-5xl font-bold tracking-tight text-slate-950">{selectedAverage}</span>
                    <span className="pb-2 text-sm font-semibold text-slate-400">/100</span>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${selectedPerformance.bar}`} style={{ width: `${selectedAverage}%` }} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    {selectedPerformance.label} en {selectedSubject.name}. Mantente atento a las evaluaciones con mayor peso.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
