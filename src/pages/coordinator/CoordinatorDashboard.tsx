import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { Button, Input } from '../../components/common';
import { courseService, schoolService, subjectService } from '../../services/supabase';
import type { Course, Subject, Curso, EstudianteListItem, Materia, ProfesorListItem, RoleName, UserListItem } from '../../types';
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
  const [users, setUsers] = useState<UserListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [courseModal, setCourseModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [studentModal, setStudentModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState(false);
  const [userModal, setUserModal] = useState(false);

  const [courseSearch, setCourseSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | RoleName>('all');

  const [coursePage] = useState(1);
  const [subjectPage] = useState(1);
  const [studentPage] = useState(1);
  const [teacherPage] = useState(1);

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingStudent, setEditingStudent] = useState<EstudianteListItem | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<ProfesorListItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{ type: 'course' | 'subject' | 'student' | 'teacher' | 'user'; id: string; label: string } | null>(null);

  const [courseForm, setCourseForm] = useState({ name: '', code: '', academic_year: '', section: '', description: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [studentForm, setStudentForm] = useState({ nombre: '', email: '', curso_id: '' });
  const [teacherForm, setTeacherForm] = useState({ nombre: '', email: '', materia_id: '', curso_id: '' });
  const [userForm, setUserForm] = useState<{ name: string; email: string; role: RoleName; active: boolean }>({
    name: '',
    email: '',
    role: 'student',
    active: true,
  });

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [courseData, subjectData, cursoData, materiaData, studentData, teacherData, usersData] = await Promise.all([
        courseService.list(),
        subjectService.list(),
        schoolService.listCursos(),
        schoolService.listMaterias(),
        schoolService.listEstudiantes(),
        schoolService.listProfesores(),
        schoolService.listUsers(),
      ]);
      setCourses(courseData);
      setSubjects(subjectData);
      setCursos(cursoData);
      setMaterias(materiaData);
      setEstudiantes(studentData);
      setProfesores(teacherData);
      setUsers(usersData);
      setError(null);
    } catch (e) {
      setError(formatError(e, 'No se pudo cargar la informacion.'));
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => courses.filter((i) => `${i.name} ${i.code}`.toLowerCase().includes(courseSearch.toLowerCase())), [courses, courseSearch]);
  const filteredSubjects = useMemo(() => subjects.filter((i) => `${i.name} ${i.code}`.toLowerCase().includes(subjectSearch.toLowerCase())), [subjects, subjectSearch]);
  const filteredStudents = useMemo(() => estudiantes.filter((i) => `${i.nombre} ${i.email} ${i.cursos?.nombre ?? ''}`.toLowerCase().includes(studentSearch.toLowerCase())), [estudiantes, studentSearch]);
  const filteredTeachers = useMemo(() => profesores.filter((i) => `${i.nombre} ${i.email} ${i.profesor_materia_curso?.[0]?.materias?.nombre ?? ''}`.toLowerCase().includes(teacherSearch.toLowerCase())), [profesores, teacherSearch]);
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter((u) => {
      const matchesSearch = `${u.name} ${u.email} ${u.role ?? ''}`.toLowerCase().includes(q);
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

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
      setSubjectForm({ name: item.name, code: item.code, description: item.description ?? '' });
    } else {
      setEditingSubject(null);
      setSubjectForm({ name: '', code: '', description: '' });
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

  function openUserModal(item?: UserListItem) {
    if (item) {
      setEditingUser(item);
      setUserForm({
        name: item.name,
        email: item.email,
        role: (item.role ?? 'student') as RoleName,
        active: item.active,
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: 'student', active: true });
    }
    setUserModal(true);
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
      if (editingSubject) await subjectService.update(editingSubject.id, { ...subjectForm, code: subjectForm.code.toUpperCase() });
      else await subjectService.create({ ...subjectForm, code: subjectForm.code.toUpperCase() });
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

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!userForm.name.trim()) throw new Error('El nombre es obligatorio.');
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(userForm.email.trim().toLowerCase())) {
        throw new Error('Email invalido.');
      }

      if (editingUser) {
        await schoolService.updateUser({
          userId: editingUser.id,
          name: userForm.name.trim(),
          email: userForm.email.trim().toLowerCase(),
          role: userForm.role,
          active: userForm.active,
        });
        setSuccess('Usuario actualizado.');
      } else {
        await schoolService.inviteUser({
          name: userForm.name.trim(),
          email: userForm.email.trim().toLowerCase(),
          role: userForm.role,
        });
        setSuccess('Invitacion enviada.');
      }

      setUserModal(false);
      await loadAll();
    } catch (err) {
      setError(formatError(err, 'No se pudo guardar el usuario.'));
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.type === 'course') await courseService.remove(pendingDelete.id);
      if (pendingDelete.type === 'subject') await subjectService.remove(pendingDelete.id);
      if (pendingDelete.type === 'student') await schoolService.deleteEstudiante(pendingDelete.id);
      if (pendingDelete.type === 'teacher') await schoolService.deleteProfesor(pendingDelete.id);
      if (pendingDelete.type === 'user') await schoolService.deleteUser(pendingDelete.id);
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

  const unsupported = ['reportes', 'configuracion'] as SectionKey[];

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Input placeholder="Buscar por nombre o codigo" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} />
                  <Button type="button" onClick={() => openCourseModal()}>Crear curso</Button>
                </div>
                {filteredCourses.length === 0 ? <EmptyState title="Sin cursos" description="Crea el primer curso para comenzar." /> : (
                  <>
                    <DataTable headers={['Nombre', 'Codigo', 'Ano', 'Seccion', 'Acciones']}>
                      {pageRows(filteredCourses, coursePage).map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">{course.name}</td><td className="px-4 py-3 text-sm">{course.code}</td><td className="px-4 py-3 text-sm">{course.academic_year ?? '-'}</td><td className="px-4 py-3 text-sm">{course.section ?? '-'}</td>
                          <td className="px-4 py-3 text-sm"><div className="flex gap-2"><Button size="sm" type="button" onClick={() => openCourseModal(course)}>Editar</Button><Button size="sm" type="button" variant="danger" onClick={() => setPendingDelete({ type: 'course', id: course.id, label: course.name })}>Eliminar</Button></div></td>
                        </tr>
                      ))}
                    </DataTable>
                    <p className="text-xs text-text-secondary">Pagina {coursePage} de {Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE))}</p>
                  </>
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
                  <DataTable headers={['Nombre', 'Codigo', 'Acciones']}>
                    {pageRows(filteredSubjects, subjectPage).map((subject) => (
                      <tr key={subject.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{subject.name}</td><td className="px-4 py-3 text-sm">{subject.code}</td>
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

            {section === 'usuarios' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <Input placeholder="Buscar usuario" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                    <select
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as 'all' | RoleName)}
                    >
                      <option value="all">Todos los roles</option>
                      <option value="director">Director</option>
                      <option value="coordinator">Coordinador</option>
                      <option value="teacher">Profesor</option>
                      <option value="student">Estudiante</option>
                    </select>
                  </div>
                  <Button type="button" onClick={() => openUserModal()}>Crear usuario</Button>
                </div>

                {filteredUsers.length === 0 ? (
                  <EmptyState title="Sin usuarios" description="Invita el primer usuario institucional." />
                ) : (
                  <DataTable headers={['Nombre', 'Email', 'Rol', 'Estado', 'Acciones']}>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{user.name}</td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.role ?? '-'}</td>
                        <td className="px-4 py-3 text-sm">{user.active ? 'Activo' : 'Inactivo'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button size="sm" type="button" onClick={() => openUserModal(user)}>Editar</Button>
                            <Button
                              size="sm"
                              type="button"
                              variant="secondary"
                              onClick={() =>
                                void schoolService
                                  .updateUser({ userId: user.id, active: !user.active })
                                  .then(() => loadAll())
                                  .catch((e) => setError(formatError(e, 'No se pudo cambiar estado.')))
                              }
                            >
                              {user.active ? 'Desactivar' : 'Activar'}
                            </Button>
                            <Button size="sm" type="button" variant="danger" onClick={() => setPendingDelete({ type: 'user', id: user.id, label: user.email })}>Eliminar</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
          <Input label="Codigo" value={subjectForm.code} onChange={(e) => setSubjectForm((c) => ({ ...c, code: e.target.value }))} required />
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

      <Modal open={userModal} title={editingUser ? 'Editar usuario' : 'Invitar usuario'} onClose={() => setUserModal(false)}>
        <form className="space-y-3" onSubmit={saveUser}>
          <Input label="Nombre" value={userForm.name} onChange={(e) => setUserForm((c) => ({ ...c, name: e.target.value }))} required />
          <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))} required />
          <div>
            <label className="mb-2 block text-sm font-medium">Rol</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
              value={userForm.role}
              onChange={(e) => setUserForm((c) => ({ ...c, role: e.target.value as RoleName }))}
            >
              <option value="director">Director</option>
              <option value="coordinator">Coordinador</option>
              <option value="teacher">Profesor</option>
              <option value="student">Estudiante</option>
            </select>
          </div>
          {editingUser && (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={userForm.active}
                onChange={(e) => setUserForm((c) => ({ ...c, active: e.target.checked }))}
              />
              Usuario activo
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setUserModal(false)}>Cancelar</Button>
            <Button type="submit">{editingUser ? 'Guardar' : 'Invitar'}</Button>
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
