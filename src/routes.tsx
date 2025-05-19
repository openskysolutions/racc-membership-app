import { Routes, Route, Navigate } from 'react-router-dom';

import PagesLayout from '@/components/layouts/pagesLayout';
import { useAuthStore } from '@/stores/authStore';

import HomePage from '@/pages/Home';
import AuthPage from "@/pages/auth";
import Privacy from '@/pages/docs/Privacy';
import Terms from '@/pages/docs/Terms';
import ProtectedRoutePage from '@/pages/ProtectedRoute';
import { ReactNode } from 'react';

export default function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuthStore();

  const protectedRoute = (component: ReactNode, pathname: string) => {
    return isAuthenticated ? component : <Navigate to="/auth" state={{ from: { pathname: pathname } }} replace />
  }

  console.log('isAuthenticated', isAuthenticated);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  return (
    <Routes>
      {/* public routes without layout wrapper */}
      <Route path="/auth" element={<AuthPage />} />

      {/* routes with layout wrapper */}
      <Route path="/" element={<PagesLayout />}>  
        <Route index element={<HomePage />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="/protected" element={protectedRoute(<ProtectedRoutePage /> , '/protected')} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}