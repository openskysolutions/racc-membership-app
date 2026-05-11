import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';

import PagesLayout from '@/components/layouts/pagesLayout';
import { useAuthStore } from '@/stores/authStore';

import HomePage from '@/pages/Home';

import AdminPage from '@/pages/Admin';

import LoginPage from "@/pages/auth/Login";
import ConnectAccountPage from "@/pages/auth/ConnectAccount";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import ResetPasswordPage from "@/pages/auth/ResetPassword";
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
import JobDetailPage from '@/pages/JobDetail';
import JobFormPage from '@/pages/JobForm';
import JobApplicationPage from '@/pages/JobApplication';
import JobApplicationsListPage from '@/pages/JobApplicationsList';
import CalendarPage from '@/pages/Calendar';
import EventDetailPage from '@/pages/EventDetail';
import CoursesPage from '@/pages/Courses';

import AboutPage from '@/pages/About';
import BoardMembersPage from '@/pages/BoardMembers';
import ContactPage from '@/pages/Contact';
import Privacy from '@/pages/docs/Privacy';
import Terms from '@/pages/docs/Terms';
import EventsList from '@/pages/EventsList';
import EventPage from '@/pages/EventPage';

import BlogPage from '@/pages/Blog';
import BlogPostPage from '@/pages/BlogPost';
import FormPage from '@/pages/FormPage';

// Always import Posts list (read-only for mobile)
import PostsPage from '@/pages/admin/Posts';

// Conditionally lazy-load admin edit pages (excluded from mobile builds)
const isMobile = import.meta.env.VITE_PLATFORM === 'mobile';

// Stub component for mobile builds
const MobileStub = () => <Navigate to="/" replace />;

// Conditionally import admin pages - only loaded in web builds
const PostCategoriesPage = !isMobile ? lazy(() => import('@/pages/admin/PostCategories')) : MobileStub;
const PostCategoryFormPage = !isMobile ? lazy(() => import('@/pages/admin/PostCategoryForm')) : MobileStub;
const PostAuthorsPage = !isMobile ? lazy(() => import('@/pages/admin/PostAuthors')) : MobileStub;
const PostAuthorFormPage = !isMobile ? lazy(() => import('@/pages/admin/PostAuthorForm')) : MobileStub;
const PostFormPage = !isMobile ? lazy(() => import('@/pages/admin/PostForm')) : MobileStub;

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

// External redirect component
const ExternalRedirect = ({ to }: { to: string }) => {
  useEffect(() => { window.location.replace(to); }, [to]);
  return null;
};

// Loading fallback component
const LazyLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
      <p>Loading...</p>
    </div>
  </div>
);

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
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
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
        <Route path="jobs" element={<JobPostingsPage />} />
        <Route path="jobs/new" element={<ProtectedRoute><JobFormPage /></ProtectedRoute>} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="jobs/:id/edit" element={<ProtectedRoute><JobFormPage /></ProtectedRoute>} />
        <Route path="jobs/:id/apply" element={<JobApplicationPage />} />
        <Route path="jobs/:id/applications" element={<ProtectedRoute><JobApplicationsListPage /></ProtectedRoute>} />
        <Route path="job-postings" element={<JobPostingsPage />} />
        <Route path="courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />

        <Route path="about" element={<AboutPage />} />
        <Route path="board" element={<BoardMembersPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="event-pages" element={<EventsList />} />
        <Route path="event-pages/:slug" element={<EventPage />} />

        {/* Blog routes */}
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />

        {/* Form routes */}
        <Route path="forms/:formId" element={<FormPage />} />

        {/* Admin blog routes - Posts list available on all platforms (read-only on mobile) */}
        <Route path="admin/posts" element={<AdminRoute><PostsPage /></AdminRoute>} />
        
        {/* Admin edit routes - only available on web builds, excluded from mobile */}
        <Route path="admin/post-categories" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostCategoriesPage /></Suspense></AdminRoute>} />
        <Route path="admin/post-categories/new" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostCategoryFormPage /></Suspense></AdminRoute>} />
        <Route path="admin/post-categories/:id/edit" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostCategoryFormPage /></Suspense></AdminRoute>} />
        
        <Route path="admin/post-authors" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostAuthorsPage /></Suspense></AdminRoute>} />
        <Route path="admin/post-authors/new" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostAuthorFormPage /></Suspense></AdminRoute>} />
        <Route path="admin/post-authors/:id/edit" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostAuthorFormPage /></Suspense></AdminRoute>} />
        
        <Route path="admin/posts/new" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostFormPage /></Suspense></AdminRoute>} />
        <Route path="admin/posts/:id/edit" element={<AdminRoute><Suspense fallback={<LazyLoadingFallback />}><PostFormPage /></Suspense></AdminRoute>} />
      </Route>

      {/* External redirects */}
      <Route path="magazine" element={<ExternalRedirect to="https://richfieldchamber.pagemotion.io/" />} />
      <Route path="chamber-luncheons" element={<ExternalRedirect to="https://richfieldareachamber.com/events/GTwd1YcRh6O5g064pNYc_1778695200000_3600" />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}