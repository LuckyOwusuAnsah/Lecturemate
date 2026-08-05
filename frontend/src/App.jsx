import React, { useEffect, useCallback } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useIdleTimeout } from "./hooks/useIdleTimeout";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

import Layout from "./components/layout";
import StudentDashboard from "./pages/Student/StudentDashboard.jsx";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AIContentGenerator from "./pages/AIContentGenerator";
import EducatorDashboard from "./pages/Educator/EducatorDashboard.jsx";
import CreateCourse from "./pages/Educator/CreateCourse";
import AdminPanel from "./pages/AdminPanel";
import CourseDetail from "./pages/Student/CourseDetail";
import EducatorOnboarding from "./pages/Educator/EducatorOnboarding.jsx";
import PendingApproval from "./pages/Educator/PendingApproval.jsx";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import SetPassword from "./pages/SetPassword";
import StudentOnboarding from "./pages/Student/StudentOnboarding.jsx";
import { useAuth } from "./context/AuthContext.jsx"; 
// import useUser from "./hooks/useUser"; // No longer directly needed in App.jsx for initial fetch

import Analytics from "./pages/Educator/Analytics";
import StudentWellness from "./pages/Educator/StudentWellness";
import QuizGrading from "./pages/Educator/QuizGrading";
import CoursesPage from "./pages/CoursesPage";
import Wellness from "./pages/Student/Wellness";
import Messages from "./pages/Student/Messages";
import Wishlist from "./pages/Student/Wishlist";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import Terms from "./pages/Terms.jsx";
import CounselorChat from "./components/CounselorChat.jsx";

// A simple PrivateRoute component to handle redirection logic
const PrivateRoute = ({ children, allowedRoles = [], requiresOnboarding = false, requireApproval = false }) => {
 const { user, isAuthenticated, isOnboardingComplete, loading: authLoading } = useAuth();
 const navigate = useNavigate();
 const location = useLocation(); // Get current location

 useEffect(() => {
  // If auth is still loading, do nothing yet. Wait for it to complete.
  if (authLoading) return;

  // 1. Check Authentication
  if (!isAuthenticated) {
   navigate("/Login", { state: { from: location }, replace: true }); 
   return;
  }

  // 2. Check Onboarding Status (if required for this route)
  if (requiresOnboarding && !isOnboardingComplete) {
   // User is logged in but onboarding is not complete
   if (user?.role === "student") {
    navigate("/StudentOnboarding", { replace: true });
   } else if (user?.role === "educator") {
    navigate("/EducatorOnboarding", { replace: true });
   } else {
    // Fallback for unexpected roles not having a specific onboarding
    toast.warn("Please complete your onboarding first.");
    navigate("/Home", { replace: true });
   }
   return;
  }

  // 3. Check Role Authorization (if allowedRoles are specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
   toast.error("You do not have permission to access this page.");
   // Redirect based on user's role or to a generic unauthorized page
   if (user?.role === 'student') navigate("/StudentDashboard", { replace: true });
   else if (user?.role === 'educator') navigate("/EducatorDashboard", { replace: true });
   else navigate("/Home", { replace: true }); // Or a dedicated /unauthorized page
   return;
  }

  // 4. Check educator approval status (for routes that require it)
  if (requireApproval && user?.role === "educator" && user?.status !== "approved") {
   navigate("/PendingApproval", { replace: true });
   return;
  }

  // If all checks pass, render the children
 }, [isAuthenticated, isOnboardingComplete, user, authLoading, allowedRoles, requiresOnboarding, requireApproval, navigate, location]);

  const isPendingEducator = requireApproval && user?.role === "educator" && user?.status !== "approved";

  // Unified loading state for PrivateRoute
  // We should not render children until auth status is confirmed and roles/onboarding are checked
  if (authLoading || (!isAuthenticated && !authLoading) || (requiresOnboarding && !isOnboardingComplete && !authLoading) || (allowedRoles.length > 0 && !authLoading && user && !allowedRoles.includes(user.role)) || (!authLoading && isPendingEducator)) {
    // Only show loading message if auth is *actually* loading.
    // Otherwise, the navigation in useEffect will handle the redirect.
  return (
   <div className="min-h-screen flex items-center justify-center">
    {authLoading ? <div>Loading user data...</div> : null}
   </div>
  );
 }
 // If user is authenticated and authorized, render the children
 return children;
};


