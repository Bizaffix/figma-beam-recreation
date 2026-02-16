import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { PlatformSettingsProvider } from "./contexts/PlatformSettingsContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import RetreatDetail from "./pages/RetreatDetail";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import NotFound from "./pages/NotFound";
import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorRetreatForm from "./pages/InstructorRetreatForm";
import InstructorBrowse from "./pages/InstructorBrowse";
import InstructorMessages from "./pages/InstructorMessages";
import StudentMessages from "./pages/StudentMessages";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import AffiliateProgramManager from "./pages/AffiliateProgramManager";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmailConfirm from "./pages/EmailConfirm";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LocationOwnerDashboard from "./pages/LocationOwnerDashboard";
import VenueOwnerMessages from "./pages/VenueOwnerMessages";
import VenueRegistration from "./pages/VenueRegistration";
import QuiltMatch from "./pages/QuiltMatch";
import ClaimListing from "./pages/ClaimListing";
import { useAuth } from "./contexts/AuthContext";
import { initializeAffiliateTracking } from "./lib/affiliate-tracking";
import { useEffect } from "react";

const queryClient = new QueryClient();

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* Email confirmation route - accessible to all (needs to handle sign-out) */}
          <Route path="/auth/confirm" element={<EmailConfirm />} />
          {/* Password reset route - accessible to all (needs to handle sign-out) */}
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          {/* Public Legal Pages */}
          <Route path="/privacy" element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />
          
          {/* Public Retreat Browsing - Event Feed */}
          <Route path="/browse" element={<Index />} />
          <Route path="/discover" element={<Index />} />
          
          {/* QuiltMatch AI – Smart Retreat Finder */}
          <Route path="/find" element={<QuiltMatch />} />
          <Route path="/quiltmatch" element={<QuiltMatch />} />
          
          {/* Claim Listing – organizers claim discovered listings */}
          <Route path="/claim" element={<ClaimListing />} />
          
          {/* Protected Student Routes */}
          <Route path="/home" element={<StudentRoute><Home /></StudentRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/student/messages" element={<StudentRoute><StudentMessages /></StudentRoute>} />
          
          {/* Public Retreat Detail - can view without login */}
          <Route path="/retreat/:id" element={<RetreatDetail />} />
          
          {/* Protected Booking Routes */}
          <Route path="/retreat/:id/book" element={<StudentRoute><Booking /></StudentRoute>} />
          <Route path="/retreat/:id/payment" element={<StudentRoute><Payment /></StudentRoute>} />
          <Route path="/retreat/:id/confirmed" element={<StudentRoute><Confirmation /></StudentRoute>} />
          
          {/* Protected Instructor Routes */}
          <Route path="/instructor/browse" element={<InstructorRoute><InstructorBrowse /></InstructorRoute>} />
          <Route path="/instructor/dashboard" element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
          <Route path="/instructor/messages" element={<InstructorRoute><InstructorMessages /></InstructorRoute>} />
          <Route path="/instructor/retreats/new" element={<InstructorRoute><InstructorRetreatForm /></InstructorRoute>} />
          <Route path="/instructor/retreats/:id/edit" element={<InstructorRoute><InstructorRetreatForm /></InstructorRoute>} />
          
          {/* Protected Location Owner Routes */}
          <Route path="/location-owner/dashboard" element={<LocationOwnerRoute><LocationOwnerDashboard /></LocationOwnerRoute>} />
          <Route path="/location-owner/messages" element={<LocationOwnerRoute><VenueOwnerMessages /></LocationOwnerRoute>} />
          <Route path="/location-owner/properties/new" element={<LocationOwnerRoute><VenueRegistration /></LocationOwnerRoute>} />
          <Route path="/location-owner/properties/:id/edit" element={<LocationOwnerRoute><VenueRegistration /></LocationOwnerRoute>} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="/admin/affiliates" element={<AdminRoute><AffiliateProgramManager /></AdminRoute>} />
          
          {/* Catch-all route - redirect to login if not authenticated */}
          <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
            </Routes>
          </PermissionsProvider>
          </PlatformSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
