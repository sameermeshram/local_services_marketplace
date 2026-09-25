import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import FloatingInput, { PasswordInput } from "../components/ui/FloatingInput";
import MaterialIcon from "../components/ui/MaterialIcon";
import { loginHeroImage } from "../data/mockData";
import { authService } from "../services/authService";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function LoginRegisterPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("customer");
  const [authMode, setAuthMode] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);

  const getErrorMessage = (err) => {
    const response = err.response?.data;
    const firstError = response?.errors?.[0];
    return (
      firstError?.message ||
      response?.message ||
      "Something went wrong. Please try again."
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const payload = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      const response =
        authMode === "login"
          ? await authService.login(payload)
          : await authService.register({
              ...payload,
              name: formData.get("name"),
              phone: formData.get("phone"),
              pincode: formData.get("pincode"),
              role: userType,
              serviceType:
                userType === "provider"
                  ? formData.get("serviceType")
                  : undefined,
              termsAccepted: formData.get("terms") === "on",
            });

      if (authMode === "register") {
        // Show verification message instead of auto-redirect
        setRegistrationSuccess(true);
        setRegisteredEmail(payload.email);
      } else {
        // Login: redirect to dashboard
        const role = response.data?.user?.role || userType;
        navigate(
          role === "provider"
            ? "/provider/dashboard"
            : role === "admin"
              ? "/admin/dashboard"
              : "/",
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setError("");

    try {
      await authService.resendVerification(registeredEmail);
      setError(""); // Clear any previous errors
      alert("Verification email sent! Please check your inbox.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <AuthLayout>
      <main className="w-full max-w-6xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        <section className="w-full md:w-1/2 relative bg-primary-container/10 flex flex-col justify-center items-center p-12 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="relative z-10 text-center max-w-md">
            <div className="mb-8 flex justify-center">
              <span className="font-display text-primary text-headline-lg flex items-center gap-2">
                <MaterialIcon name="build" filled className="text-4xl" />
                FixIt Local
              </span>
            </div>
            <div className="mb-10 rounded-xl overflow-hidden shadow-lg border-4 border-white">
              <img
                src={loginHeroImage}
                alt="A friendly professional electrician repairing a modern home electrical panel"
                className="w-full h-[400px] object-cover"
              />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4">
              Quality service, just a click away.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Connect with verified local professionals for all your home
              maintenance and repair needs.
            </p>
          </div>
          <div className="absolute bottom-12 left-12 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-outline-variant flex items-center gap-4 animate-bounce hover:animate-none transition-all duration-300">
            <div className="bg-primary-container p-2 rounded-lg">
              <MaterialIcon
                name="verified"
                className="text-on-primary-container"
              />
            </div>
            <div>
              <div className="font-label-md text-label-md text-on-surface-variant uppercase">
                Verified Providers
              </div>
              <div className="font-headline-sm text-headline-sm text-primary">
                2,500+ Local Pros
              </div>
            </div>
          </div>
        </section>

        <section className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {registrationSuccess ? (
              // Registration success message
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-green-100 rounded-full p-6">
                    <MaterialIcon
                      name="mark_email_read"
                      filled
                      className="text-6xl text-green-600"
                    />
                  </div>
                </div>
                <h2 className="font-headline-lg text-headline-lg mb-4">
                  Registration Successful!
                </h2>
                <p className="text-on-surface-variant font-body-md mb-6">
                  We've sent a verification email to{" "}
                  <strong className="text-primary">{registeredEmail}</strong>
                </p>
                <div className="bg-surface-container-high p-6 rounded-lg mb-6 text-left">
                  <h3 className="font-headline-sm text-headline-sm mb-3 flex items-center gap-2">
                    <MaterialIcon name="info" className="text-primary" />
                    Next Steps
                  </h3>
                  <ol className="space-y-2 text-body-md text-on-surface-variant ml-6 list-decimal">
                    <li>Check your email inbox</li>
                    <li>Click the verification link in the email</li>
                    <li>Return here to log in</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setAuthMode("login");
                    }}
                    className="w-full bg-secondary-container hover:bg-secondary text-white font-headline-sm py-4 rounded-xl shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                  >
                    Go to Login
                    <MaterialIcon
                      name="arrow_forward"
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <p className="text-on-surface-variant font-body-sm">
                    Didn't receive the email?{" "}
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="text-primary font-semibold hover:underline disabled:opacity-50"
                    >
                      {resendingVerification ? "Sending..." : "Resend verification email"}
                    </button>
                  </p>
                  {error && (
                    <p className="text-error font-body-sm" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Regular login/register form
              <>
            <div className="mb-10">
              <h2 className="font-headline-lg text-headline-lg mb-2">
                {authMode === "login" ? "Log In" : "Create an Account"}
              </h2>
              <p className="text-on-surface-variant font-body-md">
                {authMode === "login"
                  ? "Welcome back to FixIt Local."
                  : "Join the community and start getting things fixed."}
              </p>
            </div>

            <div className="bg-surface-container-high p-1 rounded-lg flex mb-8">
              <button
                type="button"
                onClick={() => setUserType("customer")}
                className={`flex-1 py-3 px-4 rounded-md text-label-md font-label-md transition-all duration-200 ${
                  userType === "customer"
                    ? "active-tab text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                CUSTOMER
              </button>
              <button
                type="button"
                onClick={() => setUserType("provider")}
                className={`flex-1 py-3 px-4 rounded-md text-label-md font-label-md transition-all duration-200 ${
                  userType === "provider"
                    ? "active-tab text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                SERVICE PROVIDER
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {authMode === "register" && (
                <FloatingInput id="name" name="name" label="Full Name" />
              )}
              <FloatingInput
                id="email"
                name="email"
                label="Email Address"
                type="email"
              />
              {authMode === "register" && (
                <div className="flex gap-4">
                  <FloatingInput
                    id="phone"
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    className="flex-[2]"
                  />
                  <FloatingInput
                    id="pincode"
                    name="pincode"
                    label="Pincode"
                    className="flex-1"
                  />
                </div>
              )}
              <PasswordInput
                id="password"
                name="password"
                label="Create Password"
              />

              {authMode === "register" && userType === "provider" && (
                <div className="relative">
                  <select
                    id="serviceType"
                    name="serviceType"
                    className="w-full h-14 px-4 pt-4 border-2 border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors bg-transparent appearance-none"
                    defaultValue=""
                  >
                    <option disabled value="">
                      Select your trade
                    </option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                  <label
                    className="absolute left-4 top-1 text-label-md text-primary bg-white px-1"
                    htmlFor="serviceType"
                  >
                    Professional Trade
                  </label>
                  <div className="absolute right-4 top-4 pointer-events-none">
                    <MaterialIcon name="keyboard_arrow_down" />
                  </div>
                </div>
              )}

              {authMode === "register" && (
                <div className="flex items-start gap-3 py-2">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <label
                    className="text-body-sm text-on-surface-variant"
                    htmlFor="terms"
                  >
                    I agree to the{" "}
                    <a
                      className="text-primary font-semibold underline underline-offset-2"
                      href="#"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      className="text-primary font-semibold underline underline-offset-2"
                      href="#"
                    >
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              )}

              {error && (
                <p
                  className="text-error font-body-sm text-body-sm"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary-container hover:bg-secondary text-white font-headline-sm py-4 rounded-xl shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <MaterialIcon
                      name="progress_activity"
                      className="animate-spin"
                    />
                    Please wait...
                  </>
                ) : (
                  <>
                    {authMode === "login" ? "Log In" : "Get Started"}
                    <MaterialIcon
                      name="arrow_forward"
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-on-surface-variant font-body-md">
                {authMode === "login"
                  ? "New to FixIt Local?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="text-primary font-bold hover:underline"
                  onClick={() => {
                    setError("");
                    setAuthMode(authMode === "login" ? "register" : "login");
                  }}
                >
                  {authMode === "login" ? "Create an Account" : "Log In"}
                </button>
              </p>
            </div>

            <div className="mt-10">
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-outline-variant" />
                <span className="flex-shrink mx-4 text-label-md text-on-surface-variant font-label-md uppercase tracking-widest">
                  Or join with
                </span>
                <div className="flex-grow border-t border-outline-variant" />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-3 border-2 border-outline-variant rounded-lg py-3 hover:bg-surface-container transition-colors"
                >
                  <GoogleIcon />
                  <span className="text-on-surface font-semibold">Google</span>
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-3 border-2 border-outline-variant rounded-lg py-3 hover:bg-surface-container transition-colors"
                >
                  <FacebookIcon />
                  <span className="text-on-surface font-semibold">
                    Facebook
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </section>
    </main>
  </AuthLayout>
  );
}
