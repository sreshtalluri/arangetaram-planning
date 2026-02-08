import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { user } = await signIn(email, password);
      const role = user?.user_metadata?.role;
      toast.success(`Welcome back!`);
      if (role === "vendor") {
        navigate("/vendor-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      let message = "Invalid credentials";
      if (error && typeof error === 'object' && 'message' in error) {
        message = String(error.message);
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.pexels.com/photos/34717625/pexels-photo-34717625.jpeg"
          alt="Classical dance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#800020]/80 to-[#800020]/40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Welcome Back
            </h1>
            <p className="text-lg text-white/80">
              Continue planning your perfect Arangetram or manage your vendor profile.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center text-[#800020] hover:text-[#600018] mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Sign In
            </h2>
            <p className="text-[#4A4A4A]">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-styled"
                data-testid="login-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-styled"
                data-testid="login-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-[#888888] hover:text-[#800020] text-sm">
              Forgot password?
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[#4A4A4A]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#800020] hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
            <p className="text-center text-sm text-[#888888] mb-4">
              Just browsing? Continue as a guest
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/plan")}
              className="w-full btn-secondary"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
