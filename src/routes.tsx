import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import PagesLayout from '@/components/layouts/pagesLayout';
import { useAuthStore } from '@/stores/authStore';

import HomePage from '@/pages/Home';

import AdminPage from '@/pages/Admin';

import LoginPage from "@/pages/auth/Login";
import ConnectAccountPage from "@/pages/auth/ConnectAccount";
import ProfilePage from '@/pages/Profile';

import JoinPage from '@/pages/Join';
import NominationsPage from '@/pages/Nominations';
import VotingPage from '@/pages/Voting';
import YearlyVotingPage from '@/pages/YearlyVoting';

import BasicMembershipPage from '@/pages/MembershipBasic';
import EnhancedMembershipPage from '@/pages/MembershipEnhanced';
import EliteMembershipPage from '@/pages/MembershipElite';

import MembersPage from '@/pages/Members';
import MemberDetailsPage from '@/pages/MemberDetails';
import JobPostingsPage from '@/pages/JobPostings';
import CalendarPage from '@/pages/Calendar';
import EventDetailPage from '@/pages/EventDetail';
import CoursesPage from '@/pages/Courses';

import AboutPage from '@/pages/About';
import ContactPage from '@/pages/Contact';
import Privacy from '@/pages/docs/Privacy';
import Terms from '@/pages/docs/Terms';
// import EventsList from '@/pages/EventsList';
import EventPage from '@/pages/EventPage';

import { ReactNode } from 'react';

// Scroll to top on route change
function ScrollToTopOnRouteChange() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return null;
}

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

// Admin Route Component (allows admin and board members)
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Allow admin, moderator, and board_member roles
  const hasAccess = user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'board_member';
  
  if (!hasAccess) {
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
    <>
      <ScrollToTopOnRouteChange />
      <Routes>
        {/* public routes without layout wrapper */}

        {/* routes with layout wrapper */}
        <Route path="/" element={<PagesLayout />}>  
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<HomePage />} />

        <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        <Route path="login" element={<LoginPage />} />
        <Route path="connect-account" element={<ConnectAccountPage />} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="join" element={<JoinPage />} />
        <Route path="nominations" element={<NominationsPage />} />
        <Route path="voting" element={<AdminRoute><VotingPage /></AdminRoute>} />
        <Route path="yearly-voting" element={<AdminRoute><YearlyVotingPage /></AdminRoute>} />

        <Route path="basic-membership" element={<BasicMembershipPage />} />
        <Route path="enhanced-membership" element={<EnhancedMembershipPage />} />
        <Route path="elite-membership" element={<EliteMembershipPage />} />

        <Route path="calendar" element={<CalendarPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/:id" element={<MemberDetailsPage />} />
        <Route path="job-postings" element={<JobPostingsPage />} />
        <Route path="courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />

        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        {/* <Route path="event-pages" element={<EventsList />} /> */}
        <Route path="event-pages/:slug" element={<EventPage />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}