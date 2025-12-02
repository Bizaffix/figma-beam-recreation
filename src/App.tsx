import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmailConfirm from "./pages/EmailConfirm";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

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
  allowedRoles?: ('instructor' | 'student' | 'admin')[] 
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
        <Routes>
          {/* Public Landing Page */}
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
          
          {/* Protected Student Routes */}
          <Route path="/discover" element={<StudentRoute><Index /></StudentRoute>} />
          <Route path="/home" element={<StudentRoute><Home /></StudentRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/retreat/:id" element={<ProtectedRoute><RetreatDetail /></ProtectedRoute>} />
          <Route path="/retreat/:id/book" element={<StudentRoute><Booking /></StudentRoute>} />
          <Route path="/retreat/:id/payment" element={<StudentRoute><Payment /></StudentRoute>} />
          <Route path="/retreat/:id/confirmed" element={<StudentRoute><Confirmation /></StudentRoute>} />
          
          {/* Protected Instructor Routes */}
          <Route path="/instructor/browse" element={<InstructorRoute><InstructorBrowse /></InstructorRoute>} />
          <Route path="/instructor/dashboard" element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
          <Route path="/instructor/retreats/new" element={<InstructorRoute><InstructorRetreatForm /></InstructorRoute>} />
          <Route path="/instructor/retreats/:id/edit" element={<InstructorRoute><InstructorRetreatForm /></InstructorRoute>} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          
          {/* Catch-all route - redirect to login if not authenticated */}
          <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
