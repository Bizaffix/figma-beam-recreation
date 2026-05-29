import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { PlatformSettingsProvider } from "./contexts/PlatformSettingsContext";
import { PageLoader } from "./components/PageLoader";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import RetreatDetail from "./pages/RetreatDetail";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import NotFound from "./pages/NotFound";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import EmailConfirm from "./pages/EmailConfirm";
import OAuthCallback from "./pages/OAuthCallback";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import QuiltMatchHowItWorksPage from "./pages/marketing/QuiltMatchHowItWorksPage";
import VenueRegistration from "./pages/VenueRegistration";
import QuiltMatch from "./pages/QuiltMatch";
import ClaimListing from "./pages/ClaimListing";
import QuiltMatchUpgrade from "./pages/QuiltMatchUpgrade";
import QuiltMatchSubscriptionSuccess from "./pages/QuiltMatchSubscriptionSuccess";
import { useAuth } from "./contexts/AuthContext";
import { initializeAffiliateTracking } from "./lib/affiliate-tracking";
import QuiltMatchVenuesPage from "./pages/marketing/QuiltMatchVenuesPage";
import QuiltMatchCreatorsPage from "./pages/marketing/QuiltMatchCreatorsPage";
import QuiltMatchBlogPage from "./pages/marketing/QuiltMatchBlogPage";
import QuiltMatchFaqPage from "./pages/marketing/QuiltMatchFaqPage";
import QuiltMatchBlogPostPage from "./pages/marketing/QuiltMatchBlogPostPage";
import QuiltMatchNewsPage from "./pages/marketing/QuiltMatchNewsPage";
import QuiltMatchNewsPostPage from "./pages/marketing/QuiltMatchNewsPostPage";
import RetreatsMarketingLayout from "./pages/marketing/RetreatsMarketingLayout";
import QuiltMatchRetreatsPage from "./pages/marketing/QuiltMatchRetreatsPage";
import QuiltMatchRetreats2026Page from "./pages/marketing/QuiltMatchRetreats2026Page";
import QuiltMatchRetreatsInStatePage from "./pages/marketing/QuiltMatchRetreatsInStatePage";
import QuiltMatchRetreatsRegionPage from "./pages/marketing/QuiltMatchRetreatsRegionPage";
import QuiltMatchGuideWhatIsPage from "./pages/marketing/QuiltMatchGuideWhatIsPage";
import QuiltMatchGuideWhatToBringPage from "./pages/marketing/QuiltMatchGuideWhatToBringPage";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminContentPage = lazy(() => import("./pages/AdminContentPage"));
const AffiliateProgramManager = lazy(() => import("./pages/AffiliateProgramManager"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const InstructorRetreatForm = lazy(() => import("./pages/InstructorRetreatForm"));
const InstructorBrowse = lazy(() => import("./pages/InstructorBrowse"));
const InstructorMessages = lazy(() => import("./pages/InstructorMessages"));
const StudentMessages = lazy(() => import("./pages/StudentMessages"));
const LocationOwnerDashboard = lazy(() => import("./pages/LocationOwnerDashboard"));
const VenueOwnerMessages = lazy(() => import("./pages/VenueOwnerMessages"));

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// Component to initialize affiliate tracking on app load
const AffiliateTrackingInit = () => {
  useEffect(() => {
    initializeAffiliateTracking();
  }, []);
  return null;
};

// Public Route Component - redirects authenticated users to their role-based home
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If authenticated, redirect based on role
  if (user) {
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (role === 'location_owner') {
      return <Navigate to="/location-owner/dashboard" replace />;
    } else if (role === 'student') {
      return <Navigate to="/home" replace />;
    }
    // If role is not set yet, wait a bit
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

// Protected Route Component - requires authentication
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ('instructor' | 'student' | 'admin' | 'location_owner')[] 
}) => {
  const { user, role, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login immediately
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have the right role, redirect
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to role-appropriate page
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (role === 'location_owner') {
      return <Navigate to="/location-owner/dashboard" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  // If role is required but not loaded yet, wait
  if (allowedRoles && !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Student-only routes
const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  return <ProtectedRoute allowedRoles={['student']}>{children}</ProtectedRoute>;
};

// Instructor-only routes
const InstructorRoute = ({ children }: { children: React.ReactNode }) => {
  return <ProtectedRoute allowedRoles={['instructor']}>{children}</ProtectedRoute>;
};

// Location Owner-only routes
const LocationOwnerRoute = ({ children }: { children: React.ReactNode }) => {
  return <ProtectedRoute allowedRoles={['location_owner']}>{children}</ProtectedRoute>;
};

// Admin-only routes
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PlatformSettingsProvider>
        <PermissionsProvider>
          <AffiliateTrackingInit />
          <Routes>
        {/* Public Landing Page - First page users see */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        
        {/* Public Routes - Only Login/Signup and Email Confirmation */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        {/* Email confirmation route - accessible to all (needs to handle sign-out) */}
        <Route path="/auth/confirm" element={<EmailConfirm />} />
        <Route path="/auth/verify-email" element={<EmailConfirm />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        {/* Password reset route - accessible to all (needs to handle sign-out) */}
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        {/* Public Legal Pages */}
        <Route path="/privacy" element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />
        <Route path="/how-it-works" element={<QuiltMatchHowItWorksPage />} />

        {/* Quilt-match retreats hub + SEO paths (aligned with quilt-match repo) */}
        <Route path="/retreats" element={<RetreatsMarketingLayout />}>
          <Route index element={<QuiltMatchRetreatsPage />} />
          <Route path="2026" element={<QuiltMatchRetreats2026Page />} />
          <Route path="in/:state" element={<QuiltMatchRetreatsInStatePage />} />
          <Route path=":region" element={<QuiltMatchRetreatsRegionPage />} />
        </Route>
        <Route path="/guides/what-is-a-quilt-retreat" element={<QuiltMatchGuideWhatIsPage />} />
        <Route path="/guides/what-to-bring" element={<QuiltMatchGuideWhatToBringPage />} />
        <Route path="/venues" element={<QuiltMatchVenuesPage />} />
        <Route path="/creators" element={<QuiltMatchCreatorsPage />} />
        <Route path="/faq" element={<QuiltMatchFaqPage />} />
        <Route path="/blog" element={<QuiltMatchBlogPage />} />
        <Route path="/blog/:slug" element={<QuiltMatchBlogPostPage />} />
        <Route path="/news" element={<QuiltMatchNewsPage />} />
        <Route path="/news/:slug" element={<QuiltMatchNewsPostPage />} />
        <Route path="/guides" element={<QuiltMatchHowItWorksPage />} />

        {/* Public Retreat Browsing - Event Feed */}
        <Route path="/browse" element={<Index />} />
        <Route path="/discover" element={<Index />} />
        
        {/* QuiltMatch AI – Smart Retreat Finder */}
        <Route path="/find" element={<QuiltMatch />} />
        <Route path="/quiltmatch" element={<QuiltMatch />} />
        <Route path="/quiltmatch/upgrade" element={<ProtectedRoute><QuiltMatchUpgrade /></ProtectedRoute>} />
        <Route path="/quiltmatch/subscription-success" element={<ProtectedRoute><QuiltMatchSubscriptionSuccess /></ProtectedRoute>} />
        
        {/* Claim Listing – organizers claim discovered listings */}
        <Route path="/claim" element={<ClaimListing />} />
        
        {/* Protected Student Routes */}
        <Route path="/home" element={<StudentRoute><Home /></StudentRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/student/messages" element={<StudentRoute><LazyPage><StudentMessages /></LazyPage></StudentRoute>} />
        
        {/* Public Retreat Detail - can view without login */}
        <Route path="/retreat/:id" element={<RetreatDetail />} />
        
        {/* Protected Booking Routes */}
        <Route path="/retreat/:id/book" element={<StudentRoute><Booking /></StudentRoute>} />
        <Route path="/retreat/:id/payment" element={<StudentRoute><Payment /></StudentRoute>} />
        <Route path="/retreat/:id/confirmed" element={<StudentRoute><Confirmation /></StudentRoute>} />
        
        {/* Protected Instructor Routes */}
        <Route path="/instructor/browse" element={<InstructorRoute><LazyPage><InstructorBrowse /></LazyPage></InstructorRoute>} />
        <Route path="/instructor/dashboard" element={<InstructorRoute><LazyPage><InstructorDashboard /></LazyPage></InstructorRoute>} />
        <Route path="/instructor/messages" element={<InstructorRoute><LazyPage><InstructorMessages /></LazyPage></InstructorRoute>} />
        <Route path="/instructor/retreats/new" element={<InstructorRoute><LazyPage><InstructorRetreatForm /></LazyPage></InstructorRoute>} />
        <Route path="/instructor/retreats/:id/edit" element={<InstructorRoute><LazyPage><InstructorRetreatForm /></LazyPage></InstructorRoute>} />
        
        {/* Protected Location Owner Routes */}
        <Route path="/location-owner/dashboard" element={<LocationOwnerRoute><LazyPage><LocationOwnerDashboard /></LazyPage></LocationOwnerRoute>} />
        <Route path="/location-owner/messages" element={<LocationOwnerRoute><LazyPage><VenueOwnerMessages /></LazyPage></LocationOwnerRoute>} />
        <Route path="/location-owner/properties/new" element={<LocationOwnerRoute><VenueRegistration /></LocationOwnerRoute>} />
        <Route path="/location-owner/properties/:id/edit" element={<LocationOwnerRoute><VenueRegistration /></LocationOwnerRoute>} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><LazyPage><AdminDashboard /></LazyPage></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><LazyPage><AdminAnalytics /></LazyPage></AdminRoute>} />
        <Route path="/admin/affiliates" element={<AdminRoute><LazyPage><AffiliateProgramManager /></LazyPage></AdminRoute>} />
        <Route path="/admin/content" element={<AdminRoute><LazyPage><AdminContentPage /></LazyPage></AdminRoute>} />
        
        {/* Catch-all route - redirect to login if not authenticated */}
        <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
          </Routes>
          <CookieConsentBanner />
        </PermissionsProvider>
        </PlatformSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
