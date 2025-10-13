import { Routes, Route, Navigate } from 'react-router-dom';

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
import AuthPage from "@/pages/auth";
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

export default function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  // Force rebuild - updated routing Oct 4, 2025

  const protectedRoute = (component: ReactNode, pathname: string) => {
    return isAuthenticated ? component : <Navigate to="/login" state={{ from: { pathname: pathname } }} replace />
  }

  const adminRoute = (component: ReactNode, pathname: string) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: { pathname: pathname } }} replace />;
    }
    if (user?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return component;
  }

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
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="auth-test" element={<AuthTestPage />} />
        <Route path="leaderboard" element={protectedRoute(<LeaderboardPage />, '/leaderboard')} />
        <Route path="discussions" element={protectedRoute(<DiscussionsPage />, '/discussions')} />
        <Route path="courses" element={protectedRoute(<CoursesPage />, '/courses')} />
        <Route path="profile" element={protectedRoute(<ProfilePage />, '/profile')} />
        <Route path="admin" element={adminRoute(<AdminPage />, '/admin')} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}