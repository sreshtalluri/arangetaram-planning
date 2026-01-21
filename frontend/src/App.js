import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { Toaster } from "./components/ui/sonner";
import { seedAPI } from "./lib/api";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
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
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendors/:id" element={<VendorDetailPage />} />
            <Route path="/plan" element={<PlanEventPage />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;
