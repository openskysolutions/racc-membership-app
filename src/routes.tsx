import { Routes, Route, Navigate } from 'react-router-dom';

import PagesLayout from '@/components/layouts/pagesLayout';
import { useAuthStore } from '@/stores/authStore';

import HomePage from '@/pages/Home';
import AuthPage from "@/pages/auth";
import Privacy from '@/pages/docs/Privacy';
import Terms from '@/pages/docs/Terms';
import ProtectedRoutePage from '@/pages/ProtectedRoute';

export default function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuthStore();

  console.log('isAuthenticated', isAuthenticated);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  return (
    <Routes>
      {/* public routes */}
      <Route path="/auth" element={<AuthPage />} />

      {/* layout wrapper for all public pages except auth */}
      <Route path="/" element={<PagesLayout />}>  
        {/* home is public */}
        <Route index element={<HomePage />} />
        {/* protected route: only this path requires auth */}
        <Route
          path="protected"
          element={
            isAuthenticated
              ? <ProtectedRoutePage />
              : <Navigate to="/auth" state={{ from: { pathname: '/protected' } }} replace />
          }
        />
        {/* other public pages under layout */}
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}