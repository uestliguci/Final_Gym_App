import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useMemo } from "react";
import Index from "./pages/Index";
import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorClients from "./pages/InstructorClients";
import InstructorVideos from "./pages/InstructorVideos";
import InstructorSchedule from "./pages/InstructorSchedule";
import InstructorAvailability from "./pages/InstructorAvailability";
import ScheduleSession from "./pages/ScheduleSession";
import Videos from "./pages/Videos";
import Schedule from "./pages/Schedule";
import Instructors from "./pages/Instructors";
import ProgressPage from "./pages/Progress";
import Settings from "./pages/Settings";
import ClientLogin from "./pages/ClientLogin";
import ClientSignup from "./pages/ClientSignup";
import InstructorLogin from "./pages/InstructorLogin";
import InstructorSignup from "./pages/InstructorSignup";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import InstructorProfile from "./pages/InstructorProfile";
import WorkoutPlans from "./pages/WorkoutPlans";
import WorkoutGuides from "./pages/WorkoutGuides";
import InstructorDashboardLayout from "./components/InstructorDashboardLayout";
import Forum from "./pages/Forum";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresInstructor?: boolean;
}

const ProtectedRoute = ({ children, requiresInstructor }: ProtectedRouteProps) => {
  const { currentUser, userProfile, loading } = useAuth();

  const redirectPath = useMemo(() => {
    if (!currentUser || !userProfile) {
      return requiresInstructor ? "/instructor-login" : "/client-login";
    }
    
    if (requiresInstructor && userProfile.role !== 'instructor') {
      return "/";
    }
    
    if (!requiresInstructor && userProfile.role === 'instructor') {
      return "/instructor-dashboard";
    }
    
    return null;
  }, [currentUser?.uid, userProfile?.role, requiresInstructor]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Public routes */}
      <Route path="/signup" element={<Navigate to="/client-signup" replace />} />
      <Route
        path="/client-login"
        element={currentUser ? <Navigate to="/" replace /> : <ClientLogin />}
      />
      <Route
        path="/client-signup"
        element={currentUser ? <Navigate to="/" replace /> : <ClientSignup />}
      />
      <Route
        path="/instructor-login"
        element={currentUser ? <Navigate to="/" replace /> : <InstructorLogin />}
      />
      <Route
        path="/instructor-signup"
        element={currentUser ? <Navigate to="/" replace /> : <InstructorSignup />}
      />

      {/* Protected routes */}
      {/* Instructor routes */}
      <Route path="/instructor/*" element={<ProtectedRoute requiresInstructor><InstructorDashboardLayout>
        <Routes>
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="profile" element={<InstructorProfile />} />
          <Route path="clients" element={<InstructorClients />} />
          <Route path="schedule" element={<InstructorSchedule />} />
          <Route path="availability" element={<InstructorAvailability />} />
          <Route path="schedule-session" element={<ScheduleSession />} />
          <Route path="workout-plans" element={<WorkoutPlans />} />
          <Route path="workout-guides" element={<WorkoutGuides />} />
          <Route path="videos" element={<InstructorVideos />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/instructor/dashboard" replace />} />
        </Routes>
      </InstructorDashboardLayout></ProtectedRoute>} />

      {/* Client routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute requiresInstructor={false}>
            <Index />
          </ProtectedRoute>
        }
      />

      {/* Community routes */}
      <Route
        path="/forum"
        element={
          <ProtectedRoute requiresInstructor={false}>
            <Forum />
          </ProtectedRoute>
        }
      />

      {/* Shared routes with role-based access */}
      <Route
        path="/videos"
        element={
          <ProtectedRoute requiresInstructor={false}>
            <Videos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute requiresInstructor={false}>
            <Schedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructors"
        element={
          <ProtectedRoute requiresInstructor={false}>
            <Instructors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute requiresInstructor={false}>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiresInstructor={false}>
            <Settings />
          </ProtectedRoute>
        }
      />
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/client-login" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <Router>
            <AppRoutes />
          </Router>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
