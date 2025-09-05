import { Routes, Route, Navigate } from 'react-router-dom';

import PagesLayout from '@/components/layouts/pagesLayout';
import { useAuthStore } from '@/stores/authStore';

import HomePage from '@/pages/Home';
import NewsEventsPage from '@/pages/NewsEvents';
import AboutPage from '@/pages/About';
import MembersPage from '@/pages/Members';
import JobPostingsPage from '@/pages/JobPostings';
import ContactPage from '@/pages/Contact';
import CalendarPage from '@/pages/Calendar';
import LeaderboardPage from '@/pages/Leaderboard';
import DiscussionsPage from '@/pages/Discussions';
import CoursesPage from '@/pages/Courses';
import ProfilePage from '@/pages/Profile';
import AuthPage from "@/pages/auth";
import JoinPage from '@/pages/Join';
import NominationsPage from '@/pages/Nominations';
import Privacy from '@/pages/docs/Privacy';
import Terms from '@/pages/docs/Terms';
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
        <Route path="news-events" element={<NewsEventsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="job-postings" element={<JobPostingsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="discussions" element={<DiscussionsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="join" element={<JoinPage />} />
        <Route path="nominations" element={protectedRoute(<NominationsPage />, '/nominations')} />
        <Route path="profile" element={protectedRoute(<ProfilePage />, '/profile')} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}