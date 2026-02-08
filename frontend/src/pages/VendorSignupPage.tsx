import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Store } from "lucide-react";

export default function VendorSignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      await signUp(formData.email, formData.password, "vendor", formData.name);
      toast.success("Vendor account created! Please check your email to verify your account.");
      navigate("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
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
          src="https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg"
          alt="Event services"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#800020]/80 to-[#800020]/40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Grow Your Business
            </h1>
            <p className="text-lg text-white/80">
              Connect with families planning Arangetrams and showcase your services to a targeted audience.
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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#800020]/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-[#800020]" />
              </div>
              <h2 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Register as a Vendor
              </h2>
            </div>
            <p className="text-[#4A4A4A]">
              Create your vendor profile to reach families planning Arangetrams
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Business / Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your business or full name"
                className="input-styled"
                data-testid="vendor-signup-name"
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
                data-testid="vendor-signup-email"
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
                placeholder="At least 6 characters"
                className="input-styled"
                data-testid="vendor-signup-password"
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
                placeholder="Confirm your password"
                className="input-styled"
                data-testid="vendor-signup-confirm-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="vendor-signup-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating vendor account...
                </>
              ) : (
                "Create Vendor Account"
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

          <div className="mt-4 text-center">
            <p className="text-[#888888] text-sm">
              Planning an event?{" "}
              <Link to="/signup" className="text-[#0F4C5C] hover:underline font-medium">
                Register as a family
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 bg-[#F0EDE5] rounded-lg">
            <h3 className="font-medium text-[#1A1A1A] mb-2">As a vendor, you can:</h3>
            <ul className="text-sm text-[#4A4A4A] space-y-1">
              <li>Create a professional profile</li>
              <li>Showcase your portfolio</li>
              <li>Receive booking inquiries</li>
              <li>Manage your availability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
