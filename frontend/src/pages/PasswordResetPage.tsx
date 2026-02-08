import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPassword, updatePassword } from "../lib/auth-supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, KeyRound } from "lucide-react";

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Check if we're on the reset-password route (updating password)
  const isUpdateMode = location.pathname === "/auth/reset-password";

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      toast.success("Password updated successfully!");
      navigate("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent && !isUpdateMode) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[#0F4C5C]/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#0F4C5C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Check Your Email
          </h2>
          <p className="text-[#4A4A4A] mb-6">
            We've sent a password reset link to <strong>{email}</strong>.
            Click the link in the email to reset your password.
          </p>
          <p className="text-[#888888] text-sm mb-6">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setEmailSent(false)}
              className="text-[#800020] hover:underline"
            >
              try again
            </button>
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full btn-secondary">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center text-[#800020] hover:text-[#600018] mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#800020]/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#800020]" />
            </div>
            <h2 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {isUpdateMode ? "Set New Password" : "Reset Password"}
            </h2>
          </div>
          <p className="text-[#4A4A4A]">
            {isUpdateMode
              ? "Enter your new password below"
              : "Enter your email and we'll send you a reset link"
            }
          </p>
        </div>

        {isUpdateMode ? (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-styled"
                data-testid="reset-new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="input-styled"
                data-testid="reset-confirm-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="reset-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-styled"
                data-testid="reset-email"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="reset-request-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
