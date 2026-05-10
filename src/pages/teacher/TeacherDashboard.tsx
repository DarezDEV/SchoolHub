import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Edit3, Search } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import { Button, Input } from '../../components/common';
import { DashboardCard, DataTable, EmptyState, LoadingSkeleton, Modal, PageHeader } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { teacherService } from '../../services/supabase';
import type { NotaPayload } from '../../services/supabase';
import type { Profesor, TeacherAssignmentView, TeacherGradeView, TeacherStudentView } from '../../types';

type SectionKey = 'dashboard' | 'mis-cursos' | 'estudiantes' | 'publicar-notas' | 'gestionar-notas' | 'perfil';

const PERIODOS = ['P1', 'P2', 'P3', 'P4'];

function formatError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = (searchParams.get('section') as SectionKey) || 'dashboard';

  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignmentView[]>([]);
  const [students, setStudents] = useState<TeacherStudentView[]>([]);
  const [grades, setGrades] = useState<TeacherGradeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [gradeSearch, setGradeSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [editingGrade, setEditingGrade] = useState<TeacherGradeView | null>(null);
  const [editForm, setEditForm] = useState({ nota: '', observacion: '' });
  const [gradeForm, setGradeForm] = useState<NotaPayload>({
    course_id: '',
    subject_id: '',
    estudiante_id: '',
    periodo: PERIODOS[0],
    nota: 0,
    observacion: '',
  });

  async function loadWorkspace() {
    setLoading(true);
    try {
      const data = await teacherService.getWorkspace(user?.email, user?.id);
      setProfesor(data.profesor);
      setAssignments(data.assignments);
      setStudents(data.students);
      setGrades(data.grades);
      setError(null);
      if (!gradeForm.course_id && data.assignments[0]) {
        const first = data.assignments[0];
        setGradeForm((current) => ({ ...current, course_id: first.curso_id, subject_id: first.materia_id }));
      }
    } catch (err) {
      setError(formatError(err, 'No se pudo cargar la informacion del profesor.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [user?.email, user?.id]);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.curso_id === gradeForm.course_id && assignment.materia_id === gradeForm.subject_id),
    [assignments, gradeForm.course_id, gradeForm.subject_id],
  );

  const studentsForForm = useMemo(
    () => students.filter((student) => student.curso.id === gradeForm.course_id && student.materia.id === gradeForm.subject_id),
    [students, gradeForm.course_id, gradeForm.subject_id],
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase();
    return students.filter((student) => `${student.nombre} ${student.email} ${student.matricula ?? ''} ${student.curso.nombre} ${student.materia.nombre}`.toLowerCase().includes(query));
  }, [students, studentSearch]);

  const filteredGrades = useMemo(() => {
    const query = gradeSearch.toLowerCase();
    return grades.filter((grade) => {
      const matchesSearch = `${grade.estudiante.nombre} ${grade.estudiante.email} ${grade.estudiante.matricula ?? ''}`.toLowerCase().includes(query);
      const matchesCourse = !courseFilter || grade.course_id === courseFilter;
      const matchesSubject = !subjectFilter || grade.subject_id === subjectFilter;
      return matchesSearch && matchesCourse && matchesSubject;
    });
  }, [grades, gradeSearch, courseFilter, subjectFilter]);

  const uniqueStudents = new Set(students.map((student) => student.id)).size;
  const uniqueCourses = new Set(assignments.map((assignment) => assignment.curso_id)).size;
  const uniqueSubjects = new Set(assignments.map((assignment) => assignment.materia_id)).size;
  const latestGrades = grades.slice(0, 5);

  function go(sectionKey: SectionKey) {
    navigate(`/profesor/dashboard?section=${sectionKey}`);
  }

  function handleAssignmentChange(value: string) {
    const assignment = assignments.find((item) => item.id === value);
    if (!assignment) return;
    setGradeForm((current) => ({
      ...current,
      course_id: assignment.curso_id,
      subject_id: assignment.materia_id,
      estudiante_id: '',
    }));
  }

  async function publishGrade(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!gradeForm.course_id || !gradeForm.subject_id || !gradeForm.estudiante_id) throw new Error('Selecciona curso, materia y estudiante.');
      if (Number.isNaN(Number(gradeForm.nota)) || Number(gradeForm.nota) < 0 || Number(gradeForm.nota) > 100) throw new Error('La nota debe estar entre 0 y 100.');
      await teacherService.createNota(user?.email, user?.id, { ...gradeForm, nota: Number(gradeForm.nota) });
      setSuccess('Nota publicada correctamente.');
      setGradeForm((current) => ({ ...current, estudiante_id: '', nota: 0, observacion: '' }));
      await loadWorkspace();
    } catch (err) {
      setError(formatError(err, 'No se pudo publicar la nota.'));
    } finally {
      setSaving(false);
    }
  }

  function openEditGrade(grade: TeacherGradeView) {
    setEditingGrade(grade);
    setEditForm({ nota: String(grade.nota), observacion: grade.observacion ?? '' });
  }

  async function saveGradeEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGrade) return;
    setSaving(true);
    try {
      const nota = Number(editForm.nota);
      if (Number.isNaN(nota) || nota < 0 || nota > 100) throw new Error('La nota debe estar entre 0 y 100.');
      await teacherService.updateNota(editingGrade.id, nota, editForm.observacion);
      setEditingGrade(null);
      setSuccess('Nota actualizada.');
      await loadWorkspace();
    } catch (err) {
      setError(formatError(err, 'No se pudo actualizar la nota.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          title="Panel del Profesor"
          description="Cursos, estudiantes y notas limitados a tus asignaciones."
          actions={<Button type="button" variant="secondary" onClick={() => void loadWorkspace()}>Actualizar</Button>}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        {loading ? (
          <LoadingSkeleton />
        ) : !profesor ? (
          <EmptyState title="Perfil de profesor no encontrado" description="Tu usuario debe tener un registro en profesores con el mismo correo de inicio de sesion." />
        ) : (
          <>
            {section === 'dashboard' && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DashboardCard label="Cursos asignados" value={uniqueCourses} />
                  <DashboardCard label="Estudiantes" value={uniqueStudents} />
                  <DashboardCard label="Materias asignadas" value={uniqueSubjects} />
                  <DashboardCard label="Notas publicadas" value={grades.length} />
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold">Mis asignaciones</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {assignments.slice(0, 4).map((assignment) => (
                        <button key={assignment.id} type="button" onClick={() => go('mis-cursos')} className="rounded-xl border border-slate-200 p-4 text-left hover:border-primary/40 hover:bg-blue-50">
                          <p className="font-semibold">{assignment.curso.nombre}</p>
                          <p className="text-sm text-text-secondary">{assignment.materia.nombre}</p>
                          <p className="mt-2 text-xs text-text-secondary">{assignment.student_count} estudiantes</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold">Ultimas notas publicadas</h3>
                    <div className="mt-4 space-y-3">
                      {latestGrades.length === 0 ? <p className="text-sm text-text-secondary">Aun no hay notas registradas.</p> : latestGrades.map((grade) => (
                        <div key={grade.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{grade.estudiante.nombre}</p>
                            <p className="text-xs text-text-secondary">{grade.materia.nombre} - {grade.periodo}</p>
                          </div>
                          <span className="rounded-lg bg-white px-2 py-1 text-sm font-semibold">{grade.nota}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === 'mis-cursos' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {assignments.map((assignment) => (
                  <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Curso asignado</p>
                    <h3 className="mt-2 text-xl font-semibold">{assignment.curso.nombre}</h3>
                    <p className="text-sm text-text-secondary">{assignment.curso.nivel || 'Sin nivel registrado'}</p>
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="font-medium">{assignment.materia.nombre}</p>
                      <p className="text-text-secondary">{assignment.student_count} estudiantes</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => go('estudiantes')}>Ver estudiantes</Button>
                      <Button type="button" size="sm" onClick={() => go('gestionar-notas')}>Gestionar notas</Button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {section === 'estudiantes' && (
              <div className="space-y-4">
                <Input placeholder="Buscar por nombre, matricula, curso o materia" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                {filteredStudents.length === 0 ? <EmptyState title="Sin estudiantes" description="No hay estudiantes en tus cursos asignados." /> : (
                  <DataTable headers={['Foto', 'Nombre', 'Matricula', 'Curso', 'Materia']}>
                    {filteredStudents.map((student) => (
                      <tr key={`${student.id}-${student.materia.id}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-primary">
                            {student.foto_url ? <img src={student.foto_url} alt={student.nombre} className="h-full w-full object-cover" /> : initials(student.nombre)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{student.nombre}</td>
                        <td className="px-4 py-3 text-sm">{student.matricula ?? student.email}</td>
                        <td className="px-4 py-3 text-sm">{student.curso.nombre}</td>
                        <td className="px-4 py-3 text-sm">{student.materia.nombre}</td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </div>
            )}

            {section === 'publicar-notas' && (
              <form className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={publishGrade}>
                <div>
                  <label className="mb-2 block text-sm font-medium">Curso y materia</label>
                  <select className="w-full rounded-xl border border-gray-300 px-3 py-2" value={selectedAssignment?.id ?? ''} onChange={(e) => handleAssignmentChange(e.target.value)} required>
                    <option value="">Selecciona una asignacion</option>
                    {assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.curso.nombre} - {assignment.materia.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Estudiante</label>
                  <select className="w-full rounded-xl border border-gray-300 px-3 py-2" value={gradeForm.estudiante_id} onChange={(e) => setGradeForm((current) => ({ ...current, estudiante_id: e.target.value }))} required>
                    <option value="">Selecciona un estudiante</option>
                    {studentsForForm.map((student) => <option key={student.id} value={student.id}>{student.nombre} - {student.matricula ?? student.email}</option>)}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Periodo</label>
                    <select className="w-full rounded-xl border border-gray-300 px-3 py-2" value={gradeForm.periodo} onChange={(e) => setGradeForm((current) => ({ ...current, periodo: e.target.value }))}>
                      {PERIODOS.map((periodo) => <option key={periodo} value={periodo}>{periodo}</option>)}
                    </select>
                  </div>
                  <Input label="Nota" type="number" min={0} max={100} value={gradeForm.nota} onChange={(e) => setGradeForm((current) => ({ ...current, nota: Number(e.target.value) }))} required />
                </div>
                <Input label="Observacion" value={gradeForm.observacion} onChange={(e) => setGradeForm((current) => ({ ...current, observacion: e.target.value }))} />
                <div className="flex justify-end"><Button type="submit" isLoading={saving}>Publicar nota</Button></div>
              </form>
            )}

            {section === 'gestionar-notas' && (
              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
                    <Input className="pl-9" placeholder="Buscar estudiante" value={gradeSearch} onChange={(e) => setGradeSearch(e.target.value)} />
                  </div>
                  <select className="rounded-xl border border-gray-300 px-3 py-2" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                    <option value="">Todos los cursos</option>
                    {Array.from(new Map(assignments.map((item) => [item.curso_id, item.curso])).values()).map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}
                  </select>
                  <select className="rounded-xl border border-gray-300 px-3 py-2" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option value="">Todas las materias</option>
                    {Array.from(new Map(assignments.map((item) => [item.materia_id, item.materia])).values()).map((materia) => <option key={materia.id} value={materia.id}>{materia.nombre}</option>)}
                  </select>
                </div>
                {filteredGrades.length === 0 ? <EmptyState title="Sin notas" description="Publica la primera nota desde el modulo Publicar Notas." /> : (
                  <DataTable headers={['Estudiante', 'Curso', 'Materia', 'Periodo', 'Nota', 'Observacion', 'Acciones']}>
                    {filteredGrades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium">{grade.estudiante.nombre}</td>
                        <td className="px-4 py-3 text-sm">{grade.curso.nombre}</td>
                        <td className="px-4 py-3 text-sm">{grade.materia.nombre}</td>
                        <td className="px-4 py-3 text-sm">{grade.periodo}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{grade.nota}</td>
                        <td className="px-4 py-3 text-sm">{grade.observacion || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <Button type="button" size="sm" variant="secondary" onClick={() => openEditGrade(grade)}><Edit3 size={14} className="mr-1 inline" />Editar</Button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </div>
            )}

            {section === 'perfil' && (
              <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Perfil</h3>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div><dt className="text-text-secondary">Nombre</dt><dd className="font-medium">{profesor.nombre}</dd></div>
                  <div><dt className="text-text-secondary">Correo</dt><dd className="font-medium">{profesor.email}</dd></div>
                  <div><dt className="text-text-secondary">Asignaciones</dt><dd className="font-medium">{assignments.length}</dd></div>
                </dl>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={!!editingGrade} title="Editar nota" onClose={() => setEditingGrade(null)}>
        <form className="space-y-3" onSubmit={saveGradeEdit}>
          <Input label="Nota" type="number" min={0} max={100} value={editForm.nota} onChange={(e) => setEditForm((current) => ({ ...current, nota: e.target.value }))} required />
          <Input label="Observacion" value={editForm.observacion} onChange={(e) => setEditForm((current) => ({ ...current, observacion: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditingGrade(null)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