function App() {
 const { loading: authLoading, isAuthenticated, logout } = useAuth();
 const navigate = useNavigate();

 // --- REMOVED THE REDUNDANT useEffect THAT CALLED fetchUser() ---
 // --- REMOVED useUser hook from App.jsx, as its fetch is now redundant ---

 const handleIdleLogout = useCallback(async () => {
  await logout();
  toast.info("You've been logged out due to inactivity.");
  navigate("/Login");
 }, [logout, navigate]);

 useIdleTimeout(isAuthenticated, IDLE_TIMEOUT_MS, handleIdleLogout);

 // Global loading state for initial app load:
 // Wait until authLoading is false, meaning the initial user check is complete
 if (authLoading) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
    Loading application...
   </div>
  );
 }

 return (
  <Layout>
   <Routes>
    {/* Public Routes */}
    <Route path='/' element={<Home />} /> {/* Set / as default home */}
    <Route path='/Home' element={<Home />} />
    <Route path='/Register' element={<Signup />} />
    <Route path='/Login' element={<Login />} />
    <Route path='/forgot-password' element={<ForgotPassword />} />
    <Route path='/set-password/:resetToken' element={<SetPassword />} />
    <Route path='/Courses' element={<CoursesPage />} />
    <Route path='/terms' element={<Terms />} />
        <Route path='/ai' element={<CounselorChat />} />


    {/* Onboarding Routes - accessible only if not onboarded and authenticated */}
    <Route path="/StudentOnboarding" element={
     <PrivateRoute allowedRoles={['student']} requiresOnboarding={false}>
      <StudentOnboarding />
     </PrivateRoute>
    } />
    <Route path="/EducatorOnboarding" element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={false}>
      <EducatorOnboarding />
     </PrivateRoute>
    } />
    <Route path="/PendingApproval" element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={true}>
      <PendingApproval />
     </PrivateRoute>
    } />

    {/* Protected Routes - require authentication and completed onboarding */}
    <Route path='/StudentDashboard' element={
     <PrivateRoute allowedRoles={['student']} requiresOnboarding={true}>
      <StudentDashboard />
     </PrivateRoute>
    } />
    <Route path='/Wellness' element={
     <PrivateRoute allowedRoles={['student']} requiresOnboarding={true}>
      <Wellness />
     </PrivateRoute>
    } />
    <Route path='/Messages' element={
     <PrivateRoute allowedRoles={['student']} requiresOnboarding={true}>
      <Messages />
     </PrivateRoute>
    } />
    <Route path='/Wishlist' element={
     <PrivateRoute allowedRoles={['student']} requiresOnboarding={true}>
      <Wishlist />
     </PrivateRoute>
    } />
    <Route path='/AIContentGenerator' element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={true} requireApproval={true}>
      <AIContentGenerator />
     </PrivateRoute>
    } />
    <Route path='/Analytics' element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={true} requireApproval={true}>
      <Analytics />
     </PrivateRoute>
    } />
    <Route path='/StudentWellness' element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={true} requireApproval={true}>
      <StudentWellness />
     </PrivateRoute>
    } />
    <Route path='/EducatorDashboard' element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={true} requireApproval={true}>
      <EducatorDashboard />
     </PrivateRoute>
    } />
    <Route path='/QuizGrading' element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={true} requireApproval={true}>
      <QuizGrading />
     </PrivateRoute>
    } />
    <Route path='/CreateCourse' element={
     <PrivateRoute allowedRoles={['educator']} requiresOnboarding={true} requireApproval={true}>
      <CreateCourse />
     </PrivateRoute>
    } />
    <Route path='/AdminPanel' element={
     <PrivateRoute allowedRoles={['admin']} requiresOnboarding={false}>
      <AdminPanel />
     </PrivateRoute>
    } />
    <Route path='/CourseDetail' element={
     <PrivateRoute allowedRoles={['student', 'educator']} requiresOnboarding={true}>
      <CourseDetail />
     </PrivateRoute>
    } />

    {/* Catch-all for undefined routes (optional) */}
    <Route path="*" element={<NotFoundPage />} /> 
   </Routes>
  </Layout>
 );
}

export default App;
