import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, LayoutGrid, UserSquare2 } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import { Button, Input } from '../../components/common';
import { courseService, schoolService, subjectService } from '../../services/supabase';
import type { Course, Subject, Curso, EstudianteListItem, Materia, ProfesorListItem } from '../../types';
import { ConfirmDialog, DashboardCard, DataTable, EmptyState, LoadingSkeleton, Modal, PageHeader } from '../../components/ui';

type SectionKey = 'dashboard' | 'cursos' | 'materias' | 'estudiantes' | 'profesores' | 'usuarios' | 'reportes' | 'configuracion';

const PAGE_SIZE = 8;

function formatError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = (searchParams.get('section') as SectionKey) || 'dashboard';

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteListItem[]>([]);
  const [profesores, setProfesores] = useState<ProfesorListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [courseModal, setCourseModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [studentModal, setStudentModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState(false);
  const [courseAssignmentModal, setCourseAssignmentModal] = useState(false);

  const [courseSearch, setCourseSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetailTab, setCourseDetailTab] = useState<'materias' | 'estudiantes'>('materias');

  const [coursePage] = useState(1);
  const [subjectPage] = useState(1);
  const [studentPage] = useState(1);
  const [teacherPage] = useState(1);

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingStudent, setEditingStudent] = useState<EstudianteListItem | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<ProfesorListItem | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{ type: 'course' | 'subject' | 'student' | 'teacher'; id: string; label: string } | null>(null);

  const [courseForm, setCourseForm] = useState({ name: '', code: '', academic_year: '', section: '', description: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '' });
  const [studentForm, setStudentForm] = useState({ nombre: '', email: '', curso_id: '' });
  const [teacherForm, setTeacherForm] = useState({ nombre: '', email: '', materia_id: '', curso_id: '' });
  const [courseAssignmentForm, setCourseAssignmentForm] = useState({ materia_id: '', profesor_id: '' });

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [courseData, subjectData, cursoData, materiaData, studentData, teacherData] = await Promise.all([
        courseService.list(),
        subjectService.list(),
        schoolService.listCursos(),
        schoolService.listMaterias(),
        schoolService.listEstudiantes(),
        schoolService.listProfesores(),
      ]);
      setCourses(courseData);
      setSubjects(subjectData);
      setCursos(cursoData);
      setMaterias(materiaData);
      setEstudiantes(studentData);
      setProfesores(teacherData);
      setError(null);
    } catch (e) {
      setError(formatError(e, 'No se pudo cargar la informacion.'));
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => courses.filter((i) => `${i.name} ${i.code}`.toLowerCase().includes(courseSearch.toLowerCase())), [courses, courseSearch]);
  const filteredSubjects = useMemo(() => subjects.filter((i) => `${i.name}`.toLowerCase().includes(subjectSearch.toLowerCase())), [subjects, subjectSearch]);
  const filteredStudents = useMemo(() => estudiantes.filter((i) => `${i.nombre} ${i.email} ${i.cursos?.nombre ?? ''}`.toLowerCase().includes(studentSearch.toLowerCase())), [estudiantes, studentSearch]);
  const filteredTeachers = useMemo(() => profesores.filter((i) => `${i.nombre} ${i.email} ${i.profesor_materia_curso?.[0]?.materias?.nombre ?? ''}`.toLowerCase().includes(teacherSearch.toLowerCase())), [profesores, teacherSearch]);
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );
  const selectedCourseStudents = useMemo(
    () => estudiantes.filter((student) => student.curso_id === selectedCourse?.id),
    [estudiantes, selectedCourse],
  );
  const selectedCourseAssignments = useMemo(
    () =>
      profesores.flatMap((teacher) =>
        (teacher.profesor_materia_curso ?? [])
          .filter((assignment) => assignment.cursos?.id === selectedCourse?.id)
          .map((assignment) => ({
            id: assignment.id,
            materiaId: assignment.materias?.id ?? '',
            materia: assignment.materias?.nombre ?? 'Materia sin nombre',
            profesorId: teacher.id,
            profesor: teacher.nombre,
            profesorEmail: teacher.email,
          })),
      ),
    [profesores, selectedCourse],
  );
  const assignedMateriaIds = useMemo(
    () => new Set(selectedCourseAssignments.map((assignment) => assignment.materiaId).filter(Boolean)),
    [selectedCourseAssignments],
  );
  const availableMateriasForCourse = useMemo(
    () => materias.filter((materia) => !assignedMateriaIds.has(materia.id)),
    [materias, assignedMateriaIds],
  );
  const availableTeachersForSelectedMateria = useMemo(() => {
    if (!courseAssignmentForm.materia_id) return [];

    return profesores.filter((teacher) =>
      (teacher.profesor_materia_curso ?? []).some((assignment) => assignment.materias?.id === courseAssignmentForm.materia_id),
    );
  }, [profesores, courseAssignmentForm.materia_id]);
  const isCourseDetailView = section === 'cursos' && !!selectedCourse;

  useEffect(() => {
    if (section !== 'cursos') return;
    if (!courses.length) {
      setSelectedCourseId(null);
      return;
    }
    if (selectedCourseId && !courses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(null);
    }
  }, [section, courses, selectedCourseId]);

  useEffect(() => {
    setCourseDetailTab('materias');
  }, [selectedCourseId]);

  useEffect(() => {
    setCourseAssignmentForm((current) => {
      if (!current.profesor_id) return current;
      const teacherStillAvailable = availableTeachersForSelectedMateria.some((teacher) => teacher.id === current.profesor_id);
      if (teacherStillAvailable) return current;
      return { ...current, profesor_id: '' };
    });
  }, [availableTeachersForSelectedMateria]);

  function pageRows<T>(rows: T[], page: number) {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }

  function openCourseModal(item?: Course) {
    if (item) {
      setEditingCourse(item);
      setCourseForm({ name: item.name, code: item.code, academic_year: item.academic_year ?? '', section: item.section ?? '', description: item.description ?? '' });
    } else {
      setEditingCourse(null);
      setCourseForm({ name: '', code: '', academic_year: '', section: '', description: '' });
    }
    setCourseModal(true);
  }

  function openSubjectModal(item?: Subject) {
    if (item) {
      setEditingSubject(item);
      setSubjectForm({ name: item.name, description: item.description ?? '' });
    } else {
      setEditingSubject(null);
      setSubjectForm({ name: '', description: '' });
    }
    setSubjectModal(true);
  }

  function openStudentModal(item?: EstudianteListItem) {
    if (item) {
      setEditingStudent(item);
      setStudentForm({ nombre: item.nombre, email: item.email, curso_id: item.curso_id });
    } else {
      setEditingStudent(null);
      setStudentForm({ nombre: '', email: '', curso_id: '' });
    }
    setStudentModal(true);
  }

  async function openTeacherModal(item?: ProfesorListItem) {
    if (item) {
      const assignment = await schoolService.getProfesorAssignment(item.id);
      setEditingTeacher(item);
      setTeacherForm({ nombre: item.nombre, email: item.email, materia_id: assignment?.materia_id ?? '', curso_id: assignment?.curso_id ?? '' });
    } else {
      setEditingTeacher(null);
      setTeacherForm({ nombre: '', email: '', materia_id: '', curso_id: '' });
    }
    setTeacherModal(true);
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCourse) await courseService.update(editingCourse.id, { ...courseForm, code: courseForm.code.toUpperCase() });
      else await courseService.create({ ...courseForm, code: courseForm.code.toUpperCase() });
      setCourseModal(false);
      setSuccess(editingCourse ? 'Curso actualizado.' : 'Curso creado.');
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo guardar el curso.'));
    }
  }

  async function saveSubject(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingSubject) await subjectService.update(editingSubject.id, subjectForm);
      else await subjectService.create(subjectForm);
      setSubjectModal(false);
      setSuccess(editingSubject ? 'Materia actualizada.' : 'Materia creada.');
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo guardar la materia.'));
    }
  }

  async function saveStudent(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!studentForm.curso_id) throw new Error('Debe seleccionar un curso.');
      if (editingStudent) await schoolService.updateEstudiante(editingStudent.id, studentForm);
      else await schoolService.createEstudiante(studentForm);
      setStudentModal(false);
      setSuccess(editingStudent ? 'Estudiante actualizado.' : 'Estudiante creado.');
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo guardar el estudiante.'));
    }
  }

  async function saveTeacher(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!teacherForm.materia_id || !teacherForm.curso_id) throw new Error('Seleccione materia y curso.');
      if (editingTeacher) await schoolService.updateProfesor(editingTeacher.id, teacherForm);
      else await schoolService.createProfesor(teacherForm);
      setTeacherModal(false);
      setSuccess(editingTeacher ? 'Profesor actualizado.' : 'Profesor creado.');
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo guardar el profesor.'));
    }
  }

  function openCourseAssignmentModal() {
    setCourseAssignmentForm({ materia_id: '', profesor_id: '' });
    setCourseAssignmentModal(true);
  }

  async function saveCourseAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse?.id) return;

    try {
      await schoolService.assignMateriaToCurso({
        curso_id: selectedCourse.id,
        materia_id: courseAssignmentForm.materia_id,
        profesor_id: courseAssignmentForm.profesor_id,
      });
      setCourseAssignmentModal(false);
      setSuccess('Materia asignada al curso correctamente.');
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo asignar la materia al curso.'));
    }
  }

  async function removeCourseAssignment(assignmentId: string) {
    try {
      await schoolService.removeMateriaFromCurso(assignmentId);
      setSuccess('Asignacion eliminada correctamente.');
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo eliminar la asignacion.'));
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.type === 'course') await courseService.remove(pendingDelete.id);
      if (pendingDelete.type === 'subject') await subjectService.remove(pendingDelete.id);
      if (pendingDelete.type === 'student') await schoolService.deleteEstudiante(pendingDelete.id);
      if (pendingDelete.type === 'teacher') await schoolService.deleteProfesor(pendingDelete.id);
      setPendingDelete(null);
      setSuccess('Registro eliminado correctamente.');
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo eliminar el registro.'));
    }
  }

  const dashboardStats = [
    { label: 'Cursos', value: courses.length },
    { label: 'Materias', value: subjects.length },
    { label: 'Estudiantes', value: estudiantes.length },
    { label: 'Profesores', value: profesores.length },
  ];

  const unsupported = ['usuarios', 'reportes', 'configuracion'] as SectionKey[];

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          title="Panel del Coordinador"
          description="Gestion academica con flujos limpios: tablas, busqueda y formularios en modal."
          actions={<Button type="button" variant="secondary" onClick={() => void loadAll()}>Actualizar</Button>}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {section === 'dashboard' && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {dashboardStats.map((item) => <DashboardCard key={item.label} label={item.label} value={item.value} />)}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold">Actividad reciente</h3>
                    <p className="mt-2 text-sm text-text-secondary">Ultima actualizacion de datos completada.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold">Acciones rapidas</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" onClick={() => navigate('/coordinador/dashboard?section=estudiantes')}>Nuevo estudiante</Button>
                      <Button type="button" variant="secondary" onClick={() => navigate('/coordinador/dashboard?section=profesores')}>Nuevo profesor</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === 'cursos' && (
              <div className="space-y-4">
                {!isCourseDetailView && (
                  <>
                    <PageHeader
                      title="Cursos"
                      description="Explora los cursos por bloques simples y entra a una vista dedicada para revisar su estructura."
                      actions={<Button type="button" onClick={() => openCourseModal()}>Crear curso</Button>}
                    />

                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-primary">Listado de cursos</p>
                          <p className="text-sm text-text-secondary">Selecciona un curso para abrir su vista completa.</p>
                        </div>
                        <div className="w-full sm:max-w-sm">
                          <Input placeholder="Buscar por nombre o codigo" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} />
                        </div>
                      </div>

                      {filteredCourses.length === 0 ? (
                        <div className="pt-4">
                          <EmptyState title="Sin cursos" description="Crea el primer curso para comenzar." />
                        </div>
                      ) : (
                        <>
                          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {pageRows(filteredCourses, coursePage).map((course) => {
                              const studentCount = estudiantes.filter((student) => student.curso_id === course.id).length;
                              const assignmentCount = profesores.reduce((total, teacher) => {
                                const matches = (teacher.profesor_materia_curso ?? []).filter((assignment) => assignment.cursos?.id === course.id).length;
                                return total + matches;
                              }, 0);

                              return (
                                <button
                                  key={course.id}
                                  type="button"
                                  onClick={() => setSelectedCourseId(course.id)}
                                  className="group rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                      <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                                        {course.section || course.academic_year || 'Curso'}
                                      </span>
                                      <div>
                                        <h3 className="text-xl font-semibold tracking-tight text-text-primary">{course.name}</h3>
                                        <p className="mt-1 text-sm text-text-secondary">{course.code}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition group-hover:bg-sky-100 group-hover:text-sky-700">
                                      <LayoutGrid size={18} />
                                    </div>
                                  </div>

                                  <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                      <p className="text-xs uppercase tracking-wide text-slate-500">Materias</p>
                                      <p className="mt-2 text-lg font-semibold text-text-primary">{assignmentCount}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                      <p className="text-xs uppercase tracking-wide text-slate-500">Estudiantes</p>
                                      <p className="mt-2 text-lg font-semibold text-text-primary">{studentCount}</p>
                                    </div>
                                  </div>

                                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                                    <span className="text-text-secondary">Abrir detalle del curso</span>
                                    <span className="font-semibold text-primary">Ver curso</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-4 text-xs text-text-secondary">Pagina {coursePage} de {Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE))}</p>
                        </>
                      )}
                    </div>
                  </>
                )}

                {isCourseDetailView && selectedCourse && (
                  <div className="space-y-5">
                    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_32%),linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#0f766e_100%)] px-5 py-6 text-white sm:px-7 sm:py-8">
                        <button
                          type="button"
                          onClick={() => setSelectedCourseId(null)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16"
                        >
                          <ArrowLeft size={16} />
                          Volver a cursos
                        </button>

                        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                          <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100/90">Vista del curso</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{selectedCourse.name}</h2>
                            <p className="mt-3 text-sm text-sky-50/90 sm:text-base">
                              {selectedCourse.code}
                              {(selectedCourse.academic_year || selectedCourse.section) && ` · ${[selectedCourse.academic_year, selectedCourse.section].filter(Boolean).join(' / ')}`}
                            </p>
                            <p className="mt-4 max-w-xl text-sm leading-6 text-sky-50/80">
                              {selectedCourse.description || 'Gestiona de forma clara las materias asociadas y los estudiantes inscritos en este curso.'}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                              <p className="text-xs uppercase tracking-wide text-sky-100/80">Materias</p>
                              <p className="mt-2 text-2xl font-semibold">{selectedCourseAssignments.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                              <p className="text-xs uppercase tracking-wide text-sky-100/80">Estudiantes</p>
                              <p className="mt-2 text-2xl font-semibold">{selectedCourseStudents.length}</p>
                            </div>
                            <div className="flex items-end gap-2">
                              <Button size="sm" type="button" variant="secondary" className="w-full border-white/25 bg-white/95" onClick={() => openCourseModal(selectedCourse)}>Editar</Button>
                              <Button size="sm" type="button" variant="danger" className="w-full" onClick={() => setPendingDelete({ type: 'course', id: selectedCourse.id, label: selectedCourse.name })}>Eliminar</Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-7">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setCourseDetailTab('materias')}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                              courseDetailTab === 'materias'
                                ? 'bg-white text-text-primary shadow-sm ring-1 ring-slate-200'
                                : 'text-text-secondary hover:bg-white/70 hover:text-text-primary'
                            }`}
                          >
                            <BookOpen size={16} />
                            Materias
                          </button>
                          <button
                            type="button"
                            onClick={() => setCourseDetailTab('estudiantes')}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                              courseDetailTab === 'estudiantes'
                                ? 'bg-white text-text-primary shadow-sm ring-1 ring-slate-200'
                                : 'text-text-secondary hover:bg-white/70 hover:text-text-primary'
                            }`}
                          >
                            <GraduationCap size={16} />
                            Estudiantes
                          </button>
                        </div>
                      </div>
                    </div>

                    {courseDetailTab === 'materias' ? (
                      <div className="space-y-4">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-medium text-text-primary">Materias del curso</p>
                              <p className="text-sm text-text-secondary">Agrega una materia nueva y elige el profesor que ya imparte esa materia.</p>
                            </div>
                            <Button
                              type="button"
                              onClick={openCourseAssignmentModal}
                              disabled={availableMateriasForCourse.length === 0}
                            >
                              Asignar materia
                            </Button>
                          </div>
                        </div>

                        {selectedCourseAssignments.length > 0 ? (
                          <div className="grid gap-4 lg:grid-cols-2">
                            {selectedCourseAssignments.map((assignment) => (
                              <div key={assignment.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Materia asociada</p>
                                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-text-primary">{assignment.materia}</h3>
                                  </div>
                                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                    <BookOpen size={18} />
                                  </div>
                                </div>
                                <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Profesor asignado</p>
                                  <p className="mt-2 font-semibold text-text-primary">{assignment.profesor}</p>
                                  <p className="mt-1 text-sm text-text-secondary">{assignment.profesorEmail}</p>
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <Button size="sm" type="button" variant="secondary" onClick={() => void removeCourseAssignment(assignment.id)}>
                                    Quitar asignacion
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <EmptyState title="Sin materias asignadas" description="Aun no hay materias con profesor asignado dentro de este curso." />
                          </div>
                        )}
                      </div>
                    ) : selectedCourseStudents.length > 0 ? (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">Estudiantes inscritos</p>
                            <p className="text-sm text-text-secondary">Listado general de estudiantes pertenecientes a este curso.</p>
                          </div>
                          <div className="hidden rounded-2xl bg-emerald-100 p-3 text-emerald-700 sm:block">
                            <UserSquare2 size={18} />
                          </div>
                        </div>
                        <DataTable headers={['Nombre', 'Correo electronico']}>
                          {selectedCourseStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm font-medium text-text-primary">{student.nombre}</td>
                              <td className="px-4 py-3 text-sm text-text-secondary">{student.email}</td>
                            </tr>
                          ))}
                        </DataTable>
                      </div>
                    ) : (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <EmptyState title="Sin estudiantes" description="Este curso aun no tiene estudiantes registrados." />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {section === 'materias' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Input placeholder="Buscar materia" value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)} />
                  <Button type="button" onClick={() => openSubjectModal()}>Crear materia</Button>
                </div>
                {filteredSubjects.length === 0 ? <EmptyState title="Sin materias" description="Crea la primera materia." /> : (
                  <DataTable headers={['Nombre', 'Acciones']}>
                    {pageRows(filteredSubjects, subjectPage).map((subject) => (
                      <tr key={subject.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{subject.name}</td>
                        <td className="px-4 py-3 text-sm"><div className="flex gap-2"><Button size="sm" type="button" onClick={() => openSubjectModal(subject)}>Editar</Button><Button size="sm" type="button" variant="danger" onClick={() => setPendingDelete({ type: 'subject', id: subject.id, label: subject.name })}>Eliminar</Button></div></td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </div>
            )}

            {section === 'estudiantes' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Input placeholder="Buscar estudiante" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                  <Button type="button" onClick={() => openStudentModal()}>Crear estudiante</Button>
                </div>
                {filteredStudents.length === 0 ? <EmptyState title="Sin estudiantes" description="Crea estudiantes y asignalos a un curso." /> : (
                  <DataTable headers={['Nombre', 'Email', 'Curso', 'Acciones']}>
                    {pageRows(filteredStudents, studentPage).map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{student.nombre}</td><td className="px-4 py-3 text-sm">{student.email}</td><td className="px-4 py-3 text-sm">{student.cursos?.nombre ?? '-'}</td>
                        <td className="px-4 py-3 text-sm"><div className="flex gap-2"><Button size="sm" type="button" onClick={() => openStudentModal(student)}>Editar</Button><Button size="sm" type="button" variant="danger" onClick={() => setPendingDelete({ type: 'student', id: student.id, label: student.nombre })}>Eliminar</Button></div></td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </div>
            )}

            {section === 'profesores' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Input placeholder="Buscar profesor" value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} />
                  <Button type="button" onClick={() => void openTeacherModal()}>Crear profesor</Button>
                </div>
                {filteredTeachers.length === 0 ? <EmptyState title="Sin profesores" description="Crea profesores y asignalos." /> : (
                  <DataTable headers={['Nombre', 'Email', 'Materia', 'Curso', 'Acciones']}>
                    {pageRows(filteredTeachers, teacherPage).map((teacher) => {
                      const assign = teacher.profesor_materia_curso?.[0];
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">{teacher.nombre}</td><td className="px-4 py-3 text-sm">{teacher.email}</td><td className="px-4 py-3 text-sm">{assign?.materias?.nombre ?? '-'}</td><td className="px-4 py-3 text-sm">{assign?.cursos?.nombre ?? '-'}</td>
                          <td className="px-4 py-3 text-sm"><div className="flex gap-2"><Button size="sm" type="button" onClick={() => void openTeacherModal(teacher)}>Editar</Button><Button size="sm" type="button" variant="danger" onClick={() => setPendingDelete({ type: 'teacher', id: teacher.id, label: teacher.nombre })}>Eliminar</Button></div></td>
                        </tr>
                      );
                    })}
                  </DataTable>
                )}
              </div>
            )}

            {unsupported.includes(section) && <EmptyState title="Modulo en preparacion" description="Este apartado ya existe en la navegacion y se puede completar sin romper la nueva arquitectura." />}
          </>
        )}
      </div>

      <Modal open={courseModal} title={editingCourse ? 'Editar curso' : 'Crear curso'} onClose={() => setCourseModal(false)}>
        <form className="space-y-3" onSubmit={saveCourse}>
          <Input label="Nombre" value={courseForm.name} onChange={(e) => setCourseForm((c) => ({ ...c, name: e.target.value }))} required />
          <Input label="Codigo" value={courseForm.code} onChange={(e) => setCourseForm((c) => ({ ...c, code: e.target.value }))} required />
          <Input label="Ano academico" value={courseForm.academic_year} onChange={(e) => setCourseForm((c) => ({ ...c, academic_year: e.target.value }))} />
          <Input label="Seccion" value={courseForm.section} onChange={(e) => setCourseForm((c) => ({ ...c, section: e.target.value }))} />
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setCourseModal(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      <Modal open={subjectModal} title={editingSubject ? 'Editar materia' : 'Crear materia'} onClose={() => setSubjectModal(false)}>
        <form className="space-y-3" onSubmit={saveSubject}>
          <Input label="Nombre" value={subjectForm.name} onChange={(e) => setSubjectForm((c) => ({ ...c, name: e.target.value }))} required />
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSubjectModal(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      <Modal open={studentModal} title={editingStudent ? 'Editar estudiante' : 'Crear estudiante'} onClose={() => setStudentModal(false)}>
        <form className="space-y-3" onSubmit={saveStudent}>
          <Input label="Nombre" value={studentForm.nombre} onChange={(e) => setStudentForm((c) => ({ ...c, nombre: e.target.value }))} required />
          <Input label="Email" type="email" value={studentForm.email} onChange={(e) => setStudentForm((c) => ({ ...c, email: e.target.value }))} required />
          <div><label className="mb-2 block text-sm font-medium">Curso</label><select className="w-full rounded-xl border border-gray-300 px-3 py-2" value={studentForm.curso_id} onChange={(e) => setStudentForm((c) => ({ ...c, curso_id: e.target.value }))} required><option value="">Selecciona un curso</option>{cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre} - {curso.nivel}</option>)}</select></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setStudentModal(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      <Modal open={teacherModal} title={editingTeacher ? 'Editar profesor' : 'Crear profesor'} onClose={() => setTeacherModal(false)}>
        <form className="space-y-3" onSubmit={saveTeacher}>
          <Input label="Nombre" value={teacherForm.nombre} onChange={(e) => setTeacherForm((c) => ({ ...c, nombre: e.target.value }))} required />
          <Input label="Email" type="email" value={teacherForm.email} onChange={(e) => setTeacherForm((c) => ({ ...c, email: e.target.value }))} required />
          <div><label className="mb-2 block text-sm font-medium">Materia</label><select className="w-full rounded-xl border border-gray-300 px-3 py-2" value={teacherForm.materia_id} onChange={(e) => setTeacherForm((c) => ({ ...c, materia_id: e.target.value }))} required><option value="">Selecciona una materia</option>{materias.map((materia) => <option key={materia.id} value={materia.id}>{materia.nombre}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium">Curso</label><select className="w-full rounded-xl border border-gray-300 px-3 py-2" value={teacherForm.curso_id} onChange={(e) => setTeacherForm((c) => ({ ...c, curso_id: e.target.value }))} required><option value="">Selecciona un curso</option>{cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre} - {curso.nivel}</option>)}</select></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setTeacherModal(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      <Modal open={courseAssignmentModal} title="Asignar materia al curso" onClose={() => setCourseAssignmentModal(false)}>
        <form className="space-y-4" onSubmit={saveCourseAssignment}>
          {selectedCourse && (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Curso seleccionado</p>
              <p className="mt-2 text-base font-semibold text-text-primary">{selectedCourse.name}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {selectedCourse.code}
                {(selectedCourse.academic_year || selectedCourse.section) && ` · ${[selectedCourse.academic_year, selectedCourse.section].filter(Boolean).join(' / ')}`}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Materia</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
              value={courseAssignmentForm.materia_id}
              onChange={(e) => setCourseAssignmentForm({ materia_id: e.target.value, profesor_id: '' })}
              required
            >
              <option value="">Selecciona una materia</option>
              {availableMateriasForCourse.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-text-secondary">Solo se muestran materias que aun no estan asignadas a este curso.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Profesor que imparte esta materia</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
              value={courseAssignmentForm.profesor_id}
              onChange={(e) => setCourseAssignmentForm((current) => ({ ...current, profesor_id: e.target.value }))}
              disabled={!courseAssignmentForm.materia_id || availableTeachersForSelectedMateria.length === 0}
              required
            >
              <option value="">
                {!courseAssignmentForm.materia_id
                  ? 'Primero selecciona una materia'
                  : availableTeachersForSelectedMateria.length === 0
                    ? 'No hay profesores asociados a esta materia'
                    : 'Selecciona un profesor'}
              </option>
              {availableTeachersForSelectedMateria.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.nombre} - {teacher.email}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-text-secondary">Aqui se muestran los profesores que ya tienen esa materia entre sus asignaciones.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCourseAssignmentModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={!courseAssignmentForm.materia_id || !courseAssignmentForm.profesor_id}>Guardar asignacion</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Confirmar eliminacion"
        message={pendingDelete ? `Se eliminara ${pendingDelete.label}. Esta accion no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </MainLayout>
  );
}
