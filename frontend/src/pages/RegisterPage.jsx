import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, ArrowLeft, User, Store } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    user_type: "user",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        user_type: formData.user_type,
      });
      toast.success(`Welcome, ${user.name}!`);
      if (user.user_type === "vendor") {
        navigate("/vendor-dashboard");
      } else {
        navigate("/events/create");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center text-[#800020] hover:text-[#600018] mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Create Account
            </h2>
            <p className="text-[#4A4A4A]">
              Join our community of families and vendors
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-3">
              <Label>I am a...</Label>
              <RadioGroup
                value={formData.user_type}
                onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="user" id="user" className="peer sr-only" />
                  <Label
                    htmlFor="user"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-[#E5E5E5] bg-white p-4 cursor-pointer hover:border-[#C5A059] peer-data-[state=checked]:border-[#0F4C5C] peer-data-[state=checked]:bg-[#0F4C5C]/5 transition-colors"
                  >
                    <User className="w-8 h-8 mb-2 text-[#0F4C5C]" />
                    <span className="font-medium text-[#1A1A1A]">Family</span>
                    <span className="text-xs text-[#888888]">Planning an event</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="vendor" id="vendor" className="peer sr-only" />
                  <Label
                    htmlFor="vendor"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-[#E5E5E5] bg-white p-4 cursor-pointer hover:border-[#C5A059] peer-data-[state=checked]:border-[#0F4C5C] peer-data-[state=checked]:bg-[#0F4C5C]/5 transition-colors"
                  >
                    <Store className="w-8 h-8 mb-2 text-[#800020]" />
                    <span className="font-medium text-[#1A1A1A]">Vendor</span>
                    <span className="text-xs text-[#888888]">Offering services</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="input-styled"
                data-testid="register-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="input-styled"
                data-testid="register-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-styled"
                data-testid="register-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-styled"
                data-testid="register-confirm-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="register-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#4A4A4A]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#800020] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg"
          alt="Event venue"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0F4C5C]/80 to-[#0F4C5C]/40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {formData.user_type === "vendor" ? "Grow Your Business" : "Plan Your Special Day"}
            </h1>
            <p className="text-lg text-white/80">
              {formData.user_type === "vendor"
                ? "Connect with families planning Arangetrams and showcase your services to a targeted audience."
                : "Join our platform to discover and book the best vendors for your Arangetram celebration."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
