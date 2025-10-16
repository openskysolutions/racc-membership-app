import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import PagesLayout from '@/components/layouts/pagesLayout';
import { useAuthStore } from '@/stores/authStore';

import HomePage from '@/pages/Home';
import NewsEventsPage from '@/pages/NewsEvents';
import AboutPage from '@/pages/About';
import MembersPage from '@/pages/Members';
import MemberDetailsPage from '@/pages/MemberDetails';
import JobPostingsPage from '@/pages/JobPostings';
import ContactPage from '@/pages/Contact';
import CalendarPage from '@/pages/Calendar';
import LeaderboardPage from '@/pages/Leaderboard';
import DiscussionsPage from '@/pages/Discussions';
import CoursesPage from '@/pages/Courses';
import ProfilePage from '@/pages/Profile';
import AdminPage from '@/pages/Admin';
import AuthPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import ConnectAccountPage from "@/pages/auth/ConnectAccount";
import AuthTestPage from '@/pages/AuthTest';
import JoinPage from '@/pages/Join';
import NominationsPage from '@/pages/Nominations';
import BasicMembershipPage from '@/pages/BasicMembership';
import EnhancedMembershipPage from '@/pages/EnhancedMembership';
import EliteMembershipPage from '@/pages/EliteMembership';
import Privacy from '@/pages/docs/Privacy';
import Terms from '@/pages/docs/Terms';
import { ReactNode } from 'react';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

// Admin Route Component  
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default function AppRoutes() {
  const { isLoading } = useAuthStore();
  // Force rebuild - updated routing Oct 4, 2025

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  return (
    <Routes>
      {/* public routes without layout wrapper */}

      {/* routes with layout wrapper */}
      <Route path="/" element={<PagesLayout />}>  
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<HomePage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="connect-account" element={<ConnectAccountPage />} />
        <Route path="join" element={<JoinPage />} />
        <Route path="nominations" element={<NominationsPage />} />
        <Route path="basic-membership" element={<BasicMembershipPage />} />
        <Route path="enhanced-membership" element={<EnhancedMembershipPage />} />
        <Route path="elite-membership" element={<EliteMembershipPage />} />
        <Route path="news-events" element={<NewsEventsPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/:id" element={<MemberDetailsPage />} />
        <Route path="job-postings" element={<JobPostingsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="about-copy" element={<AboutPage />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="auth-test" element={<AuthTestPage />} />
        <Route path="leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="discussions" element={<ProtectedRoute><DiscussionsPage /></ProtectedRoute>} />
        <Route path="courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}