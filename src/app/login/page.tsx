'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  User,
  Lock,
  Mail,
  Key,
  Zap,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Loader2,
  RotateCcw,
  UserPlus,
  LogIn,
} from 'lucide-react';

type RoleType = 'CITIZEN' | 'ADMIN';
type CitizenMode = 'LOGIN' | 'SIGNUP' | 'OTP_LOGIN';

export default function LoginPage() {
  const router = useRouter();

  // Primary Role toggle: CITIZEN vs ADMIN
  const [role, setRole] = useState<RoleType>('CITIZEN');

  // Citizen sub-mode: LOGIN (password) | SIGNUP (register + 1-time OTP) | OTP_LOGIN (passwordless)
  const [citizenMode, setCitizenMode] = useState<CitizenMode>('LOGIN');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // Signup Step: 1 = Details + Set Password, 2 = Verify Email OTP
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

  // OTP Login Step: 1 = Email, 2 = Verify OTP
  const [otpLoginStep, setOtpLoginStep] = useState<1 | 2>(1);

  // Admin Credentials
  const [adminEmail, setAdminEmail] = useState('admin@civicpulse.gov.in');
  const [adminPassword, setAdminPassword] = useState('');

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickFilled, setQuickFilled] = useState(false);
  const [resending, setResending] = useState(false);

  // Clear errors and notices on mode change
  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setError(null);
    setSuccessNotice(null);
    if (newRole === 'ADMIN' && !adminEmail) {
      setAdminEmail('admin@civicpulse.gov.in');
    }
  };

  const handleCitizenModeChange = (newMode: CitizenMode) => {
    setCitizenMode(newMode);
    setError(null);
    setSuccessNotice(null);
    setSignupStep(1);
    setOtpLoginStep(1);
    setOtp('');
    setDemoOtp(null);
  };

  // Quick fill helper for hackathon judges & demo
  const handleQuickFillAdmin = () => {
    setRole('ADMIN');
    setAdminEmail('admin@civicpulse.gov.in');
    setAdminPassword('ADMIN-2026');
    setError(null);
    setQuickFilled(true);
    setTimeout(() => setQuickFilled(false), 2500);
  };

  const handleQuickFillOtp = () => {
    setOtp(demoOtp || '123456');
    setError(null);
  };

  // ------------------------------------------------------------------
  // 1. Citizen Password Login (No OTP needed for subsequent visits)
  // ------------------------------------------------------------------
  const handleCitizenPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'LOGIN_CITIZEN',
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.authenticated) {
        setError(data.error || 'Invalid email or password. Please verify your credentials.');
        setLoading(false);
        return;
      }

      if (data.token) localStorage.setItem('civic_session_token', data.token);
      if (data.user) localStorage.setItem('civic_user', JSON.stringify(data.user));

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('[Auth] Citizen login error:', err);
      setError('Network error while connecting to authentication service.');
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 2. Citizen Sign Up - Step 1: Set Password & Dispatch OTP
  // ------------------------------------------------------------------
  const handleSignupSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please provide both your email and a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'SIGNUP_SEND_OTP',
          email: cleanEmail,
          password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to initiate signup. Please try again.');
        setLoading(false);
        return;
      }

      setDemoOtp(data.demoOtp || null);
      setSuccessNotice(`Verification code dispatched to ${cleanEmail}.`);
      setSignupStep(2);
      setLoading(false);
    } catch (err) {
      console.error('[Auth] Signup send OTP error:', err);
      setError('Network error while requesting verification code.');
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 3. Citizen Sign Up - Step 2: Verify OTP & Activate Account
  // ------------------------------------------------------------------
  const handleSignupVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'SIGNUP_VERIFY_OTP',
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.authenticated) {
        setError(data.error || 'Invalid or expired code. Please retry.');
        setLoading(false);
        return;
      }

      if (data.token) localStorage.setItem('civic_session_token', data.token);
      if (data.user) localStorage.setItem('civic_user', JSON.stringify(data.user));

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('[Auth] Signup verify error:', err);
      setError('Network error during account activation.');
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 4. Passwordless OTP Login (Step 1 & Step 2)
  // ------------------------------------------------------------------
  const handleOtpLoginSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'SEND_OTP',
          email: cleanEmail,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to dispatch code.');
        setLoading(false);
        return;
      }

      setDemoOtp(data.demoOtp || null);
      setSuccessNotice(`Verification code sent to ${cleanEmail}.`);
      setOtpLoginStep(2);
      setLoading(false);
    } catch {
      setError('Network error while requesting code.');
      setLoading(false);
    }
  };

  const handleOtpLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setError(data.error || 'Invalid or expired code.');
        setLoading(false);
        return;
      }

      if (data.token) localStorage.setItem('civic_session_token', data.token);
      if (data.user) localStorage.setItem('civic_user', JSON.stringify(data.user));

      router.push('/');
      router.refresh();
    } catch {
      setError('Network error during verification.');
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 5. Municipal Admin Direct Login
  // ------------------------------------------------------------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'LOGIN_ADMIN',
          email: adminEmail.trim(),
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.authenticated) {
        setError(data.error || 'Invalid Municipal Admin credentials.');
        setLoading(false);
        return;
      }

      if (data.token) localStorage.setItem('civic_session_token', data.token);
      if (data.user) localStorage.setItem('civic_user', JSON.stringify(data.user));

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('[Auth] Admin login error:', err);
      setError('Network error connecting to municipal authority service.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-neutral-900 selection:bg-neutral-900 selection:text-white relative">
      {/* Background Soft Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-neutral-200/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-neutral-200/40 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Back to Live Dashboard */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Live Dashboard</span>
        </Link>

        {/* Main Authentication Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-[0_12px_40px_rgb(0,0,0,0.06)] p-6 sm:p-8">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-950 flex items-center justify-center text-white shadow-sm ring-1 ring-black/10 mb-3">
              <span className="font-bold text-base tracking-tight">CP</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-950">
              CivicPulse
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Public Infrastructure & Autonomous Grievance Network
            </p>
          </div>

          {/* Segmented Role Switcher: CITIZEN vs ADMIN */}
          <div className="bg-neutral-100 p-1 rounded-xl flex items-center gap-1 mb-5 border border-neutral-200/70">
            <button
              type="button"
              onClick={() => handleRoleChange('CITIZEN')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'CITIZEN'
                  ? 'bg-white text-neutral-950 shadow-sm ring-1 ring-black/5'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen Access</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-neutral-950 text-white shadow-sm ring-1 ring-black/10'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Municipal Admin</span>
            </button>
          </div>

          {/* Citizen Sub-Navigation: Sign In vs Create Account */}
          {role === 'CITIZEN' && (
            <div className="flex items-center justify-center gap-2 mb-5 pb-3 border-b border-neutral-100 text-xs">
              <button
                type="button"
                onClick={() => handleCitizenModeChange('LOGIN')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  citizenMode === 'LOGIN'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleCitizenModeChange('SIGNUP')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  citizenMode === 'SIGNUP'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Role Informational Callout */}
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed mb-5 transition-colors ${
              role === 'ADMIN'
                ? 'bg-amber-50/80 border-amber-200/80 text-amber-900'
                : 'bg-neutral-50 border-neutral-200/70 text-neutral-600'
            }`}
          >
            {role === 'ADMIN' ? (
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Authorized municipal authority access required to dispatch work orders and resolve grievances.
                </span>
              </div>
            ) : citizenMode === 'SIGNUP' ? (
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                <span>
                  Set your password now. An OTP verification code is only needed once to verify your email, after which you can sign in directly with your password.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                <span>
                  Sign in with your email and password to submit reports, track live triage status, and upvote community infrastructure.
                </span>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{error}</span>
            </div>
          )}

          {/* Success / Notification Banner */}
          {successNotice && !error && (
            <div className="p-3 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <span>{successNotice}</span>
                {demoOtp && (
                  <span className="block mt-1 font-mono text-[11px] font-semibold text-emerald-900">
                    Demo Code: <span className="underline decoration-dotted">{demoOtp}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* FLOW A: CITIZEN DIRECT PASSWORD LOGIN                     */}
          {/* ========================================================= */}
          {role === 'CITIZEN' && citizenMode === 'LOGIN' && (
            <form onSubmit={handleCitizenPasswordLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    disabled={loading}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCitizenModeChange('OTP_LOGIN')}
                    className="text-[11px] text-neutral-500 hover:text-neutral-900 transition underline decoration-neutral-300"
                  >
                    Forgot / Login with OTP
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    disabled={loading}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as Citizen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-xs text-neutral-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleCitizenModeChange('SIGNUP')}
                  className="font-semibold text-neutral-950 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* FLOW B: CITIZEN SIGNUP (SET PASSWORD + 1-TIME OTP)        */}
          {/* ========================================================= */}
          {role === 'CITIZEN' && citizenMode === 'SIGNUP' && (
            <>
              {signupStep === 1 ? (
                /* Step 1: Name, Email & Set Password */
                <form onSubmit={handleSignupSendOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Aarav Sharma"
                        disabled={loading}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="citizen@example.com"
                        disabled={loading}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Create Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        disabled={loading}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        disabled={loading}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue & Send Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 text-xs text-neutral-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleCitizenModeChange('LOGIN')}
                      className="font-semibold text-neutral-950 hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: 6-Digit Verification Code for Sign Up */
                <form onSubmit={handleSignupVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-800">
                        6-Digit Verification Code
                      </label>
                      {demoOtp ? (
                        <button
                          type="button"
                          onClick={handleQuickFillOtp}
                          className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline decoration-amber-300 hover:decoration-amber-900 cursor-pointer"
                        >
                          Fill Demo ({demoOtp})
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered to inbox</span>
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        disabled={loading}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-center font-mono text-base font-bold tracking-[0.3em] text-neutral-900 placeholder:text-neutral-300 placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1.5 text-center">
                      Activation code sent to <span className="text-neutral-700 font-medium">{email}</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Activating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Activate Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupStep(1);
                        setError(null);
                        setSuccessNotice(null);
                      }}
                      className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Change Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSignupSendOtp}
                      disabled={resending || loading}
                      className="text-neutral-600 hover:text-neutral-950 font-medium flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                      <span>{resending ? 'Resending...' : 'Resend Code'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* FLOW C: CITIZEN PASSWORDLESS OTP LOGIN FALLBACK           */}
          {/* ========================================================= */}
          {role === 'CITIZEN' && citizenMode === 'OTP_LOGIN' && (
            <>
              {otpLoginStep === 1 ? (
                <form onSubmit={handleOtpLoginSend} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="citizen@example.com"
                        disabled={loading}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Login Passcode</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCitizenModeChange('LOGIN')}
                      className="text-neutral-600 hover:text-neutral-950 font-medium cursor-pointer"
                    >
                      ← Sign in with password instead
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleOtpLoginVerify} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-800">
                        6-Digit Passcode
                      </label>
                      {demoOtp && (
                        <button
                          type="button"
                          onClick={handleQuickFillOtp}
                          className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline decoration-amber-300 cursor-pointer"
                        >
                          Fill Demo ({demoOtp})
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        disabled={loading}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-center font-mono text-base font-bold tracking-[0.3em] text-neutral-900 placeholder:text-neutral-300 placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Enter Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpLoginStep(1)}
                      className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
                    >
                      ← Change Email
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* FLOW D: MUNICIPAL ADMIN DIRECT 1-STEP LOGIN               */}
          {/* ========================================================= */}
          {role === 'ADMIN' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@civicpulse.gov.in"
                    disabled={loading}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-800">
                    Admin Passkey / Password
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">Demo: ADMIN-2026</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter municipal passkey"
                    disabled={loading}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Hackathon Demo Quick-Fill Helper */}
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/90 text-amber-900 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>
                  {quickFilled ? '✓ Demo Credentials Applied!' : '⚡ Auto-Fill Demo Credentials (ADMIN-2026)'}
                </span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Authority Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock Authority Console →</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Cryptographic Seal */}
      <footer className="text-center text-[11px] text-neutral-400 mt-8 relative z-10">
        CivicPulse Autonomous Infrastructure Grievance Network &bull; Secured with HMAC-SHA256 &amp; Supabase Auth
      </footer>
    </div>
  );
}
