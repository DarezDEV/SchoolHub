import { useEffect, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/supabase';
import type { Course, GradeRecord } from '../../types';
import { CAPABILITY_LABELS, ROLE_CAPABILITIES, ROLE_DESCRIPTIONS } from '../../utils/constants';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const [enrolledCourses, studentGrades] = await Promise.all([
          studentService.getEnrolledCourses(user.id),
          studentService.getGrades(user.id),
        ]);
        setCourses(enrolledCourses);
        setGrades(studentGrades);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

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
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-sky-100 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-sky-100 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
              👨‍🎓
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Panel del Estudiante</h1>
              <p className="text-text-secondary mt-2 text-lg">
                Bienvenido,{' '}
                <span className="font-semibold text-text-primary">
                  {user?.profile?.name} {user?.profile?.last_name}
                </span>
              </p>
              <p className="text-text-secondary mt-2">
                {ROLE_DESCRIPTIONS.student}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Mis Cursos</h2>
          <div className="mt-4 grid gap-3">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-900">
                  {course.name} ({course.code}) - {course.academic_year}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No tienes cursos asignados.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Mis Notas</h2>
          <div className="mt-4 grid gap-3">
            {grades.length > 0 ? (
              grades.map((grade) => (
                <div key={grade.id} className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-green-900">
                  Nota: {grade.score} - {grade.period || 'Sin período'} - {grade.notes || 'Sin notas'}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No tienes notas registradas.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Funciones definidas para este rol</h2>
          <div className="mt-4 grid gap-3">
            {ROLE_CAPABILITIES.student.map((capability) => (
              <div key={capability} className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-900">
                {CAPABILITY_LABELS[capability]}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-2xl px-6 py-4">
          <p className="text-sky-800 font-medium">
            El estudiante solo tendra acceso de consulta para ver sus notas y su informacion academica personal.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
