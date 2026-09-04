"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UserCog,
  HardHat,
  Crown,
} from "lucide-react";
import { useRouter } from "next/navigation";

type UserRole = "field_engineer" | "project_manager" | "admin";

type DemoUser = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "engineer@fieldsync.com",
    password: "engineer123",
    role: "field_engineer",
    name: "Field Engineer",
  },
  {
    email: "manager@fieldsync.com",
    password: "manager123",
    role: "project_manager",
    name: "Project Manager",
  },
  {
    email: "admin@fieldsync.com",
    password: "admin123",
    role: "admin",
    name: "System Admin",
  },
];

export default function Home() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your Employee ID / Email and password.");
      return;
    }

    const user = DEMO_USERS.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password
    );

    if (!user) {
      setError("Invalid Employee ID / Email or password.");
      return;
    }

    setLoading(true);

    // Store demo session
    localStorage.setItem(
      "fieldsync_user",
      JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role,
      })
    );

    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  const fillDemoAccount = (user: DemoUser) => {
    setEmail(user.email);
    setPassword(user.password);
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#F7F4F2] lg:flex">
      {/* ================= LEFT BRANDING ================= */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#102A2A] lg:flex lg:w-[52%] xl:w-[54%]">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/[0.06]" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/[0.05]" />

        <div className="relative z-10 flex w-full flex-col justify-center px-10 py-12 xl:px-20">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3 xl:mb-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#68364B] text-sm font-extrabold text-white shadow-lg shadow-black/20">
              FS
            </div>

            <div className="text-2xl font-bold tracking-tight text-white">
              Field<span className="text-[#C47A44]">Sync</span>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold tracking-[1.2px] text-[#C47A44]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C47A44]" />
              INFRASTRUCTURE MANAGEMENT
            </div>

            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
              Intelligent Infrastructure
              <span className="mt-1 block text-[#C47A44]">
                Progress Tracking
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-[#AAB5B2]">
              Capture real-time field progress, connect it with project
              schedules, and keep your infrastructure projects on track.
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 max-w-lg space-y-4 xl:mt-10 xl:space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#68364B] text-white">
                <Check size={17} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Real-Time Progress
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#81908D]">
                  Track planned vs actual project progress.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#68364B] text-white">
                <Check size={17} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Smart Field Capture
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#81908D]">
                  Structured field data with photo and GPS proof.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#68364B] text-white">
                <Check size={17} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  AI-Assisted Verification
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#81908D]">
                  Review field evidence with AI-assisted analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-10 flex items-center gap-2 text-[10px] text-[#657571] xl:mt-12">
            <ShieldCheck size={14} />
            Secure access for authorized project personnel
          </div>
        </div>
      </section>

      {/* ================= RIGHT LOGIN ================= */}
      <section className="flex min-h-screen w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8 lg:px-10">
        <div className="w-full max-w-[440px]">
          {/* Mobile Logo */}
          <div className="mb-7 flex items-center justify-center gap-3 sm:mb-9 lg:hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#68364B] text-sm font-extrabold text-white shadow-md">
              FS
            </div>

            <div className="text-xl font-bold text-[#24302F]">
              Field<span className="text-[#C47A44]">Sync</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-[#e7e1dd] bg-white p-5 shadow-[0_15px_50px_rgba(36,48,47,0.07)] sm:p-7 md:p-9">
            {/* Heading */}
            <div className="mb-7 sm:mb-8">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f1f3] text-[#68364B]">
                <LockKeyhole size={19} />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#24302F] sm:text-2xl">
                Welcome back
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#71807D] sm:text-sm">
                Sign in to your FieldSync account
              </p>
            </div>

            <form onSubmit={handleLogin}>
              {/* Employee ID / Email */}
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold text-[#43504E]"
                >
                  Employee ID / Email
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9491]"
                  />

                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your employee ID or email"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-[#ddd7d3] bg-white pl-11 pr-4 text-sm text-[#24302F] outline-none transition placeholder:text-[#a3aaa8] focus:border-[#68364B] focus:ring-4 focus:ring-[#68364B]/10 disabled:cursor-not-allowed disabled:bg-[#f7f5f3]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold text-[#43504E]"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9491]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-[#ddd7d3] bg-white pl-11 pr-14 text-sm text-[#24302F] outline-none transition placeholder:text-[#a3aaa8] focus:border-[#68364B] focus:ring-4 focus:ring-[#68364B]/10 disabled:cursor-not-allowed disabled:bg-[#f7f5f3]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#7b8582] transition hover:text-[#68364B] disabled:cursor-not-allowed"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Options */}
              <div className="mb-7 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#71807D]">
                  <input
                    type="checkbox"
                    disabled={loading}
                    className="h-4 w-4 rounded border-[#d4cfcb] accent-[#68364B]"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  disabled={loading}
                  className="self-start text-xs font-semibold text-[#68364B] transition hover:text-[#C47A44] min-[380px]:self-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#68364B] text-sm font-semibold text-white shadow-lg shadow-[#68364B]/20 transition hover:bg-[#592d40] hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-5 rounded-xl border border-[#eee9e6] bg-[#faf8f7] p-4">
              <p className="text-center text-[10px] font-bold uppercase tracking-wide text-[#68364B]">
                Demo Accounts
              </p>

              <div className="mt-3 space-y-2">
                {/* Engineer */}
                <button
                  type="button"
                  onClick={() => fillDemoAccount(DEMO_USERS[0])}
                  disabled={loading}
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-white px-3 py-2.5 text-left transition hover:border-[#ddd7d3] hover:bg-[#f7f4f2] disabled:cursor-not-allowed"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ef] text-[#2f7d4a]">
                    <HardHat size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#24302F]">
                      Field Engineer
                    </p>
                    <p className="truncate text-[9px] text-[#8a9390]">
                      engineer@fieldsync.com
                    </p>
                  </div>
                </button>

                {/* Manager */}
                <button
                  type="button"
                  onClick={() => fillDemoAccount(DEMO_USERS[1])}
                  disabled={loading}
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-white px-3 py-2.5 text-left transition hover:border-[#ddd7d3] hover:bg-[#f7f4f2] disabled:cursor-not-allowed"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f7f1f3] text-[#68364B]">
                    <UserCog size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#24302F]">
                      Project Manager
                    </p>
                    <p className="truncate text-[9px] text-[#8a9390]">
                      manager@fieldsync.com
                    </p>
                  </div>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => fillDemoAccount(DEMO_USERS[2])}
                  disabled={loading}
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-white px-3 py-2.5 text-left transition hover:border-[#ddd7d3] hover:bg-[#f7f4f2] disabled:cursor-not-allowed"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fbf3e9] text-[#C47A44]">
                    <Crown size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#24302F]">
                      System Admin
                    </p>
                    <p className="truncate text-[9px] text-[#8a9390]">
                      admin@fieldsync.com
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Security */}
            <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#eee9e6] pt-5 text-center text-[10px] leading-4 text-[#8a9390] sm:mt-6 sm:pt-6">
              <ShieldCheck
                size={14}
                className="shrink-0 text-[#2f7d4a]"
              />

              <span>
                Secure access for authorized project personnel
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 px-2 text-center text-[9px] leading-5 text-[#9aa19f] sm:mt-6 sm:text-[10px]">
            <span className="font-semibold text-[#68364B]">
              FieldSync
            </span>

            <span className="mx-1.5 sm:mx-2">•</span>

            Infrastructure Progress Tracking Platform

            <span className="mx-1.5 sm:mx-2">•</span>

            v1.0
          </div>
        </div>
      </section>
    </main>
  );
}