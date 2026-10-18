import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import FloatingInput, { PasswordInput } from "../components/ui/FloatingInput";
import MaterialIcon from "../components/ui/MaterialIcon";
import { loginHeroImage } from "../data/mockData";
import { authService } from "../services/authService";

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
              Connect with local service providers for home maintenance and
              repairs.
            </p>
          </div>
          <div className="relative z-10 mt-6 hidden md:flex bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-outline-variant items-center gap-4 animate-bounce hover:animate-none transition-all duration-300">
            <div className="bg-primary-container p-2 rounded-lg">
              <MaterialIcon
                name="verified"
                className="text-on-primary-container"
              />
            </div>
            <div>
              <div className="font-label-md text-label-md text-on-surface-variant uppercase">
                Local Services
              </div>
              <div className="font-headline-sm text-headline-sm text-primary">
                Home repairs made easier
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

          </>
        )}
        </div>
      </section>
    </main>
  </AuthLayout>
  );
}
