import { useEffect, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/common';
import { courseService, subjectService } from '../../services/supabase';
import type { Course, Subject } from '../../types';
import { CAPABILITY_LABELS, ROLE_CAPABILITIES, ROLE_DESCRIPTIONS } from '../../utils/constants';

interface CourseFormState {
  name: string;
  code: string;
  academic_year: string;
  section: string;
  description: string;
}

interface SubjectFormState {
  name: string;
  code: string;
  description: string;
}

const emptyCourseForm: CourseFormState = {
  name: '',
  code: '',
  academic_year: '',
  section: '',
  description: '',
};

const emptySubjectForm: SubjectFormState = {
  name: '',
  code: '',
  description: '',
};

type TabKey = 'courses' | 'subjects';

function formatError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm);
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>(emptySubjectForm);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingSubject, setSavingSubject] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [courseSuccess, setCourseSuccess] = useState<string | null>(null);
  const [subjectSuccess, setSubjectSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadCourses();
    void loadSubjects();
  }, []);

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      const data = await courseService.list();
      setCourses(data);
      setCourseError(null);
    } catch (error) {
      setCourseError(formatError(error, 'No se pudieron cargar los cursos.'));
    } finally {
      setLoadingCourses(false);
    }
  }

  async function loadSubjects() {
    setLoadingSubjects(true);
    try {
      const data = await subjectService.list();
      setSubjects(data);
      setSubjectError(null);
    } catch (error) {
      setSubjectError(formatError(error, 'No se pudieron cargar las materias.'));
    } finally {
      setLoadingSubjects(false);
    }
  }

  function resetCourseForm() {
    setCourseForm(emptyCourseForm);
    setEditingCourseId(null);
  }

  function resetSubjectForm() {
    setSubjectForm(emptySubjectForm);
    setEditingSubjectId(null);
  }

  async function handleCourseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCourse(true);
    setCourseError(null);
    setCourseSuccess(null);

    try {
      const payload = {
        name: courseForm.name.trim(),
        code: courseForm.code.trim().toUpperCase(),
        academic_year: courseForm.academic_year.trim() || undefined,
        section: courseForm.section.trim() || undefined,
        description: courseForm.description.trim() || undefined,
      };

      if (editingCourseId) {
        const updated = await courseService.update(editingCourseId, payload);
        setCourses((current) => current.map((course) => (course.id === updated.id ? updated : course)));
        setCourseSuccess('Curso actualizado correctamente.');
      } else {
        const created = await courseService.create(payload);
        setCourses((current) => [created, ...current]);
        setCourseSuccess('Curso creado correctamente.');
      }

      resetCourseForm();
    } catch (error) {
      setCourseError(formatError(error, 'No se pudo guardar el curso.'));
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleSubjectSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSubject(true);
    setSubjectError(null);
    setSubjectSuccess(null);

    try {
      const payload = {
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        description: subjectForm.description.trim() || undefined,
      };

      if (editingSubjectId) {
        const updated = await subjectService.update(editingSubjectId, payload);
        setSubjects((current) => current.map((subject) => (subject.id === updated.id ? updated : subject)));
        setSubjectSuccess('Materia actualizada correctamente.');
      } else {
        const created = await subjectService.create(payload);
        setSubjects((current) => [created, ...current]);
        setSubjectSuccess('Materia creada correctamente.');
      }

      resetSubjectForm();
    } catch (error) {
      setSubjectError(formatError(error, 'No se pudo guardar la materia.'));
    } finally {
      setSavingSubject(false);
    }
  }

  async function handleDeleteCourse(course: Course) {
    const confirmed = window.confirm(`Se eliminara el curso "${course.name}".`);
    if (!confirmed) return;

    try {
      await courseService.remove(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
      if (editingCourseId === course.id) resetCourseForm();
      setCourseSuccess('Curso eliminado correctamente.');
      setCourseError(null);
    } catch (error) {
      setCourseError(formatError(error, 'No se pudo eliminar el curso.'));
    }
  }

  async function handleDeleteSubject(subject: Subject) {
    const confirmed = window.confirm(`Se eliminara la materia "${subject.name}".`);
    if (!confirmed) return;

    try {
      await subjectService.remove(subject.id);
      setSubjects((current) => current.filter((item) => item.id !== subject.id));
      if (editingSubjectId === subject.id) resetSubjectForm();
      setSubjectSuccess('Materia eliminada correctamente.');
      setSubjectError(null);
    } catch (error) {
      setSubjectError(formatError(error, 'No se pudo eliminar la materia.'));
    }
  }

  function beginEditCourse(course: Course) {
    setActiveTab('courses');
    setEditingCourseId(course.id);
    setCourseForm({
      name: course.name,
      code: course.code,
      academic_year: course.academic_year ?? '',
      section: course.section ?? '',
      description: course.description ?? '',
    });
    setCourseSuccess(null);
    setCourseError(null);
  }

  function beginEditSubject(subject: Subject) {
    setActiveTab('subjects');
    setEditingSubjectId(subject.id);
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description ?? '',
    });
    setSubjectSuccess(null);
    setSubjectError(null);
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-blue-100 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
              🧑‍💼
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Panel del Coordinador</h1>
              <p className="text-text-secondary mt-2 text-lg">
                Bienvenido,{' '}
                <span className="font-semibold text-text-primary">
                  {user?.profile?.name} {user?.profile?.last_name}
                </span>
              </p>
              <p className="text-text-secondary mt-2">{ROLE_DESCRIPTIONS.coordinator}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Funciones definidas para este rol</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ROLE_CAPABILITIES.coordinator.map((capability) => (
              <div key={capability} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-900">
                {CAPABILITY_LABELS[capability]}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`rounded-2xl px-4 py-3 font-semibold transition-colors ${
                activeTab === 'courses' ? 'bg-primary text-white' : 'bg-slate-100 text-text-primary hover:bg-slate-200'
              }`}
            >
              CRUD de cursos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`rounded-2xl px-4 py-3 font-semibold transition-colors ${
                activeTab === 'subjects' ? 'bg-primary text-white' : 'bg-slate-100 text-text-primary hover:bg-slate-200'
              }`}
            >
              CRUD de materias
            </button>
          </div>
        </div>

        {activeTab === 'courses' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">
                    {editingCourseId ? 'Editar curso' : 'Crear curso'}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Registra cursos con codigo, ano academico, seccion y descripcion.
                  </p>
                </div>
                {editingCourseId && (
                  <Button type="button" variant="secondary" onClick={resetCourseForm}>
                    Cancelar edicion
                  </Button>
                )}
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleCourseSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Nombre del curso"
                    value={courseForm.name}
                    onChange={(event) => setCourseForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej: 5to de Secundaria"
                    required
                  />
                  <Input
                    label="Codigo"
                    value={courseForm.code}
                    onChange={(event) => setCourseForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="Ej: SEC5A"
                    required
                  />
                  <Input
                    label="Ano academico"
                    value={courseForm.academic_year}
                    onChange={(event) => setCourseForm((current) => ({ ...current, academic_year: event.target.value }))}
                    placeholder="Ej: 2026-2027"
                  />
                  <Input
                    label="Seccion"
                    value={courseForm.section}
                    onChange={(event) => setCourseForm((current) => ({ ...current, section: event.target.value }))}
                    placeholder="Ej: A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Descripcion</label>
                  <textarea
                    className="w-full min-h-28 px-4 py-3 border border-gray-300 rounded bg-background text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    value={courseForm.description}
                    onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Detalles del curso"
                  />
                </div>

                {courseError && <p className="text-sm text-error">{courseError}</p>}
                {courseSuccess && <p className="text-sm text-success">{courseSuccess}</p>}

                <Button type="submit" isLoading={savingCourse}>
                  {editingCourseId ? 'Guardar cambios' : 'Crear curso'}
                </Button>
              </form>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Cursos registrados</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Administra la lista de cursos existentes.
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={() => void loadCourses()} isLoading={loadingCourses}>
                  Recargar
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {loadingCourses ? (
                  <p className="text-sm text-text-secondary">Cargando cursos...</p>
                ) : courses.length === 0 ? (
                  <p className="text-sm text-text-secondary">Todavia no hay cursos registrados.</p>
                ) : (
                  courses.map((course) => (
                    <article key={course.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-text-primary">{course.name}</h3>
                          <p className="text-sm text-text-secondary mt-1">
                            {course.code}
                            {course.section ? ` · Seccion ${course.section}` : ''}
                            {course.academic_year ? ` · ${course.academic_year}` : ''}
                          </p>
                          {course.description && (
                            <p className="text-sm text-text-secondary mt-2">{course.description}</p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${course.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {course.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => beginEditCourse(course)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => void handleDeleteCourse(course)}>
                          Eliminar
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">
                    {editingSubjectId ? 'Editar materia' : 'Crear materia'}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Registra las materias que se imparten en la escuela.
                  </p>
                </div>
                {editingSubjectId && (
                  <Button type="button" variant="secondary" onClick={resetSubjectForm}>
                    Cancelar edicion
                  </Button>
                )}
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubjectSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Nombre de la materia"
                    value={subjectForm.name}
                    onChange={(event) => setSubjectForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej: Matematicas"
                    required
                  />
                  <Input
                    label="Codigo"
                    value={subjectForm.code}
                    onChange={(event) => setSubjectForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="Ej: MAT-01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Descripcion</label>
                  <textarea
                    className="w-full min-h-28 px-4 py-3 border border-gray-300 rounded bg-background text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    value={subjectForm.description}
                    onChange={(event) => setSubjectForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Detalles de la materia"
                  />
                </div>

                {subjectError && <p className="text-sm text-error">{subjectError}</p>}
                {subjectSuccess && <p className="text-sm text-success">{subjectSuccess}</p>}

                <Button type="submit" isLoading={savingSubject}>
                  {editingSubjectId ? 'Guardar cambios' : 'Crear materia'}
                </Button>
              </form>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Materias registradas</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Administra el catalogo de materias impartidas.
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={() => void loadSubjects()} isLoading={loadingSubjects}>
                  Recargar
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {loadingSubjects ? (
                  <p className="text-sm text-text-secondary">Cargando materias...</p>
                ) : subjects.length === 0 ? (
                  <p className="text-sm text-text-secondary">Todavia no hay materias registradas.</p>
                ) : (
                  subjects.map((subject) => (
                    <article key={subject.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-text-primary">{subject.name}</h3>
                          <p className="text-sm text-text-secondary mt-1">{subject.code}</p>
                          {subject.description && (
                            <p className="text-sm text-text-secondary mt-2">{subject.description}</p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${subject.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {subject.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => beginEditSubject(subject)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => void handleDeleteSubject(subject)}>
                          Eliminar
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
