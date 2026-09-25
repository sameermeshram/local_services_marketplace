import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import MaterialIcon from "../../components/ui/MaterialIcon";
import api from "../../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing. Please check the link in your email.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-email", { token });
        setStatus("success");
        setMessage(response.data?.message || "Email verified successfully!");
      } catch (error) {
        setStatus("error");
        const errorMessage =
          error.response?.data?.errors?.[0]?.message ||
          error.response?.data?.message ||
          "Verification failed. The link may be invalid or expired.";
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <AuthLayout>
      <main className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden p-8">
        <div className="text-center">
          {/* Logo/Branding */}
          <div className="mb-6 flex justify-center">
            <span className="font-display text-primary text-headline-lg flex items-center gap-2">
              <MaterialIcon name="build" filled className="text-4xl" />
              FixIt Local
            </span>
          </div>

          {/* Status Icon and Message */}
          {status === "verifying" && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <MaterialIcon
                  name="progress_activity"
                  className="text-6xl text-primary animate-spin"
                />
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
                Verifying Your Email
              </h1>
              <p className="text-on-surface-variant font-body-md">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 rounded-full p-6">
                  <MaterialIcon
                    name="check_circle"
                    filled
                    className="text-6xl text-green-600"
                  />
                </div>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
                Email Verified!
              </h1>
              <p className="text-on-surface-variant font-body-md mb-8">
                {message}
              </p>
              <p className="text-on-surface-variant font-body-sm mb-6">
                Your account is now verified. You can log in and start using FixIt Local.
              </p>
              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full bg-secondary-container hover:bg-secondary text-white font-headline-sm py-4 rounded-xl shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                Go to Login
                <MaterialIcon
                  name="arrow_forward"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-6">
                  <MaterialIcon
                    name="error"
                    filled
                    className="text-6xl text-red-600"
                  />
                </div>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
                Verification Failed
              </h1>
              <p className="text-error font-body-md mb-8">{message}</p>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="w-full bg-secondary-container hover:bg-secondary text-white font-headline-sm py-4 rounded-xl shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Go to Login
                </button>
                <p className="text-on-surface-variant font-body-sm">
                  Need help?{" "}
                  <button
                    type="button"
                    onClick={handleGoToLogin}
                    className="text-primary font-semibold hover:underline"
                  >
                    Request a new verification email
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthLayout>
  );
}
