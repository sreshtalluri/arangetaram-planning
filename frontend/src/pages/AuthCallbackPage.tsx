import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session - Supabase handles the hash fragment automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          // No session yet, might be processing
          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();

          if (retryError || !retrySession) {
            setError("Email verification failed. Please try again.");
            return;
          }

          handleRedirect(retrySession.user?.user_metadata?.role);
          return;
        }

        // Session exists, redirect based on role
        handleRedirect(session.user?.user_metadata?.role);
      } catch (err) {
        console.error("Callback error:", err);
        setError("An unexpected error occurred. Please try logging in.");
      }
    };

    const handleRedirect = (role?: string) => {
      if (role === "vendor") {
        navigate("/vendor/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Verification Error
          </h2>
          <p className="text-[#4A4A4A] mb-6">{error}</p>
          <a
            href="/login"
            className="text-[#800020] hover:underline font-medium"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#800020] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Verifying your email...
        </h2>
        <p className="text-[#4A4A4A]">
          Please wait while we complete your verification.
        </p>
      </div>
    </div>
  );
}
