import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ROLE_ROUTES } from './utils/constants';
import type { RoleName } from './types';

import LoginPage from './pages/auth/LoginPage';
import DirectorDashboard from './pages/director/DirectorDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role) {
    return <Navigate to={ROLE_ROUTES[user.role as RoleName]} replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role) {
    return <Navigate to={ROLE_ROUTES[user.role as RoleName]} replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={(
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        )}
      />

      <Route
        path="/director/dashboard"
        element={
          <ProtectedRoute allowedRoles={['director']}>
            <DirectorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinador/dashboard"
        element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <CoordinatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estudiante/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/director" element={<Navigate to="/director/dashboard" replace />} />
      <Route path="/coordinator" element={<Navigate to="/coordinador/dashboard" replace />} />
      <Route path="/teacher" element={<Navigate to="/profesor/dashboard" replace />} />
      <Route path="/student" element={<Navigate to="/estudiante/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
