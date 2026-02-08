import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";
import { seedAPI } from "./lib/api";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SignupPage from "./pages/SignupPage";
import VendorSignupPage from "./pages/VendorSignupPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import VendorsPage from "./pages/VendorsPage";
import VendorDetailPage from "./pages/VendorDetailPage";
import PlanEventPage from "./pages/PlanEventPage";
import UserDashboard from "./pages/UserDashboard";
import VendorDashboard from "./pages/VendorDashboard";

function App() {
  useEffect(() => {
    // Seed database on first load
    const initializeApp = async () => {
      try {
        await seedAPI.seed();
      } catch (e) {
        console.log("Database may already be seeded");
      }
    };
    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F9F8F4]">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/vendor/signup" element={<VendorSignupPage />} />
            <Route path="/forgot-password" element={<PasswordResetPage />} />
            <Route path="/auth/reset-password" element={<PasswordResetPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendors/:id" element={<VendorDetailPage />} />
            <Route path="/plan" element={<PlanEventPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor-dashboard"
              element={
                <ProtectedRoute requiredRole="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;
