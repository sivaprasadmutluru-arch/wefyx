import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Eye,
  EyeOff,
  Globe,
  Headphones,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Shield,
  ShieldCheck,
  Smartphone,
  User,
  Zap,
} from "lucide-react";
import { sendPublic } from "./api";
import "./auth.css";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#008553"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="1" width="9" height="9" fill="#008553" />
      <rect x="11" y="1" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export function UaeFlag({ width = 24, height = 15, className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 16"
      className={className}
      aria-label="UAE Flag"
      style={{
        borderRadius: "2px",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}
    >
      <rect width="24" height="5.33" y="0" fill="#00732f" />
      <rect width="24" height="5.34" y="5.33" fill="#ffffff" />
      <rect width="24" height="5.33" y="10.67" fill="#000000" />
      <rect width="7.2" height="16" x="0" y="0" fill="#ff0000" />
    </svg>
  );
}

const phoneCountryOptions = [
  ["+971", "🇦🇪 +971"],
  ["+91", "🇮🇳 +91"],
];
const validOtpPhone = phone => /^(\+9715[024568][0-9]{7}|\+91[6-9][0-9]{9})$/.test(phone);

function BrandHeader() {
  return (
    <header className="wf-auth-header">
      <div className="wf-auth-header-inner">
        <a href="/" className="wf-auth-logo" aria-label="Wefyx Home">
          <strong>
            Wefy<span>x</span>
          </strong>
          <small>IT Support. Assets. Always On.</small>
        </a>

        <div className="flex items-center gap-4 text-xs">
          <a href="/" className="font-semibold text-slate-500 hover:text-slate-900">
            ← Back to Home
          </a>
        </div>
      </div>
    </header>
  );
}

function OnboardingStepper({ current, steps = [
    { id: "verify", label: "Verify" },
    { id: "business", label: "Business Details" },
    { id: "address", label: "Address" },
    { id: "complete", label: "Complete" },
  ] }) {
  return (
    <ol className="wf-onboarding-stepper" aria-label="Onboarding Progress">
      {steps.map((step, index) => {
        const isDone = index < current;
        const isActive = index === current;
        return (
          <li
            key={step.id}
            className={isDone ? "done" : isActive ? "active" : ""}
            aria-current={isActive ? "step" : undefined}
          >
            <span>{isDone ? <Check size={14} strokeWidth={2.8} /> : index + 1}</span>
            <b>{step.label}</b>
          </li>
        );
      })}
    </ol>
  );
}

export default function PublicRegistration({ initialView = "login" }) {
  // view: 'login' | 'loginOtp' | 'signup' | 'otp' | 'business' | 'address' | 'review' | 'success' | 'forgot'
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "login" || mode === "signin") return "login";
    if (mode === "signup" || mode === "register") return "signup";
    if (mode === "otp") return "otp";
    if (mode === "business") return "business";
    if (mode === "address") return "address";
    if (mode === "review") return "review";
    if (mode === "success") return "success";
    if (mode === "forgot") return "forgot";
    if (window.location.pathname === "/login" || window.location.pathname === "/signin") return "login";
    if (window.location.pathname === "/register" || window.location.pathname === "/signup" || window.location.pathname === "/join") return "signup";
    if (window.location.pathname === "/forgot-password") return "forgot";
    return initialView === "signup" ? "signup" : "login";
  });

  // Login Form (Unified simple login for ALL roles without any role selector tabs)
  const [loginForm, setLoginForm] = useState({
    method: "phone",
    identifier: "",
    dialCode: "+971",
    verifiedPhone: "",
    otp: "",
    password: "",
    rememberMe: true,
  });

  // Registration Multi-Step Form (Screen 1 to 5)
  const [form, setForm] = useState({
    phone: "",
    dialCode: "+971",
    fullPhone: "",
    otp: Array(6).fill(""),
    companyName: "Acme Trading LLC",
    tradeLicense: "1234567",
    industry: "Trading & Distribution",
    companyEmail: "info@acmeuae.com",
    contactPerson: "Ahmed Khan",
    jobTitle: "IT Manager",
    website: "www.acmeuae.com",
    password: "",
    country: "United Arab Emirates",
    emirate: "Dubai",
    address: "Office 1204, Business Bay, Dubai, UAE",
    additionalInfo: "Landmark, Building Name, Floor, etc.",
    serviceVisitsSame: true,
    billingAddressSame: true,
    termsConsent: true,
    role: "CUSTOMER", // Default role for all self-registrations
  });

  // Forgot Password Form
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotDialCode, setForgotDialCode] = useState("+971");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotStep, setForgotStep] = useState(0);
  const [newPassword, setNewPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(25);

  const otpInputsRef = useRef([]);
  const loginOtpInputsRef = useRef([]);

  function handleLoginOtpChange(index, value) {
    const entered = value.replace(/\D/g, "").slice(0, 6);
    setLoginForm((curr) => {
      if (entered.length > 1) return { ...curr, otp: entered };
      const digits = curr.otp.split("");
      digits[index] = entered;
      return { ...curr, otp: digits.join("").slice(0, 6) };
    });
    if (entered.length > 1) loginOtpInputsRef.current[Math.min(index + entered.length, 5)]?.focus();
    else if (entered && index < 5) loginOtpInputsRef.current[index + 1]?.focus();
  }

  function handleLoginOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !loginForm.otp[index] && index > 0) {
      loginOtpInputsRef.current[index - 1]?.focus();
    }
  }

  function handleLoginOtpPaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    setLoginForm((curr) => ({ ...curr, otp: pasted }));
    loginOtpInputsRef.current[Math.min(pasted.length, 5)]?.focus();
  }

  // Resend Timer Countdown
  useEffect(() => {
    let interval = null;
    if ((view === "otp" || view === "loginOtp") && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  const update = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((curr) => ({ ...curr, [key]: value }));
  };

  // OTP inputs handling
  function handleOtpChange(index, val) {
    const char = val.replace(/\D/g, "").slice(-1);
    const nextOtp = [...form.otp];
    nextOtp[index] = char;
    setForm((curr) => ({ ...curr, otp: nextOtp }));
    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !form.otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const nextOtp = [...form.otp];
      for (let i = 0; i < 6; i++) {
        nextOtp[i] = pasted[i] || "";
      }
      setForm((curr) => ({ ...curr, otp: nextOtp }));
      otpInputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  }

  function normalizeSignupPhone() {
    const cleanPhone = form.phone.trim().replace(/[\s()-]/g, "");
    const full = cleanPhone.startsWith("+") ? cleanPhone : `${form.dialCode}${cleanPhone.replace(/^0/, "")}`;
    return full;
  }

  function normalizeLoginPhone(phone) {
    const cleanPhone = phone.trim().replace(/[\s()-]/g, "");
    return cleanPhone.startsWith("+") ? cleanPhone : `${loginForm.dialCode}${cleanPhone.replace(/^0/, "")}`;
  }

  // Action: Screen 1 -> Screen 2 (Account access)
  async function handleSendOtp(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const full = normalizeSignupPhone();
    if (!validOtpPhone(full)) return setError("Enter a valid UAE or India mobile number, for example +971501234567 or +919618810386.");
    if (form.password.length < 8 || new TextEncoder().encode(form.password).length > 72) return setError("Password must be at least 8 characters and no more than 72 bytes.");
    setForm((curr) => ({ ...curr, fullPhone: full }));
    setView("business");
  }

  async function createAccountWithOtp(otp) {
    const payload = {
      name: form.contactPerson.trim(),
      email: form.companyEmail.trim(),
      organization: form.companyName.trim(),
      companyName: form.companyName.trim(),
      phone: form.fullPhone.trim(),
      tradeLicense: form.tradeLicense.trim(),
      industry: form.industry,
      jobTitle: form.jobTitle.trim(),
      website: form.website.trim(),
      country: form.country,
      emirate: form.emirate,
      address: form.address.trim(),
      password: form.password,
      role: "CUSTOMER",
      otp,
    };
    const res = await sendPublic("/auth/register", "POST", payload);
    if (res.token) {
      localStorage.setItem("wefyx-token", res.token);
      localStorage.setItem("wefyx-auth", "true");
      localStorage.setItem("wefyx-user", JSON.stringify(res.user));
      localStorage.setItem("wefyx-account-type", "customer");
    }
    setView("success");
  }

  // Action: Final screen -> Create account after phone OTP
  async function handleVerifyOtp(event) {
    event.preventDefault();
    setError("");
    const code = form.otp.join("");
    if (code.length !== 6) return setError("Please enter the complete 6-digit OTP.");
    setBusy(true);
    try {
      await createAccountWithOtp(code);
    } catch (err) {
      setError(err.message || "Invalid OTP or registration failed. Please check and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Action: Screen 3 -> Screen 4 (Business Details)
  function handleBusinessSubmit(event) {
    event.preventDefault();
    setError("");
    if (!form.companyName.trim() || !form.companyEmail.trim() || !form.contactPerson.trim()) {
      return setError("Please fill in all required company details.");
    }
    if (!/^\S+@\S+\.\S+$/.test(form.companyEmail.trim())) {
      return setError("Please enter a valid company email address.");
    }
    setView("address");
  }

  // Action: Screen 4 -> Screen 5 (Address Details)
  function handleAddressSubmit(event) {
    event.preventDefault();
    setError("");
    if (!form.address.trim()) {
      return setError("Please enter your company address.");
    }
    setView("review");
  }

  // Action: Screen 5 -> Send registration OTP after all details are entered
  async function handleCreateAccount(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.termsConsent) {
      return setError("Please agree to the Terms of Service and Privacy Policy.");
    }
    setBusy(true);
    try {
      const result = await sendPublic("/auth/send-otp", "POST", { phone: form.fullPhone, purpose: "registration" });
      setForm((curr) => ({ ...curr, fullPhone: result.phone, otp: Array(6).fill("") }));
      setSuccess(result.message);
      setTimer(30);
      setView("otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Action: Screen 7 (Simple Login - Backend determines role)
  async function handleLoginSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    await requestPhoneOrEmailLogin();
  }

  async function requestPhoneOrEmailLogin() {
    const id = loginForm.identifier.trim();
    if (!id) {
      return setError(loginForm.method === "email" ? "Please enter your email address." : "Please enter your mobile number.");
    }
    setBusy(true);
    try {
      if (loginForm.method !== "email") {
        const phone = normalizeLoginPhone(id);
        if (!validOtpPhone(phone)) return setError("Enter a valid UAE or India mobile number, for example +971501234567 or +919618810386.");
        const result = await sendPublic("/auth/login/send-otp", "POST", { phone });
        setLoginForm((curr) => ({ ...curr, verifiedPhone: result.phone, otp: "" }));
        setSuccess(result.message);
        setTimer(30);
        setView("loginOtp");
        return;
      }
      if (!loginForm.password) {
        return setError("Please enter your password.");
      }
      const payload = { email: id, password: loginForm.password };

      const res = await sendPublic("/auth/login", "POST", payload);
      if (res.token) {
        if (res.user.role === "SUPER_ADMIN") {
          setError("Administrator login has moved to /admin/login.");
          return;
        }
        localStorage.setItem("wefyx-token", res.token);
        localStorage.setItem("wefyx-auth", "true");
        localStorage.setItem("wefyx-user", JSON.stringify(res.user));
        localStorage.setItem("wefyx-account-type", (res.user.role || "customer").toLowerCase());
        const returnTo = new URLSearchParams(window.location.search).get("returnTo");
        const customerDestination = returnTo && /^\/(account|cart|shop|rent|services|book-support|my-tickets)(\/|\?|$)/.test(returnTo) && !returnTo.includes("\\") ? returnTo : "/account";
        window.location.assign(res.user.role === "CUSTOMER" ? customerDestination : "/admin/login");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Please check your email/mobile and password.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePhoneLoginVerify(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await sendPublic("/auth/login/verify", "POST", {
        phone: loginForm.verifiedPhone,
        otp: loginForm.otp,
      });
      if (res.token) {
        if (res.user.role === "SUPER_ADMIN") {
          setError("Administrator login has moved to /admin/login.");
          return;
        }
        localStorage.setItem("wefyx-token", res.token);
        localStorage.setItem("wefyx-auth", "true");
        localStorage.setItem("wefyx-user", JSON.stringify(res.user));
        localStorage.setItem("wefyx-account-type", (res.user.role || "customer").toLowerCase());
        const returnTo = new URLSearchParams(window.location.search).get("returnTo");
        const customerDestination = returnTo && /^\/(account|cart|shop|rent|services|book-support|my-tickets)(\/|\?|$)/.test(returnTo) && !returnTo.includes("\\") ? returnTo : "/account";
        window.location.assign(res.user.role === "CUSTOMER" ? customerDestination : "/admin/login");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP. Please check and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Action: Screen 8 (Forgot Password)
  async function handleForgotSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!forgotPhone.trim()) return setError("Please enter your mobile number.");
    setBusy(true);
    try {
      if (forgotStep === 0) {
        const full = forgotPhone.startsWith("+") ? forgotPhone : `${forgotDialCode}${forgotPhone.replace(/^0/, "")}`;
        const result = await sendPublic("/auth/send-otp", "POST", { phone: full });
        setForgotPhone(result.phone);
        setForgotOtp("");
        setForgotStep(1);
        setSuccess(result.message + " Enter the code and your new password below.");
      } else {
        await sendPublic("/auth/reset-password", "POST", {
          phone: forgotPhone,
          password: newPassword,
          otp: forgotOtp,
        });
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          setView("login");
          setForgotStep(0);
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wf-auth-app">
      <BrandHeader />

      <main className="wf-auth-body">
        {/* ======================================================== */}
        {/* SCREEN 1: SIGN UP (JOIN WEFYX)                           */}
        {/* ======================================================== */}
        {view === "signup" && (
          <div className="wf-auth-wrapper wf-auth-split wf-signup-reference">
            <section className="wf-brand-side">
              <div className="wf-brand-intro">
                <h1 className="wf-brand-title">
                  Join Wefy<span>x</span>
                </h1>
                <p className="wf-brand-subtitle">
                  Create your account and get started with smart IT support and asset services for your business.
                </p>

                <ul className="wf-benefits-list">
                  <li className="wf-benefit-item">
                    <span className="wf-benefit-icon">
                      <ShieldCheck size={20} strokeWidth={2.4} />
                    </span>
                    <div className="wf-benefit-text">
                      <b>Quick Registration</b>
                      <small>Get started in minutes</small>
                    </div>
                  </li>
                  <li className="wf-benefit-item">
                    <span className="wf-benefit-icon">
                      <CheckCircle2 size={20} strokeWidth={2.4} />
                    </span>
                    <div className="wf-benefit-text">
                      <b>Secure &amp; Verified</b>
                      <small>OTP verification</small>
                    </div>
                  </li>
                  <li className="wf-benefit-item">
                    <span className="wf-benefit-icon">
                      <Briefcase size={20} strokeWidth={2.4} />
                    </span>
                    <div className="wf-benefit-text">
                      <b>Access All Services</b>
                      <small>Support, AMC, Asset Rental and more</small>
                    </div>
                  </li>
                  <li className="wf-benefit-item">
                    <span className="wf-benefit-icon">
                      <Headphones size={20} strokeWidth={2.4} />
                    </span>
                    <div className="wf-benefit-text">
                      <b>Dedicated Support</b>
                      <small>We are always here for you</small>
                    </div>
                  </li>
                </ul>

              </div>

              <p className="wf-skyline-slogan">
                Smarter IT<br />
                for a Better<br />
                Tomorrow
              </p>
            </section>

            <section className="wf-auth-card">
              <div className="wf-tab-bar">
                <button type="button" className="wf-tab-btn active">
                  Sign Up
                </button>
                <button type="button" onClick={() => setView("login")} className="wf-tab-btn">
                  Login
                </button>
              </div>

              <div className="wf-social-group">
                <button type="button" className="wf-social-btn">
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
                <button type="button" className="wf-social-btn">
                  <MicrosoftIcon />
                  <span>Continue with Microsoft</span>
                </button>
              </div>

              <div className="wf-divider">OR</div>

              <form onSubmit={handleSendOtp}>
                <div className="wf-form-group">
                  <label className="wf-form-label">
                    Mobile Number<i>*</i>
                  </label>
                    <div className="wf-phone-wrapper">
                      <div className="wf-flag-badge">
                      <select aria-label="Mobile country code" value={form.dialCode} onChange={update("dialCode")}>{phoneCountryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                      placeholder="Mobile number"
                      required
                    />
                  </div>
                  <span className="wf-helper">We&apos;ll send you a 6-digit OTP to verify your number.</span>
                </div>

                <div className="wf-form-group">
                  <label className="wf-form-label" htmlFor="registration-password">Password<i>*</i></label>
                  <div className="wf-input-with-icon">
                    <span className="wf-input-icon"><Lock size={17} /></span>
                    <input id="registration-password" type={showPassword ? "text" : "password"}
                      autoComplete="new-password" value={form.password} onChange={update("password")}
                      placeholder="Create a password" minLength={8} maxLength={72} required />
                    <button type="button" className="wf-input-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <span className="wf-helper">Use at least 8 characters. You will use this password to log in.</span>
                </div>

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}

                <button type="submit" disabled={busy} className="wf-primary-btn">
                  Continue <ArrowRight size={17} />
                </button>

                <p className="wf-terms-text">
                  By continuing, you agree to our <a href="/privacy-policy">Terms of Service</a> and{" "}
                  <a href="/privacy-policy">Privacy Policy</a>.
                </p>

                <div className="wf-footer-link">
                  Already have an account? <button type="button" onClick={() => setView("login")}>Login</button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: VERIFY OTP                                     */}
        {/* ======================================================== */}
        {view === "otp" && (
          <div className="wf-auth-wrapper wf-auth-narrow">
            <section className="wf-auth-card wf-otp-box">
              <OnboardingStepper current={3} />

              <div className="wf-otp-phone-card">
                <Smartphone size={36} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Verify Your Mobile Number</h2>
              <p className="mt-1 text-sm text-slate-500">
                {success || "Enter the 6-digit OTP for"} <strong>{form.fullPhone}</strong>{" "}
                <button type="button" onClick={() => setView("signup")} className="text-emerald-600 font-semibold underline">
                  Edit ✎
                </button>
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div className="wf-otp-inputs" onPaste={handleOtpPaste}>
                  {form.otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputsRef.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="wf-otp-digit"
                      aria-label={`Digit ${index + 1}`}
                      required
                    />
                  ))}
                </div>

                <div className="wf-resend-timer">
                  {timer > 0 ? (
                    <>
                      Didn&apos;t receive the code? <strong>Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}</strong>
                    </>
                  ) : (
                    <button type="button" onClick={handleSendOtp} disabled={busy} className="wf-resend-btn">
                      Resend OTP now
                    </button>
                  )}
                </div>

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}

                <button type="submit" disabled={busy} className="wf-primary-btn">
                  {busy ? "Creating Account…" : "Verify & Create Account"} <ArrowRight size={17} />
                </button>

                <div>
                  <button type="button" onClick={() => setView("review")} className="wf-back-link">
                    <ArrowLeft size={16} /> Back
                  </button>
                </div>

                <div className="wf-trust-badge">
                  <ShieldCheck size={18} />
                  <span>Your information is secure with us.</span>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: BUSINESS DETAILS                               */}
        {/* ======================================================== */}
        {view === "business" && (
          <div className="wf-auth-wrapper wf-auth-wide">
            <section className="wf-auth-card">
              <OnboardingStepper current={1} />

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Tell Us About Your Business</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Please provide your company details. Your mobile number will be verified before the account is created.
                </p>
              </div>

              <form onSubmit={handleBusinessSubmit}>
                <div className="wf-grid-2">
                  <div className="wf-form-group">
                    <label className="wf-form-label">
                      Company Name<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Building2 size={17} />
                      </span>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={update("companyName")}
                        placeholder="Acme Trading LLC"
                        required
                      />
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">
                      Trade License Number <span className="opt">(Optional)</span>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Package size={17} />
                      </span>
                      <input
                        type="text"
                        value={form.tradeLicense}
                        onChange={update("tradeLicense")}
                        placeholder="1234567"
                      />
                    </div>
                  </div>

                  <div className="wf-form-group wf-grid-full">
                    <label className="wf-form-label">
                      Industry<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Briefcase size={17} />
                      </span>
                      <select value={form.industry} onChange={update("industry")} required>
                        <option>Trading &amp; Distribution</option>
                        <option>Information Technology</option>
                        <option>Healthcare &amp; Clinics</option>
                        <option>Finance &amp; Banking</option>
                        <option>Construction &amp; Real Estate</option>
                        <option>Hospitality &amp; F&amp;B</option>
                        <option>Retail &amp; E-commerce</option>
                        <option>Other Services</option>
                      </select>
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">
                      Company Email<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Mail size={17} />
                      </span>
                      <input
                        type="email"
                        value={form.companyEmail}
                        onChange={update("companyEmail")}
                        placeholder="info@acmeuae.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">
                      Contact Person<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <User size={17} />
                      </span>
                      <input
                        type="text"
                        value={form.contactPerson}
                        onChange={update("contactPerson")}
                        placeholder="Ahmed Khan"
                        required
                      />
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">Job Title</label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Briefcase size={17} />
                      </span>
                      <input
                        type="text"
                        value={form.jobTitle}
                        onChange={update("jobTitle")}
                        placeholder="IT Manager"
                      />
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">Company Website</label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Globe size={17} />
                      </span>
                      <input
                        type="text"
                        value={form.website}
                        onChange={update("website")}
                        placeholder="www.acmeuae.com"
                      />
                    </div>
                  </div>
                </div>

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}

                <button type="submit" className="wf-primary-btn mt-2">
                  Next: Address Details <ArrowRight size={17} />
                </button>

                <div>
                  <button type="button" onClick={() => setView("signup")} className="wf-back-link">
                    <ArrowLeft size={16} /> Back
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: COMPANY ADDRESS                                */}
        {/* ======================================================== */}
        {view === "address" && (
          <div className="wf-auth-wrapper wf-auth-wide">
            <section className="wf-auth-card">
              <OnboardingStepper current={2} />

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Company Address</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Where should we provide support?
                </p>
              </div>

              <form onSubmit={handleAddressSubmit}>
                <div className="wf-grid-2">
                  <div className="wf-form-group">
                    <label className="wf-form-label">
                      Country<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <UaeFlag width={18} height={12} />
                      </span>
                      <select value={form.country} onChange={update("country")} required>
                        <option>United Arab Emirates</option>
                        <option>Saudi Arabia</option>
                        <option>Qatar</option>
                        <option>Oman</option>
                        <option>Bahrain</option>
                        <option>Kuwait</option>
                      </select>
                    </div>
                  </div>

                  <div className="wf-form-group">
                    <label className="wf-form-label">
                      Emirate<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <MapPin size={17} />
                      </span>
                      <select value={form.emirate} onChange={update("emirate")} required>
                        <option>Dubai</option>
                        <option>Abu Dhabi</option>
                        <option>Sharjah</option>
                        <option>Ajman</option>
                        <option>Ras Al Khaimah</option>
                        <option>Fujairah</option>
                        <option>Umm Al Quwain</option>
                      </select>
                    </div>
                  </div>

                  <div className="wf-form-group wf-grid-full">
                    <label className="wf-form-label">
                      Address<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <MapPin size={17} />
                      </span>
                      <input
                        type="text"
                        value={form.address}
                        onChange={update("address")}
                        placeholder="Office 1204, Business Bay, Dubai, UAE"
                        required
                      />
                    </div>
                  </div>

                  <div className="wf-form-group wf-grid-full">
                    <label className="wf-form-label">Additional Information (Optional)</label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Building2 size={17} />
                      </span>
                      <input
                        type="text"
                        value={form.additionalInfo}
                        onChange={update("additionalInfo")}
                        placeholder="Landmark, Building Name, Floor, etc."
                      />
                    </div>
                  </div>

                  <div className="wf-form-group wf-grid-full">
                    <label className="wf-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.serviceVisitsSame}
                        onChange={update("serviceVisitsSame")}
                      />
                      <span>Use this address for service visits</span>
                    </label>

                    <label className="wf-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.billingAddressSame}
                        onChange={update("billingAddressSame")}
                      />
                      <span>Billing address is the same</span>
                    </label>
                  </div>
                </div>

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}

                <button type="submit" className="wf-primary-btn mt-2">
                  Next: Review Details <ArrowRight size={17} />
                </button>

                <div>
                  <button type="button" onClick={() => setView("business")} className="wf-back-link">
                    <ArrowLeft size={16} /> Back
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 5: REVIEW & COMPLETE                              */}
        {/* ======================================================== */}
        {view === "review" && (
          <div className="wf-auth-wrapper wf-auth-wide">
            <section className="wf-auth-card">
              <OnboardingStepper current={3} />

              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Review &amp; Complete</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Please review your information. We will verify your mobile number before creating the account.
                </p>
              </div>

              <div className="wf-review-grid">
                <div className="wf-review-card">
                  <div className="wf-review-card-top">
                    <h4>Company Details</h4>
                    <button type="button" onClick={() => setView("business")} className="wf-edit-btn">
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>
                  <dl className="wf-review-rows">
                    <dt>Company Name</dt>
                    <dd>{form.companyName}</dd>
                    <dt>Trade License</dt>
                    <dd>{form.tradeLicense || "—"}</dd>
                    <dt>Industry</dt>
                    <dd>{form.industry}</dd>
                    <dt>Company Email</dt>
                    <dd>{form.companyEmail}</dd>
                    <dt>Contact Person</dt>
                    <dd>{form.contactPerson}</dd>
                    <dt>Job Title</dt>
                    <dd>{form.jobTitle || "—"}</dd>
                    <dt>Website</dt>
                    <dd>{form.website || "—"}</dd>
                  </dl>
                </div>

                <div className="wf-review-card">
                  <div className="wf-review-card-top">
                    <h4>Address &amp; Access</h4>
                    <button type="button" onClick={() => setView("address")} className="wf-edit-btn">
                      <Edit2 size={13} /> Edit Address
                    </button>
                  </div>
                  <dl className="wf-review-rows">
                    <dt>Address</dt>
                    <dd>{form.address}</dd>
                    <dt>Emirate</dt>
                    <dd>{form.emirate}</dd>
                    <dt>Country</dt>
                    <dd>{form.country}</dd>

                    <dt className="wf-review-subhead">Account Access</dt>
                    <dd className="wf-review-subhead">
                      <button type="button" onClick={() => setView("signup")} className="wf-edit-btn">
                        <Edit2 size={13} /> Edit Phone
                      </button>
                    </dd>
                    <dt>Mobile Number</dt>
                    <dd>{form.fullPhone || normalizeSignupPhone()}</dd>
                    <dt>Assigned Role</dt>
                    <dd className="text-emerald-700 font-bold">Customer (Default)</dd>
                  </dl>
                </div>
              </div>

              <form onSubmit={handleCreateAccount}>
                <div className="wf-form-group">
                  <label className="wf-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.termsConsent}
                      onChange={update("termsConsent")}
                      required
                    />
                    <span>
                      I agree to the <a href="/privacy-policy" className="font-semibold underline">Terms of Service</a> and{" "}
                      <a href="/privacy-policy" className="font-semibold underline">Privacy Policy</a>
                    </span>
                  </label>
                </div>

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}

                <button type="submit" disabled={busy} className="wf-primary-btn">
                  {busy ? "Sending OTP…" : "Verify Mobile & Create Account"} <ArrowRight size={17} />
                </button>

                <div>
                  <button type="button" onClick={() => setView("address")} className="wf-back-link">
                    <ArrowLeft size={16} /> Back
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 6: WELCOME TO WEFYX!                              */}
        {/* ======================================================== */}
        {view === "success" && (
          <div className="wf-auth-wrapper wf-auth-narrow">
            <section className="wf-auth-card wf-success-view">
              <div className="wf-burst-icon">
                <Check size={48} strokeWidth={3} />
              </div>

              <h2 className="wf-success-title">Welcome to Wefyx!</h2>
              <p className="wf-success-lead">Your account has been created successfully.</p>
              <p className="wf-success-desc">
                You can now access all our services, raise support tickets, book on-site support, explore asset rentals and more.
              </p>

              <button
                type="button"
                onClick={() => window.location.assign("/account")}
                className="wf-primary-btn"
              >
                Go to Dashboard <ArrowRight size={17} />
              </button>

              <div className="wf-whats-next-box">
                <h4>What&apos;s Next?</h4>
                <div className="wf-whats-next-grid">
                  <a href="/account/tickets" className="wf-next-item">
                    <CheckCircle2 size={16} />
                    <span>Raise a support ticket</span>
                  </a>
                  <a href="/rent" className="wf-next-item">
                    <CheckCircle2 size={16} />
                    <span>Explore IT asset rental</span>
                  </a>
                  <a href="/amc" className="wf-next-item">
                    <CheckCircle2 size={16} />
                    <span>Manage AMC contracts</span>
                  </a>
                  <a href="/contact" className="wf-next-item">
                    <CheckCircle2 size={16} />
                    <span>Get expert support anytime</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 7: WELCOME BACK (CLEAN SIMPLE LOGIN)              */}
        {/* ======================================================== */}
        {view === "login" && (
          <div className="wf-auth-wrapper wf-auth-split wf-reference-login">
            <a href="/" className="wf-reference-logo" aria-label="Wefyx home">Wefy<span>x</span></a>
            <section className="wf-auth-card">

              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Login to your Wefyx account
                </p>
              </div>

              <div className="wf-social-group">
                <button type="button" className="wf-social-btn">
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
                <button type="button" className="wf-social-btn">
                  <MicrosoftIcon />
                  <span>Continue with Microsoft</span>
                </button>
              </div>

              <div className="wf-divider">OR</div>

              <form onSubmit={handleLoginSubmit}>
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-emerald-50 p-1">
                  <button
                    type="button"
                    onClick={() => setLoginForm((curr) => ({ ...curr, method: "phone", identifier: "", password: "" }))}
                    className={`h-10 rounded-lg text-xs font-bold transition ${loginForm.method !== "email" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`}
                  >
                    Mobile Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm((curr) => ({ ...curr, method: "email", identifier: "", password: "" }))}
                    className={`h-10 rounded-lg text-xs font-bold transition ${loginForm.method === "email" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`}
                  >
                    Email
                  </button>
                </div>
                <div className="wf-form-group">
                  <label className="wf-form-label" htmlFor="login-id">
                    {loginForm.method === "email" ? "Email Address" : "Mobile Number"}
                  </label>
                  {loginForm.method !== "email" ? (
                    <div className="wf-phone-wrapper">
                      <div className="wf-flag-badge">
                        <select
                          aria-label="Login country code"
                          value={loginForm.dialCode}
                          onChange={(e) => setLoginForm({ ...loginForm, dialCode: e.target.value })}
                        >
                          {phoneCountryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                        </select>
                      </div>
                      <input
                        id="login-id"
                        type="tel"
                        inputMode="tel"
                        value={loginForm.identifier}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, identifier: e.target.value })
                        }
                        placeholder="50 123 4567"
                        required
                      />
                    </div>
                  ) : (
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Mail size={17} />
                      </span>
                      <input
                        id="login-id"
                        type="email"
                        value={loginForm.identifier}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, identifier: e.target.value })
                        }
                        placeholder="you@company.com"
                        required
                      />
                    </div>
                  )}
                  <span className="wf-helper">
                    {loginForm.method !== "email"
                      ? "We'll send an OTP to this mobile number. No password needed."
                      : "Email login uses your password."}
                  </span>
                </div>

                {loginForm.method === "email" ? <div className="wf-form-group">
                  <div className="flex items-center justify-between">
                    <label className="wf-form-label" htmlFor="login-pass">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="wf-forgot-link-inline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="wf-input-with-icon">
                    <span className="wf-input-icon">
                      <Lock size={17} />
                    </span>
                    <input
                      id="login-pass"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="wf-input-toggle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div> : null}

                <div className="wf-remember-row">
                  <label className="wf-checkbox-label">
                    <input
                      type="checkbox"
                      checked={loginForm.rememberMe}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, rememberMe: e.target.checked })
                      }
                    />
                    <span>Remember me</span>
                  </label>

                  <span className="wf-secure-login-badge">
                    <ShieldCheck size={14} /> Secure login
                  </span>
                </div>

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}

                <button type="submit" disabled={busy} className="wf-primary-btn">
                  {busy ? "Logging In…" : "Login"} <ArrowRight size={17} />
                </button>

                <div className="wf-footer-link">
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => setView("signup")}>
                    Sign Up
                  </button>
                </div>
              </form>
            </section>

            {/* Right Side: Engineer Hero with Branding */}
            <section className="wf-login-side">
              <img
                src="/images/home-support-hero.png"
                alt="Wefyx IT Engineer Support"
                className="wf-login-hero-img"
              />
              <div className="wf-login-quote">
                Same Support.<br />Greater Possibilities.
              </div>

              <div className="wf-login-trust-bar">
                <span>
                  <ShieldCheck size={15} /> Secure
                </span>
                <span>
                  <Shield size={15} /> Reliable
                </span>
                <span>
                  <Zap size={15} /> Always On
                </span>
              </div>
            </section>
          </div>
        )}

        {view === "loginOtp" && (
          <div className="wf-auth-wrapper wf-auth-narrow">
            <section className="wf-auth-card wf-otp-box">
              <OnboardingStepper
                current={1}
                steps={[
                  { id: "login", label: "Sign In" },
                  { id: "verify", label: "Verify" },
                ]}
              />

              <div className="wf-otp-phone-card">
                <Smartphone size={36} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Verify Your Mobile Number</h2>
              <p className="mt-1 text-sm text-slate-500">
                {success || "Enter the 6-digit OTP for"} <strong>{loginForm.verifiedPhone}</strong>{" "}
                <button type="button" onClick={() => setView("login")} className="text-emerald-600 font-semibold underline">
                  Edit
                </button>
              </p>

              <form onSubmit={handlePhoneLoginVerify}>
                <div className="wf-otp-inputs" onPaste={handleLoginOtpPaste}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <input
                      key={index}
                      ref={(element) => (loginOtpInputsRef.current[index] = element)}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      required
                      value={loginForm.otp[index] || ""}
                      onChange={(event) => handleLoginOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleLoginOtpKeyDown(index, event)}
                      className="wf-otp-digit"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="wf-resend-timer">
                  {timer > 0 ? (
                    <>
                      Didn&apos;t receive the code? <strong>Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}</strong>
                    </>
                  ) : (
                    <button type="button" onClick={requestPhoneOrEmailLogin} disabled={busy} className="wf-resend-btn">
                      Resend OTP now
                    </button>
                  )}
                </div>

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}

                <button type="submit" disabled={busy} className="wf-primary-btn">
                  {busy ? "Verifying…" : "Verify & Login"} <ArrowRight size={17} />
                </button>

                <div>
                  <button type="button" onClick={() => setView("login")} className="wf-back-link">
                    <ArrowLeft size={16} /> Back to Login
                  </button>
                </div>

                <div className="wf-trust-badge">
                  <ShieldCheck size={18} />
                  <span>Your information is secure with us.</span>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 8: FORGOT PASSWORD                                */}
        {/* ======================================================== */}
        {view === "forgot" && (
          <div className="wf-auth-wrapper wf-auth-narrow">
            <section className="wf-auth-card text-center">
              <div className="wf-otp-phone-card">
                <KeyRound size={34} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Forgot Password?</h2>
              <p className="mt-1 text-sm text-slate-500">
                {forgotStep === 0
                  ? "Enter your mobile number and we'll send you an OTP to reset your password."
                  : "Enter your new password to reset your account credentials."}
              </p>

              <form onSubmit={handleForgotSubmit} className="mt-6 text-left">
                {forgotStep === 0 ? (
                  <div className="wf-form-group">
                    <label className="wf-form-label">
                      Mobile Number<i>*</i>
                    </label>
                    <div className="wf-phone-wrapper">
                      <div className="wf-flag-badge">
                        <select aria-label="Recovery country code" value={forgotDialCode} onChange={(e) => setForgotDialCode(e.target.value)}>{phoneCountryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
                      </div>
                      <input
                        type="tel"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        placeholder="Mobile number"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="wf-form-group">
                    <label className="wf-form-label">SMS verification code</label>
                    <input aria-label="SMS verification code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))} />
                    <label className="wf-form-label">
                      New Password<i>*</i>
                    </label>
                    <div className="wf-input-with-icon">
                      <span className="wf-input-icon">
                        <Lock size={17} />
                      </span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                )}

                {error && <div role="alert" className="wf-alert wf-alert-error">{error}</div>}
                {success && <div className="wf-alert wf-alert-success">{success}</div>}

                <button type="submit" disabled={busy} className="wf-primary-btn mt-2">
                  {busy ? "Processing…" : forgotStep === 0 ? "Send OTP" : "Reset Password"} <ArrowRight size={17} />
                </button>

                <div className="text-center">
                  <button type="button" onClick={() => setView("login")} className="wf-back-link">
                    <ArrowLeft size={16} /> Back to Login
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export function CareersPage() {
  return <PublicRegistration initialView="signup" />;
}

export function VendorRegistrationPage() {
  return <PublicRegistration initialView="signup" />;
}
